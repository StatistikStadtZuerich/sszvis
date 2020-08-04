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
 */

export default function (width, numBars) {
  var MAX_BAR_WIDTH = 48, // the maximum width of a bar
    MIN_PADDING = 2, // the minimum padding value
    MAX_PADDING = 100, // the maximum padding value
    TARGET_BAR_RATIO = 0.7, // the ratio of width to width + padding used to compute the initial width and padding
    TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO, // the inverse of the bar ratio, this is the ratio of padding to width + padding
    numPads = numBars - 1, // the number of padding spaces
    // compute the target size of the padding
    // the derivation of this equation is available upon request
    padding =
      (width * TARGET_PADDING_RATIO) /
      (TARGET_PADDING_RATIO * numPads + TARGET_BAR_RATIO * numBars),
    // based on the computed padding, calculate the bar width
    barWidth = (width - padding * numPads) / numBars;

  // adjust for min and max bounds
  if (barWidth > MAX_BAR_WIDTH) {
    barWidth = MAX_BAR_WIDTH;
    // recompute the padding value where necessary
    padding = (width - barWidth * numBars) / numPads;
  }
  if (padding < MIN_PADDING) padding = MIN_PADDING;
  if (padding > MAX_PADDING) padding = MAX_PADDING;

  // compute other information
  var padRatio = 1 - barWidth / (barWidth + padding),
    computedBarSpace = barWidth * numBars + padding * numPads,
    outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);

  return {
    barWidth: barWidth,
    padWidth: padding,
    padRatio: padRatio,
    outerRatio: outerRatio,
    barGroupWidth: computedBarSpace,
    totalWidth: width,
  };
}
