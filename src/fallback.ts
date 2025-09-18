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

export interface FallbackOptions {
  src?: string;
  height?: number;
}

export const fallbackUnsupported = function (): boolean {
  const supportsSVG =
    !!document.createElementNS &&
    !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
  return !supportsSVG;
};

export const fallbackCanvasUnsupported = function (): boolean {
  const supportsCanvas = !!document.createElement("canvas").getContext;
  return !supportsCanvas;
};

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
