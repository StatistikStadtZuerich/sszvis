import { timeFormatLocale } from 'd3';
import { timeLocale } from './locale.js';

/**
 * Parsing functions
 *
 * @module sszvis/parse
 */
const timeParse = timeFormatLocale(timeLocale).parse;
/**
 * Parse Swiss date strings
 * @param  {String} d A Swiss date string, e.g. 17.08.2014
 * @return {Date}
 */
const dateParser = timeParse("%d.%m.%Y");
const parseDate = d => dateParser(d);
/**
 * Parse year values
 * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
 * @return {Date}       A javascript date object for the first time in the given year
 */
const yearParser = timeParse("%Y");
const parseYear = d => yearParser(d);
/**
 * Parse untyped input
 * @param  {String} d A value that could be a number
 * @return {Number}   If d is not a number, NaN is returned
 */
const parseNumber = d => d.trim() === "" ? Number.NaN : +d;

export { parseDate, parseNumber, parseYear };
//# sourceMappingURL=parse.js.map
