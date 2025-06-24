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
export default function _default(spaceWidth: number, squarePadding: number, numX: number, numY: number, chartPadding?: Object): object;
//# sourceMappingURL=heatTableDimensions.d.ts.map