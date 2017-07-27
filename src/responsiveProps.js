/**
 * ResponsiveProps module
 *
 * @module sszvis/responsiveProps
 *
 * The ResponsiveProps module provides a declarative way to configure properties or options
 * which need to change based on some breakpoints. SSZVIS comes with a default
 * set of breakpoints (see sszvis.breakpoint), but you can also define your own breakpoints.
 *
 * The module should be configured with any number of different properties that change
 * based on breakpoints, plus (optional) breakpoint configuration, and then called
 * as a function. You must pass in an object with 'width' and 'screenHeight' properties.
 * This is the kind of thing which is returned from sszvis.bounds and fn.measureDimensions.
 *
 * The properties you configure must include an '_' option, which is used when no breakpoints match.
 * It represents the 'default' case and will also be returned when the responsiveProps function is
 * invoked with an invalid argument. If you configure special breakpoints, they should be passed in as
 * an array, sorted in testing order, of objects with a 'name' property, and one or both of 'width' and
 * 'screenHeight' properties. This will generate breakpoints which can be applied internally.
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
 *     small: function(w) { return w / (16 / 9); },
 *     medium: function(w) { return w / (20 / 9); },
 *     large: function(w) { return w / (28 / 9); },
 *     _: function(w) { return w / (38 / 9); }
 *   })
 *   .prop('numAxisTicks', {
 *     small: 4,
 *     medium: 8,
 *     large: 12,
 *     _: 16
 *   });
 *
 * var props = queryProps(fn.measureDimensions('#sszvis-chart'));
 * --- OR ---
 * var props = queryProps(fn.bounds({ ... }, '#sszvis-chart'));
 *
 * ... use props.axisOrientation, props.height, and props.numAxisTicks ...
 *
 * @returns {responsiveProps}
 */

import * as fn from './fn.js';
import * as logger from './logger.js';
import {breakpointDefaultSpec, breakpointMatch, breakpointCreateSpec, breakpointFindByName} from './breakpoint.js';

/* Exported module
----------------------------------------------- */
export function responsiveProps() {
  var breakpointSpec = breakpointDefaultSpec();
  var propsConfig = {};

  /**
   * Constructor
   *
   * @param   {{width: number, screenHeight: number}} arg1 Accepts a 'measurements' object with a
   *          'width' property and a 'screenHeight' property. This makes it possible to pass
   *          in a sszvis.bounds object or the result of fn.measureDimensions.
   *
   * @returns {Object.<string, any>} A map of all properties for the currently selected
   *          breakpoint as defined by the parameter `arg1`
   */
  function responsiveProps(measurement) {
    if (!fn.isObject(measurement) || !isBounds(measurement)) {
      logger.warn('Could not determine the current breakpoint, returning the default props');
      // We choose the _ option for all configured props as a default.
      return Object.keys(propsConfig).reduce(function(memo, val, key) {
        memo[key] = val._;
        return memo;
      }, {});
    }

    // Finds out which breakpoints the provided measurements match up with
    var matchingBreakpoints = breakpointMatch(breakpointSpec, measurement);

    return Object.keys(propsConfig).reduce(function(memo, propKey) {
      var propSpec = propsConfig[propKey];

      if (!validatePropSpec(propSpec, breakpointSpec)) {
        logger.warn('responsiveProps was given an invalid propSpec for property: "' + propKey + '". The spec: ', propSpec);
        return memo;
      }

      // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
      // This function should always at least find '_' at the end of the array.
      var matchedBreakpoint = fn.find(function(bp) { return fn.defined(propSpec[bp.name]); }, matchingBreakpoints);
      // the value in the query object for that property equals the propSpec value as a functor,
      // invoked if necessary with the current width. Providing the width allows aspect ratio
      // calculations based on element width.
      memo[propKey] = propSpec[matchedBreakpoint.name](measurement.width);

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
  responsiveProps.prop = function(propName, propSpec) {
    propsConfig[propName] = functorizeValues(propSpec);
    return responsiveProps;
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
  responsiveProps.breakpoints = function(bps) {
    if (arguments.length === 0) {
      return breakpointSpec;
    }
    breakpointSpec = breakpointCreateSpec(bps);
    return responsiveProps;
  };

  return responsiveProps;
};


// Helpers

function isBounds(arg1) {
  return fn.defined(arg1) && fn.defined(arg1.width) && fn.defined(arg1.screenWidth) && fn.defined(arg1.screenHeight);
}

/**
 * functorizeValues
 * @prop    {object} obj Original key-value object
 * @returns {object} Same as input object but with all values transformed to fn.functors
 */
function functorizeValues(obj) {
  return Object.keys(obj).reduce(function(memo, key) {
    memo[key] = fn.functor(obj[key]);
    return memo;
  }, {});
}

function validatePropSpec(propSpec, breakpointSpec) {
  // Ensure that the propSpec contains a '_' value.
  // This is used as the default value when the test width
  // is larger than any breakpoint.
  if (!fn.defined(propSpec._)) { return false; }

  // Validate the properties of the propSpec:
  // each should be a valid breakpoint name, and its value should be defined
  for (var breakpointName in propSpec) {
    if (propSpec.hasOwnProperty(breakpointName)) {
      if (breakpointName !== '_' && !fn.defined(breakpointFindByName(breakpointSpec, breakpointName))) {
        return false;
      }
    }
  }

  // All checks passed, propSpec is valid
  return true;
}
