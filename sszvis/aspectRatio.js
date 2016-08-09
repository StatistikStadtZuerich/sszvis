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

  // iPhone SE portrait
  var ar4to3 = aspectRatio(4, 3);
  // iPhone SE landscape
  // iPad landscape
  var ar5to2 = aspectRatio(5, 2);
  // iPad portrait
  // Desktop
  var ar16to9 = aspectRatio(16, 9);
  // container max width: 877px
  // ipad dimensions: 768 w x 1024 h
  // iphone se dimensions: 320 w x 568 h


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
  module.exports.default = function(params) {
    var width = params.containerWidth;
    var height = params.screenHeight;
    if (width < 321) { // iPhone SE portrait
      return ar4to3(width);
    } else if (width >= 321 && width < 569) { // iPhone SE landscape
      return ar5to2(width);
    } else if (width >= 569 && width < 769) { // iPad portrait
      return ar16to9(width);
    } else if (width >= 769 && width < 1025 && height < 769) { // iPad landscape
      return ar5to2(width);
    } else { // Desktop
      return ar16to9(width);
    }
  };

});
