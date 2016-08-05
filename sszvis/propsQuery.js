/**
 * Props Query module
 *
 * @module sszvis/propsQuery
 *
 * PropsQuery module. Use this as an easy way to configure properties or options
 * which need to change based on some breakpoints. SSZVIS comes with a default
 * set of breakpoints (see sszvis.breakpoints), but you can also use this module
 * to define your own breakpoints.
 *
 * The module should be configured with any number of different properties that change based on breakpoints,
 * plus (optional) breakpoint configuration, and then called as a function. You can pass
 * in either a number (the width used to calculate which breakpoints apply), a string
 * (should be a selector string which refers to the object you wish to measure), or a
 * d3.selection (the first element's width will be measured and used to figure the breakpoints).
 * The return value of the function call is an object which has properties corresponding to
 * the properties you configured before. The property values are equal to the value based on the
 * breakpoint application.
 *
 * Example usage:
 *
 * var responsiveQuery = sszvis.propsQuery()
 *   .breakpoints({
 *     small: 400,
 *     medium: 800,
 *     large: 1000,
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
 * // Also possible to pass a d3.selection or just the width as a number
 * var settings = responsiveQuery('#sszvis-chart');
 * 
 * ... use settings.axisOrientation, settings.height, and settings.numAxisTicks ...
 *
 * @method breakpoints (object)        Use this method to configure optional custom breakpoints for the propsQuery.
 *                                     You should provide an object where the keys are breakpoint names and
 *                                     the values are pixel values for the maximum width at which that breakpoint
 *                                     applies. These are 'max-width' breakpoints, and if the width is equal to
 *                                     the breakpoint value, the next largets breakpoint will be applied. This
 *                                     component has default breakpoints which are equal to the ones described in
 *                                     the sszvis.breakpoint module, but with lower-case names. This method can
 *                                     also be called without arguments, as a getter which returns the breakpoints object.
 *                                     Use like:
 *                                     .breakpoints({
 *                                       small: 300,
 *                                       medium: 500,
 *                                       large: 700
 *                                     })
 *                                     Then configure a prop like:
 *                                     .prop('someProp', {
   *                                     small: 2,
   *                                     medium: 4,
   *                                     large: 8,
   *                                     _: 16,
 *                                     })
 *                                     For width values larger than the largest breakpoint, the property listed as
 *                                     '_' in the props config will be supplied.
 * @method prop (string, object)       Use this method to configure a responsive property. Accepts the name
 *                                     of the prop to be configured, and an object describing the property's
 *                                     values at different breakpoints. The breakpoints represent a 'maximum width'
 *                                     at which the property will be valid, with an exclusive range. That is, if the
 *                                     width is equal to or greater than any given breakpoint, the property for that
 *                                     breakpoint will not apply. The algorithm looks for the lowest applicable breakpoing.
 *                                     There should also be a value provided for the case when the screen is larger than
 *                                     any given breakpoint. This value should be provided with the name '_'. The names
 *                                     in the object should be breakpoint names. You can skip certain breakpoints if
 *                                     you want. The algorithm will look for the next smallest breakpoint which applies and use it.
 *                                     Each value can be either a raw value or a function which takes the current width
 *                                     and returns a value for the property. These functions can be used to lazily calculate 
 *                                     properties (they are only executed when the module is called as a function),
 *                                     and to change property values for a given breakpoint as a function of the width,
 *                                     for example to do height calculation with a custom aspect ratio.
 *                                     Use like:
 *                                     .prop('propName', {
 *                                       small: 20,
 *                                       narrow: function(w) { return w * 0.4; },
 *                                       tablet: function(w) { return sszvis.breakpoint.TABLET - w < 50 ? w * 0.6 : w * 0.8; },
 *                                       // (skipping 'normal'. You can skip any breakpoint)
 *                                       wide: 1000,
 *                                       _: 1200, // You must provide a case for '_', otherwise the module will complain when you use it
 *                                     })
 *
 * @returns       An instance of sszvis.propsQuery
 */
sszvis_namespace('sszvis.propsQuery', function(module) {
'use strict';

  function propSpecValid(propSpec, breakpointSpec) {
    // Ensure that the propSpec contains a '_' value.
    // This is used as the default value when the test width
    // is larger than any breakpoint.
    if (!sszvis.fn.defined(propSpec._)) { return false; }

    // Validate the properties of the propSpec:
    // each should be a valid breakpoint name, and its value should be a number
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

  module.exports = function() {
    var breakpointSpec = {
      small: sszvis.breakpoint.SMALL,
      narrow: sszvis.breakpoint.NARROW,
      tablet: sszvis.breakpoint.TABLET,
      normal: sszvis.breakpoint.NORMAL,
      wide: sszvis.breakpoint.WIDE,
    };
    var breakpointKeys = ['small', 'narrow', 'tablet', 'normal', 'wide'];
    var propsConfig = {};

    function query(arg1) {
      // Accepts either a number, a d3 selection, or a string selector
      var width = sszvis.fn.isNumber(arg1) ? arg1 : sszvis.fn.selectionWidth(sszvis.fn.isSelection(arg1) ? arg1 : d3.select(arg1));

      // Can't handle it if the provided selection isn't valid
      // This is possible if an empty selection or some other bad value
      // is given as the argument
      if (!sszvis.fn.defined(width)) { return {}; }

      // Finds out which breakpoints the provided width matches up with
      // Assumes that breakpointKeys is an array of breakpoint names sorted
      // in increasing order of breakpoint size and that all keys in
      // breakpointKeys are also in breakpointSpec.
      // The default value. '_' stands for 'everything else'
      var bpMatches = ['_'];
      // If there are no breakpoints set, or if the width is equal to
      // or larger than the largest breakpoint, don't bother searching.
      if (breakpointKeys.length > 0 && width < breakpointSpec[sszvis.fn.last(breakpointKeys)]) {
          // Once we get to the first breakpoint which the width falls under,
          // that means that the width matches it and all subsequent breakpoints.
          var bpIndex = breakpointKeys.findIndex(function(key) {
            return width < breakpointSpec[key];
          });
          // Attach '_' as the last value in the list of breakpoint keys. That's for
          // situations where we're searching these keys for something that also
          // appears in the propSpec, but the propSpec doesn't include anything low enough.
          bpMatches = (bpIndex === -1 ? [] : breakpointKeys.slice(bpIndex)).concat('_');
      }

      return Object.keys(propsConfig).reduce(function(memo, propKey) {
        var propSpec = propsConfig[propKey];

        if (!propSpecValid(propSpec, breakpointSpec)) {
          sszvis.logger.warn('propsQuery was given an invalid propSpec for property: "' + propKey + '". the spec: ', propSpec);
          return memo;
        }

        // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
        // This function should always at least find '_' at the end of the array.
        var matchedBreakpoint = bpMatches.find(function(bpName) { return sszvis.fn.defined(propSpec[bpName]) });
        // the value in the query object for that property equals the propSpec value as a functor,
        // invoked if necessary with the current width. Providing the width allows aspect ratio
        // calculations based on element width.
        memo[propKey] = d3.functor(propSpec[matchedBreakpoint])(width);

        return memo;
      }, {});
    }

    query.prop = function(propName, propSpec) {
      propsConfig[propName] = propSpec;
      return query;
    };

    query.breakpoints = function(bps) {
      if (arguments.length === 0) {
        return breakpointSpec;
      }

      breakpointSpec = bps;
      breakpointKeys = Object.keys(bps)
        .sort(function(keyA, keyB) {
          return bps[keyA] - bps[keyB];
        });

      return query;
    };

    return query;
  };

});
