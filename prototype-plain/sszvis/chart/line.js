;(function(d3, sszvis, exports) {
  "use strict";

  exports.line = function() {

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .prop('xAxis').xAxis(sszvis.axis.x())
      .prop('yAxis').yAxis(sszvis.axis.y())
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
        var yAxis = props.yAxis.scale(props.yScale).orient('right');

        chart.selectGroup('line')
          .call(line);

        chart.selectGroup('xAxis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        chart.selectGroup('yAxis')
          .call(yAxis);

      });

  }

}(d3, sszvis, (sszvis.chart || (sszvis.chart = {}))));
