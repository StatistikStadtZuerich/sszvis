/**
 * Formatting functions
 *
 * @module sszvis/format
 */

// import { formatLocale, timeFormatLocale } from "d3";
import { formatLocale } from "d3-format";
import { timeFormatLocale } from "d3-time-format";
import * as fn from "./fn.js";
import { locale } from "./locale.js";

var timeFormat = timeFormatLocale(locale).format;
var format = formatLocale(locale).format;

/**
 * Format a number as an age
 * @param  {number} d
 * @return {string}
 */
export var formatAge = function (d) {
  return String(Math.round(d));
};

/**
 * A multi time formatter used by the axis class
 */
export var formatAxisTimeFormat = function (d) {
  var xs = [
    [
      ".%L",
      function (date) {
        return date.getMilliseconds();
      },
    ],
    [
      ":%S",
      function (date) {
        return date.getSeconds();
      },
    ],
    [
      "%H:%M",
      function (date) {
        return date.getMinutes();
      },
    ],
    [
      "%H Uhr",
      function (date) {
        return date.getHours();
      },
    ],
    [
      "%a., %d.",
      function (date) {
        return date.getDay() && date.getDate() != 1;
      },
    ],
    [
      "%e. %b",
      function (date) {
        return date.getDate() != 1;
      },
    ],
    [
      "%B",
      function (date) {
        return date.getMonth();
      },
    ],
    [
      "%Y",
      function () {
        return true;
      },
    ],
  ];

  for (var i = 0; i < xs.length; ++i) {
    if (xs[i][1](d)) {
      return timeFormat(xs[i][0])(d);
    }
  }
};

/**
 * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
 */
export var formatMonth = fn.compose(function (m) {
  return m.toUpperCase();
}, timeFormat("%b"));

/**
 * A year formatter for date objects. Gives the date's year.
 */
export var formatYear = timeFormat("%Y");

/**
 * Formatter for no label
 * @return {string} the empty string
 */
export var formatNone = function () {
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
 *
 * @param  {number} d   Number
 * @return {string}     Fully formatted number
 */
export var formatNumber = function (d) {
  var p;
  var dAbs = Math.abs(d);

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

/**
 * Format numbers to a particular precision. This function is "curried", meaning that it is a function with
 * multiple arguments, but when you call it with less than the full number of arguments, it returns a function
 * that takes less arguments and has the arguments you did provide "pre-filled" as parameters. So that means that:
 *
 * preciseNumber(2, 14.1234) -> "14.12"
 * preciseNumber(2) -> function that accepts numbers and returns formatted values
 *
 * Note that preciseNumber(2, 14.1234) is equivalent to preciseNumber(2)(14.1234)
 *
 * @param  {Number} p           The desired precision
 * @param  {Number} d           The number to be formatted
 * @return {String}             The formatted number
 */
export var formatPreciseNumber = function (p, d) {
  // This curries the function
  if (arguments.length > 1) return formatPreciseNumber(p)(d);

  return function (x) {
    var dAbs = Math.abs(x);
    if (dAbs >= 100 && dAbs < 1e4) {
      // No thousands separator
      return format("." + p + "f")(x);
    } else {
      // Use the thousands separator
      return format(",." + p + "f")(x);
    }
  };
};

/**
 * Format percentages on the range 0 - 100
 * @param  {number} d    A value to format, between 0 and 100
 * @return {string}      The formatted value
 */
export var formatPercent = function (d) {
  // Uses unix thin space
  return formatNumber(d) + " %";
};

/**
 * Format percentages on the range 0 - 1
 * @param  {number} d    A value to format, between 0 and 1
 * @return {string}      The formatted value
 */
export var formatFractionPercent = function (d) {
  // Uses unix thin space
  return formatNumber(d * 100) + " %";
};

/**
 * Default formatter for text
 * @param  {number} d
 * @return {string} Fully formatted text
 */
export var formatText = function (d) {
  return String(d);
};

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
  return str.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
}
