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
 * rounds all translate coordinates to integers: 'translate(12,4) rotate(3.5)'.
 *
 * A valid translate instruction has the form 'translate(<x> [<y>])' where
 * x and y can be separated by a space or comma. We normalize this to use
 * spaces because that's what Internet Explorer uses.
 *
 * Note: coordinates are floored rather than rounded, only the first translate
 * instruction of a string is processed, and negative coordinates are left
 * untouched. See test/svgUtils/crisp.test.ts for the pinned behaviour.
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
 * @param  {string} transformStr A valid SVG transform string
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
