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
        .sort(function(a, b) { return d3.descending(a.value, b.value); });

      return partitionLayout({
        isSunburstRoot: true,
        values: nester.entries(data)
      });
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

  module.exports.computeLayout = function(numLayers, chartWidth) {
    // Diameter of the center circle is one-third the width
    var halfWidth = chartWidth / 2;
    var centerRadius = halfWidth / 3;
    var ringWidth = Math.min(MAX_RW, (halfWidth - centerRadius) / numLayers);

    return {
      centerRadius: centerRadius,
      numLayers: numLayers,
      ringWidth: ringWidth
    };
  };

});
