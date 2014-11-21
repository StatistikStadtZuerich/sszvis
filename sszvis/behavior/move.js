/**
 * Move behavior
 * @return {d3.component}
 */
namespace('sszvis.behavior.move', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('start', 'move', 'drag', 'end');

    var moveComponent = d3.component()
      .prop('debug')
      .prop('xScale')
      .prop('yScale')
      .prop('draggable')
      .prop('padding', function(p) {
        var defaults = { top: 0, left: 0, bottom: 0, right: 0 };
        for (var prop in p) { defaults[prop] = p[prop]; }
        return defaults;
      }).padding({})
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = scaleExtent(props.xScale).sort(d3.ascending);
        var yExtent = scaleExtent(props.yScale).sort(d3.ascending);

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
            d3.event.preventDefault();

            var xy = sszvis.fn.first(d3.touches(this));
            var x = scaleInvert(props.xScale, xy[0]);
            var y = scaleInvert(props.yScale, xy[1]);

            event.start.apply(this, Array.prototype.slice.call(arguments));
            event.drag(x, y);
            event.move(x, y);
          })
          .on('touchmove', function() {
            var xy = sszvis.fn.first(d3.touches(this));
            var x = scaleInvert(props.xScale, xy[0]);
            var y = scaleInvert(props.yScale, xy[1]);

            event.drag(x, y);
            event.move(x, y);
          })
          .on('touchend', event.end);

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
      var leftEdges = scale.range().map(function(d) {
        return [d, d + bandWidth];
      });
      for (var i = 0, l = leftEdges.length; i < l; i++) {
        if (leftEdges[i][0] < px && px <= leftEdges[i][1]) {
          return scale.domain()[i];
        }
      }
      return null;
    }
  }

  function scaleExtent(scale) {
    if (scale.rangeExtent) {
      return scale.rangeExtent();
    } else {
      return scale.range();
    }
  }

});
