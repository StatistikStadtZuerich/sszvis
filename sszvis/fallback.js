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
sszvis_namespace('sszvis.fallback', function(module) {
  'use strict';

  module.exports.unsupported = function() {
    var supportsSVG = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    return !supportsSVG;
  };

  module.exports.canvasUnsupported = function() {
    var supportsCanvas = !!document.createElement('canvas').getContext;
    return !supportsCanvas;
  };

  module.exports.render = function(selector, options) {
    options || (options = {});
    options.src    || (options.src    = 'fallback.png');
    var selection = sszvis.fn.isSelection(selector) ? selector : d3.select(selector);
    selection.append('img')
      .attr('class', 'sszvis-fallback-image')
      .attr('src', options.src);
  };

});
