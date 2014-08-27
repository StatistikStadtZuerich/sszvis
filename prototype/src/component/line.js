var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');

module.exports = function() {

  return d3.component()
    .prop('xScale')
    .prop('yScale')

    // -> 2nd arg is usually index, 3rd is parent index
    .render(function(data, props) {
      var selection = d3.select(this);

      var line = d3.svg.line()
        .x(function(d) { return props.xScale(d.date); })
        .y(function(d) { return props.yScale(d.value); });

      var path = selection.selectAll('path')
        .data([data])

      path.enter()
        .append('path')
        .attr("class", "line")

      path
        .attr("d", line);

    });

}
