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
export declare function rangeExtent(scale: Scale): [number, number];
/**
 * Scale range
 *
 * @deprecated Renamed to `rangeExtent`, because the sorted extent and not the range is what
 * comes back. Kept as an alias for one release; use `rangeExtent` instead.
 */
export declare const range: typeof rangeExtent;
export {};
//# sourceMappingURL=scale.d.ts.map