import { selection } from 'd3';

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
 */
const identity = function (value) {
  return value;
};
/**
 * fn.isString
 *
 * determine whether the value is a string
 */
const isString = function (val) {
  return Object.prototype.toString.call(val) === "[object String]";
};
/**
 * fn.isSelection
 *
 * determine whether the value is a d3.selection.
 */
const isSelection = function (val) {
  return val instanceof selection;
};
/**
 * fn.arity
 *
 * Wraps a function of any arity (including nullary) in a function that
 * accepts exactly `n` parameters. Any extraneous parameters will not be
 * passed to the supplied function.
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
 */
const compose = function () {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }
  const start = fns.length - 1;
  return function () {
    let i = start;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    let result = Reflect.apply(fns[i], this, args);
    while (i--) result = fns[i].call(this, result);
    return result;
  };
};
/**
 * fn.contains
 *
 * Checks whether an item is present in the given list (by strict equality).
 */
const contains = function (list, d) {
  return list.includes(d);
};
/**
 * fn.defined
 *
 * determines if the passed value is defined.
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
 */
const derivedSet = function (arr, acc) {
  const accessor = acc || identity;
  const seen = [];
  const result = [];
  let sValue, cValue;
  for (let i = 0, l = arr.length; i < l; ++i) {
    sValue = arr[i];
    cValue = accessor(sValue, i, arr);
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
 */
const find = function (predicate, arr) {
  for (const element of arr) {
    if (predicate(element)) {
      return element;
    }
  }
  return undefined;
};
/**
 * fn.first
 *
 * Returns the first value in the passed array, or undefined if the array is empty
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
 * @example
 * sszvis.foldPattern('formalGreeting', {
 *   formalGreeting: function() { return "Pleased to meet you."},
 *   informalGreeting: function() { return "How ya' doin!" }
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
 */
const hashableSet = function (arr, acc) {
  const accessor = acc || identity;
  const seen = {};
  const result = [];
  let value;
  for (let i = 0, l = arr.length; i < l; ++i) {
    value = accessor(arr[i], i, arr);
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
 */
const isFunction = function (val) {
  return typeof val == "function";
};
/**
 * fn.isNull
 *
 * determines if the passed value is null.
 */
const isNull = function (val) {
  return val === null;
};
/**
 * fn.isNumber
 *
 * determine whether the value is a number
 */
const isNumber = function (val) {
  return Object.prototype.toString.call(val) === "[object Number]" && !Number.isNaN(val);
};
/**
 * fn.isObject
 *
 * determines if the passed value is of an "object" type, or if it is something else,
 * e.g. a raw number, string, null, undefined, NaN, something like that.
 */
const isObject = function (val) {
  return Object(val) === val;
};
/**
 * fn.last
 *
 * Returns the last value in the passed array, or undefined if the array is empty
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
 */
const not = function (f) {
  return function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    return !Reflect.apply(f, this, args);
  };
};
/**
 * fn.prop
 *
 * takes the name of a property and returns a property accessor function
 * for the named property. When the accessor function is called on an object,
 * it returns that object's value for the named property. (or undefined, if the object
 * does not contain the property.)
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
 */
const set = function (arr, acc) {
  const accessor = acc || identity;
  return arr.reduce((m, value, i) => {
    const computed = accessor(value, i, arr);
    return m.includes(computed) ? m : [...m, computed];
  }, []);
};
/**
 * fn.some
 *
 * Test an array with a predicate and determine whether some element in the array passes the test.
 * Returns true as soon as an element passes the test. Returns false otherwise.
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
    const key = resolver ? resolver(...arguments) : arguments.length <= 0 ? undefined : arguments[0];
    const cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...arguments);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new Map();
  return memoized;
};

export { arity, compose, contains, defined, derivedSet, every, filledArray, find, first, firstTouch, flatten, foldPattern, functor, hashableSet, identity, isFunction, isNull, isNumber, isObject, isSelection, isString, last, memoize, not, prop, propOr, set, some, stringEqual };
//# sourceMappingURL=fn.js.map
