/**
 * Formatting functions
 *
 * @module sszvis/format
 */
'use strict';

import d3 from 'd3';

import fn from './fn.js';

var format = {
  /**
   * Format a number as an age
   * @param  {number} d
   * @return {string}
   */
  age: function(d) {
    return String(Math.round(d));
  },

  /**
   * A multi time formatter used by the axis class
   */
  axisTimeFormat: d3.time.format.multi([
    ['.%L', function(d) { return d.getMilliseconds(); }],
    [':%S', function(d) { return d.getSeconds(); }],
    ['%H:%M', function(d) { return d.getMinutes(); }],
    ['%H Uhr', function(d) { return d.getHours(); }],
    ['%a., %d.', function(d) { return d.getDay() && d.getDate() != 1; }],
    ['%e. %b', function(d) { return d.getDate() != 1; }],
    ['%B', function(d) { return d.getMonth(); }],
    ['%Y', function() { return true; }]
  ]),

  /**
   * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
   */
  month: fn.compose(function(m) {
    return m.toUpperCase();
  }, d3.time.format('%b')),

  /**
   * A year formatter for date objects. Gives the date's year.
   */
  year: d3.time.format('%Y'),

  /**
   * Formatter for no label
   * @return {string} the empty string
   */
  none: function() {
    return '';
  },

  /**
   * Format numbers according to the sszvis style guide. The most important
   * rules are:
   *
   * - Thousands separator is a thin space (not a space)
   * - Only apply thousands separator for numbers >= 10000
   * - Decimal places only for significant decimals
   * - No decimal places for numbers >= 10000
   * - One decimal place for numbers >= 100
   * - 1 or 2 significant decimal places for other numbers
   *
   * See also: many test cases for this function in sszvis.test
   *
   * @param  {number} d   Number
   * @param  {number} [p] Decimal precision
   * @return {string}     Fully formatted number
   */
  number: function(d) {
    var p;
    var dAbs = Math.abs(d);
    // decLen is the number of decimal places in the number
    // 0.0002 -> 4
    // 0.0000 -> 0 (Javascript's number implementation chops off trailing zeroes)
    // 123456.1 -> 1
    // 123456.00001 -> 5
    var decLen = decimalPlaces(d);

    // NaN      -> '–'
    if (isNaN(d)) {
      // This is an mdash
      return '–';
    }

    // 10250    -> "10 250"
    // 10250.91 -> "10 251"
    else if (dAbs >= 1e4) {
      // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
      // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
      return d3.format(',.0f')(d);
    }

    // 2350     -> "2350"
    // 2350.29  -> "2350.3"
    else if (dAbs >= 100) {
      p = decLen === 0 ? 0 : 1;
      // Where there are decimals, round to 1 position
      // To display more precision, use the preciseNumber function.
      return d3.format('.'+ p +'f')(d);
    }

    // 41       -> "41"
    // 41.329   -> "41.33"
    // 1.329    -> "1.33"
    // 0.00034  -> "0.00034"
    else if (dAbs > 0) {
      p = Math.min(2, decLen);
      // Rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
      // but not more. To display more precision, use the preciseNumber function.
      return d3.format('.' + p + 'f')(d);
    }

    // If abs(num) is not > 0, num is 0
    // 0       -> "0"
    else {
      return d3.format('.0f')(0);
    }
  },

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
  preciseNumber: function(p, d) {
    // This curries the function
    if (arguments.length > 1) return format.preciseNumber(p)(d);

    return function formatPreciseNumber(d) {
      var dAbs = Math.abs(d);
      if (dAbs >= 100 && dAbs < 1e4) {
        // No thousands separator
        return d3.format('.' + p + 'f')(d);
      } else {
        // Use the thousands separator
        return d3.format(',.' + p + 'f')(d);
      }
    };
  },

  /**
   * Format percentages on the range 0 - 100
   * @param  {number} d    A value to format, between 0 and 100
   * @return {string}      The formatted value
   */
  percent: function(d) {
    // Uses unix thin space
    return format.number(d) + ' %';
  },

  /**
   * Format percentages on the range 0 - 1
   * @param  {number} d    A value to format, between 0 and 1
   * @return {string}      The formatted value
   */
  fractionPercent: function(d) {
    // Uses unix thin space
    return format.number(d * 100) + ' %';
  },

  /**
   * Default formatter for text
   * @param  {number} d
   * @return {string} Fully formatted text
   */
  text: function(d) {
    return String(d);
  }
};


export default format;


/* Helper functions
----------------------------------------------- */
function decimalPlaces(num) {
  return (String(Math.abs(num)).split('.')[1] || '').length;
}
