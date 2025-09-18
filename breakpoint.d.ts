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
import type { Breakpoint, Measurement } from "./types.js";
interface BreakpointWithMeasurement {
    name: string;
    measurement: Partial<Measurement>;
}
interface BreakpointWithInlineProps extends Partial<Measurement> {
    name: string;
}
export type PartialBreakpoint = BreakpointWithMeasurement | BreakpointWithInlineProps;
/**
 * breakpoint.find
 *
 * Returns the first matching breakpoint for a given measurement
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Breakpoint}
 */
export declare function breakpointFind(breakpoints: Breakpoint[], partialMeasurement: Partial<Measurement>): Breakpoint | undefined;
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
export declare function breakpointFindByName(breakpoints: Breakpoint[], name: string): Breakpoint | undefined;
/**
 * breakpoint.test
 *
 * Returns true if the given measurement fits within the breakpoint.
 *
 * @param {Breakpoint} breakpoint A single breakpoint
 * @param {Measurement} partialMeasurement A partial measurement to match to the breakpoint
 * @returns {boolean}
 */
export declare function breakpointTest(breakpoint: Breakpoint, partialMeasurement: Partial<Measurement>): boolean;
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
export declare function breakpointMatch(breakpoints: Breakpoint[], partialMeasurement: Partial<Measurement>): Breakpoint[];
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
export declare function breakpointCreateSpec(spec: PartialBreakpoint[]): Breakpoint[];
/**
 * breakpoint.defaultSpec
 *
 * @returns {Array<{name: string, width: number, screenHeight: number}>} The SSZVIS
 *          default breakpoint spec.
 */
export declare const breakpointDefaultSpec: () => Breakpoint[];
export declare const breakpointPalm: (measurement: Partial<Measurement>) => boolean;
export declare const breakpointLap: (measurement: Partial<Measurement>) => boolean;
export {};
//# sourceMappingURL=breakpoint.d.ts.map