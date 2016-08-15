/**
 * Responsive design breakpoints for sszvis
 *
 * @module sszvis/breakpoint
 *
 * Provides the default breakpoint sizes for SSZVIS. The breakpoints are inclusive upper limits,
 * i.e. [0 - 320] is the first range, [0 - 568] is the second, and so on. The user should, where possible,
 * test against breakpoints in increasing order of size
 *
 * @property {Function} phoneP  The phone portrait orientation breakpoint
 * @property {Function} phoneL  The phone landscape orientation breakpoint
 * @property {Function} tabletP The tablet portrait orientation breakpoint
 * @property {Function} tabletL The tablet landscape orientation breakpoint
 */
sszvis_namespace('sszvis.breakpoint', function(module) {

  /**
   * Measurement
   *
   *   {
   *     width: number,
   *     screenHeight: number
   *   }
   */

  function parseMeasurement(partialMeasurement) {
    return {
      width: sszvis.fn.propOr('width', Infinity)(partialMeasurement),
      screenHeight: sszvis.fn.propOr('screenHeight', Infinity)(partialMeasurement)
    };
  }


  /**
   * Breakpoint
   *
   *   {
   *     name: string,
   *     measurement: Measurement
   *   }
   */

  function parseBreakpoint(_bp) {
    var measurement = parseMeasurement({width: _bp.width, screenHeight: _bp.screenHeight});
    var bp = {
      name: _bp.name,
      measurement: measurement
    };
    return bp;
  }

  function find(breakpoints, name) {
    var eqName = function(bp) { return bp.name === name; };
    return sszvis.fn.find(eqName, breakpoints);
  }

  function test(breakpoint, partialMeasurement) {
    var bpm = breakpoint.measurement;
    var measurement = parseMeasurement(partialMeasurement);
    return measurement.width <= bpm.width && measurement.screenHeight <= bpm.screenHeight;
  }

  function match(breakpoints, measurement) {
    return breakpoints.filter(function(bp) {
      return test(bp, measurement);
    });
  }


  /**
   * BreakpointSpec
   */

  function parseSpec(spec) {
    return spec
      .map(parseBreakpoint)
      .concat(parseBreakpoint({name: '_'}));
  }


  /**
   * External API
   */

  var defaultSpec = parseSpec([
    {name: 'phoneP',  width:  320 },
    {name: 'phoneL',  width:  568, screenHeight:  320 },
    {name: 'tabletP', width:  768 },
    {name: 'tabletL', width: 1024, screenHeight:  768 }
  ]);


  // Magic going on here: default use of match
  // What if we want to test?
  // Or is it a good default?
  // sszvis.spec([])(measurement)
  // sszvis.breakpoint.match(sszvis.createSpec([]), measurement)
  var spec = function(partialBpSpec) {
    var breakpoints = parseSpec(partialBpSpec);
    return function(partialMeasurement) {
      var measurement = parseMeasurement(partialMeasurement);
      return match(breakpoints, measurement);
    };
  };

  module.exports = {
    spec: spec,
    find: find,
    match: match,
    test: test,
    defaultSpec: function() {
      return defaultSpec;
    },

    // Default tests
    phoneP:  function(m){ return test(find(defaultSpec, 'phoneP'), m)},
    phoneL:  function(m){ return test(find(defaultSpec, 'phoneL'), m)},
    phoneX:  function(m){ return test(find(defaultSpec, 'phoneX'), m)},
    tabletP: function(m){ return test(find(defaultSpec, 'tabletP'), m)},
    tabletL: function(m){ return test(find(defaultSpec, 'tabletL'), m)}
  };

});
