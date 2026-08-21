import { aspectRatioPortrait } from '../aspectRatio.js';

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
 *                                      the value is floored at 1 and no further padding is needed.
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
 * - maxBarLength is capped at 240 (= aspectRatioPortrait.MAX_HEIGHT * 4/5 / 2), which only
 *   coincidentally equals this module's own MAX_HEIGHT / 2 and can drift if either constant changes.
 * - chartPadding is floored at 1.
 * - numBars === 0 gives an Infinity barHeight, a NaN totalHeight, and no positions.
 * - A zero or negative spaceWidth is not validated. Both produce 2px bars and a 1px
 *   chartPadding; maxBarLength is 0 for a zero width and negative for a negative one.
 */
function populationPyramidLayout (spaceWidth, numBars) {
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
  const maxBarLength = Math.min(spaceWidth / 2, aspectRatioPortrait.MAX_HEIGHT * (4 / 5) / 2);
  const chartPadding = Math.max((spaceWidth - 2 * maxBarLength) / 2, 1);
  return {
    barHeight: roundedBarHeight,
    padding,
    totalHeight,
    positions,
    maxBarLength,
    chartPadding
  };
}

export { populationPyramidLayout as default };
//# sourceMappingURL=populationPyramidLayout.js.map
