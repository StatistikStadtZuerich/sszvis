import { requireSize, requireCount } from './validate.js';

/**
 * Vertical Bar Chart Dimensions
 *
 * Generates a dimension configuration object to be used for laying out the vertical bar chart.
 *
 * @module sszvis/layout/verticalBarChartDimensions
 *
 * @param  {number} width         the total width available to the horizontal bar chart. The computed chart layout is not guaranteed
 *                                to fit inside this width.
 * @param  {number} numBars       The number of bars in the bar chart.
 * @return {object}               An object containing configuration properties for use in laying out the vertical bar chart.
 *                                {
 *                                  barWidth:             the width of each bar in the bar chart
 *                                  padWidth:             the width of the padding between the bars in the bar chart
 *                                  padRatio:             the ratio between the padding and the step (barWidth + padding). This can be passed
 *                                                        as the second parameter to d3.scaleOrdinal().rangeBands().
 *                                  outerRatio:           the outer ratio between the outer padding and the step. This can be passed as the
 *                                                        third parameter to d3.scaleOrdinal().rangeBands().
 *                                  barGroupWidth:        the width of all the bars plus all the padding between the bars.
 *                                  totalWidth:           The total width of all bars, plus all inner and outer padding.
 *                                }
 *
 * Behaviour notes:
 * - Targets a 70/30 split of each step between bar width and padding.
 * - Bar width is capped at 48px; when capped, padding is recomputed from the leftover width.
 * - Padding is then clamped to [2, 100] WITHOUT recomputing the bar width, so the bar group
 *   can overflow or underflow the given width (outerRatio can go negative).
 * - padRatio/outerRatio are derived from the clamped barWidth/padding, not from the 0.7/0.3 target.
 * - numBars === 1 has zero padding spaces, so it reports no padding at all.
 * - A zero width or a zero bar count is a chart with nothing to draw, and every dimension
 *   comes back 0 (totalWidth still reports the width that was asked for).
 * - A negative width, or a negative or fractional bar count, throws.
 */
function dimensionsVerticalBarChart(width, numBars) {
  requireSize("dimensionsVerticalBarChart", "width", width);
  requireCount("dimensionsVerticalBarChart", "numBars", numBars);
  if (width === 0 || numBars === 0) {
    return {
      barWidth: 0,
      padWidth: 0,
      padRatio: 0,
      outerRatio: 0,
      barGroupWidth: 0,
      totalWidth: width
    };
  }
  const MAX_BAR_WIDTH = 48,
    // the maximum width of a bar
    MIN_PADDING = 2,
    // the minimum padding value
    MAX_PADDING = 100,
    // the maximum padding value
    TARGET_BAR_RATIO = 0.7,
    // the ratio of width to width + padding used to compute the initial width and padding
    TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO,
    // the inverse of the bar ratio, this is the ratio of padding to width + padding
    numPads = numBars - 1; // the number of padding spaces
  // compute the target size of the padding
  // the derivation of this equation is available upon request
  let padding = width * TARGET_PADDING_RATIO / (TARGET_PADDING_RATIO * numPads + TARGET_BAR_RATIO * numBars);
  // based on the computed padding, calculate the bar width
  let barWidth = (width - padding * numPads) / numBars;
  // adjust for min and max bounds
  if (barWidth > MAX_BAR_WIDTH) {
    barWidth = MAX_BAR_WIDTH;
    // recompute the padding value where necessary
    padding = numPads === 0 ? 0 : (width - barWidth * numBars) / numPads;
  }
  if (numPads === 0) {
    // a single bar draws no gaps, so any padding reported here is a phantom that would
    // still feed padRatio
    padding = 0;
  } else {
    if (padding < MIN_PADDING) padding = MIN_PADDING;
    if (padding > MAX_PADDING) padding = MAX_PADDING;
  }
  // compute other information
  const padRatio = 1 - barWidth / (barWidth + padding),
    computedBarSpace = barWidth * numBars + padding * numPads,
    outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);
  return {
    barWidth,
    padWidth: padding,
    padRatio,
    outerRatio,
    barGroupWidth: computedBarSpace,
    totalWidth: width
  };
}

export { dimensionsVerticalBarChart as default };
//# sourceMappingURL=verticalBarChartDimensions.js.map
