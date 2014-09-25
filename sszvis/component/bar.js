/**
 * Bar component
 * @return {d3.component}
 */
namespace('sszvis.component.bar', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('width')
      .prop('height')
      .prop('fill').fill(null)
      .prop('stroke').stroke(null)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bars = selection.selectAll('rect')
          .data(data);

        bars.enter()
          .append('rect')
          .attr('class', 'sszvis-bar');

        bars
          .attr('x', props.x)
          .attr('y', props.y)
          .attr('width', props.width)
          .attr('height', props.height)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});
