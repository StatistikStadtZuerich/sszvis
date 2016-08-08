/**
 * Resize behavior
 *
 * The resize behavior can be used for alerting user code to changes in the browser window size.
 * This includes window resizing behavior on desktop computers and browsers, but also orientation
 * changes on mobile browsers. Functions which listen to the 'resize' event of a resize behavior
 * component will be fired on window resize. You can add a resize listener to your application
 * very easily:
 *
 * sszvis.behavior.resize().on('resize', listenerFunction);
 *
 * The listener function will be called once per resize event, but at a slight delay. This is because,
 * while a user is resizing their browser window, many resize events can fire very quickly. This component
 * automatically throttles the rate at which the listener function is called, since you probably don't need
 * to respond to every single resize event. This throttling provides for a smoother user experience as they
 * resize the browser, and increases performance across the board. The listener function will always be
 * called after one or more window resize events, it just won't be called as often as the window fires the
 * events.
 *
 * @module sszvis/behavior/resize
 * 
 * @property {string, function} on      the .on() method is used to listen to the resize event itself.
 *                                      There is only one event supported by this behavior component, so
 *                                      the first argument to .on must be 'resize' for it to have any effect.
 *                                      Although this is somewhat redundant, it is done to keep this component's
 *                                      API in line with the other behavior components.
 * 
 * @return {Object}
 */
sszvis_namespace('sszvis.behavior.resize', function(module) {
  'use strict';

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

  module.exports = function() {
    var event = d3.dispatch('resize');

    // You don't need to call resize that often. Throttle wait time set to .5 seconds
    d3.select(window).on('resize', throttle(500, event.resize));

    return event;
  };

});
