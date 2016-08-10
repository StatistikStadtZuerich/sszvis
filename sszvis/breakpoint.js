/**
 * Responsive design breakpoints for sszvis
 *
 * @module sszvis/breakpoint
 *
 * Provides the default breakpoint sizes for SSZVIS. The breakpoints are inclusive upper limits,
 * i.e. [0 - 320] is the first range, [0 - 568] is the second, and so on. The user should, where possible,
 * test against breakpoints in increasing order of size
 *
 * @property {Function} phone_p    The phone portrait orientation breakpoint
 * @property {Function} phone_l    The phone landscape orientation breakpoint
 * @property {Function} tablet_p    The tablet portrait orientation breakpoint
 * @property {Function} tablet_l    The tablet landscape orientation breakpoint
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

  module.exports.defaults = {
    phone_p: makeBreakpoint({ width: 320 }),
    phone_l: makeBreakpoint({ width: 568 }),
    tablet_p: makeBreakpoint({ width: 768 }),
    tablet_l: makeBreakpoint({ width: 1024, screenHeight: 768 }),
  };

  module.exports.make = makeBreakpoint;

});
