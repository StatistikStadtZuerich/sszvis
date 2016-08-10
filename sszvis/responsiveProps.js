/**
 * ResponsiveProps module
 *
 * @module sszvis/responsiveProps
 *
 * The ResponsiveProps module provides a declarative way to configure properties or options
 * which need to change based on some breakpoints. SSZVIS comes with a default
 * set of breakpoints (see sszvis.breakpoints), but you can also use this module
 * to define your own breakpoints.
 *
 * The module should be configured with any number of different properties that change based on breakpoints,
 * plus (optional) breakpoint configuration, and then called as a function. You can pass
 * in either a number (the width used to calculate which breakpoints apply) or an object with
 * a 'width' property. The latter makes it possible to directly pass in a sszvis.bounds object.
 *
 * The return value of the function call is an object which has properties corresponding to
 * the properties you configured before. The property values are equal to the value based on the
 * breakpoint application.
 *
 * Example usage:
 *
 * var queryProps = sszvis.responsiveProps()
 *   .breakpoints({
 *     small: sszvis.breakpoint.make({ width: 400 }),
 *     medium: sszvis.breakpoint.make({ width: 800 }),
 *     large: sszvis.breakpoint.make({ width: 1000 }),
 *   })
 *   .prop('axisOrientation', {
 *     medium: 'left',
 *     _: 'bottom'
 *   })
 *   .prop('height', {
 *     small: function(w) { return w / (16 / 9); },
 *     medium: function(w) { return w / (20 / 9); },
 *     large: function(w) { return w / (28 / 9); },
 *     _: function(w) { return w / (38 / 9); },
 *   })
 *   .prop('numAxisTicks', {
 *     small: 4,
 *     medium: 8,
 *     large: 12,
 *     _: 16,
 *   });
 *
 * var props = queryProps(sszvis.fn.measureDimensions('#sszvis-chart'));
 * --- OR ---
 * var bounds = sszvis.fn.bounds({}, '#sszvis-chart');
 * var props = queryProps(bounds);
 *
 * ... use props.axisOrientation, props.height, and props.numAxisTicks ...
 *
 * @returns {responsiveProps}
 */
sszvis_namespace('sszvis.responsiveProps', function(module) {
  'use strict';

  /* Exported module
  ----------------------------------------------- */
  module.exports = function() {
    // This is essentially a defensive clone of sszvis.breakpoint.defaults
    var breakpointSpec = {
      phone_p: sszvis.breakpoint.defaults.phone_p,
      phone_l: sszvis.breakpoint.defaults.phone_l,
      tablet_p: sszvis.breakpoint.defaults.tablet_p,
      tablet_l: sszvis.breakpoint.defaults.tablet_l
    };
    var breakpointKeys = orderedBreakpointKeys(breakpointSpec);
    var propsConfig = {};

    /**
     * Constructor
     *
     * @param   {number|{width: number}} arg1 Accepts either a number or an object with a
     *          'width' property. This makes it possible to pass in a sszvis.bounds object.
     *
     * @returns {Object.<string, any>} A map of all properties for the currently selected
     *          breakpoint as defined by the parameter `arg1`
     */
    function responsiveProps(measurements) {
      if (!sszvis.fn.isObject(measurements) || !isBounds(measurements)) {
        sszvis.logger.warn('Could not determine the current breakpoint, returning the default props');
        return undefined; // FIXME: return default props
      }

      // Finds out which breakpoints the provided width matches up with
      // Assumes that breakpointKeys is an array of breakpoint names sorted
      // in increasing order of breakpoint size and that all keys in
      // breakpointKeys are also in breakpointSpec.
      // The default value. '_' stands for 'everything else'
      var bpMatches = ['_'];
      // If there are no breakpoints set, or if the width is equal to
      // or larger than the largest breakpoint, don't bother searching.
      if (breakpointKeys.length > 0 && breakpointSpec[sszvis.fn.last(breakpointKeys)](measurements)) {
          // Once we get to the first breakpoint which the width falls under,
          // that means that the width matches it and all subsequent breakpoints.
          var bpIndex = breakpointKeys.findIndex(function(key) {
            return breakpointSpec[key](measurements);
          });
          // Attach '_' as the last value in the list of breakpoint keys. That's for
          // situations where we're searching these keys for something that also
          // appears in the propSpec, but the propSpec doesn't include anything low enough.
          bpMatches = (bpIndex === -1 ? [] : breakpointKeys.slice(bpIndex)).concat('_');
      }

      return Object.keys(propsConfig).reduce(function(memo, propKey) {
        var propSpec = propsConfig[propKey];

        if (!validatePropSpec(propSpec, breakpointSpec)) {
          sszvis.logger.warn('responsiveProps was given an invalid propSpec for property: "' + propKey + '". The spec: ', propSpec);
          return memo;
        }

        // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
        // This function should always at least find '_' at the end of the array.
        var matchedBreakpoint = bpMatches.find(function(bpName) { return sszvis.fn.defined(propSpec[bpName]); });
        // the value in the query object for that property equals the propSpec value as a functor,
        // invoked if necessary with the current width. Providing the width allows aspect ratio
        // calculations based on element width.
        memo[propKey] = propSpec[matchedBreakpoint](width);

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
     *     small: function(width) { return width / (4/3); },
     *     tablet: function(width) { return width / (16/9); },
     *     _: 600 // You must always define a default case
     *   })
     *
     * The algorithm looks for the lowest applicable breakpoint. If a breakpoint's width is
     * equal to or larger than the currently active breakpoint its properties will not apply.
     * In case no breakpoint matches, the fallback value is used; it must always be provided
     * with the key name '_'.
     *
     * Each value can be either a raw value or a function which takes the current width
     * and returns a value for the property. These functions can be used to lazily calculate
     * properties (they are only executed when the module is called as a function),
     * and to change property values for a given breakpoint as a function of the width,
     * for example to do height calculation with a custom aspect ratio.
     *
     * @param {string} propName The name of the property you want to define
     * @param {Object.<string, (Function(number)|number)>} propSpec A map of breakpoint names to
     *        breakpoint widths. Key names must be valid breakpoint names. Additionally, the
     *        fallback key `_` must be defined; its value will be used for screens larger than
     *        the largest breakpoint. You don't have to define all breakpoints; if you skip a
     *        breakpoint the next smallest breakpoint will be used. Values must be numbers or
     *        functions that accept the current breakpoint width and return a number
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
     * Configure custom breakpoints for the responsiveProps. If not defined, defaults
     * are used. You should provide an object where the keys are breakpoint names
     * and the values are pixel values for the maximum width at which that breakpoint
     * applies. These are 'max-width' breakpoints, and if the width is equal to
     * the breakpoint value, the next largets breakpoint will be applied.
     *
     * This component has default breakpoints which are equal to the ones described
     * in the sszvis.breakpoint module, but with lower-case names. This method can
     * also be called without arguments to get the breakpoints object.
     *
     * @param {Object.<string, number>} [bps] Define the breakpoints to be used
     *
     * @example
     * var queryProps = sszvis.responsiveProps()
     * .breakpoints({
     *   small: 300,
     *   medium: 500,
     *   large: 700
     * })
     */
    responsiveProps.breakpoints = function(bps) {
      if (arguments.length === 0) {
        return breakpointSpec;
      }

      breakpointSpec = bps;
      breakpointKeys = orderedBreakpointKeys(bps);

      return responsiveProps;
    };

    return responsiveProps;
  };


  // Helpers

  function isBounds(obj) {
    return sszvis.fn.defined(arg1.width) && sszvis.fn.defined(arg1.screenWidth) && sszvis.fn.defined(arg1.screenHeight);
  }

  /**
   * functorizeValues
   * @prop    {object} obj Original key-value object
   * @returns {object} Same as input object but with all values transformed to d3.functors
   */
  function functorizeValues(obj) {
    return Object.keys(obj).reduce(function(memo, key) {
      memo[key] = d3.functor(obj[key]);
      return memo;
    }, {});
  }

  function orderedBreakpointKeys(bps) {
    return Object.keys(bps).sort(function(keyA, keyB) {
      return bps[keyA].getValue() - bps[keyB].getValue();
    });
  }

  function validatePropSpec(propSpec, breakpointSpec) {
    // Ensure that the propSpec contains a '_' value.
    // This is used as the default value when the test width
    // is larger than any breakpoint.
    if (!sszvis.fn.defined(propSpec._)) { return false; }

    // Validate the properties of the propSpec:
    // each should be a valid breakpoint name, and its value should be defined
    for (var breakpointName in propSpec) {
      if (propSpec.hasOwnProperty(breakpointName)) {
        if (breakpointName !== '_' && !sszvis.fn.defined(breakpointSpec[breakpointName])) {
          return false;
        }
      }
    }

    // All checks passed, propSpec is valid
    return true;
  }

});
