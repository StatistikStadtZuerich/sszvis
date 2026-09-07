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
 *
 * Behaviour notes:
 * - The box side is fitted to the available width only; numY/rows never affect it.
 * - The side is capped at 30px and floored at 0. Too many columns, a large squarePadding
 *   or a large horizontal chartPadding leave no room for a box at all, and the whole
 *   layout is then zeroed rather than reporting a negative side and a padRatio outside
 *   the [0, 1) range a band scale expects.
 * - The chartPadding argument is copied before the missing sides are defaulted onto it, so
 *   a shared or frozen padding object is left as the caller wrote it.
 * - Defaults for chartPadding are applied with `||`, so an explicit 0 is indistinguishable
 *   from a missing value.
 * - Only left/right padding affect the layout; top/bottom are accepted but unused.
 * - A zero spaceWidth, or a table with no columns or no rows, is a table with nothing to
 *   draw, and every dimension comes back 0.
 * - A negative spaceWidth or squarePadding, and a negative or fractional column or row
 *   count, throw.
 * - centeredOffset is clamped at 0 but never validated otherwise.
 */
export type HeatTableChartPadding = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};
export type HeatTableDimensions = {
    side: number;
    paddedSide: number;
    padRatio: number;
    width: number;
    height: number;
    centeredOffset: number;
};
export default function dimensionsHeatTable(spaceWidth: number, squarePadding: number, numX: number, numY: number, chartPadding?: HeatTableChartPadding): HeatTableDimensions;
//# sourceMappingURL=heatTableDimensions.d.ts.map