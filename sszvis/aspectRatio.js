/**
 * Functions related to aspect ratio calculations. An "auto" function is
 * provided and should be used in most cases to find the recommended
 * aspect ratio.
 *
 * @module sszvis/aspectRatio
 */
sszvis_namespace('sszvis.aspectRatio', function(module) {
  'use strict';

  /**
   * aspectRatio
   *
   * The base module is a function which creates an aspect ratio function.
   * You provide a width and a height of the aspect ratio, and the
   * returned function accepts any width, returning the corresponding
   * height for the aspect ratio you configured.
   *
   * @param {Number} x  The number of parts on the horizontal axis (dividend)
   * @param {Number} y  The number of parts on the vertical axis (divisor)
   * @return {Function} The aspect ratio function. Takes a width as an argument
   *                    and returns the corresponding height based on the
   *                    aspect ratio defined by x:y.
   */
  function aspectRatio(x, y) {
    var ar = x / y;
    return function(width) { return width / ar; };
  };

  /**
   * aspectRatio.ar4to3
   *
   * Recommended breakpoints:
   *   - phoneP
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar4to3 = aspectRatio(4, 3);

  /**
   * aspectRatio.ar5to2
   *
   * Recommended breakpoints:
   *   - phoneL
   *   - tabletL
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar5to2 = aspectRatio(5, 2);

  /**
   * aspectRatio.ar16to9
   *
   * Recommended breakpoints:
   *   - tabletP
   *   - desktop
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar16to9 = aspectRatio(16, 9);

  /**
   * aspectRatio.auto
   *
   * Provides a set of default aspect ratios for different widths. If you provide a set
   * of measurements for a container and the window itself, it will provide the default
   * value of the height for that container. Note that the aspect ratio chosen may
   * depend on the container width itself. This is because of default breakpoints.
   *
   * @param  {Measurement} measurement The measurements object for the container for which you
   *                                   want a height value. Should have at least the properties:
   *                                     - `width`: container's width
   *                                     - `screenHeight`: the height of the window at the current time.
   *
   * @return {Number} The height which corresponds to the default aspect ratio for these measurements
   */
  var auto = (function() {
    var defaultAspectRatios = {
      phoneP:   ar4to3, // phone portrait orientation
      phoneL:   ar5to2, // phone landscape orientation
      tabletP: ar16to9, // tablet portrait orientation
      tabletL:  ar5to2, // tablet landscape orientation
      _:       ar16to9  // all other cases, includes desktop
    };
    return function(measurement) {
      var bp = sszvis.breakpoint.find(sszvis.breakpoint.defaultSpec(), measurement);
      var ar = defaultAspectRatios[bp.name];
      return ar(measurement.width);
    };
  }());


  // Exports

  module.exports         = aspectRatio;
  module.exports.ar4to3  = ar4to3;
  module.exports.ar5to2  = ar5to2;
  module.exports.ar16to9 = ar16to9;
  module.exports.auto    = auto;

});
