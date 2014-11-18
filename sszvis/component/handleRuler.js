/**
 * SlideBar for use in sliding along the x-axis of charts
 *
 * @module  sszvis/component/handleRuler
 *
 */
namespace('sszvis.component.handleRuler', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('top')
      .prop('bottom')
      .prop('label').label('')
      .prop('color')
      .prop('flip', d3.functor).flip(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var crispY = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y);

        var crispX = sszvis.fn.roundPixelCrisp(props.x);
        var bottom = props.bottom - 4;
        var handleWidth = 10;
        var handleHeight = 24;
        var handleTop = props.top - handleHeight;

        var group = selection.selectAll('.sszvis-rule__group')
          .data([0]);

        var entering = group.enter()
          .append('g')
          .classed('sszvis-rule__group', true);

        group.exit().remove();

        entering
          .append('line')
          .classed('sszvis-rule__line', true);

        entering
          .append('rect')
          .classed('sszvis-rule__handle', true);

        entering
          .append('line')
          .classed('sszvis-rule__handle-mark', true);

        group.selectAll('.sszvis-rule__line')
          .attr('x1', crispX)
          .attr('y1', sszvis.fn.roundPixelCrisp(props.top))
          .attr('x2', crispX)
          .attr('y2', sszvis.fn.roundPixelCrisp(bottom));

        group.selectAll('.sszvis-rule__handle')
          .attr('x', crispX - handleWidth / 2)
          .attr('y', sszvis.fn.roundPixelCrisp(handleTop))
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-rule__handle-mark')
          .attr('x1', crispX)
          .attr('y1', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.15))
          .attr('x2', crispX)
          .attr('y2', sszvis.fn.roundPixelCrisp(handleTop + handleHeight * 0.85));

        var dots = group.selectAll('.sszvis-rule__dot')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-rule__dot', true);

        dots.exit().remove();

        dots
          .attr('cx', crispX)
          .attr('cy', crispY)
          .attr('r', 3.5)
          .attr('fill', props.color);

        var captions = group.selectAll('.sszvis-rule__label')
          .data(data);

        captions.enter()
          .append('text')
          .classed('sszvis-rule__label', true);

        captions.exit().remove();

        captions
          .attr('x', crispX)
          .attr('y', crispY)
          .attr('dx', function(d) {
            return props.flip(d) ? -10 : 10;
          })
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (crispY(d) < props.top + baselineShift)    return 2 * baselineShift;
            if (crispY(d) > bottom - baselineShift) return 0;
            return baselineShift;
          })
          .style('text-anchor', function(d) {
            return props.flip(d) ? 'end' : 'start';
          })
          .text(props.label);

      });
  };

});