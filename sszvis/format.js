/**
 * Formatting functions
 *
 * @module sszvis/format
 */
namespace('sszvis.format', function(module) {

  module.exports = (function() {
    return {
      /**
       * Default formatter for text
       * @param  {Number} d
       * @return {String}   Fully formatted text
       */
      text: function(d) {
        return String(d);
      },

      /**
       * formatter for no label
       * @param  {String} d datum
       * @return {String} the empty string
       */
      none: function(d) {
        return '';
      },

      /**
       * Format numbers according to the sszvis style guide
       * @param  {Number} d
       * @return {String} Fully formatted number
       */
      number: function(d) {
        if (d >= 1e4) {
          return d3.format(',.2r')(d);
        } else if (d === 0) {
          return 0;
        } else {
          return d3.format('.2r')(d);
        }
      },

      age: function(d) {
        return String(Math.round(d));
      },

      percent: function(d) {
        if (d >= 1) {
          return '100%';
        } else if (d <= 0) {
          return '0%';
        } else {
          return d3.format('%')(d);
        }
      }
    }
  }());

});
