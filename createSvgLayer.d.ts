/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createSvgLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 * @param {object} [metadata] Metadata for this chart. Can include any number of the following:
 *   @property {string} key Used as a unique key for this layer. If you pass different values
 *                          of key to this function, the app will create and return different layers.
 *                          If you pass the same value (including undefined), you will always get back
 *                          the same DOM element. This is useful for adding multiple SVG elements.
 *                          See the binned raster map for an example of using this effectively.
 *                          Note: For more information about this argument, see the detailed explanation in
 *                          the source code for createHtmlLayer.
 *
 * @returns {d3.selection}
 */
import type { BoundsResult } from "./bounds.js";
import type { AnySelection, SelectableElement } from "./types.js";
export interface SvgLayerMetadata {
    key?: string;
    title?: string;
    description?: string;
}
export declare function createSvgLayer(selector: SelectableElement, bounds?: BoundsResult, metadata?: SvgLayerMetadata): AnySelection;
//# sourceMappingURL=createSvgLayer.d.ts.map