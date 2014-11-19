/**
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention. The result of this function
 * is comsumed by sszvis.createSvgLayer and sszvis.createHtmlLayer.
 *
 * @module sszvis/bounds
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
namespace('sszvis.bounds', function(module) {
  'use strict';

  var DEFAULT_WIDTH = 516;
  var RATIO = Math.sqrt(2);

  module.exports = function(bounds) {
    bounds || (bounds = {});
    var padding = {
      top:    sszvis.fn.either(bounds.top, 0),
      right:  sszvis.fn.either(bounds.right, 1),
      bottom: sszvis.fn.either(bounds.bottom, 0),
      left:   sszvis.fn.either(bounds.left, 1)
    };
    var width   = sszvis.fn.either(bounds.width, DEFAULT_WIDTH);
    var height  = sszvis.fn.either(bounds.height, Math.round(width / RATIO) + padding.top + padding.bottom);

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width
    };
  };

  module.exports.DEFAULT_WIDTH = DEFAULT_WIDTH;
  module.exports.RATIO = RATIO;

});
