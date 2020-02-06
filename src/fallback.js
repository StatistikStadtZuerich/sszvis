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

import * as fn from "./fn.js";

export var fallbackUnsupported = function() {
  var supportsSVG =
    !!document.createElementNS &&
    !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
  return !supportsSVG;
};

export var fallbackCanvasUnsupported = function() {
  var supportsCanvas = !!document.createElement("canvas").getContext;
  return !supportsCanvas;
};

export var fallbackRender = function(selector, options) {
  options || (options = {});
  options.src || (options.src = "fallback.png");
  var selection = fn.isSelection(selector) ? selector : select(selector);
  selection
    .append("img")
    .attr("class", "sszvis-fallback-image")
    .attr("src", options.src);
};
