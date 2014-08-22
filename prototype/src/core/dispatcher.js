var _ = require('underscore');
var d3 = require('d3');
var assert = require('assert');
var bus = (function() {
  var channels = {};

  var assertNoActionRedefinition = function(chan, action){
    assert(!_.has(chan, action), 'Action "' + action + '" is already defined.');
  }

  var assertActionIsDefined = function(chan, action) {
    assert(_.has(chan, action), 'Action "' + action + '" is not defined.');
  }

  return {
    subscribe: function(channel, action, handler) {
      var chan = channels[channel] || (channels[channel] = {});
      assertNoActionRedefinition(chan, action);
      chan[action] = handler;
    },
    publish: function(channel, action) {
      var chan = channels[channel];
      assertActionIsDefined(chan, action);
      var args = Array.prototype.slice.call(arguments);
      chan[action].apply(chan[action], args.slice(2));
    }
  }
}());


/*
To be documented

c = sszvis.actions.register('log', function(d){ console.log('log:', d); });
c.log('arrr1')
c.trigger('log', 'T')
sszvis.actions.trigger('log', 'arrr2');

ce = sszvis.actions.channel('extra').register('log', function(d){ console.log('extra:', d); });
ce.log('arrr1')
ce.trigger('log', 'T')
sszvis.actions.channel('extra').trigger('log', 'arrr2');

*/


var DEFAULT_CHANNEL = 'default';

module.exports = {
  channel: function(channel) {
    return {
      register: _.partial(registerAction, channel),
      trigger:  _.partial(triggerAction,  channel)
    }
  },
  register: _.partial(registerAction, DEFAULT_CHANNEL),
  trigger:  _.partial(triggerAction,  DEFAULT_CHANNEL)
}

function registerAction(channel, action, handler) {
  return actionChain({})(channel, action, handler);
}

function triggerAction(channel, action) {
  var args = Array.prototype.slice.call(arguments);
  bus.publish.apply(bus, [channel, action].concat(args.slice(2)));
}

function actionChain(chain) {
  return function(channel, action, handler) {
    bus.subscribe(channel, action, handler);
    chain[action] = handler;
    chain.register = _.partial(actionChain(_.clone(chain)), channel);
    chain.trigger  = _.partial(triggerAction, channel);
    return chain;
  }
}
