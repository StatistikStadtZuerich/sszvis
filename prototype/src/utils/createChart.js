var d3 = require('d3');
         require('../lib/d3-dimension');
var translate = require('./translate');

/**
 * Factory that returns a selection appended to
 * the given target selector.
 *
 * @param {string|d3.selection} selector
 * @param {d3.dimension} dimension
 *
 * @returns {d3.selection}
 */
module.exports = function (selector, dimension) {
  var root = d3.select(selector);
  var svg = root.selectAll('svg').data([0]);
  svg.enter().append('svg');
  svg.exit().remove();

  svg
    .attr('height', dimension.outerHeight)
    .attr('width',  dimension.outerWidth)

  var viewport = svg.selectAll('[data-d3-chart]').data([0])
  viewport.enter().append('g')
    .attr('data-d3-chart', '')
    .attr('transform', translate(dimension.padding.left, dimension.padding.right));

  return viewport;
}
