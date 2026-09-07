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

import type { BaseType, Selection } from "d3";
import type { BoundsResult } from "./bounds.js";
import { bounds as mkBounds } from "./bounds.js";
import * as fn from "./fn.js";
import type { LayerSelection, SelectableElement } from "./types.js";

export interface SvgLayerMetadata {
  key?: string;
  title?: string;
  description?: string;
}

export function createSvgLayer<
  G extends BaseType = BaseType,
  D = unknown,
  P extends BaseType = BaseType,
  PD = unknown,
>(
  selector: SelectableElement<G, D, P, PD> | HTMLElement,
  bounds?: BoundsResult,
  metadata: SvgLayerMetadata = {}
): LayerSelection<SVGGElement, number> {
  const { padding, height, width } = bounds || mkBounds();

  const key = metadata.key || "default";
  const elementDataKey = `data-sszvis-svg-${key}`;
  const title = metadata.title || "";
  const description = metadata.description || "";

  const render = <G extends BaseType, D, P extends BaseType, PD>(
    root: Selection<G, D, P, PD>
  ): LayerSelection<SVGGElement, number> => {
    const svg = root
      .selectAll<SVGSVGElement, number>(`svg[${elementDataKey}]`)
      .data([0])
      .join<SVGSVGElement>("svg")
      .classed("sszvis-svg-layer", true)
      .attr(elementDataKey, "")
      .attr("role", "img")
      .attr("aria-label", `${title} – ${description}`)
      .attr("height", height)
      .attr("width", width);

    svg.selectAll("title").data([0]).join("title").text(title);

    svg
      .selectAll("desc")
      .data([0])
      .join("desc")
      .text(description)
      .classed("sszvis-svg-layer", true)
      .attr(elementDataKey, "")
      .attr("role", "img");

    return svg
      .selectAll<SVGGElement, number>("[data-sszvis-svg-layer]")
      .data(() => [0])
      .join<SVGGElement>("g")
      .attr("data-sszvis-svg-layer", "")
      .attr("transform", `translate(${padding.left},${padding.top})`);
  };

  return fn.withRootSelection(selector, render);
}
