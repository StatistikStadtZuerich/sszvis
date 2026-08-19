/**
 * Crisp
 *
 * Utilities to render SVG elements crisply by placing them precisely on the
 * pixel grid. Rectangles should be placed on round pixels, lines and circles
 * on half-pixels.
 *
 * Example of rectangle placement (four • create one pixel)
 * •    •----•----•    •
 *      |         |
 * •    •----•----•    •
 *
 * Example of line placement (four • create one pixel)
 * •    •    •    •    •
 *    ---------------
 * •    •    •    •    •
 *
 * @module sszvis/svgUtils/crisp
 */

import * as fn from "../fn.js";

/**
 * crisp.halfPixel
 *
 * To ensure SVG elements are rendered crisply and without anti-aliasing
 * artefacts, they must be placed on a half-pixel grid.
 *
 * @param  {number} pos A pixel position
 * @return {number}     A pixel position snapped to the pixel grid
 */
export const halfPixel = (pos: number): number => Math.floor(pos) + 0.5;

/**
 * crisp.roundTransformString
 *
 * Takes an SVG transform string 'translate(12.3,4.56789) rotate(3.5)' and
 * rounds the coordinates of its translate instruction down to integers:
 * 'translate(12,4) rotate(3.5)'.
 *
 * A valid translate instruction has the form 'translate(<x> [<y>])' where
 * x and y can be separated by a space or comma. Both forms are accepted and
 * the result is always comma-separated.
 *
 * Coordinates are floored rather than rounded to the nearest integer, which
 * keeps this consistent with halfPixel: both place an element on the pixel
 * grid by moving it towards the origin of its enclosing pixel.
 *
 * Scope: only the first translate instruction of a string is processed, and a
 * translate is expected to carry one or two components. Other instructions
 * (rotate, scale, …) are passed through untouched.
 *
 * Known defects are pinned in test/svgUtils/crisp.test.ts.
 *
 * @param  {string} transformStr A valid SVG transform string
 * @return {string}              An SVG transform string with rounded values
 */
export const roundTransformString = (transformStr: string): string => {
  const roundNumber = fn.compose(Math.floor, Number);
  return transformStr.replace(
    /(translate\()\s*([\d ,.]+)\s*(\))/i,
    (_: string, left: string, vecStr: string, right: string) => {
      const roundVec = vecStr
        .replace(",", " ")
        .replace(/\s+/, " ")
        .split(" ")
        .map(roundNumber)
        .join(",");
      return `${left}${roundVec}${right}`;
    }
  );
};

/**
 * crisp.transformTranslateSubpixelShift
 *
 * This helper function takes a transform string and returns a vector that
 * tells us how much to shift an element in order to place it on a half-pixel
 * grid.
 *
 * Each component is the distance from the coordinate down to the origin of its
 * enclosing pixel, so the shift is always in [0, 1). Because it is measured
 * from Math.floor — consistent with halfPixel and roundTransformString — a
 * negative coordinate yields the distance above the enclosing pixel rather
 * than a negative offset: -12.3 shifts by 0.7, not -0.3.
 *
 * A translate carrying only an x component yields a y shift of 0.
 *
 * Known defects are pinned in test/svgUtils/crisp.test.ts.
 *
 * @param  {string} transformStr A valid SVG transform string containing a
 *                               translate instruction
 * @return {vector}              Two-element array ([dx, dy])
 */
export const transformTranslateSubpixelShift = (transformStr: string): [number, number] => {
  const roundNumber = fn.compose(Math.floor, Number);
  const m = transformStr.match(/(translate\()\s*([\d ,.-]+)\s*(\))/i);
  // A transform string without a translate instruction throws a TypeError here. This
  // is preserved from the original implementation; see test/svgUtils/crisp.test.ts.
  const vec = (m as RegExpMatchArray)[2]
    .replace(",", " ")
    .replace(/\s+/, " ")
    .split(" ")
    .map(Number);

  if (vec.length === 1) vec.push(0);

  const vecRound = vec.map(roundNumber);
  return [vec[0] - vecRound[0], vec[1] - vecRound[1]];
};
