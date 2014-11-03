/**
 * Formatting functions
 *
 * @module sszvis/format
 */
namespace('sszvis.format', function(module) {
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
     * Formatter for no label
     * @param  {string} d datum
     * @return {string} the empty string
     */
    none: function(d) {
      return '';
    },

    /**
     * Format numbers according to the sszvis style guide.
     * @param  {number} d
     * @return {string} Fully formatted number
     */
    number: function(d) {
      if (d >= 1e4) {
        return d3.format(',')(d);
      } else if (d === 0) {
        return 0;
      } else {
        return d;
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
});
