/**
 * @function sszvis.tooltipFit
 *
 * This is a useful default function for making a tooltip fit within a horizontal space.
 * You provide a default orientation for the tooltip, but also provide the bounds of the
 * space within which the tooltip should stay. When the tooltip is too close to the left
 * or right edge of the bounds, it is oriented away from the edge. Otherwise the default
 * is used.
 *
 * @param {String} defaultValue         The default value for the tooltip orientation
 * @param {Object} bounds               The bounds object within which the tooltip should stay.
 *
 * @returns {Function}                  A function for calculating the orientation of the tooltips.
 */

export default function (defaultVal, bounds) {
  var lo = Math.min((bounds.innerWidth * 1) / 4, 100);
  var hi = Math.max((bounds.innerWidth * 3) / 4, bounds.innerWidth - 100);
  return function (d) {
    var x = d.x;
    return x > hi ? "right" : (x < lo ? "left" : defaultVal);
  };
}
