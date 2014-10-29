/**
 * A component for logging component errors
 *
 * @module sszvis/logError
 *
 * @param {String} The error message to log
 */
namespace('sszvis.logError', function(module) {

  var SSZVIS_MSG = 'Ein Fehler ist aufgetreten: ';

  // polyfill for console.log
  console.log = console.log || function() { /* IE8 users get no error messages */ };
  // polyfill for console.error
  console.error = console.error || function() { console.log.apply(console, arguments); };

  module.exports = function(message) {
    console.error(SSZVIS_MSG + message);
    return false;
  };

});
