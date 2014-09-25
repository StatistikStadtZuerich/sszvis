/**
 * A collection of functional helper functions
 *
 * @module sszvis/fn
 */
namespace('sszvis.fn', function(module) {

  var slice = function(list) {
    var slice = Array.prototype.slice;
    return slice.apply(list, slice.call(arguments, 1));
  }

  module.exports = {
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

    identity: function(value) {
      return value;
    },

    constant: function(value) {
      return function() {
        return value;
      };
    },

    last: function(arr) {
      return arr[arr.length - 1];
    },

    not: function (f) {
      return function(){ return !f.apply(this, arguments) };
    },

    partial: function(func, var_args) {
      var argsArr = slice(arguments, 1);
      return function(){
        return func.apply(this, argsArr.concat(slice(arguments)));
      };
    },

    prop: function(key) {
      return function(object) {
        return object[key];
      }
    },

    uniqueSorted: function(arr) {
      var seen, value, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        value = arr[i];
        if (!i || seen !== value) result.push(value);
        seen = value;
      }
      return result;
    },

    uniqueUnsorted: function(arr) {
      var seen = [], value, result = [];
      for (var i = 0, l = arr.length; i < l; ++i) {
        value = arr[i];
        if (seen.indexOf(value) < 0) {
          seen.push(value);
          result.push(value);
        }
      }
      return result;
    }
  }

});
