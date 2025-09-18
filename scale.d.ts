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
 * @param  {array} scale    The scale to be measured
 * @return {array}          The extent of the scale's range. Useful for determining how far
 *                          a scale stretches in its output dimension.
 */
export declare const range: (scale: Scale) => [number, number];
export {};
//# sourceMappingURL=scale.d.ts.map