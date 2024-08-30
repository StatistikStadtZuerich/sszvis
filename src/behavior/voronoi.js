/**
 * Voronoi behavior
 *
 * The voronoi behavior adds an invisible layer of voronoi cells to a chart. The voronoi cells are calculated
 * based on the positions of the data objects which should be bound to the interaction layer before this behavior
 * is called on it. Each voronoi cell is associated with one data object, and this data object is passed to the event
 * callback functions.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The voronoi behavior expects to find an array of data already bound to the interaction layer. Each datum should
 * represent a point, and these points are used as the focal points of the construction of voronoi cells. These data
 * are also associated with the voronoi cells, so that when a user interacts with them, the datum and its index within the
 * bound data are passed to the callback functions. This component extends a d3.dispatch instance.
 *
 * The event handler functions are only called when the event happens within a certain distance
 * (see MAX_INTERACTION_RADIUS_SQUARED in this file) from the voronoi area's center.
 *
 * @module sszvis/behavior/voronoi
 *
 * @property {function} x                         Specify an accessor function for the x-position of the voronoi point
 * @property {function} y                         Specify an accessor function for the y-position of the voronoi point
 * @property {array[array, array]} bounds         Specify the bounds of the voronoi area. This is essential to the construction of voronoi cells
 *                                                using the d3.vornoi geom object. The bounds should determine the chart area over which you would like
 *                                                voronoi cells to be active. Note that if not specified, the voronoi cells will be very large.
 * @property {boolean} debug                      Whether the component is in debug mode. Being in debug mode renders the voroni cells obviously
 * @property {string and function} on             The .on() method should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'over' - when the user interacts with a voronoi area, either with a mouseover or touchstart
 *                                                'out' - when the user ceases to interact with a voronoi area, either with a mouseout or touchend
 *                                                All event handler functions are passed the datum which is the center of the voronoi area.
 *                                                Note: previously, event handlers were also passed the index of the datum within the dataset.
 *                                                However, this is no longer the case, due to the difficulty of inferring that information when hit
 *                                                testing a touch interaction on arbitrary rendered elements in the scene. In addition, the 'out' event
 *                                                used to be passed the datum itself, but this is no longer the case, also having to do with the impossibility
 *                                                of guaranteeing that there is a datum at the position of a touch, while "panning".
 *
 */

import { select, dispatch, Delaunay } from "d3";

import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { elementFromEvent, datumFromPannableElement } from "./util.js";
import { component } from "../d3-component.js";

export default function () {
  const event = dispatch("over", "out");

  const voronoiComponent = component()
    .prop("x")
    .prop("y")
    .prop("bounds")
    .prop("debug")
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      if (!props.bounds) {
        logger.error("behavior.voronoi - requires bounds");
        return false;
      }
      const delaunay = Delaunay.from(
        data,
        (d) => props.x(d),
        (d) => props.y(d)
      );
      const voronoi = delaunay.voronoi(props.bounds);

      let polys = selection
        .selectAll("[data-sszvis-behavior-voronoi]")
        .data(voronoi.cellPolygons());

      const newPolys = polys
        .enter()
        .append("path")
        .attr("data-sszvis-behavior-voronoi", "")
        .attr("data-sszvis-behavior-pannable", "")
        .attr("class", "sszvis-interactive");

      polys.exit().remove();
      polys = polys.merge(newPolys);

      polys
        .attr("d", (d) => "M" + d.join("L") + "Z")
        .attr("fill", "transparent")
        .on("mouseover", function (e) {
          const cbox = this.parentNode.getBoundingClientRect();
          const datumIdx = delaunay.find(e.clientX, e.clientY);
          if (
            eventNearPoint(e, [
              cbox.left + props.x(data[datumIdx]),
              cbox.top + props.y(data[datumIdx]),
            ])
          ) {
            event.apply("over", this, [e, data[datumIdx]]);
          }
        })
        .on("mousemove", function (e) {
          const cbox = this.parentNode.getBoundingClientRect();
          const datumIdx = delaunay.find(e.clientX, e.clientY);
          if (
            eventNearPoint(e, [
              cbox.left + props.x(data[datumIdx]),
              cbox.top + props.y(data[datumIdx]),
            ])
          ) {
            event.apply("over", this, [e, data[datumIdx]]);
          } else {
            event.apply("out", this, [e]);
          }
        })
        .on("mouseout", function (e) {
          event.apply("out", this, [e]);
        })
        .on("touchstart", function (e) {
          const cbox = this.parentNode.getBoundingClientRect();
          const datumIdx = delaunay.find(e.clientX, e.clientY);

          if (
            eventNearPoint(fn.firstTouch(e), [
              cbox.left + props.x(data[datumIdx]),
              cbox.top + props.y(data[datumIdx]),
            ])
          ) {
            e.preventDefault();
            event.apply("over", this, [e, data[datumIdx]]);

            // Attach these handlers only if the initial touch is within the max distance from the voronoi center
            // This prevents the situation where a touch is outside that distance, and causes scrolling, but then the
            // user moves their finger over the center of the voronoi area, and it fires an event anyway. Generally,
            // when users are performing touches that cause scrolling, we want to avoid firing the events.
            const pan = function () {
              const touchEvent = fn.firstTouch(e);
              const element = elementFromEvent(touchEvent);
              const panDatum = datumFromPannableElement(element);
              if (panDatum === null) {
                event.apply("out", this, [e]);
              } else {
                const panCbox = element.parentNode.getBoundingClientRect();
                if (
                  eventNearPoint(touchEvent, [
                    panCbox.left + props.x(panDatum.data),
                    panCbox.top + props.y(panDatum.data),
                  ])
                ) {
                  // This event won't be cancelable if you start touching outside the hit area of a voronoi center,
                  // then start scrolling, then move your finger over the hit area of a voronoi center. The browser
                  // says you are "still scrolling" and won't let you cancel the event. It will issue a warning, which
                  // we want to avoid.
                  if (e.cancelable) {
                    e.preventDefault();
                  }
                  event.apply("over", this, [e, panDatum.data]);
                } else {
                  event.apply("out", this, [e]);
                }
              }
            };

            const end = function () {
              event.apply("out", this, [e]);
              select(this).on("touchmove", null).on("touchend", null);
            };

            select(this).on("touchmove", pan).on("touchend", end);
          }
        });

      if (props.debug) {
        polys.attr("stroke", "#f00");
      }
    });

  voronoiComponent.on = function () {
    const value = event.on.apply(event, arguments);
    return value === event ? voronoiComponent : value;
  };

  return voronoiComponent;
}

// Perform distance calculations in units squared to avoid a costly Math.sqrt
const MAX_INTERACTION_RADIUS_SQUARED = Math.pow(15, 2);

function eventNearPoint(event, point) {
  const dx = event.clientX - point[0];
  const dy = event.clientY - point[1];
  return dx * dx + dy * dy < MAX_INTERACTION_RADIUS_SQUARED;
}
