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

import { Delaunay, dispatch, pointer, select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { elementFromEvent } from "./util.js";

// Type definitions for voronoi behavior component
export type VoronoiBounds = [number, number, number, number]; // [minX, minY, maxX, maxY]
type Accessor<T, R> = (datum: T) => R;
type NumberAccessor<T = unknown> = Accessor<T, number>;

type VoronoiProps<T = unknown> = {
  x: NumberAccessor<T>;
  y: NumberAccessor<T>;
  bounds: VoronoiBounds;
  debug?: boolean;
};

type VoronoiEventHandler<T = unknown> = (event: Event, datum?: T) => void;

interface VoronoiComponent<T = unknown> extends ComponentBuilder<VoronoiComponent<T>> {
  x(): NumberAccessor<T>;
  x(accessor: NumberAccessor<T>): VoronoiComponent<T>;

  y(): NumberAccessor<T>;
  y(accessor: NumberAccessor<T>): VoronoiComponent<T>;

  bounds(): VoronoiBounds;
  bounds(bounds: VoronoiBounds): VoronoiComponent<T>;

  debug(): boolean;
  debug(value: boolean): VoronoiComponent<T>;

  on(eventName: "over", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
  on(eventName: "out", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
  on(eventName: string): VoronoiEventHandler<T> | undefined;
}

export default function voronoi<T = unknown>(): VoronoiComponent<T> {
  const event = dispatch("over", "out");

  const voronoiComponent = component<VoronoiComponent<T>>()
    .prop("x")
    .prop("y")
    .prop("bounds")
    .prop("debug")
    .render(function (this: SVGPathElement, data: T[]) {
      const selection = select<SVGPathElement, T>(this);
      const props = selection.props<VoronoiProps<T>>();

      if (!props.bounds) {
        logger.error("behavior.voronoi - requires bounds");
        return;
      }
      const delaunay = Delaunay.from(
        data,
        (d) => props.x(d),
        (d) => props.y(d)
      );
      const voronoi = delaunay.voronoi(props.bounds);

      const polys = selection
        .selectAll<SVGPathElement, T>("[data-sszvis-behavior-voronoi]")
        .data(voronoi.cellPolygons())
        .join("path")
        .attr("data-sszvis-behavior-voronoi", "")
        .attr("data-sszvis-behavior-pannable", "")
        .attr("class", "sszvis-interactive");

      polys
        .attr("d", (d) => `M${d.join("L")}Z`)
        .attr("fill", "transparent")
        .on("mouseover", function (e) {
          const parent = this.parentNode as SVGElement | null;
          if (!parent) return;

          const position = pointer(e, parent);
          const datumIdx = delaunay.find(position[0], position[1]);
          if (nearPoint(position, [props.x(data[datumIdx]), props.y(data[datumIdx])]) && this)
            event.apply("over", this, [e, data[datumIdx]]);
        })
        .on("mousemove", function (e) {
          const parent = this.parentNode as SVGElement;
          if (!parent) return;

          const position = pointer(e, parent);
          const datumIdx = delaunay.find(position[0], position[1]);
          if (nearPoint(position, [props.x(data[datumIdx]), props.y(data[datumIdx])])) {
            if (this) event.apply("over", this, [e, data[datumIdx]]);
          } else {
            if (this) event.apply("out", this, [e]);
          }
        })
        .on("mouseout", function (...args) {
          if (this) event.apply("out", this, args);
        })
        .on("touchstart", function (e: TouchEvent) {
          const parent = this.parentNode as SVGElement;
          if (!parent) return;

          const firstTouch = fn.firstTouch(e);
          if (!firstTouch) return;

          const position = pointer(firstTouch, parent);
          const datumIdx = delaunay.find(position[0], position[1]);

          if (nearPoint(position, [props.x(data[datumIdx]), props.y(data[datumIdx])])) {
            e.preventDefault();
            if (this) event.apply("over", this, [e, data[datumIdx]]);
            const pan = (panEvent: TouchEvent) => {
              // Extract the touch from the new touchmove event, not the original touchstart event
              const touchEvent = fn.firstTouch(panEvent);
              if (!touchEvent) return;

              // Is the finger still over a cell of *this* layer? The shared
              // `data-sszvis-behavior-pannable` attribute cannot answer that - `behavior/panning`
              // writes it too, so any other pannable element in the chart would read as "still
              // here" - so test for a voronoi cell whose parent is this layer's own group.
              const panTarget = elementFromEvent(touchEvent);
              if (
                panTarget === null ||
                !panTarget.hasAttribute("data-sszvis-behavior-voronoi") ||
                panTarget.parentNode !== parent
              ) {
                if (this) event.apply("out", this, [panEvent]);
                return;
              }

              // Resolve the datum by re-running `delaunay.find` on the panned position rather
              // than reading `data[polygon.index]` off the cell under the finger. The two agree
              // in a cell's interior but can disagree right at a cell boundary, where the
              // browser's hit test and the mesh round differently; `find` answers for where the
              // finger actually is, which is what the mouse path does and what keeps a finger
              // on the seam between two cells reporting the same datum the mouse would.
              const panPosition = pointer(touchEvent, parent);
              const panDatumIdx = delaunay.find(panPosition[0], panPosition[1]);
              const panDatum = data[panDatumIdx];

              if (nearPoint(panPosition, [props.x(panDatum), props.y(panDatum)])) {
                // This event won't be cancelable if you start touching outside the hit area of a voronoi center,
                // then start scrolling, then move your finger over the hit area of a voronoi center. The browser
                // says you are "still scrolling" and won't let you cancel the event. It will issue a warning, which
                // we want to avoid.
                if (panEvent.cancelable) {
                  panEvent.preventDefault();
                }
                if (this) event.apply("over", this, [panEvent, panDatum]);
              } else {
                if (this) event.apply("out", this, [panEvent]);
              }
            };

            const end = () => {
              if (this) event.apply("out", this, [e]);
              select(this).on("touchmove", null).on("touchend", null);
            };

            select(this).on("touchmove", pan).on("touchend", end);
          }
        });

      if (props.debug) {
        polys.attr("stroke", "#f00");
      }
    });

  // d3-dispatch's `on` is variadic over typenames, so the args tuple types the handler
  // callback to never. Narrowing to "over" | "out" would type the callback properly but would
  // also reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  voronoiComponent.on = ((...args: [string, never]) => {
    const value = (event.on as (...args: unknown[]) => unknown).apply(event, args);
    return value === event ? voronoiComponent : value;
  }) as VoronoiComponent<T>["on"];

  return voronoiComponent;
}

// Perform distance calculations in units squared to avoid a costly Math.sqrt
const MAX_INTERACTION_RADIUS_SQUARED = 15 ** 2;

/**
 * Both points are in the coordinate space of the group the behaviour was called on, which is
 * also the space the `x` and `y` accessors report positions in. Comparing them there rather
 * than in screen pixels is what makes the hit test independent of where the group sits on the
 * page, and correct when an ancestor transform scales the chart.
 */
function nearPoint(position: [number, number], point: [number, number]): boolean {
  const dx = position[0] - point[0];
  const dy = position[1] - point[1];
  return dx * dx + dy * dy < MAX_INTERACTION_RADIUS_SQUARED;
}
