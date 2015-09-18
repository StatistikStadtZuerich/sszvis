/**
 * Factory that returns an HTML element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createHtmlLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} [bounds]
 * @param {object} metadata Metadata for this layer. Currently the only used option is:
 *   @property {string} key Used as a unique key for this layer. If you pass different values
 *                          of key to this function, the app will create and return different layers
 *                          for inserting HTML content. If you pass the same value (including undefined),
 *                          you will always get back the same DOM element. For example, this is useful for
 *                          adding an HTML layer under an SVG, and then adding one over the SVG.
 *                          See the binned raster map for an example of using this effectively.
 *
 * @returns {d3.selection}
 */
sszvis_namespace('sszvis.createHtmlLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds, metadata) {
    bounds || (bounds = sszvis.bounds());
    metadata || (metadata = {});

    var key = metadata.key || 'default';

    var elementDataKey = 'data-sszvis-html-' + key;

    var root = d3.select(selector);
    root.classed('sszvis-outer-container', true);

    var layer = root.selectAll('[data-sszvis-html-layer][' + elementDataKey + ']').data([0]);
    layer.enter().append('div')
      .classed('sszvis-html-layer', true)
      .attr('data-sszvis-html-layer', '')
      .attr(elementDataKey, '');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  };

});
