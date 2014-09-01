;(function() {
  "use strict";

  // Namespace
  sszvis.chart || (sszvis.chart = {});

  sszvis.chart.line = function() {

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .prop('xAxis', d3.svg.axis().tickFormat(sszvis.utils.format.number))
      .prop('yAxis', d3.svg.axis().tickFormat(sszvis.utils.format.number))
      .render(function(data) {
        var chart = d3.select(this);
        var props = chart.props();
        var height = props.yScale.range()[0]

        var line = sszvis.component.line()
          .x(props.x)
          .y(props.y)
          .xScale(props.xScale)
          .yScale(props.yScale);

        var xAxis = props.xAxis.scale(props.xScale).orient('bottom');
        var yAxis = props.yAxis.scale(props.yScale).orient('left');

        chart.selectGroup('line')
          .call(line);

        chart.selectGroup('xAxis')
          .attr('class', 'sszvis-Axis sszvis-Axis--horizontal')
          .attr('transform', sszvis.utils.translate(0, height))
          .call(xAxis);

        chart.selectGroup('yAxis')
          .attr('class', 'sszvis-Axis sszvis-Axis--vertical')
          .call(yAxis);

      });

  }

}());
