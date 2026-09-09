/**
 * Scale utilities
 *
 * @module sszvis/scale
 */

interface Scale {
  range(): number[];
  rangeExtent?(): [number, number];
}

/**
 * Range extent
 *
 * Used to determine the extent of a scale's range, i.e. how far the scale stretches in its
 * output dimension. Mimics a function found in d3 source code.
 *
 * The result is always sorted, smaller value first, whichever direction the scale's own range
 * runs in. It is therefore a measurement and not a range: passing it back to `scale.range()`
 * would silently flip a descending scale, which is what every y scale is. Read the scale's own
 * `range()` when direction matters.
 */
export function rangeExtent(scale: Scale): [number, number] {
  // borrowed from d3 source - svg.axis
  return scale.rangeExtent ? scale.rangeExtent() : extent(scale.range());
}

/**
 * Scale range
 *
 * @deprecated Renamed to `rangeExtent`, because the sorted extent and not the range is what
 * comes back. Kept as an alias for one release; use `rangeExtent` instead.
 */
export const range = rangeExtent;

/**
 * Helper function
 * Extent
 *
 * Used to determine the extent of an array. Mimics a function found in d3 source code.
 * The array is expected to be sorted in either ascending or descending order; the extent comes
 * back with the smaller term first either way.
 */
function extent(domain: number[]): [number, number] {
  // borrowed from d3 source - svg.axis
  const start = domain[0] as number;
  const stop = domain[domain.length - 1] as number;
  return start < stop ? [start, stop] : [stop, start];
}
