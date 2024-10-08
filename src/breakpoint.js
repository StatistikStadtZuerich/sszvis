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
 * @property {Function} defaultSpec
 * @property {Function} findByName
 * @property {Function} find
 * @property {Function} match
 * @property {Function} test
 *
 * @property {Function} palm Breakpoint for plam-sized devices (phones)
 * @property {Function} lap  Breakpoint for lap-sized devices (tablets, small notebooks)
 *
 * @type Measurement {
 *   width: number,
 *   screenHeight: number
 * }
 *
 * @type Breakpoint {
 *   name: string,
 *   measurement: Measurement
 * }
 */

import * as fn from "./fn.js";

/**
 * breakpoint.find
 *
 * Returns the first matching breakpoint for a given measurement
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Breakpoint}
 */
export function breakpointFind(breakpoints, partialMeasurement) {
  const measurement = parseMeasurement(partialMeasurement);
  return fn.find((bp) => breakpointTest(bp, measurement), breakpoints);
}

/**
 * breakpoint.findByName
 *
 * Returns the breakpoint with the given name. If there is no such breakpoint,
 * undefined is returned
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {string} name A breakpoint name
 * @returns {Breakpoint?} If no breakpoint matches, undefined is returned. If a
 *          breakpoint for the given name exists, that breakpoint is returned
 */
export function breakpointFindByName(breakpoints, name) {
  const eqName = function (bp) {
    return bp.name === name;
  };
  return fn.find(eqName, breakpoints);
}

/**
 * breakpoint.test
 *
 * Returns true if the given measurement fits within the breakpoint.
 *
 * @param {Breakpoint} breakpoint A single breakpoint
 * @param {Measurement} partialMeasurement A partial measurement to match to the breakpoint
 * @returns {boolean}
 */
export function breakpointTest(breakpoint, partialMeasurement) {
  const bpm = breakpoint.measurement;
  const measurement = parseMeasurement(partialMeasurement);
  return measurement.width <= bpm.width && measurement.screenHeight <= bpm.screenHeight;
}

/**
 * breakpoint.match
 *
 * Returns an array of breakpoints the given measurement fits into. Use this in situations
 * where you need to match a sparse list of breakpoints.
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Array<Breakpoint>}
 */
export function breakpointMatch(breakpoints, partialMeasurement) {
  const measurement = parseMeasurement(partialMeasurement);
  return breakpoints.filter((bp) => breakpointTest(bp, measurement));
}

/**
 * breakpoint.createSpec
 *
 * Parses an array of partial breakpoints into a valid breakpoint spec.
 *
 * @param {Array<{name: string, width?: number, screenHeight?: number}>} spec An array
 *        of breakpoint definitions. All breakpoints are parsed into a full representation,
 *        so it's possible to only provide partial breakpoint definitions.
 * @returns {Array<Breakpoint>}
 */
export function breakpointCreateSpec(spec) {
  return [...spec.map(parseBreakpoint), parseBreakpoint({ name: "_" })];
}

/**
 * breakpoint.defaultSpec
 *
 * @returns {Array<{name: string, width: number, screenHeight: number}>} The SSZVIS
 *          default breakpoint spec.
 */
export const breakpointDefaultSpec = (function () {
  const DEFAULT_SPEC = breakpointCreateSpec([
    { name: "palm", width: 540 },
    { name: "lap", width: 749 },
  ]);
  return function () {
    return DEFAULT_SPEC;
  };
})();

// Default tests
export const breakpointPalm = makeTest("palm");
export const breakpointLap = makeTest("lap");

// Helpers

/**
 * Measurement
 *
 * A measurement is defined as an object with width and screenHeight props.
 * It is used throughout the breakpoint calculations.
 *
 * For parsing, a partial measurement can be supplied. If a property is
 * not defined, it is initialized to Infinity, which matches all breakpoints.
 *
 * @example
 *   const Measurement = {
 *     width: number,
 *     screenHeight: number
 *   }
 *
 * @param {{width?: number, screenHeight?: number}} partialMeasurement
 * @returns Measurement
 */
function parseMeasurement(partialMeasurement) {
  const widthOrInf = fn.propOr("width", Infinity);
  const screenHeightOrInf = fn.propOr("screenHeight", Infinity);
  return {
    width: widthOrInf(partialMeasurement),
    screenHeight: screenHeightOrInf(partialMeasurement),
  };
}

/**
 * Breakpoint
 *
 * A breakpoint is defined as an object with name and measurement props.
 * It is used throughout the breakpoint calculations.
 *
 * For parsing, a partial breakpoint can be supplied where measurements
 * can be directly supplied on the top object.
 *
 * @example
 *   const PartialBreakpoint = {
 *     name: string,
 *     width?: number,
 *     screenHeight?: number
 *   }
 *
 *   const Breakpoint = {
 *     name: string,
 *     measurement: Measurement
 *   }
 *
 * @param {{name: string, width?: number, screenHeight?: number, measurement?: Measurement}} bp
 * @returns Breakpoint
 */
function parseBreakpoint(bp) {
  const measurement = fn.defined(bp.measurement)
    ? parseMeasurement(bp.measurement)
    : parseMeasurement({ width: bp.width, screenHeight: bp.screenHeight });
  return {
    name: bp.name,
    measurement,
  };
}

/**
 * Create a partially applied test function
 */
function makeTest(name) {
  return function (measurement) {
    return breakpointTest(breakpointFindByName(breakpointDefaultSpec(), name), measurement);
  };
}
