/**
 * Formatting functions
 *
 * @module sszvis/format
 */
sszvis_namespace('sszvis.format', function(module) {
  'use strict';

  var format = module.exports = {
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
    month: sszvis.fn.compose(function(m) {
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
     * - Two significant decimal places for other numbers
     *
     * See also: many test cases for this function in sszvis.test
     *
     * @param  {number} d   Number
     * @param  {number} [p] Decimal precision
     * @return {string}     Fully formatted number
     */
    number: function(d, p) {
      var pdefined = sszvis.fn.defined(p);
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

      // 10250    -> "10 250"
      // 10250.91 -> "10 251"
      else if (dAbs >= 1e4) {
        pdefined || (p = 0);
        // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
        // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
        return d3.format(',.'+ p +'f')(d);
      }

      // 2350     -> "2350"
      // 2350.29  -> "2350.3"
      else if (dAbs >= 100) {
        pdefined || (p = decLen === 0 ? 0 : 1);
        // Where there are decimals, round to 1 position
        // To display more precision, provide an explicit precision parameter.
        return d3.format('.'+ p +'f')(d);
      }

      // 41       -> "41"
      // 41.329   -> "41.33"
      // 1.329    -> "1.33"
      // 0.00034  -> "0.00034"
      // 41, 3    -> "41.000"
      // 0.042, 5 -> "0.04200"
      else if (dAbs > 0) {
        var pf;
        if (pdefined) {
          pf = p + 'f';
        } else {
          // The 'r' formatter rounds total digits, not just decimal digits
          // the 'f' formatter rounds decimal digits
          // see https://github.com/mbostock/d3/wiki/Formatting
          // This means that when decLen is 0, it rounds off the number. When there are some decimals,
          // rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
          // but not more. To display more precision, provide a precision parameter.
          pf = decLen === 0 ? '0f' : (integerPlaces(d) + Math.min(2, decLen)) + 'r';
        }
        return d3.format('.' + pf)(d);
      }

      // If abs(num) is not > 0, num is 0
      // 0       -> "0"
      // 0, 3    -> "0.000"
      else {
        pdefined || (p = 0);
        return d3.format('.' + p + 'f')(0);
      }
    },

    /**
     * Format percentages
     * @param  {number} d A fraction, usually between 0 and 1
     * @return {string}
     */
    percent: function(d) {
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


  /* Helper functions
  ----------------------------------------------- */
  function decimalPlaces(num) {
    return (String(Math.abs(num)).split('.')[1] || '').length;
  }

  function integerPlaces(num) {
    num = Math.floor(Math.abs(+num));
    return String(num === 0 ? '' : num).length;
  }

});
