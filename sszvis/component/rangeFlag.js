/**
 * @module sszvis/component/rangeFlag
 *
 * @returns {d3.component} range flag component (see stacked area chart example)
 */
namespace('sszvis.component.rangeFlag', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y0', d3.functor).y0(sszvis.fn.prop('y0'))
      .prop('dy', d3.functor).dy(sszvis.fn.prop('y'))
      .prop('yScale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var y0 = sszvis.fn.compose(props.yScale, props.y0);
        var y1 = sszvis.fn.compose(props.yScale, function(d) { return props.y0(d) + props.dy(d); });

        var bottomDot = selection.selectAll('circle.sszvis-legend--mark.bottom')
          .data(data);

        bottomDot
          .call(makeFlagDot)
          .classed('bottom', true)
          .attr('cy', y0);

        var topDot = selection.selectAll('circle.sszvis-legend--mark.top')
          .data(data);

        topDot
          .call(makeFlagDot)
          .classed('top', true)
          .attr('cy', y1);

        function makeFlagDot(dot) {
          dot.enter()
            .append('circle')
            .classed('sszvis-legend--mark', true);

          dot.exit().remove();

          dot
            .attr('cx', props.x)
            .attr('r', 2)
            .attr('fill', '#fff')
            .attr('stroke', '#909090');
        }

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            return [props.x, props.yScale(props.y0(d) + props.dy(d) / 2)];
          });

        selection.call(tooltipAnchor);
      });
  };

});
