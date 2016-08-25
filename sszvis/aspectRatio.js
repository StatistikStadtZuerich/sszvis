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
   *   - palm
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar4to3 = aspectRatio(4, 3);

  /**
   * aspectRatio.ar16to10
   *
   * Recommended breakpoints:
   *   - lap
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar16to10 = aspectRatio(16, 10);

  /**
   * aspectRatio.ar12to5
   *
   * Recommended breakpoints:
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var ar12to5 = aspectRatio(12, 5);

  /**
   * aspectRatio.square
   *
   * This aspect ratio constrains the returned height to a maximum of 420px.
   * It is recommended to center charts within this aspect ratio.
   *
   * Recommended breakpoints:
   *   - palm
   *   - lap
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var square = function(width) {
    return Math.min(aspectRatio(1, 1)(width), 420);
  };

  /**
   * aspectRatio.portrait
   *
   * This aspect ratio constrains the returned height to a maximum of 600px.
   * It is recommended to center charts within this aspect ratio.
   *
   * Recommended breakpoints:
   *   - palm
   *   - lap
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  var portrait = function(width) {
    return Math.min(aspectRatio(4, 5)(width), 600);
  };

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
      palm: ar4to3,   // palm-sized devices
      lap:  ar16to10, // lap-sized devices
      _:    ar12to5   // all other cases, including desk
    };
    return function(measurement) {
      var bp = sszvis.breakpoint.find(sszvis.breakpoint.defaultSpec(), measurement);
      var ar = defaultAspectRatios[bp.name];
      return ar(measurement.width);
    };
  }());


  // Exports

  module.exports            = aspectRatio;
  module.exports.ar4to3     = ar4to3;
  module.exports.ar16to10   = ar16to10;
  module.exports.ar12to5    = ar12to5;
  module.exports.square   = square;
  module.exports.portrait = portrait;
  module.exports.auto       = auto;

});
