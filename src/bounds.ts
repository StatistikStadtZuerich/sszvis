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

import { select } from "d3";
import { aspectRatioAuto } from "./aspectRatio.js";
import * as fn from "./fn.js";
import { measureDimensions } from "./measure.js";
import type { AnySelection, DimensionMeasurement } from "./types.js";

export interface BoundsConfig {
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BoundsResult {
  height: number;
  width: number;
  innerHeight: number;
  innerWidth: number;
  padding: Padding;
  screenWidth?: number;
  screenHeight?: number;
}

const DEFAULT_WIDTH = 516;

/**
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention.
 *
 * @param bounds Specifies the bounds of a chart area
 * @param selection A CSS selector or d3 selection that will be measured to
 *                  automatically calculate the bounds width and height using
 *                  the SSZVIS responsive aspect ratio calculation. Custom
 *                  width and height settings have priority over these automatic
 *                  calculations, so if they are defined, this argument has no effect.
 *                  This argument is optional to maintain backwards compatibility.
 *
 * @return The returned object will preserve the properties width and height, or give them default values
 *         if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
 *         and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
 *         which contains calculated or default values for top, bottom, left, and right padding.
 *         Lastly, the object includes 'screenWidth' and 'screenHeight', which are occasionally used by responsive components.
 */
export function bounds(): BoundsResult;
export function bounds(
  boundsOrSelection: BoundsConfig | string | AnySelection | HTMLElement
): BoundsResult;
export function bounds(
  bounds: BoundsConfig,
  selection: string | AnySelection | HTMLElement
): BoundsResult;
export function bounds(
  arg1?: BoundsConfig | string | AnySelection | HTMLElement,
  arg2?: string | AnySelection | HTMLElement
): BoundsResult {
  let _bounds: BoundsConfig = {};
  let selection: AnySelection | null = null;

  if (arguments.length === 0) {
    _bounds = {};
  } else if (arguments.length === 1) {
    if (fn.isObject(arg1)) {
      _bounds = arg1 as BoundsConfig;
    } else if (fn.isSelection(arg1)) {
      _bounds = {};
      selection = arg1 as AnySelection;
    } else {
      _bounds = {};
      selection = select(arg1 as string);
    }
  } else {
    _bounds = arg1 as BoundsConfig;
    selection = fn.isSelection(arg2) ? (arg2 as AnySelection) : select(arg2 as string);
  }

  // All padding sides have default values
  const padding: Padding = {
    top: either(_bounds.top, 0),
    right: either(_bounds.right, 1),
    bottom: either(_bounds.bottom, 0),
    left: either(_bounds.left, 1),
  };

  // Width is calculated as: _bounds.width (if provided) -> selection.getBoundingClientRect().width (if provided) -> DEFAULT_WIDTH
  const dimensions: DimensionMeasurement = fn.defined(selection)
    ? measureDimensions(selection)
    : { width: DEFAULT_WIDTH, screenWidth: window.innerWidth, screenHeight: window.innerHeight };

  const width = either(_bounds.width, dimensions.width ?? DEFAULT_WIDTH);

  // Create measurement object for aspectRatioAuto that matches the Measurement interface
  const measurement = {
    width: width,
    screenHeight: dimensions.screenHeight,
  };

  const innerHeight = aspectRatioAuto(measurement);
  const height = either(_bounds.height, innerHeight + padding.top + padding.bottom);

  return {
    innerHeight: height - padding.top - padding.bottom,
    innerWidth: width - padding.left - padding.right,
    padding,
    height,
    width,
    screenWidth: dimensions.screenWidth,
    screenHeight: dimensions.screenHeight,
  };
}

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
function either<T>(val: T | undefined, fallback: T): T {
  return val === undefined ? fallback : val;
}
