/**
 * Heat Table Dimensions
 *
 * Utility function for calculating different demensions in the heat table
 *
 * @module sszvis/layout/heatTableDimensions
 *
 * @param  {Number} spaceWidth   the total available width for the heat table within its container
 * @param  {Number} squarePadding the padding, in pixels, between squares in the heat table
 * @param  {Number} numX     The number of columns that need to fit within the heat table width
 * @param {Number} numY The number of rows in the table
 * @param {Object} [chartPadding] An object that includes padding values for the left, right, top,
 *                              and bottom padding which the heat table should have within its container.
 *                              These padding values should be enough to include any axis labels or other things
 *                              that show up around the table itself. The heat table will then fill the rest
 *                              of the available space as appropriate (up to a certain maximum size of box)
 * @return {object}         An object with dimension information about the heat table:
 *                          {
 *                              side: the length of one side of a table box
 *                              paddedSide: the length of the side plus padding
 *                              padRatio: the ratio of padding to paddedSide (used for configuring d3.scaleOrdinal.rangeBands as the second parameter)
 *                              width: the total width of all table boxes plus padding in between
 *                              height: the total height of all table boxes plus padding in between
 *                              centeredOffset: the left offset required to center the table horizontally within its container
 *                          }
 */

export default function(spaceWidth, squarePadding, numX, numY, chartPadding) {
  chartPadding || (chartPadding = {});
  chartPadding.top || (chartPadding.top = 0);
  chartPadding.right || (chartPadding.right = 0);
  chartPadding.bottom || (chartPadding.bottom = 0);
  chartPadding.left || (chartPadding.left = 0);

  // this includes the default side length for the heat table
  var DEFAULT_SIDE = 30,
      availableChartWidth = spaceWidth - chartPadding.left - chartPadding.right,
      side = Math.min((availableChartWidth - squarePadding * (numX - 1)) / numX, DEFAULT_SIDE),
      paddedSide = side + squarePadding,
      padRatio = 1 - (side / paddedSide),
      tableWidth = (numX * paddedSide) - squarePadding, // subtract the squarePadding at the end
      tableHeight = (numY * paddedSide) - squarePadding; // subtract the squarePadding at the end
  return {
    side: side,
    paddedSide: paddedSide,
    padRatio: padRatio,
    width: tableWidth,
    height: tableHeight,
    centeredOffset: Math.max((availableChartWidth - tableWidth) / 2, 0)
  };
};
