/**
 * Parsing functions
 *
 * @module sszvis/parse
 */

import { timeFormatLocale } from "d3";
import { timeLocale } from "./locale";

const timeParse = timeFormatLocale(timeLocale).parse;

/**
 * Parse Swiss date strings
 * @param  {String} d A Swiss date string, e.g. 17.08.2014
 * @return {Date}
 */
const dateParser = timeParse("%d.%m.%Y");
export const parseDate = function (d: string): Date | null {
  return dateParser(d);
};

/**
 * Parse year values
 * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
 * @return {Date}       A javascript date object for the first time in the given year
 */
const yearParser = timeParse("%Y");
export const parseYear = function (d: string): Date | null {
  return yearParser(d);
};

/**
 * Parse untyped input
 * @param  {String} d A value that could be a number
 * @return {Number}   If d is not a number, NaN is returned
 */
export const parseNumber = function (d: string): number {
  return d.trim() === "" ? Number.NaN : +d;
};
