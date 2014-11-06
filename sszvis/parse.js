/**
 * Parsing functions
 *
 * @module sszvis/parse
 */
namespace('sszvis.parse', function(module) {

  var yearParser = d3.time.format("%Y");

  module.exports = {
    /**
     * Parse Swiss date strings
     * @param  {String} d A Swiss date string, e.g. 17.08.2014
     * @return {Date}
     */
    date: function(d) {
      return d3.time.format("%d.%m.%Y").parse(d);
    },

    year: function(d) {
      return yearParser.parse(d);
    },

    /**
     * Parse untyped input
     * @param  {String} d A value that could be a number
     * @return {Number}   If d is not a number, NaN is returned
     */
    number: function(d) {
      return (d.trim() === '') ? NaN : +d;
    }
  }

});
