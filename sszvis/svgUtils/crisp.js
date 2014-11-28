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

namespace('sszvis.svgUtils.crisp', function(module) {
  'use strict';

  /**
   * crisp.halfPixel
   *
   * To ensure SVG elements are rendered crisply and without anti-aliasing
   * artefacts, they must be placed on a half-pixel grid.
   *
   * @param  {number} pos A pixel position
   * @return {number}     A pixel position snapped to the pixel grid
   */
  module.exports.halfPixel = function(pos) {
    return Math.floor(pos) + 0.5;
  };


  /**
   * crisp.roundTransformString
   *
   * Takes an SVG transform string 'translate(12.3,4.56789) rotate(3.5)' and
   * rounds all translate coordinates to integers: 'translate(12,5) rotate(3.5)'.
   *
   * A valid translate instruction has the form 'translate(<x> [<y>])' where
   * x and y can be separated by a space or comma. We normalize this to use
   * spaces because that's what Internet Explorer uses.
   *
   * @param  {string} transformStr A valid SVG transform string
   * @return {string}              An SVG transform string with rounded values
   */
  module.exports.roundTransformString = function(transformStr) {
    var roundNumber = sszvis.fn.compose(Math.floor, Number);
    return transformStr.replace(/(translate\()\s*([0-9., ]+)\s*(\))/i, function(_, left, vecStr, right) {
      var roundVec = vecStr
        .replace(',', ' ')
        .replace(/\s+/, ' ')
        .split(' ')
        .map(roundNumber)
        .join(',');
      return left + roundVec + right;
    });
  };


  /**
   * crisp.transformTranslateSubpixelShift
   *
   * This helper function takes a transform string and returns a vector that
   * tells us how much to shift an element in order to place it on a half-pixel
   * grid.
   *
   * @param  {string} transformStr A valid SVG transform string
   * @return {vecor}               Two-element array ([dx, dy])
   */
  module.exports.transformTranslateSubpixelShift = function(transformStr) {
    var roundNumber = sszvis.fn.compose(Math.floor, Number);
    var m = transformStr.match(/(translate\()\s*([0-9.,\- ]+)\s*(\))/i);
    var vec = m[2]
      .replace(',', ' ')
      .replace(/\s+/, ' ')
      .split(' ')
      .map(Number);

    if (vec.length === 1) vec.push([0]);

    var vecRound = vec.map(roundNumber);
    return [vec[0] - vecRound[0], vec[1] - vecRound[1]];
  };

});
