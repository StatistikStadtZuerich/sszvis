/**
 * Click behavior
 *
 * The click behavior is used to add a click or tap-based interface to a chart. Like other behavior components,
 * the click behavior adds an invisible layer over the chart, which the users interact with using touch or mouse
 * actions. The behavior component then interprets these interactions, and calls the relevant event handler callback
 * functions. These callback functions are passed values which represent data-space information about the nature of the
 * interaction. That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The click behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
 * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
 * functions. This component extends a d3.dispatch instance.
 *
 * @property {boolean} debug            Whether or not to render the component in debug mode, which reveals its position in the chart.
 * @property {function} xScale          The x-scale for the component. The extent of this scale, plus component padding, is the width of the
 *                                      component's active area.
 * @property {function} yScale          The y-scale for the component. The extent of this scale, plus component padding, is the height of the
 *                                      component's active area.
 * @property {boolean} draggable        Whether or not this component is draggable. This changes certain display properties of the component.
 * @property {object} padding           An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
 *                                      The options are { top, right, bottom, left }
 * @property {string and function} on   The .on() method of this component should specify an event name and an event handler function.
 *                                      Possible event names are:
 *                                      'down' - when the mousedown or touchstart happens
 *                                      'up' - when the mouseup or touchend happens
 *                                      'click' - triggered on a full 'click' action - down and up on the component's element
 *                                      'drag' - when the mouse or touch is moved across the surface of the component's element.
 *                                      All event handler functions are passed an x-value and a y-value, which are the data values,
 *                                      computed by inverting the provided xScale and yScale, which correspond to the screen pixel
 *                                      location of the event.
 *
 * @return {d3.component}
 */
namespace('sszvis.behavior.click', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('down', 'up', 'click', 'drag');

    var clickComponent = d3.component()
      .prop('debug')
      .prop('xScale').xScale(d3.scale.linear())
      .prop('yScale').yScale(d3.scale.linear())
      .prop('draggable')
      .prop('padding', function(p) {
        var defaults = { top: 0, left: 0, bottom: 0, right: 0 };
        for (var prop in p) { defaults[prop] = p[prop]; }
        return defaults;
      }).padding({})
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = props.xScale.range().sort(d3.ascending);
        var yExtent = props.yScale.range().sort(d3.ascending);
        xExtent[0] -= props.padding.left;
        xExtent[1] += props.padding.right;
        yExtent[0] -= props.padding.top;
        yExtent[1] += props.padding.bottom;

        var layer = selection.selectAll('[data-sszvis-behavior-click]')
          .data([0]);

        layer.enter()
          .append('rect')
          .attr('data-sszvis-behavior-click', '')
          .attr('class', 'sszvis-interactive');

        if (props.draggable) {
          layer.classed('sszvis-interactive--draggable', true);
        }

        // defined in this scope in order to have access to props
        function bindDragEvents(targetEl) {
          // used to bind the 'drag' behavior in the event handlers for both touchstart and mousedown
          d3.select(document)
            .on('touchmove.sszvis-click', function() {
              var invXY = invertXY(sszvis.fn.first(d3.touches(targetEl)), props.xScale, props.yScale);
              event.drag(invXY[0], invXY[1]);
            })
            .on('touchend.sszvis-click', function() {
              stopDragging();

              // calling preventDefault here prevents the browser from sending imitation mouse events
              // this is good because actual mouse events are already handled, and because often these
              // imitation events are on a 300ms delay, which can make the user experience strange after-effects.
              d3.event.preventDefault();
            })
            .on('mousemove.sszvis-click', function() {
              var invXY = invertXY(d3.mouse(targetEl), props.xScale, props.yScale);
              event.drag(invXY[0], invXY[1]);
            })
            .on('mouseup.sszvis-click', function() {
              stopDragging();

              var invXY = invertXY(d3.mouse(targetEl), props.xScale, props.yScale);
              event.up(invXY[0], invXY[1]);
            })
            .on('mouseleave.sszvis-click', function() {
              stopDragging();
            });
        }

        layer
          .attr('x', xExtent[0])
          .attr('y', yExtent[0])
          .attr('width',  xExtent[1] - xExtent[0])
          .attr('height', yExtent[1] - yExtent[0])
          .attr('fill', 'transparent')
          .on('touchstart', function() {
            bindDragEvents(this);

            var invXY = invertXY(sszvis.fn.first(d3.touches(this)), props.xScale, props.yScale);
            event.down(invXY[0], invXY[1]);
          })
          .on('mousedown', function() {
            bindDragEvents(this);

            var invXY = invertXY(d3.mouse(this), props.xScale, props.yScale);
            event.down(invXY[0], invXY[1]);
          })
          .on('click', function() {
            var invXY = invertXY(d3.mouse(this), props.xScale, props.yScale);
            event.click(invXY[0], invXY[1]);
          });

        if (props.debug) {
          layer.attr('fill', 'rgba(255,0,0,0.2)');
        }
      });

    d3.rebind(clickComponent, event, 'on');

    return clickComponent;
  };

  function invertXY(xy, xScale, yScale) {
    return [xScale.invert(xy[0]), yScale.invert(xy[1])];
  }

  function stopDragging() {
    d3.select(document)
      .on('touchmove.sszvis-click', null)
      .on('touchend.sszvis-click', null)
      .on('mousemove.sszvis-click', null)
      .on('mouseup.sszvis-click', null)
      .on('mouseleave.sszvis-click', null);
  }

});
