/**
 * Bounds
 *
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention. The result of this function
 * is consumed by sszvis.createSvgLayer and sszvis.createHtmlLayer.
 *
 * @module sszvis/bounds
 *
 * @see http://bl.ocks.org/mbostock/3019563
 *
 * @property {number} DEFAULT_WIDTH The default width used across all charts
 * @property {number} RATIO The default side length ratio
 *
 * @param {Object} bounds Specifies the bounds of a chart area. Valid properties are:
 *   @property {number} bounds.width The total width of the chart (default: DEFAULT_WIDTH)
 *   @property {number} bounds.height The total height of the chart (default: height / RATIO)
 *   @property {number} bounds.top Top padding (default: 0)
 *   @property {number} bounds.left Left padding (default: 1)
 *   @property {number} bounds.bottom Bottom padding (default: 0)
 *   @property {number} bounds.right Right padding (default: 1)
 * @param {string|d3.selection} [selection] A CSS selector or d3 selection that will be measured to
 *                                          automatically calculate the bounds width and height using
 *                                          the SSZVIS responsive aspect ratio calculation. Custom
 *                                          width and height settings have priority over these auto-
 *                                          matic calculations, so if they are defined, this argument
 *                                          has no effect.
 *                                          This argument is optional to maintain backwards compatibility.
 *
 * @return {Object}              The returned object will preserve the properties width and height, or give them default values
 *                               if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
 *                               and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
 *                               which contains calculated or default values for top, bottom, left, and right padding.
 *                               Lastly, the object includes 'screenWidth' and 'screenHeight', which are occasionally used by responsive components.
 */
'use strict';

import d3 from 'd3';

import fn from './fn.js';
import aspectRatio from './aspectRatio.js';

var DEFAULT_WIDTH = 516;

export default function(arg1 /* bounds or selection */, arg2 /* [selection] */) {
  var bounds = null, selection = null;
  if (arguments.length === 0) {
    bounds = {};
  } else if (arguments.length === 1) {
    if (fn.isObject(arg1)) {
      bounds = arg1;
    } else if (fn.isSelection(arg1)) {
      bounds = {};
      selection = arg1;
    } else {
      bounds = {};
      selection = d3.select(arg1);
    }
  } else {
    bounds = arg1;
    if (fn.isSelection(arg2)) {
      selection = arg2;
    } else {
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
  var dimensions = fn.defined(selection) ? fn.measureDimensions(selection) : {width: DEFAULT_WIDTH};

  var width   = either( bounds.width,
                        dimensions.width );
  var innerHeight = aspectRatio.auto(dimensions);
  var height  = either( bounds.height,
                        innerHeight + padding.top + padding.bottom );

  return {
    innerHeight: height - padding.top  - padding.bottom,
    innerWidth:  width  - padding.left - padding.right,
    padding:     padding,
    height:      height,
    width:       width,
    screenWidth: dimensions.screenWidth,
    screenHeight: dimensions.screenHeight
  };
};

export { DEFAULT_WIDTH };

// This is the default aspect ratio. It is defined as: width / innerHeight
// See the Offerte document for SSZVIS 1.3, and here: https://basecamp.com/1762663/projects/10790469/todos/212434984
// To calculate the default innerHeight, do width / ASPECT_RATIO
// @deprecated Since the responsive revisions, the default aspect ratio has changed,
//             so that it is now responsive to the container width.
//             This property is preserved for compatibility reasons.
export const RATIO = 16 / 9;


/* Helper functions
----------------------------------------------- */
function either(val, fallback) {
  return (typeof val === 'undefined') ? fallback : val;
}
