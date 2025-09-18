/**
 * Fallback handling
 *
 * Defaults to rendering a fallback image with standard chart proportions.
 *
 * @example
 * if (sszvis.fallback.unsupported()) {
 *   sszvis.fallback.render('#sszvis-chart', {src: '../fallback.png', height: 300});
 *   return;
 * }
 *
 * @module sszvis/fallback
 */

import { select } from "d3";
import * as fn from "./fn";
import { AnySelection, SelectableElement } from "./types";

/**
 * Options for fallback image rendering
 */
export interface FallbackOptions {
  src?: string;
  height?: number;
}

/**
 * Check if the browser supports SVG
 * @returns {boolean} True if SVG is not supported
 */
export const fallbackUnsupported = function (): boolean {
  const supportsSVG =
    !!document.createElementNS &&
    !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
  return !supportsSVG;
};

/**
 * Check if the browser supports Canvas
 * @returns {boolean} True if Canvas is not supported
 */
export const fallbackCanvasUnsupported = function (): boolean {
  const supportsCanvas = !!document.createElement("canvas").getContext;
  return !supportsCanvas;
};

/**
 * Render a fallback image when SVG is not supported
 * @param selector CSS selector string or d3 selection
 * @param options Configuration options for the fallback image
 */
export const fallbackRender = function (
  selector: SelectableElement,
  options: FallbackOptions = {}
): void {
  const { src = "fallback.png" } = options;
  let selection: AnySelection;

  if (fn.isSelection(selector)) {
    selection = selector;
  } else {
    selection = select(selector as string);
  }

  selection.append("img").attr("class", "sszvis-fallback-image").attr("src", src);
};
