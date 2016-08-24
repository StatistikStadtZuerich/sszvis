/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createSvgLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 * @param {object} [metadata] Metadata for this chart. Can include any number of the following:
 *   @property {string} metadata.title The chart's title
 *   @property {string} metadata.description A longer description of this chart's content
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
sszvis_namespace('sszvis.createSvgLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds, metadata) {
    bounds || (bounds = sszvis.bounds());
    metadata || (metadata = {});

    var key = metadata.key || 'default';
    var title = metadata.title || '';
    var description = metadata.description || '';

    var elementDataKey = 'data-sszvis-svg-' + key;

    var root = sszvis.fn.isSelection(selector) ? selector : d3.select(selector);
    var svg = root.selectAll('svg[' + elementDataKey + ']').data([0]);
    var svgEnter = svg.enter().append('svg');

    svgEnter
      .classed('sszvis-svg-layer', true)
      .attr(elementDataKey, '')
      .attr('role', 'img')
      .attr('aria-label', title + ' – ' + description);

    svgEnter
      .append('title')
      .text(title);

    svgEnter
      .append('desc')
      .text(description);

    svg
      .attr('height', bounds.height)
      .attr('width',  bounds.width);

    var viewport = svg.selectAll('[data-sszvis-svg-layer]').data([0]);
    viewport.enter().append('g')
      .attr('data-sszvis-svg-layer', '');

    viewport
      .attr('transform', 'translate(' + (bounds.padding.left) + ',' + (bounds.padding.top) + ')');

    return viewport;
  };

});
