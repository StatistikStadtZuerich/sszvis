import { select } from 'd3';
import { isSelection } from './fn.js';

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

const fallbackUnsupported = function () {
  const supportsSVG = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
  return !supportsSVG;
};
const fallbackCanvasUnsupported = function () {
  const supportsCanvas = !!document.createElement("canvas").getContext;
  return !supportsCanvas;
};
const fallbackRender = function (selector, options) {
  options || (options = {});
  options.src || (options.src = "fallback.png");
  const selection = isSelection(selector) ? selector : select(selector);
  selection.append("img").attr("class", "sszvis-fallback-image").attr("src", options.src);
};

export { fallbackCanvasUnsupported, fallbackRender, fallbackUnsupported };
//# sourceMappingURL=fallback.js.map
