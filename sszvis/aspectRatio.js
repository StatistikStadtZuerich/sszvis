/**
 * Functions related to aspect ratio calculations
 * 
 * @module sszvis/aspectRatio
 *
 * The base module is a function which creates an aspect ratio function.
 * You provide a width and a height of the aspect ratio,
 * and the returned function accepts any width, returning the corresponding
 * height for the aspect ratio you configured.
 * 
 * @param {Number} width    The width of the aspect ratio.
 * @param {Number} height   The height of the aspect ratio.
 * @return {Function}       The aspect ratio function. Provide a width and
 *                          it returns a corresponding height.
 */
sszvis_namespace('sszvis.aspectRatio', function(module) {
  'use strict';

  var aspectRatio = module.exports = function(width, height) {
    var ar = width / height;
    return function(w) { return w / ar; };
  };

  var ar16to9 = aspectRatio(16, 9);

  /**
   * aspectRatio.default
   *
   * A property on the aspectRatio module, provides a set of default aspect
   * ratios for different widths. If you provide a width, it will provide the
   * default value of the height for that width. Note that the aspect ratio chosen
   * may depend on the width itself. This is because of default breakpoints.
   * 
   * @param  {Number} width   The width for which you want a height value
   * @return {Number}         The height which corresponds to the default aspect ratio for that width
   */
  module.exports.default = function(width) {
    if (width < sszvis.breakpoint.SMALL) {
      return ar16to9(width);
    } else if (width >= sszvis.breakpoint.SMALL && width < sszvis.breakpoint.NARROW) {
      return ar16to9(width);
    } else if (width >= sszvis.breakpoint.NARROW && width < sszvis.breakpoint.TABLET) {
      return ar16to9(width);
    } else if (width >= sszvis.breakpoint.TABLET && width < sszvis.breakpoint.NORMAL) {
      return ar16to9(width);
    } else if (width >= sszvis.breakpoint.NORMAL && width < sszvis.breakpoint.WIDE) {
      return ar16to9(width);
    } else { // width >= sszvis.breakpoint.WIDE
      return ar16to9(width);
    }
  };

});
