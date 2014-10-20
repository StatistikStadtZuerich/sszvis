/**
 * SlideBar for use in sliding along the x-axis of charts
 *
 * @module  sszvis/control/slideBar
 */
namespace('sszvis.control.slideBar', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .prop('label').label(sszvis.fn.constant(''))
      .prop('color')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var key = function(d) {
          return props.x(d) + '_' + props.y(d);
        };

        var xValue = sszvis.fn.compose(props.xScale, props.x);
        var yValue = sszvis.fn.compose(props.yScale, props.y);
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range()) - 4;
        var handleWidth = 10;
        var handleHeight = 30;

        // FIXME: currently, the handle is rendered outside of the range of the yScale.
        // This keeps the handle out of the data area, but it also means that the mouse clicks aren't in the area of the scale
        // This makes the handle incompatible with, for instance, the click behavior component.
        var handleTop = top - handleHeight;

        var group = selection.selectAll('.sszvis-slider-group')
          .data(data, key);

        var entering = group.enter()
          .append('g')
          .classed('sszvis-slider-group', true);

        group.exit().remove();

        entering
          .append('line')
          .classed('sszvis-slider-line', true);

        entering
          .append('rect')
          .classed('sszvis-slider-handle', true);

        entering
          .append('line')
          .classed('sszvis-slider-handleMark', true);

        group.selectAll('.sszvis-slider-line')
          .attr('x1', xValue)
          .attr('y1', top)
          .attr('x2', xValue)
          .attr('y2', bottom);

        group.selectAll('.sszvis-slider-handle')
          .attr('x', function(d) { return xValue(d) - handleWidth / 2; })
          .attr('y', handleTop)
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-slider-handleMark')
          .attr('x1', xValue)
          .attr('y1', handleTop + handleHeight * 0.15)
          .attr('x2', xValue)
          .attr('y2', handleTop + handleHeight * 0.85);

        var dots = group.selectAll('.sszvis-slider-dot')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-slider-dot', true);

        dots.exit().remove();

        dots
          .attr('cx', xValue)
          .attr('cy', yValue)
          .attr('r', 3.5)
          .attr('fill', props.color);

        var captions = group.selectAll('.sszvis-slider-label')
          .data(data);

        captions.enter()
          .append('text')
          .classed('sszvis-slider-label', true);

        captions
          .attr('x', xValue)
          .attr('y', yValue)
          .attr('dx', 10)
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (yValue(d) < top + baselineShift)    return 2 * baselineShift;
            if (yValue(d) > bottom - baselineShift) return 0;
            return baselineShift;
          })
          .text(props.label);

      });
  };

});