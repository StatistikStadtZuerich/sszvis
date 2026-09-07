import { aspectRatioPortrait } from '../aspectRatio.js';
import { requireSize, requireCount } from './validate.js';

/**
 * Population Pyramid Layout
 *
 * This function is used to compute the layout parameters for the population pyramid
 *
 * @module sszvis/layout/populationPyramidLayout
 *
 * @parameter {number} spaceWidth      The available width for the chart. This is used as a base for calculating the size of the chart
 *                                    (there's a default aspect ratio for its height), and then for calculating the rounded bar heights.
 *                                    The returned total height should be nicely proportionate to this value.
 * @parameter {number} numBars         The number of bars in the population pyramid. In other words, the number of ages or age groups in the dataset.
 *
 * @return {object}                   An object containing configuration information for the population pyramid:
 *                                    {
 *                                      barHeight: the height of one bar in the population pyramid
 *                                      padding: the height of the padding between bars in the pyramid
 *                                      totalHeight: the total height of all bars plus the padding between them. This should be the basis for the bounds calculation
 *                                      positions: an array of positions, which go from the bottom of the chart (lowest age) to the top. These positions should
 *                                      be set as the range of a d3.scaleOrdinal scale, where the domain is the list of ages or age groups that will be displayed
 *                                      in the chart. The domain ages or age groups should be sorted in ascending order, so that the positions will match up. If everything
 *                                      has gone well, the positions array's length will be numBars,
 *                                      maxBarLength: The maximum length of the bars to fit within the space while keeping a good aspect ratio.
 *                                      In situations with very wide screens, this limits the width of the entire pyramid to a reasonable size.
 *                                      chartPadding: left padding for the chart. When the maxBarLength is less than what would fill the entire width
 *                                      of the chart, this value is needed to offset the axes and legend so that they line up with the chart. Otherwise,
 *                                      the value is 0 and no further padding is needed.
 *                                    }
 *
 * Behaviour notes:
 * - Chart height is the 4:5 portrait ratio, capped at 480px.
 * - Bar heights are rounded to whole pixels with a 2px floor; the floor wins over the height
 *   cap, so totalHeight can exceed 480px.
 * - Padding is always exactly 1px.
 * - Positions are top-edge y coordinates for the bars, in the order an ascending age domain
 *   expects them: the first is the bottom bar (the largest y) and the last is the top bar at
 *   exactly 0. There is one position per bar for a positive whole numBars, since the integer
 *   arithmetic guarantees the loop lands on 0; a fractional or negative count is not validated.
 * - maxBarLength is capped at half this module's own MAX_HEIGHT, so a very wide screen keeps
 *   the whole pyramid to a reasonable size.
 * - chartPadding is 0 once the pyramid fills the width.
 * - A zero spaceWidth or a pyramid with no bars is a chart with nothing to draw, and every
 *   dimension comes back 0.
 * - A negative spaceWidth, or a negative or fractional bar count, throws.
 */
function layoutPopulationPyramid(spaceWidth, numBars) {
  requireSize("layoutPopulationPyramid", "spaceWidth", spaceWidth);
  requireCount("layoutPopulationPyramid", "numBars", numBars);
  if (spaceWidth === 0 || numBars === 0) {
    return {
      barHeight: 0,
      padding: 0,
      totalHeight: 0,
      positions: [],
      maxBarLength: 0,
      chartPadding: 0
    };
  }
  const MAX_HEIGHT = 480; // Chart no taller than this
  const MIN_BAR_HEIGHT = 2; // Bars no shorter than this
  const defaultHeight = Math.min(aspectRatioPortrait(spaceWidth), MAX_HEIGHT);
  const padding = 1;
  const numPads = numBars - 1;
  const totalPadding = padding * numPads;
  let roundedBarHeight = Math.round((defaultHeight - totalPadding) / numBars);
  roundedBarHeight = Math.max(roundedBarHeight, MIN_BAR_HEIGHT);
  const totalHeight = numBars * roundedBarHeight + totalPadding;
  let barPos = totalHeight - roundedBarHeight;
  const step = roundedBarHeight + padding,
    positions = [];
  while (barPos >= 0) {
    positions.push(barPos);
    barPos -= step;
  }
  // half of each side, up to half the chart's own maximum height
  const maxBarLength = Math.min(spaceWidth / 2, MAX_HEIGHT / 2);
  const chartPadding = Math.max((spaceWidth - 2 * maxBarLength) / 2, 0);
  return {
    barHeight: roundedBarHeight,
    padding,
    totalHeight,
    positions,
    maxBarLength,
    chartPadding
  };
}

export { layoutPopulationPyramid as default };
//# sourceMappingURL=populationPyramidLayout.js.map
