var _ = require('underscore');
var d3 = require('d3');
var accessor = require('../utils/accessor');
var translate = require('../utils/translate');

module.exports = function() {

  var props = {
    height:  100,
    width:   150,
    padding: {top: 0, right: 0, bottom: 0, left: 0},
    layers:  []
  }

  function chart(selection) {
    selection.each(function() {
      var svg = d3.select(this).selectAll('svg').data([0])

      svg.enter().append('svg');
      svg.exit().remove();

      svg
        .attr('height', props.height)
        .attr('width',  props.width)

      var frame = svg.selectAll('.zvis-chart-frame').data([0])
      frame.enter().append('g')
        .attr('class', 'zvis-chart-frame')
        .attr('transform', translate(props.padding.left, props.padding.right));

      var layers = frame.selectAll('.layer')
        .data(props.layers, function(d){return d.key()})

      layers.enter().append('g')
        .attr('class', 'layer')

      layers.each(function(layer){
        d3.select(this).call(layer, {
          height: props.height - props.padding.top - props.padding.bottom,
          width: props.width - props.padding.left - props.padding.right,
          outerHeight: props.height,
          outerWidth: props.width
        });
      });

    });
  }

  chart.height  = accessor(props, 'height').bind(chart);
  chart.width   = accessor(props, 'width').bind(chart);
  chart.padding = accessor(props, 'padding', function(val){
    return _.extend({}, props.padding, val);
  }).bind(chart);

  chart.addLayer = function(layer) {
    if (!_.contains(props.layers.map(function(d){return d.key()}), layer.key())) {
      props.layers.push(layer);
    } else {
      console.warn('Layer already appended', layer);
    }
    return chart;
  }

  return chart;
}

function assert(truth, msg) {
  if (!truth) throw "Assertion error: " + msg;
}
