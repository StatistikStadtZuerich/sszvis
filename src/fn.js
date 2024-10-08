/**
 * A collection of functional programming helper functions
 *
 * @module sszvis/fn
 */

import { selection } from "d3";

/**
 * fn.identity
 *
 * The identity function. It returns the first argument passed to it.
 * Useful as a default where a function is required.
 *
 * @param  {*} value any value
 * @return {*}       returns its argument
 */
export const identity = function (value) {
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
export const isString = function (val) {
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
export const isSelection = function (val) {
  return val instanceof selection;
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
export const arity = function (n, fn) {
  switch (n) {
    case 0: {
      return function () {
        return fn.call(this);
      };
    }
    case 1: {
      return function (a0) {
        return fn.call(this, a0);
      };
    }
    case 2: {
      return function (a0, a1) {
        return fn.call(this, a0, a1);
      };
    }
    case 3: {
      return function (a0, a1, a2) {
        return fn.call(this, a0, a1, a2);
      };
    }
    case 4: {
      return function (a0, a1, a2, a3) {
        return fn.call(this, a0, a1, a2, a3);
      };
    }
    case 5: {
      return function (a0, a1, a2, a3, a4) {
        return fn.call(this, a0, a1, a2, a3, a4);
      };
    }
    case 6: {
      return function (a0, a1, a2, a3, a4, a5) {
        return fn.call(this, a0, a1, a2, a3, a4, a5);
      };
    }
    case 7: {
      return function (a0, a1, a2, a3, a4, a5, a6) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
      };
    }
    case 8: {
      return function (a0, a1, a2, a3, a4, a5, a6, a7) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
      };
    }
    case 9: {
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
      };
    }
    case 10: {
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
      };
    }
    default: {
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
export const compose = function () {
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
export const contains = function (list, d) {
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
export const defined = function (val) {
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
export const derivedSet = function (arr, acc) {
  acc || (acc = identity);
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
export const every = function (predicate, arr) {
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
export const filledArray = function (len, val) {
  const arr = Array.from({ length: len });
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
export const find = function (predicate, arr) {
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
export const first = function (arr) {
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
export const flatten = function (arr) {
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
export const firstTouch = function (event) {
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
export const foldPattern = function (key, pattern) {
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
export const hashableSet = function (arr, acc) {
  acc || (acc = identity);
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
export const isFunction = function (val) {
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
export const isNull = function (val) {
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
export const isNumber = function (val) {
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
export const isObject = function (val) {
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
export const last = function (arr) {
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
export const not = function (f) {
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
export const prop = function (key) {
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
export const propOr = function (key, defaultVal) {
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
export const set = function (arr, acc) {
  acc || (acc = identity);
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
export const some = function (predicate, arr) {
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
export const stringEqual = function (a, b) {
  return a.toString() === b.toString();
};

/**
 * fn.functor
 *
 * Same as fn.functor in d3v3
 */
export const functor = function (v) {
  return typeof v === "function"
    ? v
    : function () {
        return v;
      };
};

/**
 * fn.memoize
 *
 * Adapted from lodash's memoize() but using d3.map() as cache
 * See https://lodash.com/docs/4.17.4#memoize
 */
export const memoize = function (func, resolver) {
  if (typeof func != "function" || (resolver != null && typeof resolver != "function")) {
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
