/**
 * @module sszvis/layout/sunburst
 *
 * Helper functions for transforming your data to match the format required by the sunburst chart.
 */
sszvis_namespace('sszvis.layout.sunburst', function(module) {
  'use strict';

  /**
   * sszvis.layout.sunburst.prepareData
   *
   * Creates a data preparation layout, with an API that works similarly to d3's configurable layouts.
   *
   * @property {Array} calculate      Accepts an array of data, and applies this layout to that data. Returns the formatted dataset,
   *                                  ready to be used as data for the sunburst component.
   * @property {Function} layer       Accepts a function, which should be a key function, used to create a layer for the data.
   *                                  The key function is applied to each datum, and the return value groups that datum within a
   *                                  layer of the sunburst chart. The exact behavior depends on the order in which layers are specified.
   *                                  The first specified layer will be the innermost one of the sunburst, with subsequent layers adding
   *                                  around the sunburst. Data are grouped according to the first layer, then the second layer, then the third, etc.
   *                                  This uses d3.nest under the hood, and applys the key function as a d3.nest().key, so it works like that.
   * @property {Function} value       The function which retrieves the value of each datum. This is required in order to calculate the size of 
   *                                  the ring segment for each datum.
   *
   * @return {Function}               The layout function. Can be called directly or you can use '.calculate(dataset)'.
   */
  module.exports.prepareData = function() {
    var nester = d3.nest();
    var valueAcc = sszvis.fn.identity;

    function main(data) {
      nester.rollup(sszvis.fn.first);

      var partitionLayout = d3.layout.partition()
        .children(sszvis.fn.prop('values'))
        .value(function(d) { return valueAcc(d.values); })
        // Don't sort the output. This component expects sorted inputs
        .sort(function() { return 0; });

      return partitionLayout({
          isSunburstRoot: true,
          values: nester.entries(data)
        // Remove the root element from the data (but it still exists in memory so long as the data is alive)
        }).filter(function(d) { return !d.isSunburstRoot; });
    };

    main.calculate = function(data) { return main(data); };

    main.layer = function(keyFunc) {
      nester.key(keyFunc);
      return main;
    };

    main.value = function(accfn) {
      valueAcc = accfn;
      return main;
    };

    return main;
  };

  var MAX_RW = module.exports.MAX_SUNBURST_RING_WIDTH = 60;
  var MIN_RW = module.exports.MIN_SUNBURST_RING_WIDTH = 10;

  /**
   * sszvis.layout.sunburst.computeLayout
   *
   * Computes layout parameters for good visual display of the sunburst chart.
   * 
   * @param  {Number} numLayers          The number of layers in the sunburst chart.
   * @param  {Number} chartWidth         The total width available for displaying the sunburst chart.
   * @return {Object}                    Some parameters for the sunburst chart:
   *       @property {Number} centerRadius      The central radius of the chart (used by the sunburst component)
   *       @property {Number} numLayers         The number of layers in the chart (used by the sunburst component)
   *       @property {Number} ringWidth         The width of a single ring in the chart (used by the sunburst component)
   */
  module.exports.computeLayout = function(numLayers, chartWidth) {
    // Diameter of the center circle is one-third the width
    var halfWidth = chartWidth / 2;
    var centerRadius = halfWidth / 3;
    var ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - centerRadius) / numLayers));

    return {
      centerRadius: centerRadius,
      numLayers: numLayers,
      ringWidth: ringWidth
    };
  };

  /**
   * sszvis.layout.sunburst.getRadiusExtent
   * @param  {Array} formattedData      An array of data to inspect for the extent of the radius scale
   *
   * @return {Array}                    The minimum and maximum radius values (in d3's partition layout's terms). Use this as
   *                                    The domain of the radius scale you use to configure the sunburst chart. This is a convenience
   *                                    function which abstracts away the way d3 stores positions within the partition layout used
   *                                    by the sunburst chart.
   */
  module.exports.getRadiusExtent = function(formattedData) {
    return [
      d3.min(formattedData, function(d) { return d.y; }),
      d3.max(formattedData, function(d) { return d.y + d.dy; })
    ];
  };

});
