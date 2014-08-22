// Assets
require('./sszvis.scss');

// D3 Dependencies
var d3 = require('d3');
         require('./lib/d3-component');
         require('./lib/d3-selectgroup');

// Core Dependencies
var AppState = require('./core/AppState');
var DataService = require('./core/DataService');

sszvis = {
  d3: d3,
  DataService: function(config) {
    return new DataService(config);
  },

  init: function(initialState, stateChangeHandler) {
    sszvis.state = new AppState(initialState, stateChangeHandler);
    setTimeout(function(){
      sszvis.actions.trigger('startup');
    }, 0);
  },

  state: null,
  actions: require('./core/dispatcher'),

  chart: require('./core/chart'),
  vis: {
    lineChart: require('./vis/lineChart')
  },
  utils: {
    translate: require('./utils/translate')
  }
}


module.exports = sszvis;
