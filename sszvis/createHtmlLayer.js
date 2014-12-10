/**
 * Factory that returns an HTML element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createHtmlLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} [bounds]
 *
 * @returns {d3.selection}
 */
sszvis_namespace('sszvis.createHtmlLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds) {
    bounds || (bounds = sszvis.bounds());

    var root = d3.select(selector);
    root.classed('sszvis-outer-container', true);

    var layer = root.selectAll('[data-sszvis-html-layer]').data([0]);
    layer.enter().append('div')
      .attr('data-sszvis-html-layer', '');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  };

});
