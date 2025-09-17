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
 */

import * as fn from "./fn";

/**
 * A measurement object with width and screen height
 */
export interface Measurement {
  width: number;
  screenHeight: number;
}

/**
 * A breakpoint definition with name and measurement constraints
 */
export interface Breakpoint {
  name: string;
  measurement: Measurement;
}

/**
 * Breakpoint definition with explicit measurement object
 * @example { name: "mobile", measurement: { width: 480, screenHeight: 800 } }
 */
interface BreakpointWithMeasurement {
  name: string;
  measurement: Partial<Measurement>;
}

/**
 * Breakpoint definition with inline measurement properties
 * @example { name: "mobile", width: 480, screenHeight: 800 }
 */
interface BreakpointWithInlineProps extends Partial<Measurement> {
  name: string;
}

/**
 * Union type for breakpoint creation - supports two patterns:
 * 1. With explicit measurement object
 * 2. With inline width/screenHeight properties
 */
export type PartialBreakpoint = BreakpointWithMeasurement | BreakpointWithInlineProps;

/**
 * Returns the first matching breakpoint for a given measurement
 *
 * @param breakpoints A breakpoint spec
 * @param partialMeasurement A partial measurement to match to the spec
 * @returns The first matching breakpoint or undefined if none match
 */
export function breakpointFind(
  breakpoints: Breakpoint[],
  partialMeasurement: Partial<Measurement>
): Breakpoint | undefined {
  const measurement = parseMeasurement(partialMeasurement);
  return fn.find((bp: Breakpoint) => breakpointTest(bp, measurement), breakpoints);
}

/**
 * Returns the breakpoint with the given name
 *
 * @param breakpoints A breakpoint spec
 * @param name A breakpoint name
 * @returns The breakpoint with the given name or undefined if not found
 */
export function breakpointFindByName(
  breakpoints: Breakpoint[],
  name: string
): Breakpoint | undefined {
  const eqName = function (bp: Breakpoint): boolean {
    return bp.name === name;
  };
  return fn.find(eqName, breakpoints);
}

/**
 * Returns true if the given measurement fits within the breakpoint
 *
 * @param breakpoint A single breakpoint
 * @param partialMeasurement A partial measurement to match to the breakpoint
 * @returns True if the measurement fits within the breakpoint
 */
export function breakpointTest(
  breakpoint: Breakpoint,
  partialMeasurement: Partial<Measurement>
): boolean {
  const bpm = breakpoint.measurement;
  const measurement = parseMeasurement(partialMeasurement);
  return measurement.width <= bpm.width && measurement.screenHeight <= bpm.screenHeight;
}

/**
 * Returns an array of breakpoints the given measurement fits into
 *
 * @param breakpoints A breakpoint spec
 * @param partialMeasurement A partial measurement to match to the spec
 * @returns Array of matching breakpoints
 */
export function breakpointMatch(
  breakpoints: Breakpoint[],
  partialMeasurement: Partial<Measurement>
): Breakpoint[] {
  const measurement = parseMeasurement(partialMeasurement);
  return breakpoints.filter((bp) => breakpointTest(bp, measurement));
}

/**
 * Parses an array of partial breakpoints into a valid breakpoint spec
 *
 * @param spec An array of breakpoint definitions
 * @returns A complete breakpoint specification
 */
export function breakpointCreateSpec(spec: PartialBreakpoint[]): Breakpoint[] {
  return [...spec.map(parseBreakpoint), parseBreakpoint({ name: "_" })];
}

/**
 * Returns the SSZVIS default breakpoint spec
 *
 * @returns The default breakpoint specification
 */
export const breakpointDefaultSpec = (function (): () => Breakpoint[] {
  const DEFAULT_SPEC = breakpointCreateSpec([
    { name: "palm", width: 540 },
    { name: "lap", width: 749 },
  ]);
  return function (): Breakpoint[] {
    return DEFAULT_SPEC;
  };
})();

// Default tests
export const breakpointPalm = makeTest("palm");
export const breakpointLap = makeTest("lap");

/* Helper functions
----------------------------------------------- */

/**
 * Parse a partial measurement into a complete measurement
 * Missing properties default to Infinity to match all breakpoints
 *
 * @param partialMeasurement Partial measurement object
 * @returns Complete measurement object
 */
function parseMeasurement(partialMeasurement: Partial<Measurement>): Measurement {
  const widthOrInf = fn.propOr("width", Infinity);
  const screenHeightOrInf = fn.propOr("screenHeight", Infinity);
  return {
    width: widthOrInf(partialMeasurement) as number,
    screenHeight: screenHeightOrInf(partialMeasurement) as number,
  };
}

/**
 * Parse a partial breakpoint into a complete breakpoint
 *
 * @param bp Partial breakpoint definition
 * @returns Complete breakpoint object
 */
function parseBreakpoint(bp: PartialBreakpoint): Breakpoint {
  // Type guard to check if bp has measurement property
  const hasMeasurement = (obj: PartialBreakpoint): obj is BreakpointWithMeasurement => {
    return "measurement" in obj;
  };

  const measurement = hasMeasurement(bp)
    ? parseMeasurement(bp.measurement)
    : parseMeasurement({ width: bp.width, screenHeight: bp.screenHeight });

  return {
    name: bp.name,
    measurement,
  };
}

/**
 * Create a partially applied test function for a named breakpoint
 *
 * @param name The breakpoint name to test against
 * @returns A function that tests measurements against the named breakpoint
 */
function makeTest(name: string): (measurement: Partial<Measurement>) => boolean {
  return function (measurement: Partial<Measurement>): boolean {
    const breakpoint = breakpointFindByName(breakpointDefaultSpec(), name);
    return breakpoint ? breakpointTest(breakpoint, measurement) : false;
  };
}
