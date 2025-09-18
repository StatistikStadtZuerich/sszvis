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
import type { AnySelection, SelectableElement } from "./types";

export interface FallbackOptions {
  src: string;
  height?: number;
}

export const fallbackUnsupported = (): boolean => {
  const supportsSVG =
    !!document.createElementNS &&
    !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
  return !supportsSVG;
};

export const fallbackCanvasUnsupported = (): boolean => {
  const supportsCanvas = !!document.createElement("canvas").getContext;
  return !supportsCanvas;
};

export const fallbackRender = (
  selector: SelectableElement,
  options: FallbackOptions = { src: "fallback.png" }
): void => {
  const selection: AnySelection = fn.isSelection(selector) ? selector : select(selector);
  selection.append("img").attr("class", "sszvis-fallback-image").attr("src", options.src);
};
