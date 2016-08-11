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

  // This is an inclusive test that a prop from a measured object is less than or equal to the same prop
  // from a spec object. (If the prop exists on the spec object). Helper function for sszvis.breakpoint
  function testBreakpointProp(prop, measured, spec) {
    return !sszvis.fn.defined(spec[prop]) || (sszvis.fn.defined(measured[prop]) && measured[prop] <= spec[prop]);
  }

  // Accepts a bpSpec object ({ width: ..., screenWidth: ..., screenHeight: ... })
  // and returns a usable breakpoint function, which tests against a set of measurements
  // and returns true if the measurements fall within the breakpoint described in the spec
  // Also appends a .getValue method, which is necessary, and used to determine the order
  // of application of successive breakpoints (breakpoints should be tested smallest to largest,
  // to determine the smallest one that matches the measurements)
  function makeBreakpoint(bpSpec) {
    var breakpointFunc = function(measurements) {
      var testA = testBreakpointProp('width', measurements, bpSpec);
      var testB = testBreakpointProp('screenWidth', measurements, bpSpec);
      var testC = testBreakpointProp('screenHeight', measurements, bpSpec);
      return testA && testB && testC;
    };
    breakpointFunc.getValue = function() {
      return sszvis.fn.defined(bpSpec.width) ? bpSpec.width : bpSpec.screenHeight;
    };
    return breakpointFunc;
  }

  /*
  module.exports.defaults = {
    phoneP: makeBreakpoint({ width: 320 }),
    phoneL: makeBreakpoint({ width: 568 }),
    tabletP: makeBreakpoint({ width: 768 }),
    tabletL: makeBreakpoint({ width: 1024, screenHeight: 768 })
  };
*/


  // ---------------------------------------------------------------------------


  /**
   * Measurement
   *
   *   {
   *     width: number,
   *     height: number,
   *     screenWidth: number,
   *     screenHeight: number
   *   }
   */

  function parseMeasurement(partialMeasurement) {
    return {
      width: sszvis.fn.propOr('width', Infinity)(partialMeasurement),
      height: sszvis.fn.propOr('height', Infinity)(partialMeasurement), // FIXME: sszvis.measureDimensions() doesn't have this
      screenWidth: sszvis.fn.propOr('screenWidth', Infinity)(partialMeasurement),
      screenHeight: sszvis.fn.propOr('screenHeight', Infinity)(partialMeasurement)
    };
  }

  function compareMeasurements(mA, mB) {
    // FIXME: real comparison here
    return (mA.width <= mB.width) ? -1 : 1;
  }


  /**
   * Breakpoint
   *
   *   {
   *     name: string,
   *     measurement: Measurement,
   *     test: (measurement) -> boolean
   *   }
   */

  function parseBreakpoint(name, def) {
    var test, measurement;

    if (sszvis.fn.isFunction(def)) {
      measurement = def();
      test = def;
    } else {
      measurement = parseMeasurement(def);
      test = function(_measurement) {
        if (arguments.length === 0) {
          return measurement;
        }
        return compareMeasurements(measurement, _measurement); // FIXME: return boolean
      };
    }

    return {
      name: name,
      measurement: measurement,
      test: test
    };
  }

  function compareBreakpoints(bpA, bpB) {
    return compareMeasurements(bpA.measurement, bpB.measurement);
  }

  function catchAllBreakpoint() {
    return {
      name: '_',
      measurement: parseMeasurement({}),
      test: function() {
        return true;
      }
    };
  }



  /**
   * BreakpointSpec
   */

  function parseSpec(_spec) {
    return Object.keys(_spec)
      .map(function(specName) {
        return parseBreakpoint(specName, _spec[specName]);
      })
      .sort(compareBreakpoints);
  }

  // FIXME: we currently have two ways to represent breakpoints, once as
  // a key-value object and once as an array. The latter is the better
  // representation as it has order to it, but is it usable?
  function exportSpec(_spec) {
    return _spec.reduce(function(def, breakpoint) {
      def[breakpoint.name] = breakpoint.test;
      return def;
    }, {});
  }

  function matchBreakpoints(breakpoints, measurement) {
    return breakpoints
      .filter(function(bp) {
        return compareMeasurements(bp.measurement, measurement) >= 0;
      })
      .concat(catchAllBreakpoint());
  }


  /**
   * External API
   */

  var defaultSpec = exportSpec(parseSpec({
    phoneP:  { width: 320 },
    phoneL:  { width: 568 },
    tabletP: { width: 768 },
    tabletL: { width: 1024, screenHeight: 768 }
  }));

  var spec = function(partialBpSpec) {
    if (arguments.length === 0) {
      return defaultSpec;
    }

    var breakpoints = parseSpec(partialBpSpec);

    return function(measurement) {
      if (arguments.length === 0) {
        return exportSpec(breakpoints);
      }
      return matchBreakpoints(breakpoints, measurement);
    };
  };


  module.exports = {
    spec: spec,
    phoneP: defaultSpec.phoneP,
    phoneL: defaultSpec.phoneL,
    tabletP: defaultSpec.tabletP,
    tabletL: defaultSpec.tabletL
  };

});
