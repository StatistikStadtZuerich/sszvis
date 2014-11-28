/**
 * @module sszvis/layout/populationPyramidLayout
 *
 * This function is used to compute the layout parameters for the population pyramid
 *
 * @property {number} defaultHeight   The default height of the chart. This is used as a base for calculating rounded bar heights.
 *                                    however, the returned total height will not necessarily be the same as this value.
 * @property {number} numBars         The number of bars in the population pyramid. In other words, the number of ages or age groups in the dataset.
 *
 * @return {object}                   An object containing configuration information for the population pyramid:
 *                                    {
 *                                      barHeight: the height of one bar in the population pyramid
 *                                      padding: the height of the padding between bars in the pyramid
 *                                      totalHeight: the total height of all bars plus the padding between them. This should be the basis for the bounds calculation
 *                                      positions: an array of positions, which go from the bottom of the chart (lowest age) to the top. These positions should
 *                                      be set as the range of a d3.scale.ordinal scale, where the domain is the list of ages or age groups that will be displayed
 *                                      in the chart. The domain ages or age groups should be sorted in ascending order, so that the positions will match up. If everything
 *                                      has gone well, the positions array's length will be numBars
 *                                    }
 */
namespace('sszvis.layout.populationPyramidLayout', function(module) {
  'use strict';

  module.exports = function(defaultHeight, numBars) {
    var padding = 1;
    var numPads = numBars - 1;
    var totalPadding = padding * numPads;

    var roundedBarHeight = Math.round((defaultHeight - totalPadding) / numBars);
    roundedBarHeight = Math.max(roundedBarHeight, 2); // bars no shorter than 2

    var totalHeight = numBars * roundedBarHeight + totalPadding;

    var barPos = totalHeight - roundedBarHeight,
        step = roundedBarHeight + padding,
        positions = [];
    while (barPos >= 0) {
      positions.push(barPos);
      barPos -= step;
    }

    return {
      barHeight: roundedBarHeight,
      padding: padding,
      totalHeight: totalHeight,
      positions: positions
    };
  };

});
