var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');

module.exports = function() {

  return d3.component()
    .prop('height', 150)
    .prop('width', 230)
    .render(function(data, props) {
      var selection = d3.select(this);

      var x = d3.time.scale()
        .range([0, props.width])
        .domain(d3.extent(data, _.property('date')));

      var y = d3.scale.linear()
        .range([props.height, 0])
        .domain(d3.extent(data, _.property('value')));

      var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

      var path = selection.selectAll('path')
        .data([data])

      path.enter()
        .append('path')
        .attr("class", "line")

      path
        .attr("d", line);

    });

}
