/**
 * A component for logging development messages and errors
 *
 * @module sszvis/logger
 *
 * @param {String} The message to log
 */
namespace('sszvis.logger', function(module) {
  'use strict';

  window.console || (window.console = {});

  // Polyfill for console logging
  console.log || (console.log = function() { /* IE8 users get no error messages */ });
  console.warn || (console.warn = function() { console.log.apply(console, arguments); });
  console.error || (console.error = function() { console.log.apply(console, arguments); });

  module.exports = {
    log: logger('log'),
    warn: logger('warn'),
    error: logger('error')
  };


  /* Helper functions
  ----------------------------------------------- */
  function logger(type) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      // IE9's console functions need a little bit of help
      // http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
      var log = Function.prototype.bind.call(console[type], console);
      log.apply(console, ['[sszvis]'].concat(args));
    };
  }

});
