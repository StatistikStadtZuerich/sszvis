/*! sszvis v3.1.1, Copyright 2014-present Statistik Stadt Zürich */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.sszvis = {}, global.d3));
})(this, (function (exports, d3) { 'use strict';

  /**
   * d3.selection plugin to simplify creating idempotent divs that are not
   * recreated when rendered again.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @param {String} key - the name of the group
   * @return {d3.selection}
   */
  d3.selection.prototype.selectDiv = function (key) {
    return this.selectAll('[data-d3-selectdiv="' + key + '"]').data(d => [d]).join("div").attr("data-d3-selectdiv", key).style("position", "absolute");
  };

  /**
   * d3.selection plugin to simplify creating idempotent groups that are not
   * recreated when rendered again.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @param  {String} key The name of the group
   * @return {d3.selection}
   */
  d3.selection.prototype.selectGroup = function (key) {
    return this.selectAll('[data-d3-selectgroup="' + key + '"]').data(d => [d]).join("g").attr("data-d3-selectgroup", key);
  };

  /**
   * A collection of functional programming helper functions
   *
   * @module sszvis/fn
   */


  /**
   * fn.identity
   *
   * The identity function. It returns the first argument passed to it.
   * Useful as a default where a function is required.
   *
   * @param  {*} value any value
   * @return {*}       returns its argument
   */
  const identity$1 = function (value) {
    return value;
  };

  /**
   * fn.isString
   *
   * determine whether the value is a string
   *
   * @param  {*}  val       The value to check
   * @return {Boolean}      Whether the value is a string
   */
  const isString = function (val) {
    return Object.prototype.toString.call(val) === "[object String]";
  };

  /**
   * fn.isSelection
   *
   * determine whether the value is a d3.selection.
   *
   * @param  {*}  val         The value to check
   * @return {Boolean}        Whether the value is a d3.selection
   */
  const isSelection = function (val) {
    return val instanceof d3.selection;
  };

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
  const arity = function (n, fn) {
    switch (n) {
      case 0:
        {
          return function () {
            return fn.call(this);
          };
        }
      case 1:
        {
          return function (a0) {
            return fn.call(this, a0);
          };
        }
      case 2:
        {
          return function (a0, a1) {
            return fn.call(this, a0, a1);
          };
        }
      case 3:
        {
          return function (a0, a1, a2) {
            return fn.call(this, a0, a1, a2);
          };
        }
      case 4:
        {
          return function (a0, a1, a2, a3) {
            return fn.call(this, a0, a1, a2, a3);
          };
        }
      case 5:
        {
          return function (a0, a1, a2, a3, a4) {
            return fn.call(this, a0, a1, a2, a3, a4);
          };
        }
      case 6:
        {
          return function (a0, a1, a2, a3, a4, a5) {
            return fn.call(this, a0, a1, a2, a3, a4, a5);
          };
        }
      case 7:
        {
          return function (a0, a1, a2, a3, a4, a5, a6) {
            return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
          };
        }
      case 8:
        {
          return function (a0, a1, a2, a3, a4, a5, a6, a7) {
            return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
          };
        }
      case 9:
        {
          return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
            return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
          };
        }
      case 10:
        {
          return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
            return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
          };
        }
      default:
        {
          return fn;
        }
    }
  };

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
  const compose = function () {
    const fns = arguments,
      start = arguments.length - 1;
    return function () {
      let i = start;
      let result = Reflect.apply(fns[i], this, arguments);
      while (i--) result = fns[i].call(this, result);
      return result;
    };
  };

  /**
   * fn.contains
   *
   * Checks whether an item is present in the given list (by strict equality).
   *
   * @param  {array} list List of items
   * @param  {any}   d    Item that might be in list
   * @return {boolean}
   */
  const contains$1 = function (list, d) {
    return list.includes(d);
  };

  /**
   * fn.defined
   *
   * determines if the passed value is defined.
   *
   * @param  {*} val the value to check
   * @return {Boolean}     true if the value is defined, false if the value is undefined
   */
  const defined = function (val) {
    return val !== undefined && val != null && !Number.isNaN(val);
  };

  /**
   * fn.derivedSet
   *
   * fn.derivedSet is used to create sets of objects from an input array. The objects are
   * first passed through an accessor function, which should produce a value. The set is calculated
   * using that value, but the actual members of the set are the input objects. This allows you
   * to use .derivedSet to create a group of obejcts, where the values of some derived property
   * of those objects forms a set. This is distinct from other set functions in this toolkit because
   * in the other set functions, the set of derived properties is returned, whereas this function
   * returns a set of objects from the input array.
   *
   * @param  {array} arr        The array of elements from which the set is calculated
   * @param  {function} acc     An accessor function which calculates the set determiner.
   * @return {array}            An array of objects from the input array.
   */
  const derivedSet = function (arr, acc) {
    acc || (acc = identity$1);
    const seen = [],
      result = [];
    let sValue, cValue;
    for (let i = 0, l = arr.length; i < l; ++i) {
      sValue = arr[i];
      cValue = acc(sValue, i, arr);
      if (!seen.includes(cValue)) {
        seen.push(cValue);
        result.push(sValue);
      }
    }
    return result;
  };

  /**
   * fn.every
   *
   * Use a predicate function to test if every element in an array passes some test.
   * Returns false as soon as an element fails the predicate test. Returns true otherwise.
   *
   * @param  {Function} predicate     The predicate test function
   * @param  {Array} arr              The array to test
   * @return {Boolean}                Whether every element in the array passes the test
   */
  const every = function (predicate, arr) {
    for (const element of arr) {
      if (!predicate(element)) {
        return false;
      }
    }
    return true;
  };

  /**
   * fn.filledArray
   *
   * returns a new array with length `len` filled with `val`
   *
   * @param  {Number} len     The length of the desired array
   * @param  {Any} val        The value with which to fill the array
   * @return {Array}          An array of length len filled with val
   */
  const filledArray = function (len, val) {
    const arr = Array.from({
      length: len
    });
    for (let i = 0; i < len; ++i) {
      arr[i] = val;
    }
    return arr;
  };

  /**
   * fn.find
   *
   * Finds the first occurrence of an element in an array that passes the predicate function
   *
   * @param {function} predicate A function that is run on each array element and returns a boolean
   * @param {array} arr An array
   *
   * @returns {arrayElement|undefined}
   */
  const find = function (predicate, arr) {
    for (const element of arr) {
      if (predicate(element)) {
        return element;
      }
    }
  };

  /**
   * fn.first
   *
   * Returns the first value in the passed array, or undefined if the array is empty
   *
   * @param  {Array} arr an array
   * @return {*}     the first value in the array
   */
  const first = function (arr) {
    return arr[0];
  };

  /**
   * fn.flatten
   *
   * Flattens the nested input array by one level. The input array is expected to be
   * a two-dimensional array (i.e. its elements are also arrays). The result is a
   * one-dimensional array consisting of all the elements of the sub-arrays.
   *
   * @param  {Array}        The Array to flatten
   * @return {Array}        A flattened Array
   */
  const flatten = function (arr) {
    return arr.flat();
  };

  /**
   * fn.firstTouch
   *
   * Used to retrieve the first touch from a touch event. Note that in some
   * cases, the touch event doesn't have any touches in the event.touches list,
   * but it does have some in the event.changedTouches list (notably the touchend
   * event works like this).
   *
   * @param  {TouchEvent} event   The TouchEvent object from which to retrieve the
   *                              first Touch object.
   * @return {Touch|null}         The first Touch object from the TouchEvent's lists
   *                              of touches.
   */
  const firstTouch = function (event) {
    if (event.touches && event.touches.length > 0) {
      return event.touches[0];
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      return event.changedTouches[0];
    }
    return null;
  };

  /**
   * fn.foldPattern
   *
   * Used to lazily fold a sum type into a value.
   *
   * @param {string} key The key to use when folding
   * @param {object} pattern An object providing functions for each key
   *
   * @example
   * sszvis.foldPattern('formalGreeting', {
   *   formalGreeting: function() { return "Pleased to meet you."},
   *   informalGreeting: function() { return "How ya’ doin!" }
   * })
   */
  const foldPattern = function (key, pattern) {
    const result = pattern[key];
    if (typeof result === "function") {
      return result();
    }
    throw new Error("[foldPattern] No definition provided for key: " + key);
  };

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
  const hashableSet = function (arr, acc) {
    acc || (acc = identity$1);
    const seen = {},
      result = [];
    let value;
    for (let i = 0, l = arr.length; i < l; ++i) {
      value = acc(arr[i], i, arr);
      if (!seen[value]) {
        seen[value] = true;
        result.push(value);
      }
    }
    return result;
  };

  /**
   * fn.isFunction
   *
   * Determines if the passed value is a function
   *
   * @param {*} val the value to check
   * @return {Boolean} true if the value is a function, false otherwise
   */
  const isFunction$1 = function (val) {
    return typeof val == "function";
  };

  /**
   * fn.isNull
   *
   * determines if the passed value is null.
   *
   * @param {*} val the value to check
   * @return {Boolean}     true if the value is null, false if the value is not null
   */
  const isNull = function (val) {
    return val === null;
  };

  /**
   * fn.isNumber
   *
   * determine whether the value is a number
   *
   * @param  {*}  val     The value to check
   * @return {Boolean}    Whether the value is a number
   */
  const isNumber = function (val) {
    return Object.prototype.toString.call(val) === "[object Number]" && !Number.isNaN(val);
  };

  /**
   * fn.isObject
   *
   * determines if the passed value is of an "object" type, or if it is something else,
   * e.g. a raw number, string, null, undefined, NaN, something like that.
   *
   * @param  {*}  value      The value to test
   * @return {Boolean}       Whether the value is an object
   */
  const isObject = function (val) {
    return Object(val) === val;
  };

  /**
   * fn.last
   *
   * Returns the last value in the passed array, or undefined if the array is empty
   *
   * @param  {Array} arr an array
   * @return {*}     the last value in the array
   */
  const last = function (arr) {
    return arr[arr.length - 1];
  };

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
  const not = function (f) {
    return function () {
      return !Reflect.apply(f, this, arguments);
    };
  };

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
  const prop = function (key) {
    return function (object) {
      return object[key];
    };
  };

  /**
   * fn.propOr
   *
   * Like fn.prop, this function takes the name of a property and returns an accessor function
   * for the named property. However, the returned function has an added feature - it
   * checks that the argument given to is not `undefined`, and whether the property exists on
   * the object. If either is false, it returns a default value. The default value is the second
   * parameter to propOr, and it is optional. (When you don't provide a default value, the returned
   * function will work fine, and if the object or property are `undefined`, it returns `undefined`).
   *
   * @param  {String} key         the name of the property for which an accessor function is desired
   * @param  {any} defaultVal     the default value to return when either the object or the requested property are undefined
   * @return {Function}           A property-accessor function
   */
  const propOr = function (key, defaultVal) {
    return function (object) {
      const value = object === undefined ? undefined : object[key];
      return value === undefined ? defaultVal : value;
    };
  };

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
  const set$1 = function (arr, acc) {
    acc || (acc = identity$1);
    return arr.reduce((m, value, i) => {
      const computed = acc(value, i, arr);
      return m.includes(computed) ? m : [...m, computed];
    }, []);
  };

  /**
   * fn.some
   *
   * Test an array with a predicate and determine whether some element in the array passes the test.
   * Returns true as soon as an element passes the test. Returns false otherwise.
   *
   * @param  {Function} predicate     The predicate test function
   * @param  {Array} arr              The array to test
   * @return {Boolean}                Whether some element in the array passes the test
   */
  const some = function (predicate, arr) {
    for (const element of arr) {
      if (predicate(element)) {
        return true;
      }
    }
    return false;
  };

  /**
   * fn.stringEqual
   *
   * Determines whether two values are equal when converted to strings. Useful for comparing
   * date objects, because two different date objects are not considered equal, even if they
   * represent the same date.
   *
   * @param  {any} a        the first value
   * @param  {any} b        the second value
   * @return {boolean}      Whether the provided values are equal when converted to strings.
   */
  const stringEqual = function (a, b) {
    return a.toString() === b.toString();
  };

  /**
   * fn.functor
   *
   * Same as fn.functor in d3v3
   */
  const functor = function (v) {
    return typeof v === "function" ? v : function () {
      return v;
    };
  };

  /**
   * fn.memoize
   *
   * Adapted from lodash's memoize() but using d3.map() as cache
   * See https://lodash.com/docs/4.17.4#memoize
   */
  const memoize = function (func, resolver) {
    if (typeof func != "function" || resolver != null && typeof resolver != "function") {
      throw new TypeError("Expected a function");
    }
    const memoized = function () {
      const args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new Map();
    return memoized;
  };

  /**
   * Ensure Defs Element
   *
   * This method ensures that the provided selection contains a 'defs' object,
   * and furthermore, that the defs object contains an instance of the provided
   * element type, with the provided ID.
   *
   * @module sszvis/svgUtils/ensureDefsElement
   *
   * @param {d3.selection} selection
   * @param {string}       type       Element to create
   * @param {string}       elementId  The ID to assign to the created element
   */

  function ensureDefsElement (selection, type, elementId) {
    return ensureDefsSelection(selection).selectAll(type + "#" + elementId).data([0]).join(type).attr("id", elementId);
  }

  /* Helper functions
  ----------------------------------------------- */

  /**
   * This method ensures that the provided selection contains a 'defs' object,
   * which is required for rendering patterns. SVG elements rendered into a defs
   * container will not be displayed, but can be referenced by ID in the fill property
   * of other, visible, elements.
   */
  function ensureDefsSelection(selection) {
    return selection.selectAll("defs").data([0]).join("defs");
  }

  /**
   * Color scales
   *
   * Three kinds of color scales are provided: qualitative, sequential, and
   * diverging. All color scales can be reversed, qualitative color scales
   * can also be brightened or darkened.
   *
   * @module sszvis/color
   *
   *
   * Qualitative color scales
   *
   * @function qual12    The full range of categorical colors
   * @function qual6     Subset of saturated categorical colors
   * @function qual6a    Subset of blue-green categorical colors
   * @function qual6b    Subset of yellow-red categorical colors
   * @method   darken    Instance method to darken all colors. @returns new scale
   * @method   brighten  Instance method to brighten all colors. @returns new scale
   * @method   reverse   Instance method to reverse the color order. @returns new scale
   *
   *
   * Sequential color scales
   *
   * @function seqBlu    Linear color scale from bright to dark blue
   * @function seqRed    Linear color scale from bright to dark red
   * @function seqGrn    Linear color scale from bright to dark green
   * @function seqBrn    Linear color scale from bright to dark brown
   * @method   reverse   Instance method to reverse the color order. @returns new scale
   *
   *
   * Diverging color scales
   *
   * @function divVal    Diverging and valued color scale from red to blue
   * @function divNtr    Diverging and neutral color scale from brown to green
   * @function divValGry constiation of the valued scale with a grey midpoint
   * @function divNtrGry constiation of the neutral scale with a grey midpoint
   * @method   reverse   Instance method to reverse the color order. @returns new scale
   *
   * Grey color scales
   * @function gry       1-color scale for shaded values
   * @function lightGry  1-color scale for shaded backgrounds
   */


  /* Constants
  ----------------------------------------------- */
  const LIGHTNESS_STEP = 1;

  /* Scales
  ----------------------------------------------- */
  function qualColorScale(colors) {
    return function () {
      const scale = d3.scaleOrdinal().range(colors.map(convertLab)).unknown(convertLab(colors[0]));
      return decorateOrdinalScale(scale);
    };
  }
  const darkBlue = "#3431DE";
  const mediumBlue = "#0A8DF6";
  const lightBlue = "#23C3F1";
  const darkRed = "#7B4FB7";
  const mediumRed = "#DB247D";
  const lightRed = "#FB737E";
  const darkGreen = "#007C78";
  const mediumGreen = "#1D942E";
  const lightGreen = "#99C32E";
  const darkBrown = "#9A5B01";
  const mediumBrown = "#FF720C";
  const lightBrown = "#FBB900";
  const scaleQual12 = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed, darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
  const scaleQual6 = qualColorScale([darkBlue, mediumRed, mediumGreen, lightBrown, lightBlue, mediumBrown]);
  const scaleQual6a = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed]);
  const scaleQual6b = qualColorScale([darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
  const female = "#349894";
  const male = "#FFD736";
  const misc = "#986AD5";
  const scaleGender3 = () => qualColorScale([female, male, misc])().domain(["Frauen", "Männer", "Divers"]);
  const swissFemale = "#00615D";
  const foreignFemale = "#349894";
  const swissMale = "#DA9C00";
  const foreignMale = "#FFD736";
  const swissMisc = "#5E359A";
  const foreignMisc = "#986AD5";
  const scaleGender6Origin = () => qualColorScale([swissFemale, foreignFemale, swissMale, foreignMale, swissMisc, foreignMisc])().domain(["Schweizerinnen", "Ausländerinnen", "Schweizer", "Ausländer", "Divers Schweiz", "Divers Ausland"]);
  const femaleFemale = "#349894";
  const maleMale = "#FFD736";
  const femaleMale = "#3431DE";
  const femaleUnknown = "#B8B8B8";
  const maleUnknown = "#D6D6D6";
  const scaleGender5Wedding = () => qualColorScale([femaleFemale, maleMale, femaleMale, femaleUnknown, maleUnknown])().domain(["Frau / Frau", "Mann / Mann", "Frau / Mann", "Frau / Unbekannt", "Mann / Unbekannt"]);
  function seqColorScale(colors) {
    return function () {
      const scale = d3.scaleLinear().range(colors.map(convertLab));
      return decorateLinearScale(scale);
    };
  }
  const scaleSeqBlu = seqColorScale(["#CADEFF", "#5B6EFF", "#211A8A"]);
  const scaleSeqRed = seqColorScale(["#FED2EE", "#ED408D", "#7D0044"]);
  const scaleSeqGrn = seqColorScale(["#CFEED8", "#34B446", "#0C4B1F"]);
  const scaleSeqBrn = seqColorScale(["#FCDDBB", "#EA5D00", "#611F00"]);
  function divColorScale(colors) {
    return function () {
      const scale = d3.scaleLinear().range(colors.map(convertLab));
      return decorateDivScale(scale);
    };
  }
  const scaleDivVal = divColorScale(["#611F00", "#A13200", "#EA5D00", "#FF9A54", "#FCDDBB", "#CADEFF", "#89AFFF", "#5B6EFF", "#3431DE", "#211A8A"]);
  const scaleDivValGry = divColorScale(["#782600", "#CC4309", "#FF720C", "#FFBC88", "#E4E0DF", "#AECBFF", "#6B8EFF", "#3B51FF", "#2F2ABB"]);
  const scaleDivNtr = divColorScale(["#7D0044", "#C4006A", "#ED408D", "#FF83B9", "#FED2EE", "#CFEED8", "#81C789", "#34B446", "#1A7F2D", "#0C4B1F"]);
  const scaleDivNtrGry = divColorScale(["#A30059", "#DB247D", "#FF579E", "#FFA8D0", "#E4E0DF", "#A8DBB1", "#55BC5D", "#1D942E", "#10652A"]);
  function greyColorScale(colors) {
    return function () {
      const scale = d3.scaleOrdinal().range(colors.map(convertLab));
      return decorateLinearScale(scale);
    };
  }
  const scaleLightGry = greyColorScale(["#FAFAFA"]);
  const scalePaleGry = greyColorScale(["#EAEAEA"]);
  const scaleGry = greyColorScale(["#D6D6D6"]);
  const scaleDimGry = greyColorScale(["#B8B8B8"]);
  const scaleMedGry = greyColorScale(["#7C7C7C"]);
  const scaleDeepGry = greyColorScale(["#545454"]);
  const slightlyDarker = function (c) {
    return d3.hsl(c).darker(0.4);
  };
  const muchDarker = function (c) {
    return d3.hsl(c).darker(0.7);
  };
  const withAlpha = function (c, a) {
    const rgbColor = d3.rgb(c);
    return "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + "," + a + ")";
  };

  /* Scale extensions
  ----------------------------------------------- */
  function decorateOrdinalScale(scale) {
    scale.darker = function () {
      return decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.brighter(LIGHTNESS_STEP))));
    };
    scale.brighter = function () {
      return decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.darker(LIGHTNESS_STEP))));
    };
    scale.reverse = function () {
      return decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
    };
    return scale;
  }
  function decorateDivScale(scale) {
    scale = interpolatedDivergentColorScale(scale);
    scale.reverse = function () {
      return decorateLinearScale(scale.copy().range(scale.range().reverse()));
    };
    return scale;
  }
  function interpolatedDivergentColorScale(scale) {
    const nativeDomain = scale.domain;
    if (!scale.range()) return scale;
    const length = scale.range().length;
    scale.domain = function (dom) {
      if (!dom) return nativeDomain.call(this);
      const xDomain = [];
      for (let i = 0; i < length; i++) {
        xDomain.push(d3.quantile(dom, i / (length - 1)));
      }
      return nativeDomain.call(this, xDomain);
    };
    return scale;
  }
  function decorateLinearScale(scale) {
    scale = interpolatedColorScale(scale);
    scale.reverse = function () {
      return decorateLinearScale(scale.copy().range(scale.range().reverse()));
    };
    return scale;
  }
  function interpolatedColorScale(scale) {
    const nativeDomain = scale.domain;
    scale.domain = function (dom) {
      if (arguments.length === 1) {
        const threeDomain = [dom[0], d3.mean(dom), dom[1]];
        return nativeDomain.call(this, threeDomain);
      } else {
        return Reflect.apply(nativeDomain, this, arguments);
      }
    };
    return scale;
  }

  /* Helper functions
  ----------------------------------------------- */
  function convertLab(d) {
    return d3.lab(d);
  }

  /**
   * Patterns module
   *
   * @module sszvis/patterns
   *
   * This module contains svg patterns and pattern helper functions which are used
   * to render important textures for constious other components.
   *
   * @method  heatTableMissingValuePattern    The pattern for the missing values in the heat table
   * @method  mapMissingValuePattern          The pattern for the map areas which are missing values. Used by map.js internally
   * @method  mapLakePattern                  The pattern for Lake Zurich in the map component. Used by map.js internally
   * @method  mapLakeFadeGradient             The pattern which provides a gradient, used by the alpha fade pattern,
   *                                          in the Lake Zurich shape. Used by map.js internally
   * @method  mapLakeGradientMask             The pattern which provides a gradient alpha fade for the Lake Zurich shape.
   *                                           It uses the fadeGradient pattern to create an alpha gradient mask. Used by map.js internally
   * @method  dataAreaPattern                 The pattern for the data area texture.
   *
   */

  const heatTableMissingValuePattern = function (selection) {
    const rectFill = scaleLightGry(),
      crossStroke = "#A4A4A4",
      crossStrokeWidth = 0.035,
      cross1 = 0.35,
      cross2 = 0.65;
    selection.attr("patternUnits", "objectBoundingBox").attr("patternContentUnits", "objectBoundingBox").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1);
    selection.append("rect").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1).attr("fill", rectFill);
    selection.append("line").attr("x1", cross1).attr("y1", cross1).attr("x2", cross2).attr("y2", cross2).attr("stroke-width", crossStrokeWidth).attr("stroke", crossStroke);
    selection.append("line").attr("x1", cross2).attr("y1", cross1).attr("x2", cross1).attr("y2", cross2).attr("stroke-width", crossStrokeWidth).attr("stroke", crossStroke);
  };
  const mapMissingValuePattern = function (selection) {
    const pWidth = 14,
      pHeight = 14,
      fillColor = "#FAFAFA",
      lineStroke = "#CCCCCC";
    selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
    selection.append("rect").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight).attr("fill", fillColor);
    selection.append("line").attr("x1", 1).attr("y1", 10).attr("x2", 5).attr("y2", 14).attr("stroke", lineStroke);
    selection.append("line").attr("x1", 5).attr("y1", 10).attr("x2", 1).attr("y2", 14).attr("stroke", lineStroke);
    selection.append("line").attr("x1", 8).attr("y1", 3).attr("x2", 12).attr("y2", 7).attr("stroke", lineStroke);
    selection.append("line").attr("x1", 12).attr("y1", 3).attr("x2", 8).attr("y2", 7).attr("stroke", lineStroke);
  };
  const mapLakePattern = function (selection) {
    const pWidth = 6;
    const pHeight = 6;
    const offset = 0.5;
    selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
    selection.append("rect").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight).attr("fill", "#fff");
    selection.append("line").attr("x1", 0).attr("y1", pHeight * offset).attr("x2", pWidth * offset).attr("y2", 0).attr("stroke", "#ddd").attr("stroke-linecap", "square");
    selection.append("line").attr("x1", pWidth * offset).attr("y1", pHeight).attr("x2", pWidth).attr("y2", pHeight * offset).attr("stroke", "#ddd").attr("stroke-linecap", "square");
  };
  const mapLakeFadeGradient = function (selection) {
    selection.attr("x1", 0).attr("y1", 0).attr("x2", 0.55).attr("y2", 1).attr("id", "lake-fade-gradient");
    selection.append("stop").attr("offset", 0.74).attr("stop-color", "white").attr("stop-opacity", 1);
    selection.append("stop").attr("offset", 0.97).attr("stop-color", "white").attr("stop-opacity", 0);
  };
  const mapLakeGradientMask = function (selection) {
    selection.attr("maskContentUnits", "objectBoundingBox");
    selection.append("rect").attr("fill", "url(#lake-fade-gradient)").attr("width", 1).attr("height", 1);
  };
  const dataAreaPattern = function (selection) {
    const pWidth = 6;
    const pHeight = 6;
    const offset = 0.5;
    selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
    selection.append("line").attr("x1", 0).attr("y1", pHeight * offset).attr("x2", pWidth * offset).attr("y2", 0).attr("stroke", "#e6e6e6").attr("stroke-width", 1.1);
    selection.append("line").attr("x1", pWidth * offset).attr("y1", pHeight).attr("x2", pWidth).attr("y2", pHeight * offset).attr("stroke", "#e6e6e6").attr("stroke-width", 1.1);
  };

  /**
   * d3 plugin to simplify creating reusable charts. Implements
   * the reusable chart interface and can thus be used interchangeably
   * with any other reusable charts.
   *
   * @example
   * var myAxis = sszvis.component()
   *   .prop('ticks').ticks(10)
   *   .render(function(data, i, j) {
   *     var selection = select(this);
   *     var props = selection.props();
   *     var axis = d3.svg.axis().ticks(props.ticks);
   *     selection
   *       .append('g')
   *       .call(axis);
   *   })
   * console.log(myAxis.ticks()); //=> 10
   * select('svg').call(myAxis.ticks(3));
   *
   * @see http://bost.ocks.org/mike/chart/
   *
   * @property {function} prop Define a property accessor
   * @property {function} render The chart's body
   *
   * @return {sszvis.component} A d3 reusable chart
   */
  function component() {
    const props = {};
    let selectionRenderer = null;
    let renderer = identity;

    /**
     * Constructor
     *
     * @param  {d3.selection} selection Passed in by d3
     */
    function sszvisComponent(selection) {
      if (selectionRenderer) {
        selection.props = function () {
          return clone(props);
        };
        selectionRenderer.apply(selection, slice$1(arguments));
      }
      selection.each(function () {
        this.__props__ = clone(props);
        renderer.apply(this, slice$1(arguments));
      });
    }

    /**
     * Define a property accessor with an optional setter
     *
     * @param  {String} prop The property's name
     * @param  {Function} [setter] The setter's context will be bound to the
     *         sszvis.component. Sets the returned value to the given property
     * @return {sszvis.component}
     */
    sszvisComponent.prop = function (prop, setter) {
      setter || (setter = identity);
      sszvisComponent[prop] = accessor(props, prop, setter.bind(sszvisComponent)).bind(sszvisComponent);
      return sszvisComponent;
    };

    /**
     * Delegate a properties' accessors to a delegate object
     *
     * @param  {String} prop     The property's name
     * @param  {Object} delegate The target having getter and setter methods for prop
     * @return {sszvis.component}
     */
    sszvisComponent.delegate = function (prop, delegate) {
      sszvisComponent[prop] = function () {
        const result = delegate[prop].apply(delegate, slice$1(arguments));
        return arguments.length === 0 ? result : sszvisComponent;
      };
      return sszvisComponent;
    };

    /**
     * Creates a render context for the given component's parent selection.
     * Use this, when you need full control over the rendering of the component
     * and you need access to the full selection instead of just the selection
     * of one datum.
     *
     * @param  {Function} callback
     * @return {[sszvis.component]}
     */
    sszvisComponent.renderSelection = function (callback) {
      selectionRenderer = callback;
      return sszvisComponent;
    };

    /**
     * Creates a render context for the given component. Implements the
     * d3.selection.each interface.
     *
     * @see https://github.com/mbostock/d3/wiki/Selections#each
     *
     * @param  {Function} callback
     * @return {sszvis.component}
     */
    sszvisComponent.render = function (callback) {
      renderer = callback;
      return sszvisComponent;
    };
    return sszvisComponent;
  }

  /**
   * d3.selection plugin to get the properties of a sszvis.component.
   * Works similarly to d3.selection.data, but for properties.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @return {Object} An object of properties for the given component
   */
  d3.selection.prototype.props = function () {
    // It would be possible to make this work exactly like
    // d3.selection.data(), but it would need some test cases,
    // so we currently simplify to the most common use-case:
    // getting props.
    if (arguments.length > 0) throw new Error("selection.props() does not accept any arguments");
    if (this.size() != 1) throw new Error("only one group is supported");
    if (this._groups[0].length != 1) throw new Error("only one node is supported");
    const group = this._groups[0];
    const node = group[0];
    return node.__props__ || {};
  };

  /**
   * Creates an accessor function that either gets or sets a value, depending
   * on whether or not it is called with arguments.
   *
   * @param  {Object} props The props to get from or set to
   * @param  {String} attr The property to be accessed
   * @param  {Function} [setter] Transforms the data on set
   * @return {Function} The accessor function
   */
  function accessor(props, prop, setter) {
    setter || (setter = identity);
    return function () {
      if (arguments.length === 0) return props[prop];
      props[prop] = setter.apply(null, slice$1(arguments));
      return this;
    };
  }
  function identity(d) {
    return d;
  }
  function slice$1(array) {
    return Array.prototype.slice.call(array);
  }
  function clone(obj) {
    const copy = {};
    for (const attr in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  /**
   * Circle annotation
   *
   * A component for creating circular data areas. The component should be passed
   * an array of data values, each of which will be used to render a data area by
   * passing it through the accessor functions. You can specify a caption to display,
   * which can be offset from the center of the data area by specifying dx or dy properties.
   *
   * @module sszvis/annotation/circle
   *
   * @param {number, function} x        The x-position of the center of the data area.
   * @param {number, function} y        The y-position of the center of the data area.
   * @param {number, function} r        The radius of the data area.
   * @param {number, function} dx       The x-offset of the data area caption.
   * @param {number, function} dy       The y-offset of the data area caption.
   * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
   *
   * @returns {sszvis.component} a circular data area component
   */

  function circle () {
    return component().prop("x", functor).prop("y", functor).prop("r", functor).prop("dx", functor).prop("dy", functor).prop("caption", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);
      const dataArea = selection.selectAll(".sszvis-dataareacircle").data(data).join("circle").classed("sszvis-dataareacircle", true);
      dataArea.attr("cx", props.x).attr("cy", props.y).attr("r", props.r).attr("fill", "url(#data-area-pattern)");
      if (props.caption) {
        const dataCaptions = selection.selectAll(".sszvis-dataareacircle__caption").data(data).join("text").classed("sszvis-dataareacircle__caption", true);
        dataCaptions.attr("x", props.x).attr("y", props.y).attr("dx", props.dx).attr("dy", props.dy).text(props.caption);
      }
    });
  }

  /**
   * Line annotation
   *
   * A component for creating reference line data areas. The component should be passed
   * an array of data values, each of which will be used to render a reference line
   * by passing it through the accessor functions. You can specify a caption to display,
   * which will be positioned by default at the midpoint of the line you specify,
   * aligned with the angle of the line. The caption can be offset from the midpoint
   * by specifying dx or dy properties.
   *
   * @module sszvis/annotation/line
   *
   * @param {any} x1             The x-value, in data units, of the first reference line point.
   * @param {any} x2             The x-value, in data units, of the second reference line point.
   * @param {any} y1             The y-value, in data units, of the first reference line point.
   * @param {any} y2             The y-value, in data units, of the second reference line point.
   * @param {function} xScale         The x-scale of the chart. Used to transform the given x- values into chart coordinates.
   * @param {function} yScale         The y-scale of the chart. Used to transform the given y- values into chart coordinates.
   * @param {number} [dx]           The x-offset of the caption
   * @param {number} [dy]           The y-offset of the caption
   * @param {string} [caption]      A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)
   * @returns {sszvis.component} a linear data area component (reference line)
   */


  // reference line specified in the form y = mx + b
  // user supplies m and b
  // default line is y = x

  function line$1 () {
    return component().prop("x1").prop("x2").prop("y1").prop("y2").prop("xScale").prop("yScale").prop("dx", functor).dx(0).prop("dy", functor).dy(0).prop("caption", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const x1 = props.xScale(props.x1);
      const y1 = props.yScale(props.y1);
      const x2 = props.xScale(props.x2);
      const y2 = props.yScale(props.y2);
      const line = selection.selectAll(".sszvis-referenceline").data(data).join("line").classed("sszvis-referenceline", true);
      line.attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
      if (props.caption) {
        const caption = selection.selectAll(".sszvis-referenceline__caption").data([0]).join("text").classed("sszvis-referenceline__caption", true);
        caption.attr("transform", () => {
          const vx = x2 - x1;
          const vy = y2 - y1;
          const angle = Math.atan2(vy, vx) * 180 / Math.PI;
          return "translate(" + (x1 + x2) / 2 + "," + (y1 + y2) / 2 + ") rotate(" + angle + ")";
        }).attr("dx", props.dx).attr("dy", props.dy).text(props.caption);
      }
    });
  }

  /**
   * Crisp
   *
   * Utilities to render SVG elements crisply by placing them precisely on the
   * pixel grid. Rectangles should be placed on round pixels, lines and circles
   * on half-pixels.
   *
   * Example of rectangle placement (four • create one pixel)
   * •    •----•----•    •
   *      |         |
   * •    •----•----•    •
   *
   * Example of line placement (four • create one pixel)
   * •    •    •    •    •
   *    ---------------
   * •    •    •    •    •
   *
   * @module sszvis/svgUtils/crisp
   */


  /**
   * crisp.halfPixel
   *
   * To ensure SVG elements are rendered crisply and without anti-aliasing
   * artefacts, they must be placed on a half-pixel grid.
   *
   * @param  {number} pos A pixel position
   * @return {number}     A pixel position snapped to the pixel grid
   */
  const halfPixel = function (pos) {
    return Math.floor(pos) + 0.5;
  };

  /**
   * crisp.roundTransformString
   *
   * Takes an SVG transform string 'translate(12.3,4.56789) rotate(3.5)' and
   * rounds all translate coordinates to integers: 'translate(12,5) rotate(3.5)'.
   *
   * A valid translate instruction has the form 'translate(<x> [<y>])' where
   * x and y can be separated by a space or comma. We normalize this to use
   * spaces because that's what Internet Explorer uses.
   *
   * @param  {string} transformStr A valid SVG transform string
   * @return {string}              An SVG transform string with rounded values
   */
  const roundTransformString = function (transformStr) {
    const roundNumber = compose(Math.floor, Number);
    return transformStr.replace(/(translate\()\s*([\d ,.]+)\s*(\))/i, (_, left, vecStr, right) => {
      const roundVec = vecStr.replace(",", " ").replace(/\s+/, " ").split(" ").map(roundNumber).join(",");
      return left + roundVec + right;
    });
  };

  /**
   * crisp.transformTranslateSubpixelShift
   *
   * This helper function takes a transform string and returns a vector that
   * tells us how much to shift an element in order to place it on a half-pixel
   * grid.
   *
   * @param  {string} transformStr A valid SVG transform string
   * @return {vecor}               Two-element array ([dx, dy])
   */
  const transformTranslateSubpixelShift = function (transformStr) {
    const roundNumber = compose(Math.floor, Number);
    const m = transformStr.match(/(translate\()\s*([\d ,.-]+)\s*(\))/i);
    const vec = m[2].replace(",", " ").replace(/\s+/, " ").split(" ").map(Number);
    if (vec.length === 1) vec.push([0]);
    const vecRound = vec.map(roundNumber);
    return [vec[0] - vecRound[0], vec[1] - vecRound[1]];
  };

  /**
   * translateString
   *
   * Pass an x and a y component, and this returns a translate string, which can be set as the 'transform' property of
   * an svg element.
   *
   * @module sszvis/svgUtils/translateString
   *
   * @param  {number} x     The x-component of the transform
   * @param  {number} y     The y-component of the transform
   * @return {string}       The translate string
   */

  function translateString (x, y) {
    return "translate(" + x + "," + y + ")";
  }

  /**
   * Tooltip anchor annotation
   *
   * Tooltip anchors are invisible SVG <rect>s that each component needs to
   * provide. Because they are real elements we can know their exact position
   * on the page without any calculations and even if the parent element has
   * been transformed. These elements need to be <rect>s because some browsers
   * don't calculate positon information for the better suited <g> elements.
   *
   * Tooltips can be bound to by selecting for the tooltip data attribute.
   *
   * @module sszvis/annotation/tooltipAnchor
   *
   * @example
   * var tooltip = sszvis.tooltip();
   * bars.selectAll('[data-tooltip-anchor]').call(tooltip);
   *
   * Tooltips use HTML5 data attributes to clarify their intent, which is not
   * to style an element but to provide an anchor that can be selected using
   * Javascript.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
   *
   * To add a tooltip anchor to an element, create a new tooltip anchor function
   * and call it on a selection. This is usually the same selection that you have
   * added the visible elements of your chart to, e.g. the selection that you
   * render bar <rect>s into.
   *
   * @example
   * var tooltipAnchor = sszvis.tooltipAnchor()
   *   .position(function(d) {
   *     return [xScale(d), yScale(d)];
   *   });
   * selection.call(tooltipAnchor);
   *
   * @property {function} position A vector of the tooltip's [x, y] coordinates
   * @property {boolean}  debug    Renders a visible tooltip anchor when true
   *
   * @return {sszvis.component}
   */


  /* Helper functions
    ----------------------------------------------- */
  function vectorToTranslateString(vec) {
    return translateString.apply(null, vec);
  }
  function tooltipAnchor () {
    return component().prop("position").position(functor([0, 0])).prop("debug").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const anchor = selection.selectAll("[data-tooltip-anchor]").data(data).join("rect").attr("height", 1).attr("width", 1).attr("fill", "none").attr("stroke", "none").attr("visibility", "none").attr("data-tooltip-anchor", "");

      // Update

      anchor.attr("transform", compose(vectorToTranslateString, props.position));

      // Visible anchor if debug is true
      if (props.debug) {
        const referencePoint = selection.selectAll("[data-tooltip-anchor-debug]").data(data).join("circle").attr("data-tooltip-anchor-debug", "");
        referencePoint.attr("r", 2).attr("fill", "#fff").attr("stroke", "#f00").attr("stroke-width", 1.5).attr("transform", compose(vectorToTranslateString, props.position));
      }
    });
  }

  /**
   * Range Flag annotation
   *
   * The range flag component creates a pair of small white circles which fit well with the range ruler.
   * However, this is a separate component for implementation reasons, because the data for the range flag
   * should usually be only one value, distinct from the range ruler which expects multiple values. The range
   * flag also creates a tooltip anchor between the two dots, to which you can attach a tooltip. See the
   * interactive stacked area chart examples for a use of the range flag.
   *
   * @module sszvis/annotation/rangeFlag
   *
   * @property {number functor} x           A value for the x-value of the range flag
   * @property {number functor} y0          A value for the y-value of the lower range flag dot
   * @property {number functor} y1          A value for the y-value of the upper range flag dot
   *
   * @returns {sszvis.component}
   */

  function rangeFlag () {
    return component().prop("x", functor).prop("y0", functor).prop("y1", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const crispX = compose(halfPixel, props.x);
      const crispY0 = compose(halfPixel, props.y0);
      const crispY1 = compose(halfPixel, props.y1);
      selection.selectAll(".sszvis-rangeFlag__mark.bottom").data(data).call(makeFlagDot("bottom", crispX, crispY0));
      selection.selectAll(".sszvis-rangeFlag__mark.top").data(data).call(makeFlagDot("top", crispX, crispY1));
      const ta = tooltipAnchor().position(d => [crispX(d), halfPixel((props.y0(d) + props.y1(d)) / 2)]);
      selection.call(ta);
    });
  }
  function makeFlagDot(classed, cx, cy) {
    return function (dot) {
      dot.join("circle").classed("sszvis-rangeFlag__mark", true).classed(classed, true).attr("r", 3.5).attr("cx", cx).attr("cy", cy);
    };
  }

  const locale = {
    decimal: ".",
    thousands: " ",
    // This is a 'narrow space', not a regular space. Used as the thousands separator by d3.format
    grouping: [3],
    currency: ["CHF ", ""],
    dateTime: "%a. %e. %B %X %Y",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: [],
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    shortMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
  };

  /**
   * Formatting functions
   *
   * @module sszvis/format
   */

  const timeFormat = d3.timeFormatLocale(locale).format;
  const format = d3.formatLocale(locale).format;

  /**
   * Format a number as an age
   * @param  {number} d
   * @return {string}
   */
  const formatAge = function (d) {
    return String(Math.round(d));
  };

  /**
   * A multi time formatter used by the axis class
   */
  const formatAxisTimeFormat = function (d) {
    const xs = [[".%L", function (date) {
      return date.getMilliseconds();
    }], [":%S", function (date) {
      return date.getSeconds();
    }], ["%H:%M", function (date) {
      return date.getMinutes();
    }], ["%H Uhr", function (date) {
      return date.getHours();
    }], ["%a., %d.", function (date) {
      return date.getDay() && date.getDate() != 1;
    }], ["%e. %b", function (date) {
      return date.getDate() != 1;
    }], ["%B", function (date) {
      return date.getMonth();
    }], ["%Y", function () {
      return true;
    }]];
    for (const x of xs) {
      if (x[1](d)) {
        return timeFormat(x[0])(d);
      }
    }
  };

  /**
   * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
   */
  const formatMonth = compose(m => m.toUpperCase(), timeFormat("%b"));

  /**
   * A year formatter for date objects. Gives the date's year.
   */
  const formatYear = timeFormat("%Y");

  /**
   * Formatter for no label
   * @return {string} the empty string
   */
  const formatNone = function () {
    return "";
  };

  /**
   * Format numbers according to the sszvis style guide. The most important
   * rules are:
   *
   * - Thousands separator is a thin space (not a space)
   * - Only apply thousands separator for numbers >= 10000
   * - Decimal places only for significant decimals
   * - No decimal places for numbers >= 10000
   * - One decimal place for numbers >= 100
   * - Up to 2 significant decimal places for smaller numbers
   *
   * See also: many test cases for this function in format.test.js
   *
   * @param  {number} d   Number
   * @return {string}     Fully formatted number
   */
  const formatNumber = function (d) {
    let p;
    const dAbs = Math.abs(d);
    if (d == null || isNaN(d)) {
      return "–"; // This is an en-dash
    }

    // 10250    -> "10 250"
    // 10250.91 -> "10 251"
    else if (dAbs >= 1e4) {
      // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
      // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
      return format(",.0f")(d);
    }

    // 2350     -> "2350"
    // 2350.29  -> "2350.3"
    else if (dAbs >= 100) {
      p = Math.min(1, decimalPlaces(d));
      // Where there are decimals, round to 1 position
      // To display more precision, use the preciseNumber function.
      return stripTrailingZeroes(format("." + p + "f")(d));
    }

    // 41       -> "41"
    // 41.1     -> "41.1"
    // 41.329   -> "41.33"
    else if (dAbs > 0) {
      p = Math.min(2, decimalPlaces(d));
      // Rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
      // but not more. To display more precision, use the preciseNumber function.
      return stripTrailingZeroes(format("." + p + "f")(d));
    }

    // If abs(num) is not > 0, num is 0
    // 0       -> "0"
    else {
      return format(".0f")(0);
    }
  };

  /**
   * Format numbers to a particular precision. This function is "curried", meaning that it is a function with
   * multiple arguments, but when you call it with less than the full number of arguments, it returns a function
   * that takes less arguments and has the arguments you did provide "pre-filled" as parameters. So that means that:
   *
   * preciseNumber(2, 14.1234) -> "14.12"
   * preciseNumber(2) -> function that accepts numbers and returns formatted values
   *
   * Note that preciseNumber(2, 14.1234) is equivalent to preciseNumber(2)(14.1234)
   *
   * @param  {Number} p           The desired precision
   * @param  {Number} d           The number to be formatted
   * @return {String}             The formatted number
   */
  const formatPreciseNumber = function (p, d) {
    // This curries the function
    if (arguments.length > 1) return formatPreciseNumber(p)(d);
    return function (x) {
      const dAbs = Math.abs(x);
      return dAbs >= 100 && dAbs < 1e4 ? format("." + p + "f")(x) : format(",." + p + "f")(x);
    };
  };

  /**
   * Format percentages on the range 0 - 100
   * @param  {number} d    A value to format, between 0 and 100
   * @return {string}      The formatted value
   */
  const formatPercent = function (d) {
    // Uses unix thin space
    return formatNumber(d) + " %";
  };

  /**
   * Format percentages on the range 0 - 1
   * @param  {number} d    A value to format, between 0 and 1
   * @return {string}      The formatted value
   */
  const formatFractionPercent = function (d) {
    // Uses unix thin space
    return formatNumber(d * 100) + " %";
  };

  /**
   * Default formatter for text
   * @param  {number} d
   * @return {string} Fully formatted text
   */
  const formatText = String;

  /* Helper functions
  ----------------------------------------------- */

  // decLen is the number of decimal places in the number
  // 0.0002 -> 4
  // 0.0000 -> 0 (Javascript's number implementation chops off trailing zeroes)
  // 123456.1 -> 1
  // 123456.00001 -> 5
  function decimalPlaces(num) {
    return (String(Math.abs(num)).split(".")[1] || "").length;
  }
  function stripTrailingZeroes(str) {
    return str.replace(/(\.\d*[1-9])0+$|\.0*$/, "$1");
  }

  /**
   * RangeRuler annotation
   *
   * The range ruler is similar to the handle ruler and the ruler, except for each data
   * point which it finds bound to its layer, it generates two small dots, and a label which
   * states the value of the data point. For an example, see the interactive stacked area charts.
   * Note that the interactive stacked area charts also include the rangeFlag component for highlighting
   * certain specific dots. This is a sepearate component.
   *
   * @module sszvis/annotation/rangeRuler
   *
   * @property {number functor} x            A function for the x-position of the ruler.
   * @property {number functor} y0           A function for the y-position of the lower dot. Called for each datum.
   * @property {number functor} y1           A function for the y-position of the upper dot. Called for each datum.
   * @property {number} top                  A number for the y-position of the top of the ruler
   * @property {number} bottom               A number for the y-position of the bottom of the ruler
   * @property {string functor} label        A function which generates labels for each range.
   * @property {number} total                A number to display as the total of the range ruler (at the top)
   * @property {boolean functor} flip        Determines whether the rangeRuler labels should be flipped (they default to the right side)
   *
   * @return {sszvis.component}
   */

  function rangeRuler () {
    return component().prop("x", functor).prop("y0", functor).prop("y1", functor).prop("top").prop("bottom").prop("label").prop("removeStroke").label(functor("")).prop("total").prop("flip", functor).flip(false).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const crispX = compose(halfPixel, props.x);
      const crispY0 = compose(halfPixel, props.y0);
      const crispY1 = compose(halfPixel, props.y1);
      const middleY = function (d) {
        return halfPixel((props.y0(d) + props.y1(d)) / 2);
      };
      const dotRadius = 1.5;
      const line = selection.selectAll(".sszvis-rangeRuler__rule").data([0]).join("line").classed("sszvis-rangeRuler__rule", true);
      line.attr("x1", crispX).attr("y1", props.top).attr("x2", crispX).attr("y2", props.bottom);
      const marks = selection.selectAll(".sszvis-rangeRuler--mark").data(data).join("g").classed("sszvis-rangeRuler--mark", true);
      marks.append("circle").classed("sszvis-rangeRuler__p1", true);
      marks.append("circle").classed("sszvis-rangeRuler__p2", true);
      marks.append("text").classed("sszvis-rangeRuler__label-contour", true);
      marks.append("text").classed("sszvis-rangeRuler__label", true);
      marks.selectAll(".sszvis-rangeRuler__p1").data(d => [d]).attr("cx", crispX).attr("cy", crispY0).attr("r", dotRadius);
      marks.selectAll(".sszvis-rangeRuler__p2").data(d => [d]).attr("cx", crispX).attr("cy", crispY1).attr("r", dotRadius);
      marks.selectAll(".sszvis-rangeRuler__label").data(d => [d]).attr("x", d => {
        const offset = props.flip(d) ? -10 : 10;
        return crispX(d) + offset;
      }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
      .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));

      //make the contour behind the the label update with the label
      marks.selectAll(".sszvis-rangeRuler__label-contour").data(d => [d]).attr("x", d => {
        const offset = props.flip(d) ? -10 : 10;
        return crispX(d) + offset;
      }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
      .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));
      selection.selectAll("g.sszvis-rangeRuler--mark").each(function () {
        const g = d3.select(this);
        const textNode = g.select("text").node();
        let textContour = g.select(".sszvis-rangeRuler__label-contour");
        if (textContour.empty()) {
          textContour = d3.select(textNode.cloneNode()).classed("sszvis-rangeRuler__label-contour", true).classed("sszvis-rangeRuler__label", false);
          this.insertBefore(textContour.node(), textNode);
        } else {
          textContour.attr("x", d => {
            const offset = props.flip(d) ? -10 : 10;
            return crispX(d) + offset;
          }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
          .style("text-anchor", d => props.flip(d) ? "end" : "start");
        }
        textContour.text(textNode.textContent);
      });
      if (!props.removeStroke) {
        marks.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
      }
      const total = selection.selectAll(".sszvis-rangeRuler__total").data([last(data)]).join("text").classed("sszvis-rangeRuler__total", true);
      total.attr("x", d => {
        const offset = props.flip(d) ? -10 : 10;
        return crispX(d) + offset;
      }).attr("y", props.top - 10).style("text-anchor", d => props.flip(d) ? "end" : "start").text("Total " + formatNumber(props.total));
      const totalNode = total.node();
      let totalContour = selection.select(".sszvis-rangeRuler__total-contour");
      if (totalContour.empty()) {
        totalContour = d3.select(totalNode.cloneNode()).classed("sszvis-rangeRuler__total-contour", true).classed("sszvis-rangeRuler__total", false);
        this.insertBefore(totalContour.node(), totalNode);
      } else {
        totalContour.attr("x", d => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        }).attr("y", props.top - 10).style("text-anchor", d => props.flip(d) ? "end" : "start");
      }
      totalContour.text(totalNode.textContent);
      if (!props.removeStroke) {
        total.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
      }
    });
  }

  /**
   * Rectangle annotation
   *
   * A component for creating rectangular data areas. The component should be passed
   * an array of data values, each of which will be used to render a data area by
   * passing it through the accessor functions. You can specify a caption to display,
   * which can be offset from the center of the data area by specifying dx or dy properties.
   *
   * @module sszvis/annotation/rectangle
   *
   * @param {number, function} x        The x-position of the upper left corner of the data area.
   * @param {number, function} y        The y-position of the upper left corner of the data area.
   * @param {number, function} width    The width of the data area.
   * @param {number, function} height   The height of the data area.
   * @param {number, function} dx       The x-offset of the data area caption.
   * @param {number, function} dy       The y-offset of the data area caption.
   * @param {string, function} caption  The caption for the data area.
   *
   * @returns {sszvis.component} a rectangular data area component
   */

  function rectangle () {
    return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("dx", functor).prop("dy", functor).prop("caption", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);
      const dataArea = selection.selectAll(".sszvis-dataarearectangle").data(data).join("rect").classed("sszvis-dataarearectangle", true);
      dataArea.attr("x", props.x).attr("y", props.y).attr("width", props.width).attr("height", props.height).attr("fill", "url(#data-area-pattern)");
      if (props.caption) {
        const dataCaptions = selection.selectAll(".sszvis-dataarearectangle__caption").data(data).join("text").classed("sszvis-dataarearectangle__caption", true);
        dataCaptions.attr("x", (d, i) => props.x(d, i) + props.width(d, i) / 2).attr("y", (d, i) => props.y(d, i) + props.height(d, i) / 2).attr("dx", props.dx).attr("dy", props.dy).text(props.caption);
      }
    });
  }

  /**
   * Ruler annotation
   *
   * The ruler component can be used to create a vertical line which highlights data at a certain
   * x-value, for instance in a line chart or area chart. The ruler expects data to be bound to
   * the layer it renders into, and it will generate a small dot for each data point it finds.
   *
   * @module sszvis/annotation/ruler
   *
   * @property {number} top                 A number which is the y-position of the top of the ruler line
   * @property {number} bottom              A number which is the y-position of the bottom of the ruler line
   * @property {function} x                 A number or function returning a number for the x-position of the ruler line.
   * @property {function} y                 A function for determining the y-position of the ruler dots. Should take a data
   *                                        value as an argument and return a y-position.
   * @property {function} label             A function for determining the labels of the ruler dots. Should take a
   *                                        data value as argument and return a label.
   * @property {string, function} color     A string or function to specify the color of the ruler dots.
   * @property {function} flip              A boolean or function which returns a boolean that specifies
   *                                        whether the labels on the ruler dots should be flipped. (they default to the right side)
   * @property {function} labelId           An id accessor function for the labels. This is used to match label data to svg elements,
   *                                        and it is used by the reduceOverlap algorithm to match calculated bounds and positions with
   *                                        labels. The default implementation uses the x and y positions of each label, but when labels
   *                                        overlap, these positions are the same (and one will be removed!). It's generally a good idea
   *                                        to provide your own function here, but you should especially use this when multiple labels
   *                                        could overlap with each other. Usually this will be some kind of category accessor function.
   * @property {boolean} reduceOverlap      Use an iterative relaxation algorithm to adjust the positions of the labels (when there is more
   *                                        than one label) so that they don't overlap. This can be computationally expensive, when there are
   *                                        many labels that need adjusting. This is turned off by default.
   *
   * @return {sszvis.component}
   */

  const annotationRuler = () => component().prop("top").prop("bottom").prop("x", functor).prop("y", functor).prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).prop("labelId", functor).prop("reduceOverlap").reduceOverlap(true).render(function (data) {
    const selection = d3.select(this);
    const props = selection.props();
    const labelId = props.labelId || function (d) {
      return props.x(d) + "_" + props.y(d);
    };
    const ruler = selection.selectAll(".sszvis-ruler__rule").data(data, labelId).join("line").classed("sszvis-ruler__rule", true);
    ruler.attr("x1", compose(halfPixel, props.x)).attr("y1", props.y).attr("x2", compose(halfPixel, props.x)).attr("y2", props.bottom);
    const dot = selection.selectAll(".sszvis-ruler__dot").data(data, labelId).join("circle").classed("sszvis-ruler__dot", true);
    dot.attr("cx", compose(halfPixel, props.x)).attr("cy", compose(halfPixel, props.y)).attr("r", 3.5).attr("fill", props.color);
    selection.selectAll(".sszvis-ruler__label-outline").data(data, labelId).join("text").classed("sszvis-ruler__label-outline", true);
    const label = selection.selectAll(".sszvis-ruler__label").data(data, labelId).join("text").classed("sszvis-ruler__label", true);

    // Update both label and labelOutline selections

    const crispX = compose(halfPixel, props.x);
    const crispY = compose(halfPixel, props.y);
    const textSelection = selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
      const x = crispX(d);
      const y = crispY(d);
      const dx = props.flip(d) ? -10 : 10;
      const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;
      return translateString(x + dx, y + dy);
    }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(props.label);
    if (props.reduceOverlap) {
      const THRESHOLD = 2;
      let ITERATIONS = 10;
      const labelBounds = [];
      // Optimization for the lookup later
      const labelBoundsIndex = {};

      // Reset vertical shift (set by previous renders)
      textSelection.attr("y", "");

      // Create bounds objects
      label.each(function (d) {
        const bounds = this.getBoundingClientRect();
        const item = {
          top: bounds.top,
          bottom: bounds.bottom,
          dy: 0
        };
        labelBounds.push(item);
        labelBoundsIndex[labelId(d)] = item;
      });

      // Sort array in place by vertical position
      // (only supports labels of same height)
      labelBounds.sort((a, b) => d3.ascending(a.top, b.top));

      // Using postfix decrement means the expression evaluates to the value of the variable
      // before the decrement takes place. In the case of 10 iterations, this means that the
      // variable gets to 0 after the truthiness of the 10th iteration is tested, and the
      // expression is false at the beginning of the 11th, so 10 iterations are executed.
      // If you use prefix decrement (--ITERATIONS), the variable gets to 0 at the beginning of
      // the 10th iteration, meaning that only 9 iterations are executed.
      while (ITERATIONS--) {
        // Calculate overlap and correct position
        for (const [index, firstLabel] of labelBounds.entries()) {
          for (const secondLabel of labelBounds.slice(index + 1)) {
            const overlap = firstLabel.bottom - secondLabel.top;
            if (overlap >= THRESHOLD) {
              const offset = overlap / 2;
              firstLabel.bottom -= offset;
              firstLabel.top -= offset;
              firstLabel.dy -= offset;
              secondLabel.bottom += offset;
              secondLabel.top += offset;
              secondLabel.dy += offset;
            }
          }
        }
      }

      // Shift vertically to remove overlap
      textSelection.attr("y", d => {
        const textLabel = labelBoundsIndex[labelId(d)];
        return textLabel.dy;
      });
    }
  });
  const rulerLabelVerticalSeparate = cAcc => g => {
    const THRESHOLD = 2;
    const labelBounds = [];

    // Reset vertical shift
    g.selectAll("text").each(function () {
      d3.select(this).attr("y", "");
    });

    // Calculate bounds
    g.selectAll(".sszvis-ruler__label").each(function (d) {
      const bounds = this.getBoundingClientRect();
      labelBounds.push({
        category: cAcc(d),
        top: bounds.top,
        bottom: bounds.bottom,
        dy: 0
      });
    });

    // Sort by vertical position (only supports labels of same height)
    labelBounds.sort((a, b) => d3.ascending(a.top, b.top));

    // Calculate overlap and correct position
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < labelBounds.length; j++) {
        for (let k = j + 1; k < labelBounds.length; k++) {
          if (j === k) continue;
          const firstLabel = labelBounds[j];
          const secondLabel = labelBounds[k];
          const overlap = firstLabel.bottom - secondLabel.top;
          if (overlap >= THRESHOLD) {
            firstLabel.bottom -= overlap / 2;
            firstLabel.top -= overlap / 2;
            firstLabel.dy -= overlap / 2;
            secondLabel.bottom += overlap / 2;
            secondLabel.top += overlap / 2;
            secondLabel.dy += overlap / 2;
          }
        }
      }
    }

    // Shift vertically to remove overlap
    g.selectAll("text").each(function (d) {
      const label = find(l => l.category === cAcc(d), labelBounds);
      if (label) {
        d3.select(this).attr("y", label.dy);
      }
    });
  };

  /**
   * Tooltip annotation
   *
   * Use this component to add a tooltip to the document. The tooltip component should be
   * called on a selection of [data-tooltip-anchor], which contain the information necessary to
   * position the tooltip and provide it with data. The tooltip's visibility should be toggled
   * using the .visible property, passing a predicate function. Tooltips will be displayed
   * when .visible returns true.
   *
   * @module sszvis/annotation/tooltip
   *
   * @property {seletion} renderInto      Provide a selection container into which to render the tooltip.
   *                                      Unlike most other components, the tooltip isn't rendered directly into the selection
   *                                      on which it is called. Instead, it's rendered into whichever selection is
   *                                      passed to the renderInto option
   * @property {function} visible         Provide a predicate function which accepts a datum and determines whether the associated
   *                                      tooltip should be visible. (default: false)
   * @property {function} header          A function accepting a datum. The result becomes the header of the tooltip.
   *                                      This function can return:
   *                                      - a plain string
   *                                      - an HTML string to be used as innerHTML
   * @property {function} body            A function accepting a datum. The result becomes the body of the tooltip.
   *                                      This function can return:
   *                                      - a plain string
   *                                      - an HTML string to be used as innerHTML
   *                                      - an array of arrays, which produces a tabular layout where each
   *                                      sub-array is one row in the table.
   * @property {function} orientation     A string or function returning a string which determines the orientation. This determines
   *                                      which direction the tooltip sits relative to its point.
   *                                      Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right).
   *                                      Default is "bottom".
   * @property {number} dx                A number for the x-offset of the tooltip
   * @property {number} dy                A number for the y-offset of the tooltip
   * @property {function} opacity         A function or number which determines the opacity of the tooltip. Default is 1.
   *
   * @return {sszvis.component}
   *
   */


  /* Configuration
  ----------------------------------------------- */
  const SMALL_CORNER_RADIUS = 3;
  const LARGE_CORNER_RADIUS = 4;
  const TIP_SIZE = 6;
  const BLUR_PADDING = 5;

  /* Exported module
  ----------------------------------------------- */
  function tooltip () {
    const renderer = tooltipRenderer();
    return component().delegate("header", renderer).delegate("body", renderer).delegate("orientation", renderer).delegate("dx", renderer).delegate("dy", renderer).delegate("opacity", renderer).prop("renderInto").prop("visible", functor).visible(false).renderSelection(selection => {
      const props = selection.props();
      const intoBCR = props.renderInto.node().getBoundingClientRect();
      const tooltipData = [];
      selection.each(function (d) {
        if (props.visible(d)) {
          const thisBCR = this.getBoundingClientRect();
          const pos = [thisBCR.left - intoBCR.left, thisBCR.top - intoBCR.top];
          tooltipData.push({
            datum: d,
            x: pos[0],
            y: pos[1]
          });
        }
      });
      props.renderInto.datum(tooltipData).call(renderer);
    });
  }

  /**
   * Tooltip renderer
   * @private
   */
  const tooltipRenderer = function () {
    return component().prop("header").prop("body").prop("orientation", functor).orientation("bottom").prop("dx", functor).dx(1).prop("dy", functor).dy(1).prop("opacity", functor).opacity(1).renderSelection(selection => {
      const tooltipData = selection.datum();
      const props = selection.props();
      const isDef = defined;
      const isSmall = isDef(props.header) && !isDef(props.body) || !isDef(props.header) && isDef(props.body);

      // Select tooltip elements

      const tooltip = selection.selectAll(".sszvis-tooltip").data(tooltipData).join("div");
      tooltip.style("pointer-events", "none").style("opacity", props.opacity).style("padding-top", d => props.orientation(d) === "top" ? TIP_SIZE + "px" : null).style("padding-right", d => props.orientation(d) === "right" ? TIP_SIZE + "px" : null).style("padding-bottom", d => props.orientation(d) === "bottom" ? TIP_SIZE + "px" : null).style("padding-left", d => props.orientation(d) === "left" ? TIP_SIZE + "px" : null).classed("sszvis-tooltip", true);

      // Enter: tooltip background

      const enterBackground = tooltip.selectAll(".sszvis-tooltip__background").data([0]).join("svg").attr("class", "sszvis-tooltip__background").attr("height", 0).attr("width", 0);
      const enterBackgroundPath = enterBackground.selectAll("path").data([0]).join("path");
      if (supportsSVGFilters()) {
        const filter = enterBackground.selectAll("filter").data([0]).join("filter").attr("id", "sszvisTooltipShadowFilter").attr("height", "150%");
        filter.selectAll("feGaussianBlur").data([0]).join("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 2);
        filter.selectAll("feComponentTransfer").data([0]).join("feComponentTransfer").selectAll("feFuncA").data([0]).join("feFuncA").attr("type", "linear").attr("slope", 0.2);
        const merge = filter.selectAll("feMerge").data([0]).join("feMerge");
        merge.selectAll("feMergeNode").data([0]).join("feMergeNode"); // Contains the blurred image
        merge.selectAll("feMergeNode").data([0]).join("feMergeNode") // Contains the element that the filter is applied to
        .attr("in", "SourceGraphic");
        enterBackgroundPath.attr("filter", "url(#sszvisTooltipShadowFilter)");
      } else {
        enterBackground.classed("sszvis-tooltip__background--fallback", true);
      }

      // Enter: tooltip content

      const enterContent = tooltip.selectAll(".sszvis-tooltip__content").data([0]).join("div").classed("sszvis-tooltip__content", true);
      enterContent.selectAll(".sszvis-tooltip__header").data([0]).join("div").classed("sszvis-tooltip__header", true);
      enterContent.selectAll(".sszvis-tooltip__body").data([0]).join("div").classed("sszvis-tooltip__body", true);

      // Update: content

      tooltip.select(".sszvis-tooltip__header").datum(prop("datum")).html(props.header || functor(""));
      tooltip.select(".sszvis-tooltip__body").datum(prop("datum")).html(d => {
        const body = props.body ? functor(props.body)(d) : "";
        return Array.isArray(body) ? formatTable(body) : body;
      });
      selection.selectAll(".sszvis-tooltip").classed("sszvis-tooltip--small", isSmall).each(function (d) {
        const tip = d3.select(this);
        // only using dimensions.width and dimensions.height here. Not affected by scroll position
        const dimensions = tip.node().getBoundingClientRect();
        const orientation = Reflect.apply(props.orientation, this, arguments);

        // Position tooltip element

        switch (orientation) {
          case "top":
            {
              tip.style("left", d.x - dimensions.width / 2 + "px").style("top", d.y + props.dy(d) + "px");
              break;
            }
          case "bottom":
            {
              tip.style("left", d.x - dimensions.width / 2 + "px").style("top", d.y - props.dy(d) - dimensions.height + "px");
              break;
            }
          case "left":
            {
              tip.style("left", d.x + props.dx(d) + "px").style("top", d.y - dimensions.height / 2 + "px");
              break;
            }
          case "right":
            {
              tip.style("left", d.x - props.dx(d) - dimensions.width + "px").style("top", d.y - dimensions.height / 2 + "px");
              break;
            }
        }

        // Position background element

        const bgHeight = dimensions.height + 2 * BLUR_PADDING;
        const bgWidth = dimensions.width + 2 * BLUR_PADDING;
        tip.select(".sszvis-tooltip__background").attr("height", bgHeight).attr("width", bgWidth).style("left", -BLUR_PADDING + "px").style("top", -BLUR_PADDING + "px").select("path").attr("d", tooltipBackgroundGenerator([BLUR_PADDING, BLUR_PADDING], [bgWidth - BLUR_PADDING, bgHeight - BLUR_PADDING], orientation, isSmall ? SMALL_CORNER_RADIUS : LARGE_CORNER_RADIUS));
      });
    });
  };

  /**
   * formatTable
   */
  function formatTable(rows) {
    const tableBody = rows.map(row => "<tr>" + row.map(cell => "<td>" + cell + "</td>").join("") + "</tr>").join("");
    return '<table class="sszvis-tooltip__body__table">' + tableBody + "</table>";
  }
  function x(d) {
    return d[0];
  }
  function y(d) {
    return d[1];
  }
  function side(cx, cy, x0, y0, x1, y1, showTip) {
    const mx = x0 + (x1 - x0) / 2;
    const my = y0 + (y1 - y0) / 2;
    const corner = ["Q", cx, cy, x0, y0];
    let tip = [];
    if (showTip && y0 === y1) {
      tip = x0 < x1 ?
      // Top
      ["L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my] :
      // Bottom
      ["L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my];
    } else if (showTip && x0 === x1) {
      tip = y0 < y1 ?
      // Right
      ["L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE] :
      // Left
      ["L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE];
    }
    const end = ["L", x1, y1];
    return [...corner, ...tip, ...end];
  }

  /**
   * Tooltip background generator
   *
   * Generates a path description with a tip on the specified side.
   *
   *           top
   *         ________
   *   left |        | right
   *        |___  ___|
   *            \/
   *          bottom
   *
   * @param  {Vector} a           Top-left corner of the tooltip rectangle (x, y)
   * @param  {Vector} b           Bottom-right corner of the tooltip rectangle (x, y)
   * @param  {String} orientation The tip will point in this direction (top, right, bottom, left)
   *
   * @return {Path}               SVG path description
   */
  function tooltipBackgroundGenerator(a, b, orientation, radius) {
    switch (orientation) {
      case "top":
        {
          a[1] = a[1] + TIP_SIZE;
          break;
        }
      case "bottom":
        {
          b[1] = b[1] - TIP_SIZE;
          break;
        }
      case "left":
        {
          a[0] = a[0] + TIP_SIZE;
          break;
        }
      case "right":
        {
          b[0] = b[0] - TIP_SIZE;
          break;
        }
    }
    return [
    // Start
    ["M", x(a), y(a) + radius],
    // Top side
    side(x(a), y(a), x(a) + radius, y(a), x(b) - radius, y(a), orientation === "top"),
    // Right side
    side(x(b), y(a), x(b), y(a) + radius, x(b), y(b) - radius, orientation === "right"),
    // Bottom side
    side(x(b), y(b), x(b) - radius, y(b), x(a) + radius, y(b), orientation === "bottom"),
    // Left side
    side(x(a), y(b), x(a), y(b) - radius, x(a), y(a) + radius, orientation === "left")].map(d => d.join(" ")).join(" ");
  }

  /**
   * Detect whether the current browser supports SVG filters
   */
  function supportsSVGFilters() {
    return window["SVGFEColorMatrixElement"] !== undefined && SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE == 2;
  }

  /**
   * @function sszvis.tooltipFit
   *
   * This is a useful default function for making a tooltip fit within a horizontal space.
   * You provide a default orientation for the tooltip, but also provide the bounds of the
   * space within which the tooltip should stay. When the tooltip is too close to the left
   * or right edge of the bounds, it is oriented away from the edge. Otherwise the default
   * is used.
   *
   * @param {String} defaultValue         The default value for the tooltip orientation
   * @param {Object} bounds               The bounds object within which the tooltip should stay.
   *
   * @returns {Function}                  A function for calculating the orientation of the tooltips.
   */

  function fitTooltip (defaultVal, bounds) {
    const lo = Math.min(bounds.innerWidth * 1 / 4, 100);
    const hi = Math.max(bounds.innerWidth * 3 / 4, bounds.innerWidth - 100);
    return function (d) {
      const x = d.x;
      return x > hi ? "right" : x < lo ? "left" : defaultVal;
    };
  }

  /**
   * Default transition attributes for sszvis
   *
   * @module sszvis/transition
   *
   * Generally speaking, this module is used internally by components which transition the state of the update selection.
   * The module sszvis.transition encapsulates the basic transition attributes used in the app. It is invoked by doing
   * d3.selection().transition().call(sszvis.transition), which applies the transition attributes to the passed transition.
   * transition.fastTransition provides an alternate transition duration for certain situations where the standard duration is
   * too slow.
   */

  const defaultEase = d3.easePolyOut;
  const defaultTransition = function () {
    return d3.transition().ease(defaultEase).duration(300);
  };
  const fastTransition = function () {
    return d3.transition().ease(defaultEase).duration(50);
  };
  const slowTransition = function () {
    return d3.transition().ease(defaultEase).duration(500);
  };

  /**
   * @function sszvis.annotationConfidenceArea
   *
   * A component for creating confidence areas. The component should be passed
   * an array of data values, each of which will be used to render a confidence area
   * by passing it through the accessor functions. You can specify the x, y0, and y1
   * properties to define the area. The component also supports stroke, strokeWidth,
   * and fill properties for styling.
   *
   * @module sszvis/annotation/confidenceArea
   *
   * @param {function} x             The x-accessor function.
   * @param {function} y0            The y0-accessor function.
   * @param {function} y1            The y1-accessor function.
   * @param {string} [stroke]        The stroke color of the area.
   * @param {number} [strokeWidth]   The stroke width of the area.
   * @param {string} [fill]          The fill color of the area.
   * @param {function} [key]         The key function for data binding.
   * @param {function} [valuesAccessor] The accessor function for the data values.
   * @param {boolean} [transition]   Whether to apply a transition to the area.
   *
   * @returns {sszvis.component} a confidence area component
   */

  function confidenceArea () {
    return component().prop("x").prop("y0").prop("y1").prop("stroke").prop("strokeWidth").prop("fill").prop("key").key((_, i) => i).prop("valuesAccessor").valuesAccessor(identity$1).prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);

      // Layouts
      const area = d3.area().x(props.x).y0(props.y0).y1(props.y1);

      // Rendering

      let path = selection.selectAll(".sszvis-area").data(data, props.key).join("path").classed("sszvis-area", true).style("stroke", props.stroke).attr("fill", "url(#data-area-pattern)").order();
      if (props.transition) {
        path = path.transition().call(defaultTransition);
      }
      path.attr("d", compose(area, props.valuesAccessor)).style("stroke", props.stroke).style("stroke-width", props.strokeWidth).attr("fill", "url(#data-area-pattern)");
    });
  }

  // src/utils/env.ts
  var NOTHING = Symbol.for("immer-nothing");
  var DRAFTABLE = Symbol.for("immer-draftable");
  var DRAFT_STATE = Symbol.for("immer-state");
  function die(error, ...args) {
    throw new Error(
      `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
    );
  }

  // src/utils/common.ts
  var getPrototypeOf = Object.getPrototypeOf;
  function isDraft(value) {
    return !!value && !!value[DRAFT_STATE];
  }
  function isDraftable(value) {
    if (!value)
      return false;
    return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
  }
  var objectCtorString = Object.prototype.constructor.toString();
  function isPlainObject(value) {
    if (!value || typeof value !== "object")
      return false;
    const proto = getPrototypeOf(value);
    if (proto === null) {
      return true;
    }
    const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
    if (Ctor === Object)
      return true;
    return typeof Ctor == "function" && Function.toString.call(Ctor) === objectCtorString;
  }
  function each(obj, iter) {
    if (getArchtype(obj) === 0 /* Object */) {
      Reflect.ownKeys(obj).forEach((key) => {
        iter(key, obj[key], obj);
      });
    } else {
      obj.forEach((entry, index) => iter(index, entry, obj));
    }
  }
  function getArchtype(thing) {
    const state = thing[DRAFT_STATE];
    return state ? state.type_ : Array.isArray(thing) ? 1 /* Array */ : isMap(thing) ? 2 /* Map */ : isSet(thing) ? 3 /* Set */ : 0 /* Object */;
  }
  function has(thing, prop) {
    return getArchtype(thing) === 2 /* Map */ ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
  }
  function set(thing, propOrOldValue, value) {
    const t = getArchtype(thing);
    if (t === 2 /* Map */)
      thing.set(propOrOldValue, value);
    else if (t === 3 /* Set */) {
      thing.add(value);
    } else
      thing[propOrOldValue] = value;
  }
  function is(x, y) {
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    } else {
      return x !== x && y !== y;
    }
  }
  function isMap(target) {
    return target instanceof Map;
  }
  function isSet(target) {
    return target instanceof Set;
  }
  function latest(state) {
    return state.copy_ || state.base_;
  }
  function shallowCopy(base, strict) {
    if (isMap(base)) {
      return new Map(base);
    }
    if (isSet(base)) {
      return new Set(base);
    }
    if (Array.isArray(base))
      return Array.prototype.slice.call(base);
    const isPlain = isPlainObject(base);
    if (strict === true || strict === "class_only" && !isPlain) {
      const descriptors = Object.getOwnPropertyDescriptors(base);
      delete descriptors[DRAFT_STATE];
      let keys = Reflect.ownKeys(descriptors);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const desc = descriptors[key];
        if (desc.writable === false) {
          desc.writable = true;
          desc.configurable = true;
        }
        if (desc.get || desc.set)
          descriptors[key] = {
            configurable: true,
            writable: true,
            // could live with !!desc.set as well here...
            enumerable: desc.enumerable,
            value: base[key]
          };
      }
      return Object.create(getPrototypeOf(base), descriptors);
    } else {
      const proto = getPrototypeOf(base);
      if (proto !== null && isPlain) {
        return { ...base };
      }
      const obj = Object.create(proto);
      return Object.assign(obj, base);
    }
  }
  function freeze(obj, deep = false) {
    if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
      return obj;
    if (getArchtype(obj) > 1) {
      obj.set = obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
    }
    Object.freeze(obj);
    if (deep)
      Object.entries(obj).forEach(([key, value]) => freeze(value, true));
    return obj;
  }
  function dontMutateFrozenCollections() {
    die(2);
  }
  function isFrozen(obj) {
    return Object.isFrozen(obj);
  }

  // src/utils/plugins.ts
  var plugins = {};
  function getPlugin(pluginKey) {
    const plugin = plugins[pluginKey];
    if (!plugin) {
      die(0, pluginKey);
    }
    return plugin;
  }

  // src/core/scope.ts
  var currentScope;
  function getCurrentScope() {
    return currentScope;
  }
  function createScope(parent_, immer_) {
    return {
      drafts_: [],
      parent_,
      immer_,
      // Whenever the modified draft contains a draft from another scope, we
      // need to prevent auto-freezing so the unowned draft can be finalized.
      canAutoFreeze_: true,
      unfinalizedDrafts_: 0
    };
  }
  function usePatchesInScope(scope, patchListener) {
    if (patchListener) {
      getPlugin("Patches");
      scope.patches_ = [];
      scope.inversePatches_ = [];
      scope.patchListener_ = patchListener;
    }
  }
  function revokeScope(scope) {
    leaveScope(scope);
    scope.drafts_.forEach(revokeDraft);
    scope.drafts_ = null;
  }
  function leaveScope(scope) {
    if (scope === currentScope) {
      currentScope = scope.parent_;
    }
  }
  function enterScope(immer2) {
    return currentScope = createScope(currentScope, immer2);
  }
  function revokeDraft(draft) {
    const state = draft[DRAFT_STATE];
    if (state.type_ === 0 /* Object */ || state.type_ === 1 /* Array */)
      state.revoke_();
    else
      state.revoked_ = true;
  }

  // src/core/finalize.ts
  function processResult(result, scope) {
    scope.unfinalizedDrafts_ = scope.drafts_.length;
    const baseDraft = scope.drafts_[0];
    const isReplaced = result !== void 0 && result !== baseDraft;
    if (isReplaced) {
      if (baseDraft[DRAFT_STATE].modified_) {
        revokeScope(scope);
        die(4);
      }
      if (isDraftable(result)) {
        result = finalize(scope, result);
        if (!scope.parent_)
          maybeFreeze(scope, result);
      }
      if (scope.patches_) {
        getPlugin("Patches").generateReplacementPatches_(
          baseDraft[DRAFT_STATE].base_,
          result,
          scope.patches_,
          scope.inversePatches_
        );
      }
    } else {
      result = finalize(scope, baseDraft, []);
    }
    revokeScope(scope);
    if (scope.patches_) {
      scope.patchListener_(scope.patches_, scope.inversePatches_);
    }
    return result !== NOTHING ? result : void 0;
  }
  function finalize(rootScope, value, path) {
    if (isFrozen(value))
      return value;
    const state = value[DRAFT_STATE];
    if (!state) {
      each(
        value,
        (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path)
      );
      return value;
    }
    if (state.scope_ !== rootScope)
      return value;
    if (!state.modified_) {
      maybeFreeze(rootScope, state.base_, true);
      return state.base_;
    }
    if (!state.finalized_) {
      state.finalized_ = true;
      state.scope_.unfinalizedDrafts_--;
      const result = state.copy_;
      let resultEach = result;
      let isSet2 = false;
      if (state.type_ === 3 /* Set */) {
        resultEach = new Set(result);
        result.clear();
        isSet2 = true;
      }
      each(
        resultEach,
        (key, childValue) => finalizeProperty(rootScope, state, result, key, childValue, path, isSet2)
      );
      maybeFreeze(rootScope, result, false);
      if (path && rootScope.patches_) {
        getPlugin("Patches").generatePatches_(
          state,
          path,
          rootScope.patches_,
          rootScope.inversePatches_
        );
      }
    }
    return state.copy_;
  }
  function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
    if (isDraft(childValue)) {
      const path = rootPath && parentState && parentState.type_ !== 3 /* Set */ && // Set objects are atomic since they have no keys.
      !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
      const res = finalize(rootScope, childValue, path);
      set(targetObject, prop, res);
      if (isDraft(res)) {
        rootScope.canAutoFreeze_ = false;
      } else
        return;
    } else if (targetIsSet) {
      targetObject.add(childValue);
    }
    if (isDraftable(childValue) && !isFrozen(childValue)) {
      if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
        return;
      }
      finalize(rootScope, childValue);
      if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && Object.prototype.propertyIsEnumerable.call(targetObject, prop))
        maybeFreeze(rootScope, childValue);
    }
  }
  function maybeFreeze(scope, value, deep = false) {
    if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
      freeze(value, deep);
    }
  }

  // src/core/proxy.ts
  function createProxyProxy(base, parent) {
    const isArray = Array.isArray(base);
    const state = {
      type_: isArray ? 1 /* Array */ : 0 /* Object */,
      // Track which produce call this is associated with.
      scope_: parent ? parent.scope_ : getCurrentScope(),
      // True for both shallow and deep changes.
      modified_: false,
      // Used during finalization.
      finalized_: false,
      // Track which properties have been assigned (true) or deleted (false).
      assigned_: {},
      // The parent draft state.
      parent_: parent,
      // The base state.
      base_: base,
      // The base proxy.
      draft_: null,
      // set below
      // The base copy with any updated values.
      copy_: null,
      // Called by the `produce` function.
      revoke_: null,
      isManual_: false
    };
    let target = state;
    let traps = objectTraps;
    if (isArray) {
      target = [state];
      traps = arrayTraps;
    }
    const { revoke, proxy } = Proxy.revocable(target, traps);
    state.draft_ = proxy;
    state.revoke_ = revoke;
    return proxy;
  }
  var objectTraps = {
    get(state, prop) {
      if (prop === DRAFT_STATE)
        return state;
      const source = latest(state);
      if (!has(source, prop)) {
        return readPropFromProto(state, source, prop);
      }
      const value = source[prop];
      if (state.finalized_ || !isDraftable(value)) {
        return value;
      }
      if (value === peek(state.base_, prop)) {
        prepareCopy(state);
        return state.copy_[prop] = createProxy(value, state);
      }
      return value;
    },
    has(state, prop) {
      return prop in latest(state);
    },
    ownKeys(state) {
      return Reflect.ownKeys(latest(state));
    },
    set(state, prop, value) {
      const desc = getDescriptorFromProto(latest(state), prop);
      if (desc?.set) {
        desc.set.call(state.draft_, value);
        return true;
      }
      if (!state.modified_) {
        const current2 = peek(latest(state), prop);
        const currentState = current2?.[DRAFT_STATE];
        if (currentState && currentState.base_ === value) {
          state.copy_[prop] = value;
          state.assigned_[prop] = false;
          return true;
        }
        if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
          return true;
        prepareCopy(state);
        markChanged(state);
      }
      if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
      (value !== void 0 || prop in state.copy_) || // special case: NaN
      Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
        return true;
      state.copy_[prop] = value;
      state.assigned_[prop] = true;
      return true;
    },
    deleteProperty(state, prop) {
      if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
        state.assigned_[prop] = false;
        prepareCopy(state);
        markChanged(state);
      } else {
        delete state.assigned_[prop];
      }
      if (state.copy_) {
        delete state.copy_[prop];
      }
      return true;
    },
    // Note: We never coerce `desc.value` into an Immer draft, because we can't make
    // the same guarantee in ES5 mode.
    getOwnPropertyDescriptor(state, prop) {
      const owner = latest(state);
      const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
      if (!desc)
        return desc;
      return {
        writable: true,
        configurable: state.type_ !== 1 /* Array */ || prop !== "length",
        enumerable: desc.enumerable,
        value: owner[prop]
      };
    },
    defineProperty() {
      die(11);
    },
    getPrototypeOf(state) {
      return getPrototypeOf(state.base_);
    },
    setPrototypeOf() {
      die(12);
    }
  };
  var arrayTraps = {};
  each(objectTraps, (key, fn) => {
    arrayTraps[key] = function() {
      arguments[0] = arguments[0][0];
      return fn.apply(this, arguments);
    };
  });
  arrayTraps.deleteProperty = function(state, prop) {
    return arrayTraps.set.call(this, state, prop, void 0);
  };
  arrayTraps.set = function(state, prop, value) {
    return objectTraps.set.call(this, state[0], prop, value, state[0]);
  };
  function peek(draft, prop) {
    const state = draft[DRAFT_STATE];
    const source = state ? latest(state) : draft;
    return source[prop];
  }
  function readPropFromProto(state, source, prop) {
    const desc = getDescriptorFromProto(source, prop);
    return desc ? `value` in desc ? desc.value : (
      // This is a very special case, if the prop is a getter defined by the
      // prototype, we should invoke it with the draft as context!
      desc.get?.call(state.draft_)
    ) : void 0;
  }
  function getDescriptorFromProto(source, prop) {
    if (!(prop in source))
      return void 0;
    let proto = getPrototypeOf(source);
    while (proto) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (desc)
        return desc;
      proto = getPrototypeOf(proto);
    }
    return void 0;
  }
  function markChanged(state) {
    if (!state.modified_) {
      state.modified_ = true;
      if (state.parent_) {
        markChanged(state.parent_);
      }
    }
  }
  function prepareCopy(state) {
    if (!state.copy_) {
      state.copy_ = shallowCopy(
        state.base_,
        state.scope_.immer_.useStrictShallowCopy_
      );
    }
  }

  // src/core/immerClass.ts
  var Immer2 = class {
    constructor(config) {
      this.autoFreeze_ = true;
      this.useStrictShallowCopy_ = false;
      /**
       * The `produce` function takes a value and a "recipe function" (whose
       * return value often depends on the base state). The recipe function is
       * free to mutate its first argument however it wants. All mutations are
       * only ever applied to a __copy__ of the base state.
       *
       * Pass only a function to create a "curried producer" which relieves you
       * from passing the recipe function every time.
       *
       * Only plain objects and arrays are made mutable. All other objects are
       * considered uncopyable.
       *
       * Note: This function is __bound__ to its `Immer` instance.
       *
       * @param {any} base - the initial state
       * @param {Function} recipe - function that receives a proxy of the base state as first argument and which can be freely modified
       * @param {Function} patchListener - optional function that will be called with all the patches produced here
       * @returns {any} a new state, or the initial state if nothing was modified
       */
      this.produce = (base, recipe, patchListener) => {
        if (typeof base === "function" && typeof recipe !== "function") {
          const defaultBase = recipe;
          recipe = base;
          const self = this;
          return function curriedProduce(base2 = defaultBase, ...args) {
            return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
          };
        }
        if (typeof recipe !== "function")
          die(6);
        if (patchListener !== void 0 && typeof patchListener !== "function")
          die(7);
        let result;
        if (isDraftable(base)) {
          const scope = enterScope(this);
          const proxy = createProxy(base, void 0);
          let hasError = true;
          try {
            result = recipe(proxy);
            hasError = false;
          } finally {
            if (hasError)
              revokeScope(scope);
            else
              leaveScope(scope);
          }
          usePatchesInScope(scope, patchListener);
          return processResult(result, scope);
        } else if (!base || typeof base !== "object") {
          result = recipe(base);
          if (result === void 0)
            result = base;
          if (result === NOTHING)
            result = void 0;
          if (this.autoFreeze_)
            freeze(result, true);
          if (patchListener) {
            const p = [];
            const ip = [];
            getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
            patchListener(p, ip);
          }
          return result;
        } else
          die(1, base);
      };
      this.produceWithPatches = (base, recipe) => {
        if (typeof base === "function") {
          return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
        }
        let patches, inversePatches;
        const result = this.produce(base, recipe, (p, ip) => {
          patches = p;
          inversePatches = ip;
        });
        return [result, patches, inversePatches];
      };
      if (typeof config?.autoFreeze === "boolean")
        this.setAutoFreeze(config.autoFreeze);
      if (typeof config?.useStrictShallowCopy === "boolean")
        this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    }
    createDraft(base) {
      if (!isDraftable(base))
        die(8);
      if (isDraft(base))
        base = current(base);
      const scope = enterScope(this);
      const proxy = createProxy(base, void 0);
      proxy[DRAFT_STATE].isManual_ = true;
      leaveScope(scope);
      return proxy;
    }
    finishDraft(draft, patchListener) {
      const state = draft && draft[DRAFT_STATE];
      if (!state || !state.isManual_)
        die(9);
      const { scope_: scope } = state;
      usePatchesInScope(scope, patchListener);
      return processResult(void 0, scope);
    }
    /**
     * Pass true to automatically freeze all copies created by Immer.
     *
     * By default, auto-freezing is enabled.
     */
    setAutoFreeze(value) {
      this.autoFreeze_ = value;
    }
    /**
     * Pass true to enable strict shallow copy.
     *
     * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
     */
    setUseStrictShallowCopy(value) {
      this.useStrictShallowCopy_ = value;
    }
    applyPatches(base, patches) {
      let i;
      for (i = patches.length - 1; i >= 0; i--) {
        const patch = patches[i];
        if (patch.path.length === 0 && patch.op === "replace") {
          base = patch.value;
          break;
        }
      }
      if (i > -1) {
        patches = patches.slice(i + 1);
      }
      const applyPatchesImpl = getPlugin("Patches").applyPatches_;
      if (isDraft(base)) {
        return applyPatchesImpl(base, patches);
      }
      return this.produce(
        base,
        (draft) => applyPatchesImpl(draft, patches)
      );
    }
  };
  function createProxy(value, parent) {
    const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
    const scope = parent ? parent.scope_ : getCurrentScope();
    scope.drafts_.push(draft);
    return draft;
  }

  // src/core/current.ts
  function current(value) {
    if (!isDraft(value))
      die(10, value);
    return currentImpl(value);
  }
  function currentImpl(value) {
    if (!isDraftable(value) || isFrozen(value))
      return value;
    const state = value[DRAFT_STATE];
    let copy;
    if (state) {
      if (!state.modified_)
        return state.base_;
      state.finalized_ = true;
      copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
    } else {
      copy = shallowCopy(value, true);
    }
    each(copy, (key, childValue) => {
      set(copy, key, currentImpl(childValue));
    });
    if (state) {
      state.finalized_ = false;
    }
    return copy;
  }

  // src/immer.ts
  var immer = new Immer2();
  immer.produce;
  immer.produceWithPatches.bind(
    immer
  );
  var setAutoFreeze = immer.setAutoFreeze.bind(immer);
  immer.setUseStrictShallowCopy.bind(immer);
  immer.applyPatches.bind(immer);
  var createDraft = immer.createDraft.bind(immer);
  var finishDraft = immer.finishDraft.bind(immer);

  /**
   * Fallback handling
   *
   * Defaults to rendering a fallback image with standard chart proportions.
   *
   * @example
   * if (sszvis.fallback.unsupported()) {
   *   sszvis.fallback.render('#sszvis-chart', {src: '../fallback.png', height: 300});
   *   return;
   * }
   *
   * @module sszvis/fallback
   */

  const fallbackUnsupported = function () {
    const supportsSVG = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
    return !supportsSVG;
  };
  const fallbackCanvasUnsupported = function () {
    const supportsCanvas = !!document.createElement("canvas").getContext;
    return !supportsCanvas;
  };
  const fallbackRender = function (selector, options) {
    options || (options = {});
    options.src || (options.src = "fallback.png");
    const selection = isSelection(selector) ? selector : d3.select(selector);
    selection.append("img").attr("class", "sszvis-fallback-image").attr("src", options.src);
  };

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var nanoThrottle = function (callback, ms, trailing) {
    var t = 0, call;
    arguments.length < 3 && (trailing = true);
    return function () {
      var args = arguments;
      var self = this;
      call = function () {
        callback.apply(self, args);
        t = new Date().getTime() + ms;
        call = null;
        trailing && setTimeout(function () {
          call && call();
        }, ms);
      };
      if (new Date().getTime() > t) call();
    }
  };

  var throttle = /*@__PURE__*/getDefaultExportFromCjs(nanoThrottle);

  /**
   * Viewport Resize watcher
   *
   * The resize watcher in the sszvis.viewport module can be used for alerting user code to
   * changes in the browser window size. This includes window resizing on desktop computers
   * and browsers, but also orientation changes on mobile browsers. Functions which listen
   * to the 'resize' event of the sszvis.viewport module will be fired on window resize.
   * You can add a resize listener to your application very easily:
   *
   * sszvis.viewport.on('resize', listenerFunction);
   *
   * The listener function will be called once per resize event, but at a slight delay. This is because,
   * while a user is resizing their browser window, many resize events can fire very quickly. This component
   * automatically throttles the rate at which the listener function is called, since you probably don't need
   * to respond to every single resize event. This throttling provides for a smoother user experience as they
   * resize the browser, and increases performance across the board. The listener function will always be
   * called after one or more window resize events, it just won't be called as often as the window fires the
   * events.
   *
   * @module sszvis/viewport
   *
   * @function {string, function} on      the .on() function is used to listen to the resize event itself.
   *                                      There is only one event supported by this component at the moment, so
   *                                      the first argument to .on must be 'resize' for it to have any effect.
   *                                      Although this is somewhat redundant, it is done to keep this component's
   *                                      API clear and in line with other components.
   *
   * @return {Object}
   */


  // This rather strange set of functions is designed to support the API:
  // sszvis.viewport.on('resize', callback);
  // While still enabling the user to register multiple callbacks for the 'resize'
  // event. Multiple callbacks are a feature which simply returning a d3.dispatch('resize')
  // object would not allow.
  const callbacks = {
    resize: []
  };
  if (typeof window !== "undefined") {
    d3.select(window).on("resize", throttle(() => {
      trigger("resize");
    }, 500));
  }
  const on = function (name, cb) {
    if (!callbacks[name]) {
      callbacks[name] = [];
    }
    callbacks[name] = [...callbacks[name].filter(fn => fn !== cb), cb];
    return this;
  };
  const off = function (name, cb) {
    if (!callbacks[name]) {
      return this;
    }
    callbacks[name] = callbacks[name].filter(fn => fn !== cb);
    return this;
  };
  const trigger = function (name) {
    const evtArgs = Array.prototype.slice.call(arguments, 1);
    if (callbacks[name]) {
      for (const fn of callbacks[name]) {
        fn.apply(null, evtArgs);
      }
    }
    return this;
  };
  const viewport = {
    on,
    off,
    trigger
  };

  // d3 mutates state in many places, which is why we have to turn this off.
  setAutoFreeze(false);

  /**
   * Application loop
   *
   * Creates a stateful app that can be interacted with through actions. By providing
   * a structured approach, this allows us to optimize the render loop and clarifies
   * the relationship between state and actions.
   *
   * Within an app, state can only be modified through actions. During the render phase,
   * state is immutable and an error will be thrown if it is modified accidentally.
   *
   * Conceptually, an app works like this:
   *
   *     init
   *       ⇣
   *     state ⭢ render
   *      ⮤ action ⮠
   *
   * The basis of an app are the following three types:
   *
   * Dispatch can be used to schedule an action after rendering has been completed. In the
   * render function, dispatch is not directly accessible; instead, an actions object is
   * provided to dispatch actions by calling them as functions.
   * @typedef {(action: string, p?: Props) => void} Dispatch
   *
   * An effect can be returned from an action to schedule further actions using dispatch.
   * @typedef {(d: Dispatch, p?: Props) => void} Effect
   *
   * An action receives an Immer.js Draft that can be mutated within the action. If further
   * actions should be called after this one, an action can return an Effect.
   * @typedef {(s: Draft, p?: Props) => Effect | void} Action
   * @see {@link https://immerjs.github.io/immer/docs/produce/}
   *
   * The app can be configured with the following props:
   *
   * @prop {Object} props
   * @prop {(s: Draft) => Promise<Effect | void>} props.init - Asynchronously create
   * the initial state and optionally schedule an action
   * @prop {(s: State, as: Record<keyof props.actions, (p?: Props) => void>)} props.render - Update
   * the DOM from the state and optionally dispatch actions
   * @prop {Record<string, Action>} [props.actions] - Functions to transition the
   * application state
   * @prop {{element: string, src: string}} [props.fallback] - Render a fallback image
   *
   * @module sszvis/app
   */
  const app = _ref => {
    let {
      init,
      render,
      actions = {},
      fallback
    } = _ref;
    let doing;
    let state;
    invariant(isFunction(init), 'An "init" function returning a Promise must be provided.');
    invariant(isFunction(render), 'A "render" function must be provided.');
    const actionDispatchers = Object.keys(actions).reduce((acc, key) => {
      acc[key] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        dispatch(key, args);
      };
      return acc;
    }, {});
    function scheduleUpdate(effect) {
      if (!doing) {
        doing = true;
        requestAnimationFrame(() => {
          render(state, actionDispatchers);
          doing = false;
        });
      }
      if (isFunction(effect)) effect(dispatch);
    }
    function dispatch(action, props) {
      invariant(actions[action] != null, "Action \"".concat(action, "\" is not defined, add it to \"actions\"."));
      const draft = createDraft(state);
      const effect = actions[action](draft, ...props);
      state = finishDraft(draft);
      scheduleUpdate(effect);
    }
    const initialState = createDraft({});
    init(initialState).then(effect => {
      state = finishDraft(initialState);
      scheduleUpdate(effect);
      viewport.on("resize", scheduleUpdate);
    }).catch(error => {
      invariant(false, error);
      fallback && fallbackRender(fallback.element, {
        src: fallback.src
      });
    });
  };

  // -----------------------------------------------------------------------------
  // Helper functions

  function invariant(condition, message) {
    if (!condition) {
      throw new Error("[sszvis.app] ".concat(message));
    }
  }
  function isFunction(x) {
    return typeof x === "function";
  }

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


  /**
   * breakpoint.find
   *
   * Returns the first matching breakpoint for a given measurement
   *
   * @param {Array<Breakpoint>} breakpoints A breakpoint spec
   * @param {Measurement} partialMeasurement A partial measurement to match to the spec
   * @returns {Breakpoint}
   */
  function breakpointFind(breakpoints, partialMeasurement) {
    const measurement = parseMeasurement(partialMeasurement);
    return find(bp => breakpointTest(bp, measurement), breakpoints);
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
  function breakpointFindByName(breakpoints, name) {
    const eqName = function (bp) {
      return bp.name === name;
    };
    return find(eqName, breakpoints);
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
  function breakpointTest(breakpoint, partialMeasurement) {
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
  function breakpointMatch(breakpoints, partialMeasurement) {
    const measurement = parseMeasurement(partialMeasurement);
    return breakpoints.filter(bp => breakpointTest(bp, measurement));
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
  function breakpointCreateSpec(spec) {
    return [...spec.map(parseBreakpoint), parseBreakpoint({
      name: "_"
    })];
  }

  /**
   * breakpoint.defaultSpec
   *
   * @returns {Array<{name: string, width: number, screenHeight: number}>} The SSZVIS
   *          default breakpoint spec.
   */
  const breakpointDefaultSpec = function () {
    const DEFAULT_SPEC = breakpointCreateSpec([{
      name: "palm",
      width: 540
    }, {
      name: "lap",
      width: 749
    }]);
    return function () {
      return DEFAULT_SPEC;
    };
  }();

  // Default tests
  const breakpointPalm = makeTest("palm");
  const breakpointLap = makeTest("lap");

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
    const widthOrInf = propOr("width", Infinity);
    const screenHeightOrInf = propOr("screenHeight", Infinity);
    return {
      width: widthOrInf(partialMeasurement),
      screenHeight: screenHeightOrInf(partialMeasurement)
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
    const measurement = defined(bp.measurement) ? parseMeasurement(bp.measurement) : parseMeasurement({
      width: bp.width,
      screenHeight: bp.screenHeight
    });
    return {
      name: bp.name,
      measurement
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

  /**
   * Functions related to aspect ratio calculations. An "auto" function is
   * provided and should be used in most cases to find the recommended
   * aspect ratio.
   *
   * @module sszvis/aspectRatio
   */


  /**
   * aspectRatio
   *
   * The base module is a function which creates an aspect ratio function.
   * You provide a width and a height of the aspect ratio, and the
   * returned function accepts any width, returning the corresponding
   * height for the aspect ratio you configured.
   *
   * @param {Number} x  The number of parts on the horizontal axis (dividend)
   * @param {Number} y  The number of parts on the vertical axis (divisor)
   * @return {Function} The aspect ratio function. Takes a width as an argument
   *                    and returns the corresponding height based on the
   *                    aspect ratio defined by x:y.
   */
  function aspectRatio(x, y) {
    const ar = x / y;
    return function (width) {
      return width / ar;
    };
  }

  /**
   * aspectRatio4to3
   *
   * Recommended breakpoints:
   *   - palm
   *
   * @param {Number} width
   * @returns {Number} height
   */
  const aspectRatio4to3 = aspectRatio(4, 3);

  /**
   * aspectRatio16to10
   *
   * Recommended breakpoints:
   *   - lap
   *
   * @param {Number} width
   * @returns {Number} height
   */
  const aspectRatio16to10 = aspectRatio(16, 10);

  /**
   * aspectRatio12to5
   *
   * Recommended breakpoints:
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  const AR12TO5_MAX_HEIGHT = 500;
  const aspectRatio12to5 = function (width) {
    return Math.min(aspectRatio(12, 5)(width), AR12TO5_MAX_HEIGHT);
  };
  aspectRatio12to5.MAX_HEIGHT = AR12TO5_MAX_HEIGHT;

  /**
   * aspectRatioSquare
   *
   * This aspect ratio constrains the returned height to a maximum of 420px.
   * It is recommended to center charts within this aspect ratio.
   *
   * Exposes the MAX_HEIGHT used as a property on the function.
   *
   * Recommended breakpoints:
   *   - palm
   *   - lap
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  const SQUARE_MAX_HEIGHT = 420;
  const aspectRatioSquare = function (width) {
    return Math.min(aspectRatio(1, 1)(width), SQUARE_MAX_HEIGHT);
  };
  aspectRatioSquare.MAX_HEIGHT = SQUARE_MAX_HEIGHT;

  /**
   * aspectRatioPortrait
   *
   * This aspect ratio constrains the returned height to a maximum of 600px.
   * It is recommended to center charts within this aspect ratio.
   *
   * Exposes the MAX_HEIGHT used as a property on the function.
   *
   * Recommended breakpoints:
   *   - palm
   *   - lap
   *   - desk
   *
   * @param {Number} width
   * @returns {Number} height
   */
  const PORTRAIT_MAX_HEIGHT = 600;
  const aspectRatioPortrait = function (width) {
    return Math.min(aspectRatio(4, 5)(width), PORTRAIT_MAX_HEIGHT);
  };
  aspectRatioPortrait.MAX_HEIGHT = PORTRAIT_MAX_HEIGHT;

  /**
   * aspectRatioAuto
   *
   * Provides a set of default aspect ratios for different widths. If you provide a set
   * of measurements for a container and the window itself, it will provide the default
   * value of the height for that container. Note that the aspect ratio chosen may
   * depend on the container width itself. This is because of default breakpoints.
   *
   * @param  {Measurement} measurement The measurements object for the container for which you
   *                                   want a height value. Should have at least the properties:
   *                                     - `width`: container's width
   *                                     - `screenHeight`: the height of the window at the current time.
   *
   * @return {Number} The height which corresponds to the default aspect ratio for these measurements
   */
  const defaultAspectRatios = {
    palm: aspectRatio4to3,
    // palm-sized devices
    lap: aspectRatio16to10,
    // lap-sized devices
    _: aspectRatio12to5 // all other cases, including desk
  };
  const aspectRatioAuto = function (measurement) {
    const bp = breakpointFind(breakpointDefaultSpec(), measurement);
    const ar = defaultAspectRatios[bp.name];
    return ar(measurement.width);
  };

  /**
   *
   * @module sszvis/logger
   *
   * A component for logging development messages and errors
   *
   * This is a custom logger which accomplishes two goals: 1) to clearly identify log messages
   * coming from sszvis, and 2) to smooth out cross-browser inconsistencies in the implementation
   * of various console functions.
   *
   * All log messages should be visible in the developer tools Javascript console for your web browser
   * of choice. For more information on how to access browser developer tools, see the browser documentation.
   *
   * The logger provides three log levels. All logging functions can accept any number of arguments of
   * any type.
   *
   * Examples:
   *
   * Logging general information:
   *
   * sszvis.logger.log('Circle coordinates: ', circle.cx, circle.cy, circle.r);
   *
   * Logging a warning:
   *
   * sszvis.logger.warn('Configuration options are incompatible: ', props.config1(), props.config2());
   *
   * Logging an error:
   *
   * sszvis.logger.error('Component X requires the "abc" property');
   *
   * @method {any...} log        The basic log level, used for informational purposes
   * @method {any...} warn       Logs a warning, which identifies a potential, but not critical problem
   *                             or informs the user about certain implementation issues which may or
   *                             may not require user attention.
   * @method {any...} error      Logs an error. This should be used when something has gone wrong in the
   *                             implementation, or when the API is used in an unsupported manner. An
   *                             error logged in this way is different from an uncaught exception, in that
   *                             it does not force an unexpected termination of code execution. Instead,
   *                             when errors are logged, it is because of a known, and noticed issue, and
   *                             the error message should provide some information towards resolving the
   *                             problem, usually by changing the use of the library. The implementation
   *                             will handle the situation gracefully, and not cause an unexpected termination
   *                             of execution.
   */

  const warn = logger("warn");
  const error = logger("error");

  /* Helper functions
  ----------------------------------------------- */
  function logger(type) {
    return function () {
      if (console && console[type]) {
        for (const msg of slice(arguments)) {
          console[type](msg);
        }
      }
    };
  }
  function slice(array) {
    return Array.prototype.slice.call(array);
  }

  /**
   * Scale utilities
   *
   * @module sszvis/scale
   */

  /**
   * Scale range
   *
   * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
   *
   * @param  {array} scale    The scale to be measured
   * @return {array}          The extent of the scale's range. Useful for determining how far
   *                          a scale stretches in its output dimension.
   */
  const range = function (scale) {
    // borrowed from d3 source - svg.axis
    return scale.rangeExtent ? scale.rangeExtent() : extent(scale.range());
  };

  /**
   * Helper function
   * Extent
   *
   * Used to determine the extent of an array. Mimics a function found in d3 source code.
   *
   * @param  {array} domain     an array, sorted in either ascending or descending order
   * @return {array}            the extent of the array, with the smaller term first.
   */
  function extent(domain) {
    // borrowed from d3 source - svg.axis
    const start = domain[0],
      stop = domain[domain.length - 1];
    return start < stop ? [start, stop] : [stop, start];
  }

  /**
   * Text wrap
   *
   * Function allowing to 'wrap' the text from an SVG <text> element with <tspan>.
   *
   * @module sszvis/svgUtils/textWrap
   *
   * Based on https://github.com/mbostock/d3/issues/1642
   * @example svg.append("g")
   *      .attr("class", "x axis")
   *      .attr("transform", "translate(0," + height + ")")
   *      .call(xAxis)
   *      .selectAll(".tick text")
   *          .call(d3TextWrap, x.rangeBand());
   *
   * @param text d3 selection for one or more <text> object
   * @param width number - global width in which the text will be word-wrapped.
   * @param paddingRightLeft integer - Padding right and left between the wrapped text and the 'invisible bax' of 'width' width
   * @param paddingTopBottom integer - Padding top and bottom between the wrapped text and the 'invisible bax' of 'width' width
   * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
   */

  function textWrap (selection, width, paddingRightLeft, paddingTopBottom) {
    paddingRightLeft = paddingRightLeft || 5; //Default padding (5px)
    paddingTopBottom = (paddingTopBottom || 5) - 2; //Default padding (5px), remove 2 pixels because of the borders
    const maxWidth = width; //I store the tooltip max width
    width = width - paddingRightLeft * 2; //Take the padding into account

    const arrLineCreatedCount = [];
    selection.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/[\t\n\v\f\r ]+/).reverse(); //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; //Em
      let x;
      let y = text.attr("y");
      let dy = Number.parseFloat(text.attr("dy"));
      let createdLineCount = 1; //Total line created count
      const textAlign = text.style("text-anchor") || "start"; //'start' by default (start, middle, end, inherit)

      //Clean the data in case <text> does not define those values
      if (isNaN(dy)) dy = 0; //Default padding (0em) : the 'dy' attribute on the first <tspan> _must_ be identical to the 'dy' specified on the <text> element, or start at '0em' if undefined

      //Offset the text position based on the text-anchor
      const wrapTickLabels = d3.select(text.node().parentNode).classed("tick"); //Don't wrap the 'normal untranslated' <text> element and the translated <g class='tick'><text></text></g> elements the same way..
      if (wrapTickLabels) {
        switch (textAlign) {
          case "start":
            {
              x = -width / 2;
              break;
            }
          case "middle":
            {
              x = 0;
              break;
            }
          case "end":
            {
              x = width / 2;
              break;
            }
        }
      } else {
        //untranslated <text> elements
        switch (textAlign) {
          case "start":
            {
              x = paddingRightLeft;
              break;
            }
          case "middle":
            {
              x = maxWidth / 2;
              break;
            }
          case "end":
            {
              x = maxWidth - paddingRightLeft;
              break;
            }
        }
      }
      y = +(null === y ? paddingTopBottom : y);
      let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (words.length > 0) {
        word = words.pop();
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          ++createdLineCount;
        }
      }
      arrLineCreatedCount.push(createdLineCount); //Store the line count in the array
    });
    return arrLineCreatedCount;
  }

  /**
   * Axis component
   *
   * This component is an extension of d3.axis and provides the same interface
   * with some custom additions. It provides good defaults for sszvis charts
   * and helps with some commonly used functionality.
   *
   * @module sszvis/axis
   *
   * The following properties are directly delegated to the d3.axis component.
   * They are documented in the d3 documentation.
   * @see https://github.com/mbostock/d3/wiki/SVG-Axes
   *
   * @property {function} scale         Delegates to d3.axis
   * @property {function} orient        Delegates to d3.axis
   * @property {function} ticks         Delegates to d3.axis
   * @property {function} tickValues    Delegates to d3.axis
   * @property {function} tickSize      Delegates to d3.axis
   * @property {function} innerTickSize Delegates to d3.axis
   * @property {function} outerTickSize Delegates to d3.axis
   * @property {function} tickPadding   Delegates to d3.axis
   * @property {function} tickFormat    Delegates to d3.axis
   *
   * The following properties are custom additions.
   *
   * @property {boolean} alignOuterLabels                 Whether or not to align the outer labels to the axis extent so that they do not fall outside the axis space.
   * @property {boolean} contour                          Specify a 'contour' background for the axis labels.
   * @property {number} hideBorderTickThreshold           Specifies the pixel distance threshold for the visible tick correction. Ticks which are closer than
   *                                                      this threshold to the end of the axis (i.e. a tick which is 1 or two pixels from the end) will be
   *                                                      hidden from view. This prevents the display of a tick very close to the ending line.
   * @property {number} hideLabelThreshold                By default, labels are hidden when they are closer than LABEL_PROXIMITY_THRESHOLD to a highlighted label.
   *                                                      If this value is set to 0 or lower, labels won't be hidden, even if they overlap with the highlighted label.
   * @property {function} highlightTick                   Specifies a predicate function to use to determine whether axis ticks should be highlighted.
   *                                                      Any tick value which returns true for this predicate function will be treated specially as a highlighted tick.
   *                                                      Note that this function does NOT have any effect over which ticks are actually included on the axis. To create special
   *                                                      custom ticks, use tickValues.
   * @property {boolean} showZeroY                        Whether the axis should display a label for at y=0.
   * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
   *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
   *                                                      Use "horizontal" to reset to a horizontal slant.
   * @property {number} textWrap                          Specify a width at which to wrap the axis label text.
   * @property {number, function} tickLength              specify a number or a function which returns a number for setting the tick length.
   * @property {string} title                             Specify a string to use as the title of this chart. Default title position depends on the chart orientation
   * @property {string} titleAnchor                       specify the title text-anchor. Values are 'start', 'middle', and 'end'. Corresponds to the 'text-anchor' svg styling attribute
   *                                                      the default depends on the axis orient property
   * @property {boolean} titleCenter                      whether or not to center the axis title along the axis. If true, this sets the title anchor point
   *                                                      as the midpoint between axis extremes. Should usually be used with titleAnchor('middle') to ensure exact title centering. (default: false)
   * @property {number} dxTitle                           specify an amount by which to offset the title towards the left. This offsets away from the default position. (default: 0)
   * @property {number} dyTitle                           specify an amount by which to offset the title towards the top. This offsets away from the default position. (default: 0)
   * @property {boolean} titleVertical                    whether or not to rotate the title 90 degrees so that it appears vertical, reading from bottom to top. (default: false)
   * @property {boolean} vertical                         whether the axis is a vertical axis. When true, this property changes certain display properties of the axis according to the style guide.
   *
   * @return {sszvis.component}
   */

  const TICK_PROXIMITY_THRESHOLD = 8;
  const TICK_END_THRESHOLD = 12;
  const LABEL_PROXIMITY_THRESHOLD = 10;
  const axis = function () {
    // const axisDelegate = d3.axisBottom();
    // axisDelegate.orient = function() { return 'bottom'; };

    // axisComponent.__delegate__ = axisDelegate;

    return component().prop("scale").prop("orient").prop("ticks").prop("tickValues").prop("tickSize").prop("tickSizeInner").prop("tickSizeOuter").prop("tickPadding").prop("tickFormat").prop("_scale").prop("orient").orient("bottom").prop("alignOuterLabels").alignOuterLabels(false).prop("contour").prop("hideBorderTickThreshold").hideBorderTickThreshold(TICK_PROXIMITY_THRESHOLD).prop("hideLabelThreshold").hideLabelThreshold(LABEL_PROXIMITY_THRESHOLD).prop("highlightTick", functor).prop("showZeroY").showZeroY(false).prop("slant").prop("textWrap").prop("tickLength").prop("title").prop("titleAnchor") // start, end, or middle
    .prop("titleCenter") // a boolean value - whether to center the title
    .prop("dxTitle") // a numeric value for the left offset of the title
    .prop("dyTitle") // a numeric value for the top offset of the title
    .prop("titleVertical").prop("vertical").vertical(false)
    //this property is typically used for the x-axis, but not for the y axis
    //it creates a gap between chart and x-axis by offsetting the the chart by a number of pixels
    .prop("yOffset").yOffset(0).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const isBottom = !props.vertical && props.orient === "bottom";
      const axisDelegate = function () {
        switch (props.orient) {
          case "bottom":
            {
              return d3.axisBottom();
            }
          case "top":
            {
              return d3.axisTop();
            }
          case "left":
            {
              return d3.axisLeft();
            }
          case "right":
            {
              return d3.axisRight();
            }
        }
      }();
      for (const prop of ["scale", "ticks", "tickValues", "tickSizeInner", "tickSizeOuter", "tickPadding", "tickFormat", "tickSize"]) {
        if (props[prop] !== undefined) {
          if (axisDelegate[prop] === undefined) {
            throw new Error('axis: "' + prop + '" not available');
          }
          axisDelegate[prop](props[prop]);
        }
      }
      if (props._scale) {
        axisDelegate.scale(props._scale);
      }
      const group = selection.selectGroup("sszvis-axis").classed("sszvis-axis", true).classed("sszvis-axis--top", !props.vertical && props.orient === "top").classed("sszvis-axis--bottom", isBottom).classed("sszvis-axis--vertical", props.vertical).attr("transform", translateString(0, props.yOffset)).call(axisDelegate);
      group.attr("fill", null).attr("font-size", null).attr("font-family", null);
      // .attr("text-anchor", null);

      const axisScale = axisDelegate.scale();

      // Create selections here which will be used later for many custom configurations
      // Note: Inconstiant: This is only valid so long as new .tick groups or tick label texts
      // are not being added after these selections are constructed. If that changes, these
      // selections need to be re-constructed.
      const tickGroups = group.selectAll("g.tick");
      const tickTexts = tickGroups.selectAll("text");

      // To prevent anti-aliasing on elements that need to be rendered crisply
      // we need to position them on a half-pixel grid: 0.5, 1.5, 2.5, etc.
      // We can't translate the whole .tick group, however, because this
      // leads to weird type rendering artefacts in some browsers. That's
      // why we reach into the group and translate lines onto the half-pixel
      // grid by taking the translation of the group into account.
      tickGroups.each(function () {
        const subpixelShift = transformTranslateSubpixelShift(this.getAttribute("transform"));
        const dx = halfPixel(0) - subpixelShift[0];
        const dy = halfPixel(isBottom ? 2 : 0) + subpixelShift[1];
        d3.select(this).select("line").attr("transform", translateString(dx, dy));
      });
      tickTexts.each(function () {
        if (props.orient === "top" || props.orient === "bottom") {
          d3.select(this).attr("dx", "-0.5");
        }
        if (props.orient === "left" || props.orient === "right") {
          d3.select(this).attr("y", "-0.5");
        }
      });

      // Place axis line on a half-pixel grid to prevent anti-aliasing
      group.selectAll("path.domain");
      // .attr('transform', translateString(halfPixel(0), halfPixel(0)));

      // hide ticks which are too close to one endpoint
      const rangeExtent = range(axisScale);
      tickGroups.selectAll("line").each(function (d) {
        const pos = axisScale(d),
          d3this = d3.select(this);
        d3this.classed("hidden", !d3this.classed("sszvis-axis__longtick") && (absDistance(pos, rangeExtent[0]) < props.hideBorderTickThreshold || absDistance(pos, rangeExtent[1]) < props.hideBorderTickThreshold));
      });
      if (defined(props.tickLength)) {
        const domainExtent = d3.extent(axisScale.domain());
        const ticks = tickGroups.filter(d => !stringEqual(d, domainExtent[0]) && !stringEqual(d, domainExtent[1]));
        const orientation = props.orient;
        let longLinePadding = 2;
        if (orientation === "left" || orientation === "right") {
          ticks.selectAll("text").each(function () {
            longLinePadding = Math.max(this.getBoundingClientRect().width, longLinePadding);
          });
          longLinePadding += 2; // a lil' extra on the end
        }
        const lines = ticks.selectAll("line.sszvis-axis__longtick").data([0]).join("line").classed("sszvis-axis__longtick", true);
        if (props.tickLength > longLinePadding) {
          switch (orientation) {
            case "top":
              {
                lines.attr("y1", longLinePadding).attr("y2", props.tickLength);
                break;
              }
            case "bottom":
              {
                lines.attr("y1", -longLinePadding).attr("y2", -props.tickLength);
                break;
              }
            case "left":
              {
                lines.attr("x1", -longLinePadding).attr("x2", -props.tickLength);
                break;
              }
            case "right":
              {
                lines.attr("x1", longLinePadding).attr("x2", props.tickLength);
                break;
              }
            // No default
          }
        } else {
          lines.remove();
        }
      }
      if (props.alignOuterLabels) {
        const alignmentBounds = range(axisScale);
        const min = alignmentBounds[0];
        const max = alignmentBounds[1];
        tickTexts.style("text-anchor", d => {
          const value = axisScale(d);
          if (absDistance(value, min) < TICK_END_THRESHOLD) {
            return "start";
          } else if (absDistance(value, max) < TICK_END_THRESHOLD) {
            return "end";
          }
          return "middle";
        });
      }
      if (defined(props.textWrap)) {
        tickTexts.call(textWrap, props.textWrap);
      }
      if (props.slant) {
        tickTexts.call(slantLabel[props.orient][props.slant]);
      }

      // Highlight axis labels that return true for props.highlightTick.
      if (props.highlightTick) {
        const activeBounds = [];
        const passiveBounds = [];
        tickTexts.classed("hidden", false).classed("active", props.highlightTick);

        // Hide axis labels that overlap with highlighted labels unless
        // the labels are slanted (in which case the bounding boxes overlap)
        if (props.hideLabelThreshold > 0 && !props.slant) {
          tickTexts.each(function (d) {
            // although getBoundingClientRect returns coordinates relative to the window, not the document,
            // this should still work, since all tick bounds are affected equally by scroll position changes.
            const bcr = this.getBoundingClientRect();
            const b = {
              node: this,
              bounds: {
                top: bcr.top,
                right: bcr.right,
                bottom: bcr.bottom,
                left: bcr.left
              }
            };
            if (props.highlightTick(d)) {
              b.bounds.left -= props.hideLabelThreshold;
              b.bounds.right += props.hideLabelThreshold;
              activeBounds.push(b);
            } else {
              passiveBounds.push(b);
            }
          });
          for (const active of activeBounds) {
            for (const passive of passiveBounds) {
              d3.select(passive.node).classed("hidden", boundsOverlap(passive.bounds, active.bounds));
            }
          }
        }
      }
      if (props.title) {
        const title = group.selectAll(".sszvis-axis__title").data([props.title]).join("text").classed("sszvis-axis__title", true);
        title.text(d => d).attr("transform", () => {
          const orient = props.orient,
            axisScaleExtent = range(axisScale);
          const titleProps = props.titleCenter ? {
            left: orient === "left" || orient === "right" ? 0 : orient === "top" || orient === "bottom" ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2 : 0,
            top: orient === "left" || orient === "right" ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2 : orient === "top" ? 0 : orient === "bottom" ? 32 : 0
          } : {
            left: orient === "left" || orient === "right" || orient === "top" ? 0 : orient === "bottom" ? axisScaleExtent[1] : 0,
            top: orient === "left" || orient === "right" || orient === "top" ? 0 : orient === "bottom" ? 32 : 0
          };
          titleProps.vertical = !!props.titleVertical;
          titleProps.left += props.dxTitle || 0;
          titleProps.top += props.dyTitle || 0;
          return "translate(" + titleProps.left + ", " + titleProps.top + ") rotate(" + (titleProps.vertical ? "-90" : "0") + ")";
        }).style("text-anchor", () => {
          const orient = props.orient;
          if (props.titleAnchor === undefined) {
            switch (orient) {
              case "left":
                {
                  return "end";
                }
              case "right":
                {
                  return "start";
                }
              case "top":
              case "bottom":
                {
                  return "end";
                }
              // No default
            }
          } else {
            return props.titleAnchor;
          }
        });
      }

      /**
       * Add a background to axis labels to make them more readable on
       * colored backgrounds
       */
      if (props.contour && props.slant) {
        warn("Can't apply contour to slanted labels");
      } else if (props.contour) {
        tickGroups.each(function () {
          const g = d3.select(this);
          const textNode = g.select("text").node();
          let textContour = g.select(".sszvis-axis__label-contour");
          if (textContour.empty()) {
            textContour = d3.select(textNode.cloneNode()).classed("sszvis-axis__label-contour", true);
            this.insertBefore(textContour.node(), textNode);
          }
          textContour.text(textNode.textContent);
        });
      }
    });
  };
  const setOrdinalTicks = function (count) {
    // in this function, the 'this' context should be an sszvis.axis
    const domain = this.scale().domain(),
      values = [],
      step = Math.round(domain.length / count);

    // include the first value
    if (domain[0] !== undefined) values.push(domain[0]);
    for (let i = step, l = domain.length; i < l - 1; i += step) {
      if (domain[i] !== undefined) values.push(domain[i]);
    }
    // include the last value
    if (domain[domain.length - 1] !== "undefined") values.push(domain[domain.length - 1]);
    this.tickValues(values);
    return count;
  };
  const axisX = function () {
    return axis().yOffset(2) //gap between chart and x-axis
    .ticks(3).tickSizeInner(4).tickSizeOuter(6.5).tickPadding(6).tickFormat(arity(1, formatNumber));
  };
  axisX.time = function () {
    return axisX().tickFormat(formatAxisTimeFormat).alignOuterLabels(true);
  };
  axisX.ordinal = function () {
    return axisX()
    // extend this class a little with a custom implementation of 'ticks'
    // that allows you to set a custom number of ticks,
    // including the first and last value in the ordinal scale
    .prop("ticks", setOrdinalTicks).tickFormat(formatText);
  };

  // need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
  axisX.pyramid = function () {
    return axisX().ticks(10).prop("scale", function (s) {
      const extended = s.copy(),
        extendedDomain = extended.domain(),
        extendedRange = extended.range();
      extended
      // the domain is mirrored - ±domain[1]
      .domain([-extendedDomain[1], extendedDomain[1]])
      // the range is mirrored – ±range[1]
      .range([extendedRange[0] - extendedRange[1], extendedRange[0] + extendedRange[1]]);
      this._scale(extended);
      return extended;
    }).tickFormat(v =>
    // this tick format means that the axis appears to be divergent around 0
    // when in fact it is -domain[1] -> +domain[1]
    formatNumber(Math.abs(v)));
  };
  const axisY = function () {
    const newAxis = axis().ticks(6).tickSize(0, 0).tickPadding(0).tickFormat(d => 0 === d && !newAxis.showZeroY() ? null : formatNumber(d)).vertical(true);
    return newAxis;
  };
  axisY.time = function () {
    return axisY().tickFormat(formatAxisTimeFormat);
  };
  axisY.ordinal = function () {
    return axisY()
    // add custom 'ticks' function
    .prop("ticks", setOrdinalTicks).tickFormat(formatText);
  };

  /* Helper functions
  ----------------------------------------------- */

  function absDistance(a, b) {
    return Math.abs(a - b);
  }
  function boundsOverlap(boundsA, boundsB) {
    return !(boundsB.left > boundsA.right || boundsB.right < boundsA.left || boundsB.top > boundsA.bottom || boundsB.bottom < boundsA.top);
  }
  const slantLabel = {
    top: {
      horizontal(selection) {
        selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
      },
      vertical(selection) {
        selection.style("text-anchor", "start").attr("dx", "0em").attr("dy", "0.35em") // vertically-center
        .attr("transform", "rotate(-90)");
      },
      diagonal(selection) {
        selection.style("text-anchor", "start").attr("dx", "0.1em").attr("dy", "0.1em").attr("transform", "translate(-0.5) rotate(-45)");
      }
    },
    bottom: {
      horizontal(selection) {
        selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
      },
      vertical(selection) {
        selection.style("text-anchor", "end").attr("dx", "-1em").attr("dy", "-0.75em").attr("transform", "rotate(-90)");
      },
      diagonal(selection) {
        selection.style("text-anchor", "end").attr("dx", "-0.8em").attr("dy", "0em").attr("transform", "rotate(-45)");
      }
    }
  };

  /**
   * Move behavior
   *
   * The move behavior is used to add a mouseover and touchmove-based interface to a chart.
   *
   * Like other behavior components, this behavior adds an invisible layer over the chart,
   * which the users interact with using touch or mouse actions. The behavior component then interprets
   * these interactions, and calls the relevant event handler callback functions. These callback functions are
   * passed values which represent data-space information about the nature of the interaction.
   * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
   *
   * The move behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
   * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
   * functions. This component extends a d3.dispatch instance.
   *
   * @module sszvis/behavior/move
   *
   * @property {boolean} debug                      Whether or not to render the component in debug mode, which reveals its position in the chart.
   * @property {function} xScale                    The x-scale for the component. The extent of this scale, plus component padding, is the width of the
   *                                                component's active area.
   * @property {function} yScale                    The y-scale for the component. The extent of this scale, plus component padding, is the height of the
   *                                                component's active area.
   * @property {boolean} draggable                  Whether or not this component is draggable. This changes certain display properties of the component.
   * @property {object} padding                     An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
   *                                                The options are { top, right, bottom, left }
   * @property {boolean|function} cancelScrolling   A predicate function, or a constant boolean, that determines whether the browser's default scrolling
   *                                                behavior in response to a touch event should be canceled. In area charts and line charts, for example,
   *                                                you generally don't want to cancel scrolling, as this creates a scroll trap. However, in bar charts
   *                                                which use this behavior, you want to pass a predicate function here which will determine whether the touch
   *                                                event falls within the "profile" of the bar chart, and should therefore cancel scrolling and trigger an event.
   * @property {boolean} fireOnPanOnly              In response to touch events, whether to fire events only while "panning", that is only while performing
   *                                                a touch move where the default scrolling behavior is canceled, and not otherwise. In area and line charts, this
   *                                                should be false, since you want to fire events all the time, even while scrolling. In bar charts, we want to
   *                                                limit the firing of events (and therefore, the showing of tooltips) to only cases where the touch event has its
   *                                                default scrolling prevented, and the user is therefore "panning" across bars. So this should be true for bar charts.
   * @property {string and function} on             The .on() method of this component should specify an event name and an event handler function.
   *                                                Possible event names are:
   *                                                'start' - when the move action starts - mouseover or touchstart
   *                                                'move' - called when a 'moving' action happens - mouseover on the element
   *                                                'drag' - called when a 'dragging' action happens - mouseover with the mouse click down, or touchmove
   *                                                'end' - called when the event ends - mouseout or touchend
   *                                                Event handler functions, excepting end, are passed an x-value and a y-value, which are the data values,
   *                                                computed by inverting the provided xScale and yScale, which correspond to the screen pixel location of the event.
   *
   * @return {sszvis.component}
   */

  function move () {
    const event = d3.dispatch("start", "move", "drag", "end");
    const moveComponent = component().prop("debug").prop("xScale").prop("yScale").prop("draggable").prop("cancelScrolling", functor).cancelScrolling(false).prop("fireOnPanOnly", functor).fireOnPanOnly(false).prop("padding", p => {
      const defaults = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      };
      for (const prop in p) {
        defaults[prop] = p[prop];
      }
      return defaults;
    }).padding({}).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const xExtent = range(props.xScale).sort(d3.ascending);
      const yExtent = range(props.yScale).sort(d3.ascending);
      xExtent[0] -= props.padding.left;
      xExtent[1] += props.padding.right;
      yExtent[0] -= props.padding.top;
      yExtent[1] += props.padding.bottom;
      const layer = selection.selectAll("[data-sszvis-behavior-move]").data([0]).join("rect").attr("data-sszvis-behavior-move", "").attr("class", "sszvis-interactive");
      if (props.draggable) {
        layer.classed("sszvis-interactive--draggable", true);
      }
      layer.attr("x", xExtent[0]).attr("y", yExtent[0]).attr("width", xExtent[1] - xExtent[0]).attr("height", yExtent[1] - yExtent[0]).attr("fill", "transparent").on("mouseover", function () {
        event.apply("start", this, arguments);
      }).on("mousedown", function (e) {
        const target = this;
        const doc = d3.select(document);
        const win = d3.select(window);
        const startDragging = function () {
          target.__dragging__ = true;
        };
        const stopDragging = function () {
          target.__dragging__ = false;
          win.on("mousemove.sszvis-behavior-move", null);
          doc.on("mouseout.sszvis-behavior-move", null);
          event.apply("end", this, arguments);
        };
        win.on("mouseup.sszvis-behavior-move", stopDragging);
        doc.on("mouseout.sszvis-behavior-move", () => {
          const from = e.relatedTarget || e.toElement;
          if (!from || from.nodeName === "HTML") {
            stopDragging();
          }
        });
        startDragging();
      }).on("mousemove", function (e) {
        const target = this;
        const xy = d3.pointer(e);
        const x = scaleInvert(props.xScale, xy[0]);
        const y = scaleInvert(props.yScale, xy[1]);
        if (target.__dragging__) {
          event.apply("drag", this, [e, x, y]);
        } else {
          event.apply("move", this, [e, x, y]);
        }
      }).on("mouseout", function (e) {
        event.apply("end", this, [e]);
      }).on("touchstart", function (e) {
        const xy = first(d3.pointer(e));
        const x = scaleInvert(props.xScale, xy[0]);
        const y = scaleInvert(props.yScale, xy[1]);
        const cancelScrolling = props.cancelScrolling(x, y);
        if (cancelScrolling) {
          e.preventDefault();
        }

        // if fireOnPanOnly => cancelScrolling must be true
        // if !fireOnPanOnly => always fire events
        // This is in place because this behavior needs to only fire
        // events on a successful "pan" action in the bar charts, i.e.
        // only when scrolling is prevented, but then it also needs to fire
        // events all the time in the line and area charts, i.e. allow
        // scrolling to continue as normal but also fire events.
        // To configure the chart for use in the bar charts, you need
        // to configure a cancelScrolling function for determining when to
        // cancel scrolling, i.e. what constitutes a "pan" event, and also
        // pass fireOnPanOnly = true, which flips this switch and relies on
        // cancelScrolling to determine whether to fire the events.
        if (!props.fireOnPanOnly() || cancelScrolling) {
          event.apply("start", this, [e, x, y]);
          event.apply("drag", this, [e, x, y]);
          event.apply("move", this, [e, x, y]);
          const pan = function () {
            const panXY = first(d3.pointer(e));
            const panX = scaleInvert(props.xScale, panXY[0]);
            const panY = scaleInvert(props.yScale, panXY[1]);
            const panCancelScrolling = props.cancelScrolling(panX, panY);
            if (panCancelScrolling) {
              e.preventDefault();
            }

            // See comment above about the same if condition.
            if (!props.fireOnPanOnly() || panCancelScrolling) {
              event.apply("drag", this, [e, panX, panY]);
              event.apply("move", this, [e, panX, panY]);
            } else {
              event.apply("end", this, [e]);
            }
          };
          const end = function () {
            event.apply("end", this, [e]);
            d3.select(this).on("touchmove", null).on("touchend", null);
          };
          d3.select(this).on("touchmove", pan).on("touchend", end);
        }
      });
      if (props.debug) {
        layer.attr("fill", "rgba(255,0,0,0.2)");
      }
    });
    moveComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? moveComponent : value;
    };
    return moveComponent;
  }
  function scaleInvert(scale, px) {
    const scaleType = scale.invert ? "Linear" : scale.paddingInner ? "Band" : "Point";
    switch (scaleType) {
      case "Linear":
        {
          return scale.invert(px);
        }
      case "Band":
        {
          return invertBandScale(scale, px);
        }
      case "Point":
        {
          return invertPointScale(scale, px);
        }
      default:
        {
          throw new Error("Unknown scale type, could not invert");
        }
    }
  }
  function invertBandScale(scale, px) {
    const step = scale.step();
    const paddingOuter = scale.paddingOuter() * step;
    const paddingInner = scale.paddingInner() * step;
    const bandWidth = scale.bandwidth();
    const scaleRange = scale.range();
    const domain = scale.domain();
    if (domain.length === 1) {
      if (scaleRange[0] <= px && scaleRange[1] >= px) {
        return domain[0];
      }
      return null;
    }
    const ranges = domain.map((d, i) => {
      if (i === 0) {
        return [scaleRange[0], scaleRange[0] + paddingOuter + bandWidth + paddingInner / 2];
      } else if (i === domain.length - 1) {
        return [scaleRange[1] - (paddingOuter + bandWidth + paddingInner / 2), scaleRange[1]];
      } else {
        return [scaleRange[0] + paddingOuter + i * step - paddingInner / 2, scaleRange[0] + paddingOuter + (i + 1) * step - paddingInner / 2];
      }
    });
    for (let i = 0, l = ranges.length; i < l; i++) {
      if (ranges[i][0] < px && px <= ranges[i][1]) {
        return domain[i];
      }
    }
    return null;
  }
  function invertPointScale(scale, px) {
    const step = scale.step();
    const paddingOuter = scale.padding() * step;
    const scaleRange = scale.range();
    const domain = scale.domain();
    if (domain.length === 1) {
      if (scaleRange[0] <= px && scaleRange[1] >= px) {
        return domain[0];
      }
      return null;
    }
    const ranges = domain.map((d, i) => {
      if (i === 0) {
        return [scaleRange[0], scaleRange[0] + paddingOuter + step / 2];
      } else if (i === domain.length - 1) {
        return [scaleRange[1] - (paddingOuter + step / 2), scaleRange[1]];
      } else {
        return [scaleRange[0] + paddingOuter + i * step - step / 2, scaleRange[0] + paddingOuter + i * step + step / 2];
      }
    });
    for (let i = 0, l = ranges.length; i < l; i++) {
      if (ranges[i][0] < px && px <= ranges[i][1]) {
        return domain[i];
      }
    }
    return null;
  }

  /**
   * Behavior utilities
   *
   * These utilities are intended for internal usage by the sszvis.behavior components.
   * They aren't intended for use in example code, but should be in a separate module
   * because they are accessed by several different behavior components.
   *
   * @function {Event} elementFromEvent             Accepts an event, and returns the element, if any,
   *                                                which is in the document under that event. Uses
   *                                                document.elementFromPoint to determine the element.
   *                                                If there is no such element, or the event is invalid,
   *                                                this function will return null.
   * @function {Element} datumFromPannableElement   Accepts an element, determines if it's "pannable",
   *                                                and returns the datum, if any, attached to this element.
   *                                                This is determined by the presence of the data-sszvis-behavior-pannable
   *                                                attribute on the element. Behaviors which use "panning" behavior
   *                                                will attach this attribute to the elements they target.
   *                                                Elements which have panning behaviors attached to them
   *                                                will get this attribute assigned to them. If the element doesn't
   *                                                have this attriute, or doesn't have a datum assigned, this funciton
   *                                                returns null.
   * @function {Event} datumFromPanEvent            A combination of elementFromEvent and datumFromPannableElement, which
   *                                                accepts an event and returns the datum attached to the element under
   *                                                that event, if such an element and such a datum exists.
   * @function {Number, Object, Function, Number} testBarThreshold        This function is a convenience function for encapsulating
   *                                                                      the test which should be performed on a touch interaction,
   *                                                                      to see whether the touch falls within the "profile" of a bar
   *                                                                      chart. If so, that is, if the test passes, then scrolling should
   *                                                                      be prevented on the bar charts, and a tooltip should be shown.
   *                                                                      This is the behavior known as "panning" over the surface of the chart,
   *                                                                      while on a mobile device. The function returns true if the touch is
   *                                                                      considered to be within the "profile" of the bar chart, and false otherwise.
   *                                                                      The function takes four arguments:
   *                                                                        cursorValue - This the value, specified in the same units as the original
   *                                                                                      data, at the touch event's position. This value is
   *                                                                                      automatically calculated by the 'move' behavior,
   *                                                                                      by inverting the scale used for the bar charts' extent.
   *                                                                        datum -       This is the data value at the touch event's position,
   *                                                                                      against which you are comparing the profile. Since data
   *                                                                                      values all live in user-land, you should retrieve this
   *                                                                                      datum yourself. Usually this can be done by using the
   *                                                                                      inverted value from the other axis of the bar chart,
   *                                                                                      and searching the data for the datum which matches that
   *                                                                                      value. However, note that the datum argument can be
   *                                                                                      undefined, in which case the touch is considered invalid and
   *                                                                                      the test will return false.
   *                                                                        accessor -    This is an accessor function for retrieving a numeric value
   *                                                                                      from the datum. This function should be used to retrieve out
   *                                                                                      of the datum the value against which cursorValue is compared.
   *                                                                        threshold -   A small threshold, specified in datum units, i.e. in the units
   *                                                                                      of the domain (NOT the range) of the scale function. When a bar
   *                                                                                      value is very small, or 0, or NaN, it would be impossible to have
   *                                                                                      a touch which is over the "profile" of this bar. So in those cases,
   *                                                                                      we consider the touch to be within the profile if it and the data
   *                                                                                      value are under this threshold. This number should be some small
   *                                                                                      number in the data's domain, and will be compared against both
   *                                                                                      cursorValue and the value accessed from the datum.
   */

  const elementFromEvent = function (evt) {
    if (!isNull(evt) && defined(evt)) {
      return document.elementFromPoint(evt.clientX, evt.clientY);
    }
    return null;
  };
  const datumFromPannableElement = function (element) {
    if (!isNull(element)) {
      const selection = d3.select(element);
      if (!isNull(selection.attr("data-sszvis-behavior-pannable"))) {
        const datum = selection.datum();
        if (defined(datum)) {
          return datum;
        }
      }
    }
    return null;
  };
  const datumFromPanEvent = function (evt) {
    return datumFromPannableElement(elementFromEvent(evt));
  };

  /**
   * Panning behavior
   *
   * This behavior is used for adding "panning" functionality to a set of chart elements.
   * The "panning" functionality refers to a combination of mouseover and touch responsiveness,
   * where on a mouse interaction an event is fired on hover, but the touch interaction is more
   * complex. The idea is to sort of imitate the way a hover interaction works, but with only a
   * finger. When a user starts a touch on an element which has this behavior enabled, the
   * default scrolling behavior of the browser will be canceled. The user can then move
   * their finger across the surface of the screen, onto other elements, and the scroll
   * will be canceled. When the finger moves onto other elements with this behavior attached,
   * the event will be fired. Meanwhile, if the user starts the interaction somewhere outside
   * an element, the scroll will happen as usual, and if they move onto an activated element,
   * no event will be fired and the scrolling will continue.
   *
   * This behavior is applied to all the children of a selection which match the elementSelector
   * property. Event listeners are attached to each of the child elements. The elementSelector
   * property is necessary to know which elements to attach to (and therefore to also avoid
   * attaching event listeners to elements which shouldn't be interaction-active).
   *
   * @module sszvis/behavior/panning
   *
   * @property {String} elementSelector    This should be a string selector that matches child
   *                                       elements of the selection on which this component
   *                                       is rendered using the .call(component) pattern. All
   *                                       child elements will have the panning event listeners
   *                                       attached to them.
   * @property {String, Function} on       The .on() method should specify an event name and a handler
   *                                       function for that event. The supported events are:
   *                                       'start' - when the interaction starts on an element.
   *                                       'pan' - when the user pans on the same element or onto another
   *                                       element (note, no 'start' event will be fired when the user
   *                                       pans with a touch from one element onto another, since this
   *                                       behavior is too difficult to test for and emulate).
   *                                       'end' - when the interaction with an element ends.
   *
   * @return {d3.component}
   */

  function panning () {
    const event = d3.dispatch("start", "pan", "end");
    const panningComponent = component().prop("elementSelector").render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const elements = selection.selectAll(props.elementSelector);
      elements.attr("data-sszvis-behavior-pannable", "").classed("sszvis-interactive", true).on("mouseenter", function () {
        event.apply("start", this, arguments);
      }).on("mousemove", function () {
        event.apply("pan", this, arguments);
      }).on("mouseleave", function () {
        event.apply("end", this, arguments);
      }).on("touchstart", function (e) {
        e.preventDefault();
        event.apply("start", this, arguments);
      }).on("touchmove", function (e) {
        e.preventDefault();
        const datum = datumFromPanEvent(firstTouch(e));
        if (datum === null) {
          event.apply("end", this, arguments);
        } else {
          event.apply("pan", this, arguments);
        }
      }).on("touchend", function () {
        event.apply("end", this, arguments);
      });
    });
    panningComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? panningComponent : value;
    };
    return panningComponent;
  }

  /**
   * Voronoi behavior
   *
   * The voronoi behavior adds an invisible layer of voronoi cells to a chart. The voronoi cells are calculated
   * based on the positions of the data objects which should be bound to the interaction layer before this behavior
   * is called on it. Each voronoi cell is associated with one data object, and this data object is passed to the event
   * callback functions.
   *
   * Like other behavior components, this behavior adds an invisible layer over the chart,
   * which the users interact with using touch or mouse actions. The behavior component then interprets
   * these interactions, and calls the relevant event handler callback functions. These callback functions are
   * passed values which represent data-space information about the nature of the interaction.
   * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
   *
   * The voronoi behavior expects to find an array of data already bound to the interaction layer. Each datum should
   * represent a point, and these points are used as the focal points of the construction of voronoi cells. These data
   * are also associated with the voronoi cells, so that when a user interacts with them, the datum and its index within the
   * bound data are passed to the callback functions. This component extends a d3.dispatch instance.
   *
   * The event handler functions are only called when the event happens within a certain distance
   * (see MAX_INTERACTION_RADIUS_SQUARED in this file) from the voronoi area's center.
   *
   * @module sszvis/behavior/voronoi
   *
   * @property {function} x                         Specify an accessor function for the x-position of the voronoi point
   * @property {function} y                         Specify an accessor function for the y-position of the voronoi point
   * @property {array[array, array]} bounds         Specify the bounds of the voronoi area. This is essential to the construction of voronoi cells
   *                                                using the d3.vornoi geom object. The bounds should determine the chart area over which you would like
   *                                                voronoi cells to be active. Note that if not specified, the voronoi cells will be very large.
   * @property {boolean} debug                      Whether the component is in debug mode. Being in debug mode renders the voroni cells obviously
   * @property {string and function} on             The .on() method should specify an event name and an event handler function.
   *                                                Possible event names are:
   *                                                'over' - when the user interacts with a voronoi area, either with a mouseover or touchstart
   *                                                'out' - when the user ceases to interact with a voronoi area, either with a mouseout or touchend
   *                                                All event handler functions are passed the datum which is the center of the voronoi area.
   *                                                Note: previously, event handlers were also passed the index of the datum within the dataset.
   *                                                However, this is no longer the case, due to the difficulty of inferring that information when hit
   *                                                testing a touch interaction on arbitrary rendered elements in the scene. In addition, the 'out' event
   *                                                used to be passed the datum itself, but this is no longer the case, also having to do with the impossibility
   *                                                of guaranteeing that there is a datum at the position of a touch, while "panning".
   *
   */

  function voronoi () {
    const event = d3.dispatch("over", "out");
    const voronoiComponent = component().prop("x").prop("y").prop("bounds").prop("debug").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      if (!props.bounds) {
        error("behavior.voronoi - requires bounds");
        return false;
      }
      const delaunay = d3.Delaunay.from(data, d => props.x(d), d => props.y(d));
      const voronoi = delaunay.voronoi(props.bounds);
      const polys = selection.selectAll("[data-sszvis-behavior-voronoi]").data(voronoi.cellPolygons()).join("path").attr("data-sszvis-behavior-voronoi", "").attr("data-sszvis-behavior-pannable", "").attr("class", "sszvis-interactive");
      polys.attr("d", d => "M" + d.join("L") + "Z").attr("fill", "transparent").on("mouseover", function (e) {
        const cbox = this.parentNode.getBoundingClientRect();
        const datumIdx = delaunay.find(e.clientX, e.clientY);
        if (eventNearPoint(e, [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])])) {
          event.apply("over", this, [e, data[datumIdx]]);
        }
      }).on("mousemove", function (e) {
        const cbox = this.parentNode.getBoundingClientRect();
        const datumIdx = delaunay.find(e.clientX, e.clientY);
        if (eventNearPoint(e, [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])])) {
          event.apply("over", this, [e, data[datumIdx]]);
        } else {
          event.apply("out", this, [e]);
        }
      }).on("mouseout", function (e) {
        event.apply("out", this, [e]);
      }).on("touchstart", function (e) {
        const cbox = this.parentNode.getBoundingClientRect();
        const datumIdx = delaunay.find(e.clientX, e.clientY);
        if (eventNearPoint(firstTouch(e), [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])])) {
          e.preventDefault();
          event.apply("over", this, [e, data[datumIdx]]);

          // Attach these handlers only if the initial touch is within the max distance from the voronoi center
          // This prevents the situation where a touch is outside that distance, and causes scrolling, but then the
          // user moves their finger over the center of the voronoi area, and it fires an event anyway. Generally,
          // when users are performing touches that cause scrolling, we want to avoid firing the events.
          const pan = function () {
            const touchEvent = firstTouch(e);
            const element = elementFromEvent(touchEvent);
            const panDatum = datumFromPannableElement(element);
            if (panDatum === null) {
              event.apply("out", this, [e]);
            } else {
              const panCbox = element.parentNode.getBoundingClientRect();
              if (eventNearPoint(touchEvent, [panCbox.left + props.x(panDatum.data), panCbox.top + props.y(panDatum.data)])) {
                // This event won't be cancelable if you start touching outside the hit area of a voronoi center,
                // then start scrolling, then move your finger over the hit area of a voronoi center. The browser
                // says you are "still scrolling" and won't let you cancel the event. It will issue a warning, which
                // we want to avoid.
                if (e.cancelable) {
                  e.preventDefault();
                }
                event.apply("over", this, [e, panDatum.data]);
              } else {
                event.apply("out", this, [e]);
              }
            }
          };
          const end = function () {
            event.apply("out", this, [e]);
            d3.select(this).on("touchmove", null).on("touchend", null);
          };
          d3.select(this).on("touchmove", pan).on("touchend", end);
        }
      });
      if (props.debug) {
        polys.attr("stroke", "#f00");
      }
    });
    voronoiComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? voronoiComponent : value;
    };
    return voronoiComponent;
  }

  // Perform distance calculations in units squared to avoid a costly Math.sqrt
  const MAX_INTERACTION_RADIUS_SQUARED = Math.pow(15, 2);
  function eventNearPoint(event, point) {
    const dx = event.clientX - point[0];
    const dy = event.clientY - point[1];
    return dx * dx + dy * dy < MAX_INTERACTION_RADIUS_SQUARED;
  }

  /**
   * A collection of utilities to measure elements
   *
   * @module sszvis/measure
   */

  /**
   * measureDimensions
   *
   * Calculates the width of the first DOM element defined by a CSS selector string,
   * a DOM element reference, or a d3 selection. If the DOM element can't be
   * measured `undefined` is returned for the width. Returns also measurements of
   * the screen, which are used by some responsive components.
   *
   * @param  {string|DOMElement|d3.selection} el The element to measure
   *
   * @return {Object} The measurement of the width of the element, plus dimensions of the screen
   *                  The returned object contains:
   *                      width: {number|undefined} The width of the element
   *                      screenWidth: {number} The innerWidth of the screen
   *                      screenHeight: {number} The innerHeight of the screen
   */
  const measureDimensions = function (arg) {
    let node;
    if (isString(arg)) {
      node = d3.select(arg).node();
    } else if (isSelection(arg)) {
      node = arg.node();
    } else {
      node = arg;
    }
    return {
      width: node ? node.getBoundingClientRect().width : undefined,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    };
  };

  /**
   * measureText
   *
   * Calculates the width of a string given a font size and a font face. It might
   * be more convenient to use a preset based on this function that has the font
   * size and family already set.
   *
   * @param {number} fontSize The font size in pixels
   * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
   * @param {string} text The text to measure
   * @returns {number} The width of the text
   *
   * @example
   * const helloWidth = sszvis.measureText(14, "Arial, sans-serif")("Hello!")
   **/
  const measureText = function () {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const cache = {};
    return function (fontSize, fontFace, text) {
      const key = [fontSize, fontFace, text].join("-");
      context.font = fontSize + "px " + fontFace;
      return cache[key] || (cache[key] = context.measureText(text).width);
    };
  }();

  /**
   * measureAxisLabel
   *
   * A preset to measure the widths of axis labels.
   *
   * @param {string} text The text to measure
   * @returns {number} The width of the text
   *
   * @example
   * const labelWidth = sszvis.measureAxisLabel("Hello!")
   */
  const measureAxisLabel = function (text) {
    return measureText(10, "Arial, sans-serif", text);
  };

  /**
   * measureLegendLabel
   *
   * A preset to measure the widths of legend labels.
   *
   * @param {string} text The text to measure
   * @returns {number} The width of the text
   *
   * @example
   * const labelWidth = sszvis.measureLegendLabel("Hello!")
   */
  const measureLegendLabel = function (text) {
    return measureText(12, "Arial, sans-serif", text);
  };

  /**
   * Bounds
   *
   * Creates a bounds object to help with the construction of d3 charts
   * that follow the d3 margin convention. The result of this function
   * is consumed by sszvis.createSvgLayer and sszvis.createHtmlLayer.
   *
   * @module sszvis/bounds
   *
   * @see http://bl.ocks.org/mbostock/3019563
   *
   * @property {number} DEFAULT_WIDTH The default width used across all charts
   * @property {number} RATIO The default side length ratio
   *
   * @param {Object} bounds Specifies the bounds of a chart area. Valid properties are:
   *   @property {number} bounds.width The total width of the chart (default: DEFAULT_WIDTH)
   *   @property {number} bounds.height The total height of the chart (default: height / RATIO)
   *   @property {number} bounds.top Top padding (default: 0)
   *   @property {number} bounds.left Left padding (default: 1)
   *   @property {number} bounds.bottom Bottom padding (default: 0)
   *   @property {number} bounds.right Right padding (default: 1)
   * @param {string|d3.selection} [selection] A CSS selector or d3 selection that will be measured to
   *                                          automatically calculate the bounds width and height using
   *                                          the SSZVIS responsive aspect ratio calculation. Custom
   *                                          width and height settings have priority over these auto-
   *                                          matic calculations, so if they are defined, this argument
   *                                          has no effect.
   *                                          This argument is optional to maintain backwards compatibility.
   *
   * @return {Object}              The returned object will preserve the properties width and height, or give them default values
   *                               if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
   *                               and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
   *                               which contains calculated or default values for top, bottom, left, and right padding.
   *                               Lastly, the object includes 'screenWidth' and 'screenHeight', which are occasionally used by responsive components.
   */

  const DEFAULT_WIDTH = 516;
  function bounds(arg1 /* bounds or selection */, arg2 /* [selection] */) {
    let _bounds = null,
      selection = null;
    if (arguments.length === 0) {
      _bounds = {};
    } else if (arguments.length === 1) {
      if (isObject(arg1)) {
        _bounds = arg1;
      } else if (isSelection(arg1)) {
        _bounds = {};
        selection = arg1;
      } else {
        _bounds = {};
        selection = d3.select(arg1);
      }
    } else {
      _bounds = arg1;
      selection = isSelection(arg2) ? arg2 : d3.select(arg2);
    }

    // All padding sides have default values
    const padding = {
      top: either(_bounds.top, 0),
      right: either(_bounds.right, 1),
      bottom: either(_bounds.bottom, 0),
      left: either(_bounds.left, 1)
    };

    // Width is calculated as: _bounds.width (if provided) -> selection.getBoundingClientRect().width (if provided) -> DEFAULT_WIDTH
    const dimensions = defined(selection) ? measureDimensions(selection) : {
      width: DEFAULT_WIDTH
    };
    const width = either(_bounds.width, dimensions.width);
    const innerHeight = aspectRatioAuto(dimensions);
    const height = either(_bounds.height, innerHeight + padding.top + padding.bottom);
    return {
      innerHeight: height - padding.top - padding.bottom,
      innerWidth: width - padding.left - padding.right,
      padding,
      height,
      width,
      screenWidth: dimensions.screenWidth,
      screenHeight: dimensions.screenHeight
    };
  }

  // This is the default aspect ratio. It is defined as: width / innerHeight
  // See the Offerte document for SSZVIS 1.3, and here: https://basecamp.com/1762663/projects/10790469/todos/212434984
  // To calculate the default innerHeight, do width / ASPECT_RATIO
  // @deprecated Since the responsive revisions, the default aspect ratio has changed,
  //             so that it is now responsive to the container width.
  //             This property is preserved for compatibility reasons.
  const RATIO = 16 / 9;

  /* Helper functions
  ----------------------------------------------- */
  function either(val, fallback) {
    return val === undefined ? fallback : val;
  }

  /**
   * Cascade module
   *
   * @module sszvis/cascade
   *
   * sszvis.cascade is a module that can be useful for creating nested data structures.
   * It can be used in similar ways to d3.nest, but should not be conflated with d3.nest,
   * since it provides different behavior.
   *
   * The cascade class is not a data structure. Rather, it is used to create a data structue
   * generator. An instance of the cascade class should be configured to specify the desired
   * characteristics of the resulting data structure, and then applied to a flat array of
   * objects in order to generate the data structure.
   *
   * Fundamental to the cascade class is the concept of "groupBy", which is an operation that
   * transforms a flat array of data into a nested data structure. It does this by
   * passing each value in the flat array through an accessor function, and "groping" those
   * elements based on the return value of that function. Every element in the resulting groups
   * will have produced the same value when passed into the accessor function.
   *
   * For example, if a flat data set contains a number of elements, and some have a value "city = Zurich",
   * while others have a value "city = Basel", performing a groupBy operation on this data set
   * and passing a predicate function which returns the value of the "city" property of these objects
   * will form the objects into groups where all objects in one group have "city = Zurich", and all objects
   * in the other group have "city = Basel".
   *
   * The Cascade module abstracts the concept of "groupBy" on multiple levels, and provides the option
   * to arrange the resultant groups in different ways.
   *
   * There are two options for the form of the resulting groups. (This is where sszvis.cascade
   * diverges in behavior from d3.nest, which offers two options, but they must be the same through
   * the entire data structure):
   *
   * In one version, the groups are formed into a plain Javascript object with key -> value pairs. The keys are
   * the set of results from the grouping function. (In our example, the keys would be "Zurich" and "Basel")
   * In this implementation, the values are each arrays of elements which share the value of the key function.
   * However, these objects may be nested arbitrarily deep. If multiple layers of objects are specified, then the
   * values will themselves be objects with key -> value pairs, and so on. The final layer of objects will have
   * arrays for values, where each element in the arrays is a data object which shares values for all of the specified
   * key properties with the other objects in its array.
   *
   * Alternatively, the input array of objects can be grouped into an array of groups, where the groups
   * contain data values which all share the same value for a certain key property. These, too, can be nested.
   * The sub-groups may be formed as arrays, where each element in the next level is grouped
   * according to the same principle, but with a different key function. Alternatively, the groups may be
   * objects, grouped according to the principle described in the first version. It is up to the user of the
   * class to specify the extent and nature of this nesting. If an array of groups is the last level of the cascade,
   * its values will be arrays of data values.
   *
   * At the base of the cascade, regardless of the types of the levels, will be arrays of data objects. These arrays
   * can also be thought of as containing the leaves of the tree structure.
   *
   * Instances of this class are configured using three methods: "objectBy", "arrayBy", and "sort". They are used by
   * calling the "apply" method, passing a flat array of data objects. The first three methods return the instance
   * to enable method chaining, while "apply" returns the nested data structure.
   *
   * @method objectBy         Takes as argument a predicate function which is called on each element in an input array. The
   *                          return values of this function are used to create an object with key -> value pairs, where the keys
   *                          are the results of the calls to the predicate function and the values are a further layer of the cascade.
   * @method arrayBy          Takes as argument a predicate function which is called on each element in an input array. The
   *                          return values of this function are used to create an array, where each element of the array
   *                          is a further layer of the cascade. arrayBy also takes an optional second parameter, which specifys
   *                          a sorting function. If provided, groups in the resulting array will be sorted by passing the key values
   *                          of the groups through the sorting function. For example, if an alphabetical sort function is passed
   *                          as the second parameter to an arrayBy call in the example above, the resulting array will be sorted
   *                          such that the first group is the one with "city = Basel" and the second group is the one with "city = Zurich".
   *                          The sort function should take the usual form of a function passed to Array.prototype.sort().
   * @method sort             This method specifies a sort function for the very last layer of the cascade, which is always arrays of data objects.
   *                          the sort function passed to this method should accept data objects as values.
   *
   * @returns                 An instance of sszvis.cascade
   */

  function groupBy(data, keyFunc) {
    const group = {};
    let key;
    for (let i = 0, l = data.length, value; i < l; ++i) {
      value = data[i];
      key = keyFunc(value);
      group[key] ? group[key].push(value) : group[key] = [value];
    }
    return group;
  }
  function groupEach(data, func) {
    for (const prop in data) {
      func(data[prop], prop);
    }
  }
  function arrEach(arr, func) {
    for (let i = 0, l = arr.length; i < l; ++i) {
      func(arr[i], i);
    }
  }
  function cascade() {
    const _cascade = {},
      keys = [],
      sorts = [];
    let valuesSort;
    function make(data, depth) {
      if (depth >= keys.length) {
        if (valuesSort) data.sort(valuesSort);
        return data;
      }
      const sorter = sorts[depth];
      const key = keys[depth++];
      const grouped = groupBy(data, key.func);
      if (key.type === "obj") {
        const obj = {};
        groupEach(grouped, (value, k) => {
          obj[k] = make(value, depth);
        });
        return obj;
      } else if (key.type === "arr") {
        const arr = [];
        if (sorter) {
          const groupKeys = Object.keys(grouped).sort(sorter);
          arrEach(groupKeys, k => {
            arr.push(make(grouped[k], depth));
          });
        } else {
          groupEach(grouped, value => {
            arr.push(make(value, depth));
          });
        }
        return arr;
      }
    }
    _cascade.apply = function (data) {
      return make(data, 0);
    };
    _cascade.objectBy = function (d) {
      keys.push({
        type: "obj",
        func: d
      });
      return _cascade;
    };
    _cascade.arrayBy = function (d, sorter) {
      keys.push({
        type: "arr",
        func: d
      });
      if (sorter) sorts[keys.length - 1] = sorter;
      return _cascade;
    };
    _cascade.sort = function (d) {
      valuesSort = d;
      return _cascade;
    };
    return _cascade;
  }

  /**
   * Bar component
   *
   * The bar component is a general-purpose component used to render rectangles, including
   * bars for horizontal and vertical standard and stacked bar charts, bars in the population
   * pyramids, and the boxes of the heat table.
   *
   * The input data should be an array of data values, where each data value contains the information
   * necessary to render a single rectangle. The x-position, y-position, width, and height of each rectangle
   * are then extracted from the data objects using accessor functions.
   *
   * In addition, the user can specify fill and stroke accessor functions. When called, these functions
   * are given each rectangle's data object, and should return a valid fill or stroke color to be applied
   * to the rectangle.
   *
   * The x, y, width, height, fill, and stroke properties may also be specified as constants.
   *
   * @module sszvis/component/bar
   *
   * @property {number, function} x             the x-value of the rectangles. Becomes a functor.
   * @property {number, function} y             the y-value of the rectangles. Becomes a functor.
   * @property {number, function} width         the width-value of the rectangles. Becomes a functor.
   * @property {number, function} height        the height-value of the rectangles. Becomes a functor.
   * @property {string, function} fill          the fill-value of the rectangles. Becomes a functor.
   * @property {string, function} stroke        the stroke-value of the rectangles. Becomes a functor.
   * @property {boolean} centerTooltip          Whether or not to center the tooltip anchor within the bar.
   *                                            The default tooltip anchor position is at the top of the bar,
   *                                            centered in the width dimension. When this property is true,
   *                                            the tooltip anchor will also be centered in the height dimension.
   * @property {Array<Number>} tooltipAnchor    Where, relative to the box formed by the bar, to position the tooltip
   *                                            anchor. This property is overriden if centerTooltip is true. The
   *                                            value should be a two-element array, [x, y], where x is the position (in 0 - 1)
   *                                            of the tooltip in the width dimension, and y is the position (also range 0 - 1)
   *                                            in the height dimension. For example, the upper left corner would be [0, 0],
   *                                            the center of the bar would be [0.5, 0.5], the middle of the right side
   *                                            would be [1, 0.5], and the lower right corner [1, 1]. Used by, for example,
   *                                            the pyramid chart.
   * @property {boolean} transition             Whether or not to transition the visual values of the bar component, when they
   *                                            are changed.
   *
   * @return {sszvis.component}
   */


  // replaces NaN values with 0
  function handleMissingVal(v) {
    return isNaN(v) ? 0 : v;
  }
  function bar () {
    return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("fill", functor).prop("stroke", functor).prop("centerTooltip").prop("tooltipAnchor").prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const xAcc = compose(handleMissingVal, props.x);
      const yAcc = compose(handleMissingVal, props.y);
      const wAcc = compose(handleMissingVal, props.width);
      const hAcc = compose(handleMissingVal, props.height);
      const bars = selection.selectAll(".sszvis-bar").data(data).join("rect").classed("sszvis-bar", true).attr("x", xAcc).attr("y", yAcc).attr("width", wAcc).attr("height", hAcc).attr("fill", props.fill).attr("stroke", props.stroke);
      if (props.transition) {
        bars.transition(defaultTransition());
      }
      bars.attr("x", xAcc).attr("y", yAcc).attr("width", wAcc).attr("height", hAcc);

      // Tooltip anchors
      let tooltipPosition;
      if (props.centerTooltip) {
        tooltipPosition = function (d) {
          return [xAcc(d) + wAcc(d) / 2, yAcc(d) + hAcc(d) / 2];
        };
      } else if (props.tooltipAnchor) {
        const uv = props.tooltipAnchor.map(Number.parseFloat);
        tooltipPosition = function (d) {
          return [xAcc(d) + uv[0] * wAcc(d), yAcc(d) + uv[1] * hAcc(d)];
        };
      } else {
        tooltipPosition = function (d) {
          return [xAcc(d) + wAcc(d) / 2, yAcc(d)];
        };
      }
      const ta = tooltipAnchor().position(tooltipPosition);
      selection.call(ta);
    });
  }

  /**
   * Dot component
   *
   * Used to render small circles, where each circle corresponds to a data value. The dot component
   * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
   *
   * @module sszvis/component/dot
   *
   * @property {number, function} x               An accessor function or number for the x-position of the dots.
   * @property {number, function} y               An accessor function or number for the y-position of the dots.
   * @property {number, function} radius          An accessor function or number for the radius of the dots.
   * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
   * @property {string, function} fill            An accessor function or string for the fill color of the dots.
   *
   * @return {sszvis.component}
   */

  function dot () {
    return component().prop("x", functor).prop("y", functor).prop("radius").prop("stroke").prop("fill").prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      let dots = selection.selectAll(".sszvis-circle").data(data).join("circle").classed("sszvis-circle", true).attr("cx", props.x).attr("cy", props.y).attr("r", props.radius).attr("stroke", props.stroke).attr("fill", props.fill);
      if (props.transition) {
        dots = dots.transition(defaultTransition());
      }
      dots.attr("cx", props.x).attr("cy", props.y).attr("r", props.radius);

      // Tooltip anchors

      const ta = tooltipAnchor().position(d => [props.x(d), props.y(d)]);
      selection.call(ta);
    });
  }

  /**
   * Grouped Bars component
   *
   * The grouped bars component is used to create grouped vertical bar charts.
   *
   * The input to the grouped bar component should be an array of arrays, where each inner
   * array contains the bars for a single group. Each of the inner arrays becomes a group, and
   * each element in those inner arrays becomes a bar.
   *
   * In addition to the raw data, the user must provide other information necessary for calculating
   * the layout of the groups of bars, namely the number of bars in each group (this component requires that
   * all groups have the same number of bars), a scale for finding the x-offset of each group (usually an
   * instance of d3.scaleOrdinal), a width for groups, and y- and height- scales for the bars in the group.
   * Note that the number of bars in each group and the group width determines how wide each bar will be, and
   * this width is calculated internally to the groupedBars component.
   *
   * The groups are calculated and laid out entirely by the groupedBars component.
   *
   * @module sszvis/component/groupedBars
   *
   * @property {scale} groupScale         This should be a scale function for determining the correct group offset of a member of a group.
   *                                      This function is passed the group member, and should return a value for the group offset which
   *                                      is the same for all members of the group. The within-group offset (which is different for each member)
   *                                      is then added to this group offset in order to position the bars individually within the group.
   *                                      So, for instance, if the groups are based on the "city" property, the groupScale should return
   *                                      the same value for all data objects with "city = Zurich".
   * @property {number} groupSize         This property tells groupedBars how many bars to expect for each group. It is used to assist in
   *                                      calculating the within-group layout and size of the bars. This number is treated as the same for all
   *                                      groups. Groups with less members than this number will have visible gaps. (Note that having less members
   *                                      in a group is not the same as having a member with a missing value, which will be discussed later)
   * @property {number} groupWidth        The width of the groups. This value is treated as the same for all groups. The width available to the groups
   *                                      is divided up among the bars. Often, this value will be the result of calling .rangeBand() on a d3.scaleOrdinal scale.
   * @property {number} groupSpace        The percentage of space between each group. (default: 0.05). Usually the default is fine here.
   * @property {function} y               The y-position of the bars in the group. This function is given a data value and should return
   *                                      a y-value. It should be similar to other functions you have already seen for positioning bars.
   * @property {function} height          The height of the bars in the group. This function is given a data value and should return
   *                                      a height value. It should be similar to other functions you have already seen for setting the height of bars.
   * @property {string, function} fill    A functor which gives the color for each bar (often based on the bar's group). This can be a string or a function.
   * @property {string, function} stroke  The stroke color for each bar (default: none)
   * @property {function} defined         A predicate function which can be used to determine whether a bar has a defined value. (default: true).
   *                                      Any bar for which this function returns false, meaning that it has an undefined (missing) value,
   *                                      will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with
   *                                      missing values from bars with very small values, which would display as a very thin rectangle.
   *
   * @return {sszvis.component}
   */

  function groupedBars () {
    return component().prop("groupScale").prop("groupSize").prop("groupWidth").prop("groupSpace").groupSpace(0.05).prop("y", functor).prop("height").prop("fill").prop("stroke").prop("defined", functor).defined(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const inGroupScale = d3.scaleBand().domain(d3.range(props.groupSize)).padding(props.groupSpace).paddingOuter(0).rangeRound([0, props.groupWidth]);
      const groups = selection.selectAll("g.sszvis-bargroup").data(data).join("g").classed("sszvis-bargroup", true);
      const barUnits = groups.selectAll("g.sszvis-barunit").data(d => d).join("g").classed("sszvis-barunit", true);
      barUnits.each((d, i) => {
        // necessary for the within-group scale
        d.__sszvisGroupedBarIndex__ = i;
      });
      const unitsWithValue = barUnits.filter(props.defined);

      // clear the units before rendering
      unitsWithValue.selectAll("*").remove();

      //sszsch: fix: reset previously assigned translations
      unitsWithValue.attr("transform", () => translateString(0, 0));
      unitsWithValue.append("rect").classed("sszvis-bar", true).attr("fill", props.fill).attr("x", d =>
      // first term is the x-position of the group, the second term is the x-position of the bar within the group
      props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__)).attr("y", props.y).attr("width", inGroupScale.bandwidth()).attr("height", props.height);
      const unitsWithoutValue = barUnits.filter(not(props.defined));
      unitsWithoutValue.selectAll("*").remove();
      unitsWithoutValue.attr("transform", (d, i) => translateString(props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__) + inGroupScale.bandwidth() / 2, props.y(d, i)));
      unitsWithoutValue.append("line").classed("sszvis-bar--missing line1", true).attr("x1", -4).attr("y1", -4).attr("x2", 4).attr("y2", 4);
      unitsWithoutValue.append("line").classed("sszvis-bar--missing line2", true).attr("x1", 4).attr("y1", -4).attr("x2", -4).attr("y2", 4);
      const ta = tooltipAnchor().position(group => {
        let xTotal = 0;
        let tallest = Infinity;
        for (const [i, d] of group.entries()) {
          xTotal += props.groupScale(d) + inGroupScale(d.__sszvisGroupedBarIndex__) + inGroupScale.bandwidth() / 2;
          // smaller y is higher
          tallest = Math.min(tallest, props.y(d, i));
        }
        const xAverage = xTotal / group.length;
        return [xAverage, tallest];
      });
      selection.call(ta);
    });
  }

  /**
   * Line component
   *
   * The line component is a general-purpose component used to render lines.
   *
   * The input data should be an array of arrays, where each inner array
   * contains the data points necessary to render a line. The line is then
   * composed of x- and y- values extracted from these data objects
   * using the x and y accessor functions.
   *
   * Each data object in a line's array is passed to the x- and y- accessors, along with
   * that data object's index in the array. For more information, see the documentation for
   * d3.line.
   *
   * In addition, the user can specify stroke and strokeWidth accessor functions. Because these
   * functions apply properties to the entire line, when called, they are give the entire array of line data
   * as an argument, plus the index of that array of line data within the outer array of lines. Note that this
   * differs slightly from the usual case in that dimension-related accessor functions are given different
   * data than style-related accessor functions.
   *
   * @module sszvis/component/line
   *
   * @property {function} x                An accessor function for getting the x-value of the line
   * @property {function} y                An accessor function for getting the y-value of the line
   * @property {function} [defined]        The key function to be used for the data join
   * @property {function} [key]            The key function to be used for the data join
   * @property {function} [valuesAccessor] An accessor function for getting the data points array of the line
   * @property {string, function} [stroke] Either a string specifying the stroke color of the line or lines,
   *                                       or a function which, when passed the entire array representing the line,
   *                                       returns a value for the stroke. If left undefined, the stroke is black.
   * @property {string, function} [strokeWidth] Either a number specifying the stroke-width of the lines,
   *                                       or a function which, when passed the entire array representing the line,
   *                                       returns a value for the stroke-width. The default value is 1.
   *
   * @return {sszvis.component}
   */

  function line () {
    return component().prop("x").prop("y").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((d, i) => i).prop("valuesAccessor").valuesAccessor(identity$1).prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // Layouts

      const line = d3.line().defined(props.defined === undefined ? compose(not(isNaN), props.y) : props.defined).x(props.x).y(props.y);

      // Rendering

      let path = selection.selectAll(".sszvis-line").data(data, props.key).join("path").classed("sszvis-line", true).style("stroke", props.stroke);
      path.order();
      if (props.transition) {
        path = path.transition(defaultTransition());
      }
      path.attr("d", compose(line, props.valuesAccessor)).style("stroke", props.stroke).style("stroke-width", props.strokeWidth);
    });
  }

  /**
   * Pie component
   *
   * The pie component is used to draw pie charts. It uses the d3.arc() generator
   * to create pie wedges.
   *
   * THe input data should be an array of data values, where each data value represents one wedge in the pie.
   *
   * @module sszvis/component/pie
   *
   * @property {number} radius                  The radius of the pie chart (no default)
   * @property {string, function} fill          a fill color for wedges in the pie (default black). Ideally a function
   *                                            which takes a data value.
   * @property {string, function} stroke        the stroke color for wedges in the pie (default none)
   * @property {string, function} angle         specifys the angle of the wedges in radians. Theoretically this could be
   *                                            a constant, but that would make for a very strange pie. Ideally, this
   *                                            is a function which takes a data value and returns the angle in radians.
   *
   * @return {sszvis.component}
   */

  function pie () {
    return component().prop("radius").prop("fill").prop("stroke").prop("angle", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const stroke = props.stroke || "#FFFFFF";
      let angle = 0;
      for (const value of data) {
        // In order for an angle transition to work correctly in d3, the transition must be done in data space.
        // The computed arc path itself cannot be interpolated without error.
        // see http://bl.ocks.org/mbostock/5100636 for a straightforward example.
        // However, due to the structure of sszvis and the way d3 data joining works, this poses a bit of a challenge,
        // since old and new data values could be on different objects, and they need to be merged.
        // In the code that follows, value._a0 and value._a1 are the destination angles for the transition.
        // value.a0 and value.a1 are the current values in the transition (either the initial value, some intermediate value, or the final angle value).
        value._a0 = angle;
        // These a0 and a1 values may be overwritten later if there is already data bound at this data index. (see the .each function further down).
        if (value.a0 == undefined || isNaN(value.a0)) value.a0 = angle;
        angle += props.angle(value);
        value._a1 = angle;
        // data values which don't already have angles set start out at the complete value.
        if (value.a1 == undefined || isNaN(value.a1)) value.a1 = angle;
      }
      const arcGen = d3.arc().innerRadius(4).outerRadius(props.radius).startAngle(d => d.a0).endAngle(d => d.a1);
      const segments = selection.selectAll(".sszvis-path").each((d, i) => {
        // This matches the data values iteratively in the same way d3 will when it does the data join.
        // This is kind of a hack, but it's the only way to get any existing angle values from the already-bound data
        if (data[i]) {
          data[i].a0 = d.a0;
          data[i].a1 = d.a1;
        }
      }).data(data).join("path").classed("sszvis-path", true).attr("transform", "translate(" + props.radius + "," + props.radius + ")").attr("fill", props.fill).attr("stroke", stroke);
      segments.transition(defaultTransition()).attr("transform", "translate(" + props.radius + "," + props.radius + ")").attrTween("d", d => {
        const angle0Interp = d3.interpolate(d.a0, d._a0);
        const angle1Interp = d3.interpolate(d.a1, d._a1);
        return function (t) {
          d.a0 = angle0Interp(t);
          d.a1 = angle1Interp(t);
          return arcGen(d);
        };
      }).attr("fill", props.fill).attr("stroke", stroke);
      const ta = tooltipAnchor().position(d => {
        // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
        // makes the same correction to svg.arc() angles :o
        const a = d.a0 + Math.abs(d.a1 - d.a0) / 2 - Math.PI / 2;
        const r = props.radius * 2 / 3;
        return [props.radius + Math.cos(a) * r, props.radius + Math.sin(a) * r];
      });
      selection.datum(data).call(ta);
    });
  }

  /**
   * Pyramid component
   *
   * The pyramid component is primarily used to show a distribution of age groups
   * in a population (population pyramid). The chart is mirrored vertically,
   * meaning that it has a horizontal axis that extends in a positive and negative
   * direction having the same domain.
   *
   * This chart's horizontal point of origin is at it's spine, i.e. the center of
   * the chart.
   *
   * @module sszvis/component/pyramid
   *
   * @requires sszvis.component.bar
   *
   * @property {number, d3.scale} [barFill]          The color of a bar
   * @property {number, d3.scale} barHeight          The height of a bar
   * @property {number, d3.scale} barWidth           The width of a bar
   * @property {number, d3.scale} barPosition        The vertical position of a bar
   * @property {Array<number, number>} tooltipAnchor The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
   *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
   *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars
   * @property {function}         leftAccessor       Data for the left side
   * @property {function}         rightAccessor      Data for the right side
   * @property {function}         [leftRefAccessor]  Reference data for the left side
   * @property {function}         [rightRefAccessor] Reference data for the right side
   *
   * @return {sszvis.component}
   */


  /* Constants
  ----------------------------------------------- */
  const SPINE_PADDING$1 = 0.5;

  /* Module
  ----------------------------------------------- */
  function pyramid () {
    return component().prop("barHeight", functor).prop("barWidth", functor).prop("barPosition", functor).prop("barFill", functor).barFill("#000").prop("tooltipAnchor").tooltipAnchor([0.5, 0.5]).prop("leftAccessor").prop("rightAccessor").prop("leftRefAccessor").prop("rightRefAccessor").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // Components

      const leftBar = bar().x(d => -SPINE_PADDING$1 - props.barWidth(d)).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
      const rightBar = bar().x(SPINE_PADDING$1).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
      const leftLine = lineComponent$1().barPosition(props.barPosition).barWidth(props.barWidth).mirror(true);
      const rightLine = lineComponent$1().barPosition(props.barPosition).barWidth(props.barWidth);

      // Rendering

      selection.selectGroup("left").datum(props.leftAccessor(data)).call(leftBar);
      selection.selectGroup("right").datum(props.rightAccessor(data)).call(rightBar);
      selection.selectGroup("leftReference").datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : []).call(leftLine);
      selection.selectGroup("rightReference").datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : []).call(rightLine);
    });
  }
  function lineComponent$1() {
    return component().prop("barPosition").prop("barWidth").prop("mirror").mirror(false).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const lineGen = d3.line().x(props.barWidth).y(props.barPosition);
      const line = selection.selectAll(".sszvis-pyramid__referenceline").data(data).join("path").attr("class", "sszvis-pyramid__referenceline");
      line.attr("transform", props.mirror ? "scale(-1, 1)" : "").transition(defaultTransition()).attr("d", lineGen);
    });
  }

  /**
   * Sankey component
   *
   * This component is used for making sankey diagrams, also known as parallel sets diagrams. They
   * depict individual entities as bars, and flows between those entities as thick links connecting
   * those bars. The entities can be many things associated with flows, for example organizations,
   * geographic regions, or websites, while the links between them can represent many kinds of flows,
   * for example payments of money, movements of people, or referral of browsing traffic. In this component,
   * the entities are referred to as 'nodes', and the connections between them are referred to as 'links'.
   *
   * @module sszvis/component/sankey
   *
   * @property {Function} sizeScale                    A scale function for the size of the nodes. The domain and the range should
   *                                                   be configured using values returned by the sszvis.layout.sankey.computeLayout
   *                                                   function.
   * @property {Function} columnPosition               A scale function for the position of the columns of nodes.
   *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
   * @property {Number} nodeThickness                  A number for the horizontal thickness of the node bars.
   *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
   * @property {Number} nodePadding                    A number for padding between the nodes.
   *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
   * @property {Number, Function} columnPadding        A number, or function that takes a column index and returns a number,
   *                                                   for padding at the top of each column. Used to vertically center the columns.
   * @property {String, Function} columnLabel          A string, or a function that returns a string, for the label at the top of each column.
   * @property {Number} columnLabelOffset              A value for offsetting the column labels in the x axis. Used to move the column labels around if you
   *                                                   don't want them to be centered on the columns. This is useful in situations where the normal label would
   *                                                   overlap outer boundaries or otherwise be inconveniently positioned. You can usually forget this, except
   *                                                   perhaps in very narrow screen layouts.
   * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default 0.5.
   * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color.
   * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color.
   * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
   *                                                   The default implementation stacks links in decresing order of value, i.e. larger, thicker links
   *                                                   are below smaller, thinner ones.
   * @property {String, Function} labelSide            A function determining the position of labels for the nodes. Should take a column index and
   *                                                   return a side ('left' or 'right'). Default is always 'left'.
   * @property {Boolean} labelSideSwitch               A boolean used to determine whether to switch the label side. When true, 'left' labels will be shown on
   *                                                   the right side, and 'right' labels on the left side. This is useful as a switch to be flipped in very
   *                                                   narrow screen layouts, when you want the labels to appear on the opposite side of the columns they refer to.
   * @property {Number} labelOpacity                   A value for the opacity of the column labels. You can change this to affect the visibility of the column
   *                                                   labels, for instance to hide them when they would overlap with user-triggered hover labels.
   * @property {Number} labelHitBoxSize                A number for the width of 'hit boxes' added underneath the labels. This should basically be
   *                                                   equal to the width of the widest label. For performance reasons, it doesn't make sense to calculate
   *                                                   this value at run time while the component is rendered. Far better is to position the chart so that the
   *                                                   labels are visible, find the value of the widest label, and use that.
   * @property {Function} nameLabel                    A function which takes the id of a node and should return the label for that node. Defaults tousing
   *                                                   the id directly.
   * @property {Array} linkSourceLabels                An array containing the data for links which should have labels on their 'source' end, that is the
   *                                                   end of the link which is connected to the source node. These data values should match the values
   *                                                   returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give the data
   *                                                   values themselves here. See the examples for an implementation of the most straightforward
   *                                                   mechanism for this.
   * @property {Array} linkTargetLabels                An array containing data for links which should have labels on their 'target' end, that is the
   *                                                   end of the link which is connected to the target node. Works the same as linkSourceLabels, but used
   *                                                   for another set of possible link labels.
   * @property {String, Function} linkLabel            A string or function returning a string to use for the label of each link. Function
   *                                                   versions should accept a link datum (like the ones passed into linkSourceLabels or linkTargetLabels)
   *                                                   and return text.
   *
   * @return {sszvis.component}
   */

  const linkPathString = function (x0, x1, x2, x3, y0, y1) {
    return "M" + x0 + "," + y0 + "C" + x1 + "," + y0 + " " + x2 + "," + y1 + " " + x3 + "," + y1;
  };
  const linkBounds = function (x0, x1, y0, y1) {
    return [x0, x1, y0, y1];
  };
  function sankey () {
    return component().prop("sizeScale").prop("columnPosition").prop("nodeThickness").prop("nodePadding").prop("columnPadding", functor).prop("columnLabel", functor).columnLabel("").prop("columnLabelOffset", functor).columnLabelOffset(0).prop("linkCurvature").linkCurvature(0.5).prop("nodeColor", functor).prop("linkColor", functor).prop("linkSort", functor).linkSort((a, b) => a.value - b.value) // Default sorts in descending order of value
    .prop("labelSide", functor).labelSide("left").prop("labelSideSwitch").prop("labelOpacity", functor).labelOpacity(1).prop("labelHitBoxSize").labelHitBoxSize(0).prop("nameLabel").nameLabel(identity$1).prop("linkSourceLabels").linkSourceLabels([]).prop("linkTargetLabels").linkTargetLabels([]).prop("linkLabel", functor).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const idAcc = prop("id");
      const getNodePosition = function (node) {
        return Math.floor(props.columnPadding(node.columnIndex) + props.sizeScale(node.valueOffset) + props.nodePadding * node.nodeIndex);
      };
      const xPosition = function (node) {
        return props.columnPosition(node.columnIndex);
      };
      const yPosition = function (node) {
        return getNodePosition(node);
      };
      const xExtent = function () {
        return Math.max(props.nodeThickness, 1);
      };
      const yExtent = function (node) {
        return Math.ceil(Math.max(props.sizeScale(node.value), 1));
      };
      const linkPadding = 1; // Default value for padding between nodes and links - cannot be changed

      // Draw the nodes
      const barGen = bar().x(xPosition).y(yPosition).width(xExtent).height(yExtent).fill(props.nodeColor);
      const barGroup = selection.selectGroup("nodes").datum(data.nodes);
      barGroup.call(barGen);
      const barTooltipAnchor = tooltipAnchor().position(node => [xPosition(node) + xExtent() / 2, yPosition(node) + yExtent(node) / 2]);
      barGroup.call(barTooltipAnchor);

      // Draw the column labels
      const columnLabelX = function (colIndex) {
        return props.columnPosition(colIndex) + props.nodeThickness / 2;
      };
      const columnLabelY = -24;
      const columnLabels = barGroup.selectAll(".sszvis-sankey-column-label")
      // One number for each column
      .data(data.columnLengths).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-column-label");
      columnLabels.attr("transform", (d, i) => translateString(columnLabelX(i) + props.columnLabelOffset(d, i), columnLabelY)).text((d, i) => props.columnLabel(i));
      const columnLabelTicks = barGroup.selectAll(".sszvis-sankey-column-label-tick").data(data.columnLengths).join("line").attr("class", "sszvis-sankey-column-label-tick");
      columnLabelTicks.attr("x1", (d, i) => halfPixel(columnLabelX(i))).attr("x2", (d, i) => halfPixel(columnLabelX(i))).attr("y1", halfPixel(columnLabelY + 8)).attr("y2", halfPixel(columnLabelY + 12));

      // Draw the links
      const linkPoints = function (link) {
        const curveStart = props.columnPosition(link.src.columnIndex) + props.nodeThickness + linkPadding,
          curveEnd = props.columnPosition(link.tgt.columnIndex) - linkPadding,
          startLevel = getNodePosition(link.src) + props.sizeScale(link.srcOffset) + props.sizeScale(link.value) / 2,
          endLevel = getNodePosition(link.tgt) + props.sizeScale(link.tgtOffset) + props.sizeScale(link.value) / 2;
        return [curveStart, curveEnd, startLevel, endLevel];
      };
      const linkPath = function (link) {
        const points = linkPoints(link),
          curveInterp = d3.interpolateNumber(points[0], points[1]),
          curveControlPtA = curveInterp(props.linkCurvature),
          curveControlPtB = curveInterp(1 - props.linkCurvature);
        return linkPathString(points[0], curveControlPtA, curveControlPtB, points[1], points[2], points[3]);
      };
      const linkBoundingBox = function (link) {
        const points = linkPoints(link);
        return linkBounds(points[0], points[1], points[2], points[3]);
      };
      const linkThickness = function (link) {
        return Math.max(props.sizeScale(link.value), 1);
      };

      // Render the links
      const linksGroup = selection.selectGroup("links");
      const linksElems = linksGroup.selectAll(".sszvis-link").data(data.links, idAcc).join("path").attr("class", "sszvis-link");
      linksElems.attr("fill", "none").attr("d", linkPath).attr("stroke-width", linkThickness).attr("stroke", props.linkColor).sort(props.linkSort);
      linksGroup.datum(data.links);
      const linkTooltipAnchor = tooltipAnchor().position(link => {
        const bbox = linkBoundingBox(link);
        return [(bbox[0] + bbox[1]) / 2, (bbox[2] + bbox[3]) / 2];
      });
      linksGroup.call(linkTooltipAnchor);

      // Render the link labels
      const linkLabelsGroup = selection.selectGroup("linklabels");

      // If no props.linkSourceLabels are provided, most of this rendering is no-op
      const linkSourceLabels = linkLabelsGroup.selectAll(".sszvis-sankey-link-source-label").data(props.linkSourceLabels).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-source-label");
      linkSourceLabels.attr("transform", link => {
        const bbox = linkBoundingBox(link);
        return translateString(bbox[0] + 6, bbox[2]);
      }).text(props.linkLabel);

      // If no props.linkTargetLabels are provided, most of this rendering is no-op
      const linkTargetLabels = linkLabelsGroup.selectAll(".sszvis-sankey-link-target-label").data(props.linkTargetLabels).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-target-label");
      linkTargetLabels.attr("transform", link => {
        const bbox = linkBoundingBox(link);
        return translateString(bbox[1] - 6, bbox[3]);
      }).text(props.linkLabel);

      // Render the node labels and their hit boxes
      const getLabelSide = function (colIndex) {
        let side = props.labelSide(colIndex);
        if (props.labelSideSwitch) {
          side = side === "left" ? "right" : "left";
        }
        return side;
      };
      const nodeLabelsGroup = selection.selectGroup("nodelabels");
      const barLabels = nodeLabelsGroup.selectAll(".sszvis-sankey-node-label").data(data.nodes).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-node-label");
      barLabels.text(node => props.nameLabel(node.id)).attr("text-align", "middle").attr("text-anchor", node => getLabelSide(node.columnIndex) === "left" ? "end" : "start").attr("x", node => getLabelSide(node.columnIndex) === "left" ? xPosition(node) - 6 : xPosition(node) + props.nodeThickness + 6).attr("y", node => yPosition(node) + yExtent(node) / 2).style("opacity", props.labelOpacity);
      const barLabelHitBoxes = nodeLabelsGroup.selectAll(".sszvis-sankey-hitbox").data(data.nodes).join("rect").attr("class", "sszvis-sankey-hitbox");
      barLabelHitBoxes.attr("fill", "transparent").attr("x", node => xPosition(node) + (getLabelSide(node.columnIndex) === "left" ? -props.labelHitBoxSize : 0)).attr("y", node => yPosition(node) - props.nodePadding / 2).attr("width", props.labelHitBoxSize + props.nodeThickness).attr("height", node => yExtent(node) + props.nodePadding);
    });
  }

  /**
   * Stacked Area component
   *
   * Stacked area charts are useful for showing how component parts contribute to a total quantity
   *
   * The stackedArea component uses a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout) under the hood,
   * so some of its configuration properties are similar. This component requires an array of layer objects,
   * where each layer object represents a layer in the stack.
   *
   * @module sszvis/component/stackedArea
   *
   * @property {function} x                      Accessor function to read *x*-values from the data. Should return a value in screen pixels.
   *                                             Used to figure out which values share a vertical position in the stack.
   * @property {function} yAccessor              Accessor function to read raw *y*-values from the data. Should return a value which is in data-units,
   *                                             not screen pixels. The results of this function are used to compute the stack, and they are then
   *                                             passed into the yScale before display.
   * @property {function} yScale                 A y-scale for determining the vertical position of data quantities. Used to compute the
   *                                             bottom and top lines of the stack.
   * @property {string, function} fill           String or accessor function for the area fill. Passed a layer object.
   * @property {string, function} stroke         String or accessor function for the area stroke. Passed a layer object.
   * @property {function} key                    Specify a key function for use in the data join. The value returned by the key should be unique
   *                                             among stacks. This option is particularly important when creating a chart which transitions
   *                                             between stacked and separated views.
   * @property {function} valuesAccessor         Specify an accessor for the values of the layer objects. The default treats the layer object
   *                                             as an array of values. Use this if your layer objects should be treated as something other than
   *                                             arrays of values.
   *
   * @return {sszvis.component}
   */

  function stackedArea () {
    return component().prop("x").prop("y0").prop("y1").prop("fill").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((d, i) => i).prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const defaultDefined = function () {
        return compose(not(isNaN), props.y0) && compose(not(isNaN), props.y1);
      };
      const areaGen = d3.area().defined(props.defined === undefined ? defaultDefined : props.defined).x(props.x).y0(props.y0).y1(props.y1);
      let paths = selection.selectAll("path.sszvis-path").data(data, props.key).join("path").classed("sszvis-path", true);
      if (props.transition) {
        paths = paths.transition(defaultTransition());
      }
      paths.attr("d", areaGen).attr("fill", props.fill).attr("stroke", props.stroke || "#ffffff").attr("stroke-width", props.strokeWidth === undefined ? 1 : props.strokeWidth);
    });
  }

  /**
   * Stacked Area Multiples component
   *
   * This component, like stackedArea, requires an array of layer objects, where each layer object is one of the multiples.
   * In addition to stackedArea, this chart's layers can be separated to provide two views on the data: a sum of all
   * elements as well as every element on its own.
   *
   * @module sszvis/component/stackedAreaMultiples
   *
   * @property {number, function} x             Accessor function for the *x*-values. Passed a data object and should return a value
   *                                            in screen pixels.
   * @property {number, function} y0            Accessor function for the *y0*-value (the baseline of the area). Passed a data object
   *                                            and should return a value in screen pixels.
   * @property {number, function} y1            Accessor function for the *y1*-value (the top line of the area). Passed a data object
   *                                            and should return a value in screen pixels.
   * @property {string, function} fill          Accessor function for the area fill. Passed a layer object.
   * @property {string, function} stroke        Accessor function for the area stroke. Passed a layer object.
   * @property {function} key                   Specify a key function for use in the data join. The value returned by the key should
   *                                            be unique among stacks. This option is particularly important when creating a chart
   *                                            which transitions between stacked and separated views.
   * @property {function} valuesAccessor        Specify an accessor for the values of the layer objects. The default treats the layer object
   *                                            as an array of values. Use this if your layer objects should be treated as something other than
   *                                            arrays of values.
   *
   * @return {sszvis.component}
   */

  function stackedAreaMultiples () {
    return component().prop("x").prop("y0").prop("y1").prop("fill").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((d, i) => i).prop("valuesAccessor").valuesAccessor(identity$1).prop("transition").transition(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      //sszsch why reverse?
      data = [...data].reverse();
      const defaultDefined = function () {
        return compose(not(isNaN), props.y0) && compose(not(isNaN), props.y1);
      };
      const areaGen = d3.area().defined(props.defined === undefined ? defaultDefined : props.defined).x(props.x).y0(props.y0).y1(props.y1);
      const paths = selection.selectAll("path.sszvis-path").data(data, props.key).join("path").classed("sszvis-path", true);
      if (props.transition) {
        paths.transition(defaultTransition());
      }
      paths.attr("d", compose(areaGen, props.valuesAccessor)).attr("fill", props.fill).attr("stroke", props.stroke).attr("stroke-width", props.strokeWidth === undefined ? 1 : props.strokeWidth);
    });
  }

  /**
   * Stacked Bar component
   *
   * This component includes both the vertical and horizontal stacked bar chart components.
   * Both are constiations on the same concept, and they both use the same abstract intermediate
   * representation for the stack, but are rendered using different dimensions. Note that using
   * this component will add the properties 'y0' and 'y' to any passed-in data objects, as part of
   * computing the stack intermediate representation. Existing properties with these names will be
   * overwritten.
   *
   * @module sszvis/component/stackedBar/horizontal
   * @module sszvis/component/stackedBar/vertical
   *
   * @property {function} xAccessor           Specifies an x-accessor for the stack layout. The result of this function
   *                                          is used to compute the horizontal extent of each element in the stack.
   *                                          The return value must be a number.
   * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
   *                                          the elements of each stack, both the left offset value and the width of each stack segment.
   * @property {number, function} width       Specifies a width for the bars in the stack layout. This value is not used in the
   *                                          horizontal orientation. (xScale is used instead).
   * @property {function} yAccessor           The y-accessor. The return values of this function are used to group elements together as stacks.
   * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
   * @property {number, function} height      Specify the height of each rectangle. This value determines the height of each element in the stacks.
   * @property {string, function} fill        Specify a fill value for the rectangles (default black).
   * @property {string, function} stroke      Specify a stroke value for the stack rectangles (default none).
   * @property {string} orientation           Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart.
   *                                          Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.
   *
   * @return {sszvis.component}
   */

  const stackAcc = prop("stack");

  // Accessors for the first and second element of a tuple (2-element array).
  const fst = prop("0");
  const snd = prop("1");
  function stackedBarData(order) {
    return function (_stackAcc, seriesAcc, valueAcc) {
      return function (data) {
        const rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);

        // Collect all keys ()
        const keys = rows.reduce((a, row) => set$1([...a, ...Object.keys(row)]), []);
        const stacks = d3.stack().keys(keys).value((x, key) => valueAcc(x[key][0])).order(order)(rows);

        // Simplify the 'data' property.
        for (const stack of stacks) {
          for (const d of stack) {
            d.series = stack.key;
            d.data = d.data[stack.key][0];
            d.stack = _stackAcc(d.data);
          }
        }
        stacks.keys = keys;
        stacks.maxValue = d3.max(stacks, stack => d3.max(stack, d => d[1]));
        return stacks;
      };
    };
  }
  const stackedBarHorizontalData = stackedBarData(d3.stackOrderNone);
  const stackedBarVerticalData = stackedBarData(d3.stackOrderReverse);
  function stackedBar(config) {
    return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const barGen = bar().x(config.x(props)).y(config.y(props)).width(config.width(props)).height(config.height(props)).fill(props.fill).stroke(props.stroke || "#FFFFFF");
      const groups = selection.selectAll(".sszvis-stack").data(data).join("g").classed("sszvis-stack", true);
      groups.call(barGen);
    });
  }
  const horizontalStackedBarConfig = {
    x(props) {
      return compose(props.xScale, fst);
    },
    y(props) {
      return compose(props.yScale, stackAcc);
    },
    width(props) {
      return function (d) {
        return props.xScale(d[1]) - props.xScale(d[0]);
      };
    },
    height(props) {
      return props.height;
    }
  };
  const stackedBarHorizontal = function () {
    return stackedBar(horizontalStackedBarConfig);
  };
  const verticalStackedBarConfig = {
    x(props) {
      return compose(props.xScale, stackAcc);
    },
    y(props) {
      return compose(props.yScale, snd);
    },
    width(props) {
      return props.width;
    },
    height(props) {
      return function (d) {
        return props.yScale(d[0]) - props.yScale(d[1]);
      };
    }
  };
  const stackedBarVertical = function () {
    return stackedBar(verticalStackedBarConfig);
  };

  /**
   * Stacked Pyramid component
   *
   * The pyramid component is primarily used to show a distribution of age groups
   * in a population (population pyramid). The chart is mirrored vertically,
   * meaning that it has a horizontal axis that extends in a positive and negative
   * direction having the same domain.
   *
   * This chart's horizontal point of origin is at it's spine, i.e. the center of
   * the chart.
   *
   * @module sszvis/component/stackedPyramid
   *
   * @requires sszvis.component.bar
   *
   * @property {number, d3.scale} [barFill]          The color of a bar
   * @property {number, d3.scale} barHeight          The height of a bar
   * @property {number, d3.scale} barWidth           The width of a bar
   * @property {number, d3.scale} barPosition        The vertical position of a bar
   * @property {Array<number, number>} tooltipAnchor The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
   *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
   *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars
   * @property {function}         leftAccessor       Data for the left side
   * @property {function}         rightAccessor      Data for the right side
   * @property {function}         [leftRefAccessor]  Reference data for the left side
   * @property {function}         [rightRefAccessor] Reference data for the right side
   *
   * @return {sszvis.component}
   */


  /* Constants
  ----------------------------------------------- */
  const SPINE_PADDING = 0.5;
  const dataAcc = prop("data");
  const rowAcc = prop("row");

  /**
   * This function prepares the data for the stackedPyramid component
   *
   * The input data is expected to have at least four columns:
   *
   *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
   *  - row: determines on which row (vertical position) the value goes.
   *  - series: determines in which series (for the stack) the value is.
   *  - value: the numerical value.
   *
   * The combination of each distinct (side,row,series) triplet MUST appear only once
   * in the data. This function makes no effort to normalize the data if that's not the case.
   */
  function stackedPyramidData(sideAcc, _rowAcc, seriesAcc, valueAcc) {
    return function (data) {
      const sides = cascade().arrayBy(sideAcc).arrayBy(_rowAcc).objectBy(seriesAcc).apply(data).map(rows => {
        const keys = Object.keys(rows[0]);
        const side = sideAcc(rows[0][keys[0]][0]);
        const stacks = d3.stack().keys(keys).value((x, key) => valueAcc(x[key][0]))(rows);
        for (const [i, stack] of stacks.entries()) {
          for (const [row, d] of stack.entries()) {
            d.data = d.data[keys[i]][0];
            d.series = keys[i];
            d.side = side;
            d.row = row;
            d.value = valueAcc(d.data);
          }
        }
        return stacks;
      });

      // Compute the max value, for convenience. This value is needed to construct
      // the horizontal scale.
      sides.maxValue = d3.max(sides, side => d3.max(side, rows => d3.max(rows, row => row[1])));
      return sides;
    };
  }

  /* Module
  ----------------------------------------------- */
  function stackedPyramid() {
    return component().prop("barHeight", functor).prop("barWidth", functor).prop("barPosition", functor).prop("barFill", functor).barFill("#000").prop("tooltipAnchor").tooltipAnchor([0.5, 0.5]).prop("leftAccessor").prop("rightAccessor").prop("leftRefAccessor").prop("rightRefAccessor").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // Components

      const leftBar = bar().x(d => -SPINE_PADDING - props.barWidth(d[1])).y(compose(props.barPosition, rowAcc)).height(props.barHeight).width(d => props.barWidth(d[1]) - props.barWidth(d[0])).fill(compose(props.barFill, dataAcc)).tooltipAnchor(props.tooltipAnchor);
      const rightBar = bar().x(d => SPINE_PADDING + props.barWidth(d[0])).y(compose(props.barPosition, rowAcc)).height(props.barHeight).width(d => props.barWidth(d[1]) - props.barWidth(d[0])).fill(compose(props.barFill, dataAcc)).tooltipAnchor(props.tooltipAnchor);
      const leftStack = stackComponent().stackElement(leftBar);
      const rightStack = stackComponent().stackElement(rightBar);
      const leftLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth).mirror(true);
      const rightLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth);

      // Rendering

      selection.selectGroup("leftStack").datum(props.leftAccessor(data)).call(leftStack);
      selection.selectGroup("rightStack").datum(props.rightAccessor(data)).call(rightStack);
      selection.selectGroup("leftReference").datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : []).call(leftLine);
      selection.selectGroup("rightReference").datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : []).call(rightLine);
    });
  }
  function stackComponent() {
    return component().prop("stackElement").renderSelection(selection => {
      const datum = selection.datum();
      const props = selection.props();
      const stack = selection.selectAll("[data-sszvis-stack]").data(datum).join("g").attr("data-sszvis-stack", "");
      stack.each(function (d) {
        d3.select(this).datum(d).call(props.stackElement);
      });
    });
  }
  function lineComponent() {
    return component().prop("barPosition").prop("barWidth").prop("mirror").mirror(false).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const lineGen = d3.line().x(props.barWidth).y(props.barPosition);
      const line = selection.selectAll(".sszvis-path").data(data).join("path").attr("class", "sszvis-path").attr("fill", "none").attr("stroke", "#aaa").attr("stroke-width", 2).attr("stroke-dasharray", "3 3");
      line.attr("transform", props.mirror ? "scale(-1, 1)" : "").transition(defaultTransition()).attr("d", lineGen);
    });
  }

  /**
   * Sunburst component
   *
   * This component renders a sunburst diagram, which is kind of like a layered pie chart. There is an
   * inner ring of values, which are total values for some large category. Each of these categories can
   * be broken down into smaller categories, which are shown in another layer around the inner ring. If these
   * categories can in turn be broken down into smaller ones, you can add yet another layer. The result
   * is a hierarchical display with the level of aggregation getting finer and finer as you get further
   * from the center of the chart.
   *
   * This component uses the data structure returned by the sszvis.layout.sunbust.prepareData function, and
   * can be configured using the sszvis.layout.sunburst.computeLayout function. Under the hood, the prepareData
   * function uses d3's nest data transformer (d3.nest) to construct a nested data structure from the input
   * array, and d3's partition layout (d3.layout.partition), and the resulting data structure will be
   * familiar to those familiar with the partition layout.
   *
   * @property {Function} angleScale              Scale function for the angle of the segments of the sunburst chart. If using the
   *                                              sszvis.layout.sunburst.prepareData function, the domain will be [0, 1]. The range
   *                                              should usually be [0, 2 * PI]. That domain and range are used as default for this property.
   * @property {Function} radiusScale             Scale function for the radius of segments. Can be configured using values returned from
   *                                              sszvis.layout.sunburst.computeLayout. See the examples for how the scale setup works.
   * @property {Number} centerRadius              The radius of the center of the chart. Can be configured with sszvis.layout.sunburst.computeLayout.
   * @property {Function} fill                    Function that returns the fill color for the segments in the center of the chart. Note that this will only be
   *                                              called on the centermost segments. The segments which are subcategories of these center segments
   *                                              will have their fill determined recursively, by lightening the color of its parent segment.
   * @property {Color, Function} stroke           The stroke color of the segments. Defaults to white.
   *
   * @return {sszvis.component}
   */

  const TWO_PI = 2 * Math.PI;
  function sunburst () {
    return component().prop("angleScale").angleScale(d3.scaleLinear().range([0, 2 * Math.PI])).prop("radiusScale").prop("centerRadius").prop("fill").prop("stroke").stroke("white").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
      function getColorRecursive(node) {
        // Center node (if the data were prepared using sszvis.layout.sunburst.prepareData)
        if (node.data.isSunburstRoot) {
          return "transparent";
        } else if (!node.parent) {
          // Accounts for incorrectly formatted data which hasn't gone through sszvis.layout.sunburst.prepareData
          warn("Data passed to sszvis.component.sunburst does not have the expected tree structure. You should prepare it using sszvis.format.sunburst.prepareData");
          return d3.hsl(props.fill(node.data.key));
        } else if (node.parent.data.isSunburstRoot) {
          // Use the color scale
          return d3.hsl(props.fill(node.data.key));
        } else {
          // Recurse up the tree and adjust the lightness value
          const pColor = getColorRecursive(node.parent);
          pColor.l *= 1.15;
          return pColor;
        }
      }
      const startAngle = function (d) {
        return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x0)));
      };
      const endAngle = function (d) {
        return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x1)));
      };
      const innerRadius = function (d) {
        return props.centerRadius + Math.max(0, props.radiusScale(d.y0));
      };
      const outerRadius = function (d) {
        return props.centerRadius + Math.max(0, props.radiusScale(d.y1));
      };
      const arcGen = d3.arc().startAngle(startAngle).endAngle(endAngle).innerRadius(innerRadius).outerRadius(outerRadius);
      for (const d of data) {
        // _x and _dx are the destination values for the transition.
        // We set these to the computed x and dx.
        d._x0 = d.x0;
        d._x1 = d.x1;
      }
      const arcs = selection.selectAll(".sszvis-sunburst-arc").each((d, i) => {
        if (data[i]) {
          // x and dx are the current/transitioning values
          // We set these here, in case any datums already exist which have values set
          data[i].x0 = d.x0;
          data[i].x1 = d.x1;
          // The transition tweens from x and dx to _x and _dx
        }
      }).data(data).join("path").attr("class", "sszvis-sunburst-arc");
      arcs.attr("stroke", props.stroke).attr("fill", getColorRecursive);
      arcs.transition(defaultTransition()).attrTween("d", d => {
        const x0Interp = d3.interpolate(d.x0, d._x0);
        const x1Interp = d3.interpolate(d.x1, d._x1);
        return function (t) {
          d.x0 = x0Interp(t);
          d.x1 = x1Interp(t);
          return arcGen(d);
        };
      });

      // Add tooltip anchors
      const arcTooltipAnchor = tooltipAnchor().position(d => {
        const startA = startAngle(d);
        const endA = endAngle(d);
        const a = startA + Math.abs(endA - startA) / 2 - Math.PI / 2;
        const r = (innerRadius(d) + outerRadius(d)) / 2;
        return [Math.cos(a) * r, Math.sin(a) * r];
      });
      selection.call(arcTooltipAnchor);
    });
  }

  /**
   * Nested Stacked Bars Vertical component
   *
   * This component renders a nested stacked bar chart with vertical orientation.
   * It uses the same abstract intermediate representation for the stack, but is rendered
   * using vertical dimensions. Note that using this component will add the properties 'y0'
   * and 'y' to any passed-in data objects, as part of computing the stack intermediate representation.
   * Existing properties with these names will be overwritten.
   *
   * @module sszvis/component/nestedStackedBarsVertical
   *
   * @property {function} offset              Specifies an offset function for positioning the nested groups.
   * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
   *                                          the elements of each stack, both the left offset value and the width of each stack segment.
   * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
   * @property {function} fill                Specify a fill value for the rectangles (default black).
   * @property {function} tooltip             Specify a tooltip function for the rectangles.
   * @property {function} xAcc                Specifies an x-accessor for the stack layout. The result of this function
   *                                          is used to compute the horizontal extent of each element in the stack.
   *                                          The return value must be a number.
   * @property {function} xLabel              Specifies a label for the x-axis.
   * @property {string} slant                 Specifies the slant of the x-axis labels.
   *
   * @return {sszvis.component}
   */

  const nestedStackedBarsVertical = () => component().prop("offset", functor).prop("xScale", functor).prop("yScale", functor).prop("fill", functor).prop("tooltip", functor).prop("xAcc", functor).prop("xLabel", functor).prop("xLabel", functor).prop("slant").render(function (data) {
    const selection = d3.select(this);
    const props = selection.props();
    const {
      offset,
      xScale,
      yScale,
      fill,
      tooltip,
      xAcc,
      xLabel
    } = props;
    const xAxis = axisX.ordinal().scale(xScale).ticks(1).tickSize(0).orient("bottom").slant(props.slant).title(xLabel);
    const group = selection.selectAll("[data-nested-stacked-bars]").data(data);
    const nestedGroups = group.join("g").attr("data-nested-stacked-bars", d => xAcc(d[0][0].data));
    nestedGroups.attr("transform", d => "translate(".concat(offset(d), " 0)"));
    nestedGroups.selectGroup("nested-x-axis").attr("transform", translateString(0, yScale(0))).call(xAxis);
    const stackedBars = stackedBarVertical().xScale(xScale).width(xScale.bandwidth()).yScale(yScale).fill(fill);
    const bars = nestedGroups.selectGroup("barchart").call(stackedBars);
    bars.selectAll("[data-tooltip-anchor]").call(tooltip);
  });

  /**
   * Button Group control
   *
   * Control for switching top-level filter values. Use this control for changing between several
   * options which affect the state of the chart. This component should be rendered into an html layer.
   *
   * This control is part of the `optionSelectable` class of controls and can be used interchangeably
   * with other controls of this class (sszvis.control.select).
   *
   * @module sszvis/control/buttonGroup
   *
   * @property {array} values         an array of values which are the options available in the control. Each one will become a button
   * @property {any} current          the current value of the button group. Should be one of the options passed to .values()
   * @property {number} width         The total width of the button group. Each option will have 1/3rd of this width. (default: 300px)
   * @property {function} change      A callback/event handler function to call when the user clicks on a value.
   *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
   *
   * @return {sszvis.component}
   */

  function buttonGroup () {
    return component().prop("values").prop("current").prop("width").width(300).prop("change").change(identity$1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const buttonWidth = props.width / props.values.length;
      const container = selection.selectAll(".sszvis-control-optionSelectable").data(["sszvis-control-buttonGroup"], d => d).join("div").classed("sszvis-control-optionSelectable", true).classed("sszvis-control-buttonGroup", true);
      container.style("width", props.width + "px");
      const buttons = container.selectAll(".sszvis-control-buttonGroup__item").data(props.values).join("div").classed("sszvis-control-buttonGroup__item", true);
      buttons.style("width", buttonWidth + "px").classed("selected", d => d === props.current).text(d => d).on("click", props.change);
    });
  }

  /**
   * Ruler with a handle control
   *
   * The handle ruler component is very similar to the ruler component, except that it is rendered
   * with a 24-pixel tall handle at the top. It is moved and repositioned in the same manner as a ruler,
   * so the actual interaction with the handle is up to the developer to specify. This component also
   * creates dots for each data point it finds bound to its layer.
   *
   * @module sszvis/control/handleRuler
   *
   * @property {function} x                   A function or number which determines the x-position of the ruler
   * @property {function} y                   A function which determines the y-position of the ruler dots. Passed data values.
   * @property {number} top                   A number for the y-position of the top of the ruler.
   * @property {number} bottom                A number for the y-position of the bottom of the ruler.
   * @property {string, function} label       A string or string function for the labels of the ruler dots.
   * @property {string, function} color       A string or color for the fill color of the ruler dots.
   * @property {boolean, function} flip       A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)
   *
   * @returns {sszvis.component}
   */

  function handleRuler () {
    return component().prop("x", functor).prop("y", functor).prop("top").prop("bottom").prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // Elements need to be placed on half-pixels in order to be rendered
      // crisply across browsers. That's why we create this position accessor
      // here that takes a datum as input, reads out its value (props.x) and
      // then rounds this pixel value to half pixels (1px -> 1.5px, 1.2px -> 1.5px)
      const crispX = compose(halfPixel, props.x);
      const crispY = compose(halfPixel, props.y);
      const bottom = props.bottom - 4;
      const handleWidth = 10;
      const handleHeight = 24;
      const handleTop = props.top - handleHeight;
      const group = selection.selectAll(".sszvis-handleRuler__group").data([0]).join("g").classed("sszvis-handleRuler__group", true);
      group.append("line").classed("sszvis-ruler__rule", true);
      group.append("rect").classed("sszvis-handleRuler__handle", true);
      group.append("line").classed("sszvis-handleRuler__handle-mark", true);
      group.selectAll(".sszvis-ruler__rule").attr("x1", crispX).attr("y1", halfPixel(props.top)).attr("x2", crispX).attr("y2", halfPixel(bottom));
      group.selectAll(".sszvis-handleRuler__handle").attr("x", d => crispX(d) - handleWidth / 2).attr("y", halfPixel(handleTop)).attr("width", handleWidth).attr("height", handleHeight).attr("rx", 2).attr("ry", 2);
      group.selectAll(".sszvis-handleRuler__handle-mark").attr("x1", crispX).attr("y1", halfPixel(handleTop + handleHeight * 0.15)).attr("x2", crispX).attr("y2", halfPixel(handleTop + handleHeight * 0.85));
      const dots = group.selectAll(".sszvis-ruler__dot").data(data).join("circle").classed("sszvis-ruler__dot", true);
      dots.attr("cx", crispX).attr("cy", crispY).attr("r", 3.5).attr("fill", props.color);
      selection.selectAll(".sszvis-ruler__label-outline").data(data).join("text").classed("sszvis-ruler__label-outline", true);
      selection.selectAll(".sszvis-ruler__label").data(data).join("text").classed("sszvis-ruler__label", true);

      // Update both labelOutline and labelOutline selections

      selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
        const x = compose(halfPixel, props.x)(d);
        const y = compose(halfPixel, props.y)(d);
        const dx = props.flip(d) ? -10 : 10;
        const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;
        return translateString(x + dx, y + dy);
      }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(props.label);
    });
  }

  /**
   * Select control
   *
   * Control for switching top-level filter values. Use this control for changing between several
   * options which affect the state of the chart. This component should be rendered into an html layer.
   *
   * This control is part of the `optionSelectable` class of controls and can be used interchangeably
   * with other controls of this class (sszvis.control.buttonGroup).
   *
   * @module sszvis/control/select
   *
   * @property {array} values         an array of values which are the options available in the control.
   * @property {any} current          the currently selected value of the select control. Should be one of the options passed to .values()
   * @property {number} width         The total width of the select control. If text labels exceed this width they will be trimmed to fit using an ellipsis mark. (default: 300px)
   * @property {function} change      A callback/event handler function to call when the user clicks on a value.
   *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
   *
   * @return {sszvis.component}
   */

  function select () {
    return component().prop("values").prop("current").prop("width").width(300).prop("change").change(identity$1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const wrapperEl = selection.selectAll(".sszvis-control-optionSelectable").data(["sszvis-control-select"], d => d).join("div").classed("sszvis-control-optionSelectable", true).classed("sszvis-control-select", true);
      wrapperEl.style("width", props.width + "px");
      const metricsEl = wrapperEl.selectDiv("selectMetrics").classed("sszvis-control-select__metrics", true);
      const selectEl = wrapperEl.selectAll(".sszvis-control-select__element").data([1]).join("select").classed("sszvis-control-select__element", true).on("change", function (e) {
        // We store the index in the select's value instead of the datum
        // because an option's value can only hold strings.
        const i = d3.select(this).property("value");
        props.change(e, props.values[i]);
        // Prevent highlights on the select element after users have selected
        // an option by moving away from it.
        setTimeout(() => {
          window.focus();
        }, 0);
      });
      selectEl.style("width", props.width + 30 + "px");
      selectEl.selectAll("option").data(props.values).join("option").attr("selected", d => d === props.current ? "selected" : null).attr("value", (d, i) => i).text(d => truncateToWidth(metricsEl, props.width - 40, d));
    });
  }
  function truncateToWidth(metricsEl, maxWidth, originalString) {
    const MAX_RECURSION = 1000;
    const fitText = function (str, i) {
      metricsEl.text(str);
      const textWidth = Math.ceil(metricsEl.node().clientWidth);
      return i < MAX_RECURSION && textWidth > maxWidth ? fitText(str.slice(0, -2) + "…", i + 1) : str;
    };
    return fitText(originalString, 0);
  }

  /**
   * Slider control
   *
   * Control for use in filtering. Works very much like an interactive axis.
   * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
   * select values on that scale. Ticks created using an sszvis.axis show the user where
   * data values lie.
   *
   * @module  sszvis/control/slider
   *
   * @property {function} scale                 A scale function which this slider represents. The values in the scale's domain
   *                                            are used as the possible values of the slider.
   * @property {array} minorTicks               An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis
   * @property {array} majorTicks               An array of ticks which become major (larger and labeled) ticks on the slider's axis
   * @property {function} tickLabels            A function to use to format the major tick labels.
   * @property {any} value                      The current value of the slider. Should be set whenever slider interaction causes the state to change.
   * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
   * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
   *                                            Note that this component will not change its own state. The callback function must affect some state change
   *                                            in order for this component's display to be updated.
   *
   * @returns {sszvis.component}
   */

  function contains(x, a) {
    return a.includes(x);
  }
  function slider () {
    return component().prop("scale").prop("value").prop("onchange").prop("minorTicks").minorTicks([]).prop("majorTicks").majorTicks([]).prop("tickLabels", functor).tickLabels(identity$1).prop("label", functor).label(identity$1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const axisOffset = 28; // vertical offset for the axis
      const majorTickSize = 12;
      const backgroundOffset = halfPixel(18); // vertical offset for the middle of the background
      const handleWidth = 10; // the width of the handle
      const handleHeight = 23; // the height of the handle
      const bgWidth = 6; // the width of the background
      const lineEndOffset = bgWidth / 2; // the amount by which to offset the ends of the background line
      const handleSideOffset = handleWidth / 2 + 0.5; // the amount by which to offset the position of the handle

      const scaleDomain = props.scale.domain();
      const scaleRange = range(props.scale);
      const alteredScale = props.scale.copy().range([scaleRange[0] + handleSideOffset, scaleRange[1] - handleSideOffset]);

      // the mostly unchanging bits
      const bg = selection.selectAll("g.sszvis-control-slider__backgroundgroup").data([1]).join("g").classed("sszvis-control-slider__backgroundgroup", true);

      // create the axis
      const axis = axisX().scale(alteredScale).orient("bottom").hideBorderTickThreshold(0).tickSize(majorTickSize).tickPadding(6).tickValues(set$1([...props.majorTicks, ...props.minorTicks])).tickFormat(d => contains(d, props.majorTicks) ? props.tickLabels(d) : "");
      const axisSelection = bg.selectAll("g.sszvis-axisGroup").data([1]).join("g").classed("sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slider", true);
      axisSelection.attr("transform", translateString(0, axisOffset)).call(axis);

      // adjust visual aspects of the axis to fit the design
      axisSelection.selectAll(".tick line").filter(d => !contains(d, props.majorTicks)).attr("y2", 4);
      const majorAxisText = axisSelection.selectAll(".tick text").filter(d => contains(d, props.majorTicks));
      const numTicks = majorAxisText.size();
      majorAxisText.style("text-anchor", (d, i) => i === 0 ? "start" : i === numTicks - 1 ? "end" : "middle");

      // create the slider background
      const backgroundSelection = bg.selectAll("g.sszvis-slider__background").data([1]).join("g").classed("sszvis-slider__background", true).attr("transform", translateString(0, backgroundOffset));
      backgroundSelection.selectAll(".sszvis-slider__background__bg1").data([1]).join("line").classed("sszvis-slider__background__bg1", true).style("stroke-width", bgWidth).style("stroke", "#888").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", Math.floor(scaleRange[1] - lineEndOffset));
      backgroundSelection.selectAll(".sszvis-slider__background__bg2").data([1]).join("line").classed("sszvis-slider__background__bg2", true).style("stroke-width", bgWidth - 1).style("stroke", "#fff").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", Math.floor(scaleRange[1] - lineEndOffset));
      backgroundSelection.selectAll(".sszvis-slider__backgroundshadow").data([props.value]).join("line").attr("class", "sszvis-slider__backgroundshadow").attr("stroke-width", bgWidth - 1).style("stroke", "#E0E0E0").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + lineEndOffset)).attr("x2", compose(Math.floor, alteredScale));

      // draw the handle and the label
      const handle = selection.selectAll("g.sszvis-control-slider__handle").data([props.value]).join("g").classed("sszvis-control-slider__handle", true).attr("transform", d => translateString(halfPixel(alteredScale(d)), 0.5));
      handle.append("text").classed("sszvis-control-slider--label", true);
      handle.selectAll(".sszvis-control-slider--label").data(d => [d]).text(props.label).style("text-anchor", d => stringEqual(d, scaleDomain[0]) ? "start" : stringEqual(d, scaleDomain[1]) ? "end" : "middle").attr("dx", d => stringEqual(d, scaleDomain[0]) ? -(handleWidth / 2) : stringEqual(d, scaleDomain[1]) ? handleWidth / 2 : 0);
      handle.selectAll(".sszvis-control-slider__handlebox").data([1]).join("rect").classed("sszvis-control-slider__handlebox", true).attr("x", -(handleWidth / 2)).attr("y", backgroundOffset - handleHeight / 2).attr("width", handleWidth).attr("height", handleHeight).attr("rx", 2).attr("ry", 2);
      const handleLineDimension = handleHeight / 2 - 4; // the amount by which to offset the small handle line within the handle

      handle.selectAll(".sszvis-control-slider__handleline").data([1]).join("line").classed("sszvis-control-slider__handleline", true).attr("y1", backgroundOffset - handleLineDimension).attr("y2", backgroundOffset + handleLineDimension);
      const sliderInteraction = move().xScale(props.scale)
      // range goes from the text top (text is 11px tall) to the bottom of the axis
      .yScale(d3.scaleLinear().range([-11, axisOffset + majorTickSize])).draggable(true).on("drag", props.onchange);
      selection.selectGroup("sliderInteraction").classed("sszvis-control-slider--interactionLayer", true).attr("transform", translateString(0, 4)).call(sliderInteraction);
    });
  }

  /**
   * Factory that returns an HTML element appended to the given target selector,
   * ensuring that it is only created once, even when run again.
   *
   * Note on the 'key' property of the optional metadata object:
   *
   * The key argument is present so that we can have multiple layers of html content in the same container.
   * For example, let's imagine you want one html div under an svg, then an svg layer, then another div over the svg.
   * The reason we need a key for these layers is that the render function in all the example code is designed to be
   * idempotent - calling it multiple times with the same arguments leaves the app in the same state. Therefore, all
   * the functions within render also need to be idempotent. A straightforward implementation of "createHtmlLayer" would
   * return an existing layer if present, or create one and return it if it wasn't present. This prevents createHtmlLayer
   * from making a new html element every time it's called. In turn, that means that you can call render many times and
   * always expect the same result (idempotence). But it also means that if you call it multiple times within the same
   * render function, you don't get multiple html layers. So then you can't have one under the svg and one over.
   *
   * The key argument solves this problem. It says, "look for a div in the container which has the given key, and return
   * it if present. Otherwise, create one with that key and return it. This means that if you call createHtmlLayer
   * multiple times with the same key, only one element will be created, and you'll get it back on subsequent calls.
   * But if you call it multiple times with different keys, you'll get multiple different elements. So, when you do:
   *
   * createHtmlLayer(..., ..., { key: 'A' })
   * createSvgLayer(...)
   * createHtmlLayer(..., ..., { key: 'B' })
   *
   * Then you'll have the div-svg-div sandwich, but that sequence of function calls is still idempotent.
   * Note: createSvgLayer accepts an optional metadata object, with an optional key property, which works the same way.
   *
   * @module sszvis/createHtmlLayer
   *
   * @param {string|d3.selection} selector    CSS selector string which is used to grab the container object for the created layer
   * @param {d3.bounds} [bounds]              A bounds object which provides the dimensions and offset for the created layer
   * @param {object} metadata                 Metadata for this layer. Currently the only used option is:
   *   @property {string} key                 Used as a unique key for this layer. If you pass different values
   *                                          of key to this function, the app will create and return different layers
   *                                          for inserting HTML content. If you pass the same value (including undefined),
   *                                          you will always get back the same DOM element. For example, this is useful for
   *                                          adding an HTML layer under an SVG, and then adding one over the SVG.
   *                                          See the binned raster map for an example of using this effectively.
   *
   * @returns {d3.selection}
   */

  function createHtmlLayer(selector, bounds$1, metadata) {
    bounds$1 || (bounds$1 = bounds());
    metadata || (metadata = {});
    const key = metadata.key || "default";
    const elementDataKey = "data-sszvis-html-" + key;
    const root = isSelection(selector) ? selector : d3.select(selector);
    root.classed("sszvis-outer-container", true);
    return root.selectAll("[data-sszvis-html-layer][" + elementDataKey + "]").data([0]).join("div").classed("sszvis-html-layer", true).attr("data-sszvis-html-layer", "").attr(elementDataKey, "").style("position", "absolute").style("left", bounds$1.padding.left + "px").style("top", bounds$1.padding.top + "px");
  }

  /**
   * Factory that returns an SVG element appended to the given target selector,
   * ensuring that it is only created once, even when run again.
   *
   * @module sszvis/createSvgLayer
   *
   * @param {string|d3.selection} selector
   * @param {d3.bounds} bounds
   * @param {object} [metadata] Metadata for this chart. Can include any number of the following:
   *   @property {string} key Used as a unique key for this layer. If you pass different values
   *                          of key to this function, the app will create and return different layers.
   *                          If you pass the same value (including undefined), you will always get back
   *                          the same DOM element. This is useful for adding multiple SVG elements.
   *                          See the binned raster map for an example of using this effectively.
   *                          Note: For more information about this argument, see the detailed explanation in
   *                          the source code for createHtmlLayer.
   *
   * @returns {d3.selection}
   */

  function createSvgLayer(selector, bounds$1, metadata) {
    bounds$1 || (bounds$1 = bounds());
    metadata || (metadata = {});
    const key = metadata.key || "default";
    const elementDataKey = "data-sszvis-svg-" + key;
    const title = metadata.title || "";
    const description = metadata.description || "";
    const root = isSelection(selector) ? selector : d3.select(selector);
    const svg = root.selectAll("svg[" + elementDataKey + "]").data([0]).join("svg").classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img").attr("aria-label", title + " – " + description).attr("height", bounds$1.height).attr("width", bounds$1.width);
    svg.selectAll("title").data([0]).join("title").text(title);
    svg.selectAll("desc").data([0]).join("desc").text(description).classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img");
    return svg.selectAll("[data-sszvis-svg-layer]").data(() => [0]).join("g").attr("data-sszvis-svg-layer", "").attr("transform", "translate(" + bounds$1.padding.left + "," + bounds$1.padding.top + ")");
  }

  /**
   * Ordinal Color Scale Legend
   *
   * This component is used for creating a legend for a categorical color scale.
   *
   * @module sszvis/legend/ordinalColorScale
   *
   * @property {d3.scaleOrdinal()} scale         An ordinal scale which will be transformed into the legend.
   * @property {Number} rowHeight                 The height of the rows of the legend.
   * @property {Number} columnWidth               The width of the columns of the legend.
   * @property {Number} rows                      The target number of rows for the legend.
   * @property {Number} columns                    The target number of columns for the legend.
   * @property {String} orientation               The orientation (layout order) of the legend. should be either "horizontal" or "vertical". No default.
   * @property {Boolean} reverse                  Whether to reverse the order that categories appear in the legend. Default false
   * @property {Boolean} rightAlign               Whether to right-align the legend. Default false.
   * @property {Boolean} horizontalFloat          A true value changes the legend layout to the horizontal float version. Default false.
   * @property {Number} floatPadding              The amount of padding between elements in the horizontal float layout. Default 10px
   * @property {Number} floatWidth                The maximum width of the horizontal float layout. Default 600px
   *
   * The color legend works by iterating over the domain of the provided scale, and generating a legend entry for each
   * element in the domain. The entry consists of a label giving the category, and a circle colored with the category's
   * corresponding color. When props.rightAlign is false (the default), the circle comes before the name. When rightAlign
   * is true, the circle comes afterwards. The layout of these labels is governed by the other parameters.
   *
   * Default Layout:
   *
   * Because the labels are svg elements positioned with translate (and do not use the html box model layout algorithm),
   * rowHeight is necessary to provide the vertical height of each row. Generally speaking, 20px is fine for the default text size.
   * In the default layout, labels are organized into rows and columns in a gridded fashion. columnWidth is the total width of
   * any resulting columns. Note that if there is only one column, columnWidth is irrelevant.
   *
   * There are two orientation options for the row/column layout. The 'horizontal' orientation lays out elements from the input
   * domain into rows, creating new rows as necessary. For example, with three columns, the first three elements will form
   * the top row, then the next three in the second row, and so on. With 'vertical' orientation, labels are stacked into a column,
   * and new columns are added as necessary to hold all of the elements. Therefore, in the 'horizontal' orientation, the number of columns
   * is key, as this determines when a row ends and a new row begins. In the 'vertical' layout, the number of rows determines when to start
   * a new column.
   *
   * For the input set { A, B, C, D, E, F, G }
   *
   * Horizontal Orientation (3 columns):
   *
   *      A    B    C
   *      D    E    F
   *      G
   *
   * Horizontal Orientation (2 columns):
   *
   *     A    B
   *     C    D
   *     E    F
   *     G
   *
   * Vertical Orientation (3 rows):
   *
   *      A    D    G
   *      B    E
   *      C    F
   *
   * Vertical Orientation (2 rows):
   *
   *      A    C    E    G
   *      B    D    F
   *
   * If reverse is true, items from the input domain will be added to the layout in reversed order.
   *
   * For example, Horizontal Orientation (4 columns, reverse = true):
   *
   *    G    F    E    D
   *    C    B    A
   *
   * Horizontal Float Layout:
   *
   * If horizontalFloat is true, a different layout entirely is used, which relies on the width of each element
   * to compute the position of the next one. This layout always proceeds left-to-right first, then top-to-bottom
   * if the floatWidth would be exceeded by a new element. Between each element is an amount of padding configurable
   * using the floatPadding property.
   *
   * For the input set { foo, bar, qux, fooBar, baz, fooBarBaz, fooBaz, barFoo }
   *
   * Horizontal Float Layout (within a floatWidth identified by vertical pipes,
   * with 4 spaces of floatPadding).
   *
   * |foo    bar    qux|
   * |fooBar    baz    |      <--- not enough space for fooBarBaz
   * |fooBarBaz        |      <--- not enough space for padding + fooBaz
   * |fooBaz    barFoo |
   */

  const DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = 21;
  function legendColorOrdinal() {
    return component().prop("scale").prop("rowHeight").rowHeight(DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT).prop("columnWidth").columnWidth(200).prop("rows").rows(3).prop("columns").columns(3).prop("verticallyCentered").verticallyCentered(false).prop("orientation").prop("reverse").reverse(false).prop("rightAlign").rightAlign(false).prop("horizontalFloat").horizontalFloat(false).prop("floatPadding").floatPadding(20).prop("floatWidth").floatWidth(600).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      let domain = props.scale.domain();
      if (props.reverse) {
        domain = [...domain].reverse();
      }
      let rows, cols;
      if (props.orientation === "horizontal") {
        cols = Math.ceil(props.columns);
        rows = Math.ceil(domain.length / cols);
      } else if (props.orientation === "vertical") {
        rows = Math.ceil(props.rows);
        cols = Math.ceil(domain.length / rows);
      }
      const groups = selection.selectAll(".sszvis-legend--entry").data(domain).join("g").classed("sszvis-legend--entry", true);
      groups.selectAll(".sszvis-legend__mark").data(d => [d]).join("circle").classed("sszvis-legend__mark", true).attr("cx", props.rightAlign ? -6 : 6).attr("cy", halfPixel(props.rowHeight / 2)).attr("r", 5).attr("fill", d => props.scale(d)).attr("stroke", d => props.scale(d)).attr("stroke-width", 1);
      groups.selectAll(".sszvis-legend__label").data(d => [d]).join("text").classed("sszvis-legend__label", true).text(d => d).attr("dy", "0.35em") // vertically-center
      .style("text-anchor", () => props.rightAlign ? "end" : "start").attr("transform", () => {
        const x = props.rightAlign ? -18 : 18;
        const y = halfPixel(props.rowHeight / 2);
        return translateString(x, y);
      });
      let verticalOffset = "";
      if (props.verticallyCentered) {
        verticalOffset = "translate(0," + String(-(domain.length * props.rowHeight / 2)) + ") ";
      }
      if (props.horizontalFloat) {
        let rowPosition = 0,
          horizontalPosition = 0;
        groups.attr("transform", function () {
          // not affected by scroll position
          const width = this.getBoundingClientRect().width;
          if (horizontalPosition + width > props.floatWidth) {
            rowPosition += props.rowHeight;
            horizontalPosition = 0;
          }
          const translate = translateString(horizontalPosition, rowPosition);
          horizontalPosition += width + props.floatPadding;
          return verticalOffset + translate;
        });
      } else {
        groups.attr("transform", (d, i) => {
          if (props.orientation === "horizontal") {
            return verticalOffset + "translate(" + i % cols * props.columnWidth + "," + Math.floor(i / cols) * props.rowHeight + ")";
          } else if (props.orientation === "vertical") {
            return verticalOffset + "translate(" + Math.floor(i / rows) * props.columnWidth + "," + i % rows * props.rowHeight + ")";
          }
        });
      }
    });
  }

  const DEFAULT_COLUMN_COUNT = 2;
  const LABEL_PADDING = 40;

  /**
   * colorLegendLayout
   *
   * Generate a color scale and a legend for the given labels. Compute how much
   * padding labels plus legend needs for use with `sszvis.bounds()`
   */
  function colorLegendLayout(_ref, container) {
    let {
      legendLabels,
      axisLabels = [],
      slant = "horizontal"
    } = _ref;
    const containerWidth = measureDimensions(container).width;
    const layout = colorLegendDimensions(legendLabels, containerWidth);
    const scale = legendLabels.length > 6 ? scaleQual12().domain(legendLabels) : scaleQual6().domain(legendLabels);
    const legend = legendColorOrdinal().scale(scale).horizontalFloat(layout.horizontalFloat).rows(layout.rows).columnWidth(layout.columnWidth).orientation(layout.orientation);
    const axisLabelPadding = axisLabelHeight(slant, axisLabels);
    const legendPadding = layout.rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;
    return {
      axisLabelPadding,
      legendPadding,
      bottomPadding: axisLabelPadding + legendPadding,
      legendWidth: layout.legendWidth,
      legend,
      scale
    };
  }

  /**
   * colorLegendDimensions
   *
   * Compute all the dimensions necessary to generate an ordinal color legend.
   */
  function colorLegendDimensions(labels, containerWidth) {
    const labelCount = labels.length;
    const maxLabelWidth = d3.max(labels, labelWidth);
    const totalLabelsWidth = d3.sum(labels, labelWidth);

    // Use a single column for four or fewer items
    const columns = labelCount <= 4 ? 1 : numCols(containerWidth, maxLabelWidth, DEFAULT_COLUMN_COUNT);

    // Use a horizontal layout if all labels fit on one line
    const isHorizontal = columns === 1 && totalLabelsWidth <= containerWidth;
    return {
      columns,
      rows: isHorizontal ? 1 : Math.ceil(labelCount / columns),
      columnWidth: columns === 1 ? null : maxLabelWidth,
      legendWidth: columns * maxLabelWidth,
      horizontalFloat: isHorizontal,
      orientation: isHorizontal ? null : "vertical"
    };
  }

  // -----------------------------------------------------------------------------
  // Helpers

  function axisLabelHeight(slant, labels) {
    switch (slant) {
      case "vertical":
        {
          return 40 + d3.max(labels, measureAxisLabel);
        }
      case "diagonal":
        {
          return 40 + Math.sqrt(2 * Math.pow(d3.max(labels, measureAxisLabel) / 2, 2));
        }
      default:
        {
          return 60;
        }
    }
  }
  function labelWidth(label) {
    return measureLegendLabel(label) + LABEL_PADDING;
  }
  function numCols(totalWidth, columnWidth, num) {
    return num <= 1 ? 1 : columnWidth <= totalWidth / num ? num : numCols(totalWidth, columnWidth, num - 1);
  }

  /**
   * Heat Table Dimensions
   *
   * Utility function for calculating different demensions in the heat table
   *
   * @module sszvis/layout/heatTableDimensions
   *
   * @param  {Number} spaceWidth   the total available width for the heat table within its container
   * @param  {Number} squarePadding the padding, in pixels, between squares in the heat table
   * @param  {Number} numX     The number of columns that need to fit within the heat table width
   * @param {Number} numY The number of rows in the table
   * @param {Object} [chartPadding] An object that includes padding values for the left, right, top,
   *                              and bottom padding which the heat table should have within its container.
   *                              These padding values should be enough to include any axis labels or other things
   *                              that show up around the table itself. The heat table will then fill the rest
   *                              of the available space as appropriate (up to a certain maximum size of box)
   * @return {object}         An object with dimension information about the heat table:
   *                          {
   *                              side: the length of one side of a table box
   *                              paddedSide: the length of the side plus padding
   *                              padRatio: the ratio of padding to paddedSide (used for configuring d3.scaleOrdinal.rangeBands as the second parameter)
   *                              width: the total width of all table boxes plus padding in between
   *                              height: the total height of all table boxes plus padding in between
   *                              centeredOffset: the left offset required to center the table horizontally within its container
   *                          }
   */

  function heatTableDimensions (spaceWidth, squarePadding, numX, numY, chartPadding) {
    chartPadding || (chartPadding = {});
    chartPadding.top || (chartPadding.top = 0);
    chartPadding.right || (chartPadding.right = 0);
    chartPadding.bottom || (chartPadding.bottom = 0);
    chartPadding.left || (chartPadding.left = 0);

    // this includes the default side length for the heat table
    const DEFAULT_SIDE = 30,
      availableChartWidth = spaceWidth - chartPadding.left - chartPadding.right,
      side = Math.min((availableChartWidth - squarePadding * (numX - 1)) / numX, DEFAULT_SIDE),
      paddedSide = side + squarePadding,
      padRatio = 1 - side / paddedSide,
      tableWidth = numX * paddedSide - squarePadding,
      // subtract the squarePadding at the end
      tableHeight = numY * paddedSide - squarePadding; // subtract the squarePadding at the end
    return {
      side,
      paddedSide,
      padRatio,
      width: tableWidth,
      height: tableHeight,
      centeredOffset: Math.max((availableChartWidth - tableWidth) / 2, 0)
    };
  }

  /**
   * Horizontal Bar Chart Dimensions
   *
   * This function calculates dimensions for the horizontal bar chart. It encapsulates the
   * layout algorithm for sszvis horizontal bar charts. The object it returns contains several
   * properties which can be used in other functions and components for layout purposes.
   *
   * @module sszvis/layout/horizontalBarChartDimensions
   *
   * @param  {number} numBars     the number of bars in the horizontal bar chart
   * @return {object}             an object containing properties used for layout:
   *                                 {
   *                                  barHeight: the height of an individual bar
   *                                  padHeight: the height of the padding between each bar
   *                                  padRatio: the ratio of padding to barHeight + padding.
   *                                            this can be passed as the second argument to d3.scaleOrdinal().rangeBands
   *                                  outerRatio: the ratio of outer padding to barHeight + padding.
   *                                              this can be passed as the third parameter to d3.scaleOrdinal().rangeBands
   *                                  axisOffset: the amount by which to vertically offset the y-axis of the horizontal bar chart
   *                                              in order to ensure that the axis labels are visible. This can be used as the y-component
   *                                              of a call to sszvis.svgUtils.translateString.
   *                                  barGroupHeight: the combined height of all the bars and their inner padding.
   *                                  totalHeight: barGroupHeight plus the height of the outerPadding. This distance can be used
   *                                               to translate scales below the bars.
   *                                 }
   */

  function horizontalBarChartDimensions (numBars) {
    const DEFAULT_HEIGHT = 24,
      // the default bar height
      MIN_PADDING = 20,
      // the minimum padding size
      barHeight = DEFAULT_HEIGHT,
      // the bar height
      numPads = numBars - 1,
      padding = MIN_PADDING,
      // compute other information
      padRatio = 1 - barHeight / (barHeight + padding),
      computedBarSpace = barHeight * numBars + padding * numPads,
      outerRatio = 0; // no outer padding

    return {
      barHeight,
      padHeight: padding,
      padRatio,
      outerRatio,
      axisOffset: -(barHeight / 2) - 10,
      barGroupHeight: computedBarSpace,
      totalHeight: computedBarSpace + outerRatio * (barHeight + padding) * 2
    };
  }

  /**
   * Population Pyramid Layout
   *
   * This function is used to compute the layout parameters for the population pyramid
   *
   * @module sszvis/layout/populationPyramidLayout
   *
   * @parameter {number} spaceWidth      The available width for the chart. This is used as a base for calculating the size of the chart
   *                                    (there's a default aspect ratio for its height), and then for calculating the rounded bar heights.
   *                                    The returned total height should be nicely proportionate to this value.
   * @parameter {number} numBars         The number of bars in the population pyramid. In other words, the number of ages or age groups in the dataset.
   *
   * @return {object}                   An object containing configuration information for the population pyramid:
   *                                    {
   *                                      barHeight: the height of one bar in the population pyramid
   *                                      padding: the height of the padding between bars in the pyramid
   *                                      totalHeight: the total height of all bars plus the padding between them. This should be the basis for the bounds calculation
   *                                      positions: an array of positions, which go from the bottom of the chart (lowest age) to the top. These positions should
   *                                      be set as the range of a d3.scaleOrdinal scale, where the domain is the list of ages or age groups that will be displayed
   *                                      in the chart. The domain ages or age groups should be sorted in ascending order, so that the positions will match up. If everything
   *                                      has gone well, the positions array's length will be numBars,
   *                                      maxBarLength: The maximum length of the bars to fit within the space while keeping a good aspect ratio.
   *                                      In situations with very wide screens, this limits the width of the entire pyramid to a reasonable size.
   *                                      chartPadding: left padding for the chart. When the maxBarLength is less than what would fill the entire width
   *                                      of the chart, this value is needed to offset the axes and legend so that they line up with the chart. Otherwise,
   *                                      the value is 0 and no padding is needed.
   *                                    }
   */

  function populationPyramidLayout (spaceWidth, numBars) {
    const MAX_HEIGHT = 480; // Chart no taller than this
    const MIN_BAR_HEIGHT = 2; // Bars no shorter than this
    const defaultHeight = Math.min(aspectRatioPortrait(spaceWidth), MAX_HEIGHT);
    const padding = 1;
    const numPads = numBars - 1;
    const totalPadding = padding * numPads;
    let roundedBarHeight = Math.round((defaultHeight - totalPadding) / numBars);
    roundedBarHeight = Math.max(roundedBarHeight, MIN_BAR_HEIGHT);
    const totalHeight = numBars * roundedBarHeight + totalPadding;
    let barPos = totalHeight - roundedBarHeight;
    const step = roundedBarHeight + padding,
      positions = [];
    while (barPos >= 0) {
      positions.push(barPos);
      barPos -= step;
    }
    const maxBarLength = Math.min(spaceWidth / 2, aspectRatioPortrait.MAX_HEIGHT * (4 / 5) / 2);
    const chartPadding = Math.max((spaceWidth - 2 * maxBarLength) / 2, 1);
    return {
      barHeight: roundedBarHeight,
      padding,
      totalHeight,
      positions,
      maxBarLength,
      chartPadding
    };
  }

  /**
   * @module sszvis/layout/sankey
   *
   * A module of helper functions for computing the data structure
   * and layout required by the sankey component.
   */

  const newLinkId = function () {
    let id = 0;
    return function () {
      return ++id;
    };
  }();

  /**
   * sszvis.layout.sankey.prepareData
   *
   * Returns a data preparation component for the sankey data.
   *
   * Throughout the code, the rectangles representing entities are referred to as 'nodes', while
   * the chords connection them which represent flows among those entities are referred to as 'links'.
   *
   * @property {Array} apply                    Applies the preparation to a dataset of links. Expects a list of links, where the (unique) id
   *                                            of the source node can be accessed with the source function, and the (unique) id of the target
   *                                            can be accessed with the target function. Note that no source can have the same id as a target and
   *                                            vice versa. The nodes are defined implicitly by the fact that they have a link going to them or
   *                                            from them.
   * @property {Function} source                An accessor function for getting the source of a link
   * @property {Function} target                An accessor function for getting the target of a link
   * @property {Function} value                 An accessor function for getting the value of a link. Must be a number. The total value of a node
   *                                            is the greater of the sum of the values of its sourced links and its targeting links.
   * @property {} descendingSort                Toggles the use of a descending value sort for the nodes
   * @property {} ascendingSort                 Toggles the use of an ascending value sort for the nodes
   * @property {Array(Array)} idLists           An array of arrays of id values. For each array of ids, the sankey diagram will create a column
   *                                            of nodes. Each node should have links going to it or coming from it. All ids should be unique.
   *
   * @return {Function}                         The data preparation function. Can be called directly, or applied using the '.apply' function.
   *         When called, returns an object with data to be used in constructing the chart.
   *               @property {Array} nodes             An array of node data. Each one will become a rectangle in the sankey
   *               @property {Array} links             An array of link data. Each one will become a path in the sankey
   *               @property {Array} columnTotals      An array of column totals. Needed by the computeLayout function (and internally by the sankey component)
   *               @property {Array} columnLengths     An array of column lengths (number of nodes). Needed by the computeLayout function.
   */
  const prepareData$1 = function () {
    let mGetSource = identity$1;
    let mGetTarget = identity$1;
    let mGetValue = identity$1;
    let mColumnIds = [];

    // Helper functions
    const valueAcc = prop("value");
    const byAscendingValue = function (a, b) {
      return d3.ascending(valueAcc(a), valueAcc(b));
    };
    const byDescendingValue = function (a, b) {
      return d3.descending(valueAcc(a), valueAcc(b));
    };
    let valueSortFunc = byDescendingValue;
    const main = function (inputData) {
      const columnIndex = mColumnIds.reduce((index, columnIdsList, colIndex) => {
        for (const id of columnIdsList) {
          if (index.has(id)) {
            warn("Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:", id, "The existing value will be overwritten");
          }
          const item = {
            id,
            columnIndex: colIndex,
            // This is the index of the column containing this node
            nodeIndex: 0,
            // This will be overwritten at a later stage with the index of this node within its column
            value: 0,
            valueOffset: 0,
            linksFrom: [],
            linksTo: []
          };
          index.set(id, item);
        }
        return index;
      }, new Map());
      const listOfLinks = inputData.map(datum => {
        const srcId = mGetSource(datum);
        const tgtId = mGetTarget(datum);
        const value = +mGetValue(datum) || 0; // Cast this to number

        const srcNode = columnIndex.get(srcId);
        const tgtNode = columnIndex.get(tgtId);
        if (!srcNode) {
          warn("Found invalid source column id:", srcId);
          return null;
        }
        if (!tgtNode) {
          warn("Found invalid target column id:", tgtId);
          return null;
        }
        const item = {
          id: newLinkId(),
          value,
          src: srcNode,
          srcOffset: 0,
          tgt: tgtNode,
          tgtOffset: 0
        };
        srcNode.linksFrom.push(item);
        tgtNode.linksTo.push(item);
        return item;
      });

      // Extract the column nodes from the index
      const listOfNodes = [...columnIndex.values()];

      // Calculate an array of total values for each column
      const columnTotals = listOfNodes.reduce((totals, node) => {
        const fromTotal = d3.sum(node.linksFrom, valueAcc);
        const toTotal = d3.sum(node.linksTo, valueAcc);

        // For correct visual display, the node's value is the max of the from and to links
        node.value = Math.max(0, fromTotal, toTotal);
        totals[node.columnIndex] += node.value;
        return totals;
      }, filledArray(mColumnIds.length, 0));

      // An array with the number of nodes in each column
      const columnLengths = mColumnIds.map(colIds => colIds.length);

      // Sort the column nodes
      // (note, this sorts all nodes for all columns in the same array)
      listOfNodes.sort(valueSortFunc);

      // Sort the links in descending order of value. This means smaller links will render
      // on top of larger links.
      // (note, this sorts all links for all columns in the same array)
      listOfLinks.sort(byDescendingValue);

      // Assign the valueOffset and nodeIndex properties
      // Here, columnData[0] is an array adding up value totals
      // and columnData[1] is an array adding up the number of nodes in each column
      // Both are used to assign cumulative properties to the nodes of each column
      listOfNodes.reduce((columnData, node) => {
        // Assigns valueOffset and nodeIndex
        node.valueOffset = columnData[0][node.columnIndex];
        node.nodeIndex = columnData[1][node.columnIndex];
        columnData[0][node.columnIndex] += node.value;
        columnData[1][node.columnIndex] += 1;
        return columnData;
      }, [filledArray(mColumnIds.length, 0), filledArray(mColumnIds.length, 0)]);

      // Once the order of nodes is calculated, we need to sort the links going into the
      // nodes and the links coming out of the nodes according to the ordering of the nodes
      // they come from or go to. This creates a visually appealing layout which minimizes
      // the number of link crossings
      for (const node of listOfNodes) {
        node.linksFrom.sort((linkA, linkB) => linkA.tgt.nodeIndex - linkB.tgt.nodeIndex);
        node.linksTo.sort((linkA, linkB) => linkA.src.nodeIndex - linkB.src.nodeIndex);

        // Stack the links vertically within the node according to their order
        node.linksFrom.reduce((sumValue, link) => {
          link.srcOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);
        node.linksTo.reduce((sumValue, link) => {
          link.tgtOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);
      }
      return {
        nodes: listOfNodes,
        links: listOfLinks,
        columnTotals,
        columnLengths
      };
    };
    main.apply = function (data) {
      return main(data);
    };
    main.source = function (func) {
      mGetSource = func;
      return main;
    };
    main.target = function (func) {
      mGetTarget = func;
      return main;
    };
    main.value = function (func) {
      mGetValue = func;
      return main;
    };
    main.descendingSort = function () {
      valueSortFunc = byDescendingValue;
      return main;
    };
    main.ascendingSort = function () {
      valueSortFunc = byAscendingValue;
      return main;
    };
    main.idLists = function (idLists) {
      mColumnIds = idLists;
      return main;
    };
    return main;
  };

  /**
   * sszvis.layout.sankey.computeLayout
   *
   * Automatically computes visual display properties needed by the sankey component,
   * including padding between each node, paddings for the tops of columns to vertically center
   * them, the domain and range of values in the nodes (used for scaling the node rectangles),
   * the node thickness, and the domain and range of the column positioning scale.
   *
   * @param  {Array} columnLengths      An array of lengths (number of nodes) of each column in the diagram.
   *                                    Used to compute optimal padding between nodes. Provided by the layout.sankey.prepareData function
   * @param  {Array} columnTotals       An array of column totals (total of all values of all ndoes). Provided by the
   * @param  {Number} columnHeight      The vertical height available for the columns. The tallest column will be this height. (Usually bounds.innerHeight)
   * @param  {Number} columnWidth       The width of all columns. The sankey chart will be this width. (Usually bounds.innerWidth)
   * @return {Object}                   An object of configuration parameters to be passed to the sankey component
   *         @property {Number} nodePadding         The amount of padding to add between nodes. pass to component.sankey.nodePadding
   *         @property {Array} columnPaddings       An array of padding values for each column. Index into this with the columnIndex and return to component.sankey.columnPadding
   *         @property {Array} valueDomain          The domain for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
   *         @property {Array} valueRange           The range for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
   *         @property {Number} nodeThickness       The thickness of nodes. Pass to component.sankey.nodeThickness
   *         @property {Array} columnDomain         The domain for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
   *         @property {Array} columnRange          The range for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
   */
  const computeLayout$1 = function (columnLengths, columnTotals, columnHeight, columnWidth) {
    // Calculate appropriate scale and padding values (in pixels)
    const padSpaceRatio = 0.15;
    const padMin = 12;
    const padMax = 50;
    const minDisplayPixels = 1; // Minimum number of pixels used for display area

    // Compute the padding value (in pixels) for each column, then take the minimum value
    const computedPixPadding = d3.min(columnLengths.map(colLength => {
      // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
      const colPadding = columnHeight * padSpaceRatio / (colLength - 1);
      // Limit by minimum and maximum pixel padding values
      return Math.max(padMin, Math.min(padMax, colPadding));
    }));

    // Given the computed padding value, compute each column's resulting "pixels per unit"
    // This is the number of remaining pixels available to display the column's total units,
    // after padding pixels have been subtracted. Then take the minimum value of that.
    const pixPerUnit = d3.min(columnLengths.map((colLength, colIndex) => {
      // The non-padding pixels must have at least minDisplayPixels
      const nonPaddingPixels = Math.max(minDisplayPixels, columnHeight - (colLength - 1) * computedPixPadding);
      return nonPaddingPixels / columnTotals[colIndex];
    }));

    // The padding between bars, in bar value units
    const valuePadding = computedPixPadding / pixPerUnit;
    // The padding between bars, in pixels
    const nodePadding = computedPixPadding;

    // The maximum total value of any column
    const maxTotal = d3.max(columnTotals);

    // Compute y-padding required to vertically center each column (in pixels)
    const paddedHeights = columnLengths.map((colLength, colIndex) => columnTotals[colIndex] * pixPerUnit + (colLength - 1) * nodePadding);
    const maxPaddedHeight = d3.max(paddedHeights);
    const columnPaddings = columnLengths.map((colLength, colIndex) => (maxPaddedHeight - paddedHeights[colIndex]) / 2);

    // The domain of the size scale
    const valueDomain = [0, maxTotal];
    // The range of the size scale
    const valueRange = [0, maxTotal * pixPerUnit];

    // Calculate column (or row, as the case may be) positioning values
    const nodeThickness = 20;
    const numColumns = columnLengths.length;
    const columnXMultiplier = (columnWidth - nodeThickness) / (numColumns - 1);
    const columnDomain = [0, 1];
    const columnRange = [0, columnXMultiplier];
    return {
      valuePadding,
      nodePadding,
      columnPaddings,
      valueDomain,
      valueRange,
      nodeThickness,
      columnDomain,
      columnRange
    };
  };

  /**
   * Small Multiples layout
   *
   * Used to generate group elements which contain small multiples charts.
   *
   * This component lays out rectangular groups in a grid according to the number of rows
   * and the number of columns provided. It is possible to specify paddingX and paddingY
   * values, pixel amounts which will be left as empty space between the columns and the
   * rows, respectively.
   *
   * Data should be passed to this component in a special way: it should be an array of
   * data values, where each data value represents a single group. IMPORTANT: each data
   * value must also have a property called 'values' which represents the values corresponding
   * to that group.
   *
   * In the multiple pie charts example, an array of "groups" data is bound to the chart before
   * the multiples component is called. Each element in the "groups" data has a values property
   * which contains the data for a single pie chart.
   *
   * The multiples component creates the groups and lays them out, attaching the following new properties
   * to each group object:
   *
   * gx - the x-position of the group
   * gy - the y-position of the group
   * gw - the width of the group (without padding)
   * gh - the height of the group (without padding)
   *
   * Generally, you should not use source data objects as group objects, but should instead
   * create new objects which are used to store group information. This creates a data hierarchy
   * which matches the representation hierarchy, which is very much a d3 pattern.
   *
   * Once the groups have been created, the user must still do something with them. The pattern
   * for creating charts within each group should look something like:
   *
   * chart.selectAll('.sszvis-multiple')
   *   .each(function(d) {
   *     var groupSelection = select(this);
   *
   *     ... do something which creates a chart using groupSelection ...
   *   });
   *
   * @module sszvis/layout/smallMultiples
   *
   * @property {number} width           the total width of the collection of multiples
   * @property {number} height          the total height of the collection of multiples
   * @property {number} paddingX        x-padding to put between columns
   * @property {number} paddingY        y-padding to put between rows
   * @property {number} rows            the number of rows to generate
   * @property {number} cols            the number of columns to generate
   *
   * @return {sszvis.component}
   */

  function smallMultiples () {
    return component().prop("width").prop("height").prop("paddingX").prop("paddingY").prop("rows").prop("cols").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const unitWidth = (props.width - props.paddingX * (props.cols - 1)) / props.cols;
      const unitHeight = (props.height - props.paddingY * (props.rows - 1)) / props.rows;
      const horizontalCenter = unitWidth / 2;
      const verticalCenter = unitHeight / 2;
      const multiples = selection.selectAll("g.sszvis-multiple").data(data).join("g").classed("sszvis-g sszvis-multiple", true);
      multiples.selectAll("g.sszvis-multiple-chart").data(d => [d.values]).join("g").classed("sszvis-multiple-chart", true);
      multiples.datum((d, i) => {
        d.gx = i % props.cols * (unitWidth + props.paddingX);
        d.gw = unitWidth;
        d.cx = horizontalCenter;
        d.gy = Math.floor(i / props.cols) * (unitHeight + props.paddingY);
        d.gh = unitHeight;
        d.cy = verticalCenter;
        return d;
      }).attr("transform", d => "translate(" + d.gx + "," + d.gy + ")");
    });
  }

  /**
   * Stacked Area Multiples Layout
   *
   * This function is used to compute layout parameters for the area multiples chart.
   *
   * @module sszvis/layout/stackedAreaMultiplesLayout
   *
   * @param  {number} height      The available height of the chart
   * @param  {number} num         The number of individual stacks to display
   * @param  {number} pct         the planned-for ratio between the space allotted to each area and the amount of space + area.
   *                              This value is used to compute the baseline positions for the areas, and how much vertical space to leave
   *                              between the areas.
   *
   * @return {object}             An object containing configuration properties for use in laying out the stacked area multiples.
   *                              {
   *                                range:          This is an array of baseline positions, counting from the top of the stack downwards.
   *                                                It should be used to configure a d3.scaleOrdinal(). The values passed into the ordinal
   *                                                scale will be given a y-value which descends from the top of the stack, so that the resulting
   *                                                scale will match the organization scheme of sszvis.stackedArea. Use the ordinal scale to
   *                                                configure the sszvis.stackedAreaMultiples component.
   *                                bandHeight:     The height of each multiples band. This can be used to configure the within-area y-scale.
   *                                                This height represents the height of the y-axis of the individual area multiple.
   *                                padHeight:      This is the amount of vertical padding between each area multiple.
   *                              }
   */

  function stackedAreaMultiplesLayout (height, num, pct) {
    pct || (pct = 0.1);
    const step = height / (num - pct),
      bandHeight = step * (1 - pct),
      range = [];
    let level = bandHeight; // count from the top, and start at the bottom of the first band
    while (level - height < 1) {
      range.push(level);
      level += step;
    }
    return {
      range,
      bandHeight,
      padHeight: step * pct
    };
  }

  /**
   * @module sszvis/layout/sunburst
   *
   * Helper functions for transforming your data to match the format required by the sunburst chart.
   */

  function unwrapNested(roll) {
    return Array.from(roll, _ref => {
      let [key, values] = _ref;
      return {
        key,
        values: values.size > 0 ? unwrapNested(values) : undefined,
        value: values.size > 0 ? undefined : values
      };
    });
  }
  let sortFn = function () {
    return 0;
  };

  /**
   * sszvis.layout.sunburst.prepareData
   *
   * Creates a data preparation layout, with an API that works similarly to d3's configurable layouts.
   *
   * @property {Array} calculate      Accepts an array of data, and applies this layout to that data. Returns the formatted dataset,
   *                                  ready to be used as data for the sunburst component.
   * @property {Function} layer       Accepts a function, which should be a key function, used to create a layer for the data.
   *                                  The key function is applied to each datum, and the return value groups that datum within a
   *                                  layer of the sunburst chart. The exact behavior depends on the order in which layers are specified.
   *                                  The first specified layer will be the innermost one of the sunburst, with subsequent layers adding
   *                                  around the sunburst. Data are grouped according to the first layer, then the second layer, then the third, etc.
   *                                  This uses d3.nest under the hood, and applys the key function as a d3.nest().key, so it works like that.
   * @property {Function} value       The function which retrieves the value of each datum. This is required in order to calculate the size of
   *                                  the ring segment for each datum.
   * @property {Function} sort        Provide a sorting function for sibling nodes of the sunburst. The d3.partition layout probably uses a
   *                                  javascript object internally for some bookkeeping. At the moment, not all browsers handle key ordering in
   *                                  objects similarly. This sorting function is used to sort the output values of the d3.partition layout, according
   *                                  to user wishes. It receives two node values (which are created by d3), which should have at least a "key" property
   *                                  (corresponding to the layer key), and a "value" property (corresponding to the value amount of the slice).
   *                                  Otherwise, it behaves like a normal javascript array sorting function. The default value attempts to preserve the
   *                                  existing sort order of the data.
   *
   * @return {Function}               The layout function. Can be called directly or you can use '.calculate(dataset)'.
   */
  const prepareData = function () {
    const layers = [];
    let valueAcc = identity$1;
    // Sibling nodes of the partition layout are sorted according to this sort function.
    // The default value for this component tries to preserve the order of the input data.
    // However, input data order preservation is not guaranteed, because of an implementation
    // detail of d3.partition, probably having to do with the way that each browser can
    // implement its own key ordering for javascript objects.

    function main(data) {
      const nested = unwrapNested(d3.rollup(data, first, ...layers));
      const root = d3.hierarchy({
        isSunburstRoot: true,
        values: nested
      }, prop("values")).sort(sortFn).sum(x => x.value ? valueAcc(x.value) : 0);
      d3.partition()(root);
      function flatten(node) {
        return Array.prototype.concat.apply([node], (node.children || []).map(flatten));
      }

      // Remove the root element from the data (but it still exists in memory so long as the data is alive)
      return flatten(root).filter(d => !d.data.isSunburstRoot);
    }
    main.calculate = function (data) {
      return main(data);
    };
    main.layer = function (keyFunc) {
      layers.push(keyFunc);
      return main;
    };
    main.value = function (accfn) {
      valueAcc = accfn;
      return main;
    };
    main.sort = function (sortFunc) {
      sortFn = sortFunc;
      return main;
    };
    return main;
  };
  const MAX_SUNBURST_RING_WIDTH = 60;
  const MAX_RW = MAX_SUNBURST_RING_WIDTH;
  const MIN_SUNBURST_RING_WIDTH = 10;
  const MIN_RW = MIN_SUNBURST_RING_WIDTH;

  /**
   * sszvis.layout.sunburst.computeLayout
   *
   * Computes layout parameters for good visual display of the sunburst chart.
   *
   * @param  {Number} numLayers          The number of layers in the sunburst chart.
   * @param  {Number} chartWidth         The total width available for displaying the sunburst chart.
   * @return {Object}                    Some parameters for the sunburst chart:
   *       @property {Number} centerRadius      The central radius of the chart (used by the sunburst component)
   *       @property {Number} numLayers         The number of layers in the chart (used by the sunburst component)
   *       @property {Number} ringWidth         The width of a single ring in the chart (used by the sunburst component)
   */
  const computeLayout = function (numLayers, chartWidth) {
    // Diameter of the center circle is one-third the width
    const halfWidth = chartWidth / 2;
    const centerRadius = halfWidth / 3;
    const ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - centerRadius) / numLayers));
    return {
      centerRadius,
      numLayers,
      ringWidth
    };
  };

  /**
   * sszvis.layout.sunburst.getRadiusExtent
   * @param  {Array} formattedData      An array of data to inspect for the extent of the radius scale
   *
   * @return {Array}                    The minimum and maximum radius values (in d3's partition layout's terms). Use this as
   *                                    The domain of the radius scale you use to configure the sunburst chart. This is a convenience
   *                                    function which abstracts away the way d3 stores positions within the partition layout used
   *                                    by the sunburst chart.
   */
  const getRadiusExtent = function (formattedData) {
    return [d3.min(formattedData, d => d.y0), d3.max(formattedData, d => d.y1)];
  };

  /**
   * Vertical Bar Chart Dimensions
   *
   * Generates a dimension configuration object to be used for laying out the vertical bar chart.
   *
   * @module sszvis/layout/verticalBarChartDimensions
   *
   * @param  {number} width         the total width available to the horizontal bar chart. The computed chart layout is not guaranteed
   *                                to fit inside this width.
   * @param  {number} numBars       The number of bars in the bar chart.
   * @return {object}               An object containing configuration properties for use in laying out the vertical bar chart.
   *                                {
   *                                  barWidth:             the width of each bar in the bar chart
   *                                  padWidth:             the width of the padding between the bars in the bar chart
   *                                  padRatio:             the ratio between the padding and the step (barWidth + padding). This can be passed
   *                                                        as the second parameter to d3.scaleOrdinal().rangeBands().
   *                                  outerRatio:           the outer ratio between the outer padding and the step. This can be passed as the
   *                                                        third parameter to d3.scaleOrdinal().rangeBands().
   *                                  barGroupWidth:        the width of all the bars plus all the padding between the bars.
   *                                  totalWidth:           The total width of all bars, plus all inner and outer padding.
   *                                }
   */

  function verticalBarChartDimensions (width, numBars) {
    const MAX_BAR_WIDTH = 48,
      // the maximum width of a bar
      MIN_PADDING = 2,
      // the minimum padding value
      MAX_PADDING = 100,
      // the maximum padding value
      TARGET_BAR_RATIO = 0.7,
      // the ratio of width to width + padding used to compute the initial width and padding
      TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO,
      // the inverse of the bar ratio, this is the ratio of padding to width + padding
      numPads = numBars - 1; // the number of padding spaces
    // compute the target size of the padding
    // the derivation of this equation is available upon request
    let padding = width * TARGET_PADDING_RATIO / (TARGET_PADDING_RATIO * numPads + TARGET_BAR_RATIO * numBars);
    // based on the computed padding, calculate the bar width

    let barWidth = (width - padding * numPads) / numBars;

    // adjust for min and max bounds
    if (barWidth > MAX_BAR_WIDTH) {
      barWidth = MAX_BAR_WIDTH;
      // recompute the padding value where necessary
      padding = (width - barWidth * numBars) / numPads;
    }
    if (padding < MIN_PADDING) padding = MIN_PADDING;
    if (padding > MAX_PADDING) padding = MAX_PADDING;

    // compute other information
    const padRatio = 1 - barWidth / (barWidth + padding),
      computedBarSpace = barWidth * numBars + padding * numPads,
      outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);
    return {
      barWidth,
      padWidth: padding,
      padRatio,
      outerRatio,
      barGroupWidth: computedBarSpace,
      totalWidth: width
    };
  }

  /**
   * Binned Color Scale Legend
   *
   * Use for displaying the values of discontinuous (binned) color scale's bins
   *
   * @module sszvis/legend/binnedColorScale
   *
   * @param {function} scale              A scale to use to generate the color values
   * @param {array} displayValues         An array of values which should be displayed. Usually these should be the bin edges
   * @param {array} endpoints             The endpoints of the scale (note that these are not necessarily the first and last
   *                                      bin edges). These will become labels at either end of the legend.
   * @param {number} width                The pixel width of the legend. Default 200
   * @param {function} labelFormat        A formatter function for the labels of the displayValues.
   *
   * @return {sszvis.component}
   */

  function binnedColorScale () {
    return component().prop("scale").prop("displayValues").prop("endpoints").prop("width").width(200).prop("labelFormat").labelFormat(identity$1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      if (!props.scale) return error("legend.binnedColorScale - a scale must be specified.");
      if (!props.displayValues) return error("legend.binnedColorScale - display values must be specified.");
      if (!props.endpoints) return error("legend.binnedColorScale - endpoints must be specified");
      const segHeight = 10;
      const circleRad = segHeight / 2;
      const innerRange = [0, props.width - 2 * circleRad];
      const barWidth = d3.scaleLinear().domain(props.endpoints).range(innerRange);
      let sum = 0;
      const rectData = [];
      let pPrev = props.endpoints[0];
      for (const p of props.displayValues) {
        const w = barWidth(p) - sum;
        const offset = sum % 1;
        rectData.push({
          x: Math.floor(circleRad + sum),
          w: w + offset,
          c: props.scale(pPrev),
          p
        });
        sum += w;
        pPrev = p;
      }

      // add the final box (last display value - > endpoint)
      rectData.push({
        x: Math.floor(circleRad + sum),
        w: innerRange[1] - sum,
        c: props.scale(pPrev)
      });
      const circles = selection.selectAll("circle.sszvis-legend__circle").data(props.endpoints).join("circle").classed("sszvis-legend__circle", true);
      circles.attr("r", circleRad).attr("cy", circleRad).attr("cx", (d, i) => i === 0 ? circleRad : props.width - circleRad).attr("fill", props.scale);
      const segments = selection.selectAll("rect.sszvis-legend__crispmark").data(rectData).join("rect").classed("sszvis-legend__crispmark", true);
      segments.attr("x", d => d.x).attr("y", 0).attr("width", d => d.w).attr("height", segHeight).attr("fill", d => d.c);
      const lineData = rectData.slice(0, -1);
      const lines = selection.selectAll("line.sszvis-legend__crispmark").data(lineData).join("line").classed("sszvis-legend__crispmark", true);
      lines.attr("x1", d => halfPixel(d.x + d.w)).attr("x2", d => halfPixel(d.x + d.w)).attr("y1", segHeight + 1).attr("y2", segHeight + 6).attr("stroke", "#B8B8B8");
      const labels = selection.selectAll(".sszvis-legend__axislabel").data(lineData).join("text").classed("sszvis-legend__axislabel", true);
      labels.style("text-anchor", "middle").attr("transform", d => "translate(" + (d.x + d.w) + "," + (segHeight + 20) + ")").text(d => props.labelFormat(d.p));
    });
  }

  /**
   * Linear Color Scale Legend
   *
   * Use for displaying the values of a continuous linear color scale.
   *
   * @module sszvis/legend/linearColorScale
   *
   * @property {function} scale                   The scale to use to generate the legend
   * @property {array} displayValues              A list of specific values to display. If not specified, defaults to using scale.ticks
   * @property {number} width                     The pixel width of the legend (default 200).
   * @property {number} segments                  The number of segments to aim for. Note, this is only used if displayValues isn't specified,
   *                                              and then it is passed as the argument to scale.ticks for finding the ticks. (default)
   * @property {array} labelText                  Text or a text-returning function to use as the titles for the legend endpoints. If not supplied,
   *                                              defaults to using the first and last tick values.
   * @property {function} labelFormat             An optional formatter function for the end labels. Usually should be sszvis.formatNumber.
   */

  function linearColorScale () {
    return component().prop("scale").prop("displayValues").displayValues([]).prop("width").width(200).prop("segments").segments(8).prop("labelText").prop("labelFormat").labelFormat(identity$1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      if (!props.scale) {
        error("legend.linearColorScale - a scale must be specified.");
        return false;
      }
      const domain = props.scale.domain();
      let values = props.displayValues;
      if (values.length === 0 && props.scale.ticks) {
        values = props.scale.ticks(props.segments - 1);
      }
      values.push(last(domain));

      // Avoid division by zero
      const segWidth = values.length > 0 ? props.width / values.length : 0;
      const segHeight = 10;
      const segments = selection.selectAll("rect.sszvis-legend__mark").data(values).join("rect").classed("sszvis-legend__mark", true);
      segments.attr("x", (d, i) => i * segWidth - 1) // The offsets here cover up half-pixel antialiasing artifacts
      .attr("y", 0).attr("width", segWidth + 1) // The offsets here cover up half-pixel antialiasing artifacts
      .attr("height", segHeight).attr("fill", d => props.scale(d));
      const startEnd = [first(domain), last(domain)];
      const labelText = props.labelText || startEnd;

      // rounded end caps for the segments
      const endCaps = selection.selectAll("circle.ssvis-legend--mark").data(startEnd).join("circle").attr("class", "ssvis-legend--mark");
      endCaps.attr("cx", (d, i) => i * props.width).attr("cy", segHeight / 2).attr("r", segHeight / 2).attr("fill", d => props.scale(d));
      const labels = selection.selectAll(".sszvis-legend__label").data(labelText).join("text").classed("sszvis-legend__label", true);
      const labelPadding = 16;
      labels.style("text-anchor", (d, i) => i === 0 ? "end" : "start").attr("dy", "0.35em") // vertically-center
      .attr("transform", (d, i) => "translate(" + (i * props.width + (i === 0 ? -1 : 1) * labelPadding) + ", " + segHeight / 2 + ")").text((d, i) => props.labelFormat(d, i));
    });
  }

  /**
   * Radius size legend
   *
   * Use for showing how different radius sizes correspond to data values.
   *
   * @module sszvis/legend/radius
   *
   * @property {function} scale         A scale to use to generate the radius sizes
   * @property {function} [tickFormat]  Formatter function for the labels (default identity)
   * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
   *
   * @returns {sszvis.component}
   */

  function radius () {
    return component().prop("scale").prop("tickFormat").tickFormat(identity$1).prop("tickValues").render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const domain = props.scale.domain();
      const tickValues = props.tickValues || [domain[1], props.scale.invert(d3.mean(props.scale.range())), domain[0]];
      const maxRadius = range(props.scale)[1];
      const group = selection.selectAll("g.sszvis-legend__elementgroup").data([0]).join("g").attr("class", "sszvis-legend__elementgroup");
      group.attr("transform", translateString(halfPixel(maxRadius), halfPixel(maxRadius)));
      const circles = group.selectAll("circle.sszvis-legend__greyline").data(tickValues).join("circle").classed("sszvis-legend__greyline", true);
      function getCircleCenter(d) {
        return maxRadius - props.scale(d);
      }
      function getCircleEdge(d) {
        return maxRadius - 2 * props.scale(d);
      }
      circles.attr("r", props.scale).attr("stroke-width", 1).attr("cy", getCircleCenter);
      const lines = group.selectAll("line.sszvis-legend__dashedline").data(tickValues).join("line").classed("sszvis-legend__dashedline", true);
      lines.attr("x1", 0).attr("y1", getCircleEdge).attr("x2", maxRadius + 15).attr("y2", getCircleEdge);
      const labels = group.selectAll(".sszvis-legend__label").data(tickValues).join("text").attr("class", "sszvis-legend__label sszvis-legend__label--small");
      labels.attr("dx", maxRadius + 18).attr("y", getCircleEdge).attr("dy", "0.35em") // vertically-center
      .text(props.tickFormat);
    });
  }

  /**
   * Handle data load errors in a standardized way
   *
   * @module sszvis/loadError
   *
   * @param  {Error} The error object
   */


  // var RELOAD_MSG = 'Versuchen Sie, die Webseite neu zu laden. Sollte das Problem weiterhin bestehen, nehmen Sie mit uns Kontakt auf.';

  const loadError = function (error$1) {
    error(error$1);

    // Don't use alert()!

    // TODO: render an inline error in the chart instead

    // if (error.status === 404) {
    //   alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
    // } else {
    //   alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
    // }
  };

  /*
   * A collection of utilities used by the map modules
   *
   * @module sszvis/map/utils
   */

  const STADT_KREISE_KEY = "zurichStadtKreise";
  const STATISTISCHE_QUARTIERE_KEY = "zurichStatistischeQuartiere";
  const STATISTISCHE_ZONEN_KEY = "zurichStatistischeZonen";
  const WAHL_KREISE_KEY = "zurichWahlKreise";
  const AGGLOMERATION_2012_KEY = "zurichAgglomeration2012";
  const SWITZERLAND_KEY = "switzerland";

  /**
   * swissMapProjection
   *
   * A function for creating d3 projection functions, customized for the dimensions of the map you need.
   * Because this projection generator involves calculating the boundary of the features that will be
   * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
   * You don't need to worry about this - mostly it's the map module components which use this function.
   *
   * @param  {Number} width                           The width of the projection destination space.
   * @param  {Number} height                          The height of the projection destination space.
   * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
   * @param  {String} featureBoundsCacheKey           Used internally, this is a key for the cache for the expensive part of this computation.
   * @return {Function}                               The projection function.
   */
  const swissMapProjection = memoize((width, height, featureCollection) => d3.geoMercator().fitSize([width, height], featureCollection),
  // Memoize resolver
  (width, height, _, featureBoundsCacheKey) => "" + width + "," + height + "," + featureBoundsCacheKey);

  /**
   * This is a special d3.geoPath generator function tailored for rendering maps of
   * Switzerland. The values are chosen specifically to optimize path generation for
   * Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
   *
   * @param  {number} width                     The width of the available map space
   * @param  {number} height                    The height of the available map space
   * @param  {GeoJson} featureCollection        The collection of features to be displayed in the map space
   * @param  {string} [featureBoundsCacheKey]   A string key to use to cache the result of the bounds calculation, which is expensive.
   *                                            This key should be the same every time the same featureCollection object
   *                                            is passed to this function. If the featureCollection is different, use a different
   *                                            cache key. If provided, this can enable large performance improvements in map rendering.
   * @return {d3.geoPath}                       A path generator function. This function takes a geojson datum as argument
   *                                            and returns an svg path string which represents that geojson, projected using
   *                                            a map projection optimal for Swiss areas.
   */
  const swissMapPath = function (width, height, featureCollection, featureBoundsCacheKey) {
    return d3.geoPath().projection(swissMapProjection(width, height, featureCollection, featureBoundsCacheKey));
  };

  /**
   * Use this function to calcualate the length in pixels of a distance in meters across the surface of the earth
   * The earth's radius is not constant, so this function uses an approximation for calculating the degree angle of
   * a distance in meters.
   *
   * @param {function} projection     You need to provide a projection function for calculating pixel values from decimal degree
   *                                  coordinates. This function should accept values as [lon, lat] array pairs (like d3's projection functions).
   * @param {array} centerPoint       You need to provide a center point. This point is used as the center of a hypothetical square
   *                                  with side lengths equal to the meter distance to be measured. The center point is required
   *                                  because the pixel size of a given degree distance will be different if that square is located
   *                                  at the equator or at one of the poles. This value should be specified as a [lon, lat] array pair.
   * @param {number} meterDistance    The distance (in meters) for which you want the pixel value
   */
  const pixelsFromGeoDistance = function (projection, centerPoint, meterDistance) {
    // This radius (in meters) is halfway between the radius of the earth at the equator (6378200m) and that at its poles (6356750m).
    // I figure it's an appropriate approximation for Switzerland, which is at roughly 45deg latitude.
    const APPROX_EARTH_RADIUS = 6367475;
    const APPROX_EARTH_CIRCUMFERENCE = Math.PI * 2 * APPROX_EARTH_RADIUS;
    // Compute the size of the angle made by the meter distance
    const degrees = meterDistance / APPROX_EARTH_CIRCUMFERENCE * 360;
    // Construct a square, centered at centerPoint, with sides that span that number of degrees
    const halfDegrees = degrees / 2;
    const bounds = [[centerPoint[0] - halfDegrees, centerPoint[1] - halfDegrees], [centerPoint[0] + halfDegrees, centerPoint[1] + halfDegrees]];

    // Project those bounds to pixel coordinates using the provided map projection
    const projBounds = bounds.map(projection);
    // Depending on the rotation of the map, the sides of the box are not always positive quantities
    // For example, on a north-is-up map, the pixel y-scale is inverted, so higher latitude degree
    // values are lower pixel y-values. On a south-is-up map, the opposite is true.
    const projXDist = Math.abs(projBounds[1][0] - projBounds[0][0]);
    const projYDist = Math.abs(projBounds[1][1] - projBounds[0][1]);
    return (projXDist + projYDist) / 2;
  };
  const GEO_KEY_DEFAULT = "geoId";

  /**
   * prepareMergedData
   *
   * Merges a dataset with a geojson object by matching elements in the dataset to elements in the geojson.
   * it expects a keyname to be given, which is the key in each data object which has the id of the geojson
   * element to which that data object should be matched. Expects an array of data objects, and a geojson object
   * which has a features array. Each feature is mapped to one data object.
   *
   * @param  {Array} dataset           The array of input data to match
   * @param  {Object} geoJson          The geojson object. This function will attempt to match each geojson feature to a data object
   * @param  {String} keyName          The name of the property on each data object which will be matched with each geojson id.
   * @return {Array}                   An array of objects (one for each element of the geojson's features). Each should have a
   *                                   geoJson property which is the feature, and a datum property which is the matched datum.
   */
  const prepareMergedGeoData = function (dataset, geoJson, keyName) {
    keyName || (keyName = GEO_KEY_DEFAULT);

    // group the input data by map entity id
    const groupedInputData = Array.isArray(dataset) ? dataset.reduce((m, v) => {
      m[v[keyName]] = v;
      return m;
    }, {}) : {};

    // merge the map features and the input data into new objects that include both
    return geoJson.features.map(feature => ({
      geoJson: feature,
      datum: groupedInputData[feature.id]
    }));
  };

  /**
   * getGeoJsonCenter
   *
   * Gets the geographic centroid of a geojson feature object. Caches the result of the calculation
   * on the object as an optimization (note that this is a coordinate position and is independent
   * of the map projection). If the geoJson object's properties contain a 'center' property, that
   * is expected to be a string of the form "longitude,latitude" which will be parsed into a [lon, lat]
   * pair expected by d3's projection functions. These strings can be added to the properties array
   * using the topojson command line tool's -e option (see the Makefile rule for the zurich statistical
   * quarters map for an example of this use).
   *
   * @param  {Object} geoJson                 The geoJson object for which you want the center.
   * @return {Array[float, float]}            The geographical coordinates (in the form [lon, lat]) of the centroid
   *                                          (or user-specified center) of the object.
   */
  const getGeoJsonCenter = function (geoJson) {
    if (!geoJson.properties.cachedCenter) {
      const setCenter = geoJson.properties.center;
      geoJson.properties.cachedCenter = setCenter ? setCenter.split(",").map(Number.parseFloat) : d3.geoCentroid(geoJson);
    }
    return geoJson.properties.cachedCenter;
  };

  /**
   * widthAdaptiveMapPathStroke
   *
   * A little "magic" function for automatically calculating map stroke sizes based on
   * the width of the container they're in. Used for responsive designs.
   *
   * @param  {number} width    The width of the container holding the map.
   * @return {number}          The stroke width that the map elements should have.
   */
  const widthAdaptiveMapPathStroke = function (width) {
    return Math.min(Math.max(0.8, width / 400), 1.1);
  };

  /**
   * @module sszvis/map/anchoredCircles
   *
   * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
   * You will usually want to pass this component, configured, as the .anchoredShape property of a base
   * map component.
   *
   * @property {Object} mergedData                    Used internally by the base map component which renders this. Is a merged dataset used to render the shapes
   * @property {Function} mapPath                     Used internally by the base map component which renders this. Is a path generation function which provides projections.
   * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
   * @property {Color, Function} fill                 The fill color of the circles. Can be a function
   * @property {Color, Function} strokeColor          The stroke color of the circles. Can be a function
   * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data changes. Default true
   *
   * @return {sszvis.component}
   */

  const datumAcc = prop("datum");
  function bubble () {
    const event = d3.dispatch("over", "out", "click");
    const anchoredCirclesComponent = component().prop("mergedData").prop("mapPath").prop("radius", functor).prop("fill", functor).prop("strokeColor", functor).strokeColor("#ffffff").prop("strokeWidth", functor).strokeWidth(1).prop("transition").transition(true).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const radiusAcc = compose(props.radius, datumAcc);
      const anchoredCircles = selection.selectGroup("anchoredCircles").selectAll(".sszvis-anchored-circle").data(props.mergedData, d => d.geoJson.id).join("circle").attr("class", "sszvis-anchored-circle sszvis-anchored-circle--entering").attr("r", radiusAcc).on("mouseover", function (d) {
        event.call("over", this, d.datum);
      }).on("mouseout", function (d) {
        event.call("out", this, d.datum);
      }).on("click", function (d) {
        event.call("click", this, d.datum);
      }).attr("transform", d => {
        const position = props.mapPath.projection()(getGeoJsonCenter(d.geoJson));
        return translateString(position[0], position[1]);
      }).style("fill", d => props.fill(d.datum)).style("stroke", d => props.strokeColor(d.datum)).style("stroke-width", d => props.strokeWidth(d.datum)).sort((a, b) => props.radius(b.datum) - props.radius(a.datum));

      // Remove the --entering modifier from the updating circles
      anchoredCircles.classed("sszvis-anchored-circle--entering", false);
      if (props.transition) {
        const t = defaultTransition();
        anchoredCircles.exit().transition(t).attr("r", 0).remove();
        anchoredCircles.transition(t).attr("r", radiusAcc);
      } else {
        anchoredCircles.exit().remove();
        anchoredCircles.attr("r", radiusAcc);
      }
    });
    anchoredCirclesComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? anchoredCirclesComponent : value;
    };
    return anchoredCirclesComponent;
  }

  /**
   * base renderer component
   *
   * @module sszvis/map/renderer/base
   *
   * A component used internally for rendering the base layer of maps.
   * These map entities have a color fill, which is possibly a pattern that represents
   * missing values. They are also event targets. If your map has nothing else, it should have a
   * base layer.
   *
   * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
   * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
   * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
   *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
   *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
   * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
   *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
   * @property {String, Function} fill                  A string or function for the fill of the map entities
   * @property {Boolean} transitionColor                Whether or not to transition the fill color of the map entities. (default: true)
   *
   * @return {sszvis.component}
   */

  function mapRendererBase () {
    return component().prop("mergedData").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true) // a predicate function to determine whether a datum has a defined value
    .prop("fill", functor).fill(() => "black") // a function for the entity fill color. default is black
    .prop("transitionColor").transitionColor(true).render(function () {
      const selection = d3.select(this);
      const props = selection.props();

      // render the missing value pattern
      ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

      // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
      function getMapFill(d) {
        return props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
      }
      const mapAreas = selection.selectAll(".sszvis-map__area").data(props.mergedData).join("path").classed("sszvis-map__area", true).classed("sszvis-map__area--entering", true).attr("data-event-target", "").attr("fill", getMapFill).classed("sszvis-map__area--entering", false);
      selection.selectAll(".sszvis-map__area--undefined").attr("fill", getMapFill);

      // change the fill if necessary
      mapAreas.classed("sszvis-map__area--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
      if (props.transitionColor) {
        mapAreas.transition().call(slowTransition).attr("fill", getMapFill);
      } else {
        mapAreas.attr("fill", getMapFill);
      }

      // the tooltip anchor generator
      const ta = tooltipAnchor().position(d => props.mapPath.projection()(getGeoJsonCenter(d.geoJson)));
      const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });
  }

  /**
   * geojson renderer component
   *
   * @module sszvis/map/renderer/geojson
   *
   * A component used for rendering overlays of geojson above map layers.
   * It can be used to render any arbitrary GeoJson.
   *
   * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
   *                                          with geographic entities. Default 'geoId'.
   * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
   *                                          with data entities. Default 'id'.
   * @property {GeoJson} geoJson              The GeoJson object which should be rendered. Needs to have a 'features' property.
   * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
   * @property {Function, Boolean} defined    A function which, when given a data value, returns whether or not data in that value is defined.
   * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
   * @property {String} stroke                The stroke color of the entities. Can be a string or a function returning a string. Default black.
   * @property {Number} strokeWidth           The thickness of the strokes of the shapes. Can be a number or a function returning a number. Default 1.25.
   * @property {Boolean} transitionColor      Whether or not to transition the fill color of the geojson when it changes. Default true.
   *
   * @return {sszvis.component}
   */

  function geojson () {
    const event = d3.dispatch("over", "out", "click");
    const geojsonComponent = component().prop("dataKeyName").dataKeyName(GEO_KEY_DEFAULT).prop("geoJsonKeyName").geoJsonKeyName("id").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true).prop("fill", functor).fill("black").prop("stroke", functor).stroke("black").prop("strokeWidth", functor).strokeWidth(1.25).prop("transitionColor").transitionColor(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // render the missing value pattern
      ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

      // getDataKeyName will be called on data values. It should return a map entity id.
      // getMapKeyName will be called on the 'properties' of each map feature. It should
      // return a map entity id. Data values are matched with corresponding map features using
      // these entity ids.
      const getDataKeyName = prop(props.dataKeyName);
      const getMapKeyName = prop(props.geoJsonKeyName);
      const groupedInputData = data.reduce((m, v) => {
        m[getDataKeyName(v)] = v;
        return m;
      });
      const mergedData = props.geoJson.features.map(feature => ({
        geoJson: feature,
        datum: groupedInputData[getMapKeyName(feature.properties)]
      }));
      function getMapFill(d) {
        return defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
      }
      function getMapStroke(d) {
        return defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
      }
      const geoElements = selection.selectAll(".sszvis-map__geojsonelement").data(mergedData).join("path").classed("sszvis-map__geojsonelement", true).attr("data-event-target", "").attr("fill", getMapFill);
      selection.selectAll(".sszvis-map__geojsonelement--undefined").attr("fill", getMapFill);
      geoElements.classed("sszvis-map__geojsonelement--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
      if (props.transitionColor) {
        geoElements.transition().call(slowTransition).attr("fill", getMapFill);
      } else {
        geoElements.attr("fill", getMapFill);
      }
      geoElements.attr("stroke", getMapStroke).attr("stroke-width", props.strokeWidth);
      selection.selectAll("[data-event-target]").on("mouseover", d => {
        event.over(d.datum);
      }).on("mouseout", d => {
        event.out(d.datum);
      }).on("click", d => {
        event.click(d.datum);
      });

      // the tooltip anchor generator
      const ta = tooltipAnchor().position(d => {
        d.geoJson.properties || (d.geoJson.properties = {});
        let sphericalCentroid = d.geoJson.properties.sphericalCentroid;
        if (!sphericalCentroid) {
          d.geoJson.properties.sphericalCentroid = sphericalCentroid = d3.geoCentroid(d.geoJson);
        }
        return props.mapPath.projection()(sphericalCentroid);
      });
      const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });
    geojsonComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? geojsonComponent : value;
    };
    return geojsonComponent;
  }

  /**
   * highlight renderer component
   *
   * @module sszvis/map/renderer/highlight
   *
   * A component used internally for rendering the highlight layer of maps.
   * The highlight layer accepts an array of data values to highlight, and renders
   * The map entities associated with those data values using a special stroke.
   *
   * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
   * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
   * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
   * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
   * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
   *
   * @return {sszvis.component}
   */

  function mapRendererHighlight () {
    return component().prop("keyName").keyName(GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
    .prop("geoJson").prop("mapPath").prop("highlight").highlight([]) // an array of data values to highlight
    .prop("highlightStroke", functor).highlightStroke("white") // a function for highlighted entity stroke colors (default: white)
    .prop("highlightStrokeWidth", functor).highlightStrokeWidth(2).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      let highlightBorders = selection.selectAll(".sszvis-map__highlight");
      if (props.highlight.length === 0) {
        highlightBorders.remove();
        return true; // no highlight, no worry
      }
      const groupedMapData = props.geoJson.features.reduce((m, feature) => {
        m[feature.id] = feature;
        return m;
      }, {});

      // merge the highlight data
      const mergedHighlight = props.highlight.reduce((m, v) => {
        if (v) {
          m.push({
            geoJson: groupedMapData[v[props.keyName]],
            datum: v
          });
        }
        return m;
      }, []);
      highlightBorders = highlightBorders.data(mergedHighlight).join("path").classed("sszvis-map__highlight", true).attr("d", d => props.mapPath(d.geoJson)).style("stroke", d => props.highlightStroke(d.datum)).style("stroke-width", d => props.highlightStrokeWidth(d.datum));
    });
  }

  /**
   * image render component
   *
   * @module  sszvis/map/renderer/image
   *
   * Used for rendering an image layer, usually as a complement to a map. This is used in examples
   * for the topographic layer. It could also be used in other contexts, but the map usage is
   * the most straightforward.
   *
   * @property {Function} projection      The map projection function used to position the image in pixels. Uses the upper left
   *                                      and lower right corners of the image as geographical place markers to align with other map layers.
   * @property {String} src               The source of the image you want to use. This should be ither a URL for an image hosted on the same
   *                                      server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.
   * @property {Array} geoBounds          This should be a 2D array containing the upper-left (north-west) and lower-right (south-east)
   *                                      coordinates of the corresponding corners of the image. The structure expected is:
   *
   *                                      [[nw-longitude, nw-latitude], [se-longitude, se-latitude]]
   *
   *                                      This is consistent with the way D3 handles similar geographic data. These coordinates are used to represent
   *                                      the edge of the image being used, and to align the image with other map layers (using the projection function).
   *                                      Note: it is possible that even with precise corner coordinates, some mismatch may still occur. This
   *                                      will happen if the image itself is generated using a different type of map projection than the one used by the
   *                                      projection function. SSZVIS uses a Mercator projection by default, but others from d3.geo can be used if desired.
   * @property {Number} opacity           The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.
   *
   * @return {sszvis.component}
   */

  function image () {
    return component().prop("projection").prop("src").prop("geoBounds").prop("opacity").opacity(1).render(function () {
      const selection = d3.select(this);
      const props = selection.props();
      const image = selection.selectAll(".sszvis-map__image").data([0]) // At the moment, 1 image per container
      .join("img").classed("sszvis-map__image", true);
      const topLeft = props.projection(props.geoBounds[0]);
      const bottomRight = props.projection(props.geoBounds[1]);
      image.attr("src", props.src).style("left", Math.round(topLeft[0]) + "px").style("top", Math.round(topLeft[1]) + "px").style("width", Math.round(bottomRight[0] - topLeft[0]) + "px").style("height", Math.round(bottomRight[1] - topLeft[1]) + "px").style("opacity", props.opacity);
    });
  }

  /**
   * mesh renderer component
   *
   * @module sszvis/map/renderer/mesh
   *
   * A component used internally for rendering the borders of all map entities as a single mesh.
   * This component expects a GeoJson object which is a single polyline for the entire mesh of all borders.
   * All borders will therefore be rendered as one continuous object, which is faster, more memory-efficient,
   * and prevents overlapping borders from creating strange rendering effects. The downside is that the entire
   * line must have a single set of styles which all borders share. To highlight individual borders, use the highlight renderer.
   *
   * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
   * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
   * @property {string, function} borderColor           The color of the border path stroke. Default is white
   *
   * @return {sszvis.component}
   */

  function mapRendererMesh () {
    return component().prop("geoJson").prop("mapPath").prop("borderColor").borderColor("white") // A function or string for the color of all borders. Note: all borders have the same color
    .prop("strokeWidth").strokeWidth(1.25).render(function () {
      const selection = d3.select(this);
      const props = selection.props();

      // add the map borders. These are rendered as one single path element
      const meshLine = selection.selectAll(".sszvis-map__border").data([props.geoJson]).join("path").classed("sszvis-map__border", true);
      meshLine.attr("d", props.mapPath).style("stroke", props.borderColor).style("stroke-width", props.strokeWidth);
    });
  }

  /**
   * patternedlakeoverlay component
   *
   * @module sszvis/map/renderer/patternedlakeoverlay
   *
   * A component used internally for rendering Lake Zurich, and the borders of map entities which
   * lie above Lake Zurich.
   *
   * @property {d3.geo.path} mapPath      A path-generator function used to create the path data string of the provided GeoJson.
   * @property {GeoJson} lakeFeature      A GeoJson object which provides data for the outline shape of Lake Zurich. This shape will
   *                                      be filled with a special texture fill and masked with an alpha gradient fade.
   * @property {GeoJson} lakeBounds       A GeoJson object which provides data for the shape of map entity borders which lie over the
   *                                      lake. These borders will be drawn over the lake shape, as grey dotted lines.
   *
   * @return {sszvis.component}
   */

  function mapRendererPatternedLakeOverlay () {
    return component().prop("mapPath").prop("lakeFeature").prop("lakeBounds").prop("lakePathColor").prop("fadeOut").fadeOut(true).render(function () {
      const selection = d3.select(this);
      const props = selection.props();

      // the lake texture
      ensureDefsElement(selection, "pattern", "lake-pattern").call(mapLakePattern);
      if (props.fadeOut) {
        // the fade gradient
        ensureDefsElement(selection, "linearGradient", "lake-fade-gradient").call(mapLakeFadeGradient);

        // the mask, which uses the fade gradient
        ensureDefsElement(selection, "mask", "lake-fade-mask").call(mapLakeGradientMask);
      }

      // generate the Lake Zurich path
      const zurichSee = selection.selectAll(".sszvis-map__lakezurich").data([props.lakeFeature]).join("path").classed("sszvis-map__lakezurich", true).attr("d", props.mapPath).attr("fill", "url(#lake-pattern)");
      if (props.fadeOut) {
        // this mask applies the fade effect
        zurichSee.attr("mask", "url(#lake-fade-mask)");
      }

      // add a path for the boundaries of map entities which extend over the lake.
      // This path is rendered as a dotted line over the lake shape
      const lakePath = selection.selectAll(".sszvis-map__lakepath").data([props.lakeBounds]).join("path").classed("sszvis-map__lakepath", true).attr("d", props.mapPath);
      if (props.lakePathColor) {
        lakePath.style("stroke", props.lakePathColor);
      }
    });
  }

  /**
   * raster renderer component
   *
   * @module  sszvis/map/renderer/raster
   *
   * Used for rendering a raster layer within a map (can also be used in other contexts, but the map usage
   * is the most straightforward). Requires a width and a height for the raster layer, a function which
   * returns raster positions, and one which returns fill colors.
   *
   * @property {Boolean} debug         Whether to activate debug mode, which shows a red square over the whole
   *                                   canvas, for testing alignment with other map layers.
   * @property {Number} width          The width of the canvas
   * @property {Number} height         The height of the canvas
   * @property {Function} position     A function which takes a datum and returns a position for the corresponding
   *                                   raster square, returned as [x, y] pairs.
   * @property {Number} cellSide       The length (in pixels) of one side of each raster cell
   * @property {Function} fill         The fill function. Takes a datum and should return a fill color for the datum's pixel.
   * @property {Number} opacity        The opacity of the canvas. Defaults to 1
   *
   * @return {sszvis.component}
   */

  function raster () {
    return component().prop("debug").debug(false).prop("width").prop("height").prop("position").prop("cellSide").cellSide(2).prop("fill", functor).prop("opacity").opacity(1).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const canvas = selection.selectAll(".sszvis-map__rasterimage").data([0]).join("canvas").classed("sszvis-map__rasterimage", true);
      canvas.attr("width", props.width).attr("height", props.height).style("opacity", props.opacity);
      const ctx = canvas.node().getContext("2d");
      ctx.clearRect(0, 0, props.width, props.height);
      if (props.debug) {
        // Displays a rectangle that fills the canvas.
        // Useful for checking alignment with other render layers.
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(0, 0, props.width, props.height);
      }
      const halfSide = props.cellSide / 2;
      for (const datum of data) {
        const position = props.position(datum);
        ctx.fillStyle = props.fill(datum);
        ctx.fillRect(position[0] - halfSide, position[1] - halfSide, props.cellSide, props.cellSide);
      }
    });
  }

  /**
   * zurichStadtKreise Map Component
   *
   * To use this component, pass data in the usual manner. Each data object is expected to have a value which
   * will be used to match that object with a particular map entity. The possible id values depend on the map type.
   * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
   * The default key which map.js expects is 'geoId', but by changing the keyName property of the map, you can pass data which
   * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
   *
   * @property {Number} width                           The width of the map. Used to create the map projection function
   * @property {Number} height                          The height of the map. Used to create the map projection function
   * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
   * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
   * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
   * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
   *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
   * @property {String, Function} fill                  A string or function for the fill of the map entities
   * @property {String} borderColor                     A string for the border color of the map entities
   * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
   * @property {Component} anchoredShape                A shape to anchor to the base map elements of this map. For example, anchoredCircles for a bubble map.
   * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
   * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
   *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
   *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
   *
   * @return {d3.component}
   */

  function choropleth () {
    const event = d3.dispatch("over", "out", "click");
    const baseRenderer = mapRendererBase();
    const meshRenderer = mapRendererMesh();
    const lakeRenderer = mapRendererPatternedLakeOverlay();
    const highlightRenderer = mapRendererHighlight();
    const mapComponent = component().prop("width").prop("height").prop("keyName").keyName(GEO_KEY_DEFAULT).prop("withLake").withLake(true).prop("anchoredShape").prop("features").prop("borders").prop("lakeFeatures").prop("lakeBorders").prop("lakeFadeOut").lakeFadeOut(false).delegate("defined", baseRenderer).delegate("fill", baseRenderer).delegate("transitionColor", baseRenderer).delegate("borderColor", meshRenderer).delegate("strokeWidth", meshRenderer).delegate("highlight", highlightRenderer).delegate("highlightStroke", highlightRenderer).delegate("highlightStrokeWidth", highlightRenderer).delegate("lakePathColor", lakeRenderer).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();

      // create a map path generator function
      const mapPath = swissMapPath(props.width, props.height, props.features, "zurichStadtfeatures");
      const mergedData = prepareMergedGeoData(data, props.features, props.keyName);

      // Base shape
      baseRenderer.geoJson(props.features).mergedData(mergedData).mapPath(mapPath);

      // Border mesh
      meshRenderer.geoJson(props.borders).mapPath(mapPath);

      // Lake Zurich shape
      lakeRenderer.lakeFeature(props.lakeFeatures).lakeBounds(props.lakeBorders).mapPath(mapPath).fadeOut(props.lakeFadeOut);

      // Highlight mesh
      highlightRenderer.geoJson(props.features).keyName(props.keyName).mapPath(mapPath);

      // Rendering

      selection.call(baseRenderer).call(meshRenderer);
      if (props.withLake) {
        selection.call(lakeRenderer);
      }
      selection.call(highlightRenderer);
      if (props.anchoredShape) {
        props.anchoredShape.mergedData(mergedData).mapPath(mapPath);
        selection.call(props.anchoredShape);
      }

      // Event Binding

      selection.selectAll("[data-event-target]").on("mouseover", function (d) {
        event.call("over", this, d.datum);
      }).on("mouseout", function (d) {
        event.call("out", this, d.datum);
      }).on("click", function (d) {
        event.call("click", this, d.datum);
      });
    });
    mapComponent.on = function () {
      const value = event.on.apply(event, arguments);
      return value === event ? mapComponent : value;
    };
    return mapComponent;
  }

  /**
   * Parsing functions
   *
   * @module sszvis/parse
   */

  const timeParse = d3.timeFormatLocale(locale).parse;

  /**
   * Parse Swiss date strings
   * @param  {String} d A Swiss date string, e.g. 17.08.2014
   * @return {Date}
   */
  const dateParser = timeParse("%d.%m.%Y");
  const parseDate = function (d) {
    return dateParser(d);
  };

  /**
   * Parse year values
   * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
   * @return {Date}       A javascript date object for the first time in the given year
   */
  const yearParser = timeParse("%Y");
  const parseYear = function (d) {
    return yearParser(d);
  };

  /**
   * Parse untyped input
   * @param  {String} d A value that could be a number
   * @return {Number}   If d is not a number, NaN is returned
   */
  const parseNumber = function (d) {
    return d.trim() === "" ? Number.NaN : +d;
  };

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
   * var props = queryProps(sszvis.measureDimensions('#sszvis-chart'));
   * --- OR ---
   * var props = queryProps(sszvis.bounds({ ... }, '#sszvis-chart'));
   *
   * ... use props.axisOrientation, props.height, and props.numAxisTicks ...
   *
   * @returns {responsiveProps}
   */


  /* Exported module
  ----------------------------------------------- */
  function responsiveProps() {
    let breakpointSpec = breakpointDefaultSpec();
    const propsConfig = {};

    /**
     * Constructor
     *
     * @param   {{width: number, screenHeight: number}} arg1 Accepts a 'measurements' object with a
     *          'width' property and a 'screenHeight' property. This makes it possible to pass
     *          in a sszvis.bounds object or the result of sszvis.measureDimensions.
     *
     * @returns {Object.<string, any>} A map of all properties for the currently selected
     *          breakpoint as defined by the parameter `arg1`
     */
    function _responsiveProps(measurement) {
      if (!isObject(measurement) || !isBounds(measurement)) {
        warn("Could not determine the current breakpoint, returning the default props");
        // We choose the _ option for all configured props as a default.
        return Object.keys(propsConfig).reduce((memo, val, key) => {
          memo[key] = val._;
          return memo;
        }, {});
      }

      // Finds out which breakpoints the provided measurements match up with
      const matchingBreakpoints = breakpointMatch(breakpointSpec, measurement);
      return Object.keys(propsConfig).reduce((memo, propKey) => {
        const propSpec = propsConfig[propKey];
        if (!validatePropSpec(propSpec, breakpointSpec)) {
          warn('responsiveProps was given an invalid propSpec for property: "' + propKey + '". The spec: ', propSpec);
          return memo;
        }

        // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
        // This function should always at least find '_' at the end of the array.
        const matchedBreakpoint = find(bp => defined(propSpec[bp.name]), matchingBreakpoints);
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
    _responsiveProps.prop = function (propName, propSpec) {
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
    _responsiveProps.breakpoints = function (bps) {
      if (arguments.length === 0) {
        return breakpointSpec;
      }
      breakpointSpec = breakpointCreateSpec(bps);
      return _responsiveProps;
    };
    return _responsiveProps;
  }

  // Helpers

  function isBounds(arg1) {
    return defined(arg1) && defined(arg1.width) && defined(arg1.screenWidth) && defined(arg1.screenHeight);
  }

  /**
   * functorizeValues
   * @prop    {object} obj Original key-value object
   * @returns {object} Same as input object but with all values transformed to fn.functors
   */
  function functorizeValues(obj) {
    return Object.keys(obj).reduce((memo, key) => {
      memo[key] = functor(obj[key]);
      return memo;
    }, {});
  }
  function validatePropSpec(propSpec, breakpointSpec) {
    // Ensure that the propSpec contains a '_' value.
    // This is used as the default value when the test width
    // is larger than any breakpoint.
    if (!defined(propSpec._)) {
      return false;
    }

    // Validate the properties of the propSpec:
    // each should be a valid breakpoint name, and its value should be defined
    for (const breakpointName in propSpec) {
      if (Object.prototype.hasOwnProperty.call(propSpec, breakpointName) && breakpointName !== "_" && !defined(breakpointFindByName(breakpointSpec, breakpointName))) {
        return false;
      }
    }

    // All checks passed, propSpec is valid
    return true;
  }

  /**
   * ModularText component
   *
   * Create structured text with formatting and newlines. Use either the HTML or
   * SVG variant, depending on the output you expect.
   *
   * @module sszvis/svgUtils/modularText/html
   * @module sszvis/svgUtils/modularText/svg
   *
   * @example HTML
   * var fmtHtml = sszvis.svgUtils.modularText.html()
   *   .plain('Artist:')
   *   .plain(function(d) { return d.name; })
   *   .newline()
   *   .bold(function(d) { return d.age; })
   *   .italic('years old');
   * fmtHtml({name: 'Patti', age: 67});
   * //=> "Artist: Patti<br/><strong>67</strong> <em>years old</em>"
   *
   * @example SVG
   * var fmtSvg = sszvis.svgUtils.modularText.svg()
   *   .bold(function(d) { return d.items; })
   *   .plain('items');
   * fmtSvg({items: 30});
   * //=> "<tspan x="0" dy="0"><tspan style="font-weight:bold">30</tspan> <tspan>items</tspan></tspan>"
   *
   * @property {string, function} plain  String without formatting
   * @property {string, function} italic String with italic style
   * @property {string, function} bold   String with bold style
   * @property newline                   Insert a line break
   *
   * @return {function} Formatting function that accepts a datum
   */

  function formatHTML() {
    const styles = {
      plain(d) {
        return d;
      },
      italic(d) {
        return "<em>" + d + "</em>";
      },
      bold(d) {
        return "<strong>" + d + "</strong>";
      }
    };
    return function (textBody, datum) {
      return textBody.lines().map(line => line.map(word => styles[word.style].call(null, word.text(datum))).join(" ")).join("<br/>");
    };
  }
  function formatSVG() {
    const styles = {
      plain(d) {
        return "<tspan>" + d + "</tspan>";
      },
      italic(d) {
        return '<tspan style="font-style:italic">' + d + "</tspan>";
      },
      bold(d) {
        return '<tspan style="font-weight:bold">' + d + "</tspan>";
      }
    };
    return function (textBody, datum) {
      return textBody.lines().reduce((svg, line, i) => {
        const lineSvg = line.map(word => styles[word.style].call(null, word.text(datum))).join(" ");
        const dy = i === 0 ? 0 : "1.2em";
        return svg + '<tspan x="0" dy="' + dy + '">' + lineSvg + "</tspan>";
      }, "");
    };
  }
  function structuredText() {
    const lines = [[]];
    return {
      addLine() {
        lines.push([]);
      },
      addWord(style, text) {
        last(lines).push({
          text: functor(text),
          style
        });
      },
      lines() {
        return lines;
      }
    };
  }
  function makeTextWithFormat(format) {
    return function () {
      const textBody = structuredText();
      function makeText(d) {
        return format(textBody, d);
      }
      makeText.newline = function () {
        textBody.addLine();
        return makeText;
      };
      for (const style of ["bold", "italic", "plain"]) {
        makeText[style] = function (text) {
          textBody.addWord(style, text);
          return makeText;
        };
      }
      return makeText;
    };
  }
  const modularTextHTML = makeTextWithFormat(formatHTML());
  const modularTextSVG = makeTextWithFormat(formatSVG());

  exports.AGGLOMERATION_2012_KEY = AGGLOMERATION_2012_KEY;
  exports.DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;
  exports.DEFAULT_WIDTH = DEFAULT_WIDTH;
  exports.GEO_KEY_DEFAULT = GEO_KEY_DEFAULT;
  exports.RATIO = RATIO;
  exports.STADT_KREISE_KEY = STADT_KREISE_KEY;
  exports.STATISTISCHE_QUARTIERE_KEY = STATISTISCHE_QUARTIERE_KEY;
  exports.STATISTISCHE_ZONEN_KEY = STATISTISCHE_ZONEN_KEY;
  exports.SWITZERLAND_KEY = SWITZERLAND_KEY;
  exports.WAHL_KREISE_KEY = WAHL_KREISE_KEY;
  exports.annotationCircle = circle;
  exports.annotationConfidenceArea = confidenceArea;
  exports.annotationLine = line$1;
  exports.annotationRangeFlag = rangeFlag;
  exports.annotationRangeRuler = rangeRuler;
  exports.annotationRectangle = rectangle;
  exports.annotationRuler = annotationRuler;
  exports.app = app;
  exports.arity = arity;
  exports.aspectRatio = aspectRatio;
  exports.aspectRatio12to5 = aspectRatio12to5;
  exports.aspectRatio16to10 = aspectRatio16to10;
  exports.aspectRatio4to3 = aspectRatio4to3;
  exports.aspectRatioAuto = aspectRatioAuto;
  exports.aspectRatioPortrait = aspectRatioPortrait;
  exports.aspectRatioSquare = aspectRatioSquare;
  exports.axisX = axisX;
  exports.axisY = axisY;
  exports.bar = bar;
  exports.bounds = bounds;
  exports.breakpointCreateSpec = breakpointCreateSpec;
  exports.breakpointDefaultSpec = breakpointDefaultSpec;
  exports.breakpointFind = breakpointFind;
  exports.breakpointFindByName = breakpointFindByName;
  exports.breakpointLap = breakpointLap;
  exports.breakpointMatch = breakpointMatch;
  exports.breakpointPalm = breakpointPalm;
  exports.breakpointTest = breakpointTest;
  exports.buttonGroup = buttonGroup;
  exports.cascade = cascade;
  exports.choropleth = choropleth;
  exports.colorLegendDimensions = colorLegendDimensions;
  exports.colorLegendLayout = colorLegendLayout;
  exports.compose = compose;
  exports.contains = contains$1;
  exports.createHtmlLayer = createHtmlLayer;
  exports.createSvgLayer = createSvgLayer;
  exports.dataAreaPattern = dataAreaPattern;
  exports.defaultTransition = defaultTransition;
  exports.defined = defined;
  exports.derivedSet = derivedSet;
  exports.dimensionsHeatTable = heatTableDimensions;
  exports.dimensionsHorizontalBarChart = horizontalBarChartDimensions;
  exports.dimensionsVerticalBarChart = verticalBarChartDimensions;
  exports.dot = dot;
  exports.ensureDefsElement = ensureDefsElement;
  exports.every = every;
  exports.fallbackCanvasUnsupported = fallbackCanvasUnsupported;
  exports.fallbackRender = fallbackRender;
  exports.fallbackUnsupported = fallbackUnsupported;
  exports.fastTransition = fastTransition;
  exports.filledArray = filledArray;
  exports.find = find;
  exports.first = first;
  exports.firstTouch = firstTouch;
  exports.fitTooltip = fitTooltip;
  exports.flatten = flatten;
  exports.foldPattern = foldPattern;
  exports.formatAge = formatAge;
  exports.formatAxisTimeFormat = formatAxisTimeFormat;
  exports.formatFractionPercent = formatFractionPercent;
  exports.formatMonth = formatMonth;
  exports.formatNone = formatNone;
  exports.formatNumber = formatNumber;
  exports.formatPercent = formatPercent;
  exports.formatPreciseNumber = formatPreciseNumber;
  exports.formatText = formatText;
  exports.formatYear = formatYear;
  exports.functor = functor;
  exports.getGeoJsonCenter = getGeoJsonCenter;
  exports.groupedBars = groupedBars;
  exports.halfPixel = halfPixel;
  exports.handleRuler = handleRuler;
  exports.hashableSet = hashableSet;
  exports.heatTableMissingValuePattern = heatTableMissingValuePattern;
  exports.identity = identity$1;
  exports.isFunction = isFunction$1;
  exports.isNull = isNull;
  exports.isNumber = isNumber;
  exports.isObject = isObject;
  exports.isSelection = isSelection;
  exports.isString = isString;
  exports.last = last;
  exports.layoutPopulationPyramid = populationPyramidLayout;
  exports.layoutSmallMultiples = smallMultiples;
  exports.layoutStackedAreaMultiples = stackedAreaMultiplesLayout;
  exports.legendColorBinned = binnedColorScale;
  exports.legendColorLinear = linearColorScale;
  exports.legendColorOrdinal = legendColorOrdinal;
  exports.legendRadius = radius;
  exports.line = line;
  exports.loadError = loadError;
  exports.locale = locale;
  exports.mapLakeFadeGradient = mapLakeFadeGradient;
  exports.mapLakeGradientMask = mapLakeGradientMask;
  exports.mapLakePattern = mapLakePattern;
  exports.mapMissingValuePattern = mapMissingValuePattern;
  exports.mapRendererBase = mapRendererBase;
  exports.mapRendererBubble = bubble;
  exports.mapRendererGeoJson = geojson;
  exports.mapRendererHighlight = mapRendererHighlight;
  exports.mapRendererImage = image;
  exports.mapRendererMesh = mapRendererMesh;
  exports.mapRendererPatternedLakeOverlay = mapRendererPatternedLakeOverlay;
  exports.mapRendererRaster = raster;
  exports.measureAxisLabel = measureAxisLabel;
  exports.measureDimensions = measureDimensions;
  exports.measureLegendLabel = measureLegendLabel;
  exports.measureText = measureText;
  exports.memoize = memoize;
  exports.modularTextHTML = modularTextHTML;
  exports.modularTextSVG = modularTextSVG;
  exports.move = move;
  exports.muchDarker = muchDarker;
  exports.nestedStackedBarsVertical = nestedStackedBarsVertical;
  exports.not = not;
  exports.panning = panning;
  exports.parseDate = parseDate;
  exports.parseNumber = parseNumber;
  exports.parseYear = parseYear;
  exports.pie = pie;
  exports.pixelsFromGeoDistance = pixelsFromGeoDistance;
  exports.prepareMergedGeoData = prepareMergedGeoData;
  exports.prop = prop;
  exports.propOr = propOr;
  exports.pyramid = pyramid;
  exports.range = range;
  exports.responsiveProps = responsiveProps;
  exports.roundTransformString = roundTransformString;
  exports.rulerLabelVerticalSeparate = rulerLabelVerticalSeparate;
  exports.sankey = sankey;
  exports.sankeyLayout = computeLayout$1;
  exports.sankeyPrepareData = prepareData$1;
  exports.scaleDeepGry = scaleDeepGry;
  exports.scaleDimGry = scaleDimGry;
  exports.scaleDivNtr = scaleDivNtr;
  exports.scaleDivNtrGry = scaleDivNtrGry;
  exports.scaleDivVal = scaleDivVal;
  exports.scaleDivValGry = scaleDivValGry;
  exports.scaleGender3 = scaleGender3;
  exports.scaleGender5Wedding = scaleGender5Wedding;
  exports.scaleGender6Origin = scaleGender6Origin;
  exports.scaleGry = scaleGry;
  exports.scaleLightGry = scaleLightGry;
  exports.scaleMedGry = scaleMedGry;
  exports.scalePaleGry = scalePaleGry;
  exports.scaleQual12 = scaleQual12;
  exports.scaleQual6 = scaleQual6;
  exports.scaleQual6a = scaleQual6a;
  exports.scaleQual6b = scaleQual6b;
  exports.scaleSeqBlu = scaleSeqBlu;
  exports.scaleSeqBrn = scaleSeqBrn;
  exports.scaleSeqGrn = scaleSeqGrn;
  exports.scaleSeqRed = scaleSeqRed;
  exports.selectMenu = select;
  exports.set = set$1;
  exports.slider = slider;
  exports.slightlyDarker = slightlyDarker;
  exports.slowTransition = slowTransition;
  exports.some = some;
  exports.stackedArea = stackedArea;
  exports.stackedAreaMultiples = stackedAreaMultiples;
  exports.stackedBarHorizontal = stackedBarHorizontal;
  exports.stackedBarHorizontalData = stackedBarHorizontalData;
  exports.stackedBarVertical = stackedBarVertical;
  exports.stackedBarVerticalData = stackedBarVerticalData;
  exports.stackedPyramid = stackedPyramid;
  exports.stackedPyramidData = stackedPyramidData;
  exports.stringEqual = stringEqual;
  exports.sunburst = sunburst;
  exports.sunburstGetRadiusExtent = getRadiusExtent;
  exports.sunburstLayout = computeLayout;
  exports.sunburstPrepareData = prepareData;
  exports.swissMapPath = swissMapPath;
  exports.swissMapProjection = swissMapProjection;
  exports.textWrap = textWrap;
  exports.tooltip = tooltip;
  exports.tooltipAnchor = tooltipAnchor;
  exports.transformTranslateSubpixelShift = transformTranslateSubpixelShift;
  exports.translateString = translateString;
  exports.viewport = viewport;
  exports.voronoi = voronoi;
  exports.widthAdaptiveMapPathStroke = widthAdaptiveMapPathStroke;
  exports.withAlpha = withAlpha;

}));
