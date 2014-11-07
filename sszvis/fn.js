/**
 * A collection of functional helper functions
 *
 * @module sszvis/fn
 */
namespace('sszvis.fn', function(module) {
'use strict';

  var slice = function(list) {
    var slice = Array.prototype.slice;
    return slice.apply(list, slice.call(arguments, 1));
  };

  module.exports = {
    /**
     * fn.arity
     *
     * Wraps a function of any arity (including nullary) in a function that
     * accepts exactly `n` parameters. Any extraneous parameters will not be
     * passed to the supplied function.
     *
     * @param {number} n The desired arity of the new function.
     * @param {Function} fn The function to wrap.
     * @return {Function} A new function wrapping `fn`. The new function is
     * guaranteed to be of arity `n`.
     */
    arity: function(n, fn) {
      switch (n) {
        case 0: return function() {return fn.call(this);};
        case 1: return function(a0) {return fn.call(this, a0);};
        case 2: return function(a0, a1) {return fn.call(this, a0, a1);};
        case 3: return function(a0, a1, a2) {return fn.call(this, a0, a1, a2);};
        case 4: return function(a0, a1, a2, a3) {return fn.call(this, a0, a1, a2, a3);};
        case 5: return function(a0, a1, a2, a3, a4) {return fn.call(this, a0, a1, a2, a3, a4);};
        case 6: return function(a0, a1, a2, a3, a4, a5) {return fn.call(this, a0, a1, a2, a3, a4, a5);};
        case 7: return function(a0, a1, a2, a3, a4, a5, a6) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6);};
        case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);};
        case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);};
        case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);};
        default: return fn;
      }
    },

    /**
     * fn.compose
     *
     * Returns the composition of a set of functions, in arguments order.
     * For example, if functions F, G, and H are passed as arguments:
     *
     * A = fn.compose(F, G, H)
     *
     * A will be a function which returns F(G(H(...arguments to A...)))
     * so that A(x) === F(G(H(x)))
     *
     * Note: all composed functions but the last should be of arity 1.
     *
     * @param {Function...} ... Accepts any number of functions as arguments
     * @return {Function} returns a function which is the composition of the passed functions
     */
    compose: function() {
      var fns = arguments,
          start = arguments.length - 1;
      return function() {
        var i = start;
        var result = fns[i].apply(this, arguments);
        while (i--) result = fns[i].call(this, result);
        return result;
      };
    },

    /**
     * fn.colorRange - like d3.range, but both arguments are required.
     * provides a linear color range with n values,
     * sampled using the given array of colors.
     *
     * @param  {Array} colors [an array of colors from which the range is sampled]
     * @param  {Number} n  [the number of samples to return]
     * @return {Array} An array of n colors
     */
    colorRange: function(colors, n) {
      var interp = d3.scale.linear().range(colors);
      return d3.range(n + 1).map(function(i) { return interp(i / n); });
    },

    /**
     * fn.constant
     *
     * Returns a function which returns a constant value.
     *
     * @param  {*} value A value for the constant
     * @return {Function}       A function which always returns the constant value.
     */
    constant: function(value) {
      return function() {
        return value;
      };
    },

    /**
     * fn.contains
     *
     * Checks whether an item is present in the given list (by strict equality).
     *
     * @param  {array} list List of items
     * @param  {any}   d    Item that might be in list
     * @return {boolean}
     */
    contains: function(list, d) {
      return list.indexOf(d) >= 0;
    },

    defaults: function(target) {
      var def;
      for (var i = 1; i < arguments.length; i++) {
        def = arguments[i];
        for (var prop in def) {
          if (def.hasOwnProperty(prop) && typeof target[prop] === 'undefined') {
            target[prop] = def[prop];
          }
        }
      }
      return target;
    },

    /**
     * fn.defined
     *
     * determines if the passed value is defined.
     *
     * @param  {*} val the value to check
     * @return {Boolean}     true if the value is defined, false if the value is undefined
     */
    defined: function(val) {
      return typeof val !== 'undefined';
    },

    derivedSet: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      var seen = [], sValue, cValue, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        sValue = arr[i];
        cValue = acc(sValue, i, arr);
        if (seen.indexOf(cValue) < 0) {
          seen.push(cValue);
          result.push(sValue);
        }
      }
      return result;
    },

    /**
     * fn.either
     *
     * used to check if a value is undefined. If it is, returns
     * the fallback value. If not, returns the passed value.
     *
     * @param  {*} val      A value to be checked for undefined
     * @param  {*} fallback A value to return if val is undefined
     * @return {*}          Either val or fallback, depending on whether or not val is undefined.
     */
    either: function(val, fallback) {
      return (typeof val === 'undefined') ? fallback : val;
    },

    /**
     * fn.find
     *
     * given a predicate function and a list, returns the first value
     * in the list such that the predicate function returns true
     * when passed that value.
     *
     * @param  {Function} predicate A predicate function to be called on elements in the list
     * @param  {Array} list      An array in which to search for a truthy predicate value
     * @return {*}           the first value in the array for which the predicate returns true.
     */
    find: function(predicate, list) {
      var idx = -1;
      var len = list.length;
      while (++idx < len) {
        if (predicate(list[idx])) return list[idx];
      }
    },

    /**
     * fn.first
     *
     * Returns the first value in the passed array, or undefined if the array is empty
     *
     * @param  {Array} arr an array
     * @return {*}     the first value in the array
     */
    first: function(arr) {
      return arr[0];
    },

    horizontalBarChartDimensions: function(height, numBars) {
      var DEFAULT_HEIGHT = 24, // the default bar height
          MIN_PADDING = 20, // the minimum padding size
          barHeight = DEFAULT_HEIGHT, // the bar height
          numPads = numBars - 1,
          padding = Math.max((height - (barHeight * numBars)) / numPads, MIN_PADDING), // the padding size
          // compute other information
          padRatio = 1 - (barHeight / (barHeight + padding)),
          computedBarSpace = barHeight * numBars + padding * numPads,
          outerRatio = (height - computedBarSpace) / 2 / (barHeight + padding);

      return {
        barHeight: barHeight,
        padHeight: padding,
        padRatio: padRatio,
        outerRatio: outerRatio,
        axisOffset: -(barHeight / 2) - 10,
        barGroupHeight: computedBarSpace,
        totalHeight: height
      };
    },

    /**
     * fn.hashableSet
     *
     * takes an array of elements and returns the unique elements of that array, optionally
     * after passing them through an accessor function.
     * the returned array is ordered according to the elements' order of appearance
     * in the input array. This function differs from fn.set in that the elements
     * in the input array (or the values returned by the accessor function)
     * MUST be "hashable" - convertible to unique keys of a JavaScript object.
     * As payoff for obeying this restriction, the algorithm can run much faster.
     *
     * @param  {Array} arr the Array of source elements
     * @param {Function} [acc(element, index, array)=(v) -> v] - an accessor function which
     * is called on each element of the Array. Defaults to the identity function.
     * The result is equivalent to calling array.map(acc) before computing the set.
     * When the accessor function is invoked, it is passed the element from the input array,
     * the element's index in the input array, and the input array itself.
     * @return {Array} an Array of unique elements
     */
    hashableSet: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      var seen = {}, value, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        value = acc(arr[i], i, arr);
        if (!seen[value]) {
          seen[value] = true;
          result.push(value);
        }
      }
      return result;
    },

    /**
     * Utility function for calculating different demensions in the heat table
     * @param  {Number} width   the total width of the heat table
     * @param  {Number} padding the padding, in pixels, between squares in the heat table
     * @param  {Number} numX     The number of columns that need to fit within the heat table width
     * @param {Number} numY The number of rows in the table
     * @return {Number}         The width of one side of a box in the heat table
     */
    heatTableDimensions: function(width, padding, numX, numY) {
      // this includes the default side length for the heat table
      var DEFAULT_SIDE = 30,
          side = Math.min((width - padding * (numX - 1)) / numX, DEFAULT_SIDE),
          paddedSide = side + padding,
          padRatio = 1 - (side / paddedSide),
          width = numX * paddedSide - padding, // subtract the padding at the end
          height = numY * paddedSide - padding; // subtract the padding at the end
      return {
        side: side,
        paddedSide: paddedSide,
        padRatio: padRatio,
        width: width,
        height: height
      };
    },

    /**
     * fn.identity
     *
     * The identity function. It returns the first argument passed to it.
     * Useful as a default where a function is required.
     *
     * @param  {*} value any value
     * @return {*}       returns its argument
     */
    identity: function(value) {
      return value;
    },

    /**
     * fn.last
     *
     * Returns the last value in the passed array, or undefined if the array is empty
     *
     * @param  {Array} arr an array
     * @return {*}     the last value in the array
     */
    last: function(arr) {
      return arr[arr.length - 1];
    },

    /**
     * fn.not
     *
     * Takes as argument a function f and returns a new function
     * which calls f on its arguments and returns the
     * boolean opposite of f's return value.
     *
     * @param  {Function} f the argument function
     * @return {Function}   a new function which returns the boolean opposite of the argument function
     */
    not: function (f) {
      return function(){ return !f.apply(this, arguments); };
    },

    /**
     * fn.prop
     *
     * takes the name of a property and returns a property accessor function
     * for the named property. When the accessor function is called on an object,
     * it returns that object's value for the named property. (or undefined, if the object
     * does not contain the property.)
     *
     * @param  {String} key the name of the property for which an accessor function is desired
     * @return {Function}     A property-accessor function
     *
     */
    prop: function(key) {
      return function(object) {
        return object[key];
      };
    },

    /**
     * fn.set
     *
     * takes an array of elements and returns the unique elements of that array, optionally
     * after passing them through an accessor function.
     * the returned array is ordered according to the elements' order of appearance
     * in the input array, e.g.:
     *
     * [2,1,1,6,8,6,5,3] -> [2,1,6,8,5,3]
     * ["b", a", "b", "b"] -> ["b", "a"]
     * [{obj1}, {obj2}, {obj1}, {obj3}] -> [{obj1}, {obj2}, {obj3}]
     *
     * @param {Array} arr - the Array of source elements
     * @param {Function} [acc(element, index, array)=(v) -> v] - an accessor function which
     * is called on each element of the Array. Defaults to the identity function.
     * The result is equivalent to calling array.map(acc) before computing the set.
     * When the accessor function is invoked, it is passed the element from the input array,
     * the element's index in the input array, and the input array itself.
     * @return {Array} an Array of unique elements
     */
    set: function(arr, acc) {
      acc || (acc = sszvis.fn.identity);
      return arr.reduce(function(m, value, i) {
        var computed = acc(value, i, arr);
        return m.indexOf(computed) < 0 ? m.concat(computed) : m;
      }, []);
    },

    stackedAreaMultiplesLayout: function(height, num, pct) {
      pct || (pct = 0.1);
      var step = height / (num - pct),
          bandHeight = step * (1 - pct),
          level = bandHeight, // count from the top, and start at the bottom of the first band
          range = [];
      while (level - height < 1) {
        range.push(level);
        level += step;
      }
      return {
        range: range,
        bandHeight: bandHeight,
        padHeight: step * pct
      };
    },

    translateString: function(x, y) {
      return 'translate(' + x + ',' + y + ')';
    },

    verticalBarChartDimensions: function(width, numBars) {
      var MAX_BAR_WIDTH = 48, // the maximum width of a bar
          MIN_PADDING = 2, // the minimum padding value
          MAX_PADDING = 100, // the maximum padding value
          TARGET_BAR_RATIO = 0.70, // the ratio of width to width + padding used to compute the initial width and padding
          TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO, // the inverse of the bar ratio, this is the ratio of padding to width + padding
          numPads = numBars - 1, // the number of padding spaces
          // compute the target size of the padding
          // the derivation of this equation is available upon request
          padding = (width * TARGET_PADDING_RATIO) / ((TARGET_PADDING_RATIO * numPads) + (TARGET_BAR_RATIO * numBars)),
          // based on the computed padding, calculate the bar width
          barWidth = (width - (padding * numPads)) / numBars;

      // adjust for min and max bounds
      if (barWidth > MAX_BAR_WIDTH) {
        barWidth = MAX_BAR_WIDTH;
        // recompute the padding value where necessary
        padding = (width - (barWidth * numBars)) / numPads;
      }
      if (padding < MIN_PADDING) padding = MIN_PADDING;
      if (padding > MAX_PADDING) padding = MAX_PADDING;

      // compute other information
      var padRatio = 1 - (barWidth / (barWidth + padding)),
          computedBarSpace = barWidth * numBars + padding * numPads,
          outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);

      return {
        barWidth: barWidth,
        padWidth: padding,
        padRatio: padRatio,
        outerRatio: outerRatio,
        barGroupWidth: computedBarSpace,
        totalWidth: width
      };
    }

  };

});
