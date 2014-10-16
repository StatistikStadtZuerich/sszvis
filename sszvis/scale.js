/**
 * Scale component - for implementing alternatives to d3.scale
 *
 * @module sszvis/scale
*/
namespace('sszvis.scale', function(module) {
  module.exports = (function() {

    var scales = {};

    scales.colorScale = function() {
      var alteredScale = d3.scale.linear(),
          nativeDomain = alteredScale.domain;

      alteredScale.domain = function(dom) {
        if (arguments.length === 1) {
          var threeDomain = [dom[0], d3.mean(dom), dom[1]];
          return nativeDomain.call(this, threeDomain);
        } else {
          return nativeDomain.apply(this, arguments);
        }
      };

      return alteredScale;
    };

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
    scales.leftPaddedRange = function(domainLength, range, innerPaddingRatio, leftPadding, maxRangeBand, maxInnerPadding) {
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

    return scales;
  }());

});
