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
namespace('sszvis.createHtmlLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds) {
    bounds || (bounds = sszvis.bounds());

    var root = d3.select(selector);
    // NOTE Why again do you need to add .data([0])?
    var layer = root.selectAll('div').data([0]);
    layer.enter().append('div');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  };

});
