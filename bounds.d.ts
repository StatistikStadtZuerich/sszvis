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
import type { AnySelection } from "./types.js";
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
declare const DEFAULT_WIDTH = 516;
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
export declare function bounds(): BoundsResult;
export declare function bounds(boundsOrSelection: BoundsConfig | string | AnySelection): BoundsResult;
export declare function bounds(bounds: BoundsConfig, selection: string | AnySelection): BoundsResult;
export { DEFAULT_WIDTH };
export declare const RATIO: number;
//# sourceMappingURL=bounds.d.ts.map