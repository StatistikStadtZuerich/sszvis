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

import {
  breakpointCreateSpec,
  breakpointDefaultSpec,
  breakpointFindByName,
  breakpointMatch,
} from "./breakpoint.js";
import * as fn from "./fn.js";
import * as logger from "./logger.js";
import type { Breakpoint, Measurement } from "./types.js";

// Type definitions
export interface ResponsivePropValue<T = any> {
  [breakpointName: string]: T | ((width: number) => T);
  _: T | ((width: number) => T); // Default fallback required
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

/* Exported module
----------------------------------------------- */
export function responsiveProps(): ResponsivePropsInstance {
  let breakpointSpec = breakpointDefaultSpec();
  const propsConfig: ResponsivePropsConfig = {};

  /**
   * Constructor
   *
   * @param   {Measurement} arg1 Accepts a 'measurement' object with a
   *          width and screenHeight. You can also pass it a 'bounds' object which contains
   *          measurements, but you must also include the screen measurements. This is the shape
   *          of object returned by sszvis.measureDimensions
   * @returns {object} An object containing the configured properties and their values for the current
   *          breakpoint as defined by the parameter `arg1`
   */
  function _responsiveProps(measurement: Measurement): Record<string, any> {
    if (!fn.isObject(measurement) || !isBounds(measurement)) {
      logger.warn("Could not determine the current breakpoint, returning the default props");
      // We choose the _ option for all configured props as a default.
      return Object.keys(propsConfig).reduce(
        (memo, val, key) => {
          memo[key] = val;
          return memo;
        },
        {} as Record<string, any>
      );
    }

    // Create results object based on the current measurements and the configured breakpoints and properties
    return Object.keys(propsConfig).reduce((memo: Record<string, any>, propKey: string) => {
      const propSpec = propsConfig[propKey];

      // Finds out which breakpoints the provided measurements match up with
      const matchingBreakpoints = breakpointMatch(breakpointSpec, measurement);

      // Validate the propSpec for the current propKey
      if (!validatePropSpec(propSpec, breakpointSpec)) {
        logger.warn(
          "ResponsiveProps - invalid propSpec for " +
            propKey +
            ". Make sure you define the '_' fallback and that all breakpoint names are valid."
        );
        return memo;
      }

      // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
      // This function should always at least find '_' at the end of the array.
      const matchedBreakpoint = fn.find((bp) => fn.defined(propSpec[bp.name]), matchingBreakpoints);
      // the value in the query object for that property equals the propSpec value as a functor,
      // invoked if necessary with the current width. Providing the width allows aspect ratio
      // calculations based on element width.
      if (matchedBreakpoint) {
        memo[propKey] = propSpec[matchedBreakpoint.name](measurement.width);
      } else {
        // Use fallback value if no breakpoint matches
        const fallback = propSpec._;
        memo[propKey] = typeof fallback === "function" ? fallback(measurement.width) : fallback;
      }

      return memo;
    }, {});
  }

  /**
   * responsiveProps.prop
   *
   * Define a responsive property that can assume different values depending on the
   * currently active breakpoint.
   *
   * @example
   * var queryProps = sszvis.responsiveProps()
   *   .prop('height', {
   *     palm: function(width) { return width /  (4/3); },
   *     lap:  function(width) { return width / (16/9); },
   *     _: 600 // You must always define a default case
   *   });
   *
   * The algorithm looks for the lowest applicable breakpoint. If a breakpoint's width or
   * screenHeight are larger than the current container and screen dimensions, its properties
   * will not apply. In case no breakpoint matches, the fallback value is used; it must always
   * be provided with the key name '_'.
   *
   * Each value can be either a raw value or a function which takes the current width
   * and returns a value for the property. These functions can be used to lazily calculate
   * properties (they are only executed when the module is called as a function),
   * and to change property values for a given breakpoint as a function of the width,
   * for example to do height calculation with a custom aspect ratio.
   *
   * @param {string} propName The name of the property you want to define
   * @param {Object.<string, (Function(number) -> *|*)>} propSpec A map of breakpoint names to
   *        property values. Key names must be valid breakpoint names. These can either be the
   *        default breakpoint names (see sszvis.breakpoint) or user-defined names that match up
   *        to breakpoints you have provided. Additionally, the fallback key `_` must be defined;
   *        its value will be used for screens larger than the largest breakpoint. You don't
   *        have to define all breakpoints; if you skip a breakpoint, the next applicable breakpoint
   *        in the test list will be used. Values can be either plain values or
   *        functions that accept the current breakpoint width and return a value.
   *
   * @return {responsiveProps}
   */
  _responsiveProps.prop = function <T>(
    propName: string,
    propSpec: ResponsivePropValue<T>
  ): ResponsivePropsInstance {
    propsConfig[propName] = functorizeValues(propSpec);
    return _responsiveProps;
  };

  /**
   * responsiveProps.breakpoints
   *
   * Configure custom breakpoints for the responsiveProps. You don't need to call
   * this method; there are default breakpoints (see sszvis.breakpoint).
   * You should provide an array of breakpoint specifiers, each one an object with at
   * least a 'name' property (used as an identifier for the breakpoint), and one or both
   * of a 'width' or 'screenHeight' property. When choosing a matching breakpoint, the
   * 'width' will be compared to the provided container width, and the 'screenHeight'
   * to the window.innerHeight. These values are inclusive, so if the measured value is
   * equal to or less than the provided breakpoint value, that breakpoint matches.
   *
   * This component has default breakpoints which are equal to the ones described
   * in the sszvis.breakpoint module. This method can also be called without arguments
   * to get the breakpoints list.
   *
   * @param {Array.<Object.<string, (string|number)>>} [bps] Define the breakpoints to be used.
   *                                                   Object format is:
   *                                                     {
   *                                                       name: breakpointname,
   *                                                       width: (optional) container width of this bp
   *                                                       screenHeight: (optional) window.innerHeight of this bp
   *                                                     }
   *                                                   if neither width nor screenHeight is provided, the breakpoint
   *                                                   will match all possible dimensions.
   *
   * @example
   * var queryProps = sszvis.responsiveProps()
   * .breakpoints([
   *   { name: 'small', width: 300 },
   *   { name: 'medium', width: 500 },
   *   { name: 'large', width: 700 }
   * ])
   */
  _responsiveProps.breakpoints = function (...args: any[]): any {
    if (args.length === 0) {
      return breakpointSpec;
    }
    const bps = args[0] as Breakpoint[];
    breakpointSpec = breakpointCreateSpec(bps);
    return _responsiveProps;
  };

  return _responsiveProps;
}

// Helpers

function isBounds(arg1: any): arg1 is Measurement & { bounds: any } {
  return (
    fn.defined(arg1) &&
    fn.defined(arg1.width) &&
    fn.defined(arg1.screenWidth) &&
    fn.defined(arg1.screenHeight)
  );
}

/**
 * functorizeValues
 * @prop    {object} obj Original key-value object
 * @returns {object} Same as input object but with all values transformed to width-accepting functions
 */
function functorizeValues<T>(obj: ResponsivePropValue<T>): ResponsivePropValue<T> {
  const result: ResponsivePropValue<T> = {} as ResponsivePropValue<T>;

  Object.keys(obj).forEach((key: string) => {
    const value = obj[key];
    if (typeof value === "function") {
      result[key] = value;
    } else {
      result[key] = () => value;
    }
  });

  return result;
}

function validatePropSpec(propSpec: ResponsivePropValue, breakpointSpec: Breakpoint[]): boolean {
  // Ensure that the propSpec contains a '_' value.
  // This is used as the default value when the test width
  // is larger than any breakpoint.
  if (!fn.defined(propSpec._)) {
    return false;
  }

  // Validate the properties of the propSpec:
  // each should be a valid breakpoint name, and its value should be defined
  for (const breakpointName in propSpec) {
    if (
      Object.prototype.hasOwnProperty.call(propSpec, breakpointName) &&
      breakpointName !== "_" &&
      !fn.defined(breakpointFindByName(breakpointSpec, breakpointName))
    ) {
      return false;
    }
  }

  // All checks passed, propSpec is valid
  return true;
}
