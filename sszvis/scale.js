/**
 * Scale component - for implementing alternatives to d3.scale
 *
 * @module sszvis/scale
*/
namespace('sszvis.scale', function(module) {
  module.exports = (function() {

    var scales = {};

    /**
     * scale.colorScale
     *
     * Extends the built-in d3.scale.linear for use as a color scale.
     *
     * @return {d3.scale.linear} a d3 linear scale exposing the same API,
     * but with certain methods overwritten.
     */
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
     * scale.binnedColorScale
     *
     * Extends d3.scale.quantize for use as a binned color scale
     *
     * @return {d3.scale.quantize} a d3 quantize scale with extra methods
     * for creating binned scales.
     */
    scales.binnedColorScale = function() {
      var alteredScale = d3.scale.quantize(),
          colorRange = ['#000', '#fff'],
          bins = 2;

      alteredScale.range(colorRange);

      function setRange() {
        var proxy = d3.scale.linear().range(colorRange),
          range = [];
        for (var i = 0, step = 1 / bins; 1 - i > 0.0001; i += step) {
          range.push(proxy(i));
        }
        alteredScale.range(range);
      }

      alteredScale.bins = function(_) {
        if (arguments.length === 0) return bins;
        bins = _;
        setRange();
        return alteredScale;
      };

      alteredScale.colorRange = function(_) {
        if (arguments.length === 0) return colorRange;
        colorRange = _;
        setRange();
        return alteredScale;
      };

      // this function makes the scale compatible with the legendColorRange component
      alteredScale.ticks = function(num) {
        var first = sszvis.fn.first(alteredScale.domain()),
            last = sszvis.fn.last(alteredScale.domain()),
            step = (last - first) / bins,
            ticks = [];
        for (var i = first + step / 2; Math.abs(last - i) > step; i += step) {
          ticks.push(i);
        }
        i += step; ticks.push(i);
        return ticks;
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
