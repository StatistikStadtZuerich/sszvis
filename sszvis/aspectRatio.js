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

  // phone portrait
  var ar4to3 = aspectRatio(4, 3);
  // phone landscape
  // tablet landscape
  var ar5to2 = aspectRatio(5, 2);
  // tablet portrait
  // desktop
  var ar16to9 = aspectRatio(16, 9);
  // Notes on dimensions in practice
  // (after SSZ website redesign): container max width: 877px
  // ipad dimensions: 768 w x 1024 h
  // iphone se dimensions: 320 w x 568 h


  /**
   * aspectRatio.default
   *
   * A property on the aspectRatio module, provides a set of default aspect
   * ratios for different widths. If you provide a set of measurements for a container
   * and the window itself, it will provide the default value of the height for that
   * container. Note that the aspect ratio chosen may depend on the container width itself.
   * This is because of default breakpoints.
   *
   * @param  {Measurements} measurement   The measurements object for the container for which you
   *                                      want a height value. Should have at least the properties:
   *                                        `width`: container's width
   *                                        `screenHeight`: the height of the window at the current time.
   *
   * @return {Number}         The height which corresponds to the default aspect ratio for these measurements
   */
  module.exports.default = function(measurement) {
    if (sszvis.breakpoint.phoneP(measurement)) { // phone portrait orientation
      return ar4to3(measurement.width);
    } else if (sszvis.breakpoint.phoneL(measurement)) { // phone landscape orientation
      return ar5to2(measurement.width);
    } else if (sszvis.breakpoint.tabletL(measurement)) { // tablet landscape orientation
      return ar5to2(measurement.width);
    } else if (sszvis.breakpoint.tabletP(measurement)) { // tablet portrait orientation
      return ar16to9(measurement.width);
    } else { // all other cases, includes desktop
      return ar16to9(measurement.width);
    }
  };

});
