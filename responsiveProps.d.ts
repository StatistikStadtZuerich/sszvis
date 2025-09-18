/**
 * ResponsiveProps module
 *
 * @module sszvis/responsiveProps
 *
 *
 *
 * The module should be configured with any number of different properties that change
 * based on breakpoints, plus (optional) breakpoint configuration, and then called
 * as a function. You must pass in an object with 'width' and 'screenHeight' properties.
 * This is the kind of thing which is returned from sszvis.bounds and sszvis.measureDimensions.
 *
 *
 * The return value of the function call is an object which has properties corresponding to
 * the properties you configured before. The property values are decided based on testing the breakpoints
 * against the measured values and finding the first one in which the measured values fit.
 *
 * Example usage:
 *
 * var queryProps = sszvis.responsiveProps()
 *   .breakpoints([
 *     { name: 'small', width:  400 },
 *     { name: 'medium', width:  800 },
 *     { name: 'large', width: 1000 }
 *   ])
 *   .prop('axisOrientation', {
 *     medium: 'left',
 *     _: 'bottom'
 *   })
 *   .prop('height', {
 *     small: 200,
 *     medium: function(width) { return width * 3/4; },
 *     large: function(width) { return width / 2; },
 *     _: 400
 *   });
 *
 * queryProps({width: 300, screenHeight: 400}).axisOrientation; // returns "left"
 * queryProps({width: 300, screenHeight: 400}).height; // returns the result of 200 or the function call
 *
 * @param {{width: number, screenHeight: number}|{bounds: object, screenWidth: number, screenHeight: number}} arg dimensions object
 * @return {object} An object containing the properties you configured for the matching breakpoint
 *
 * You can also configure different breakpoints than the defaults using:
 *
 * @method responsiveProps.breakpoints
 *
 * And you can add responsive properties using:
 *
 * @method responsiveProps.prop
 */
import type { Breakpoint, Measurement } from "./types.js";
export interface ResponsivePropValue<T = any> {
    [breakpointName: string]: T | ((width: number) => T);
    _: T | ((width: number) => T);
}
export interface ResponsivePropsConfig {
    [propName: string]: ResponsivePropValue;
}
export interface ResponsivePropsInstance {
    (measurements: Measurement): Record<string, any>;
    prop<T>(propName: string, propSpec: ResponsivePropValue<T>): ResponsivePropsInstance;
    breakpoints(): Breakpoint[];
    breakpoints(bps: Breakpoint[]): ResponsivePropsInstance;
}
export declare function responsiveProps(): ResponsivePropsInstance;
//# sourceMappingURL=responsiveProps.d.ts.map