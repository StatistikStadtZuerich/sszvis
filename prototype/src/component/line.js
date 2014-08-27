var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');

module.exports = function() {

  return d3.component()
    .prop('xScale')
    .prop('yScale')
    .render(function(data) {
      var selection = d3.select(this);
      var props = selection.props();

      var line = d3.svg.line()
        .defined(function(d) { return !isNaN(d.value) })
        .x(function(d) { return props.xScale(d.date); })
        .y(function(d) { return props.yScale(d.value); })

      var path = selection.selectAll('path')
        .data([data])

      path.enter()
        .append('path')
        .attr("class", "line")

      path
        .attr("d", line);

    });

}
