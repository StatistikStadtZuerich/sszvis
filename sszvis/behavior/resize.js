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
