/**
 * Line component
 * @return {d3.component}
 */
namespace('sszvis.component.line', function(module) {

  module.exports = function() {

    return d3.component()
      .prop('xValue')
      .prop('yValue')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var line = d3.svg.line()
          .defined(sszvis.fn.compose(sszvis.fn.not(isNaN), props.yValue))
          .x(props.xValue)
          .y(props.yValue);

        var path = selection.selectAll('.sszvis-line')
          .data(data);

        path.enter()
          .append('path')
          .classed('sszvis-line', true);

        path.exit().remove();

        path
          .transition()
          .call(sszvis.transition)
          .attr('d', line)
          .attr('stroke', props.stroke);
      });
  }

});
