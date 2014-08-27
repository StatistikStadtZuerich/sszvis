var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');

module.exports = function() {

  return d3.component()
    .prop('x')
    .prop('y')
    .prop('xScale')
    .prop('yScale')
    .prop('xAxis', d3.svg.axis())
    .prop('yAxis', d3.svg.axis())
    .render(function(data) {
      var chart = d3.select(this);
      var props = chart.props();
      var height = props.yScale.range()[0]

      var line = component.line()
        .x(props.x)
        .y(props.y)
        .xScale(props.xScale)
        .yScale(props.yScale);

      var xAxis = props.xAxis.scale(props.xScale).orient('bottom');
      var yAxis = props.yAxis.scale(props.yScale).orient('left');

      chart.selectGroup('line')
        .call(line);

      chart.selectGroup('xAxis')
        .attr('class', 'x axis')
        .attr('transform', utils.translate(0, height))
        .call(xAxis);

      chart.selectGroup('yAxis')
        .attr('class', 'y axis')
        .call(yAxis);

    });

}
