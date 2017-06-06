/**
 * Factory that returns an HTML element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * Note on the 'key' property of the optional metadata object:
 *
 * The key argument is present so that we can have multiple layers of html content in the same container.
 * For example, let's imagine you want one html div under an svg, then an svg layer, then another div over the svg.
 * The reason we need a key for these layers is that the render function in all the example code is designed to be
 * idempotent - calling it multiple times with the same arguments leaves the app in the same state. Therefore, all
 * the functions within render also need to be idempotent. A straightforward implementation of "createHtmlLayer" would
 * return an existing layer if present, or create one and return it if it wasn't present. This prevents createHtmlLayer
 * from making a new html element every time it's called. In turn, that means that you can call render many times and
 * always expect the same result (idempotence). But it also means that if you call it multiple times within the same
 * render function, you don't get multiple html layers. So then you can't have one under the svg and one over.
 *
 * The key argument solves this problem. It says, "look for a div in the container which has the given key, and return
 * it if present. Otherwise, create one with that key and return it. This means that if you call createHtmlLayer
 * multiple times with the same key, only one element will be created, and you'll get it back on subsequent calls.
 * But if you call it multiple times with different keys, you'll get multiple different elements. So, when you do:
 *
 * createHtmlLayer(..., ..., { key: 'A' })
 * createSvgLayer(...)
 * createHtmlLayer(..., ..., { key: 'B' })
 *
 * Then you'll have the div-svg-div sandwich, but that sequence of function calls is still idempotent.
 * Note: createSvgLayer accepts an optional metadata object, with an optional key property, which works the same way.
 *
 * @module sszvis/createHtmlLayer
 *
 * @param {string|d3.selection} selector    CSS selector string which is used to grab the container object for the created layer
 * @param {d3.bounds} [bounds]              A bounds object which provides the dimensions and offset for the created layer
 * @param {object} metadata                 Metadata for this layer. Currently the only used option is:
 *   @property {string} key                 Used as a unique key for this layer. If you pass different values
 *                                          of key to this function, the app will create and return different layers
 *                                          for inserting HTML content. If you pass the same value (including undefined),
 *                                          you will always get back the same DOM element. For example, this is useful for
 *                                          adding an HTML layer under an SVG, and then adding one over the SVG.
 *                                          See the binned raster map for an example of using this effectively.
 *
 * @returns {d3.selection}
 */

import d3 from 'd3';

import * as fn from './fn.js';
import mkBounds from './bounds.js';

export default function(selector, bounds, metadata) {
  bounds || (bounds = mkBounds());
  metadata || (metadata = {});

  var key = metadata.key || 'default';

  var elementDataKey = 'data-sszvis-html-' + key;

  var root = fn.isSelection(selector) ? selector : d3.select(selector);
  root.classed('sszvis-outer-container', true);

  var layer = root.selectAll('[data-sszvis-html-layer][' + elementDataKey + ']').data([0]);
  var newLayer = layer.enter().append('div')
    .classed('sszvis-html-layer', true)
    .attr('data-sszvis-html-layer', '')
    .attr(elementDataKey, '');

  layer = layer.merge(newLayer);
  layer
    .style('position', 'absolute')
    .style('left', bounds.padding.left + 'px')
    .style('top', bounds.padding.top + 'px');

  return layer;
};
