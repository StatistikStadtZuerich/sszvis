sszvis_namespace('sszvis.layout.sunburst', function(module) {
  'use strict';

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

  module.exports.getRadiusExtent = function(formattedData) {
    return [
      d3.min(formattedData, function(d) { return d.y; }),
      d3.max(formattedData, function(d) { return d.y + d.dy; })
    ];
  };

});
