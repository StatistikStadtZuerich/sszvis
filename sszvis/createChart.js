/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createChart
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 *
 * @returns {d3.selection}
 */
namespace('sszvis.createChart', function(module) {

  module.exports = function(selector, bounds) {
    var root = d3.select(selector);
    var svg = root.selectAll('svg').data([0]);
    svg.enter().append('svg');

    svg
      .attr('height', bounds.height)
      .attr('width',  bounds.width)

    var viewport = svg.selectAll('[data-sszvis-svg-layer]').data([0])
    viewport.enter().append('g')
      .attr('data-sszvis-svg-layer', '')
      .attr('transform', 'translate(' + bounds.padding.left + ',' + bounds.padding.top + ')');

    return viewport;
  }

});
