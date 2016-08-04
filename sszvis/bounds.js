/**
 * Bounds
 *
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention. The result of this function
 * is comsumed by sszvis.createSvgLayer and sszvis.createHtmlLayer.
 *
 * @module sszvis/bounds
 *
 * @see http://bl.ocks.org/mbostock/3019563
 *
 * @property {number} DEFAULT_WIDTH The default width used across all charts
 * @property {number} RATIO The default side length ratio
 *
 * @param  {Object} bounds       Specifies the bounds of a chart area. Valid properties are:
 *                               width: the total width of the chart (default: DEFAULT_WIDTH)
 *                               height: the total height of the chart (default: height / RATIO)
 *                               top: top padding (default: 0)
 *                               left: left padding (default: 1)
 *                               bottom: bottom padding (default: 0)
 *                               right: right padding (default: 1)
 * @return {Object}              The returned object will preserve the properties width and height, or give them default values
 *                               if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
 *                               and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
 *                               which contains calculated or default values for top, bottom, left, and right padding.
 */
sszvis_namespace('sszvis.bounds', function(module) {
  'use strict';

  // This is the default width (not to be confused with innerWidth)
  // the default innerWidth is calculated as width - leftpadding - rightpadding
  var DEFAULT_WIDTH = 516;

  module.exports = function(arg1, arg2) {
    var bounds = null, selection = null;
    if (arguments.length === 0) {
      bounds = {};
    }
    if (arguments.length === 1) {
      if (sszvis.fn.isSelection(arg1)) {
        bounds = {};
        selection = arg1;
      } else if (sszvis.fn.isString(arg1)) {
        bounds = {};
        selection = d3.select(arg1);
      } else if (sszvis.fn.isObject(arg1)) {
        bounds = arg1;
      }
    }
    if (arguments.length === 2) {
      bounds = arg1;
      if (sszvis.fn.isSelection(arg2)) {
        selection = arg2;
      } else if (sszvis.fn.isString(arg2)) {
        selection = d3.select(arg2);
      }
    }

    // All padding sides have default values
    var padding = {
      top:    either(bounds.top, 0),
      right:  either(bounds.right, 1),
      bottom: either(bounds.bottom, 0),
      left:   either(bounds.left, 1)
    };

    // Width is calculated as: bounds.width (if provided) -> selection.getBoundingClientRect().width (if provided) -> DEFAULT_WIDTH
    var width   = either(bounds.width, either(sszvis.fn.selectionWidth(selection), DEFAULT_WIDTH));
    // The first term (inside Math.round) is the default innerHeight calculation
    var height  = either(bounds.height, sszvis.aspectRatio.default({ containerWidth: width, screenHeight: window.innerHeight }) + padding.top + padding.bottom);

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width
    };
  };

  module.exports.DEFAULT_WIDTH = DEFAULT_WIDTH;

  // This is the default aspect ratio. It is defined as: width / innerHeight
  // See the Offerte document for SSZVIS 1.3, and here: https://basecamp.com/1762663/projects/10790469/todos/212434984
  // To calculate the default innerHeight, do width / ASPECT_RATIO
  // Since the responsive revisions, the default aspect ratio has changed,
  // so that it is now responsive to the container width.
  // This property is preserved for compatibility reasons.
  module.exports.RATIO = 16 / 9;

  /* Helper functions
  ----------------------------------------------- */
  function either(val, fallback) {
    return (typeof val === 'undefined') ? fallback : val;
  }

});
