var _ = require('underscore');
var d3 = require('d3');
var EventEmitter = require('events').EventEmitter;

function Controller() {
  this.channel = new EventEmitter();
}

// Can only be run once
Controller.prototype.register = function(evt, handler) {
  if (_.isObject(evt)) {
    _.each(evt, function(h, e) { this.channel.on(e, h); }.bind(this));
  } else {
    this.channel.on(evt, handler);
  }
}

Controller.prototype.trigger = function(evt, payload) {
  this.channel.emit(evt, payload);
}

module.exports = Controller;
