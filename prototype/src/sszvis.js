// Assets
require('./sszvis.scss');

// D3 Dependencies
var d3 = require('d3');
         require('./lib/d3-bounds');
         require('./lib/d3-component');
         require('./lib/d3-selectgroup');

// Core Dependencies
var DataService = require('./core/DataService');

sszvis = {
  d3: d3,
  DataService: function(config) {
    return new DataService(config);
  },

  start: startup,

  store: require('./core/store'),
  actions: require('./core/dispatcher'),

  createChart: require('./utils/createChart'),

  chart: {
    line: require('./chart/line')
  },

  component: {
    line: require('./component/line')
  },

  utils: {
    translate: require('./utils/translate')
  },

  error: function(msg) {
    alert(msg); // Do something smart here
  }
}


function startup(selector, initialState, render) {
  var chart = sszvis.chart();

  var updateChart = function(state) {
    chart
      .height(state.chart.height)
      .width(state.chart.width)
      .padding(state.chart.padding)
      .render(render);

    d3.select(selector)
      .datum(state)
      .call(chart);
  }

  initialState.change(updateChart);
  updateChart(initialState.toJS());
  sszvis.actions.trigger('startup');
}


module.exports = sszvis;
