namespace('sszvis.cascade', function(module) {
"use strict";

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