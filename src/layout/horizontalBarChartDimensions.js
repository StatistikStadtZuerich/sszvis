/**
 * Horizontal Bar Chart Dimensions
 *
 * This function calculates dimensions for the horizontal bar chart. It encapsulates the
 * layout algorithm for sszvis horizontal bar charts. The object it returns contains several
 * properties which can be used in other functions and components for layout purposes.
 *
 * @module sszvis/layout/horizontalBarChartDimensions
 *
 * @param  {number} numBars     the number of bars in the horizontal bar chart
 * @return {object}             an object containing properties used for layout:
 *                                 {
 *                                  barHeight: the height of an individual bar
 *                                  padHeight: the height of the padding between each bar
 *                                  padRatio: the ratio of padding to barHeight + padding.
 *                                            this can be passed as the second argument to d3.scaleOrdinal().rangeBands
 *                                  outerRatio: the ratio of outer padding to barHeight + padding.
 *                                              this can be passed as the third parameter to d3.scaleOrdinal().rangeBands
 *                                  axisOffset: the amount by which to vertically offset the y-axis of the horizontal bar chart
 *                                              in order to ensure that the axis labels are visible. This can be used as the y-component
 *                                              of a call to sszvis.svgUtils.translateString.
 *                                  barGroupHeight: the combined height of all the bars and their inner padding.
 *                                  totalHeight: barGroupHeight plus the height of the outerPadding. This distance can be used
 *                                               to translate scales below the bars.
 *                                 }
 */

export default function (numBars) {
  var DEFAULT_HEIGHT = 24, // the default bar height
    MIN_PADDING = 20, // the minimum padding size
    barHeight = DEFAULT_HEIGHT, // the bar height
    numPads = numBars - 1,
    padding = MIN_PADDING,
    // compute other information
    padRatio = 1 - barHeight / (barHeight + padding),
    computedBarSpace = barHeight * numBars + padding * numPads,
    outerRatio = 0; // no outer padding

  return {
    barHeight: barHeight,
    padHeight: padding,
    padRatio: padRatio,
    outerRatio: outerRatio,
    axisOffset: -(barHeight / 2) - 10,
    barGroupHeight: computedBarSpace,
    totalHeight: computedBarSpace + outerRatio * (barHeight + padding) * 2,
  };
}
