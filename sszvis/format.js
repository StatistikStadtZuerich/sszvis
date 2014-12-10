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
     * @param  {number} d   Number
     * @param  {number} [p] Decimal precision
     * @return {string}     Fully formatted number
     */
    number: function(d, p) {
      var def = sszvis.fn.defined;
      var dAbs = Math.abs(d);
      var natLen = integerPlaces(d);
      var decLen = decimalPlaces(d);

      // NaN
      if (isNaN(d)) {
        return '–';
      }

      // 10250    -> "10 250"
      // 10250.91 -> "10 251"
      else if (dAbs >= 1e4) {
        def(p) || (p = 0);
        return removeTrailingZeroes(d3.format(',.'+ p +'f')(d));
      }

      // 2350     -> "2350"
      // 2350.29  -> "2350.3"
      else if (dAbs >= 100) {
        if (!def(p)) {
          p = (decLen === 0) ? 0 : 1;
        }
        return removeTrailingZeroes(d3.format('.'+ p +'f')(d));
      }

      // 41       -> "41"
      // 41.329   -> "41.33"
      //  1.329   -> "1.33"
      //  0.00034 -> "0.00034"
      else if (dAbs > 0) {
        var f;
        if (!def(p)) {
          p = (decLen === 0) ? 0 : natLen + Math.min(2, decLen);
          f = p > 0 ? 'r' : 'f';
        } else {
          f = 'f';
        }
        return removeTrailingZeroes(d3.format('.'+ p + f)(d));
      }

      //  0       -> "0"
      else {
        return String(0);
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

  function removeTrailingZeroes(num) {
    return String(num).replace(/([0-9]+)(\.)([0-9]*)0+$/, function(all, nat, dot, dec) {
      if (parseInt(dec) === 0) dec = '';
      return dec.length > 0 ? nat + dot + dec : nat;
    });
  }

});
