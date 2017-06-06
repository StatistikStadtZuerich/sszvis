/**
 * Parsing functions
 *
 * @module sszvis/parse
 */

import d3 from 'd3';

/**
 * Parse Swiss date strings
 * @param  {String} d A Swiss date string, e.g. 17.08.2014
 * @return {Date}
 */
var dateParser = d3.timeParse('%d.%m.%Y');
export var date = function(d) {
  return dateParser(d);
}

/**
 * Parse year values
 * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
 * @return {Date}       A javascript date object for the first time in the given year
 */
var yearParser = d3.timeParse('%Y');
export var year = function(d) {
  return yearParser(d);
};

/**
 * Parse untyped input
 * @param  {String} d A value that could be a number
 * @return {Number}   If d is not a number, NaN is returned
 */
export var number = function(d) {
  return (d.trim() === '') ? NaN : +d;
}
