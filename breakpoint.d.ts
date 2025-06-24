/**
 * breakpoint.find
 *
 * Returns the first matching breakpoint for a given measurement
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Breakpoint}
 */
export function breakpointFind(breakpoints: Array<Breakpoint>, partialMeasurement: Measurement): Breakpoint;
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
export function breakpointFindByName(breakpoints: Array<Breakpoint>, name: string): Breakpoint | null;
/**
 * breakpoint.test
 *
 * Returns true if the given measurement fits within the breakpoint.
 *
 * @param {Breakpoint} breakpoint A single breakpoint
 * @param {Measurement} partialMeasurement A partial measurement to match to the breakpoint
 * @returns {boolean}
 */
export function breakpointTest(breakpoint: Breakpoint, partialMeasurement: Measurement): boolean;
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
export function breakpointMatch(breakpoints: Array<Breakpoint>, partialMeasurement: Measurement): Array<Breakpoint>;
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
export function breakpointCreateSpec(spec: Array<{
    name: string;
    width?: number;
    screenHeight?: number;
}>): Array<Breakpoint>;
export function breakpointDefaultSpec(): Breakpoint[];
export function breakpointPalm(measurement: any): boolean;
export function breakpointLap(measurement: any): boolean;
//# sourceMappingURL=breakpoint.d.ts.map