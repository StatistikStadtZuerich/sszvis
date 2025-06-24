import { select } from 'd3';
import { isSelection } from './fn.js';
import { bounds } from './bounds.js';

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

function createSvgLayer(selector, bounds$1, metadata) {
  bounds$1 || (bounds$1 = bounds());
  metadata || (metadata = {});
  const key = metadata.key || "default";
  const elementDataKey = "data-sszvis-svg-" + key;
  const title = metadata.title || "";
  const description = metadata.description || "";
  const root = isSelection(selector) ? selector : select(selector);
  const svg = root.selectAll("svg[" + elementDataKey + "]").data([0]).join("svg").classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img").attr("aria-label", title + " – " + description).attr("height", bounds$1.height).attr("width", bounds$1.width);
  svg.selectAll("title").data([0]).join("title").text(title);
  svg.selectAll("desc").data([0]).join("desc").text(description).classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img");
  return svg.selectAll("[data-sszvis-svg-layer]").data(() => [0]).join("g").attr("data-sszvis-svg-layer", "").attr("transform", "translate(" + bounds$1.padding.left + "," + bounds$1.padding.top + ")");
}

export { createSvgLayer };
//# sourceMappingURL=createSvgLayer.js.map
