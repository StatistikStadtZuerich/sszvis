/**
 * Line component
 * @return {d3.component}
 */
namespace('sszvis.component.line', function(module) {

  module.exports = function() {

    var fn = sszvis.fn;

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var line = d3.svg.line()
          .defined(fn.compose(fn.not(isNaN), props.y))
          .x(fn.compose(props.xScale, props.x))
          .y(fn.compose(props.yScale, props.y))

        var path = selection.selectAll('path.sszvis-line')
          .data(data)

        path.enter()
          .append('path')
          .classed("sszvis-line", true)

        path.exit().remove();

        path
          .attr("d", line);
      });
  }

});
