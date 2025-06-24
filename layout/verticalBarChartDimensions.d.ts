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
export default function _default(width: number, numBars: number): object;
//# sourceMappingURL=verticalBarChartDimensions.d.ts.map