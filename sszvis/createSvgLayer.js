/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createSvgLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 * @param {object} [metadata] Metadata for this chart. Can be one of:
 *   @property {string} metadata.title The chart's title
 *   @property {string} metadata.description A longer description of this chart's content
 *
 * @returns {d3.selection}
 */
sszvis_namespace('sszvis.createSvgLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds, metadata) {
    var title = metadata.title || '';
    var description = metadata.description || '';

    var root = d3.select(selector);
    var svg = root.selectAll('svg').data([0]);
    var svgEnter = svg.enter().append('svg');

    svgEnter
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
      .attr('data-sszvis-svg-layer', '')
      .attr('transform', 'translate(' + (bounds.padding.left) + ',' + (bounds.padding.top) + ')');

    return viewport;
  };

});
