/**
 * Click behavior
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
