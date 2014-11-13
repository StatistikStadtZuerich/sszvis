/**
 * @module sszvis/component/rangeFlag
 *
 * @returns {d3.component} range flag component (see stacked area chart example)
 */
namespace('sszvis.component.rangeFlag', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y0', d3.functor)
      .prop('y1', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var crispX = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.x);
        var crispY0 = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y0);
        var crispY1 = sszvis.fn.compose(sszvis.fn.roundPixelCrisp, props.y1);

        var bottomDot = selection.selectAll('.sszvis-rangeFlag__mark.bottom')
          .data(data);

        var topDot = selection.selectAll('.sszvis-rangeFlag__mark.top')
          .data(data);

        bottomDot
          .call(makeFlagDot)
          .classed('bottom', true)
          .attr('cx', crispX)
          .attr('cy', crispY0);

        topDot
          .call(makeFlagDot)
          .classed('top', true)
          .attr('cx', crispX)
          .attr('cy', crispY1);

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            return [crispX(d), sszvis.fn.roundPixelCrisp((props.y0(d) + props.y1(d)) / 2)];
          });

        selection.call(tooltipAnchor);
      });
  };

  function makeFlagDot(dot) {
    dot.enter()
      .append('circle')
      .attr('class', 'sszvis-rangeFlag__mark');

    dot.exit().remove();

    dot
      .attr('r', 3.5);
  }

});
