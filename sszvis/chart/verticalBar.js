;(function(d3, sszvis, exports) {
  "use strict";

  exports.verticalBar = function() {

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('heightScale')
      .prop('xAxis').xAxis(sszvis.axis.x())
      .prop('yAxis').yAxis(sszvis.axis.y())
      .render(function(data) {
        var chart = d3.select(this);
        var props = chart.props();
        var height = props.heightScale.range()[1];
        var yPosScale = props.heightScale
          .copy()
          .range(props.heightScale.range().slice().reverse());

        var barGen = sszvis.component.bar()
          .x(sszvis.fn.compose(props.xScale, props.x))
          .y(sszvis.fn.compose(yPosScale, props.y))
          .width(props.xScale.rangeBand())
          .height(sszvis.fn.compose(props.heightScale, props.y))

        var xAxis = props.xAxis.scale(props.xScale).orient('bottom');
        var yAxis = props.yAxis.scale(yPosScale).orient('right');

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