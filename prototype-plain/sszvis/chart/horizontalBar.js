;(function(d3, sszvis, exports) {
  "use strict";

  exports.horizontalBar = function() {

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('yScale')
      .prop('widthScale')
      .prop('xAxis').xAxis(sszvis.axis.x())
      .prop('yAxis').yAxis(sszvis.axis.y())
      .render(function(data) {
        var chart = d3.select(this);
        var props = chart.props();
        var height = sszvis.fn.last(props.yScale.range());

        var barGen = sszvis.component.bar()
          .x(0)
          .y(sszvis.fn.compose(props.yScale, props.y))
          .width(sszvis.fn.compose(props.widthScale, props.x))
          .height(props.yScale.rangeBand());

        var xAxis = props.xAxis.scale(props.widthScale).orient('bottom');
        var yAxis = props.yAxis.scale(props.yScale).orient('right');

        chart.selectGroup('bars')
          .call(barGen)

        chart.selectGroup('xAxis')
          .attr('class', 'sszvis-Axis sszvis-Axis--horizontal')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        chart.selectGroup('yAxis')
          .attr('class', 'sszvis-Axis sszvis-Axis--vertical')
          .call(yAxis);

      });

  };

}(d3, sszvis, (sszvis.chart || (sszvis.chart = {}))));