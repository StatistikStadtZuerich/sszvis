/**
 * Scale utilities
 *
 * @module sszvis/scale
 */

interface Scale {
  range(): any[];
  rangeExtent?(): [number, number];
}

/**
 * Scale range
 *
 * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
 *
 * @param scale The scale to be measured
 * @return The extent of the scale's range. Useful for determining how far
 *         a scale stretches in its output dimension.
 */
export const range = function (scale: Scale): [number, number] {
  // borrowed from d3 source - svg.axis
  return scale.rangeExtent ? scale.rangeExtent() : extent(scale.range());
};

/**
 * Helper function
 * Extent
 *
 * Used to determine the extent of an array. Mimics a function found in d3 source code.
 *
 * @param domain An array, sorted in either ascending or descending order
 * @return The extent of the array, with the smaller term first.
 */
function extent(domain: any[]): [number, number] {
  // borrowed from d3 source - svg.axis
  const start = domain[0];
  const stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}
