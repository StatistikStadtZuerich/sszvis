// Assets
require('./zvis.scss');

// Dependencies
var d3 = require('d3');
var AppState = require('./core/AppState');
var Controller = require('./core/Controller');
var DataService = require('./core/DataService');

zvis = {
  d3: d3,
  DataService: function(config) {
    return new DataService(config);
  },

  // chart: function(config){
  //   return new Chart(config);
  // },
  chart: require('./core/chart'),

  layer: require('./core/layer'),

  init: function(initialState, stateChangeHandler) {
    zvis.state = new AppState(initialState, stateChangeHandler);
    setTimeout(function(){
      zvis.commands.trigger('startup');
    }, 0);
  },

  state: null,
  commands: new Controller()
}


module.exports = zvis;
