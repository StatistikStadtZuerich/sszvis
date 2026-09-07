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
 * - The side is capped at 30px but never floored, so too many columns, a large
 *   squarePadding, or a large horizontal chartPadding can drive it negative, which also
 *   pushes padRatio outside the [0, 1) range a band scale expects.
 * - The chartPadding argument is mutated in place (missing sides are defaulted onto the
 *   object itself), so passing a frozen object throws a TypeError.
 * - Defaults for chartPadding are applied with `||`, so an explicit 0 is indistinguishable
 *   from a missing value.
 * - Only left/right padding affect the layout; top/bottom are accepted but unused.
 * - A zero spaceWidth, or a table with no columns or no rows, is a table with nothing to
 *   draw, and every dimension comes back 0.
 * - A negative spaceWidth or squarePadding, and a negative or fractional column or row
 *   count, throw.
 * - centeredOffset is clamped at 0 but never validated otherwise.
 */

import { requireCount, requireSize } from "./validate.js";

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

/** A table with no columns, no rows or no room: nothing to draw and nothing to report. */
const EMPTY_DIMENSIONS: HeatTableDimensions = {
  side: 0,
  paddedSide: 0,
  padRatio: 0,
  width: 0,
  height: 0,
  centeredOffset: 0,
};

export default function dimensionsHeatTable(
  spaceWidth: number,
  squarePadding: number,
  numX: number,
  numY: number,
  chartPadding?: HeatTableChartPadding
): HeatTableDimensions {
  requireSize("dimensionsHeatTable", "spaceWidth", spaceWidth);
  requireSize("dimensionsHeatTable", "squarePadding", squarePadding);
  requireCount("dimensionsHeatTable", "numX", numX);
  requireCount("dimensionsHeatTable", "numY", numY);
  if (spaceWidth === 0 || numX === 0 || numY === 0) return { ...EMPTY_DIMENSIONS };

  // the defaults are written back onto the caller's object, as the original did
  const padding: HeatTableChartPadding = chartPadding || {};
  padding.top ||= 0;
  padding.right ||= 0;
  padding.bottom ||= 0;
  padding.left ||= 0;

  // this includes the default side length for the heat table
  const DEFAULT_SIDE = 30,
    availableChartWidth = spaceWidth - (padding.left ?? 0) - (padding.right ?? 0),
    side = Math.min((availableChartWidth - squarePadding * (numX - 1)) / numX, DEFAULT_SIDE),
    paddedSide = side + squarePadding,
    padRatio = 1 - side / paddedSide,
    tableWidth = numX * paddedSide - squarePadding, // subtract the squarePadding at the end
    tableHeight = numY * paddedSide - squarePadding; // subtract the squarePadding at the end
  return {
    side,
    paddedSide,
    padRatio,
    width: tableWidth,
    height: tableHeight,
    centeredOffset: Math.max((availableChartWidth - tableWidth) / 2, 0),
  };
}
