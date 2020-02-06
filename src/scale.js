/**
 * Scale utilities
 *
 * @module sszvis/scale
 */

/**
 * Scale range
 *
 * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
 *
 * @param  {array} scale    The scale to be measured
 * @return {array}          The extent of the scale's range. Useful for determining how far
 *                          a scale stretches in its output dimension.
 */
export var range = function(scale) {
  // borrowed from d3 source - svg.axis
  return scale.rangeExtent ? scale.rangeExtent() : extent(scale.range());
};

/**
 * Helper function
 * Extent
 *
 * Used to determine the extent of an array. Mimics a function found in d3 source code.
 *
 * @param  {array} domain     an array, sorted in either ascending or descending order
 * @return {array}            the extent of the array, with the smaller term first.
 */
function extent(domain) {
  // borrowed from d3 source - svg.axis
  var start = domain[0],
    stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}
