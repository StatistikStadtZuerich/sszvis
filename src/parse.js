/**
 * Parsing functions
 *
 * @module sszvis/parse
 */

import { timeFormatLocale } from "d3";
import { locale } from "./locale.js";

var timeParse = timeFormatLocale(locale).parse;

/**
 * Parse Swiss date strings
 * @param  {String} d A Swiss date string, e.g. 17.08.2014
 * @return {Date}
 */
var dateParser = timeParse("%d.%m.%Y");
export var parseDate = function(d) {
  return dateParser(d);
};

/**
 * Parse year values
 * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
 * @return {Date}       A javascript date object for the first time in the given year
 */
var yearParser = timeParse("%Y");
export var parseYear = function(d) {
  return yearParser(d);
};

/**
 * Parse untyped input
 * @param  {String} d A value that could be a number
 * @return {Number}   If d is not a number, NaN is returned
 */
export var parseNumber = function(d) {
  return d.trim() === "" ? NaN : +d;
};
