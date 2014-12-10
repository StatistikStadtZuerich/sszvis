/**
 * Heat Table Dimensions
 *
 * Utility function for calculating different demensions in the heat table
 *
 * @module sszvis/layout/heatTableDimensions
 *
 * @param  {Number} spaceWidth   the total available width for the heat table within its container
 * @param  {Number} padding the padding, in pixels, between squares in the heat table
 * @param  {Number} numX     The number of columns that need to fit within the heat table width
 * @param {Number} numY The number of rows in the table
 * @return {object}         An object with dimension information about the heat table:
 *                          {
 *                              side: the length of one side of a table box
 *                              paddedSide: the length of the side plus padding
 *                              padRatio: the ratio of padding to paddedSide (used for configuring d3.scale.ordinal.rangeBands as the second parameter)
 *                              width: the total width of all table boxes plus padding in between
 *                              height: the total height of all table boxes plus padding in between
 *                              centeredOffset: the left offset required to center the table horizontally within spaceWidth
 *                          }
 */
sszvis_namespace('sszvis.layout.heatTableDimensions', function(module) {
  'use strict';

  module.exports = function(spaceWidth, padding, numX, numY) {
    // this includes the default side length for the heat table
    var DEFAULT_SIDE = 30,
        side = Math.min((spaceWidth - padding * (numX - 1)) / numX, DEFAULT_SIDE),
        paddedSide = side + padding,
        padRatio = 1 - (side / paddedSide),
        tableWidth = numX * paddedSide - padding, // subtract the padding at the end
        tableHeight = numY * paddedSide - padding; // subtract the padding at the end
    return {
      side: side,
      paddedSide: paddedSide,
      padRatio: padRatio,
      width: tableWidth,
      height: tableHeight,
      centeredOffset: (spaceWidth - tableWidth) / 2
    };
  };

});
