/**
 * Parsing functions
 *
 * @module sszvis/parse
 */
'use strict';

var yearParser = d3.time.format('%Y');

export default {
  /**
   * Parse Swiss date strings
   * @param  {String} d A Swiss date string, e.g. 17.08.2014
   * @return {Date}
   */
  date: function(d) {
    return d3.time.format('%d.%m.%Y').parse(d);
  },

  /**
   * Parse year values
   * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
   * @return {Date}       A javascript date object for the first time in the given year
   */
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
};
