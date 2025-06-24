import { breakpointFind, breakpointDefaultSpec } from './breakpoint.js';

/**
 * Functions related to aspect ratio calculations. An "auto" function is
 * provided and should be used in most cases to find the recommended
 * aspect ratio.
 *
 * @module sszvis/aspectRatio
 */


/**
 * aspectRatio
 *
 * The base module is a function which creates an aspect ratio function.
 * You provide a width and a height of the aspect ratio, and the
 * returned function accepts any width, returning the corresponding
 * height for the aspect ratio you configured.
 *
 * @param {Number} x  The number of parts on the horizontal axis (dividend)
 * @param {Number} y  The number of parts on the vertical axis (divisor)
 * @return {Function} The aspect ratio function. Takes a width as an argument
 *                    and returns the corresponding height based on the
 *                    aspect ratio defined by x:y.
 */
function aspectRatio(x, y) {
  const ar = x / y;
  return function (width) {
    return width / ar;
  };
}

/**
 * aspectRatio4to3
 *
 * Recommended breakpoints:
 *   - palm
 *
 * @param {Number} width
 * @returns {Number} height
 */
const aspectRatio4to3 = aspectRatio(4, 3);

/**
 * aspectRatio16to10
 *
 * Recommended breakpoints:
 *   - lap
 *
 * @param {Number} width
 * @returns {Number} height
 */
const aspectRatio16to10 = aspectRatio(16, 10);

/**
 * aspectRatio12to5
 *
 * Recommended breakpoints:
 *   - desk
 *
 * @param {Number} width
 * @returns {Number} height
 */
const AR12TO5_MAX_HEIGHT = 500;
const aspectRatio12to5 = function (width) {
  return Math.min(aspectRatio(12, 5)(width), AR12TO5_MAX_HEIGHT);
};
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
 *
 * @param {Number} width
 * @returns {Number} height
 */
const SQUARE_MAX_HEIGHT = 420;
const aspectRatioSquare = function (width) {
  return Math.min(aspectRatio(1, 1)(width), SQUARE_MAX_HEIGHT);
};
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
 *
 * @param {Number} width
 * @returns {Number} height
 */
const PORTRAIT_MAX_HEIGHT = 600;
const aspectRatioPortrait = function (width) {
  return Math.min(aspectRatio(4, 5)(width), PORTRAIT_MAX_HEIGHT);
};
aspectRatioPortrait.MAX_HEIGHT = PORTRAIT_MAX_HEIGHT;

/**
 * aspectRatioAuto
 *
 * Provides a set of default aspect ratios for different widths. If you provide a set
 * of measurements for a container and the window itself, it will provide the default
 * value of the height for that container. Note that the aspect ratio chosen may
 * depend on the container width itself. This is because of default breakpoints.
 *
 * @param  {Measurement} measurement The measurements object for the container for which you
 *                                   want a height value. Should have at least the properties:
 *                                     - `width`: container's width
 *                                     - `screenHeight`: the height of the window at the current time.
 *
 * @return {Number} The height which corresponds to the default aspect ratio for these measurements
 */
const defaultAspectRatios = {
  palm: aspectRatio4to3,
  // palm-sized devices
  lap: aspectRatio16to10,
  // lap-sized devices
  _: aspectRatio12to5 // all other cases, including desk
};
const aspectRatioAuto = function (measurement) {
  const bp = breakpointFind(breakpointDefaultSpec(), measurement);
  const ar = defaultAspectRatios[bp.name];
  return ar(measurement.width);
};

export { aspectRatio, aspectRatio12to5, aspectRatio16to10, aspectRatio4to3, aspectRatioAuto, aspectRatioPortrait, aspectRatioSquare };
//# sourceMappingURL=aspectRatio.js.map
