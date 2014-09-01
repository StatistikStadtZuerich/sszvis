;(function() {
  "use strict";

  var component = {}
  component.line = function() {

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var line = d3.svg.line()
          .defined(function(d) { return !isNaN(props.y(d)); })
          .x(function(d) { return props.xScale(props.x(d)); })
          .y(function(d) { return props.yScale(props.y(d)); })

        var path = selection.selectAll('path')
          .data(data)

        path.enter()
          .append('path')
          .attr("class", "line")

        path
          .attr("d", line);

      });

  }


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
          .attr('transform', sszvis.utils.translate(0, height))
          .call(xAxis);

        chart.selectGroup('yAxis')
          .attr('class', 'y axis')
          .call(yAxis);

      });

  }

}());
