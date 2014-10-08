/**
 * Dot component
 * @return {d3.component}
 */
namespace('sszvis.component.dot', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('radius')
      .prop('stroke')
      .prop('fill')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var dots = selection.selectAll('.sszvis-circle')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-circle', true);

        dots.exit().remove();

        dots
          .transition()
          .call(sszvis.transition)
          .attr('cx', props.x)
          .attr('cy', props.y)
          .attr('r', props.radius)
          .attr('stroke', props.stroke)
          .attr('fill', props.fill);
      });
  };

});