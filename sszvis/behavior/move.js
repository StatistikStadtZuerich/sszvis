/**
 * Move behavior
 *
 * The move behavior is used to add a mouseover and touchmove-based interface to a chart.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The move behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
 * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
 * functions. This component extends a d3.dispatch instance.
 *
 * @module sszvis/behavior/move
 *
 * @property {boolean} debug                      Whether or not to render the component in debug mode, which reveals its position in the chart.
 * @property {function} xScale                    The x-scale for the component. The extent of this scale, plus component padding, is the width of the
 *                                                component's active area.
 * @property {function} yScale                    The y-scale for the component. The extent of this scale, plus component padding, is the height of the
 *                                                component's active area.
 * @property {boolean} draggable                  Whether or not this component is draggable. This changes certain display properties of the component.
 * @property {object} padding                     An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
 *                                                The options are { top, right, bottom, left }
 * @property {boolean|function} cancelScrolling   A predicate function, or a constant boolean, that determines whether the browser's default scrolling
 *                                                behavior in response to a touch event should be canceled. In area charts and line charts, for example,
 *                                                you generally don't want to cancel scrolling, as this creates a scroll trap. However, in bar charts
 *                                                which use this behavior, you want to pass a predicate function here which will determine whether the touch
 *                                                event falls within the "profile" of the bar chart, and should therefore cancel scrolling and trigger an event.
 * @property {boolean} fireOnPanOnly              In response to touch events, whether to fire events only while "panning", that is only while performing
 *                                                a touch move where the default scrolling behavior is canceled, and not otherwise. In area and line charts, this
 *                                                should be false, since you want to fire events all the time, even while scrolling. In bar charts, we want to
 *                                                limit the firing of events (and therefore, the showing of tooltips) to only cases where the touch event has its
 *                                                default scrolling prevented, and the user is therefore "panning" across bars. So this should be true for bar charts.
 * @property {string and function} on             The .on() method of this component should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'start' - when the move action starts - mouseover or touchstart
 *                                                'move' - called when a 'moving' action happens - mouseover on the element
 *                                                'drag' - called when a 'dragging' action happens - mouseover with the mouse click down, or touchmove
 *                                                'end' - called when the event ends - mouseout or touchend
 *                                                Event handler functions, excepting end, are passed an x-value and a y-value, which are the data values,
 *                                                computed by inverting the provided xScale and yScale, which correspond to the screen pixel location of the event.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.behavior.move', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('start', 'move', 'drag', 'end');

    var moveComponent = d3.component()
      .prop('debug')
      .prop('xScale')
      .prop('yScale')
      .prop('draggable')
      .prop('cancelScrolling', d3.functor).cancelScrolling(false)
      .prop('fireOnPanOnly', d3.functor).fireOnPanOnly(false)
      .prop('padding', function(p) {
        var defaults = { top: 0, left: 0, bottom: 0, right: 0 };
        for (var prop in p) { defaults[prop] = p[prop]; }
        return defaults;
      }).padding({})
      .render(function() {

        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = sszvis.scale.range(props.xScale).sort(d3.ascending);
        var yExtent = sszvis.scale.range(props.yScale).sort(d3.ascending);

        xExtent[0] -= props.padding.left;
        xExtent[1] += props.padding.right;
        yExtent[0] -= props.padding.top;
        yExtent[1] += props.padding.bottom;

        var layer = selection.selectAll('[data-sszvis-behavior-move]')
          .data([0]);

        layer.enter()
          .append('rect')
          .attr('data-sszvis-behavior-move', '')
          .attr('class', 'sszvis-interactive');

        if (props.draggable) {
          layer.classed('sszvis-interactive--draggable', true);
        }

        layer
          .attr('x', xExtent[0])
          .attr('y', yExtent[0])
          .attr('width',  xExtent[1] - xExtent[0])
          .attr('height', yExtent[1] - yExtent[0])
          .attr('fill', 'transparent')
          .on('mouseover', event.start)
          .on('mousedown', function() {
            var target = this;
            var doc = d3.select(document);
            var win = d3.select(window);

            var drag = function() {
              var xy = d3.mouse(target);
              var x = scaleInvert(props.xScale, xy[0]);
              var y = scaleInvert(props.yScale, xy[1]);
              d3.event.preventDefault();
              event.drag(x, y);
            };

            var startDragging = function() {
              target.__dragging__ = true;
              drag();
            };

            var stopDragging = function() {
              target.__dragging__ = false;
              win.on('mouseup.sszvis-behavior-move', null);
              win.on('mousemove.sszvis-behavior-move', null);
              doc.on('mouseout.sszvis-behavior-move', null);
              event.end();
            };

            win.on('mousemove.sszvis-behavior-move', drag);
            win.on('mouseup.sszvis-behavior-move', stopDragging);
            doc.on('mouseout.sszvis-behavior-move', function() {
              var from = d3.event.relatedTarget || d3.event.toElement;
              if (!from || from.nodeName === 'HTML') {
                stopDragging();
              }
            });

            startDragging();
          })
          .on('mousemove', function() {
            var target = this;
            var xy = d3.mouse(this);
            var x = scaleInvert(props.xScale, xy[0]);
            var y = scaleInvert(props.yScale, xy[1]);

            if (!target.__dragging__) {
              event.move(x, y);
            }
          })
          .on('mouseout', event.end)
          .on('touchstart', function() {
            var xy = sszvis.fn.first(d3.touches(this));
            var x = scaleInvert(props.xScale, xy[0]);
            var y = scaleInvert(props.yScale, xy[1]);

            var cancelScrolling = props.cancelScrolling(x, y);

            if (cancelScrolling) {
              d3.event.preventDefault();
            }

            // if fireOnPanOnly => cancelScrolling must be true
            // if !fireOnPanOnly => always fire events
            // This is in place because this behavior needs to only fire
            // events on a successful "pan" action in the bar charts, i.e.
            // only when scrolling is prevented, but then it also needs to fire
            // events all the time in the line and area charts, i.e. allow
            // scrolling to continue as normal but also fire events.
            // To configure the chart for use in the bar charts, you need
            // to configure a cancelScrolling function for determining when to
            // cancel scrolling, i.e. what constitutes a "pan" event, and also
            // pass fireOnPanOnly = true, which flips this switch and relies on
            // cancelScrolling to determine whether to fire the events.
            if (!props.fireOnPanOnly() || cancelScrolling) {
              event.start(x, y);
              event.drag(x, y);
              event.move(x, y);

              var pan = function() {
                var xy = sszvis.fn.first(d3.touches(this));
                var x = scaleInvert(props.xScale, xy[0]);
                var y = scaleInvert(props.yScale, xy[1]);

                var cancelScrolling = props.cancelScrolling(x, y);

                if (cancelScrolling) {
                  d3.event.preventDefault();
                }

                // See comment above about the same if condition.
                if (!props.fireOnPanOnly() || cancelScrolling) {
                  event.drag(x, y);
                  event.move(x, y);
                } else {
                  event.end();
                }
              };

              var end = function() {
                event.end();
                d3.select(this)
                  .on('touchmove', null)
                  .on('touchend', null);
              };

              d3.select(this)
                .on('touchmove', pan)
                .on('touchend', end);
            }
          });

        if (props.debug) {
          layer.attr('fill', 'rgba(255,0,0,0.2)');
        }
      });

    d3.rebind(moveComponent, event, 'on');

    return moveComponent;
  };

  function scaleInvert(scale, px) {
    if (scale.invert) {
      // Linear scale
      return scale.invert(px);
    } else {
      // Ordinal scale
      var bandWidth = scale.rangeBand();
      var scaleRange = scale.range();
      var paddingWidth = scaleRange.length < 2 ? 0 : (scaleRange[1] - scaleRange[0]) - bandWidth;
      var leftEdges = scale.range().map(function(d) {
        return [d - paddingWidth / 2, d + bandWidth + paddingWidth / 2];
      });
      for (var i = 0, l = leftEdges.length; i < l; i++) {
        if (leftEdges[i][0] < px && px <= leftEdges[i][1]) {
          return scale.domain()[i];
        }
      }
      return null;
    }
  }

});
