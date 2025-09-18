/**
 * Functions related to aspect ratio calculations. An "auto" function is
 * provided and should be used in most cases to find the recommended
 * aspect ratio.
 *
 * @module sszvis/aspectRatio
 */
import type { Measurement } from "./types.js";
/**
 * Aspect ratio function type that calculates height from width
 */
export type AspectRatioFunction = (width: number) => number;
/**
 * Aspect ratio function with a MAX_HEIGHT property
 */
export interface AspectRatioFunctionWithMaxHeight extends AspectRatioFunction {
    MAX_HEIGHT: number;
}
/**
 * aspectRatio
 *
 * The base module is a function which creates an aspect ratio function.
 * You provide a width and a height of the aspect ratio, and the
 * returned function accepts any width, returning the corresponding
 * height for the aspect ratio you configured.
 *
 * @param x  The number of parts on the horizontal axis (dividend)
 * @param y  The number of parts on the vertical axis (divisor)
 * @return The aspect ratio function. Takes a width as an argument
 *         and returns the corresponding height based on the
 *         aspect ratio defined by x:y.
 */
export declare function aspectRatio(x: number, y: number): AspectRatioFunction;
/**
 * aspectRatio4to3
 *
 * Recommended breakpoints:
 *   - palm
 */
export declare const aspectRatio4to3: AspectRatioFunction;
/**
 * aspectRatio16to10
 *
 * Recommended breakpoints:
 *   - lap
 */
export declare const aspectRatio16to10: AspectRatioFunction;
export declare const aspectRatio12to5: AspectRatioFunctionWithMaxHeight;
export declare const aspectRatioSquare: AspectRatioFunctionWithMaxHeight;
export declare const aspectRatioPortrait: AspectRatioFunctionWithMaxHeight;
export declare const aspectRatioAuto: (measurement: Measurement) => number;
//# sourceMappingURL=aspectRatio.d.ts.map