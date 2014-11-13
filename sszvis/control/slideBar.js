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

        var xValue = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.xScale, props.x);
        var yValue = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.yScale, props.y);

        var xPos = xValue(sszvis.fn.first(data));
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range()) - 4;

        var handleWidth = 10;
        var handleHeight = 24;
        var handleTop = top - handleHeight;

        var group = selection.selectAll('.sszvis-slider-group')
          .data([0]);

        var entering = group.enter()
          .append('g')
          .classed('sszvis-slider-group', true);

        group.exit().remove();

        entering
          .append('line')
          .classed('sszvis-slider__line', true);

        entering
          .append('rect')
          .classed('sszvis-slider__handle', true);

        entering
          .append('line')
          .classed('sszvis-slider__handle-mark', true);

        group.selectAll('.sszvis-slider__line')
          .attr('x1', xPos)
          .attr('y1', sszvis.fn.roundPixelCrisp(top))
          .attr('x2', xPos)
          .attr('y2', sszvis.fn.roundPixelCrisp(bottom));

        group.selectAll('.sszvis-slider__handle')
          .attr('x', xPos - handleWidth / 2)
          .attr('y', sszvis.fn.roundPixelCrisp(handleTop))
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-slider__handle-mark')
          .attr('x1', xPos)
          .attr('y1', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.15))
          .attr('x2', xPos)
          .attr('y2', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.85));

        var dots = group.selectAll('.sszvis-slider__dot')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-slider__dot', true);

        dots.exit().remove();

        dots
          .attr('cx', xValue)
          .attr('cy', yValue)
          .attr('r', 3.5)
          .attr('fill', props.color);

        var captions = group.selectAll('.sszvis-slider__label')
          .data(data);

        captions.enter()
          .append('text')
          .classed('sszvis-slider__label', true);

        captions.exit().remove();

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
