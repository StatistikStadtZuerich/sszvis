/**
 * @module sszvis/legend/radius
 *
 * @returns {d3.component}
 */
namespace('sszvis.legend.radius', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('fill').fill('#fff')
      .prop('stroke').stroke('#000')
      .prop('strokeWidth').strokeWidth(1.25)
      .prop('labelSize').labelSize('10px')
      .prop('labelFormat').labelFormat(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var range = props.scale.range();
        var points = [range[1], d3.mean(range), range[0]];

        var circles = selection.selectAll('circle.sszvis-legend__mark')
          .data(points);

        circles.enter()
          .append('circle')
          .classed('sszvis-legend__mark', true);

        circles.exit().remove();

        circles
          .attr('r', sszvis.fn.identity)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke)
          .attr('stroke-width', props.strokeWidth);

        var lines = selection.selectAll('line.sszvis-legend__mark')
          .data(points);

        lines.enter()
          .append('line')
          .classed('sszvis-legend__mark', true);

        lines.exit().remove();

        lines
          .attr('x1', 0)
          .attr('y1', function(d) {
            return -d + props.strokeWidth;
          })
          .attr('x2', range[1] + 15)
          .attr('y2', function(d) {
            return -d + props.strokeWidth;
          })
          .attr('stroke', '#909090')
          .attr('stroke-dasharray', '3 2');

        var labels = selection.selectAll('text.sszvis-legend__label')
          .data(points);

        labels.enter()
          .append('text')
          .classed('sszvis-legend__label', true);

        labels.exit().remove();

        labels
          .attr('dx', range[1] + 18)
          .attr('y', function(d) {
            return -d + props.strokeWidth;
          })
          .attr('dy', '0.35em') // vertically-center
          .style('font-size', props.labelSize)
          .text(props.labelFormat);
      });
  };

});
