/**
 * Responsive design breakpoints for sszvis
 *
 * @module sszvis/breakpoint
 *
 * Provides breakpoint-related functions, including those which build special
 * breakpoint objects that can be used to test against screen measurements to see
 * if the breakpoint matches, and this module also includes the default breakpoint
 * sizes for SSZVIS. The breakpoints are inclusive upper limits, i.e. when testing a
 * breakpoint against a given set of measurements, if the breakpoint value is greater than
 * or equal to all measurements, the breakpoint will match. In code where the user should
 * supply breakpoints, the user is responsible for specifying the testing order of the breakpoints
 * provided. The breakpoints are then tested in order, and the first one which matches the measurements
 * is chosen. The user should, where possible, specify breakpoints in increasing order of size.
 * Since there are multiple dimensions on which 'size' can be defined, we do not specify our own
 * algorithm for sorting user-defined breakpoints. We rely on the judgment of the user to do that.
 *
 * @property {Function} createSpec
 * @property {Function} findByName
 * @property {Function} match
 * @property {Function} test
 * @property {Function} defaultSpec
 *
 * @property {Function} phoneP  The phone portrait orientation breakpoint
 * @property {Function} phoneL  The phone landscape orientation breakpoint
 * @property {Function} tabletP The tablet portrait orientation breakpoint
 * @property {Function} tabletL The tablet landscape orientation breakpoint
 */
sszvis_namespace('sszvis.breakpoint', function(module) {

  var widthOrInf = sszvis.fn.propOr('width', Infinity);
  var screenHeightOrInf = sszvis.fn.propOr('screenHeight', Infinity);
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
      width: widthOrInf(partialMeasurement),
      screenHeight: screenHeightOrInf(partialMeasurement)
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

  function findByName(breakpoints, name) {
    var eqName = function(bp) { return bp.name === name; };
    return sszvis.fn.find(eqName, breakpoints);
  }

  function test(breakpoint, partialMeasurement) {
    var bpm = breakpoint.measurement;
    var measurement = parseMeasurement(partialMeasurement);
    return measurement.width <= bpm.width && measurement.screenHeight <= bpm.screenHeight;
  }

  function match(breakpoints, partialMeasurement) {
    var measurement = parseMeasurement(partialMeasurement);
    return breakpoints.filter(function(bp) {
      return test(bp, measurement);
    });
  }

  function find(breakpoints, partialMeasurement) {
    var measurement = parseMeasurement(partialMeasurement);
    return sszvis.fn.find(function(bp) {
      return test(bp, measurement);
    }, breakpoints);
  }


  /**
   * BreakpointSpec
   */

  function createSpec(spec) {
    return spec
      .map(parseBreakpoint)
      .concat(parseBreakpoint({name: '_'}));
  }


  /**
   * External API
   */

  var defaultSpec = createSpec([
    { name: 'phoneP',  width:  320 },
    { name: 'phoneL',  width:  568, screenHeight:  320 },
    { name: 'tabletL', width: 1024, screenHeight:  768 },
    { name: 'tabletP', width:  768 }
  ]);

  module.exports = {
    createSpec: createSpec,
    findByName: findByName,
    find: find,
    match: match,
    test: test,
    defaultSpec: function() { return defaultSpec; },

    // Default tests
    phoneP:  function(m){ return test(findByName(defaultSpec, 'phoneP'), m); },
    phoneL:  function(m){ return test(findByName(defaultSpec, 'phoneL'), m); },
    tabletL: function(m){ return test(findByName(defaultSpec, 'tabletL'), m); },
    tabletP: function(m){ return test(findByName(defaultSpec, 'tabletP'), m); }
  };

});
