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

sszvis_namespace('sszvis.cascade', function(module) {
'use strict';

  function groupBy(data, keyFunc) {
    var group = {}, key;
    for (var i = 0, l = data.length, value; i < l; ++i) {
      value = data[i];
      key = keyFunc(value);
      group[key] ? group[key].push(value) : (group[key] = [value]);
    }
    return group;
  }

  function groupEach(data, func) {
    for (var prop in data) {
      func(data[prop], prop);
    }
  }

  function arrEach(arr, func) {
    for (var i = 0, l = arr.length; i < l; ++i) {
      func(arr[i], i);
    }
  }

  module.exports = function() {
    var cascade = {},
        keys = [],
        sorts = [],
        valuesSort;

    function make(data, depth) {
      if (depth >= keys.length) {
        if (valuesSort) data.sort(valuesSort);
        return data;
      }

      var sorter = sorts[depth];
      var key = keys[depth++];
      var grouped = groupBy(data, key.func);

      if (key.type === 'obj') {
        var obj = {};
        groupEach(grouped, function(value, key) {
          obj[key] = make(value, depth);
        });
        return obj;
      } else if (key.type === 'arr') {
        var arr = [];
        if (sorter) {
          var groupKeys = Object.keys(grouped).sort(sorter);
          arrEach(groupKeys, function(k) {
            arr.push(make(grouped[k], depth));
          });
        } else {
          groupEach(grouped, function(value) {
            arr.push(make(value, depth));
          });
        }
        return arr;
      }
    }

    cascade.apply = function(data) {
      return make(data, 0);
    };

    cascade.objectBy = function(d) {
      keys.push({
        type: 'obj',
        func: d
      });
      return cascade;
    };

    cascade.arrayBy = function(d, sorter) {
      keys.push({
        type: 'arr',
        func: d
      });
      if (sorter) sorts[keys.length - 1] = sorter;
      return cascade;
    };

    cascade.sort = function(d) {
      valuesSort = d;
      return cascade;
    };

    return cascade;
  };

});
