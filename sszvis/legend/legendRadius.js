/**
 * @module sszvis/legend/radiusLegend
 *
 * @returns {d3.component}
 */
namespace('sszvis.legend.radiusLegend', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var range = props.scale.range();
        var points = [range[1], d3.mean(range), range[0]];

        var circles = selection.selectAll('.sszvis-legend--mark')
          .data(points);

        circles.enter()
          .append('circle')
          .classed('sszvis-legend--mark', true);

        circles.exit().remove();

        circles
          .attr('r', sszvis.fn.identity)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});
