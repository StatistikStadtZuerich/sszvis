var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');
var translate = require('../utils/translate');

module.exports = function() {
  var renderer = _.identity;

  var chart = d3.component()
    .prop('height', 100)
    .prop('width', 100)
    .prop('padding', {top: 0, right: 0, bottom: 0, left: 0}, function(val, prev){
      return _.extend({}, prev, val);
    })

  var internalRender = chart.render;
  internalRender(function(data, props) {
    var svg = d3.select(this).selectAll('svg').data([0]);

    svg.enter().append('svg');
    svg.exit().remove();

    svg
      .attr('height', props.height)
      .attr('width',  props.width)

    var frame = svg.selectAll('[data-d3-chart]').data([0])
    frame.enter().append('g')
      .attr('data-d3-chart', '')
      .attr('transform', translate(props.padding.left, props.padding.right));

    var childProps = _.clone(props);
    childProps.height = props.height - props.padding.top - props.padding.bottom;
    childProps.width = props.width - props.padding.left - props.padding.right;
    renderer.call(frame.node(), data, childProps);
  })

  // Redefine render for the chart component
  chart.render = function(callback) {
    renderer = callback;
    return chart;
  }

  return chart;
}
