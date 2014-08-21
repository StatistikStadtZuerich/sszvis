// Assets
require('./sszvis.scss');

// D3 Dependencies
var d3 = require('d3');
         require('./lib/d3-component');
         require('./lib/d3-selectgroup');

// Core Dependencies
var AppState = require('./core/AppState');
var Controller = require('./core/Controller');
var DataService = require('./core/DataService');

sszvis = {
  d3: d3,
  DataService: function(config) {
    return new DataService(config);
  },

  chart: require('./core/chart'),

  init: function(initialState, stateChangeHandler) {
    sszvis.state = new AppState(initialState, stateChangeHandler);
    setTimeout(function(){
      sszvis.commands.trigger('startup');
    }, 0);
  },

  state: null,
  commands: new Controller(),

  vis: {
    lineChart: require('./vis/lineChart')
  },

  utils: {
    translate: require('./utils/translate')
  }
}


module.exports = sszvis;
