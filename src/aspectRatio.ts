/**
 * Functions related to aspect ratio calculations. An "auto" function is
 * provided and should be used in most cases to find the recommended
 * aspect ratio.
 *
 * @module sszvis/aspectRatio
 */

import { breakpointFind, breakpointDefaultSpec } from "./breakpoint.js";
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
export function aspectRatio(x: number, y: number): AspectRatioFunction {
  const ar = x / y;
  return function (width: number): number {
    return width / ar;
  };
}

/**
 * aspectRatio4to3
 *
 * Recommended breakpoints:
 *   - palm
 */
export const aspectRatio4to3: AspectRatioFunction = aspectRatio(4, 3);

/**
 * aspectRatio16to10
 *
 * Recommended breakpoints:
 *   - lap
 */
export const aspectRatio16to10: AspectRatioFunction = aspectRatio(16, 10);

/**
 * aspectRatio12to5
 *
 * Recommended breakpoints:
 *   - desk
 */
const AR12TO5_MAX_HEIGHT = 500;
export const aspectRatio12to5: AspectRatioFunctionWithMaxHeight = function (width: number): number {
  return Math.min(aspectRatio(12, 5)(width), AR12TO5_MAX_HEIGHT);
} as AspectRatioFunctionWithMaxHeight;
aspectRatio12to5.MAX_HEIGHT = AR12TO5_MAX_HEIGHT;

/**
 * aspectRatioSquare
 *
 * This aspect ratio constrains the returned height to a maximum of 420px.
 * It is recommended to center charts within this aspect ratio.
 *
 * Exposes the MAX_HEIGHT used as a property on the function.
 *
 * Recommended breakpoints:
 *   - palm
 *   - lap
 *   - desk
 */
const SQUARE_MAX_HEIGHT = 420;
export const aspectRatioSquare: AspectRatioFunctionWithMaxHeight = function (
  width: number
): number {
  return Math.min(aspectRatio(1, 1)(width), SQUARE_MAX_HEIGHT);
} as AspectRatioFunctionWithMaxHeight;
aspectRatioSquare.MAX_HEIGHT = SQUARE_MAX_HEIGHT;

/**
 * aspectRatioPortrait
 *
 * This aspect ratio constrains the returned height to a maximum of 600px.
 * It is recommended to center charts within this aspect ratio.
 *
 * Exposes the MAX_HEIGHT used as a property on the function.
 *
 * Recommended breakpoints:
 *   - palm
 *   - lap
 *   - desk
 */
const PORTRAIT_MAX_HEIGHT = 600;
export const aspectRatioPortrait: AspectRatioFunctionWithMaxHeight = function (
  width: number
): number {
  return Math.min(aspectRatio(4, 5)(width), PORTRAIT_MAX_HEIGHT);
} as AspectRatioFunctionWithMaxHeight;
aspectRatioPortrait.MAX_HEIGHT = PORTRAIT_MAX_HEIGHT;

/**
 * aspectRatioAuto
 *
 * Provides a set of default aspect ratios for different widths. If you provide a set
 * of measurements for a container and the window itself, it will provide the default
 * value of the height for that container. Note that the aspect ratio chosen may
 * depend on the container width itself. This is because of default breakpoints.
 *
 * @param measurement The measurements object for the container for which you
 *                    want a height value. Should have at least the properties:
 *                      - `width`: container's width
 *                      - `screenHeight`: the height of the window at the current time.
 *
 * @return The height which corresponds to the default aspect ratio for these measurements
 */
const defaultAspectRatios: Record<string, AspectRatioFunction> = {
  palm: aspectRatio4to3, // palm-sized devices
  lap: aspectRatio16to10, // lap-sized devices
  _: aspectRatio12to5, // all other cases, including desk
};

export const aspectRatioAuto = function (measurement: Measurement): number {
  const bp = breakpointFind(breakpointDefaultSpec(), measurement);
  const ar = defaultAspectRatios[bp?.name || "_"];
  return ar(measurement.width);
};
