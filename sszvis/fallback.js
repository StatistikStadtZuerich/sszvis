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
namespace('sszvis.fallback', function(module) {
  'use strict';

  module.exports.unsupported = function() {
    var supportsSVG = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    return !supportsSVG;
  };

  module.exports.render = function(selector, options) {
    options || (options = {});
    options.src    || (options.src    = 'fallback.png');
    options.height || (options.height = 365);
    options.width  || (options.width  = 516);
    d3.select(selector).append('img')
      .attr('src', options.src)
      .style('height', options.height + 'px')
      .style('width', options.width + 'px');
  };

});
