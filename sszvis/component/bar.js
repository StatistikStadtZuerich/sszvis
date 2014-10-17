/**
 * Bar component
 * @return {d3.component}
 */
namespace('sszvis.component.bar', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('width', d3.functor)
      .prop('height', d3.functor)
      .prop('fill', d3.functor)
      .prop('stroke', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bars = selection.selectAll('.sszvis-bar')
          .data(data);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true);

        bars.exit().remove();

        bars
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        bars
          .transition()
          .call(sszvis.transition)
          .attr('x', props.x)
          .attr('y', props.y)
          .attr('width', props.width)
          .attr('height', props.height);

        // Tooltip anchors

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            return [props.x(d) + props.width(d) / 2, props.y(d)];
          });

        selection.call(tooltipAnchor);

      });
  };

});
