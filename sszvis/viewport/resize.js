/**
 * Viewport Resize watcher
 *
 * The resize watcher in the sszvis.viewport module can be used for alerting user code to
 * changes in the browser window size. This includes window resizing on desktop computers
 * and browsers, but also orientation changes on mobile browsers. Functions which listen
 * to the 'resize' event of the sszvis.viewport module will be fired on window resize.
 * You can add a resize listener to your application very easily:
 *
 * sszvis.viewport.on('resize', listenerFunction);
 *
 * The listener function will be called once per resize event, but at a slight delay. This is because,
 * while a user is resizing their browser window, many resize events can fire very quickly. This component
 * automatically throttles the rate at which the listener function is called, since you probably don't need
 * to respond to every single resize event. This throttling provides for a smoother user experience as they
 * resize the browser, and increases performance across the board. The listener function will always be
 * called after one or more window resize events, it just won't be called as often as the window fires the
 * events.
 *
 * @module sszvis/viewport
 *
 * @function {string, function} on      the .on() function is used to listen to the resize event itself.
 *                                      There is only one event supported by this component at the moment, so
 *                                      the first argument to .on must be 'resize' for it to have any effect.
 *                                      Although this is somewhat redundant, it is done to keep this component's
 *                                      API clear and in line with other components.
 *
 * @return {Object}
 */

import d3 from 'd3';

// throttles a function to the trailing edge. Copied mostly verbatim from underscore.js
function throttle(wait, func) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  var lastCall = function() {
    previous = 0;
    result = func.apply(context, args);
    timeout = context = args = null;
  };
  return function() {
    var now = Date.now();
    if (!previous) previous = now; // Sets up so that the function isn't called immediately
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout) {
      timeout = setTimeout(lastCall, remaining);
    }
    return result;
  };
}

// This rather strange set of functions is designed to support the API:
// sszvis.viewport.on('resize', callback);
// While still enabling the user to register multiple callbacks for the 'resize'
// event. Multiple callbacks are a feature which simply returning a d3.dispatch('resize')
// object would not allow.
var callbacks = {
  resize: []
};

d3.select(window).on('resize', throttle(500, function() { trigger('resize'); }));

var on = function(name, cb) {
  if (!callbacks[name]) { callbacks[name] = []; }
  callbacks[name] = callbacks[name].filter(function(fn) { return fn !== cb; }).concat(cb);
  return this;
};

var off = function(name, cb) {
  if (!callbacks[name]) { return this; }
  callbacks[name] = callbacks[name].filter(function(fn) { return fn !== cb; });
  return this;
};

var trigger = function(name) {
  var evtArgs = Array.prototype.slice.call(arguments, 1);
  if (callbacks[name]) { callbacks[name].forEach(function(fn) { fn.apply(null, evtArgs); }); }
  return this;
};

export var viewport = {
  on: on,
  off: off,
  trigger: trigger
};
