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
sszvis_namespace('sszvis.behavior.voronoi', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('over', 'out');

    var voronoiComponent = d3.component()
      .prop('x')
      .prop('y')
      .prop('bounds')
      .prop('debug')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        if (!props.bounds) {
          sszvis.logger.error('behavior.voronoi - requires bounds');
          return false;
        }

        var voronoi = d3.geom.voronoi()
          .x(props.x)
          .y(props.y)
          .clipExtent(props.bounds);

        var polys = selection.selectAll('[data-sszvis-behavior-voronoi]')
          .data(voronoi(data));

        polys.enter()
          .append('path')
          .attr('data-sszvis-behavior-voronoi', '')
          .attr('data-sszvis-behavior-pannable', '')
          .attr('class', 'sszvis-interactive');

        polys.exit().remove();

        polys
          .attr('d', function(d) { return 'M' + d.join('L') + 'Z'; })
          .attr('fill', 'transparent')
          .on('mouseover', function(datum) {
            var cbox = this.parentElement.getBoundingClientRect();
            if (eventNearPoint(d3.event, [cbox.left + props.x(datum.point), cbox.top + props.y(datum.point)])) {
              event.over(datum.point);
            }
          })
          .on('mousemove', function(datum) {
            var cbox = this.parentElement.getBoundingClientRect();
            if (eventNearPoint(d3.event, [cbox.left + props.x(datum.point), cbox.top + props.y(datum.point)])) {
              event.over(datum.point);
            } else {
              event.out();
            }
          })
          .on('mouseout', function() {
            event.out();
          })
          .on('touchstart', function(datum) {
            var cbox = this.parentElement.getBoundingClientRect();
            if (eventNearPoint(sszvis.fn.firstTouch(d3.event), [cbox.left + props.x(datum.point), cbox.top + props.y(datum.point)])) {
              d3.event.preventDefault();
              event.over(datum.point);
            }
          })
          .on('touchmove', function() {
            var touchEvent = sszvis.fn.firstTouch(d3.event);
            var element = sszvis.behavior.util.elementFromEvent(touchEvent);
            var datum = sszvis.behavior.util.datumFromPannableElement(element);
            if (datum !== null) {
              var cbox = element.parentElement.getBoundingClientRect();
              if (eventNearPoint(touchEvent, [cbox.left + props.x(datum.point), cbox.top + props.y(datum.point)])) {
                // This event won't be cancelable if you start touching outside the hit area of a voronoi center,
                // then start scrolling, then move your finger over the hit area of a voronoi center. The browser
                // says you are "still scrolling" and won't let you cancel the event. It will issue a warning, which
                // we want to avoid.
                if (d3.event.cancelable) { d3.event.preventDefault(); }
                event.over(datum.point);
              } else {
                event.out();
              }
            } else {
              event.out();
            }
          })
          .on('touchend', function() {
            event.out();
          });

          if (props.debug) {
            polys.attr('stroke', '#f00');
          }
      });

    d3.rebind(voronoiComponent, event, 'on');

    return voronoiComponent;
  };

  // Perform distance calculations in units squared to avoid a costly Math.sqrt
  var MAX_INTERACTION_RADIUS_SQUARED = Math.pow(25, 2);

  function eventNearPoint(event, point) {
    var dx = event.clientX - point[0];
    var dy = event.clientY - point[1];
    return (dx * dx + dy * dy) < MAX_INTERACTION_RADIUS_SQUARED;
  }

});
