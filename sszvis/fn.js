/**
 * A collection of functional helper functions
 *
 * @module sszvis/fn
 */
namespace('sszvis.fn', function(module) {
"use strict";

  var slice = function(list) {
    var slice = Array.prototype.slice;
    return slice.apply(list, slice.call(arguments, 1));
  }

  module.exports = {
    /**
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

    constant: function(value) {
      return function() {
        return value;
      };
    },

    defined: function(val) {
      return typeof val !== 'undefined';
    },

    either: function(val, fallback) {
      return (typeof val === "undefined") ? fallback : val;
    },

    find: function(predicate, list) {
      var idx = -1;
      var len = list.length;
      while (++idx < len) {
        if (predicate(list[idx])) return list[idx];
      }
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

    identity: function(value) {
      return value;
    },

    not: function (f) {
      return function(){ return !f.apply(this, arguments) };
    },

    prop: function(key) {
      return function(object) {
        return object[key];
      }
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
    }

  }

});
