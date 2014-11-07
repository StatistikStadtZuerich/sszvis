/**
 * Scale component - for implementing alternatives to d3.scale
 *
 * @module sszvis/scale
*/
namespace('sszvis.scale', function(module) {
  'use strict';

  /**
   * Used to calculate a range that has some pixel-defined amount of left-hand padding,
   * and which obeys limits on the maximum size of the 'range band' - the size of the bars -
   * and the inner padding between the bars
   * @param  {Int} domainLength      length of the data domain
   * @param  {Array[2]} range             the output range, [min, max]
   * @param  {Float} innerPaddingRatio ratio between the padding width and the rangeBand width
   * @param  {Int} leftPadding       pixels of left padding
   * @param  {Int} maxRangeBand      maximum size of a rangeBand
   * @param  {Int} maxInnerPadding   maximum size of the padding
   * @return {Obj[range, rangeBand]}                   gives a range of values that correspond to the input domain,
   *                                                   and a size for the rangeBand.
   */
  module.export.leftPaddedRange = function(domainLength, range, innerPaddingRatio, leftPadding, maxRangeBand, maxInnerPadding) {
    var start = range[0],
        stop = range[1],
        step = (stop - start - leftPadding) / (domainLength),
        innerPadding = Math.min(step * innerPaddingRatio, maxInnerPadding),
        rangeBand = Math.min(step * (1 - innerPaddingRatio), maxRangeBand);
    step = innerPadding + rangeBand;
    range = d3.range(domainLength).map(function(i) { return start + leftPadding + step * i; });
    return {
      range: range,
      rangeBand: rangeBand
    };
  };

});
