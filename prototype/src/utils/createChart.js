var d3 = require('d3');
         require('../lib/d3-bounds');
var translate = require('./translate');

/**
 * Factory that returns a selection appended to
 * the given target selector.
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 *
 * @returns {d3.selection}
 */
module.exports = function (selector, bounds) {
  var root = d3.select(selector);
  var svg = root.selectAll('svg').data([0]);
  svg.enter().append('svg');

  svg
    .attr('height', bounds.height)
    .attr('width',  bounds.width)

  var viewport = svg.selectAll('[data-d3-chart]').data([0])
  viewport.enter().append('g')
    .attr('data-d3-chart', '')
    .attr('transform', translate(bounds.padding.left, bounds.padding.right));

  return viewport;
}
