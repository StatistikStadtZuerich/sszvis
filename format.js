import { timeFormatLocale, formatLocale } from 'd3';
import { compose } from './fn.js';
import { timeLocale, formatLocale as formatLocale$1 } from './locale.js';

/**
 * Formatting functions
 *
 * @module sszvis/format
 */
const timeFormat = timeFormatLocale(timeLocale).format;
const format = formatLocale(formatLocale$1).format;
/**
 * Format a number as an age
 */
const formatAge = function (d) {
  return String(Math.round(d));
};
/**
 * A multi time formatter used by the axis class
 */
const formatAxisTimeFormat = function (d) {
  const xs = [[".%L", function (date) {
    return date.getMilliseconds();
  }], [":%S", function (date) {
    return date.getSeconds();
  }], ["%H:%M", function (date) {
    return date.getMinutes();
  }], ["%H Uhr", function (date) {
    return date.getHours();
  }], ["%a., %d.", function (date) {
    return Boolean(date.getDay() && date.getDate() != 1);
  }], ["%e. %b", function (date) {
    return date.getDate() != 1;
  }], ["%B", function (date) {
    return date.getMonth();
  }], ["%Y", function () {
    return true;
  }]];
  for (const x of xs) {
    if (x[1](d)) {
      return timeFormat(x[0])(d);
    }
  }
  // Fallback - should never happen, but TypeScript requires a return
  return timeFormat("%Y")(d);
};
/**
 * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
 */
const formatMonth = compose(m => m.toUpperCase(), timeFormat("%b"));
/**
 * A year formatter for date objects. Gives the date's year.
 */
const formatYear = timeFormat("%Y");
/**
 * Formatter for no label
 */
const formatNone = function () {
  return "";
};
/**
 * Format numbers according to the sszvis style guide. The most important
 * rules are:
 *
 * - Thousands separator is a thin space (not a space)
 * - Only apply thousands separator for numbers >= 10000
 * - Decimal places only for significant decimals
 * - No decimal places for numbers >= 10000
 * - One decimal place for numbers >= 100
 * - Up to 2 significant decimal places for smaller numbers
 *
 * See also: many test cases for this function in format.test.js
 */
const formatNumber = function (d) {
  let p;
  const dAbs = Math.abs(d !== null && d !== void 0 ? d : 0);
  if (d == null || isNaN(d)) {
    return "–"; // This is an en-dash
  }
  // 10250    -> "10 250"
  // 10250.91 -> "10 251"
  else if (dAbs >= 1e4) {
    // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
    // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
    return format(",.0f")(d);
  }
  // 2350     -> "2350"
  // 2350.29  -> "2350.3"
  else if (dAbs >= 100) {
    p = Math.min(1, decimalPlaces(d));
    // Where there are decimals, round to 1 position
    // To display more precision, use the preciseNumber function.
    return stripTrailingZeroes(format("." + p + "f")(d));
  }
  // 41       -> "41"
  // 41.1     -> "41.1"
  // 41.329   -> "41.33"
  else if (dAbs > 0) {
    p = Math.min(2, decimalPlaces(d));
    // Rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
    // but not more. To display more precision, use the preciseNumber function.
    return stripTrailingZeroes(format("." + p + "f")(d));
  }
  // If abs(num) is not > 0, num is 0
  // 0       -> "0"
  else {
    return format(".0f")(0);
  }
};
function formatPreciseNumber(p, d) {
  // This curries the function
  if (arguments.length > 1 && d !== undefined) return formatPreciseNumber(p)(d);
  return function (x) {
    const dAbs = Math.abs(x);
    return dAbs >= 100 && dAbs < 1e4 ? format("." + p + "f")(x) : format(",." + p + "f")(x);
  };
}
/**
 * Format percentages on the range 0 - 100
 */
const formatPercent = function (d) {
  // Uses unix thin space
  return formatNumber(d) + " %";
};
/**
 * Format percentages on the range 0 - 1
 */
const formatFractionPercent = function (d) {
  // Uses unix thin space
  return formatNumber(d * 100) + " %";
};
/**
 * Default formatter for text
 */
const formatText = String;
/* Helper functions
----------------------------------------------- */
// decLen is the number of decimal places in the number
// 0.0002 -> 4
// 0.0000 -> 0 (Javascript's number implementation chops off trailing zeroes)
// 123456.1 -> 1
// 123456.00001 -> 5
function decimalPlaces(num) {
  return (String(Math.abs(num)).split(".")[1] || "").length;
}
function stripTrailingZeroes(str) {
  return str.replace(/(\.\d*[1-9])0+$|\.0*$/, "$1");
}

export { formatAge, formatAxisTimeFormat, formatFractionPercent, formatMonth, formatNone, formatNumber, formatPercent, formatPreciseNumber, formatText, formatYear };
//# sourceMappingURL=format.js.map
