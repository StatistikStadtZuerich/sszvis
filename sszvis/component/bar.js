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
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bars = selection.selectAll('rect.sszvis-bar')
          .data(data);

        bars.enter()
          .append('rect')
          .attr('class', 'sszvis-bar');

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
      });
  };

});
