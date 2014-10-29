/**
 * sszvis.js is the visualization library used by Statistik Stadt Zürich.
 * It uses d3.js <http://d3js.org>
 *
 * The following modules are contained within this file:
 *   @VENDOR - various external dependencies
 *   @SSZVIS - the library itself
 *
 * Contact:
 *   Product Owner     - Statistik Stadt Zürich <https://www.stadt-zuerich.ch/statistik>
 *   Technical Contact - Interactive Things <http://interactivethings.com>
 *
 */




////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  @VENDOR                                                                   //
//                                                                            //
//  External dependencies that need to be available for the                   //
//  to run correctly.                                                         //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////// SECTION ///////////////////////////////////


(function(d3) {

  /**
   * d3 plugin to simplify creating reusable charts. Implements
   * the reusable chart interface and can thus be used interchangeably
   * with any other reusable charts.
   *
   * @example
   * var myAxis = d3.component()
   *   .prop('ticks').ticks(10)
   *   .render(function(data, i, j) {
   *     var selection = d3.select(this);
   *     var props = selection.props();
   *     var axis = d3.svg.axis().ticks(props.ticks);
   *     selection.enter()
   *       .append('g')
   *       .call(axis);
   *   })
   * console.log(myAxis.ticks()); //=> 10
   * d3.select('svg').call(myAxis.ticks(3));
   *
   * @see http://bost.ocks.org/mike/chart/
   *
   * @property {Function} prop Define a property accessor
   * @property {Function} render The chart's body
   *
   * @return {d3.component} A d3 reusable chart
   */
  d3.component = function() {
    var props = {};
    var selectionRenderer = null;
    var renderer = identity;

    /**
     * Constructor
     *
     * @param  {d3.selection} selection Passed in by d3
     */
    function component(selection) {
      if (selectionRenderer) {
        selection.props = function(){ return clone(props); }
        selectionRenderer.apply(selection, slice(arguments));
      }
      selection.each(function() {
        this.__props__ = clone(props);
        renderer.apply(this, slice(arguments));
      });
    }

    /**
     * Define a property accessor with an optional setter
     *
     * @param  {String} prop The property's name
     * @param  {Function} [setter] The setter's context will be bound to the
     *         d3.component. Sets the returned value to the given property
     * @return {d3.component}
     */
    component.prop = function(prop, setter) {
      setter || (setter = identity);
      component[prop] = accessor(props, prop, setter.bind(component)).bind(component);
      return component;
    }

    /**
     * Delegate a properties' accessors to a delegate object
     *
     * @param  {String} prop     The property's name
     * @param  {Object} delegate The target having getter and setter methods for prop
     * @return {d3.component}
     */
    component.delegate = function(prop, delegate) {
      component[prop] = function() {
        var result = delegate[prop].apply(delegate, slice(arguments));
        return (arguments.length === 0) ? result : component;
      }
      return component;
    }

    /**
     * Creates a render context for the given component's parent selection.
     * Use this, when you need full control over the rendering of the component
     * and you need access to the full selection instead of just the selection
     * of one datum.
     *
     * @param  {Function} callback
     * @return {[d3.component]}
     */
    component.renderSelection = function(callback) {
      selectionRenderer = callback;
      return component;
    }

    /**
     * Creates a render context for the given component. Implements the
     * d3.selection.each interface.
     *
     * @see https://github.com/mbostock/d3/wiki/Selections#each
     *
     * @param  {Function} callback
     * @return {d3.component}
     */
    component.render = function(callback) {
      renderer = callback;
      return component;
    }

    return component;
  }

  /**
   * d3.selection plugin to get the properties of a d3.component.
   * Works similarly to d3.selection.data, but for properties.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @return {Object} An object of properties for the given component
   */
  d3.selection.prototype.props = function() {
    // It would be possible to make this work exactly like
    // d3.selection.data(), but it would need some test cases,
    // so we currently simplify to the most common use-case:
    // getting props.
    if (arguments.length) throw new Error("selection.props() does not accept any arguments");
    if (this.length != 1) throw new Error("only one group is supported");
    if (this[0].length != 1) throw new Error("only one node is supported");

    var group = this[0];
    var node  = group[0];
    return node.__props__ || {};
  }

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
    return function() {
      if (!arguments.length) return props[prop];

      props[prop] = setter.apply(null, slice(arguments));
      return this;
    }
  }

  function identity(d) {
    return d;
  }

  function slice(array) {
    return Array.prototype.slice.call(array);
  }

  function clone(obj) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

}(d3));


//////////////////////////////////// SECTION ///////////////////////////////////


(function(d3) {

  var localizedFormat = d3.locale({
    "decimal": ".",
    "thousands": " ",
    "grouping": [3],
    "currency": ["CHF ", ""],
    "dateTime": "%a. %e. %B %X %Y",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": [],
    "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    "shortMonths": ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
  });
  d3.format = localizedFormat.numberFormat
  d3.time.format = localizedFormat.timeFormat

}(d3));


//////////////////////////////////// SECTION ///////////////////////////////////


(function(d3) {

  /**
   * d3.selection plugin to simplify creating idempotent groups that are not
   * recreated when rendered again.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @param  {String} key The name of the group
   * @return {d3.selection}
   */
  d3.selection.prototype.selectGroup = function(key) {
    var group = this.selectAll('[data-d3-selectgroup="' + key + '"]')
      .data(function(d){ return [d] })

    group.enter()
      .append('g')
      .attr('data-d3-selectgroup', key)

    return group;
  };

}(d3));


//////////////////////////////////// SECTION ///////////////////////////////////


(function(d3) {

  /**
   * d3.selection plugin to simplify creating idempotent divs that are not
   * recreated when rendered again.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections
   *
   * @param {String} key - the name of the group
   * @return {d3.selection}
   */
  d3.selection.prototype.selectDiv = function(key) {
    var div = this.selectAll('[data-d3-selectdiv="' + key + '"]')
      .data(function(d) { return [d]; });

    div.enter()
      .append('div')
      .attr('data-d3-selectdiv', key)
      .style('position', 'absolute');

    return div;
  };

}(d3));

//////////////////////////////////// SECTION ///////////////////////////////////


(function(global){

  global.namespace = function(path, body) {
    var segments = path.split('.');
    var ancestors = segments.slice(0, segments.length - 1);
    var target = segments[segments.length - 1];
    var ns = ancestors.reduce(function(root, part) {
      if (typeof root[part] === 'undefined') root[part] = {};
      return root[part];
    }, global);

    var module = {exports: {}};
    body(module);

    return ns[target] = module.exports;
  }

}(window));




////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  @SSZVIS                                                                   //
//                                                                            //
//  The main components of the library                                        //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////// SECTION ///////////////////////////////////


namespace('sszvis.cascade', function(module) {
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

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention.
 *
 * @module sszvis/bounds
 * @see http://bl.ocks.org/mbostock/3019563
 *
 * @param  {Object} bounds
 * @return {Object}
 */
namespace('sszvis.bounds', function(module) {

  module.exports = function(bounds) {
    bounds || (bounds = {});
    var height  = sszvis.fn.either(bounds.height, 100);
    var width   = sszvis.fn.either(bounds.width, 100);
    var padding = {
      top:    sszvis.fn.either(bounds.top, 0),
      right:  sszvis.fn.either(bounds.right, 0),
      bottom: sszvis.fn.either(bounds.bottom, 0),
      left:   sszvis.fn.either(bounds.left, 0)
    }

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width,
    }
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


namespace('sszvis.color', function(module) {

  var values = {
    basicBlue: "#6392C5",
    basicDeepBlue: "#3A75B2",
    plainWhite: "#FFFFFF"
  };

  module.exports.values = {};

  for (var prop in values) {
    module.exports.values[prop] = d3.lab(values[prop]);
  }

  var ranges = {
    qualitative: {
      qual3: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7"
      ],
      qual6: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73"
      ],
      qual9: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73",
        "#faebaf",
        "#e6cf73",
        "#cfe6b8"
      ],
      qual12: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73",
        "#faebaf",
        "#e6cf73",
        "#cfe6b8",
        "#94bf69",
        "#b8e6d2",
        "#60bf97"
      ],
      valuedQual2: [
        "#3b76b3",
        "#cc6171"
      ],
      neutralQual2: [
        "#497f7b",
        "#a57c59"
      ],
      valuedBlue9: [
        "#DDE9FE",
        "#b5cceb",
        "#8cb0d9",
        "#6493c6",
        "#3b76b3",
        "#396899",
        "#385b80",
        "#364d66",
        "#333e4c"
      ],
      valuedRed10: [
        "#fdebeb",
        "#f2c9cd",
        "#e5a7af",
        "#d98490",
        "#cc6171",
        "#ac5663",
        "#8d4b56",
        "#6d4048",
        "#4d353a",
        "#4c3439"
      ],
      neutralGreen9: [
        "#d2dfde",
        "#b0c7c6",
        "#8eb0ad",
        "#6c9894",
        "#4a807c",
        "#436f6d",
        "#3b5e5e",
        "#344d4e",
        "#2c3c3f"
      ],
      neutralBrown9: [
        "#e9dfd6",
        "#d8c7b7",
        "#c8ae98",
        "#b79579",
        "#a67d5a",
        "#906b51",
        "#795a48",
        "#62493e",
        "#4c3735"
      ],
      valuedBluWhtRed9: [
        "#3b76b3",
        "#3b76b3",
        "#3b76b3",
        "#ceddec",
        "#ffffff",
        "#f2d8dc",
        "#e6b0b8",
        "#d98994",
        "#cc6171"
      ],
      valuedBluGryRed9: [
        "#3b76b3",
        "#6995c3",
        "#97b4d3",
        "#c5d4e3",
        "#f3f3f3",
        "#e9ced3",
        "#e0aab2",
        "#d68592",
        "#cc6171"
      ],
      neutralGrnWhtBrn9: [
        "#4a807c",
        "#77a09d",
        "#a5c0be",
        "#d2dfde",
        "#ffffff",
        "#e9dfd6",
        "#d3bead",
        "#bc9e83",
        "#a67d5a"
      ],
      neutralGrnGryBrn9: [
        "#4a807c",
        "#749d9a",
        "#9fbab8",
        "#c9d6d5",
        "#f3f3f3",
        "#e0d5cd",
        "#cdb8a7",
        "#b99b80",
        "#a67d5a"
      ]
    },
    sequential: {
      valued: {
        blue: [
          "#dce8fd",
          "#3a75b2",
          "#333e4c"
        ],
        red: [
          "#fdebeb",
          "#cb6070",
          "#4c3439"
        ]
      },
      neutral: {
        green: [
          "#d1dedd",
          "#497f7b",
          "#2b3b3e"
        ],
        brown: [
          "#e8ded5",
          "#a57c59",
          "#4b3634"
        ]
      }
    },
    divergent: {
      valued: {
        bluWhtRed: [
          "#3a75b2",
          "#ffffff",
          "#cb6070"
        ],
        bluGryRed: [
          "#3a75b2",
          "#f2f2f2",
          "#cb6070"
        ]
      },
      neutral: {
        grnWhtBrn: [
          "#497f7b",
          "#ffffff",
          "#a57c59"
        ],
        grnGryBrn: [
          "#497f7b",
          "#f2f2f2",
          "#a57c59"
        ]
      }
    }
  };

  module.exports.ranges = {
    qualitative: {},
    sequential: {
      valued: {},
      neutral: {}
    },
    divergent: {
      valued: {},
      neutral: {}
    }
  };

  function makeLabArr(arr) {
    return arr.map(function(c) { return d3.lab(c); });
  }

  for (var prop in ranges.qualitative) {
    module.exports.ranges.qualitative[prop] = makeLabArr(ranges.qualitative[prop]);
  }

  for (var prop in ranges.sequential.valued) {
    module.exports.ranges.sequential.valued[prop] = makeLabArr(ranges.sequential.valued[prop]);
  }

  for (var prop in ranges.sequential.neutral) {
    module.exports.ranges.sequential.neutral[prop] = makeLabArr(ranges.sequential.neutral[prop]);
  }

  for (var prop in ranges.divergent.valued) {
    module.exports.ranges.divergent.valued[prop] = makeLabArr(ranges.divergent.valued[prop]);
  }

  for (var prop in ranges.divergent.neutral) {
    module.exports.ranges.divergent.neutral[prop] = makeLabArr(ranges.divergent.neutral[prop]);
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * @module sszvis/patterns
 *
 */
namespace('sszvis.patterns', function(module) {

  module.exports.ensureDefs = function(selection) {
    var defs = selection.selectAll('defs')
      .data([1]);

    defs.enter()
      .append('defs');

    return defs;
  };

  module.exports.ensurePattern = function(selection, patternId) {
    var pattern = sszvis.patterns.ensureDefs(selection)
      .selectAll('pattern#' + patternId)
      .data([1])
      .enter()
      .append('pattern')
      .attr('id', patternId);

    return pattern;
  };

  module.exports.mapMissingValuePattern = function(selection) {
    var pWidth = 4;
    var pHeight = 4;
    var offset = 0.5;

    selection
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#bfbfbf');

    selection
      .append('line')
      .attr('x1', 0)
      .attr('y1', pHeight * offset)
      .attr('x2', pWidth * offset)
      .attr('y2', 0)
      .attr('stroke', '#737373');

    selection
      .append('line')
      .attr('x1', pWidth * offset)
      .attr('y1', pHeight)
      .attr('x2', pWidth)
      .attr('y2', pHeight * offset)
      .attr('stroke', '#737373');
  };

  module.exports.mapLakePattern = function(selection) {
    var pWidth = 6;
    var pHeight = 6;
    var offset = 0.5;

    selection
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight)
      .attr('fill', '#fff');

    selection
      .append('line')
      .attr('x1', 0)
      .attr('y1', pHeight * offset)
      .attr('x2', pWidth * offset)
      .attr('y2', 0)
      .attr('stroke', '#d0d0d0');

    selection
      .append('line')
      .attr('x1', pWidth * offset)
      .attr('y1', pHeight)
      .attr('x2', pWidth)
      .attr('y2', pHeight * offset)
      .attr('stroke', '#d0d0d0');
  };

  module.exports.dataAreaPattern = function(selection) {
    var pWidth = 6;
    var pHeight = 6;
    var offset = 0.5;

    selection
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternContentUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', pWidth)
      .attr('height', pHeight);

    selection
      .append('line')
      .attr('x1', 0)
      .attr('y1', pHeight * offset)
      .attr('x2', pWidth * offset)
      .attr('y2', 0)
      .attr('stroke', '#d0d0d0');

    selection
      .append('line')
      .attr('x1', pWidth * offset)
      .attr('y1', pHeight)
      .attr('x2', pWidth)
      .attr('y2', pHeight * offset)
      .attr('stroke', '#d0d0d0');
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


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
      return (typeof val === 'undefined') ? fallback : val;
    },

    find: function(predicate, list) {
      var idx = -1;
      var len = list.length;
      while (++idx < len) {
        if (predicate(list[idx])) return list[idx];
      }
    },

    first: function(arr) {
      return arr[0];
    },

    last: function(arr) {
      return arr[arr.length - 1];
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
      return function(){ return !f.apply(this, arguments); };
    },

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
    }

  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * default transition attributes for sszvis
 *
 * @module sszvis/transition
 */
namespace('sszvis.transition', function(module) {

  var defaultEase = d3.ease('poly-out', 4);

  module.exports = function(transition) {
    transition
      .ease(defaultEase)
      .duration(300);
  };

  module.exports.fastTransition = function(transition) {
    transition
      .ease(defaultEase)
      .duration(50);
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Formatting functions
 *
 * @module sszvis/format
 */
namespace('sszvis.format', function(module) {

  module.exports = (function() {
    return {
      /**
       * Default formatter for text
       * @param  {Number} d
       * @return {String}   Fully formatted text
       */
      text: function(d) {
        return String(d);
      },

      /**
       * formatter for no label
       * @param  {String} d datum
       * @return {String} the empty string
       */
      none: function(d) {
        return '';
      },

      /**
       * Format numbers according to the sszvis style guide
       * @param  {Number} d
       * @return {String} Fully formatted number
       */
      number: function(d) {
        if (d >= 1e4) {
          return d3.format(',.2r')(d);
        } else if (d === 0) {
          return 0;
        } else {
          return d3.format('.2r')(d);
        }
      },

      age: function(d) {
        return String(Math.round(d));
      },

      percent: function(d) {
        if (d >= 1) {
          return '100%';
        } else if (d <= 0) {
          return '0%';
        } else {
          return d3.format('%')(d);
        }
      }
    }
  }());

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Parsing functions
 *
 * @module sszvis/parse
 */
 // NOTE Thinking out loud: Should this not be part
 //of sszvis.fn?
namespace('sszvis.parse', function(module) {

  var yearParser = d3.time.format("%Y");

  module.exports = {
    /**
     * Parse Swiss date strings
     * @param  {String} d A Swiss date string, e.g. 17.08.2014
     * @return {Date}
     */
    date: function(d) {
      return d3.time.format("%d.%m.%Y").parse(d);
    },

    year: function(d) {
      return yearParser.parse(d);
    },

    /**
     * Parse untyped input
     * @param  {String} d A value that could be a number
     * @return {Number}   If d is not a number, NaN is returned
     */
    number: function(d) {
      return (d.trim() === '') ? NaN : +d;
    }
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Scale component - for implementing alternatives to d3.scale
 *
 * @module sszvis/scale
*/
namespace('sszvis.scale', function(module) {
  module.exports = (function() {

    var scales = {};

    scales.colorScale = function() {
      var alteredScale = d3.scale.linear(),
          nativeDomain = alteredScale.domain;

      alteredScale.domain = function(dom) {
        if (arguments.length === 1) {
          var threeDomain = [dom[0], d3.mean(dom), dom[1]];
          return nativeDomain.call(this, threeDomain);
        } else {
          return nativeDomain.apply(this, arguments);
        }
      };

      return alteredScale;
    };

    /**
     * Used to calculate a range that has some pixel-defined amount of left-hand padding,
     * and which obeys limits on the maximum size of the 'range band' - the size of the bars -
     * and the inner padding between the bars
     * @param  {Int} domainLength      length of the data domain
     * @param  {Array[2]} range             the output range, [min, max]
     * @param  {Float} innerPaddingRatio ratio between the padding width and the rangeBand width
     * @param  {Int} leftPadding       pixels of left padding
     * @param  {Int} maxRangeBand      maximum size of a rangeBand
     * @param  {Int} maxInnerPadding   maximum size of the padding
     * @return {Obj[range, rangeBand]}                   gives a range of values that correspond to the input domain,
     *                                                   and a size for the rangeBand.
     */
    scales.leftPaddedRange = function(domainLength, range, innerPaddingRatio, leftPadding, maxRangeBand, maxInnerPadding) {
      var start = range[0],
          stop = range[1],
          step = (stop - start - leftPadding) / (domainLength),
          innerPadding = Math.min(step * innerPaddingRatio, maxInnerPadding),
          rangeBand = Math.min(step * (1 - innerPaddingRatio), maxRangeBand);
      step = innerPadding + rangeBand;
      range = d3.range(domainLength).map(function(i) { return start + leftPadding + step * i; });
      return {
        range: range,
        rangeBand: rangeBand
      };
    };

    return scales;
  }());

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Axis component based on the d3.axis interface
 *
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 * @module sszvis/axis
 */
namespace('sszvis.axis', function(module) {

  module.exports = (function() {

    var fn = sszvis.fn;
    var format = sszvis.format;

    var stringEqual = function(a, b) {
      return a.toString() === b.toString();
    };

    var axisTimeFormat = d3.time.format.multi([
      [".%L", function(d) { return d.getMilliseconds(); }],
      [":%S", function(d) { return d.getSeconds(); }],
      ["%I:%M", function(d) { return d.getMinutes(); }],
      ["%I %p", function(d) { return d.getHours(); }],
      ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
      ["%b %d", function(d) { return d.getDate() != 1; }],
      ["%B", function(d) { return d.getMonth(); }],
      ["%Y", function() { return true; }]
    ]);

    var axis = function() {
      var axisDelegate = d3.svg.axis();

      var axisComponent = d3.component()
        .delegate('scale', axisDelegate)
        .delegate('orient', axisDelegate)
        .delegate('ticks', axisDelegate)
        .delegate('tickValues', axisDelegate)
        .delegate('tickSize', axisDelegate)
        .delegate('innerTickSize', axisDelegate)
        .delegate('outerTickSize', axisDelegate)
        .delegate('tickPadding', axisDelegate)
        .delegate('tickFormat', axisDelegate)
        .prop('vertical').vertical(false)
        .prop('alignOuterLabels').alignOuterLabels(false)
        .prop('highlight')
        .prop('halo')
        .prop('textWrap')
        .prop('slant')
        .prop('title')
        .prop('titleOffset').titleOffset(0)
        .render(function() {
          var selection = d3.select(this);
          var props = selection.props();

          var group = selection.selectGroup('sszvis-axis')
            .classed('sszvis-axis', true)
            .classed('sszvis-axis--top', !props.vertical && axisDelegate.orient() === 'top')
            .classed('sszvis-axis--bottom', !props.vertical && axisDelegate.orient() === 'bottom')
            .classed('sszvis-axis--vertical', props.vertical)
            .classed('sszvis-axis--halo', props.halo)
            .attr('transform', 'translate(0, 2)')
            .call(axisDelegate);

          if (props.highlight) {
            group.selectAll('.tick')
              .classed('active', function(d) {
                return [].concat(props.highlight).reduce(function(found, highlight) {
                  return found || stringEqual(highlight, d);
                }, false)
              });
          }

          if (props.alignOuterLabels) {
            var extent = d3.extent(axisDelegate.scale().domain());
            var min = extent[0];
            var max = extent[1];

            group.selectAll('g.tick text')
              .style('text-anchor', function(d) {
                if (stringEqual(d, min)) {
                  return 'start';
                } else if (stringEqual(d, max)) {
                  return 'end';
                }
                return 'middle';
              });
          }

          if (fn.defined(props.textWrap)) {
            group.selectAll('text')
              .call(sszvis.component.textWrap, props.textWrap);
          }

          if (props.slant) {
            group.selectAll("text")
              .call(slantLabel[axisDelegate.orient()][props.slant]);
          }

          if (props.title) {
            var title = group.selectAll('.sszvis-axis--title')
              .data([props.title]);

            title.enter()
              .append('text')
              .classed('sszvis-axis--title', true);

            title.exit().remove();

            title
              .text(function(d) { return d; })
              .attr('transform', function(d) {
                var scale = axisDelegate.scale(),
                    extent = scale.rangeExtent ? scale.rangeExtent() : scaleExtent(scale.range()),
                    halfWay = (extent[0] + extent[1]) / 2,
                    orientation = axisDelegate.orient();
                if (orientation === 'left') {
                  return 'translate(0, ' + -props.titleOffset + ')';
                } else if (orientation === 'right') {
                  return 'translate(0, ' + -props.titleOffset + ')';
                } else if (orientation === 'top') {
                  return 'translate(' + halfWay + ', ' + -props.titleOffset + ')';
                } else if (orientation === 'bottom') {
                  return 'translate(' + halfWay + ', ' + props.titleOffset + ')';
                }
              })
              .style('text-anchor', function(d) {
                var orientation = axisDelegate.orient();
                if (orientation === 'left') {
                  return 'end';
                } else if (orientation === 'right') {
                  return 'start';
                } else if (orientation === 'top' || orientation === 'bottom') {
                  return 'middle';
                }
              });
          }
        });

        axisComponent.__delegate = axisDelegate;

        return axisComponent;
    };

    var set_ordinal_ticks = function(count) {
      // in this function, the "this" context should be an sszvis.axis
      var domain = this.scale().domain(),
          values = [],
          step = Math.round(domain.length / count);

      // include the first value
      if (typeof domain[0] !== 'undefined') values.push(domain[0]);
      for (var i = step, l = domain.length; i < l - 1; i += step) {
        if (typeof domain[i] !== 'undefined') values.push(domain[i]);
      }
      // include the last value
      if (typeof domain[domain.length - 1] !== 'undefined') values.push(domain[domain.length - 1]);

      this.tickValues(values);

      return count;
    };

    var axis_x = function() {
      return axis()
        .ticks(3)
        .tickSize(4, 7)
        .tickPadding(7)
        .tickFormat(format.number)
    };

    axis_x.time = function() {
      return axis_x()
        .tickFormat(axisTimeFormat)
        .alignOuterLabels(true);
    };

    axis_x.ordinal = function() {
      return axis_x()
        // extend this class a little with a custom implementation of 'ticks'
        // that allows you to set a custom number of ticks,
        // including the first and last value in the ordinal scale
        .prop('ticks', set_ordinal_ticks)
        .tickFormat(format.text);
    };

    // need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
    axis_x.pyramid = function() {
      return axis_x()
        .ticks(10)
        .prop('scale', function(s) {
          var extended = s.copy(),
              domain = extended.domain(),
              range = extended.range();

          extended
            // the domain is mirrored - ±domain[1]
            .domain([-domain[1], domain[1]])
            // the range is mirrored – ±range[1]
            .range([range[0] - range[1], range[0] + range[1]]);

          this.__delegate.scale(extended);
          return extended;
        })
        .tickFormat(function(v) {
          // this tick format means that the axis appears to be divergent around 0
          // when in fact it is -domain[1] -> +domain[1]
          return format.number(Math.abs(v));
        });
    };

    var axis_y = function() {
      return axis()
        .ticks(7)
        .tickSize(0, 0)
        .tickPadding(0)
        .tickFormat(function(d) {
          return 0 === d ? null : format.number(d);
        })
        .vertical(true);
    };

    axis_y.time = function() {
      return axis_y().tickFormat(axisTimeFormat);
    };

    axis_y.ordinal = function() {
      return axis_y()
        // add custom 'ticks' function
        .prop('ticks', set_ordinal_ticks)
        .tickFormat(format.text);
    };

    return {
      x: axis_x,
      y: axis_y
    };

  }());

  function scaleExtent(domain) { // borrowed from d3 source
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }

  var slantLabel = {
    top: {
      vertical: function(selection) {
        selection.style("text-anchor", "start")
          .attr("dx", "0em")
          .attr("dy", "0.35em")
          .attr("transform", "rotate(-90)");
      },
      diagonal: function(selection) {
        selection.style("text-anchor", "start")
          .attr("dx", "0.1em")
          .attr("dy", "0.1em")
          .attr("transform", "rotate(-45)");
      }
    },
    bottom: {
      vertical: function(selection) {
        selection.style("text-anchor", "end")
          .attr("dx", "-1em")
          .attr("dy", "-0.75em")
          .attr("transform", "rotate(-90)");
      },
      diagonal:  function(selection) {
        selection.style("text-anchor", "end")
          .attr("dx", "-0.8em")
          .attr("dy", "0em")
          .attr("transform", "rotate(-45)");
      }
    }
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Legend component
 *
 * @module sszvis/legend
 */
 // NOTE why is there a namespace sszvis.legend.color AND sszvis.legend.ColorRange 
 //and not just sszvis.legend returning an object containing color and colorRange?
namespace('sszvis.legend.color', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('width').width(0)
      .prop('rows').rows(3)
      .prop('columns').columns(3)
      .prop('orientation')
      .prop('reverse').reverse(false)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var domain = props.scale.domain();

        if (props.reverse) {
          domain = domain.slice().reverse();
        }

        var rows, cols;
        if (props.orientation === 'horizontal') {
          cols = props.columns;
          rows = Math.ceil(domain.length / cols);
        } else if (props.orientation === 'vertical') {
          rows = props.rows;
          cols = Math.ceil(domain.length / rows);
        }

        var colWidth = props.width / cols,
            rowHeight = 20;

        var groups = selection.selectAll('.sszvis-legend--entry')
          .data(domain);

        groups.enter()
          .append('g')
          .classed('sszvis-legend--entry', true);

        groups.attr('transform', function(d, i) {
          if (props.orientation === 'horizontal') {
            return 'translate(' + ((i % cols) * colWidth) + ',' + (Math.floor(i / cols) * rowHeight) + ')';
          } else if (props.orientation === 'vertical') {
            return 'translate(' + (Math.floor(i / rows) * colWidth) + ',' + ((i % rows) * rowHeight) + ')';
          }
        });

        groups.exit().remove();

        var marks = groups.selectAll('.sszvis-legend--mark')
          .data(function(d) { return [d]; });

        marks.enter()
          .append('circle')
          .classed('sszvis-legend--mark', true);

        marks.exit().remove();

        marks
          .attr('cx', 7)
          .attr('cy', rowHeight / 2 - 1) // magic number adjustment for nice alignment with text
          .attr('r', 6)
          .attr('fill', function(d) { return props.scale(d); });

        var labels = groups.selectAll('.sszvis-legend--label')
          .data(function(d) { return [d]; });

        labels.enter()
          .append('text')
          .classed('sszvis-legend--label', true);

        labels.exit().remove();

        labels
          .text(function(d) { return d; })
          .attr('alignment-baseline', 'central')
          .attr('transform', 'translate(18, ' + (rowHeight / 2) + ')');
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Legend component
 *
 * @module sszvis/legend
 */
 // NOTE Why are legent.colorRange and legen.color
 //in two different namespaces?
 //Why not create just one namespace 'sszvis.legend'
 //and return an object with 'color' and 'colorRange'?

 // NOTE Should this not be in the components folder? As it creates a component.

namespace('sszvis.legend.colorRange', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('scale')
      .prop('width')
      .prop('segments').segments(8)
      .prop('units').units(false)
      .prop('labelPadding').labelPadding(16)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var values = props.scale.ticks(props.segments);

         // NOTE a default width would be good to avoid division by zero
         // and to save programmers time while he searches for the cause of the error. 
        var segWidth = props.width / values.length,
            segHeight = 10;

        var segments = selection.selectAll('rect.sszvis-legend--mark')
          .data(values);

        segments.enter()
          .append('rect')
          .classed('sszvis-legend--mark', true);

        segments.exit().remove();

        segments
          .attr('x', function(d, i) { return i * segWidth; })
          .attr('y', 0)
          .attr('width', segWidth)
          .attr('height', segHeight)
          .attr('fill', function(d) { return props.scale(d); });

        var startEnd = [values[0], values[values.length - 1]];

        // rounded end caps for the segments
        var endCaps = selection.selectAll('circle.ssvis-legend--mark')
          .data(startEnd);

        endCaps.enter()
          .append('circle')
          .attr('cx', function(d, i) { return i * props.width; })
          .attr('cy', segHeight / 2)
          .attr('r', segHeight / 2)
          .attr('fill', function(d) { return props.scale(d); });

        if (props.units) startEnd[1] += ' ' + props.units;

        var labels = selection.selectAll('.sszvis-legend--label')
          .data(startEnd);

        labels.enter()
          .append('text')
          .classed('sszvis-legend--label', true);

        labels.exit().remove();

        labels
          .attr('text-anchor', function(d, i) { return i === 0 ? 'end' : 'start'; })
          .attr('alignment-baseline', 'central')
          .attr('transform', function(d, i) { return 'translate(' + (i * props.width + (i === 0 ? -1 : 1) * props.labelPadding) + ', ' + (segHeight / 2) + ')'; })
          .text(function(d) { return d; });
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 *
 * @param  {Error} The error object
 */
namespace('sszvis.loadError', function(module) {

  var RELOAD_MSG = 'Versuchen Sie, die Webseite neu zu laden. Sollte das Problem weiterhin bestehen, nehmen Sie mit uns Kontakt auf.';

  module.exports = function(error) {
    console.error(error);
    if (error.status === 404) {
      alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
    } else {
      alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
    }
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createChart
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 *
 * @returns {d3.selection}
 */
namespace('sszvis.createChart', function(module) {

  module.exports = function(selector, bounds) {
    var root = d3.select(selector);
    var svg = root.selectAll('svg').data([0]);
    svg.enter().append('svg');

    svg
      .attr('height', bounds.height)
      .attr('width',  bounds.width)

    var viewport = svg.selectAll('[data-d3-chart]').data([0])
    viewport.enter().append('g')
      .attr('data-d3-chart', '')
      .attr('transform', 'translate(' + bounds.padding.left + ',' + bounds.padding.top + ')');

    return viewport;
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Factory that returns an HTML element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createHtmlLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} [bounds]
 *
 * @returns {d3.selection}
 */
 // NOTE could be nice to add a class name
 //so when looking at the code it is clear what the tooltip layer is
namespace('sszvis.createHtmlLayer', function(module) {
  'use strict';

  module.exports = function(selector, bounds) {
    bounds || (bounds = sszvis.bounds());

    var root = d3.select(selector);
    // NOTE Why again do you need to add .data([0])?
    var layer = root.selectAll('div').data([0]);
    layer.enter().append('div');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Move behavior
 * @return {d3.component}
 */
namespace('sszvis.behavior.move', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('start', 'move', 'end');

    var moveComponent = d3.component()
      .prop('xScale')
      .prop('yScale')
      .prop('padding', function(p) {
        var defaults = { top: 0, left: 0, bottom: 0, right: 0 };
        for (var prop in p) { defaults[prop] = p[prop]; }
        return defaults;
      }).padding({})
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = props.xScale.range().sort(d3.ascending);
        var yExtent = props.yScale.range().sort(d3.ascending);
        xExtent[0] -= props.padding.left;
        xExtent[1] += props.padding.right;
        yExtent[0] -= props.padding.top;
        yExtent[1] += props.padding.bottom;

        var layer = selection.selectAll('[data-sszvis-behavior-move]')
          .data([0]);

        layer.enter()
          .append('rect')
          .attr('data-sszvis-behavior-move', '');

        layer
          .attr('x', xExtent[0])
          .attr('y', yExtent[0])
          .attr('width',  xExtent[1] - xExtent[0])
          .attr('height', yExtent[1] - yExtent[0])
          .attr('fill', 'transparent')
          .on('mouseover', event.start)
          .on('mouseout', event.end)
          .on('mousemove', function() {
            var xy = d3.mouse(this);
            event.move(props.xScale.invert(xy[0]), props.yScale.invert(xy[1]));
          })
          .on('touchdown', event.start)
          .on('touchmove', function() {
            var xy = sszvis.fn.first(d3.touches(this));
            event.move(props.xScale.invert(xy[0]), props.yScale.invert(xy[1]));
          })
          .on('touchend', function() {
            event.end.apply(this, arguments);

            // calling preventDefault here prevents the browser from sending imitation mouse events
            d3.event.preventDefault();
          });
      });

    d3.rebind(moveComponent, event, 'on');

    return moveComponent;
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Click behavior
 * @return {d3.component}
 */
namespace('sszvis.behavior.click', function(module) {
  'use strict';

  module.exports = function() {
    var event = d3.dispatch('down', 'up', 'click', 'drag');

    var clickComponent = d3.component()
      .prop('xScale')
      .prop('yScale')
      .prop('padding', function(p) {
        var defaults = { top: 0, left: 0, bottom: 0, right: 0 };
        for (var prop in p) { defaults[prop] = p[prop]; }
        return defaults;
      }).padding({})
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = props.xScale.range().sort(d3.ascending);
        var yExtent = props.yScale.range().sort(d3.ascending);
        xExtent[0] -= props.padding.left;
        xExtent[1] += props.padding.right;
        yExtent[0] -= props.padding.top;
        yExtent[1] += props.padding.bottom;

        var layer = selection.selectAll('[data-sszvis-behavior-click]')
          .data([0]);

        layer.enter()
          .append('rect')
          .attr('data-sszvis-behavior-click', '');

        // defined in this scope in order to have access to props
        function bindDragEvents(targetEl) {
          // used to bind the 'drag' behavior in the event handlers for both touchstart and mousedown
          d3.select(document)
            .on('touchmove.sszvis-click', function() {
              var invXY = invertXY(sszvis.fn.first(d3.touches(targetEl)), props.xScale, props.yScale);
              event.drag(invXY[0], invXY[1]);
            })
            .on('touchend.sszvis-click', function() {
              stopDragging();

              // calling preventDefault here prevents the browser from sending imitation mouse events
              // this is good because actual mouse events are already handled, and because often these
              // imitation events are on a 300ms delay, which can make the user experience strange after-effects.
              d3.event.preventDefault();
            })
            .on('mousemove.sszvis-click', function() {
              var invXY = invertXY(d3.mouse(targetEl), props.xScale, props.yScale);
              event.drag(invXY[0], invXY[1]);
            })
            .on('mouseup.sszvis-click', function() {
              stopDragging();

              var invXY = invertXY(d3.mouse(targetEl), props.xScale, props.yScale);
              event.up(invXY[0], invXY[1]);
            })
            .on('mouseleave.sszvis-click', function() {
              stopDragging();
            });
        }

        layer
          .attr('x', xExtent[0])
          .attr('y', yExtent[0])
          .attr('width',  xExtent[1] - xExtent[0])
          .attr('height', yExtent[1] - yExtent[0])
          .attr('fill', 'transparent')
          .on('touchstart', function() {
            bindDragEvents(this);

            var invXY = invertXY(sszvis.fn.first(d3.touches(this)), props.xScale, props.yScale);
            event.down(invXY[0], invXY[1]);
          })
          .on('mousedown', function() {
            bindDragEvents(this);

            var invXY = invertXY(d3.mouse(this), props.xScale, props.yScale);
            event.down(invXY[0], invXY[1]);
          })
          .on('click', function() {
            var invXY = invertXY(d3.mouse(this), props.xScale, props.yScale);
            event.click(invXY[0], invXY[1]);
          });
      });

    d3.rebind(clickComponent, event, 'on');

    return clickComponent;
  };

  function invertXY(xy, xScale, yScale) {
    return [xScale.invert(xy[0]), yScale.invert(xy[1])];
  }

  function stopDragging() {
    d3.select(document)
      .on('touchmove.sszvis-click', null)
      .on('touchend.sszvis-click', null)
      .on('mousemove.sszvis-click', null)
      .on('mouseup.sszvis-click', null)
      .on('mouseleave.sszvis-click', null);
  }

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Segmented Control for switching top-level filter values
 *
 * @module sszvis/control/segmented
 */
namespace('sszvis.control.segmented', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('values')
      .prop('current')
      .prop('width')
      .prop('change').change(sszvis.fn.identity)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var buttonWidth = props.width / props.values.length;

        var container = selection.selectDiv('.ssvis-control--segmented');

        container.style('width', props.width + 'px');

        var buttons = container.selectAll('.sszvis-control--segmentitem')
          .data(props.values);

        buttons.enter()
          .append('div')
          .classed('sszvis-control--segmentitem', true);

        buttons.exit().remove();

        buttons
          .style('width', buttonWidth + 'px')
          .classed('selected', function(d) { return d === props.current; })
          .text(function(d) { return d; })
          .on('click', props.change);
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * SlideBar for use in sliding along the x-axis of charts
 *
 * @module  sszvis/control/slideBar
 */
namespace('sszvis.control.slideBar', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .prop('label').label(sszvis.fn.constant(''))
      .prop('color')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var key = function(d) {
          return props.x(d) + '_' + props.y(d);
        };

        var xValue = sszvis.fn.compose(props.xScale, props.x);
        var yValue = sszvis.fn.compose(props.yScale, props.y);

        var xPos = xValue(sszvis.fn.first(data));
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range()) - 4;

        var handleWidth = 10;
        var handleHeight = 30;
        var handleTop = top - handleHeight;

        var group = selection.selectAll('.sszvis-slider-group')
          .data([1]);

        var entering = group.enter()
          .append('g')
          .classed('sszvis-slider-group', true);

        group.exit().remove();

        entering
          .append('line')
          .classed('sszvis-slider-line', true);

        entering
          .append('rect')
          .classed('sszvis-slider-handle', true);

        entering
          .append('line')
          .classed('sszvis-slider-handleMark', true);

        group.selectAll('.sszvis-slider-line')
          .attr('x1', xPos)
          .attr('y1', top)
          .attr('x2', xPos)
          .attr('y2', bottom);

        group.selectAll('.sszvis-slider-handle')
          .attr('x', xPos - handleWidth / 2)
          .attr('y', handleTop)
          .attr('width', handleWidth)
          .attr('height', handleHeight)
          .attr('rx', 2)
          .attr('ry', 2);

        group.selectAll('.sszvis-slider-handleMark')
          .attr('x1', xPos)
          .attr('y1', handleTop + handleHeight * 0.15)
          .attr('x2', xPos)
          .attr('y2', handleTop + handleHeight * 0.85);

        var dots = group.selectAll('.sszvis-slider-dot')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-slider-dot', true);

        dots.exit().remove();

        dots
          .attr('cx', xValue)
          .attr('cy', yValue)
          .attr('r', 3.5)
          .attr('fill', props.color);

        var captions = group.selectAll('.sszvis-slider-label')
          .data(data);

        captions.enter()
          .append('text')
          .classed('sszvis-slider-label', true);

        captions.exit().remove();

        captions
          .attr('x', xValue)
          .attr('y', yValue)
          .attr('dx', 10)
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (yValue(d) < top + baselineShift)    return 2 * baselineShift;
            if (yValue(d) > bottom - baselineShift) return 0;
            return baselineShift;
          })
          .text(props.label);

      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Bar component
 * @return {d3.component}
 */
namespace('sszvis.component.bar', function(module) {
  'use strict';

  // replaces NaN values with 0
  function handleMissingVal(v) {
    return isNaN(v) ? 0 : v;
  }

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('width', d3.functor)
      .prop('height', d3.functor)
      .prop('fill', d3.functor)
      .prop('stroke', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bars = selection.selectAll('.sszvis-bar')
          .data(data);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true);

        bars.exit().remove();

        bars
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        bars
          .transition()
          .call(sszvis.transition)
          .attr('x', sszvis.fn.compose(handleMissingVal, props.x))
          .attr('y', sszvis.fn.compose(handleMissingVal, props.y))
          .attr('width', sszvis.fn.compose(handleMissingVal, props.width))
          .attr('height', sszvis.fn.compose(handleMissingVal, props.height));

        // Tooltip anchors

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            return [props.x(d) + props.width(d) / 2, props.y(d)];
          });

        selection.call(tooltipAnchor);

      });
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * @module sszvis/component/dataAreaCircle
 *
 * @returns {d3.component} a circular data area component
 */
namespace('sszvis.component.dataAreaCircle', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('r', d3.functor)
      .prop('dx', d3.functor)
      .prop('dy', d3.functor)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        sszvis.patterns.ensurePattern(selection, 'data-area-pattern')
          .call(sszvis.patterns.dataAreaPattern);

        var dataArea = selection.selectAll('.sszvis-data-area-circle')
          .data(data);

        dataArea.enter()
          .append('circle')
          .classed('sszvis-data-area-circle', true);

        dataArea
          .attr('cx', props.x)
          .attr('cy', props.y)
          .attr('r', props.r)
          .attr('fill', 'url(#data-area-pattern)');

        if (props.caption) {
          var dataCaptions = selection.selectAll('.sszvis-data-area-circle-caption')
            .data(data);

          dataCaptions.enter()
            .append('text')
            .classed('sszvis-data-area-circle-caption', true);

          dataCaptions
            .attr('x', props.x)
            .attr('y', props.y)
            .attr('dx', props.dx)
            .attr('dy', props.dy)
            .text(props.caption);
        }
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * @module sszvis/component/dataAreaLine
 *
 * @returns {d3.component} a linear data area component (reference line)
 */
namespace('sszvis.component.dataAreaLine', function(module) {

  // reference line specified in the form y = mx + b
  // user supplies m and b
  // default line is y = x

  module.exports = function() {
    return d3.component()
      .prop('m').m(1)
      .prop('b').b(0)
      .prop('xScale')
      .prop('yScale')
      .prop('xRange')
      .prop('dx', d3.functor).dx(0)
      .prop('dy', d3.functor).dy(0)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var x1 = props.xRange[0];
        var x2 = props.xRange[1];
        var y1 = props.yScale(props.m * props.xScale.invert(x1) + props.b);
        var y2 = props.yScale(props.m * props.xScale.invert(x2) + props.b);

        var line = selection.selectAll('.sszvis-reference-line')
          .data(data);

        line.enter()
          .append('line')
          .classed('sszvis-reference-line', true);

        line.exit().remove();

        line
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2);

        if (props.caption) {
          var caption = selection.selectAll('.sszvis-reference-line--caption')
            .data([1]);

          caption.enter()
            .append('text')
            .classed('sszvis-reference-line--caption', true);

          caption.exit().remove();

          caption
            .attr('transform', function() {
              var vx = x2 - x1;
              var vy = y2 - y1;
              var angle = Math.atan2(vy, vx) * 180 / Math.PI;
              var rotation;
              if (angle > 0) {
                // in top half
                rotation = angle < 90 ? -angle : angle;
              } else {
                // in bottom semicircle
                rotation = angle > -90 ? -angle : angle; // display angle math is weird
              }
              return 'translate(' + ((x1 + x2) / 2) + ',' + ((y1 + y2) / 2) + ') rotate(' + (angle) + ')';
            })
            .attr('dx', props.dx)
            .attr('dy', props.dy)
            .text(props.caption);
        }
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * @module sszvis/component/dataAreaRectangle
 *
 * @returns {d3.component} a rectangular data area component
 */
namespace('sszvis.component.dataAreaRectangle', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y', d3.functor)
      .prop('width', d3.functor)
      .prop('height', d3.functor)
      .prop('dx', d3.functor)
      .prop('dy', d3.functor)
      .prop('caption', d3.functor)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        sszvis.patterns.ensurePattern(selection, 'data-area-pattern')
          .call(sszvis.patterns.dataAreaPattern);

        var dataArea = selection.selectAll('.sszvis-data-area-rectangle')
          .data(data);

        dataArea.enter()
          .append('rect')
          .classed('sszvis-data-area-rectangle', true);

        dataArea
          .attr('x', props.x)
          .attr('t', props.y)
          .attr('width', props.width)
          .attr('height', props.height)
          .attr('fill', 'url(#data-area-pattern)');

        if (props.caption) {
          var dataCaptions = selection.selectAll('.sszvis-data-area-rectangle-caption')
            .data(data);

          dataCaptions.enter()
            .append('text')
            .classed('sszvis-data-area-rectangle-caption', true);

          dataCaptions
            .attr('x', function(d, i) {
              return props.x(d, i) + props.width(d, i) / 2;
            })
            .attr('y', function(d, i) {
              return props.y(d, i) + props.height(d, i) / 2;
            })
            .attr('dx', props.dx)
            .attr('dy', props.dy)
            .text(props.caption);
        }
      });
  }

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Dot component
 * @return {d3.component}
 */
namespace('sszvis.component.dot', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('radius')
      .prop('stroke')
      .prop('fill')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var dots = selection.selectAll('.sszvis-circle')
          .data(data);

        dots.enter()
          .append('circle')
          .classed('sszvis-circle', true);

        dots.exit().remove();

        dots
          .transition()
          .call(sszvis.transition)
          .attr('cx', props.x)
          .attr('cy', props.y)
          .attr('r', props.radius)
          .attr('stroke', props.stroke)
          .attr('fill', props.fill);
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Grouped Bars
 * @return {d3.component}
 */
namespace('sszvis.component.groupedBars', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('groupScale')
      .prop('groupSize')
      .prop('groupWidth')
      .prop('groupSpace').groupSpace(0.05)
      .prop('y')
      .prop('height')
      .prop('fill')
      .prop('stroke')
      .prop('defined', d3.functor).defined(true)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var inGroupScale = d3.scale.ordinal()
          .domain(d3.range(props.groupSize))
          .rangeBands([0, props.groupWidth], props.groupSpace, 0);

        var groups = selection.selectAll('g.sszvis-g')
          .data(data);

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        groups.exit().remove();

        var bars = groups.selectAll('rect.sszvis-bar')
          .data(sszvis.fn.identity);

        bars.enter()
          .append('rect')
          .classed('sszvis-bar', true)
          .attr('fill', props.fill);

        bars.exit().remove();

        bars
          .attr('x', function(d, i) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.defined(d) ? props.groupScale(d) + inGroupScale(i) : 0;
          })
          .attr('y', function(d, i) {
            return props.defined(d) ? props.y(d, i) : 0;
          })
          .attr('transform', function(d, i) {
            // special positioning for the "missing value" bars
            return props.defined(d) ? '' : 'translate(' + (props.groupScale(d) + inGroupScale(i) + inGroupScale.rangeBand() / 2) + ',' + (props.y(d, i) - 5) + ') rotate(25)';
          });

        // filter for the bars which have a value and display it
        bars
          .filter(sszvis.fn.compose(sszvis.fn.not(isNaN), props.height))
          .transition()
          .call(sszvis.transition)
          .attr('width', inGroupScale.rangeBand())
          .attr('height', props.height)
          .attr('fill', props.fill);

        // handle missing values
        bars
          .filter(sszvis.fn.compose(isNaN, props.height))
          .attr('width', 1)
          .attr('height', 10)
          .attr('fill', '#000');
      });
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Line component
 * @return {d3.component}
 */
namespace('sszvis.component.line', function(module) {

  module.exports = function() {

    return d3.component()
      .prop('xValue')
      .prop('yValue')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var line = d3.svg.line()
          .defined(sszvis.fn.compose(sszvis.fn.not(isNaN), props.yValue))
          .x(props.xValue)
          .y(props.yValue);

        var path = selection.selectAll('.sszvis-line')
          .data(data);

        path.enter()
          .append('path')
          .classed('sszvis-line', true)
          .attr('stroke', props.stroke);

        path.exit().remove();

        path
          .transition()
          .call(sszvis.transition)
          .attr('d', line)
          .attr('stroke', props.stroke);
      });
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * ModularText component
 *
 * @return {@function} returns a configurable, callable class
 *
 * use like so:
 * modularText()
 *   .lineBreaks(true)
 *   .plain(function(d) { return d.name; })
 *   .plain(function(d) { return d.place; })
 *   .bold(function(d) { return d.value; })
 *   .italic(function(d) { return d.caption; })
 *
 * returns a function which, when called on a datum, produces a text string
 * by calling on the datum, in sequence, the provided functions,
 * with the result of each function formatted in the manner
 * described by the name of the method which was used to add it.
 */
namespace('sszvis.component.modularText', function(module) {

  module.exports = function() {
    var fn = sszvis.fn;

    var textUnits = [],
    hasLineBreaks;

    function makeText(d) {

      // NOTE whats the convention for variable declaration?
      // Could imagine one var keyword per variable.
      var text = "", i = -1, end = textUnits.length, unit;
      while (++i < end) {
        unit = textUnits[i];
        if (i > 0) {
          if (hasLineBreaks) text += "<br />";
          text += " ";
        }
        switch (unit.type) {
          case "bold":
          text += "<strong>" + unit.tFunc(d) + "</strong>"; break;
          case "italic":
          text += "<em>" + unit.tFunc(d) + "</em>"; break;
          case "plain": // intentional drop-through
          default:
          text += "" + unit.tFunc(d); break;
        }
      }
      return text;
    }

    makeText.lineBreaks = function(b) {
      if (!arguments.length) return hasLineBreaks;
      hasLineBreaks = b;
      return makeText;
    };

    makeText.newline = function() {
      textUnits.push({
        type: 'newline',
        tFunc: fn.constant('<br />')
      });
      return makeText;
    };

    ['bold', 'italic', 'plain'].forEach(function(type) {
      makeText[type] = function(tFunc) {
        if (typeof tFunc === "string") tFunc = fn.constant(tFunc);
        textUnits.push({
          type: type,
          tFunc: tFunc
        });
        return makeText;
      };
    });

    return makeText;
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Small Multiples component
 *
 * Used to generate group elements for small multiples charts
 *
 * @return {d3.component}
 */
namespace('sszvis.component.multiples', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('width')
      .prop('height')
      .prop('paddingX')
      .prop('paddingY')
      .prop('rows')
      .prop('cols')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var unitWidth = (props.width - props.paddingX * (props.cols - 1)) / props.cols;
        var unitHeight = (props.height - props.paddingY * (props.rows - 1)) / props.rows;

        var multiples = selection.selectAll('g.sszvis-multiple')
          .data(data);

        multiples.enter()
          .append('g')
          .classed('sszvis-g sszvis-multiple', true);

        multiples.exit().remove();

        var subGroups = multiples.selectAll('g.sszvis-multiple-chart')
          .data(function(d) {
            return [d.values];
          });

        subGroups.enter()
          .append('g')
          .classed('sszvis-multiple-chart', true);

        subGroups.exit().remove();

        multiples
          .datum(function(d, i) {
            d.gx = (i % props.cols) * (unitWidth + props.paddingX);
            d.gw = unitWidth;
            d.gy = Math.floor(i / props.cols) * (unitHeight + props.paddingY);
            d.gh = unitHeight;
            return d;
          })
          .attr('transform', function(d, i) {
            return 'translate(' + d.gx + ',' + d.gy + ')';
          });

      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Pie component
 * @return {d3.component}
*/
namespace('sszvis.component.pie', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('radius')
      .prop('fill')
      .prop('stroke')
      .prop('angle')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var angle = 0;
        data.forEach(function(value) {
          value.a0 = angle;
          angle += props.angle(value);
          value.a1 = angle;
        });

        var arcGen = d3.svg.arc()
          .innerRadius(4)
          .outerRadius(props.radius)
          .startAngle(function(d) { return d.a0; })
          .endAngle(function(d) { return d.a1; });

        var segments = selection.selectAll('.sszvis-path')
          .data(data);

        segments.enter()
          .append('path')
          .classed('sszvis-path', true)
          .attr('transform', 'translate(' + props.radius + ',' + props.radius + ')')
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        segments.exit().remove();

        segments
          .transition()
          .call(sszvis.transition)
          .attr('transform', 'translate(' + props.radius + ',' + props.radius + ')')
          .attr('d', arcGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        var tooltipAnchor = sszvis.component.tooltipAnchor()
          .position(function(d) {
            var a = d.a0 + (Math.abs(d.a1 - d.a0) / 2) - Math.PI/2;
            var r = props.radius * 2/3;
            return [props.radius + Math.cos(a) * r, props.radius + Math.sin(a) * r];
          });

        selection
          .datum(data)
          .call(tooltipAnchor)

      });
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


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
 * @requires sszvis.component.bar
 *
 * @property {number, d3.scale} [barFill]          The color of a bar
 * @property {number, d3.scale} barHeight          The height of a bar
 * @property {number, d3.scale} barWidth           The width of a bar
 * @property {number, d3.scale} barPosition        The vertical position of a bar
 * @property {function}         leftAccessor       Data for the left side
 * @property {function}         rightAccessor      Data for the right side
 * @property {function}         [leftRefAccessor]  Reference data for the left side
 * @property {function}         [rightRefAccessor] Reference data for the right side
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {
  'use strict';

  /* Constants
  ----------------------------------------------- */
  var SPINE_PADDING = 0.5;


  /* Module
  ----------------------------------------------- */
  module.exports = function() {
    return d3.component()
      .prop('barHeight', d3.functor)
      .prop('barWidth', d3.functor)
      .prop('barPosition', d3.functor)
      .prop('barFill').barFill(d3.functor('#000'))
      .prop('leftAccessor')
      .prop('rightAccessor')
      .prop('leftRefAccessor')
      .prop('rightRefAccessor')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();


        // Components

        var leftBar = sszvis.component.bar()
          .x(function(d){ return -SPINE_PADDING - props.barWidth(d); })
          .y(props.barPosition)
          .height(props.barHeight)
          .width(props.barWidth)
          .fill(props.barFill);

        var rightBar = sszvis.component.bar()
          .x(SPINE_PADDING)
          .y(props.barPosition)
          .height(props.barHeight)
          .width(props.barWidth)
          .fill(props.barFill);

        var leftLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(props.barWidth)
          .mirror(true);

        var rightLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(props.barWidth);


        // Rendering

        selection.selectGroup('left')
          .datum(props.leftAccessor(data))
          .call(leftBar);

        selection.selectGroup('right')
          .datum(props.rightAccessor(data))
          .call(rightBar);

        selection.selectGroup('leftReference')
          .datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : [])
          .call(leftLine);

        selection.selectGroup('rightReference')
          .datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : [])
          .call(rightLine);

      });
  };


  function lineComponent() {
    return d3.component()
      .prop('barPosition')
      .prop('barWidth')
      .prop('mirror').mirror(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var lineGen = d3.svg.line()
          .x(props.barWidth)
          .y(props.barPosition);

        var line = selection.selectAll('.sszvis-path')
          .data(data);

        line.enter()
          .append('path')
          .attr('class', 'sszvis-path')
          .attr('fill', 'none')
          .attr('stroke', '#aaa')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3 3');

        line
          .attr('transform', props.mirror ? 'scale(-1, 1)' : '')
          .transition()
          .call(sszvis.transition)
          .attr('d', lineGen);

        line.exit().remove();
      });
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * RangeRuler component
 *
 * @return {d3.component} range-based rule component (see stacked area chart example)
 */
namespace('sszvis.component.rangeRuler', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('x', d3.functor)
      .prop('y0', d3.functor).y0(sszvis.fn.prop('y0'))
      .prop('dy', d3.functor).dy(sszvis.fn.prop('y'))
      .prop('yScale')
      .prop('label').label(sszvis.fn.constant(''))
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var y0 = sszvis.fn.compose(props.yScale, props.y0);
        var y1 = sszvis.fn.compose(props.yScale, function(d) { return props.y0(d) + props.dy(d); });
        var ty = sszvis.fn.compose(props.yScale, function(d) { return props.y0(d) + props.dy(d) / 2; });
        var top = y1(sszvis.fn.last(data));
        var bottom = d3.max(props.yScale.range());
        var dotRadius = 1.5;

        var totalValue = data.reduce(function(m, d) {
          return m + props.dy(d);
        }, 0);

        var line = selection.selectAll('.sszvis-rangeRuler--rule')
          .data([1]);

        line.enter()
          .append('line')
          .classed('sszvis-rangeRuler--rule', true);

        line.exit().remove();

        line
          .attr('x1', props.x)
          .attr('y1', top)
          .attr('x2', props.x)
          .attr('y2', bottom);

        var marks = selection.selectAll('.sszvis-rangeRuler--mark')
          .data(data);

        var enteringMarks = marks.enter()
          .append('g')
          .classed('sszvis-rangeRuler--mark', true);

        marks.exit().remove();

        enteringMarks.append('circle').classed('sszvis-rangeRuler--p1', true);
        enteringMarks.append('circle').classed('sszvis-rangeRuler--p2', true);
        enteringMarks.append('text').classed('sszvis-rangeRuler--label', true);

        marks.selectAll('.sszvis-rangeRuler--p1')
          .data(function(d) { return [d]; })
          .attr('cx', props.x)
          .attr('cy', y0)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--p2')
          .data(function(d) { return [d]; })
          .attr('cx', props.x)
          .attr('cy', y1)
          .attr('r', dotRadius);

        marks.selectAll('.sszvis-rangeRuler--label')
          .data(function(d) { return [d]; })
          .attr('x', function(d, i) {
            return props.x(d, i) + 10;
          })
          .attr('y', ty)
          .text(props.label);

        var total = selection.selectAll('.sszvis-rangeRuler--total')
          .data([totalValue]);

        total.enter()
          .append('text')
          .classed('sszvis-rangeRuler--total', true);

        total.exit().remove();

        total
          .attr('x', function(d, i) {
            return props.x(d, i) + 10;
          })
          .attr('y', top - 10)
          .text('Total ' + sszvis.format.number(totalValue));
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////



/**
 * Ruler component
 * @return {d3.component}
 */
namespace('sszvis.component.ruler', function(module) {
  'use strict';

  module.exports = function() {

    var fn = sszvis.fn;

    return d3.component()
      .prop('x').x(fn.identity)
      .prop('y').y(fn.identity)
      .prop('xScale')
      .prop('yScale')
      .prop('label').label(fn.constant(''))
      .prop('color')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var key = function(d) {
          return props.x(d) + '_' + props.y(d);
        };

        var x = fn.compose(props.xScale, props.x);
        var y = fn.compose(props.yScale, props.y);
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range());

        // FIXME: in situations with multiple data points - e.g. when displaying multiple dots,
        // this generates multiple lines. When the lines overlap in the same place, they're redundant,
        // when they show up in separate places, this is a potentially useful, but surprising and undocumented
        // feature. Perhaps this behavior should be either documented or removed.
        var ruler = selection.selectAll('.sszvis-ruler-rule')
          .data(data, key);

        ruler.enter()
          .append('line')
          .classed('sszvis-ruler-rule', true);

        ruler
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', x)
          .attr('y2', bottom);

        ruler.exit().remove();

        var dot = selection.selectAll('.sszvis-ruler-dot')
          .data(data, key);

        dot.enter()
          .append('circle')
          .classed('sszvis-ruler-dot', true);

        dot
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 3.5)
          .attr('fill', props.color);

        dot.exit().remove();

        var label = selection.selectAll('.sszvis-ruler-label')
          .data(data, key);

        label.enter()
          .append('text')
          .classed('sszvis-ruler-label', true);

        label
          .attr('x', x)
          .attr('y', y)
          .attr('dx', 10)
          .attr('dy', function(d) {
            var baselineShift = 5;
            if (y(d) < top + baselineShift)    return 2 * baselineShift;
            if (y(d) > bottom - baselineShift) return 0;
            return baselineShift;
          })
          .text(props.label);

        label.exit().remove();

      });
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Stacked Chart
 * @return {d3.component}
 */

// FIXME: rename namespace or component to be consistent with file system
namespace('sszvis.component.stacked.area', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('xAccessor')
      .prop('xScale')
      .prop('yAccessor')
      .prop('yScale')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var stackLayout = d3.layout.stack()
          .x(props.xAccessor)
          .y(props.yAccessor);

        var areaGen = d3.svg.area()
          .x(sszvis.fn.compose(props.xScale, props.xAccessor))
          .y0(function(d) { return props.yScale(d.y0); })
          .y1(function(d) { return props.yScale(d.y0 + d.y); });

        var paths = selection.selectAll('path.sszvis-path')
          .data(stackLayout(data));

        paths.enter()
          .append('path')
          .classed('sszvis-path', true)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        paths.exit().remove();

        paths
          .transition()
          .call(sszvis.transition)
          .attr('d', areaGen)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);
      });
  };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Stacked Bar Chart
 * @return {d3.component}
 */
namespace('sszvis.component.stacked.bar', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('orientation')
      .prop('xAccessor')
      .prop('xScale')
      .prop('width')
      .prop('yAccessor')
      .prop('yScale')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // TODO: refactor this class to make more sense?
        var stackLayout = d3.layout.stack()
          .x(props.xAccessor)
          .y(props.yAccessor);

        var placementValue = sszvis.fn.compose(props.xScale, props.xAccessor);
        var extentValueRight = function(d) { return props.yScale(d.y0); };
        var extentValueLeft = function(d) { return props.yScale(d.y0 + d.y); };
        var placementDimension = props.width;
        var extentDimension = function(d) { return Math.abs(props.yScale(d.y0 + d.y) - props.yScale(d.y0)); };

        var xFunc, yFunc, wFunc, hFunc;
        if (props.orientation === 'vertical') {
          xFunc = placementValue;
          yFunc = extentValueLeft;
          wFunc = placementDimension;
          hFunc = extentDimension;
        } else if (props.orientation === 'horizontal') {
          xFunc = extentValueRight;
          yFunc = placementValue;
          wFunc = extentDimension;
          hFunc = placementDimension;
        } else {
          throw new Error('sszvis.component.stacked.bar requires an orientation');
        }

        var barGen = sszvis.component.bar()
          .x(xFunc)
          .y(yFunc)
          .width(wFunc)
          .height(hFunc)
          .fill(props.fill)
          .stroke(props.stroke);

        var groups = selection.selectAll('g.sszvis-g')
          .data(stackLayout(data));

        groups.enter()
          .append('g')
          .classed('sszvis-g', true);

        groups.exit().remove();

        var bars = groups.call(barGen);

      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


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
 * @requires sszvis.component.bar
 *
 * @property {number, d3.scale} [barFill]          The color of a bar
 * @property {number, d3.scale} barHeight          The height of a bar
 * @property {number, d3.scale} barWidth           The width of a bar
 * @property {number, d3.scale} barPosition        The vertical position of a bar
 * @property {function}         leftAccessor       Data for the left side
 * @property {function}         rightAccessor      Data for the right side
 * @property {function}         [leftRefAccessor]  Reference data for the left side
 * @property {function}         [rightRefAccessor] Reference data for the right side
 *
 * @return {d3.component}
 */
namespace('sszvis.component.stackedPyramid', function(module) {
  'use strict';

  /* Constants
  ----------------------------------------------- */
  var SPINE_PADDING = 0.5;


  /* Module
  ----------------------------------------------- */
  module.exports = function() {
    return d3.component()
      .prop('barHeight', d3.functor)
      .prop('barWidth', d3.functor)
      .prop('barPosition', d3.functor)
      .prop('barFill').barFill(d3.functor('#000'))
      .prop('leftAccessor')
      .prop('rightAccessor')
      .prop('leftRefAccessor')
      .prop('rightRefAccessor')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var stackLayout = d3.layout.stack()
          .x(props.barPosition)
          .y(props.barWidth);


        // Components

        var leftBar = sszvis.component.bar()
          .x(function(d){ return -SPINE_PADDING - d.y0 - d.y; })
          .y(props.barPosition)
          .height(props.barHeight)
          .width(sszvis.fn.prop('y'))
          .fill(props.barFill);

        var rightBar = sszvis.component.bar()
          .x(function(d){ return SPINE_PADDING + d.y0; })
          .y(props.barPosition)
          .height(props.barHeight)
          .width(sszvis.fn.prop('y'))
          .fill(props.barFill);

        var leftStack = stackComponent()
          .stackElement(leftBar);

        var rightStack = stackComponent()
          .stackElement(rightBar);

        var leftLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(props.barWidth)
          .mirror(true);

        var rightLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(props.barWidth);


        // Rendering

        selection.selectGroup('leftStack')
          .datum(stackLayout(props.leftAccessor(data)))
          .call(leftStack);

        selection.selectGroup('rightStack')
          .datum(stackLayout(props.rightAccessor(data)))
          .call(rightStack);

        selection.selectGroup('leftReference')
          .datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : [])
          .call(leftLine);

        selection.selectGroup('rightReference')
          .datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : [])
          .call(rightLine);

      });
  };


  function stackComponent() {
    return d3.component()
      .prop('stackElement')
      .renderSelection(function(selection) {
        var datum = selection.datum();
        var props = selection.props();

        var stack = selection.selectAll('[data-sszvis-stack]')
          .data(datum);

        stack.enter()
          .append('g')
          .attr('data-sszvis-stack', '');

        stack.exit().remove();

        stack.each(function(d) {
          d3.select(this)
            .datum(d)
            .call(props.stackElement);
        });
      });
  }


  function lineComponent() {
    return d3.component()
      .prop('barPosition')
      .prop('barWidth')
      .prop('mirror').mirror(false)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var lineGen = d3.svg.line()
          .x(props.barWidth)
          .y(props.barPosition);

        var line = selection.selectAll('.sszvis-path')
          .data(data);

        line.enter()
          .append('path')
          .attr('class', 'sszvis-path')
          .attr('fill', 'none')
          .attr('stroke', '#aaa')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3 3');

        line
          .attr('transform', props.mirror ? 'scale(-1, 1)' : '')
          .transition()
          .call(sszvis.transition)
          .attr('d', lineGen);

        line.exit().remove();
      });
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Function allowing to 'wrap' the text from an SVG <text> element with <tspan>.
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
namespace('sszvis.component.textWrap', function(module) {

  module.exports = function(text, width, paddingRightLeft, paddingTopBottom) {
    paddingRightLeft = paddingRightLeft || 5; //Default padding (5px)
    paddingTopBottom = (paddingTopBottom || 5) - 2; //Default padding (5px), remove 2 pixels because of the borders
    var maxWidth = width; //I store the tooltip max width
    width = width - (paddingRightLeft * 2); //Take the padding into account

    var arrLineCreatedCount = [];
    text.each(function() {
      var text = d3.select(this);
      var words = text.text().split(/[ \f\n\r\t\v]+/).reverse(); //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
      var word;
      var line = [];
      var lineNumber = 0;
      var lineHeight = 1.1; //Em
      var x;
      var y = text.attr("y");
      var dy = parseFloat(text.attr("dy"));
      var createdLineCount = 1; //Total line created count
      var textAlign = text.style('text-anchor') || 'start'; //'start' by default (start, middle, end, inherit)

      //Clean the data in case <text> does not define those values
      if (isNaN(dy)) dy = 0; //Default padding (0em) : the 'dy' attribute on the first <tspan> _must_ be identical to the 'dy' specified on the <text> element, or start at '0em' if undefined

      //Offset the text position based on the text-anchor
      var wrapTickLabels = d3.select(text.node().parentNode).classed('tick'); //Don't wrap the 'normal untranslated' <text> element and the translated <g class='tick'><text></text></g> elements the same way..
      if (wrapTickLabels) {
        switch (textAlign) {
          case 'start':
          x = -width / 2;
          break;
          case 'middle':
          x = 0;
          break;
          case 'end':
          x = width / 2;
          break;
          default :
        }
      } else { //untranslated <text> elements
        switch (textAlign) {
          case 'start':
          x = paddingRightLeft;
          break;
          case 'middle':
          x = maxWidth / 2;
          break;
          case 'end':
          x = maxWidth - paddingRightLeft;
          break;
          default :
        }
      }
      y = +((null === y)?paddingTopBottom:y);

      var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
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

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {
  'use strict';

  module.exports = function() {

    var fn = sszvis.fn;
    var renderer = tooltipRenderer();

    return d3.component()
      .delegate('header', renderer)
      .delegate('body', renderer)
      .delegate('orientation', renderer)
      .prop('renderInto')
      .prop('visible').visible(fn.constant(false))
      .renderSelection(function(selection) {
        var props = selection.props();

        var tooltipData = [];
        selection.each(function(d) {
          var pos = this.getBoundingClientRect();
          if (props.visible(d)) {
            tooltipData.push({
              datum: d,
              x: pos.left,
              y: pos.top
            });
          }
        });

        props.renderInto
          .datum(tooltipData)
          .call(renderer);
      });
  };


  /**
   * Tooltip renderer
   * @private
   */
  var tooltipRenderer = function() {

    var TIP_HEIGHT = 10;

    var fn = sszvis.fn;

    return d3.component()
      .prop('header').header('')
      .prop('body').body('')
      .prop('orientation').orientation('bottom')
      .renderSelection(function(selection) {

        var tooltipData = selection.datum();
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(tooltipData);

        tooltip.exit().remove();

        var enterTooltip = tooltip.enter()
          .append('div')
          .style('pointer-events', 'none')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true);

        enterBox.append('div')
          .classed('sszvis-tooltip-header', true);

        enterBox.append('div')
          .classed('sszvis-tooltip-body', true);

        var enterTipholder = enterTooltip.append('div')
          .classed('sszvis-tooltip-tipholder', true)
          .classed('tip-top', props.orientation === 'top')
          .classed('tip-bot', props.orientation === 'bottom')
          .classed('tip-left', props.orientation === 'left')
          .classed('tip-right', props.orientation === 'right');

        enterTipholder.append('div')
          .classed('sszvis-tooltip-tip', true)
          .classed('tip-top', props.orientation === 'top')
          .classed('tip-bot', props.orientation === 'bottom')
          .classed('tip-left', props.orientation === 'left')
          .classed('tip-right', props.orientation === 'right');

        tooltip.select('.sszvis-tooltip-header')
          .datum(fn.prop('datum'))
          .html(props.header);

        tooltip.select('.sszvis-tooltip-body')
          .datum(fn.prop('datum'))
          .html(props.body);

        selection.selectAll('.sszvis-tooltip')
          .each(function(d) {
            d3.select(this).style({
              left: d.x - this.offsetWidth / 2 + 'px',
              top:  d.y - this.offsetHeight - TIP_HEIGHT + 'px'
            });
          });
      });
   };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Tooltip Anchor
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltipAnchor', function(module) {

  var fn = sszvis.fn;

  module.exports = function() {

    return d3.component()
      .prop('debug')
      .prop('position').position(d3.functor([0, 0]))
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var anchor = selection.selectAll('[data-tooltip-anchor]')
          .data(data);

          // NOTE why are anchors rects? 
          // NOTE as these rects are invisible, couldn't they're information just be stored in the data? 
        anchor.enter()
          .append('rect')
          .attr('height', 1)
          .attr('width', 1)
          .attr('fill', 'none')
          .attr('stroke', 'none')
          .attr('visibility', 'none')
          .attr('pointer-events', 'none')
          .attr('data-tooltip-anchor', '');

        anchor
          .attr('transform', fn.compose(translate, props.position));

        anchor.exit().remove();


        if (props.debug) {
          var referencePoint = selection.selectAll('[data-tooltip-anchor-debug]')
            .data(data);

          referencePoint.enter()
            .append('circle')
            .attr('data-tooltip-anchor-debug', '');

          referencePoint
            .attr('r', 2)
            .attr('fill', '#fff')
            .attr('stroke', '#f00')
            .attr('stroke-width', 1.5)
            .attr('transform', fn.compose(translate, props.position));

          referencePoint.exit().remove();
        }

      });

  };

  // NOTE very useful function. it could be moved into sszvis.fn, so its accessible from other places
  function translate(position) {
    return 'translate('+ position[0] +','+ position[1] +')';
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Map Component
 *
 * Use this component to make a map, either of the city of Zurich or of Switzerland
 * @return {d3.component}
 *
 * props.type options:
 * zurich-stadtkreise
 * zurich-statistischeQuartiere
 * zurich-wahlkreise
 * switzerland-cantons
 */
namespace('sszvis.map', function(module) {
  'use strict';

  function swissMapPath(width, height, featureCollection) {
        var mercatorProjection = d3.geo.mercator()
          .rotate([-7.439583333333333, -46.95240555555556]);

          mercatorProjection
            .scale(1)
            .translate([0, 0]);

        var mercatorPath = d3.geo.path()
          .projection(mercatorProjection);

        var b = mercatorPath.bounds(featureCollection),
            s = 0.96 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        mercatorProjection
            .scale(s)
            .translate(t);

        return mercatorPath;
  }

  var COMPILED_MAPS = {
    compiled: false,
    zurich: {},
    zurich_mesh: {},
    switzerland_geo: {},
    switzerland_mesh: {}
  };

  function compile_maps() {
    if (COMPILED_MAPS.compiled) return true;

    var zuri_names = ['stadtkreise_geo', 'statistische_quartiere_geo', 'wahlkreise_geo'],
        zuri_topology = sszvis.mapdata.zurich,
        zuri_objects = zuri_topology.objects;

    zuri_names.forEach(function(name) {
      COMPILED_MAPS.zurich[name] = topojson.feature(zuri_topology, zuri_objects[name]);
    });

    zuri_names.forEach(function(name) {
      COMPILED_MAPS.zurich_mesh[name] = topojson.mesh(zuri_topology, zuri_objects[name]);
    });

    COMPILED_MAPS.zurich.zurichsee_geo = topojson.feature(zuri_topology, zuri_objects.zurichsee_geo);

    COMPILED_MAPS.switzerland_geo = topojson.feature(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    COMPILED_MAPS.switzerland_mesh = topojson.mesh(sszvis.mapdata.switzerland, sszvis.mapdata.switzerland.objects.cantons);

    COMPILED_MAPS.compiled = true;

    return true;
  }

  module.exports = function() {
    return d3.component()
      .prop('type')
      .prop('keyName').keyName('geoId')
      .prop('width')
      .prop('height')
      .prop('fill').fill(function() { return 'black'; }) // default is black
      .prop('stroke').stroke(function() { return 'none'; }) // default is none
      .render(function(data) {
        if (typeof topojson === 'undefined') {
          throw new Error('sszvis.map component requires topojson as an additional dependency');
        }

        compile_maps();

        var selection = d3.select(this);
        var props = selection.props();

        var mapData, meshData;
        switch (props.type) {
          case 'zurich-stadtkreise':
            mapData = COMPILED_MAPS.zurich.stadtkreise_geo;
            meshData = COMPILED_MAPS.zurich_mesh.stadtkreise_geo;
            break;
          case 'zurich-statistischeQuartiere':
            mapData = COMPILED_MAPS.zurich.statistische_quartiere_geo;
            meshData = COMPILED_MAPS.zurich_mesh.statistische_quartiere_geo;
            break;
          case 'zurich-wahlkreise':
            mapData = COMPILED_MAPS.zurich.wahlkreise_geo;
            meshData = COMPILED_MAPS.zurich_mesh.wahlkreise_geo;
            break;
          case 'switzerland-cantons':
            mapData = COMPILED_MAPS.switzerland_geo;
            meshData = COMPILED_MAPS.switzerland_mesh;
            break;
          default:
            throw new Error('incorrect map type specified: ' + props.type);
        }

        var mapPath = swissMapPath(props.width, props.height, mapData);

        sszvis.patterns.ensurePattern(selection, 'missing-pattern')
          .call(sszvis.patterns.mapMissingValuePattern);

        var baseGroups = selection.selectAll('.sszvis-map-group')
          .data(mapData.features);

        var mapGroupsEnter = baseGroups.enter()
          .append('g')
          .classed('sszvis-map-group', true);

        mapGroupsEnter
          .append('path')
          .datum(function(d) {
            var o = {
              geoJson: d
            };
            o[props.keyName] = d.id;
            return o;
          })
          .classed('sszvis-map-area', true)
          .attr('d', sszvis.fn.compose(mapPath, sszvis.fn.prop('geoJson')))
          .attr('fill', 'url(#missing-pattern)');

        // add borders
        selection
          .selectAll('.sszvis-map-border')
          .data([meshData])
          .enter()
          .append('path')
          .classed('sszvis-map-border', true)
          .attr('d', mapPath);

        baseGroups.exit().remove();

        var joinedShapes = baseGroups.selectAll('.sszvis-map-area')
          .data(data, sszvis.fn.prop(props.keyName));

        joinedShapes
          .transition()
          .call(sszvis.transition.fastTransition)
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        joinedShapes.exit()
          .attr('fill', 'url(#missing-pattern)');

        // special rendering for lake zurich
        if (props.type.indexOf('zurich-') >= 0) {
          sszvis.patterns.ensurePattern(selection, 'lake-pattern')
            .call(sszvis.patterns.mapLakePattern);

          var zurichSee = selection.selectAll('.sszvis-lake-zurich')
            .data([COMPILED_MAPS.zurich.zurichsee_geo]);

          zurichSee.enter()
            .append('path')
            .classed('sszvis-map-area sszvis-lake-zurich', true);

          zurichSee.exit().remove();

          zurichSee
            .attr('d', mapPath)
            .attr('fill', 'url(#lake-pattern)');
        }
      });
  };

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Hardcoded map data for the cantons of Switzerland
 */
namespace('sszvis.mapdata.switzerland', function(module) {

  module.exports = {"type":"Topology","objects":{"cantons":{"type":"GeometryCollection","geometries":[{"type":"MultiPolygon","id":22,"arcs":[[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],[19],[20],[21]],[[22,23,24,25,26,27,28,29]]]},{"type":"Polygon","id":21,"arcs":[[30,31,32,33,34,35,36,37,38,39],[40,41]]},{"type":"Polygon","id":18,"arcs":[[-40,42,43,44,45]]},{"type":"MultiPolygon","id":10,"arcs":[[[-13,46,-26,-25,47,-23,-30,-29,48,-14],[49]],[[-9,50,-11,-10]],[[-20]],[[-22]],[[51]]]},{"type":"MultiPolygon","id":2,"arcs":[[[-15,-49,-28,52,53,54,55,56,57,58,59,60,61,62,63,64],[65],[-52]],[[-24,-48]],[[-50]],[[66,67]]]},{"type":"Polygon","id":19,"arcs":[[68,69,-59,70,71,72,73,74,75]]},{"type":"MultiPolygon","id":11,"arcs":[[[-66]],[[-68,76,77,-71,-58]],[[78,79]],[[80,81,82]]]},{"type":"Polygon","id":26,"arcs":[[83,84,85,86,-77,-67,-57]]},{"type":"Polygon","id":3,"arcs":[[-69,-76,87,88,89,90,91,92,93,94,95,96,97,98,-60,-70]]},{"type":"Polygon","id":9,"arcs":[[99,100,-89,-88,-75,101]]},{"type":"MultiPolygon","id":17,"arcs":[[[102,103,104,105,106,107,108,109,-45,110,111,112],[113,114,115,116,117,118],[119,120]],[[121]]]},{"type":"Polygon","id":1,"arcs":[[-74,122,123,124,125,126,127,-106,-105,128,129,-102]]},{"type":"MultiPolygon","id":13,"arcs":[[[-87,-83,130,-80,131,132,133,-72,-78]],[[-81,-86,134]]]},{"type":"Polygon","id":15,"arcs":[[-119,135,-117,136,-115,137]]},{"type":"Polygon","id":24,"arcs":[[-55,-54,-53,-27,-47,-12,-51,-8,-7,138,-84,-56]]},{"type":"Polygon","id":23,"arcs":[[139,-17,-16,-65,140,-38,141]]},{"type":"MultiPolygon","id":25,"arcs":[[[-5,-4,142,143]],[[-21]],[[-19,144,-2,-1]]]},{"type":"Polygon","id":4,"arcs":[[-39,-141,-64,145,146,147,148,149,150,-43]]},{"type":"MultiPolygon","id":20,"arcs":[[[151,152,153,154,155,156,157,158,-108,-107,-128],[-122]],[[-121,-120]]]},{"type":"Polygon","id":5,"arcs":[[-101,-100,-130,-129,-104,-103,159,-150,-149,160,-94,-93,-92,-91,-90]]},{"type":"Polygon","id":8,"arcs":[[-111,-44,-151,-160,-113,-112]]},{"type":"MultiPolygon","id":16,"arcs":[[[-114,-138]],[[-116,-137]],[[-118,-136]]]},{"type":"MultiPolygon","id":6,"arcs":[[[-61,-99,161,162,163]],[[-146,-63,164]]]},{"type":"Polygon","id":7,"arcs":[[-95,-161,-148,-147,-165,-62,-164,-163,-162,-98,-97,-96]]},{"type":"Polygon","id":12,"arcs":[[-133,165]]},{"type":"MultiPolygon","id":14,"arcs":[[[166,-124]],[[167,-156,-155,168]],[[-153,169,-126,170]]]}]},"lakes":{"type":"GeometryCollection","geometries":[{"type":"Polygon","id":9050,"arcs":[[171,172,173],[174],[175]]},{"type":"Polygon","id":9757,"arcs":[[176,177,178,179,180,181]]},{"type":"Polygon","id":9089,"arcs":[[182]]},{"type":"Polygon","id":9276,"arcs":[[183]]},{"type":"Polygon","id":9073,"arcs":[[184]]},{"type":"Polygon","id":9751,"arcs":[[185]]},{"type":"Polygon","id":9270,"arcs":[[186]]},{"type":"Polygon","id":9157,"arcs":[[187]]},{"type":"Polygon","id":9216,"arcs":[[188]]},{"type":"Polygon","id":9267,"arcs":[[189,190]]},{"type":"Polygon","id":9172,"arcs":[[191,192]]},{"type":"Polygon","id":9040,"arcs":[[193]]},{"type":"Polygon","id":9175,"arcs":[[194,195,196]]},{"type":"Polygon","id":9148,"arcs":[[197,198],[199]]},{"type":"Polygon","id":9711,"arcs":[[200,201]]},{"type":"Polygon","id":9710,"arcs":[[202,203,204,205,206,207]]},{"type":"Polygon","id":9179,"arcs":[[208,209,210,211,212,213,214,215,216,217]]},{"type":"Polygon","id":9151,"arcs":[[218,219,220,221,222,223,224]]},{"type":"Polygon","id":9294,"arcs":[[225,226]]},{"type":"Polygon","id":9239,"arcs":[[227]]},{"type":"MultiPolygon","id":9326,"arcs":[[[228,119,229,230,231],[232],[233]],[[234,235,236],[237]]]},{"type":"Polygon","id":9163,"arcs":[[238]]}]}},"arcs":[[[5661,30097],[-127,106],[-160,38],[-46,207],[-225,-5],[-160,213],[-130,-105],[40,-112],[-113,-76],[36,-174],[174,-103],[122,-152],[193,-36],[-39,-231],[229,-239],[79,-18]],[[5534,29410],[558,-380]],[[6092,29030],[-284,-889]],[[5808,28141],[-460,-1310],[-621,469]],[[4727,27300],[-377,234],[-280,266],[-333,595]],[[3737,28395],[25,188],[84,110],[123,396],[55,360],[233,163],[194,394],[-5,158],[80,266],[193,315],[-105,287],[-84,85],[-41,233],[-218,-82],[-308,497],[-491,579],[10,-155],[-189,144],[-114,241],[-45,183],[-680,302],[-75,62],[240,745],[233,419],[-22,323],[-212,284],[44,190],[-75,126],[-14,277],[99,87],[438,669],[348,1351],[173,337],[369,651],[148,-122],[203,410],[-107,131],[174,282],[-405,593],[-599,905],[237,352],[98,260],[280,366],[227,250],[101,66],[165,293],[108,26],[288,274],[27,193],[189,240],[156,140],[-2,67],[177,307],[89,2],[105,218],[95,63],[62,156],[171,138],[130,327],[750,1027],[65,132],[-25,166],[186,187],[117,183],[333,193],[571,550],[81,9],[313,199],[230,227],[40,156],[131,222],[94,-55],[161,117],[-6,213],[80,110],[196,-5],[117,186],[47,279],[-65,117],[133,222],[136,135],[78,-32],[439,204],[147,133],[190,261],[-7,213],[209,289],[80,52],[-11,211],[148,465],[-521,628],[-85,518],[214,187],[-23,376],[64,371],[385,939]],[[11109,53902],[118,-36],[24,-145],[345,-59],[908,481],[93,98],[226,397],[174,87],[140,206],[163,41],[242,234],[372,252],[231,-28],[373,257],[275,-12],[406,836],[37,209],[467,463],[367,265],[790,491],[57,-239],[-132,-728],[-17,-467],[96,-32],[420,-507],[-47,-490],[49,-4],[-16,-241],[-153,-529],[163,176],[305,-66],[65,-82]],[[17650,54730],[514,-777]],[[18164,53953],[-832,-1201],[553,-888]],[[17885,51864],[253,-397],[116,124],[71,-172],[-182,-257],[-68,-212],[163,146],[324,-476],[144,137],[102,-94],[357,-504],[45,179],[126,-110],[83,85],[67,211],[68,-101],[166,215],[-29,44],[218,187],[87,-89],[14,-240],[350,-275],[188,140],[132,-49],[241,204],[47,110],[83,-194],[131,242],[-11,142],[105,335],[226,506],[-82,170],[-95,-21],[-84,87],[-182,-344],[-141,115],[130,332],[-23,254],[-116,284],[-26,220],[168,507],[185,387],[246,293],[-75,57],[-66,238],[-94,44],[-155,261],[-366,-213],[-96,170],[195,66],[192,149],[45,-117],[211,204],[-224,446],[-87,-96],[-169,225],[-65,-19],[-101,184]],[[20627,55584],[-569,1083]],[[20058,56667],[667,756]],[[20725,57423],[569,-953]],[[21294,56470],[172,-275],[-128,-203],[43,-131],[159,-7],[65,-169],[50,52],[77,-279],[85,-53],[64,-193],[119,-173],[71,-218],[61,27],[113,-297],[105,98],[-261,678],[92,131],[85,-39],[167,192],[92,-147],[247,-519],[-196,-339],[-69,-271],[76,-124],[-57,-144],[-10,-231],[87,-206],[68,39],[91,-149],[-58,-161],[2,-252],[140,-78],[0,-128],[-159,-405],[-223,59],[-208,227],[-158,-396],[70,-73],[-112,-158],[29,-177],[193,-410],[-234,-442],[20,-288],[-116,-101],[-35,-122],[-98,87],[-79,-41],[-107,-243],[-125,-156],[-6,-133],[91,-50],[-145,-192],[-194,-353],[-125,131],[-136,-250],[142,-208],[50,52],[63,-146],[231,132],[155,-220],[89,-210],[-115,-342],[-9,-220],[-297,-462],[-112,-264],[-125,-6],[-152,-177],[-267,-554],[45,-64],[-107,-346],[-130,-195],[-57,7],[-177,-321],[-100,115],[-127,-225],[41,-222],[159,-142],[-165,-413],[86,-84],[-75,-225],[-119,80],[-131,-212],[-251,158],[42,100],[-124,81],[-111,-14],[-45,-131],[-75,35],[-144,-381],[-151,-233],[-20,105],[-155,37],[-174,-124],[108,-103],[-91,-254],[-58,-344],[119,-257],[26,-277],[-36,-305],[44,-311],[-43,-396],[-79,-39],[66,-365],[-57,-286],[6,-199],[-86,-330],[164,-13],[52,144],[180,16],[-29,114],[52,236],[143,-91],[69,-300],[244,-99],[156,305],[94,78],[145,-65],[253,-190],[81,-137],[146,-486],[109,103],[112,-247],[81,272],[89,12],[128,130],[81,-45],[-55,-144],[72,-262],[-318,-155],[-309,-582],[-196,-294],[-87,-430],[-61,41],[17,224],[-114,257],[-279,-149],[-196,-46],[-161,28],[53,220],[-47,34],[-151,-321],[-32,-231],[-139,-314],[99,-174],[56,-240],[145,-209],[126,9],[58,-346],[88,-238],[116,-167],[76,4],[52,-144],[330,9],[77,328],[138,172],[199,394],[356,371],[-12,-298],[-48,-199],[24,-119],[110,266],[184,-31],[349,-238],[188,-277],[296,-11],[70,52],[256,-265],[60,-143],[190,-210],[-19,-257],[76,-291],[100,-155],[-56,-76],[43,-669],[56,-18],[160,-282],[54,-197],[-162,-394],[-19,-117],[196,39],[215,216],[315,203],[31,-18],[63,534],[-19,50],[145,227],[23,121],[270,399],[143,142],[320,437],[105,85],[146,-126],[115,115],[244,-92],[203,78],[52,-75],[107,107],[112,268],[306,215],[50,186],[114,80],[91,158],[115,582],[60,87],[22,211],[81,89],[237,-59],[521,545],[208,378],[191,-236],[144,-424],[66,60],[285,653],[302,290]],[[28238,39688],[5,-355],[193,-396],[-18,-256],[34,-90],[45,-444],[-41,-360],[30,-146],[-84,-300],[-2,-156],[-107,-259],[-152,-55],[67,-94],[13,-240],[-210,-78],[-60,25],[23,-438],[130,-538],[-86,-438],[120,-148],[-141,-115],[-5,-273],[-71,-180],[-210,-118],[-177,-22],[-65,78],[-157,-9],[-45,-330],[136,-213],[31,-182],[133,-206],[73,-233],[-62,-376],[15,-254],[-69,-122],[-71,-352],[-149,-442],[-20,-232],[320,-7],[-25,-233],[199,-569],[68,0],[158,145],[87,-152],[-83,-146],[-162,-87],[82,-401],[-32,-923]],[[27896,28968],[-713,-1210],[6,-423],[165,-280],[-46,-163],[-186,-137],[68,-467],[-109,-209],[-144,-9],[-355,-698],[-147,-53],[-64,-172],[-25,-224],[-240,-312],[-117,-64],[-225,14],[-63,-369],[15,-270],[-58,-33],[-254,-526],[-267,-216],[-176,-272],[-187,-92],[-187,66],[-160,-75],[-103,-161],[-135,-84],[-304,-273],[-124,-34],[-119,226],[-125,328],[-212,282],[-43,234],[-48,522],[-100,53],[-48,382],[-114,206],[-191,557],[-35,279],[-170,239],[-270,446],[-71,207],[-58,524],[-105,231],[-152,218],[-262,268],[-126,935],[7,339],[-59,325],[-229,401],[-102,39],[-230,-51],[-132,37],[-82,128],[-145,381],[-128,192],[3,137],[102,408],[-30,435],[-65,154],[-162,179],[-358,609]],[[19902,32072],[-19,66],[-737,1398],[-77,107]],[[19069,33643],[-3068,1297],[-3590,98],[-2060,-1936],[-1993,-577],[-1814,-2068],[-256,-804]],[[6288,29653],[-627,444]],[[18855,47999],[132,252],[241,106],[224,-136],[175,-240],[339,-140],[136,183],[-53,30],[20,190],[344,800],[-140,195],[29,94],[-99,82],[-192,265],[-101,-96],[20,257],[-75,87],[-102,289],[-68,48],[-61,-197],[58,-5],[-98,-281],[-338,-452],[30,-91],[-180,-321],[-25,-131],[-134,-187],[32,-95],[-230,-148],[-46,77],[-131,-144],[-35,114],[-189,-336],[112,-181],[405,112]],[[5033,29767],[-189,250],[-72,-83],[-113,-327],[93,-99],[69,296],[152,-144],[60,107]],[[17472,48185],[69,-170],[162,-147],[-10,-151],[85,-222],[182,160],[147,259],[1,165],[154,282],[1,488],[38,94],[-167,172],[-55,-87],[-68,94],[-108,-332],[-185,-255],[-17,-91],[-141,-30],[-88,-229]],[[24869,56844],[131,-261],[68,-53],[-43,-151]],[[25025,56379],[-100,-87],[49,-92],[-124,-172]],[[24850,56028],[-192,-28],[116,-64],[-314,-357],[-80,-140],[-6,-194],[166,-154],[32,-140],[-89,-231],[-90,-78],[-101,-213],[-88,-297],[-110,-71],[-134,-381],[-75,64],[-47,-126],[-184,250],[111,216],[-19,96],[143,153],[-216,266],[120,355],[-227,208],[-75,-80],[-116,218],[-46,-149],[-167,-215],[-157,59],[-123,224],[127,129],[219,337],[-488,712],[-140,266],[72,125],[-57,76],[124,220],[-207,248],[-137,-120],[-156,168],[-76,162]],[[22163,57542],[-738,1210]],[[21425,58752],[1639,1601],[830,-325]],[[23894,60028],[262,-133]],[[24156,59895],[250,-280],[-113,-281],[39,-110],[-52,-167],[48,-177],[-69,-27],[70,-170],[38,-442],[-76,-186],[41,-96]],[[24332,57959],[537,-1115]],[[70621,21347],[-59,-346],[-157,-81],[-193,-265],[-138,-83],[-38,-162],[-133,-248],[-126,-481],[-170,14],[-180,-140],[-172,-231],[-180,-83],[-87,-121],[-147,-78],[-140,-158],[363,-1317],[14,-163],[-118,-391],[-125,-184],[-3,-464],[-97,-133],[-302,-85],[-223,85],[-115,-170],[-118,2],[-236,-288],[-146,-2],[-105,-134],[-8,-323],[-168,-281],[-45,-348],[35,-156],[308,-507]],[[67612,14025],[45,-719]],[[67657,13306],[75,-352],[-125,-53],[-5,-149],[-102,-92],[-143,21],[-1,-227],[-157,-169],[-199,36],[19,-295],[-161,-199],[123,-182],[433,-274],[21,-452],[56,-77],[-114,-269],[51,-151],[168,-149],[-67,-435],[166,14],[67,-110],[157,-5],[142,62],[132,-328],[243,33],[-28,-234],[208,-179],[178,-62],[-26,-258],[34,-323],[219,142],[43,-257],[-81,-46],[-78,-197],[-80,12],[34,-163],[-37,-172],[-126,-132],[-126,-326],[-205,-16],[-174,-595],[1,-195],[54,-197],[-241,-373],[-113,-335],[42,-206],[-110,-481],[47,-103],[-59,-106],[-211,58],[-98,-184],[-300,88],[-131,139],[-95,-43],[67,593],[-66,-34],[-168,240],[-104,-146],[-122,36],[-66,-192],[-263,185],[20,138],[-293,206],[-212,-108],[-121,-112],[-107,-264],[-190,39],[-188,-174],[42,561],[410,883],[285,286],[-85,153],[-101,-112],[-49,220],[-62,607],[-113,330],[-55,5],[-66,217],[76,309],[-189,543]],[[65257,9169],[-41,160],[-150,1],[-246,435],[-77,247],[11,238],[80,227],[-5,617],[-67,203],[-338,-114],[-74,130],[-166,99],[-58,190],[-108,39]],[[64018,11641],[-239,335],[-118,221],[-12,166],[-255,316],[-253,-16],[-137,148],[-464,62],[-60,-140],[-94,12],[159,894],[278,662],[309,167],[183,419],[41,353],[61,-48],[60,153],[-156,147],[137,204],[210,-131],[231,627],[-55,667],[-114,30],[-101,186],[-194,139],[-269,507],[-130,181],[-208,189],[-135,-316],[-371,-25],[-326,312],[-154,36],[-123,175]],[[61719,18273],[-294,815],[-395,-564],[-210,-625],[-372,199]],[[60448,18098],[-256,30],[-104,190],[-25,195],[-261,-43],[-246,165],[-27,160],[-183,348],[-603,-89],[-197,9],[-43,252],[-1,282],[-112,114],[-47,142],[-205,223],[13,171],[133,140],[64,298],[-326,46],[-3,229],[-86,82],[-106,-62],[-126,147],[-83,577],[-128,341],[-216,97],[-19,291],[-267,252],[-103,320],[-85,671],[-237,170],[-106,-85],[-156,73],[-173,211],[-331,200],[-203,8],[-207,129],[-49,153],[-52,397],[-206,126],[-222,78],[-57,263],[131,170],[14,162],[163,115],[-135,501],[-340,648],[-12,193],[-133,305],[106,187],[176,92],[-34,135],[60,147],[-6,263],[50,184],[227,89],[39,280],[89,70],[111,257],[-21,518],[-49,421],[68,220],[119,188],[-71,291],[-11,564],[-120,320],[224,437],[-166,328],[-6,156],[111,261],[-113,284],[-105,112],[-35,147],[72,376],[-57,187],[133,209],[58,179],[-106,162],[13,207],[-202,226],[-23,174],[-125,223],[-165,-48],[-10,71],[-376,-152],[-86,-105],[-220,-28],[-106,-162],[-132,-3],[-79,-153],[-179,30]],[[53542,34837],[-56,364],[78,98],[-9,179],[155,112],[-74,259],[-69,108],[193,447],[-66,316],[13,149],[144,-23],[50,-90],[219,19],[74,94],[115,-101],[266,211],[248,-76],[49,73],[147,518],[89,21],[100,139],[127,305],[149,270],[116,90],[-10,119]],[[55590,38438],[110,217],[175,32],[98,81],[232,29],[41,65],[266,116],[-40,376],[-72,220],[36,176],[-57,175],[80,249],[87,140],[-23,272],[26,225],[86,23],[25,169],[113,154],[174,105],[201,-224],[142,-62],[223,27],[188,112],[88,-96],[86,-222],[202,-169],[239,7],[221,68],[78,151],[255,-91],[74,-129],[-26,-116],[48,-255],[85,-68],[299,62],[226,236],[180,283],[266,124]],[[60022,40900],[152,60],[154,-37],[128,67],[101,-90],[51,-258],[270,-127],[229,285],[246,-234],[142,29],[115,163],[186,-130],[62,38],[852,-526],[639,387],[49,-357],[251,-24],[249,324],[481,236],[43,75],[218,112],[126,140],[320,227],[166,266],[25,208],[-217,456],[-40,277],[42,177],[97,146],[153,51],[98,153],[87,-87],[133,-14],[170,-114],[217,277],[39,380],[110,-94],[123,-582],[-75,-355],[58,-385],[84,53],[156,-53],[235,294],[260,139],[235,-34],[221,-371],[101,2],[161,-199],[132,44],[-12,-284],[204,-252],[21,-259],[-142,-64],[-43,-326],[-120,-185],[-71,-255],[0,-199],[-76,-170],[31,-139],[-119,-373],[53,-647],[-112,-91],[80,-195],[65,-424],[-26,-314],[35,-210],[107,-216],[94,-61],[165,-399],[2,-209],[106,-68],[61,-216],[-54,-112],[185,-210],[150,-28],[286,190],[260,-234],[-6,-210],[187,-369],[34,-137],[-85,-569],[-94,-227],[56,-325],[-11,-226],[262,-697],[30,-316],[-261,-211],[128,-316],[-110,-201],[-88,-328],[79,-250],[97,-504],[-50,-105],[32,-323],[-40,-312],[-87,-219],[-5,-158],[-145,-56],[-237,-231],[-103,-346],[70,-185],[-131,-252],[46,-151],[206,-450],[-65,-288],[-92,-69],[-166,-465],[-129,-115],[-15,-132],[83,-475],[134,-444],[186,-250],[123,-355],[-37,-1069],[-112,-97],[76,-206],[112,90],[88,-426],[0,-186],[126,-392],[485,-353],[171,-220],[266,-572],[16,-218],[467,-643],[143,-39]],[[66599,12440],[-225,49],[-185,-915],[195,-82]],[[66384,11492],[183,-57],[83,433],[-70,236],[49,322],[-30,14]],[[60022,40900],[71,447],[-23,312],[-73,151],[6,275],[50,105],[-57,176],[26,291],[-37,158],[-203,42],[-217,286],[-30,247],[-118,133],[27,222],[113,138],[19,263],[-80,133],[141,291],[111,-5],[271,397],[-107,321],[32,645],[-26,365],[96,132],[176,-36],[104,305],[91,110],[168,6],[128,-180],[183,176],[29,167],[175,64],[202,282],[168,105],[135,234],[-104,392],[76,346],[391,428],[90,-37],[-1,-179],[71,-45],[100,-358],[102,-187],[257,160],[130,-9],[89,121],[209,158],[-70,312],[103,327],[69,548],[185,162],[121,-38],[54,105],[-73,206],[-61,378],[0,598],[145,167],[128,-55],[171,14],[-8,190],[107,64],[163,286],[308,142],[73,214]],[[64398,52068],[251,84],[73,-59],[143,27],[185,-197],[178,50],[-7,-480],[79,-133],[162,-12],[63,-75],[262,141],[71,104],[109,14],[137,157],[71,-36],[173,98],[367,57],[335,122],[254,44],[241,293],[34,210],[88,184],[99,373],[98,94],[-15,177],[132,391],[138,142],[-39,252],[42,525],[163,30],[174,345],[280,39],[233,-139],[225,-53],[-4,-170],[196,-377],[26,-312],[145,-133],[54,96],[291,216],[35,109],[262,124],[134,447],[226,131],[-84,281],[536,-34],[242,-124],[70,108],[184,85],[97,123],[48,188],[107,110],[149,259],[145,323],[45,195],[176,128],[114,-2],[75,247],[126,135]],[[72592,56990],[121,-144],[45,-227],[226,-229],[192,161],[112,9],[133,-103],[150,96],[172,-78],[195,14],[169,-216],[95,-30],[368,69],[99,-179],[87,65],[314,-112],[451,15],[123,-48],[197,-165],[317,-68],[322,-193],[174,-146],[105,-239],[241,-323],[82,83],[75,316],[-37,231],[277,1],[64,258],[-54,399],[81,75],[99,239],[150,85],[126,194],[-207,163],[-18,231],[59,261],[116,209],[19,245],[157,105],[54,126],[91,440],[64,-5],[30,195],[308,106],[-24,604],[63,144],[321,152],[142,-14],[99,115],[-637,1220],[-137,349],[-85,417],[-546,1211],[-133,387]],[[77599,63461],[7,152],[131,71],[49,-323],[174,360],[114,-129],[62,147],[84,-48],[218,57],[71,137],[495,213],[91,-45],[207,-344],[25,-309],[119,-94],[207,190],[200,71],[63,-59],[329,302],[83,-7],[67,140],[93,-55],[224,-340],[196,-112],[230,21],[105,108],[79,275],[281,-63],[148,53],[167,-18],[155,151],[206,-339],[293,-144],[131,76],[-17,-261],[274,-216],[124,9],[440,-128],[114,-215],[275,36],[146,66],[351,-22],[153,-323],[212,-106],[112,-213],[117,-128],[121,-12],[138,-105],[160,-240],[185,-90],[25,104],[245,59],[125,131],[43,169],[387,-69],[91,-167],[-235,-245],[68,-298],[342,-270],[8,-247],[69,-248],[-163,-233],[-7,-218],[-197,-351],[-1,-288],[-107,-206],[183,-278],[-57,-456],[2,-339],[90,-24],[-98,-266],[87,20],[319,-162],[208,-280],[178,19],[88,-191],[183,-204],[281,-190],[207,-53],[58,81],[214,92],[98,-204],[182,78],[42,87],[128,-33],[47,-405],[118,-44],[73,-135],[162,-30],[184,-137],[103,87],[157,30],[76,-184],[132,-116],[120,-330],[130,-64],[94,-309],[240,-220],[-65,-246],[33,-348],[166,-135],[309,62],[226,-87],[78,50],[114,-116],[-21,-337],[134,-126],[166,-394],[291,188],[33,117],[121,62],[109,-63],[231,16],[88,195],[207,-57],[71,-124],[111,154],[136,-26],[74,149],[114,25],[110,118],[23,118],[156,147],[76,200],[119,7],[106,-78],[337,109],[297,-45],[-40,146],[13,296],[57,229],[11,236],[-155,236],[-40,318],[156,241],[68,547],[96,202],[25,678],[568,-133],[593,-332],[64,-103],[80,229],[333,46],[33,252],[-255,435],[84,481],[295,75],[99,110],[52,504],[111,408],[120,225],[-4,189],[91,63],[73,336],[172,103],[356,-54],[316,455],[80,2],[208,-187],[84,-337],[199,-330],[168,-140],[169,-224],[-3,-314],[-67,-227],[-19,-227],[155,-165],[453,-185],[121,16],[63,-117],[240,-178],[180,-296],[223,-94],[-28,-412],[34,-122],[-40,-529],[-162,-266],[-29,-357],[-44,-121],[-18,-321],[-215,-442],[101,-188],[34,-339],[-15,-273],[-56,-245],[84,-636],[-64,-49],[-110,-309],[57,-259],[-142,-59],[-76,-213],[85,-250],[-99,-140],[42,-261],[-224,-735],[-192,-167],[-207,-35],[-74,-359],[-75,-87],[133,-85],[108,-186],[19,-160],[155,-318],[0,-227],[53,-232],[-53,-488],[-136,33],[-294,-356],[-235,-224],[-20,-89],[-231,-239],[182,-245],[43,-208],[168,-248],[-54,-456],[-167,-183],[-116,10],[-219,-761],[-199,-149],[166,-696],[-23,-193],[56,-334],[-14,-291],[91,-105],[5,-163],[75,-160],[42,-266],[-42,-94],[202,-168],[245,154],[513,53],[60,91],[363,-393],[475,-747],[175,-97],[-20,-201],[-145,-291],[60,-334],[-78,-282],[89,-128],[-96,-417],[28,-158],[-91,-126],[-131,-388],[-13,-187],[82,-264],[-149,-428],[27,-225],[-289,-105],[-12,-229],[-137,-261],[-343,297],[-68,186],[-354,474],[-72,-9],[-319,-289],[-60,-20],[-208,144],[-98,119],[-444,268],[-244,2],[-43,-295],[-264,-321],[-170,314],[-110,117],[-140,-158],[-169,-83],[-74,131],[-266,25],[-36,94],[34,309],[-142,293],[-45,278],[-237,105],[-160,243],[-128,-53],[-210,-256],[-175,176],[-48,144],[-56,518],[6,181],[67,211],[306,641],[-304,559],[-104,241],[-32,401],[-305,-266],[-121,-257],[-91,-364],[-195,181],[-288,115],[-13,132],[-212,-93],[-433,-376],[-264,-71],[-177,-160],[-138,-26],[-62,-139],[-151,-133],[-311,100],[-153,166],[-92,6],[-79,-250],[57,-215],[-82,-156],[-14,-199],[92,-208],[8,-229],[-131,-335],[-374,-107],[30,-191],[119,-185],[-169,-312],[-131,-80],[-87,-419],[-96,-74],[-42,-139],[-326,-83],[-62,-178],[53,-243],[162,-161],[-71,-141],[77,-301],[-58,-444],[-103,-133],[-93,-22],[32,-294],[112,-195],[-76,-171],[-8,-280],[72,-121],[-112,-268],[-3,-183],[181,-307],[16,-284],[48,-67],[-44,-201],[-129,-138],[-106,-247],[16,-158],[-73,-92],[62,-213],[320,-87],[40,-119],[-6,-298],[141,-300],[216,133],[134,-149],[10,-209],[254,76],[187,-67],[41,170],[136,156],[187,-97],[38,145],[263,99],[47,-99],[224,-37],[87,-247],[54,-497],[113,121],[122,34],[146,-409],[-93,-110],[30,-690],[-45,-153],[-137,-122],[-289,64],[-330,-387],[-38,-398],[78,-406],[-127,-75],[-225,-310],[-110,-77],[7,-324],[-66,-146],[-20,-394],[179,-486],[78,-440],[157,-100],[213,-285],[117,-64],[-15,-171],[173,-271],[146,-59],[91,-232],[-49,-187],[177,-152],[-26,-238],[47,-284],[191,-224],[99,-397],[-36,-174],[-530,-712],[-109,-442],[-303,-268],[-78,39],[-118,-90],[-98,78],[-213,16],[-125,131],[-330,-34],[-162,-113],[-225,-396],[-176,146],[-97,229],[-322,218],[213,302],[2,285],[151,306],[-59,481],[-77,397],[-238,160],[-99,161],[-239,208],[-432,144],[-282,200],[-92,542],[95,51],[104,305],[-98,169],[75,121],[6,161],[-120,36],[-203,326],[-118,112],[78,238],[52,293],[113,257],[111,122],[-35,206],[39,222],[-51,59],[-196,-36],[-18,87],[-435,492],[-189,472],[61,222],[-129,48],[-410,-199],[-87,-153],[14,-198],[-125,-89],[-52,220],[-131,-9],[-200,493],[-467,-353],[-63,7],[-78,-250],[-260,-261],[-69,94],[-258,-74],[-92,69],[-74,-128],[-134,27],[-162,-59],[-27,-133],[-290,-419],[-196,-58],[-156,-215],[-199,-32],[-127,-128],[-68,20],[-153,-297],[-170,48],[-167,171],[-152,292],[-178,107],[-83,195],[-145,-55],[-308,-479],[102,-378],[-194,-284],[-18,-245],[180,-101],[-29,-410],[-149,-227],[-71,-407],[-9,-225],[-275,-105],[-181,142],[-99,-16],[-167,169],[-10,140],[-105,146],[-125,-151],[-48,-185],[-107,55],[-283,-197],[-24,-147],[-170,-140],[-141,-20],[-257,92],[-120,-49],[-185,342],[-245,59],[-142,-105],[-62,73],[-147,-37],[-130,76],[-228,263],[-65,-4],[-92,247],[-108,-23],[-119,-174],[-267,330],[-253,468],[-33,139],[-133,243],[-16,168],[-96,123],[-41,163],[-72,545],[5,163],[-176,220],[-47,297],[-89,126],[-249,110],[-80,186],[-352,151],[-49,76],[45,208],[-44,153],[91,55],[66,243],[-41,108],[-3,286],[-55,367],[-85,343],[-82,147],[-40,263],[73,521],[-7,233],[70,243],[-37,201],[6,802],[94,119],[46,177],[-37,433],[-37,91],[-277,-23],[-10,209],[261,20],[35,631],[-35,357],[50,162],[-105,-25],[-79,-149],[-459,-350],[-211,-442],[35,-135],[-42,-179],[-4,-282],[-133,-172],[-102,-256],[-90,-9],[-259,128],[-46,103],[-128,60],[-37,279],[-61,158],[-165,69],[-77,233],[-66,42],[-61,293],[102,169],[5,230],[-112,57],[-131,208],[-162,-250],[-87,53],[-264,-75],[-46,103],[-575,-90],[-128,-149],[-81,-11],[-223,-158],[-175,-18],[-100,-259],[-2,-193],[-100,-188],[68,-213],[-30,-375],[-46,-71],[16,-323],[77,-74],[-131,-307],[-146,-190],[-324,-105],[-84,-101],[39,-412],[-11,-247],[124,-225],[167,-186],[47,-185],[137,-112],[125,66],[32,-202],[67,-32],[57,-455],[-81,-81],[65,-89],[-133,-312],[60,-268],[129,-151],[-102,-330],[-58,-354],[12,-227],[111,-436],[298,-110],[40,-114],[-29,-179],[69,-284],[-157,-268],[16,-291],[128,-208],[-75,-188],[-47,-335],[-191,-103],[-77,-242],[42,-163],[12,-401],[-257,-373],[-99,-355],[-201,-184],[10,-258],[-49,-175],[-143,-139],[57,-218],[-87,-259],[47,-268],[-67,-165],[38,-144],[-38,-479],[-46,-114],[-247,71],[-222,-183],[-91,-21],[47,-248],[-66,-162],[-26,-296],[-97,-172],[-168,-16],[-95,-93],[-104,-429],[1,-160],[-63,-119],[11,-200],[56,-117],[-70,-146],[-1,-222],[-159,-209],[-121,-259],[-302,101],[-194,-98]],[[20725,57423],[700,1329]],[[24850,56028],[10,-153],[155,-49],[90,174],[196,227],[-139,-15],[-137,167]],[[24156,59895],[832,-21],[87,-20],[983,345],[495,193],[864,678],[116,220],[116,-112],[61,139],[94,-4],[132,-412],[76,-69],[-89,-174],[270,-307],[-169,-387],[-132,-122],[28,-68],[-172,-156],[-11,-207],[-147,35],[-18,-183],[-250,-3],[38,-139],[208,-14],[97,-236],[-49,-76],[-21,-240],[42,-277],[-143,-175],[-4,-100],[189,-294],[-11,-293],[-107,-27],[12,-342],[-26,-125],[50,-266],[-200,-238],[-139,-55],[-100,-138],[164,-59],[101,160],[275,-28],[110,-201],[166,277],[119,34],[46,-226],[235,-67],[19,99],[351,-103],[142,-186],[322,-209],[203,211],[201,-45],[318,-19],[261,66],[525,-237],[93,-138],[-26,-504],[28,-192],[81,-69],[36,-284],[-231,-486],[-226,-167],[-88,92],[-188,-32],[-63,148],[171,133],[-156,160],[-136,-22],[-22,96],[-95,-181],[-2,-149],[-217,-170],[83,-87],[49,-178],[319,-277],[159,-270],[30,-152],[-62,-149],[-191,-179],[27,-455],[-208,-278],[-135,-662],[-84,-116],[37,-151],[-36,-205],[58,-134],[-303,-482],[55,-82],[48,-266],[123,-101],[52,-196],[8,-587],[-159,-492],[-6,-358],[55,-282],[205,-300],[419,-23],[135,-89],[351,-123],[4,-326],[-83,-311],[321,-44],[62,60],[51,-200],[81,-116],[183,2],[74,-119],[-94,-115],[39,-201],[-106,-165],[61,-252],[-92,-257],[-26,-534],[-41,-144],[161,25],[-376,-554],[-67,-238],[-21,362],[-125,87],[12,137],[-110,170],[-522,-17],[151,-405],[43,-213],[-165,-218],[-199,-27],[-25,-710],[126,-152],[9,-118],[-76,-750],[130,-414],[-181,-121],[-99,-372],[-205,-105],[-383,208],[-190,-268],[-103,-206],[-183,-485],[-103,-168],[-206,-192],[-193,-99]],[[25629,56331],[97,-108],[119,234],[226,153],[-52,165],[-31,364],[-181,-96],[-32,76],[-230,-147],[-36,-250],[123,-242],[-3,-149]],[[18164,53953],[1894,2714]],[[28192,57790],[-6,-172],[-87,7],[-265,-248],[-61,314],[33,99],[262,181],[19,149],[114,-90],[-9,-240]],[[23894,60028],[-318,1241]],[[23576,61269],[96,202],[86,318],[-16,589],[142,359],[255,292],[327,98],[247,307]],[[24713,63434],[252,364]],[[24965,63798],[-134,360],[-46,34],[10,250],[-83,174],[221,268],[-4,195],[-247,504],[-271,160],[-137,4],[-175,252],[-190,193],[-262,-252],[-117,406],[192,353],[179,219],[-54,112],[-170,30],[-98,-146],[-332,-48],[-63,50],[-247,-252],[-548,-181],[-529,-135],[-248,-172],[-148,186],[-70,-163],[-185,-195],[-706,-625],[-424,-328],[87,811],[225,298],[170,1090],[-601,1643]],[[19960,68893],[41,135],[198,263],[161,-939],[92,-183],[191,165],[301,158],[218,300],[367,374],[121,183],[70,448],[237,136],[92,-319],[115,64],[199,-36],[144,-303],[64,-39],[150,161],[82,298],[91,153],[41,302],[594,115],[150,310],[144,531],[168,412],[69,255],[245,167],[-50,297],[37,230],[471,288],[5,-211],[124,94],[79,-185],[-68,-78],[60,-140],[173,2],[132,282],[245,-53],[351,154],[236,-94],[15,73],[333,142],[-146,300],[51,81],[-193,11],[8,185],[128,122],[-75,149],[72,181],[441,266],[-23,318],[36,225],[-102,116],[98,115],[-128,103],[114,71],[129,-21],[432,81],[333,-53],[-63,-133],[88,-149],[95,57],[199,-89],[194,4],[231,-137],[339,16],[93,71],[264,-128],[395,64],[331,106],[212,112],[127,247],[198,195],[121,277],[241,-9],[372,197],[297,266],[44,-44],[557,-69],[132,33],[29,-161],[144,-55],[40,-94],[183,14],[280,78],[380,-99],[369,18],[36,-96],[183,-137],[300,59],[224,191],[269,309],[175,117],[422,156],[200,134]],[[35324,76376],[-220,-286],[-32,-488],[-174,-197],[12,-158],[-158,-204],[-260,-22],[-572,-278],[13,-64],[-220,-121],[-160,-278],[-136,-425],[-133,-232],[-310,-73],[-256,-25],[-286,-307],[-187,-80],[-52,-115],[39,-323],[61,-119],[-123,-124],[-145,-25],[-139,-218],[-571,-375],[-292,-328],[-180,23],[-325,-163],[96,-490],[44,0],[169,-751],[249,117],[46,-149],[156,-106],[139,-226],[238,-839],[-212,-53],[18,-226],[218,-5],[131,106],[242,-21],[129,149],[42,250],[186,112],[120,140],[-16,256],[70,192],[92,-29],[76,-186],[179,154],[-33,222],[199,14],[397,121],[29,-156],[-88,-121],[55,-126],[-94,-80],[169,-184],[44,-272],[126,96],[238,-172],[-151,-206],[56,-121],[-236,-243],[-71,-186],[-242,-137],[-293,234],[-108,-32],[-213,-250],[-9,-305],[-200,-50],[-193,-337],[102,-220],[107,-103],[91,101],[-48,-243],[138,-73],[-51,-94],[-163,84],[-169,-139],[-103,16],[-173,-74],[-131,-128],[-189,202],[-112,-108],[-72,303],[-84,-131],[-85,50],[-190,-155],[34,-177],[-55,-52],[109,-212],[174,-613],[-7,-151],[164,-30],[13,-121],[420,139],[231,232],[81,-133],[225,135],[84,-302],[-49,-21],[-40,-227],[42,-355],[123,-337],[292,78],[143,119],[164,44],[153,350],[-89,186],[-198,609],[-14,229],[681,422],[136,210],[138,71],[134,175],[73,189],[3,163],[97,280],[95,124],[33,213],[115,91],[-72,247],[-43,0],[-84,285],[309,212],[20,-93],[120,55],[95,-149],[298,362],[131,-14],[14,-167],[86,-81],[129,90],[148,-243],[100,-564],[51,170],[95,74],[115,-49],[367,142],[22,87],[141,-163],[300,-41],[99,74],[104,-222],[132,54],[47,108],[-50,231],[21,202],[185,325],[278,-4],[13,272],[61,119],[42,303],[-151,87],[78,302],[-120,149],[-150,332],[-328,35],[83,234],[-117,387],[55,192],[-217,231],[111,101],[-69,183],[-211,-142],[-107,-9],[-66,176],[-92,-43],[-65,211],[-148,284],[-63,-21],[-230,312],[40,405],[-91,577],[-104,115],[-196,367],[592,197],[451,64],[469,18],[166,112],[96,129],[231,20],[129,71],[178,229],[80,-167],[273,-183],[246,-598],[65,135],[216,-348],[-1,-158],[174,-339],[124,36],[127,-132],[141,86],[143,-43],[174,412],[209,35],[35,-291],[202,-241],[174,232],[172,318],[93,-2],[29,-163],[127,-112],[129,7],[151,165]],[[41196,73667],[90,-530],[-76,-109],[54,-83],[-36,-211],[170,-385],[106,-171]],[[41504,72178],[-50,-222],[21,-296],[73,-55],[135,-268],[50,-344],[97,-300],[136,-211],[13,-325],[321,-408],[91,-210],[69,-351],[-123,-217],[-33,-232],[46,-449],[97,-274],[184,-319],[-4,-401],[-71,-23],[-6,-155],[-288,-172],[-90,-165],[-25,-209],[70,-4],[-54,-234],[143,-110],[-47,-217],[72,-165],[-57,-174],[124,-101],[-37,-161],[95,-192],[-75,-307],[-31,-511],[-132,-362],[67,-92],[-145,-265],[-23,-298],[39,-165],[86,-87],[57,-185],[149,-12],[68,-375],[169,-127],[52,-382],[127,-197],[-76,-218],[112,-360],[401,225],[107,-12],[67,-210],[105,-94],[415,98],[99,-128],[-92,-325],[-81,-137],[25,-312],[63,-280],[-185,-199],[46,-398],[-132,-193],[-173,-146],[-12,-530],[-58,-117],[-164,-73],[-17,-233],[-124,-337],[-160,-94],[-224,101],[-483,-372],[-59,-84],[-136,-509],[182,-165],[102,-18],[73,-172],[-13,-169],[-212,-538],[1,-131],[-119,-124],[-200,-84],[-52,-211],[42,-259],[-20,-190],[158,-96],[3,-149],[111,-103],[-50,-259],[2,-355],[67,-355],[147,-323],[407,-289],[592,-525],[537,-707],[159,-465],[37,-234],[97,-53],[187,-229],[111,-305],[239,-160],[290,351],[155,73],[354,250],[233,55],[171,-126],[223,22]],[[46142,50869],[127,23],[112,-101],[199,104],[124,-94],[336,57],[26,-179],[190,-275],[59,-215],[250,-23],[181,-142],[540,-719],[269,193],[197,316],[104,-85],[388,290],[143,-112],[262,71],[93,-153],[155,-133],[57,-117],[261,39],[116,374],[447,-282],[100,-154],[103,-291],[155,32],[172,-87],[323,417],[86,5],[308,385],[376,511],[594,103],[197,240]],[[53192,50867],[188,-103],[203,-350],[121,-39],[68,-293]],[[53772,50082],[24,-291],[112,64],[288,355],[148,-73],[40,-99],[309,85],[131,-119],[80,15],[-13,-157],[67,-115]],[[54958,49747],[-59,-371],[-53,-126],[-114,-35],[80,-162],[-35,-598],[196,-362],[-49,-144],[-4,-587],[143,-180],[-39,-307],[66,-252],[-59,-495],[-247,-151],[-184,73],[-100,-48],[-295,64],[-55,153],[-90,-6],[-192,107],[0,-215],[-49,-190],[38,-218],[-22,-266],[92,-254],[130,-108],[50,-645]],[[54107,44424],[-251,48],[-98,-390],[-84,-69],[-230,-492],[-169,-42],[-75,-215],[-18,-398],[53,-73],[-7,-234],[-121,-475],[-73,-137],[40,-412],[-60,-303],[81,-155],[-88,-243],[-197,-289],[-26,-147],[-304,-361],[-431,-97],[-95,-313],[-220,-333],[-184,-27],[-154,-94],[-90,-225],[-418,-237],[-139,-186],[-135,0],[-237,-137],[-222,25],[-274,-30],[-293,-136],[-115,40],[-187,-49],[-240,-137],[-139,169],[-5,349],[-249,36],[-288,-18],[-533,261],[-73,165],[-188,279],[-395,133],[-53,101],[-185,12],[-207,185],[-111,-78],[-178,-32],[-28,-91],[-166,217],[-245,53],[-273,261],[-124,-27],[-200,66],[-318,-250],[-87,12],[-250,-491],[-139,1],[-222,-156],[-41,-158],[-109,-106],[-5,-119],[106,-217],[32,-248],[90,-133],[-57,-153],[10,-215],[-68,-174],[-69,15],[-245,-245],[-46,39],[-207,-54],[-163,-213],[-41,-243],[-203,-147],[-6,-165],[-176,-25],[-92,-204],[-348,-215],[-97,50],[-89,-103],[-227,-131],[-168,-23],[-563,-7],[-352,-364],[-73,-176],[-587,-405],[-95,-188],[-120,-90],[-168,-259],[-42,-162],[-276,-181],[-108,-170],[-367,-368],[-45,-97],[-234,-215],[-164,-25],[-188,-309],[-152,-44],[-226,280],[-119,235],[-75,-9],[-589,429],[-515,304],[-297,248],[-121,-317],[-242,-80],[-18,-219],[31,-172],[-84,-200],[-176,-141],[37,-287],[-130,-190],[-173,112],[-64,167],[-139,-9],[-112,-105],[-141,-28],[-72,-89],[-167,55],[-124,-75],[-210,-12],[-125,-94],[-117,-444],[266,-268],[133,-39],[190,-243],[-324,-248],[-50,-302],[-268,-142],[-419,66],[-110,-258],[-171,71],[-94,-76],[-114,99],[14,110],[-49,327],[-90,177],[-127,-78],[-81,-259],[-136,-9],[-37,-85],[-107,252],[-310,66],[-115,156],[-96,-50],[-130,-213],[-233,-21],[-53,-73],[-234,-127],[-56,-84],[-44,112],[-309,-383],[-100,-199],[-63,7],[-84,-174],[-140,-156],[-119,-46],[-201,-311],[-127,23],[-228,-195],[-296,-107],[-192,-23],[-161,387],[43,179],[-33,118],[75,248],[20,332],[-52,229],[-250,-405],[-187,23],[-623,-426],[-10,-465],[-37,-197],[42,-294],[-194,-364],[-210,-131],[-225,-61],[-267,128]],[[38278,68822],[-173,98],[-111,-148],[-113,-404],[160,7],[186,-91],[86,270],[47,-35],[91,191],[-127,9],[-46,103]],[[35324,76376],[-98,40],[-139,-80],[-351,-23],[-88,77],[148,559],[341,310],[50,212]],[[35187,77471],[176,-139],[274,-644],[-85,-213],[-156,-142],[-72,43]],[[50090,74022],[-179,-978]],[[49911,73044],[-265,-232],[-84,-247],[35,-211],[-52,-101],[-16,-290],[49,-193],[-230,21],[-188,-179],[-215,-32],[-72,160],[31,115],[-194,41],[-124,206],[49,122],[-137,192],[265,64],[159,-25],[123,314],[-28,179],[-106,137],[-324,-209],[-82,16],[-543,-171],[-146,-214],[-120,120],[-232,36],[-68,364],[-156,385],[-233,126],[-222,-137],[-122,-238],[-147,-21],[-75,96],[-140,-52],[14,-154],[131,-273],[-265,-134],[-9,45],[-449,-121],[-22,-76],[-309,172],[39,589],[-67,261],[-186,344],[-34,270],[-189,318],[-186,-263],[-294,-76],[-54,80],[-330,35],[-145,-188],[50,-339],[81,-259],[134,-289],[-205,-268],[-135,-258],[-128,-122],[-150,-233],[-248,89],[-278,297],[-329,-64],[-595,-252],[-310,-233],[-329,94]],[[41196,73667],[183,124],[218,405],[33,266],[400,1202],[251,204],[211,-48],[332,463],[-61,130],[22,215],[121,360],[178,312],[0,-96],[196,-273],[434,-78],[197,14],[22,-149],[-37,-215],[25,-351],[182,87],[435,145],[-23,180],[201,182],[22,-81],[139,197],[298,197],[46,129],[-74,286],[174,211],[24,206],[-55,133],[127,180],[59,166],[86,36],[81,181],[71,438],[24,302],[-94,545],[-137,9],[-10,-96],[-220,106],[7,212],[-67,319],[-179,130],[-177,67],[-32,138],[-164,-24],[-175,278],[-44,-25],[-200,160],[430,286],[66,-265],[35,268],[-16,231],[-60,206],[2,275],[-70,270],[-127,147],[36,103],[-56,263],[-131,163],[-134,-158],[-34,-200],[-78,-18]],[[44109,82717],[17,170],[-194,240],[-192,-82],[100,717],[-19,151],[83,197],[-47,57],[-268,-201],[-145,87],[-192,-26],[-134,101],[-142,5],[-17,348],[-113,192],[-28,239],[-66,50],[-76,232],[-176,68],[-127,259],[-53,-36],[21,453],[-98,-20],[-62,-142],[-120,6],[-31,360],[-115,298],[-108,98],[-160,-135],[-137,85],[-131,-18],[-23,-912],[-73,-32],[-111,-248],[-196,-194],[-162,-365],[-114,-9],[-87,117],[6,-178],[-89,27],[-96,-142],[-69,16],[127,337],[-2,139],[-90,138],[-23,323],[50,265],[-523,260],[-188,64],[-170,-42],[-284,119],[-82,213],[-143,67],[-60,135],[-192,19],[-37,146]],[[38748,86733],[132,126],[696,121],[137,179],[344,195],[213,39],[294,215],[70,227],[214,254],[75,174],[57,447],[81,298],[113,45],[224,-87],[94,-176],[177,-9],[113,53],[231,208],[175,39],[337,16],[169,-80],[243,-330],[164,-479],[-2,-211],[-81,-240],[58,-389],[179,-248],[284,-20],[217,-129],[133,0],[67,126],[50,341],[106,175],[76,23],[321,-140],[207,0],[234,55],[277,-78],[236,-208],[376,107],[248,133],[286,383],[263,23],[156,-234],[97,-76],[183,30],[156,174],[65,199],[40,495],[189,335],[515,16],[66,87],[-5,222],[225,240],[99,23],[203,-98],[172,151],[101,238],[263,199],[138,415],[118,204],[135,92],[150,-7],[221,-190],[77,-481],[115,-60],[197,351],[179,0],[297,109],[68,-217],[75,-51],[301,106],[141,-37],[195,-156],[52,-94],[-55,-565],[69,-241],[114,-153],[130,-67],[126,-181],[178,-336],[191,-124],[341,0],[291,-35],[381,-119],[124,-96],[98,270],[146,255],[86,38],[620,-462]],[[54460,88080],[-177,-151],[-13,-282],[-73,-213],[68,-397],[-136,24],[-154,-381],[-73,87],[74,-258],[-194,-122],[0,-208],[-83,-124],[-116,178],[-115,-187],[-23,-429],[-146,-236],[-279,-36],[-52,-220],[10,-227],[88,14],[-107,-179],[96,-325],[-15,-234],[35,-233],[214,25],[6,-310],[37,-180],[-164,-39],[-44,-195],[81,-39],[74,-318],[133,13],[91,-135],[83,-321],[-109,-47],[3,-379],[69,-188],[-49,-176],[-126,43],[-55,-73],[87,-158],[201,-34],[97,-371],[-240,-475],[75,-205],[-119,-184],[-75,115],[-152,-78],[-34,-115],[-111,78],[84,-165],[303,32],[84,-201],[183,20],[106,-158],[-47,-55],[-7,-481],[47,-208],[94,-115],[-10,-190],[150,-18],[22,-163],[-69,-126],[95,-428],[-121,-408],[79,-231],[206,-358],[-91,-270],[80,-197],[285,133],[124,-92],[332,248],[32,146],[83,5],[-143,-364],[12,-129],[-74,-160],[-116,-105],[15,-92],[-115,-34],[-88,-172],[3,-151],[-65,-367],[-149,-133],[-85,-158],[-315,-128],[-159,-188],[-105,145],[-78,-46],[64,-170],[73,-405],[168,-316],[-38,-347],[79,-132],[-24,-351],[161,-284]],[[54113,72828],[0,-135],[-77,-162],[-28,-248],[-190,-289],[-50,-196],[33,-294],[94,-254],[-13,-293],[119,-680],[-114,-337],[-4,-193],[55,-327],[155,-64],[109,-440],[8,-385],[-60,-257],[63,-336],[-68,-232]],[[54145,67706],[-155,-149],[-163,10],[-173,93],[-309,-18],[-22,172],[-281,142],[-16,298],[-69,50],[0,170],[-259,513],[-1,121],[-177,401],[-3,481],[-170,403],[-8,254],[-104,580],[-133,55],[32,263],[-52,104],[-102,625],[19,158],[-227,596],[-70,6],[-111,324],[-29,327],[121,261],[-135,87],[-158,279],[-187,140],[-133,-70],[-43,130],[-200,-37],[-66,222],[-175,-45],[-47,-243],[-89,-18],[-76,-230],[29,-174],[-313,35]],[[35187,77471],[-182,108],[-97,-7],[-59,131],[101,266],[-40,208],[-127,-18],[-38,140],[-118,16],[-110,101],[54,311],[-119,23],[-417,-12],[-284,-100],[-174,68],[-216,-46],[-240,30],[-403,449],[-73,-13]],[[32645,79126],[43,284],[106,149],[-55,556],[200,-7],[18,140],[82,0],[67,-133],[146,94],[157,-108],[124,37],[22,-483],[52,-103],[228,-156],[237,-53],[201,241],[175,-60],[276,726],[-132,392],[405,114],[245,10],[252,-44],[313,60],[-110,217],[-88,12],[-72,174],[26,369],[-14,268],[155,13],[60,-84],[16,-218],[127,-85],[160,193],[222,-67],[134,73],[166,-4],[11,591],[71,215],[69,358],[-9,227],[85,48],[-143,212],[-317,195],[71,188],[-52,14],[-2,231],[50,106],[-41,325],[226,-30],[278,-211],[259,-85],[83,117],[79,-31],[151,112],[-84,75],[89,85],[-139,121],[63,145],[165,-16],[145,68],[-14,-252],[65,-231],[74,-103],[114,23],[299,-163],[205,-48],[120,-211],[108,-330],[-88,-77],[-163,-339],[13,-188],[-114,-81],[-205,-334],[-48,-433],[75,-137],[-27,-358],[-114,-561],[-356,-332],[-153,-32],[-526,46],[52,-445],[45,-696],[-83,-39],[50,-224],[136,-5],[53,-634],[1239,242],[608,-169],[137,-525],[195,-392],[247,-302],[267,-20],[62,-188],[287,34],[68,-103],[184,62],[31,522],[60,298],[97,249],[91,60],[349,41],[187,92],[143,360],[285,268],[195,68],[86,108],[128,-32],[168,151],[60,-46],[11,218],[-165,154],[-61,198],[135,102],[54,173],[124,-4],[-1,234],[115,55],[272,-305],[65,76],[131,-191],[249,188],[70,-16],[187,154],[89,132],[-38,177],[297,215],[144,-32],[-21,78],[169,225],[-258,469],[42,51],[-113,497],[129,254],[114,133],[-20,185]],[[32825,83027],[117,275],[108,137],[12,117],[-117,119],[-60,-51],[-88,202],[-40,-27],[-278,219],[-179,-109],[17,167],[220,595],[62,87],[269,-226],[86,-149],[134,-71],[114,22],[193,-412],[113,-22],[275,118],[121,280],[177,101],[-2,146],[200,158],[-50,245],[49,30]],[[34278,84978],[33,-183],[150,-89],[276,25],[18,-309],[82,6],[8,-290],[-78,-321],[-87,-14],[-38,-195],[70,-606],[-363,-23],[-120,-101],[-305,48],[-318,-193],[-266,-82],[-307,-206],[-162,355],[-46,227]],[[31296,80754],[72,342],[16,304],[68,99],[-41,105]],[[31411,81604],[112,-5],[145,142],[230,35],[79,224],[163,89],[150,189]],[[32290,82278],[97,-129],[277,140],[49,-133],[188,-275],[80,-318],[59,-81],[-1,-174],[-67,-142],[-33,-244],[-64,-147],[-204,-83],[-238,81],[-152,-159],[-132,-7],[-581,145],[-272,2]],[[19960,68893],[-57,-16]],[[19903,68877],[-109,61],[-110,-36],[-145,110],[-24,156],[512,414],[72,229],[149,1],[19,366],[78,146],[34,200],[288,366],[301,323],[76,170],[291,208],[95,291],[112,106],[145,7],[65,153],[17,199],[104,67],[166,220],[-169,295],[-25,193],[100,258],[-22,294],[40,156],[-248,828],[138,204],[130,69],[198,-37],[138,55],[106,-64],[79,234],[160,-39],[107,62],[170,-32],[150,252],[105,7],[64,321],[111,286],[-57,282],[-86,43],[0,170],[369,93],[176,99],[249,-80],[239,366],[-71,44],[27,151],[100,67],[56,185],[-118,122],[-140,43],[58,213],[-67,449],[-138,142],[-195,-21],[-25,282],[-284,37],[-55,123],[-145,-15],[-115,-239],[-223,-195],[-286,3],[-190,-174],[-80,45],[-119,-82],[-275,-14],[-33,46],[-213,-105],[-193,39],[-178,-133],[-141,0],[-61,89],[-308,92],[-133,-37],[-29,-107],[-214,-170],[-109,-18],[-18,238],[90,213],[38,245],[-26,293],[263,323],[-13,83],[198,32],[177,183],[-54,477],[130,57],[52,281],[-91,67],[127,89],[405,-27],[85,481],[-25,680],[-29,165],[340,64],[69,-64],[188,190],[88,447],[246,92],[167,-64],[133,80],[143,210],[-88,138],[79,245],[-17,245],[-188,-23],[25,231],[-97,87],[-45,149],[47,239],[-5,290],[-56,234],[74,149],[257,222],[351,181],[168,23],[62,-139],[199,-110],[16,-72],[172,33],[143,-142],[201,0],[242,-140],[78,-197],[109,46],[260,274],[192,-25],[254,37],[100,76],[255,329],[223,-71],[320,-286],[171,-277],[198,-46],[370,89],[330,128],[26,-105],[-251,-167],[-136,-504],[-158,-453],[37,-250],[-21,-227],[-118,-559],[-55,-142],[215,-71],[267,-153],[85,-159],[223,-27],[425,234],[142,-35],[146,-249],[17,-268],[134,-104],[2,-274],[190,176],[359,146],[267,363],[213,-72],[165,136],[71,132],[198,-40],[320,93]],[[30210,81984],[-11,-371],[138,-89],[176,-34],[18,-129],[294,-359],[85,-58],[-20,-146],[406,-44]],[[31296,80754],[184,-85],[104,-446],[159,16],[68,-316],[343,-131],[-22,-213],[59,-222],[-100,-202],[478,-64],[76,35]],[[54145,67706],[100,-483],[-50,-225],[72,-164],[244,82],[37,-41],[173,160],[75,133],[146,27],[77,-753],[94,-30],[182,131],[66,110]],[[55361,66653],[288,364],[295,-600],[-16,-646]],[[55928,65771],[-334,295]],[[55594,66066],[-53,229],[-105,78],[-138,-87],[-109,83],[-215,61],[-27,-139],[-145,9],[-104,-110],[-3,-120],[-111,-20],[-249,-199],[-251,-484],[52,-281],[-117,-284],[-222,-308],[-157,-134],[29,-447],[218,-78],[67,59]],[[53954,63894],[590,209]],[[54544,64103],[245,-101],[68,-183],[162,-154],[279,-373],[148,-46],[139,-314],[250,-325],[77,-179],[104,-73],[98,-217],[127,25],[141,-129],[-4,-455],[-98,-379],[-183,-173],[-127,-16],[-256,-179],[-212,-51]],[[55502,60781],[-121,40]],[[55381,60821],[19,611],[-905,378],[-37,-696]],[[54458,61114],[-7,-211],[-273,2],[-71,53],[-312,69],[-238,-119],[-56,112],[41,128]],[[53542,61148],[-22,685],[-338,107],[-733,-1479],[-348,508],[-110,-39]],[[51991,60930],[-199,-43],[-228,25],[-136,-185],[-149,40],[-91,125],[-276,9],[-225,-191],[-151,-325],[-98,-62],[-137,273],[-200,32],[-225,-557],[97,-236],[130,-130]],[[50103,59705],[3,-149],[-269,-41],[-305,-108],[-345,231],[-116,-151],[-168,-66],[-270,-179],[-156,-204],[-107,-62],[20,-240],[304,-641],[-173,-287],[-71,-27],[-231,-275],[-109,-195],[-79,-30],[-271,-614],[-247,-797],[-82,101],[-24,167],[47,470],[-159,34],[-145,146],[-124,-137],[-141,-453],[-105,-110],[-181,-76],[-3,-231],[-57,-147],[84,-300],[15,-366],[-47,-255],[-78,-75],[32,-190],[-34,-163],[-188,-80],[32,-215],[-59,-182],[-133,-208],[-99,-50],[-73,-362],[121,-232],[-21,-108],[103,-203],[286,-818],[-13,-245],[-198,-202],[27,-277],[-154,-234]],[[60326,68799],[71,-16],[57,-218],[14,-291],[49,-82],[-154,-83],[-128,-155],[-88,-248],[69,-169],[-68,-204],[32,-69],[-90,-300],[-198,-222],[-31,-229],[-256,-53],[-1,-179],[-143,-171],[-171,-367],[-11,-181],[-167,-121],[-570,84],[-89,-151],[-167,-59],[-100,27],[-117,-229],[-203,-117],[-75,35],[-70,-117],[-156,-53],[-105,85],[53,208],[-48,300],[-408,37],[-100,-107],[-302,-19],[-115,-78]],[[56540,65287],[-612,484]],[[54113,72828],[140,-320],[-48,-119],[75,-248],[-14,-163],[100,-329],[162,77],[167,-59],[89,71],[117,-85],[32,-162],[114,-108],[81,37],[104,-234],[203,-9],[68,-136],[225,-107],[134,124],[164,71],[97,-23],[188,178],[49,177],[326,-25],[87,-53],[26,201],[86,-61],[62,112],[148,-81],[151,15],[26,73],[151,-167],[488,-90],[-7,-318],[123,71],[139,-34],[78,-129],[-22,-240],[77,-115],[170,160],[159,-265],[54,-341],[226,-631],[-91,-274],[49,-53],[305,-48],[58,-110],[210,98],[190,-29],[16,-477],[291,-52],[207,153],[183,48]],[[67206,69253],[-182,162],[27,55],[-333,257],[-186,-49],[-82,-151],[-182,37],[-6,186],[-88,751],[158,-46],[81,619],[126,77],[-59,182],[-128,52],[-288,-53],[-256,83]],[[65808,71415],[-2216,-495],[-248,60],[-183,126],[-293,410]],[[62868,71516],[-266,886]],[[62602,72402],[19,160],[123,106],[9,101],[525,222],[138,-55],[129,-160],[137,2],[1,78],[152,112],[20,-199],[68,-117],[120,-46],[201,90],[77,111],[-6,189],[524,117],[241,132],[7,-114],[606,298],[42,176],[139,234],[-79,139],[138,140],[19,321],[-142,-92],[-17,209],[-152,199],[190,142],[148,37],[-4,84],[187,506],[403,138],[211,572],[-170,363],[-4,251],[44,259],[-132,101],[24,367],[-51,236],[-107,91],[-138,-23],[-94,330],[-124,545],[-161,175]],[[65863,78929],[51,125],[198,147],[56,229],[165,-75],[69,307],[64,78],[83,325],[-42,215],[87,309],[118,78],[147,-55],[39,131],[37,444],[-50,87],[9,255],[83,-21],[112,247],[89,-46],[340,124],[73,231],[128,-224],[126,149],[94,-158],[6,231],[101,-62],[104,195],[121,-80],[129,30],[-41,112],[126,41],[-177,103],[-122,211],[-477,220],[-34,128],[91,87],[3,225],[-123,101],[-336,187],[-13,323],[-115,60],[176,279],[13,131],[117,27],[62,-87],[350,154],[149,218],[168,-308],[79,23],[39,-126],[155,243],[40,-82],[135,94],[87,-19],[159,131],[62,-144],[124,-461],[163,74],[334,22],[67,-231],[195,85],[-17,107],[289,101],[107,-64],[103,106],[151,11],[111,137],[91,332],[-43,154],[115,195],[51,-129],[84,90],[-63,-232],[100,-176],[160,131],[44,-289],[144,75],[204,-190],[241,14],[-70,-123],[53,-319],[95,-50],[113,229],[137,34],[176,-59],[-7,-104],[276,-43],[51,-204],[361,-55],[80,99],[249,128],[62,174],[126,-39],[20,-110],[237,-130],[358,428],[99,213],[9,314],[-76,174],[-143,-154],[-66,223],[52,194],[130,2],[35,158],[-113,32],[-179,244],[-15,-154],[-73,-12],[-172,-261],[-240,-23],[-201,83],[-59,186],[144,66],[110,-142],[-19,185],[68,23],[53,188],[-59,108],[226,98],[82,81],[111,-16],[31,109],[99,-32],[126,-172],[-17,259],[155,188],[211,-146],[19,61],[189,-34],[3,-213],[112,-215],[287,-18],[-17,-159],[-115,-41],[-102,-188],[56,-18],[-117,-201],[-105,-3],[17,-160],[378,-151],[37,181],[224,-179],[141,-34],[-30,-250],[-125,-112],[112,-103],[-113,-248],[187,99],[104,-23],[99,-206],[59,11],[78,-275],[115,-62],[126,339],[-31,174],[71,58],[47,313],[79,-6],[72,164],[186,-7],[79,225],[153,209],[87,43]],[[76716,85182],[1566,2048]],[[78282,87230],[1141,-376],[68,-1782],[-15,-256]],[[79476,84816],[106,-321],[312,-397],[159,-386],[179,-605],[90,-64],[112,55],[62,307],[79,-12],[142,-399],[167,-188],[428,-66],[222,-85],[102,-242],[-304,-507],[-14,-231],[98,-415],[50,-760],[-9,-199],[74,-10],[146,-343],[205,-160],[74,-122],[-10,-479],[-63,-176],[-181,-309],[-277,-163],[-335,-14],[-178,-105],[-50,55],[-395,-674],[-158,-368],[-198,-1086],[-95,-309],[-156,-285],[-276,-295],[-246,-369],[-113,-570],[-138,-252],[-217,-202],[-81,-144],[-3,-323],[-35,-197],[-207,-868],[-322,-809],[-64,-236],[-49,-444],[-196,-593],[-101,-814],[12,-155],[126,-775],[164,-474],[170,-391],[121,-578],[165,-1338],[-12,-298],[-112,-503],[-521,-658],[-239,-199],[-112,-135],[-58,-218],[83,-454]],[[72592,56990],[58,277],[-28,103],[66,142],[-78,401],[-209,168],[-86,274],[10,463],[175,92],[23,71],[-55,406],[65,284],[8,302],[-64,174],[64,222],[-26,216],[100,171],[-42,252],[-115,310],[2,368],[-142,355],[-1,92],[-136,83],[-174,350],[-168,-5],[-138,136],[-150,-30],[-465,-438],[-115,135],[-155,-105],[-177,156],[-88,13],[-399,431],[338,390],[170,96],[165,23],[299,401],[63,265],[147,419],[-68,591],[48,266],[-103,334],[71,589],[-12,326]],[[71270,66559],[20,334],[-931,248],[-253,146],[-447,44],[-174,-78],[-200,75]],[[69285,67328],[-100,-41],[-489,-91],[-118,24],[-275,360],[-93,174],[-403,649],[-575,897],[-26,-47]],[[74666,72890],[157,-220],[302,-55],[404,-458],[210,122],[237,52],[272,422],[223,23],[178,165],[106,18],[312,456],[205,174],[138,263],[134,172],[122,342],[128,164],[64,225],[-25,124],[66,400],[-8,129],[152,183],[-76,332],[126,277],[32,392],[51,144],[18,834]],[[78194,77570],[-11,330],[-78,359],[43,301],[-44,61],[135,239],[-45,32],[43,573],[89,357]],[[78326,79822],[742,266],[59,-81],[-49,-160],[99,-94],[120,32],[51,135]],[[79348,79920],[393,353],[214,275]],[[79955,80548],[153,92],[144,-10],[187,129],[-340,339],[-25,199],[417,293],[237,266]],[[80728,81856],[262,133],[-1,206],[-201,176],[-206,74],[-316,330],[-24,110],[-155,-42],[-107,181],[-163,64],[-321,-11],[-89,98],[-255,-86],[16,192],[-100,89],[-222,-50],[-147,-294],[29,-226],[84,-126],[-106,-25],[-55,-110],[-101,18],[-236,-126],[-226,-259],[-139,-52],[-247,-170],[-240,-12],[-149,-176],[-227,-115],[-21,-82],[-191,142],[-181,21],[-53,-238],[54,-402],[-107,-160],[63,-179],[-67,-208],[-90,-119],[-208,-98],[-76,15],[-85,-137],[-157,-82],[-207,9],[-70,174],[-138,92],[-257,52],[-98,-41],[-207,-215],[-82,59],[-152,-119],[-250,-85],[-145,99],[-202,-172],[-362,-123],[-698,281],[-51,-87],[-106,98],[-139,-119],[-73,110],[-246,-87],[-266,-179],[4,-366],[-214,-14],[-81,-132],[51,-250],[-34,-153],[43,-140],[-182,-246],[-3,-153],[-109,-147],[-194,-22],[-172,45],[66,-181],[24,-247],[259,119],[-190,-394],[153,-259],[16,-142],[335,186],[73,-37],[189,-499],[-156,-202],[-325,-247],[57,-445],[79,-259],[-40,-256],[189,-456],[-166,-403],[-196,-206],[-42,-174],[236,-271],[356,-247],[240,-21],[64,41],[206,-132],[145,101],[96,146],[146,73],[127,-160],[-70,-75],[170,27],[97,-218],[84,-22],[107,-154],[163,112],[99,-66],[-36,-113],[155,-185],[84,-192],[113,-65],[184,127],[248,-3]],[[77606,84346],[-181,298],[-329,176],[-93,81]],[[77003,84901],[29,-191],[-43,-160],[117,-94],[-15,-78],[282,-98],[-35,-168],[268,234]],[[74973,85423],[28,-179],[-80,60],[52,119]],[[54460,88080],[124,-50],[145,38],[372,236],[234,17],[245,254],[203,-23],[178,179],[-129,318],[-162,-122],[-316,-52],[-47,183],[-98,12],[19,203],[-93,225],[-9,243],[253,62],[215,338],[29,211],[89,-73],[113,66],[136,-22],[186,125],[117,16],[-20,303],[167,-23],[-47,75],[67,166],[-7,263],[116,27],[109,-130],[288,-44],[-4,-226],[98,41],[95,-69],[221,-46],[119,-373],[144,25],[76,-305],[-140,-48],[-8,-215],[-101,-190],[30,-94]],[[57467,89601],[-130,-98],[-13,-154],[-239,-103],[-223,-232],[37,-180],[-63,-25],[75,-230],[-61,-123],[230,-33],[21,-164],[-101,-67],[158,-298],[47,-336],[83,-181],[112,27],[171,417],[90,564],[175,119],[21,96],[-68,259],[13,215],[116,220],[255,192],[16,406]],[[58189,89892],[190,321],[1,254],[-117,362],[-78,694],[17,186],[107,91],[116,334],[146,-169],[23,-217],[-45,-97],[-151,-32],[-53,-94],[55,-114],[159,0],[235,160],[131,447],[-23,160],[-115,183],[-302,294],[-58,268]],[[58427,92923],[76,135],[65,259],[139,-99],[123,62],[61,132],[-61,388],[13,201],[385,142],[209,-164],[95,-147],[152,-103]],[[59684,93729],[157,-50]],[[59841,93679],[-51,-344],[31,-138],[160,-140],[49,-215],[-30,-174],[78,-323],[91,-101],[71,-256],[242,-119],[201,-236],[107,103],[142,-144],[126,94],[192,-71],[190,48],[19,-147],[306,167],[239,342],[169,-62],[213,300],[58,485],[367,-29],[-9,-596],[476,-263],[25,-305],[-160,-527],[-151,-92],[-36,-228],[63,-60],[-69,-115],[54,-82],[-198,-168],[-62,-503],[20,-103],[-317,102],[35,253],[-348,304],[-89,12],[-187,144],[-120,-62],[-223,243],[-14,-431],[-120,-32],[-19,-194],[55,-35],[42,-231],[106,-119],[-67,-167],[56,-200],[304,23],[124,-39],[848,-424],[-108,-125],[112,-47],[-32,-213],[74,-34],[-15,-135],[207,-73],[123,149],[160,-90],[23,124],[174,-135],[11,-266],[121,23],[-9,-128],[151,20],[0,-139],[-200,-32],[-69,-131],[-206,11],[-28,-73],[133,-621],[150,-275],[-4,-212],[178,-67],[281,-25],[264,-67],[143,-128],[72,124],[60,-74],[228,-103],[49,-77],[-82,-220],[47,-85],[-1,-607],[-82,-211],[-12,-582],[84,-25],[19,-135],[-269,-156],[-12,-225],[-86,-112],[80,-53],[-19,-162],[154,-41],[22,-234],[87,-53],[-1,-142],[107,-288],[69,-41],[118,-252],[-136,-188],[91,-259],[90,-103],[160,-11],[77,-74],[245,32],[-43,-179],[-93,-18],[-210,85],[-79,-78],[-63,121],[-39,-219],[129,-85],[-73,-229],[75,-204],[-46,-282],[-171,-350],[-23,-142],[352,-133],[162,-159],[37,-112],[316,-371],[-59,-325],[68,-169]],[[62868,71516],[-318,94],[-1162,-518],[-577,-408]],[[60811,70684],[-100,-126],[-133,85],[-29,-190],[-189,-92],[-190,-470],[-72,-70],[-38,-284],[35,-239],[182,-208],[49,-291]],[[32290,82278],[56,229],[113,128],[35,277],[87,-5],[244,120]],[[34278,84978],[-39,335],[-221,304],[-29,252],[125,-316],[291,115],[47,-94],[111,7],[-2,165],[166,391],[-78,259],[-74,-16],[-115,124],[-207,-287],[-163,-2],[-93,387],[23,154],[190,236],[251,64],[273,396],[109,48],[238,294],[172,142]],[[35253,87936],[203,-353],[-69,-232],[-56,23],[-78,-407],[207,50],[329,-78],[156,-75],[-16,-218],[-72,-240],[130,-214],[24,-391],[109,-5],[250,532],[70,192],[185,243],[62,-35],[41,497],[-82,184],[-13,249],[256,140],[103,-27]],[[36992,87771],[191,-261],[125,-326],[81,-96],[206,-92],[144,-433],[250,-144],[367,-4],[392,318]],[[30210,81984],[74,76],[196,-25],[140,-232],[233,-110],[302,16],[256,-105]],[[80728,81856],[-286,-14],[-262,-130],[3,73],[-478,-83],[-56,218],[-107,2],[-118,-220],[-5,-109],[367,-287],[-174,-163],[348,-87],[-31,-251],[92,-101],[-120,-120],[54,-36]],[[79348,79920],[-98,128],[-187,424],[196,83],[40,-99],[120,57],[110,-48],[31,-130],[192,96],[-33,275],[105,108],[-292,71],[-105,71],[-105,240],[13,159],[-137,52],[-33,96],[-178,90],[-34,-284],[-169,-69],[-138,-137],[76,-314],[-92,-40],[222,-160],[-216,-201],[-147,-42],[-124,-151],[33,-236],[-72,-137]],[[78194,77570],[-345,135],[-178,-146],[-297,-14],[-464,476],[-150,-20],[-179,490],[16,190],[-187,-133],[-59,78],[-165,-34],[-230,302],[-27,137],[-154,102],[-78,-122],[-226,124],[-3,265],[-68,51],[-120,-129],[-274,49],[-188,-96],[183,-227],[25,-236],[-57,-55],[76,-397],[109,-263],[-300,-165],[-173,-135],[58,-341],[-159,-58],[-122,-137],[-102,-479],[-386,-275],[-39,-211],[89,5],[76,-224],[-29,-149],[59,-168],[-75,-162],[44,-184],[-93,-286],[16,-266],[80,-71],[54,-196],[89,-94],[200,-617],[30,-353],[195,-641]],[[11109,53902],[98,1854],[-146,504],[-367,806],[-119,181],[-67,325],[265,238],[325,459],[57,194],[181,314],[50,151],[194,346],[338,481],[182,-385],[301,223],[416,135],[349,204],[225,73],[207,137],[513,488],[289,-76],[195,46],[343,312],[146,206],[75,183],[210,701],[115,243],[430,424],[189,103],[226,5],[327,508],[179,199],[-182,81],[-57,190],[-174,43],[-51,151],[-153,209],[41,103],[139,50],[168,454],[-98,73],[243,273],[37,100],[141,46],[83,113],[119,-105],[170,41],[95,91],[63,321],[-108,249],[-31,207],[174,78],[102,204],[281,275],[223,36],[78,115],[244,121],[172,147],[204,107],[37,193],[142,4],[116,229],[97,78],[84,213],[56,-2],[188,192],[44,188],[163,76],[218,449]],[[18719,32063],[350,1580]],[[54107,44424],[172,-37],[83,-207],[-29,-68],[-8,-436],[-34,-77],[45,-351],[-10,-570],[-143,-541],[-127,-183],[49,-215],[-90,-509],[87,-250],[-3,-171],[152,-291],[61,-236],[21,-247],[65,-53],[22,-422],[98,-364],[134,-161],[97,24],[127,-177],[280,-167],[154,105],[187,-339],[93,-43]],[[53542,34837],[-88,-78],[-123,121],[-181,-50],[-220,-213],[-131,-291],[-183,-229],[-103,-222],[-217,-218],[-54,-108],[-328,-94],[-72,124],[-84,-124],[-128,-428],[-204,-268],[127,-174],[96,-9],[155,-122],[83,87],[130,-247],[32,-197],[-70,-146],[13,-129],[93,-123],[-81,-111],[-52,-322],[-136,-106],[-92,32],[-147,-218],[-173,-185],[-97,-183],[-205,156],[-213,-111],[-82,-171],[96,-183],[11,-250],[-125,-142],[63,-135],[-66,-41],[-152,61],[-75,-84],[0,-190],[-191,-55],[-116,47],[-252,-290],[-50,-213],[67,-179],[-55,-131],[-170,-179],[5,-171],[-85,-128],[13,-181],[-284,-358],[-95,60],[-174,-108],[-170,-176],[-85,14],[-297,-81],[-101,33],[-195,210],[-232,27],[-225,-318],[-156,-144],[-44,-248],[-109,-281],[-157,-67],[-207,-392],[-243,-226],[5,-216],[-119,-71],[20,-142],[136,-173],[270,-67],[36,-142],[190,-7],[66,-516],[56,-116],[103,-9],[88,-310],[199,-153],[121,-9],[100,-701],[174,-413],[1,-334],[38,-227],[92,-75],[176,-337],[-3,-266],[-155,-158],[-27,-204],[-128,-185],[-34,-394],[71,-151],[47,-303],[-103,-323],[-132,-197],[-117,-68],[-70,75],[-221,-71],[-248,-268],[-12,-589],[-146,-293],[-180,-20],[-231,-189],[-181,-63],[-241,45],[-261,-192],[-186,9],[-108,-101],[-220,9],[-12,-281],[-93,-257],[-9,-385],[-148,-323],[-17,-249],[57,-140],[-10,-167],[90,-326],[81,-437],[79,-145],[-222,-160],[-292,-456],[125,-305],[-141,-272],[49,-167],[-23,-165],[-247,7],[-30,-190],[-126,-294],[-3,-110],[-109,-174],[-260,156],[-418,-160],[-195,73],[-178,-7],[-177,-62],[-145,60],[-167,-73],[-229,52],[-109,-392],[-69,-36],[-121,-279],[-27,-175],[-351,-252],[68,-455],[-125,-287],[49,-174],[-9,-222],[-142,-87],[-55,-520],[193,-458],[-88,-305],[-149,-44],[-61,-146],[-126,204],[-175,-25],[-200,80],[-92,-14],[-97,137],[-285,104],[-206,-184],[-125,-206],[-105,-64],[-131,147],[-39,185],[-105,149],[-219,126],[-170,328],[-405,128],[-65,59],[-40,-242],[-73,-184],[-149,-172],[-32,-219],[-322,-9],[-167,244],[-19,184],[-92,96],[53,642],[-294,327],[-163,4],[-167,99],[-78,184],[-27,203],[-191,422],[-236,130],[-402,-314],[-429,108],[-216,-142],[-361,94],[-148,-21],[-128,198],[5,247],[-55,247],[-76,94],[-186,-4],[-113,-80],[-257,16],[-94,-102],[-96,-363],[106,-660],[-72,-241],[-103,-117],[-85,101],[-140,-23],[-189,172],[-35,122],[-143,-163],[-144,-21],[-132,165],[-60,-236],[-179,-71],[-209,-158],[-155,-231],[71,-534],[-120,-124],[-230,96],[-71,-164],[-209,-37],[-112,-195],[-156,-366],[-167,-230],[-96,-27],[-32,-119],[-124,-48],[-90,-119],[-119,18],[-90,112],[-86,-142],[-2,-142],[-141,-284],[-183,-139],[-155,197],[-208,164],[-115,-39],[-109,198],[4,149],[-127,52],[-143,176],[-269,-210],[-184,-37],[-123,76],[-39,233],[-236,49],[-81,-28],[-164,227],[-87,-64],[-25,-136],[-102,-112],[-174,-683],[-122,-54],[-321,-548],[-76,2],[-102,229],[-192,-153],[-251,98],[-67,-112],[-166,-13],[-55,-266],[-207,-183],[-131,-211],[-54,-255],[65,-343],[-86,-124],[-137,-82],[-150,73],[-97,149],[-97,-18],[-289,396],[50,247],[-146,133],[-87,-2],[-287,-192],[-144,-159],[-16,-176],[-237,-224],[-110,-188],[-202,-39],[-167,52],[-70,108],[-62,396],[-55,87],[45,188],[-204,335],[-112,93],[-81,246],[1,234],[-271,233],[3,447],[-78,188],[-162,98],[-188,335],[-68,407],[-135,357],[63,303],[-33,371],[-48,170],[-270,107],[-115,117],[-184,410],[21,158],[242,170],[43,181],[-164,318],[-77,30],[10,204],[-42,270],[-127,195],[-86,-110],[-107,45],[-232,213],[-101,754],[-217,264],[-101,258],[-80,-32],[-181,532],[-109,481],[-149,-37],[-171,234],[39,424],[-85,94],[-104,-122],[-102,28],[-121,-266],[-253,-444],[-268,-85],[-89,-268],[-168,96],[-162,154],[-68,206],[11,169],[170,662],[236,211],[-69,229],[75,305],[-194,485],[183,362],[88,259],[-44,225],[138,503],[-201,90],[-180,-115],[-133,136],[-162,-37],[-385,73],[-182,115],[-90,172],[-435,-71],[-91,-83],[-184,344],[-130,-55],[-69,68],[-74,527],[-89,309],[51,262],[-9,162],[292,458],[39,241],[111,206],[-120,683],[-75,318],[144,513],[72,58],[72,229],[112,171],[-8,415],[202,99],[144,307],[69,364],[254,176],[76,126],[-13,204],[120,332],[-20,378],[121,284],[-18,204],[-99,287],[-112,112],[-154,-113],[-81,204],[-81,37],[-122,227],[-84,2],[-50,140],[39,156],[-114,281],[-401,417],[-149,-4],[-53,284],[30,117],[-53,183],[-265,6],[-2,166],[-110,380],[-157,275],[-39,242],[27,285],[202,252],[242,32],[315,604],[-5,159],[-89,183],[74,339]],[[5808,28141],[482,-350]],[[6290,27791],[164,-143],[-8,-339],[96,-206],[-152,-236],[-80,-13],[-99,-149],[7,-289],[101,-142],[137,-465],[262,-389],[-14,-152],[139,-192],[274,178],[126,147],[163,403],[100,35],[-55,-257],[25,-112],[125,-51],[207,62],[-93,-235],[73,-62],[19,-282],[-347,-912],[-399,-463],[-238,-89],[-247,-204],[-125,-195],[-322,65],[-364,-403],[-74,-197],[-163,-78],[-186,-401],[-64,14],[-142,-126],[-65,-152],[61,-575],[-297,-384],[-160,-65],[-350,-252],[-162,-320],[-84,27],[-123,-201],[-196,-32],[-121,105],[-485,62],[-162,366],[-357,-126],[-75,46],[-448,62],[-71,-185],[-67,-354],[-59,51],[-156,-215],[-169,185],[-286,120],[-253,-47],[-215,117],[-249,-109],[-12,-237],[-129,-217],[-136,-34],[-108,-110],[-96,34],[-80,-112],[-26,197],[218,243],[-30,359],[100,341],[93,207],[157,495],[31,293],[65,43],[77,-135],[72,410],[80,170],[-86,215],[-133,57],[-68,112],[-408,287],[44,119],[159,146],[-81,197],[114,388],[88,102],[324,-68],[16,121],[-69,183],[125,26],[82,-108],[150,160],[2,149],[130,190],[271,126],[188,248],[279,-334],[152,382],[149,254],[76,41],[136,-217],[86,108],[234,158],[89,-23],[300,-412],[100,151],[60,-49],[336,548],[-66,142],[16,215],[-84,236],[-173,318],[68,106],[-216,284],[20,266],[-49,43],[263,470],[104,-19],[66,266],[-70,117],[38,200],[-15,281],[127,229]],[[6288,29653],[-196,-623]],[[54958,49747],[387,261],[148,-91],[205,77],[196,161],[-80,410],[-93,222],[-116,144],[75,218],[-11,222],[-217,-140],[-149,133],[-9,97],[174,-49],[214,186],[33,254],[-115,245],[97,179],[42,415],[123,467],[308,238],[67,215],[-102,127],[-99,267],[-221,-7],[-156,184],[-86,-105],[-109,6]],[[55464,54083],[-89,259],[77,342],[-106,345],[275,351],[-55,284],[-81,138],[25,96],[-175,201],[-163,66],[135,259],[362,200],[63,165],[43,307],[266,13],[106,-206],[277,168],[95,233],[262,37],[272,204],[80,337],[-85,210],[112,-32],[217,83],[-66,36],[36,307],[-38,186],[8,416],[-24,138],[120,117],[60,224],[-20,129],[136,105],[130,309],[-8,110]],[[57711,60220],[-59,298]],[[57652,60518],[248,156],[324,-154],[133,-160],[21,-215],[-65,-339],[52,-319],[19,-792],[331,13]],[[58715,58708],[94,14],[90,-105],[276,-26],[375,-176],[273,-89],[210,89],[297,44],[87,-184],[84,-497],[-81,-188],[72,-272],[104,-89],[74,-181],[249,126],[100,268],[170,187],[80,-16],[48,177],[171,9],[6,149],[90,-112],[471,357],[169,-421],[203,-113],[92,25],[131,284],[283,223],[77,-133],[151,-119],[126,-21],[67,-206],[-45,-568],[184,-566],[136,83],[103,201],[56,-206],[-38,-873],[120,-266],[39,129],[102,73],[51,295],[213,-50],[225,167],[112,195],[184,30],[130,238],[187,37],[25,126],[113,2],[47,114],[147,71],[230,234]],[[65675,57178],[164,-502],[23,-167],[115,-224],[101,-35],[-12,-116],[99,-498],[12,-400],[-41,-197],[-208,-110],[-306,-349],[-155,-64],[-169,-172],[-209,33],[-265,-514],[-345,-226],[-214,-188],[69,-101],[4,-236],[162,-270],[-37,-449],[-88,-176],[23,-149]],[[59841,93679],[155,114],[269,394],[197,-108],[211,-176],[209,57]],[[60882,93960],[226,92]],[[61108,94052],[107,4],[553,-167],[253,-211],[95,-172],[382,-297],[103,29]],[[62601,93238],[146,122],[164,-69],[155,51],[294,-154],[176,-197],[111,-320],[251,-152],[-204,-350],[130,-135],[146,-48],[116,268]],[[64086,92254],[87,50],[121,-99],[65,46]],[[64359,92251],[226,-89],[200,-234],[170,25],[105,92],[316,122],[110,94],[324,50],[71,117],[248,208],[129,60],[166,163],[127,63],[117,216],[219,84],[204,142],[291,292],[143,96],[212,7],[441,-186],[601,-192],[267,62],[137,-23],[223,-158],[301,-355],[507,-211],[156,160],[213,-76]],[[70583,92780],[58,-187],[222,-353],[118,-37],[141,94]],[[71122,92297],[109,73],[351,-100],[259,-12],[921,172],[3046,-1832],[2224,-3286],[250,-82]],[[67206,69253],[-283,-525],[-357,-855],[-36,-187],[-147,-175],[43,-304],[-89,-406],[42,-125],[109,-53],[39,-142],[-99,-337],[39,-202],[-251,-174],[-120,-286],[6,-133],[89,-75],[365,-184],[-202,-199],[-25,-208],[-88,-56],[8,-213],[-147,-300],[-123,-481],[-17,-290],[-120,-37],[-91,-193],[-394,-307],[-144,92],[-275,-105],[-18,-278],[61,-226],[-234,-172],[46,-121],[125,-8],[213,-185],[20,-392],[93,-68],[57,-248],[229,-229],[81,-305],[118,-215],[87,48],[-15,-140],[-194,-114],[299,-722],[72,85],[168,-302],[312,-149],[-149,-163],[-42,-373],[-50,-64],[-100,-378],[88,-323],[112,-174],[-28,-94],[-325,-55],[-110,-156],[-179,-94]],[[57652,60518],[-627,-506],[-515,13],[-502,-162],[-693,373],[66,585]],[[50103,59705],[131,66],[218,-2],[193,254],[164,28],[39,-106],[221,21],[205,-131],[427,87],[135,-89],[-12,-85],[89,-240]],[[51913,59508],[-107,-628]],[[51806,58880],[83,-176],[-244,-273],[-153,-286],[-77,-314],[289,-195],[189,-254],[280,39],[341,194],[66,-146],[-58,-371],[108,-172],[-51,-288],[-104,-276],[51,-299],[-21,-323],[-102,-193],[-9,-231],[-95,-152],[24,-302],[100,-197],[11,-305],[-80,-213],[-3,-251],[-58,-239],[79,-321],[12,-286],[79,-32],[-14,-220],[-57,-112],[-152,-98],[-84,-172],[98,-270],[110,-94],[171,-349],[80,-62],[45,-217],[205,-213],[103,14],[224,-358]],[[53772,50082],[470,325],[217,-181],[-39,332],[-128,378],[-185,32],[-183,252],[-122,0],[-166,321],[-87,71],[78,275],[-19,155],[-306,174],[80,312],[-4,224],[-135,376],[-47,735],[45,71],[-23,323],[-137,26],[-57,135],[65,233],[120,19],[-2,163],[78,169],[154,-28],[4,-171],[100,-207],[-142,-172],[-74,-222],[-6,-472],[147,411],[63,-101],[169,201],[145,284],[163,39],[152,211],[121,-220],[39,-394],[-30,-172],[253,-151],[185,154],[356,30],[185,59],[195,2]],[[35253,87936],[82,231],[-31,154],[194,229],[409,-83],[7,284],[88,387],[209,-110],[139,-124],[-10,-336],[243,9],[79,-55],[195,208],[256,436],[81,48],[-29,137],[87,133],[214,-80],[257,-156],[173,0],[171,307],[238,99],[-82,-149],[-139,-65],[-86,-176],[-175,-240],[6,-108],[192,-114],[67,-415],[127,-119],[-79,-282],[-56,266],[-113,-101],[-132,-252],[-47,101],[-249,-74],[-236,-213],[-150,64],[-113,133],[-48,-139]],[[57467,89601],[81,-110],[109,50],[70,-126],[171,28],[119,270],[81,21],[28,188],[63,-30]],[[64350,92299],[9,-48]],[[62601,93238],[-53,205],[72,375],[71,190],[132,-9],[92,82],[-83,152],[-185,41],[-1,238],[-157,149],[-79,-43],[-387,105],[73,309],[-63,227],[239,179],[62,211],[182,132],[158,-78],[-56,355],[219,172],[46,-344],[87,-31],[-165,-285],[169,-29],[132,-296],[142,60],[2,-92],[-139,-167],[116,-122],[126,51],[76,123],[271,-169],[66,-360],[103,56],[174,-30],[105,64],[152,-64],[-67,-112],[139,-236],[-34,-113],[-266,-53],[82,154],[-61,105],[-74,-107],[-42,110],[-150,-53],[-23,-151],[153,-80],[-24,-177],[-113,-162],[-20,-202],[225,-43],[158,-220],[131,-264],[59,-463],[-23,-229]],[[60882,93960],[-7,202],[-139,59],[18,231],[-75,141],[-34,274],[-119,259],[-261,-162],[15,-110],[-140,-37],[-149,208],[-144,-112],[-142,124],[35,-257],[175,-149],[58,-332],[-181,-270],[-216,-41],[118,-158],[-10,-101]],[[58427,92923],[7,148],[-191,32],[-92,-274],[-159,-42],[-192,-217],[-161,151],[-131,27],[-22,218],[-55,18],[-319,-130],[-167,-202],[51,-300],[-170,137],[-8,156],[-141,-133],[44,-243],[99,-224],[-35,-224],[-193,-46],[-216,121],[-103,-41],[-342,20],[24,-237],[-96,13],[-56,131],[-103,-44],[-47,241],[-170,-7],[107,-211],[-144,-112],[149,-126],[-171,-28],[-89,175],[-51,277],[75,359],[-35,44],[-181,-206],[-83,103],[-189,-51],[-183,172],[-80,188],[-208,261],[-250,-25],[-149,394],[65,201],[166,42],[101,203],[-55,209],[-133,286],[-126,58],[-44,125],[245,465],[227,159],[197,291],[272,281],[176,-39],[-9,234],[38,151],[-78,3],[-71,368],[137,220],[44,355],[140,97],[163,508],[384,497],[155,-124],[135,140],[156,33],[20,89],[219,-271],[58,223],[82,142],[136,-7],[181,167],[261,149],[201,-199],[18,-124],[320,176],[-64,243],[16,138],[-292,155],[41,600],[94,149],[115,-119],[48,-298],[276,140],[104,-185],[196,196],[275,-86],[107,-131],[-19,-115],[95,-61],[-37,-282],[-104,-80],[-14,-184],[83,-252],[96,-36],[-86,-470],[125,-171],[59,-214],[85,-50],[240,330],[117,87],[-47,73],[164,232],[-110,27],[44,351],[-99,267],[23,372],[64,183],[166,89],[71,-208],[-61,-209],[95,0],[119,-187],[88,0],[198,-124],[63,-222],[-4,-158],[120,-166],[-111,-151],[107,-428],[-10,-98],[111,-159],[112,30],[27,142],[175,188],[161,87],[263,-135],[101,-147],[-40,-82],[241,-229],[37,-239],[-47,-80],[-350,-32],[-75,-222],[-127,-114],[-67,-411],[152,-414],[331,-145],[69,-107],[-97,-224],[-122,-706],[35,-190]],[[60811,70684],[-279,642],[-206,197],[-311,364],[-46,130],[-304,342],[-51,181],[-147,210],[-48,156],[-150,110],[-190,-107],[-318,201],[-632,518],[-148,394],[-59,316],[-108,366],[-128,333],[-259,517],[-99,587],[-54,124],[-123,544],[-141,292],[-101,396],[-14,181],[23,685],[138,109],[67,-354],[95,-298],[108,-30],[200,-445],[33,-242],[115,-474],[97,-252],[8,-245],[62,-207],[173,-329],[47,-220],[153,-211],[24,-181],[353,-712],[352,-372],[111,-29],[88,-131],[204,-21],[78,-121],[204,-35],[257,-222],[196,-93],[134,-120],[51,-139],[241,-195],[174,-89],[146,-305],[231,-96],[213,-181],[414,46],[175,-30],[449,71],[119,-30],[174,222]],[[62602,72402],[80,30],[113,-105],[236,-64],[52,-310],[-135,-121],[105,-216],[221,-41],[137,-213],[267,-85],[161,78],[-77,117],[49,110],[226,-4],[133,-172],[203,-44],[22,-62],[403,101],[67,97],[312,146],[113,87],[147,14],[483,-39],[-107,-135],[-5,-156]],[[65808,71415],[54,-62],[-230,-204],[-328,-183],[-497,-192],[-162,29],[-47,161],[-147,-55],[-42,-119],[-145,71],[-169,-60],[17,-163],[-113,128],[-165,-103],[30,-135],[-52,-272],[-220,-110],[-190,176],[-141,-48],[-176,57],[-38,202],[-496,206],[33,137],[-95,-32],[-338,65],[-80,-101],[-362,128],[-276,-23],[-19,99],[-111,-35],[-148,-238],[-183,-137],[-161,82]],[[62794,71339],[-225,-137],[-43,-270],[118,-53],[40,213],[174,137],[-64,110]],[[62231,71431],[-46,-142],[145,92],[-99,50]],[[5534,29410],[36,456],[91,231]],[[5661,30097],[191,488],[220,319],[100,270],[153,217],[109,276],[242,329],[110,-5],[209,-112],[211,426],[-31,214],[200,527],[24,405],[87,2],[70,160],[176,138],[233,460],[50,190],[270,294],[172,362],[122,174],[384,82],[251,126],[181,0],[235,-250],[210,-34],[436,468],[322,93],[222,120],[180,261],[151,-2],[-1,267],[175,294],[160,11],[121,103],[14,206],[92,207],[165,102],[251,528],[120,63],[283,-98],[243,-284],[412,-32],[149,52],[107,177],[171,76],[186,208],[242,-21],[254,-302],[14,66],[306,-185],[200,-186],[129,71],[164,-94],[87,39],[436,7],[59,-64],[280,-50],[237,-172],[150,-60],[497,-579],[195,2],[149,140],[143,-2],[166,-126],[248,-353],[288,-220],[183,-69],[138,26],[156,-97],[244,-87],[288,-41],[69,-67],[177,-6],[66,-284],[126,-131],[242,-83],[50,-215],[64,-41],[71,-224],[67,54],[213,-29],[92,-71],[86,-211],[112,4],[93,-103],[241,23],[121,-137],[70,-334],[184,-40],[116,-274],[147,-741],[-115,-281],[-42,-218],[-88,-96],[-404,51],[-111,-99],[-182,75],[-218,-20],[-242,-110],[-155,62]],[[19902,32072],[15,-279],[-70,-142],[-162,141],[-103,7],[-217,-85],[-219,19],[-184,174],[-243,156]],[[18719,32063],[-313,-30],[-328,211],[-70,4],[-346,254],[-169,78],[-297,17],[-236,148],[-138,16],[-643,-6],[-275,-33],[-147,-101],[-207,-16],[-264,56],[-292,13],[-321,-96],[-589,-137],[-127,39],[-346,-151],[-194,-46],[-320,-133],[-154,-30],[-110,50],[-370,346],[-165,58],[-490,-314],[-182,-252],[-31,-110],[4,-403],[-105,-284],[-548,-401],[-282,-243],[-234,-137],[-365,-7],[-186,-415],[-129,-67],[-188,-442],[-171,48],[-470,312],[-77,298],[-150,375],[9,232],[-158,153],[-293,-20],[-89,101],[-77,-104],[-446,-181],[-19,-96],[-198,-167],[-274,-435],[-82,-71],[10,-190],[-122,-379],[-207,-457],[-113,-152],[25,-240],[-124,-449],[-85,-199],[-161,-87]],[[6290,27791],[18,-312],[-183,-468],[-129,-132],[-185,-486],[-153,-348],[-116,-131],[-194,-68],[-100,-303],[-45,-650],[30,-218],[-72,-289],[-154,-329],[-228,-658],[-423,-382],[-236,18],[144,115],[98,190],[-30,316],[26,156],[-88,222],[42,653],[38,144],[-7,398],[121,319],[132,249],[48,-2],[80,491],[3,258],[-57,163],[68,327],[-11,266]],[[4727,27300],[141,213],[247,573],[169,296],[180,675],[-3,206],[73,147]],[[45431,49388],[256,-170],[109,-32],[168,59],[154,-235],[-40,-42],[56,-224],[-13,-140],[-313,-30],[-116,-105],[-137,-28],[-190,-229],[-464,-369],[-463,-531],[-110,-82],[-107,23],[-53,-159],[-214,-96],[-217,-286],[-31,-121],[-192,-200],[-53,2],[-183,-242],[-133,-39],[-334,9],[-22,140],[-239,16],[-22,125],[161,131],[167,282],[179,101],[350,380],[229,280],[131,240],[170,153],[188,243],[86,175],[121,25],[99,119],[57,236],[148,174],[223,153],[154,156],[188,2],[252,136]],[[25482,47497],[-94,-322],[-158,-56],[-61,-121],[36,-261],[125,-176],[-12,-94],[115,-81],[38,-343],[139,14],[84,151],[-28,-190],[-112,-199],[-157,94],[45,-227],[-144,-126],[-98,-177],[42,-362],[58,-55],[-142,-144],[33,-151],[-24,-603],[64,-100],[24,-374],[65,-181],[18,-790],[-34,-126],[-79,114],[-92,-15],[-76,490],[58,55],[-96,121],[37,218],[-32,387],[81,644],[-101,231],[120,307],[-128,105],[-83,-176],[-86,16],[-25,-145],[-53,216],[108,68],[73,262],[-1,167],[142,284],[213,217],[52,284],[-130,-148],[-20,121],[-211,94],[71,85],[-9,190],[101,151],[-77,101],[-118,21],[201,135],[25,100],[147,42],[14,139],[152,119]],[[37102,48883],[145,-215],[93,-32],[45,-165],[402,-502],[123,-16],[138,-195],[103,-299],[315,-220],[57,6],[430,-233],[246,-334],[70,-237],[94,-63],[82,-486],[68,-101],[198,-73],[115,98],[288,-16],[334,170],[177,-35],[147,-114],[110,-14],[165,-309],[249,-293],[-55,-202],[-192,-197],[-75,-16],[-221,229],[-195,-89],[-208,-229],[-193,-55],[-130,-99],[-161,48],[-113,-64],[-153,92],[-83,149],[-226,176],[-204,48],[-102,151],[-405,223],[-64,107],[26,232],[-35,144],[-130,130],[-242,96],[87,28],[-36,190],[-200,112],[-196,19],[-144,98],[-106,302],[-332,392],[-11,236],[-146,48],[48,120],[-123,-8],[-103,99],[3,465],[98,417],[-78,-23],[113,241],[93,68]],[[8193,45081],[35,-124],[-127,-286],[0,-275],[-125,-89],[-270,-418],[-74,-57],[-294,-401],[-165,-125],[-24,-120],[-110,-119],[-148,-55],[-107,-204],[-98,-23],[-142,-245],[-54,60],[-137,-176],[-66,206],[109,117],[138,261],[47,165],[236,323],[299,329],[146,216],[503,508],[428,532]],[[58090,67551],[127,-71],[187,25],[69,-142],[143,-94],[72,59],[241,-160],[104,-192],[66,-284],[119,-278],[-68,-472],[-179,-52],[-32,148],[-101,117],[-25,323],[-158,69],[-201,184],[-346,153],[124,261],[-142,406]],[[50526,71365],[229,-40],[142,-222],[100,-707],[82,-186],[86,-366],[-17,-209],[-115,-158],[-171,325],[-126,319],[-114,401],[-190,416],[61,166],[-19,233],[52,28]],[[62284,68354],[72,-164],[121,-85],[-58,-300],[83,-247],[-66,-204],[84,-101],[89,-355],[-7,-507],[82,-281],[-24,-179],[83,-199],[274,-197],[95,-191],[-56,-187],[-148,-2],[-138,141],[-201,436],[-257,213],[-43,215],[87,222],[-186,241],[-11,291],[-218,538],[-27,163],[-124,112],[134,378],[286,62],[74,187]],[[71270,66559],[-86,-28],[-242,151],[-110,-9],[-311,190],[-215,32],[-195,149],[-422,9],[-226,58],[-178,217]],[[69285,67328],[44,106],[92,-55],[203,252],[211,2],[161,-83],[282,-22],[73,-119],[77,63],[208,-102],[311,7],[302,-40],[594,-208],[350,53],[197,-30],[275,57],[442,-82],[124,66],[345,-76],[158,19],[33,-73],[-65,-261],[-3,-170],[-88,-92],[-106,12],[-88,-108],[-133,-34],[-336,132],[-209,19],[-156,-144],[-232,-5],[-211,-66],[-139,22],[-143,154],[-100,-90],[-115,5],[-373,122]],[[49911,73044],[-136,506],[-45,284],[-105,371],[-191,1496],[32,353],[103,169],[99,-75],[155,-344],[26,-344],[169,-921],[84,-371],[-12,-146]],[[50090,74022],[78,-234],[35,-291],[-77,-172],[-46,-256],[49,-135],[-44,-190],[-63,-8],[-111,308]],[[59689,78812],[116,-156],[148,-300],[99,-55],[93,-174],[120,-371],[4,-314],[60,-234],[74,-103],[231,-179],[29,-89],[-56,-270],[-99,20],[-77,-256],[-143,55],[-57,371],[-128,380],[-160,364],[-145,76],[-98,295],[-70,44],[-176,417],[21,382],[214,97]],[[55594,66066],[189,142],[14,266],[-59,39],[-220,-30],[-157,170]],[[55361,66653],[-55,151],[-14,345],[88,191],[102,350],[-140,-91],[-170,158],[-18,258],[92,186],[31,231],[-130,498],[-88,164],[69,300],[153,133],[80,-70],[60,158],[191,43],[51,-245],[99,66],[158,-11],[196,-142],[57,-112],[202,-133],[17,-94],[-182,-882],[-57,-500],[33,-105],[-148,-272],[-81,-392],[32,-199],[70,-104],[80,-414],[103,-128],[54,-172],[165,-303],[79,-229]],[[56540,65287],[37,-66],[-5,-326],[92,-329],[17,-188],[-172,-383],[-84,-4],[-231,490],[-726,790],[-135,266],[3,117],[106,114],[152,298]],[[24965,63798],[147,65],[292,270],[158,421],[736,678],[182,67],[464,568],[171,323],[162,146],[284,353],[75,165],[240,332],[233,188],[92,-101],[-28,-135],[-322,-671],[-58,-351],[-101,-160],[-55,-224],[-146,-326],[24,-224],[-267,-662],[-77,-284],[-168,-223],[-82,97],[-62,-369],[-256,-357],[-190,-117],[-133,4],[-226,-213],[-383,-229],[-250,-23],[-117,163],[-73,261],[-431,-16],[-87,220]],[[24713,63434],[-80,138],[185,206],[147,20]],[[26115,64648],[-21,-199],[-127,-369],[-597,-699],[-132,-130],[35,-53],[666,642],[131,258],[155,211],[63,154],[-27,103],[-146,82]],[[60448,18098],[16,111],[204,403],[36,197],[102,174],[159,717],[167,258],[122,301],[269,153],[115,23],[319,193],[151,-232],[169,-163],[154,-43],[151,165],[177,69],[44,613],[-73,312],[35,66],[326,69],[202,140],[114,178],[198,-57],[19,-139],[260,-436],[134,172],[-114,-332],[183,87],[-163,-172],[3,-139],[208,-94],[-172,-5],[-4,-176],[91,-19],[59,145],[40,-195],[-235,-28],[-43,-103],[-168,-110],[-114,19],[-128,-197],[-290,-53],[-346,-215],[-229,-358],[-260,-199],[-111,-243],[-169,-206],[-80,-179],[-188,-270],[-69,-27]],[[61719,18273],[-58,-51],[-228,11],[-138,-61],[-47,-394],[-141,-247],[-163,-209],[-13,-224],[169,-378],[60,-216],[-38,-360],[83,-302],[12,-465],[-28,-227],[46,-94],[160,-91],[100,-140],[46,-268],[67,-172],[-1,-362],[-169,-536],[-253,-382],[-153,2],[-157,-289],[-139,-109],[-33,-402],[-318,-508],[-191,-215],[-114,-65],[-410,-462],[-40,-85],[1,-426],[-120,-156],[-148,-5],[-194,-249],[-165,-348],[-258,-167],[-96,-101],[-130,-332],[188,-232],[-145,-137],[-256,2],[-129,-371],[-31,-396],[87,-78],[51,-303],[-67,-298],[157,-334],[41,-362],[110,-222],[3,-133],[182,-50],[2,-323],[61,-216],[16,-391],[63,-161],[-13,-188],[-166,-164],[-101,96],[-16,-154],[-121,-185],[24,-440],[-47,-153],[-211,-305],[-215,-55],[-231,147],[-92,-10],[-101,-174],[8,-181],[-100,-444],[-12,-293],[183,-399],[194,69],[132,-62],[-145,-147],[1,-206],[113,-261],[-1,-133],[183,-39],[86,-490],[44,-500],[116,108],[68,-100],[-45,-221],[149,-98],[146,160],[7,-164],[113,-58],[93,-139],[-198,98],[-482,71],[-227,-124],[-50,298],[-56,129],[-20,267],[-84,165],[-191,216],[-37,181],[33,226],[-108,62],[-38,357],[-313,438],[-59,181],[-62,577],[-4,248],[-61,156],[133,487],[8,241],[70,165],[87,-83],[145,87],[46,136],[104,75],[34,129],[-15,396],[188,433],[-132,1017],[-9,162],[-88,363],[-130,286],[-102,140],[-366,240],[-141,158],[-226,99],[-298,671],[8,215],[-47,190],[-277,444],[-238,241],[25,140],[101,162],[254,166],[169,-88],[7,85],[-231,151],[85,32],[233,-112],[92,-101],[419,-258],[124,-110],[205,-438],[74,-2],[132,-243],[175,444],[1,103],[146,246],[10,114],[185,169],[170,65],[233,265],[118,186],[288,337],[72,146],[54,328],[78,227],[298,554],[68,231],[152,177],[117,316],[142,469],[159,271],[89,263],[66,67],[87,-73],[113,164],[291,113],[223,247],[42,334],[-83,131],[-53,414],[38,291],[-147,365],[-22,352],[-124,149],[50,204],[-48,122],[-41,323],[-2,309],[71,350],[50,103]],[[66384,11492],[-60,-380],[-137,25],[-10,-192],[82,-16],[52,-138],[-22,-387],[61,-112],[19,-225],[208,-250],[12,-148],[129,-385],[-75,-504],[-145,37],[23,171],[-47,174],[3,387],[-91,234],[-171,220],[-141,103],[-77,135],[-121,-96],[-169,-231],[-56,-222],[-80,-69],[-51,-206],[-263,-248]],[[65257,9169],[-122,-98],[-164,-412],[-119,112],[68,375],[-20,241],[-187,247],[-69,422],[58,410],[74,183],[-80,188],[-17,275],[-279,-32],[-49,199],[-170,62],[-134,144],[-29,156]],[[64018,11641],[53,158],[149,112],[98,-179],[-81,-299],[149,-124],[153,30],[109,169],[-86,243],[13,94],[159,110],[60,151],[-28,566],[90,217],[67,-25],[120,160],[96,-103],[13,-148],[-113,-417],[-128,-284],[-61,-291],[141,-958],[-92,-366],[-56,-394],[222,-328],[79,-174],[133,5],[250,355],[210,474],[114,495],[86,66],[167,-9],[18,201],[-135,111],[38,540],[150,392],[-32,584],[-175,231],[106,376],[124,44],[67,-74],[46,114],[107,23],[107,-219],[153,-42],[259,197],[251,28],[218,359],[206,213]],[[67612,14025],[209,229],[212,71],[112,90],[131,-60],[341,-15],[115,31],[357,5],[180,124],[114,194],[291,259],[150,-217],[43,-190],[-238,-349],[-218,-213],[-17,-84],[-260,-259],[-162,41],[-58,-64],[-141,78],[-511,110],[-218,16],[-387,-516]],[[67657,13306],[-140,-103],[-172,-55],[-72,-153],[-505,-312],[-169,-243]],[[66599,12440],[-70,-171],[-6,-257],[-102,-169],[-37,-351]],[[58715,58708],[13,-263],[-175,-536],[-44,-248],[46,-224],[172,-206],[64,-208],[-50,-317],[77,-144],[-14,-222],[-135,-190],[-125,-7],[-201,-436],[-128,321],[-91,454],[3,398],[93,255],[-186,210],[-183,305],[-19,119],[132,518],[9,215],[195,902],[-57,402],[123,378],[-37,139],[-143,113],[-92,-19],[-251,-197]],[[57711,60220],[-234,-167],[-70,-135],[-229,-193],[-499,-187],[-330,-273],[-342,-66],[-353,105],[-181,275],[-109,80],[-400,5],[-141,121],[-254,18],[-130,60],[5,142],[-162,142],[20,215],[185,163],[246,154],[441,91],[97,119],[-129,144],[-226,51],[-70,-46],[-261,82],[-127,-6]],[[54458,61114],[-133,-23],[-272,82],[-353,23],[-158,-48]],[[53542,61148],[-336,27],[-88,-96],[-100,-314],[-108,-87],[-103,-242],[3,-127],[-402,-299],[21,-264],[74,-99],[-37,-112],[-232,-270],[-284,-224],[-144,-161]],[[51806,58880],[-235,-201],[-143,235],[-26,-112],[-98,37],[37,176],[163,207],[248,229],[161,57]],[[51913,59508],[115,13],[326,207],[54,403],[-121,14],[-204,-97],[-78,35],[-3,236],[61,213],[-72,398]],[[51991,60930],[-55,222],[-94,136],[1,119],[104,116],[108,7],[89,-350],[149,-163],[302,238],[-52,507],[72,89],[-110,174],[-29,223],[71,215],[-175,302],[-26,275],[-122,-9],[-51,167],[-151,76],[-68,181],[-97,14],[86,96],[247,23],[207,-33],[56,-185],[117,-76],[281,-476],[33,-232],[174,1],[192,313],[86,64],[116,230],[325,384],[177,316]],[[53954,63894],[143,177],[75,-53],[161,186],[19,103],[185,318],[119,264],[86,-138],[-76,-68],[-79,-243],[-43,-337]],[[54544,64103],[6,-135],[-83,-191],[3,-276],[-192,-399],[-317,-312],[-179,-426],[118,-123],[192,155],[243,-48],[161,122],[168,23],[150,-46],[221,-245],[37,-87],[176,39],[124,-65],[118,-304],[165,-131],[84,-547],[-157,-126],[-80,-200]],[[55502,60781],[156,-107],[70,34],[184,-147],[569,127],[143,-147],[111,-3],[123,-111],[340,15],[144,87],[204,284],[183,149],[224,69],[99,-59],[52,-172],[154,-51],[57,-91],[138,-37],[64,-250],[-17,-703],[85,-522],[130,-438]],[[20627,55584],[-144,-200],[-63,-181],[-161,-238],[-120,-281],[-303,-360],[-245,-225],[-237,-455],[-359,-275],[-57,4],[-219,-238],[-358,-520],[-253,-442],[-223,-309]],[[17885,51864],[-229,-298],[-105,-14],[-145,85],[-95,153],[-95,-91],[-122,62],[-308,-12],[-93,-114],[-540,-381],[-362,-293],[-75,-117],[-114,3],[-233,-145],[-111,49],[-108,155],[-20,161],[-73,-49],[-62,168],[10,361],[218,221],[289,409],[403,268],[123,156],[71,241],[451,410],[199,424],[167,158],[133,43],[252,364],[267,262],[72,227]],[[17650,54730],[135,409],[51,325],[126,278],[218,169],[177,346],[23,103],[259,355],[85,225],[168,110],[164,206],[125,55],[115,183],[138,-57],[81,421],[114,186],[301,124],[240,208],[19,323],[71,259],[-19,275],[37,311],[256,266],[221,108],[233,50],[201,284],[209,213],[52,-43],[223,197],[21,-46],[192,115],[40,100],[94,-20],[112,258],[254,138],[146,172],[343,64],[66,-163],[205,-119],[289,110],[45,-146],[96,187]],[[23576,61269],[109,14],[150,-215],[113,-230],[148,-480],[-203,-246],[1,-84]],[[23894,60028],[-86,-399],[-155,-227],[-43,-155],[-170,-213],[-312,-294],[-115,-43],[-173,-204],[-186,-140],[-95,-181],[2,-172],[-398,-458]],[[22163,57542],[-162,-169],[-69,-147],[-207,-293],[-280,-227],[-31,-185],[-120,-51]],[[21294,56470],[-431,-396],[-9,-163],[-227,-327]],[[24332,57959],[110,241],[387,240],[659,514],[234,-83],[184,-378],[33,-188],[-352,-600],[-192,-199],[-177,-262],[-123,-36],[-91,69],[-54,-335],[-81,-98]],[[24869,56844],[-96,-106],[-240,-148],[-97,-129],[-231,-5],[-151,55],[-211,307],[-80,188],[10,314],[288,346],[40,110],[231,183]],[[50386,55717],[44,-225],[-53,-85],[-26,-479],[-206,-265],[-115,-74],[-185,-247],[-93,-178],[-31,-181],[-222,-344],[-35,137],[-223,209],[-5,82],[167,548],[448,341],[193,241],[96,304],[110,197],[136,19]],[[79476,84816],[-125,110],[-71,-340],[-150,-174],[-65,-247],[-84,-96],[-225,-124],[-498,-66],[-183,-48],[-174,107],[-92,-7],[-144,133],[-59,282]],[[77003,84901],[-89,240],[-125,-28],[-73,69]],[[76716,85182],[-8,250],[103,172],[-42,130],[-145,131],[-44,-44],[-175,168],[-16,87],[-369,510],[-352,353],[-83,174],[21,121],[-117,184],[-6,199],[60,334],[-53,131],[78,7],[-71,204],[-381,328],[-448,346],[-375,361],[-400,509],[-186,311],[-379,293],[-124,150],[-417,275],[-188,222],[-186,114],[-123,0],[-80,144],[-169,-43],[-41,122],[-187,199],[-42,149],[-112,-32],[-169,157],[-152,-4],[-137,254],[-106,-27],[27,176]],[[71122,92297],[-59,87],[16,183],[-41,259],[267,-20],[363,-184],[92,129],[137,25],[-159,492],[39,294],[-108,254],[-243,343],[-192,147],[-41,190],[-98,85],[-47,243],[45,128],[-158,1095],[-147,82],[-174,177],[-186,289],[-37,139],[-283,-85],[-236,282],[-126,209],[-198,222],[-409,227],[-509,547],[-198,316],[-95,218],[-144,176],[-39,163],[-377,415],[72,286],[108,87],[35,201],[327,-165],[112,49],[115,-136],[113,-249],[388,-442],[145,-119],[280,-159],[86,-150],[278,-291],[93,-149],[95,-312],[138,-169],[270,-55],[117,-67],[318,-282],[240,-167],[248,-334],[338,-144],[204,-166],[103,-187],[76,-16],[2,-546],[114,-462],[153,-353],[354,-502],[196,-195],[46,-105],[311,-217],[203,-291],[518,-477],[258,-55],[182,-209],[386,-341],[162,-30],[397,264],[254,-14],[81,113],[396,16],[330,-133],[228,-369],[99,-67],[136,33],[353,-241],[127,-172],[131,128],[215,-103],[102,142],[100,-34],[257,-232],[126,-325],[169,-236],[43,-148],[-37,-145],[42,-293],[91,-270],[117,-57],[5,-390],[49,-225],[140,-199],[-35,-84],[182,-63],[155,-320],[139,98],[18,-181],[105,120],[-48,-197],[310,-51],[113,87],[111,-13],[179,91],[147,-48],[109,-156],[76,-458],[250,-250],[44,67],[184,34],[68,-169],[239,-113],[22,-155],[148,-188],[140,-66],[364,71],[151,-35],[90,-250],[249,-101],[149,76],[62,-71],[153,50],[156,-146],[180,-385],[74,-282],[167,-89],[267,-483],[52,-287],[-20,-247],[-151,-238],[-508,82],[-70,-41],[-250,110],[-105,-124],[-67,41],[-27,-162],[129,-280],[-222,241],[-99,32],[35,-149],[-81,-204],[-39,186],[11,-326],[-161,-96],[-14,106],[156,350],[-199,-119],[-13,-428],[-23,52],[11,413],[-108,334],[39,-243],[-40,-238],[-34,387],[-138,268],[102,-300],[3,-341],[-98,57],[-119,-172],[100,-153],[-168,66],[-115,-194],[-181,322],[-38,131],[74,225],[121,197],[-125,39],[-161,-175],[-59,-169],[-204,-254],[-140,16],[-175,-282],[-212,-46],[-246,0],[-333,337],[-79,346],[-165,-142]],[[71403,94808],[-161,-115],[16,-116],[267,-69],[12,192],[-134,108]],[[82170,87187],[-150,-44],[-28,-103],[114,-138],[114,7],[82,122],[-2,185],[-130,-29]],[[70583,92780],[-214,10],[-197,-145],[-291,149],[-176,-64],[-138,50],[-171,-38],[-175,57],[-162,348],[-129,46],[-129,-184],[-158,163],[-476,23],[-96,-73],[-151,89],[-269,-62],[-71,99],[-412,-177],[-89,16],[-209,-176],[-104,51],[-141,-220],[-124,-17],[-28,-180],[-230,-207],[-81,41],[-155,-142],[-280,-135],[-136,17],[-176,-262],[-149,78],[-257,-202],[-310,46],[-141,206],[-45,156],[-144,51],[-63,-94],[-220,156]],[[64086,92254],[-102,155],[188,-20],[178,-90]],[[64350,92299],[194,-13],[224,-179],[227,149],[170,-9],[149,172],[172,91],[117,-78],[132,19],[19,102],[377,411],[337,110],[98,263],[334,227],[158,210],[189,433],[-12,69],[-267,440],[-443,224],[-116,150],[-295,286],[-153,64],[-128,130],[-54,147],[27,220],[265,218],[165,34],[128,-94],[165,-21],[389,-279],[165,-188],[169,34],[-14,-112],[165,-185],[49,98],[-83,147],[-238,286],[-22,131],[-193,43],[-166,168],[22,227],[200,4],[233,-325],[100,-60],[301,-305],[298,-146],[25,-94],[192,-83],[752,-616],[235,-76],[124,-192],[122,-64],[100,-382],[106,-149],[-77,-126],[-230,-19],[-93,80],[-33,-135],[154,-48],[270,48],[73,-71],[106,-302],[174,-277],[21,-255],[247,-125],[212,206],[191,36],[80,90],[39,-115],[-111,-163]],[[68007,94798],[78,-208],[-90,-135],[92,-399],[531,-316],[286,-142],[218,156],[-234,231],[-212,346],[-105,21],[-118,210],[-185,-34],[-100,227],[-161,43]],[[47818,69296],[228,-275],[72,-18],[222,-392],[338,-422],[132,-105],[322,-412],[113,-275],[35,-316],[-121,-165],[14,-112],[-91,-161],[-186,80],[-138,191],[-275,222],[-286,369],[-397,678],[-42,165],[-18,394],[91,385],[-89,121],[76,48]]],"transform":{"scale":[0.00004535993181434581,0.00002094918056227289],"translate":[5.95608814594612,45.72234764336404]}};

});

//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Hardcoded map data for the sections of the city of Zurich
 */
namespace('sszvis.mapdata.zurich', function(module) {

  module.exports = {"type":"Topology","objects":{"stadtkreise_geo":{"name":"stadtkreis","type":"GeometryCollection","geometries":[{"type":"Polygon","id":10,"arcs":[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212]]},{"type":"Polygon","id":12,"arcs":[[213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285]]},{"type":"Polygon","id":11,"arcs":[[286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,-285,-284,-283,-282,-281,-280,-279,-278,-277,-276,-275,-274,-273,-272,-271,-270,-269,-268,-267,-266,-265,-264,-263,-262,-261,-260,-259,-258,-257,-256,-255,-254,-253,-252,-251,-250,-249,-248,-247,-246,-245,-244,-243,-242,-241,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,-12,-11,-10,-9,-8,-7,-6,445]]},{"type":"Polygon","id":8,"arcs":[[446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533]]},{"type":"Polygon","id":2,"arcs":[[534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,-467,-466,603]]},{"type":"Polygon","id":3,"arcs":[[-586,-585,-584,-583,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,-587]]},{"type":"Polygon","id":7,"arcs":[[748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774,775,776,777,778,779,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847,848,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,-533,-532,-531,-530,-529,-528,-527,-526,-525,-524,-523,-522,-521,-520,-519,-518,-517,-516,-515,-514,-513,-512,-511,-510,-509,-508,-507,-506,-505,-504,-503,-502,-501,-500,-499,-498,-497,-496,-495,-494,-493,-492,-491,-490,-489,-488,-487,-486,-485,-484,-483,-482,-481,-480,-479,-478,-477,-476,-475,-474,-473,-472,-471,-470,888,889,890,891,892,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,-239,-238,-237,964]]},{"type":"Polygon","id":5,"arcs":[[-123,-122,-121,-120,-119,-118,-117,-116,-115,-114,-113,-112,-111,-110,-109,-108,-107,-106,-105,965,966,967,968,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,995,996,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,-124]]},{"type":"Polygon","id":9,"arcs":[[-721,-720,-719,-718,-717,-716,-715,-714,-713,-712,-711,-710,-709,-708,-707,-706,-705,-704,-703,-702,-701,-700,-699,-698,-697,-696,-695,-694,-693,-692,-691,-690,-689,-688,-687,-686,-685,-684,-683,-682,-681,-680,-679,-678,-677,-676,-675,-674,-673,-672,-671,-670,-669,-668,-667,-666,-665,-664,-663,-662,-661,-660,-659,-658,-657,-656,-655,-654,-653,-652,-651,-650,-649,-648,-647,-646,-645,-644,-643,-642,-641,-640,-639,-638,-637,-636,-635,-634,-633,-632,-631,-630,-629,-628,-627,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,1104,1105,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119,1120,1121,1122,1123,1124,1125,1126,1127,1128,-212,-211,-210,-209,-208,-207,-206,-205,-204,-203,-202,-201,-200,-199,-198,-197,-196,-195,-194,-193,-192,-191,-190,-189,-188,-187,-186,-185,-184,-183,-182,-181,-180,-179,-178,-177,-176,-175,-174,-173,-172,-171,-170,-169,-168,-167,-166,-165,-164,-163,-162,-161,-160,-159,-158,-157,-156,-155,-154,-153,-152,-151,-150,-149,-148,-147,-146,-145,-144,-143,-142,-141,-140,-139,-138,-137,-136,-135,-134,-133,-132,-131,-130,-129,-128,-127,-126,-125,-1035,-1034,-1033,-1032,-1031,-1030,-1029,-1028,-1027,-1026,-1025,-1024,-1023,-1022,-1021,-1020,-1019,-1018,-1017,-1016,1129,1130,1131,1132,1133,1134,1135,1136,1137,1138,1139,1140,1141,1142,1143,1144,1145,1146,1147,1148,1149,1150,1151,1152,1153,1154,1155,1156,1157,-722]]},{"type":"Polygon","id":1,"arcs":[[-911,-910,-909,-908,-907,-906,-905,-904,-903,-902,-901,-900,-899,-898,-897,-896,-895,-894,-893,-892,-891,-890,-889,-469,-468,-603,-602,-601,-600,-599,-598,-597,-596,-595,-594,-593,-592,-591,-590,-589,1158,1159,1160,1161,1162,-967,1163,1164,1165,1166,1167,1168,1169,1170,1171,1172,1173,1174,1175,-912]]},{"type":"Polygon","id":4,"arcs":[[-1014,-1013,-1012,-1011,-1010,-1009,-1008,-1007,-1006,-1005,-1004,-1003,-1002,-1001,-1000,-999,-998,-997,-996,-995,-994,-993,-992,-991,-990,-989,-988,-987,-986,-985,-984,-983,-982,-981,-980,-979,-978,-977,-976,-975,-974,-973,-972,-971,-970,-969,-968,-1163,-1162,-1161,-1160,-1159,-588,-748,-747,-746,-745,-744,-743,-742,-741,-740,-739,-738,-737,-736,-735,-734,-733,-732,-731,-730,-729,-728,-727,-726,-725,-724,-723,-1158,-1157,-1156,-1155,-1154,-1153,-1152,-1151,-1150,-1149,-1148,-1147,-1146,-1145,-1144,-1143,-1142,-1141,-1140,-1139,-1138,-1137,-1136,-1135,-1134,-1133,-1132,-1131,-1130,-1015]]},{"type":"Polygon","id":6,"arcs":[[-964,-963,-962,-961,-960,-959,-958,-957,-956,-955,-954,-953,-952,-951,-950,-949,-948,-947,-946,-945,-944,-943,-942,-941,-940,-939,-938,-937,-936,-935,-934,-933,-932,-931,-930,-929,-928,-927,-926,-925,-924,-923,-922,-921,-920,-919,-918,-917,-916,-915,-914,-913,-1176,-1175,-1174,-1173,-1172,-1171,-1170,-1169,-1168,-1167,-1166,-1165,-1164,-966,-104,-103,-102,-101,-100,-99,-98,-97,-96,-95,-94,-93,-92,-91,-90,-89,-88,-87,-86,-85,-84,-83,-82,-81,-80,-79,-78,-77,-76,-75,-74,-73,-72,-71,-70,-69,-68,-67,-66,-65,-64,-63,-62,-61,-60,-59,-58,-57,-56,-55,-54,-53,-52,-51,-50,-49,-48,-47,-46,-45,-44,-43,-42,-41,-40,-39,-38,-37,-36,-35,-34,-33,-32,-31,-30,-29,-28,-27,-26,-25,-24,-23,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-445,-444,-443,-442,-441,-440,-439,-438,-437,-436,-435,-434,-433,-432,-431,-430,-429,-428,-427,-426,-425,-424,-423,-422,-421,-420,-419,-418,-417,-416,-415,-414,-413,-412,-411,-410,-409,-408,-407,-406,-405,-404,-403,-402,-401,-400,-399,-398,-397,-396,-395,-394,-393,-392,-391,-390,-389,-388,-387,-386,-385,-384,-383,-382,-381,-380,-379,-378,-377,-376,-375,-374,-373,-372,-371,-370,-369,-368,-367,-366,-365,-364,-363,-362,-361,-360,-359,-358,-357,-356,-355,-354,-353,-352,-351,-350,-349,-348,-347,-346,-345,-240]]}]},"statistische_quartiere_geo":{"name":"statistische_quartiere","type":"GeometryCollection","geometries":[{"type":"Polygon","id":52,"arcs":[[1015,1176,1177,1178,1019,1179,1021,1180,1181,1182,1183,1184,1185,1186,1187,1188,1189,1190,1191,1192,1193,1194,1195,1196,1197,1198,1199,1030,1200,1201,1202,1034,1203,-123,1204,-120,-119,1205,-116,1206,-113,1207,-110,1208,-107,-106,1209,1210,1211,1212,1213,1214,1215,1216,1217,1218,1219,1220,1221,1222,1223,1224,1225,1226,1227,1228,1229,1230,1001,1231,1232,1233,1234,1235,1005,1236,1237,1238,1239,1240,1241,1242,1243,1244,1245,1012,1246,1247,1014]]},{"type":"Polygon","id":102,"arcs":[[1248,1249,1250,1251,17,1252,1253,1254,1255,1256,1257,20,1258,1259,23,1260,1261,1262,1263,26,1264,1265,1266,28,1267,1268,1269,1270,1271,34,1272,1273,1274,1275,39,1276,1277,42,1278,1279,1280,1281,1282,1283,45,1284,1285,1286,1287,1288,1289,1290,1291,1292,1293,1294,1295,1296,1297,1298,1299,1300,55,1301,1302,58,1303,1304,61,1305,1306,1307,1308,1309,1310,1311,1312,1313,1314,68,1315,1316,71,1317,1318,1319,1320,1321,1322,1323,1324,1325,1326,1327,1328,1329,1330,82,1331,1332,1333,1334,1335,1336,85,1337,1338,1339,1340,1341,1342,1343,1344,1345,1346,1347,91,1348,1349,1350,95,1351,1352,1353,97,1354,1355,1356,1357,100,1358,1359,1360,1361,1362,1363,103,104,105,1364,1365,1366,1367,1368,1369,1370,1371,1372,1373,1374,1375,1376,1377,1378,1379,1380,1381,1382,1383,1384,1385,1386,1387,1388,1389,1390,1391,1392,1393,1394,1395,1396,1397,1398,1399,1400,1401,1402,1403,1404,1405,11,12]]},{"type":"Polygon","id":61,"arcs":[[1406,1407,-443,1408,-441,-440,1409,-438,1410,1411,1412,1413,1414,1415,-433,-432,1416,1417,1418,1419,1420,1421,-429,1422,1423,-426,1424,-424,1425,1426,1427,1428,1429,1430,-421,1431,1432,1433,1434,1435,1436,-418,1437,1438,-415,1439,1440,1441,1442,1443,1444,-412,1445,1446,1447,1448,1449,1450,1451,-404,1452,1453,1454,1455,1456,1457,1458,1459,1460,1461,1462,1463,-395,1464,1465,-392,-391,1466,1467,1468,1469,1470,1471,1472,1473,-386,1474,-384,1475,1476,1477,1478,1479,1480,1481,1482,1483,1484,1485,1486,1487,1488,1489,1490,-375,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503,1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,1515,1516,1517,1518,1519,1520,1521,1522,1523,1524,1525,1526,1527,1528,1529,1530,1531,1532,1533,1534,1535,1536,1537,1538,1539,1540,1541,1542,1543,1544,1545,1546,1547,1548,1549,1550,1551,1552,1553,1554,1555,1556,1557,1558,1559,1560,1561,1562,1563,1564,-1167,1565,1566,1567,-1165,-1164,-966,-104,1568,-1363,1569,1570,-1360,1571,-101,1572,1573,1574,1575,-98,1576,-1353,1577,-96,1578,1579,1580,-92,1581,-1347,1582,1583,1584,-1343,-1342,1585,1586,-1339,1587,-86,1588,-1336,1589,1590,-1333,1591,-83,1592,-1330,-1329,-1328,-1327,-1326,1593,1594,-1323,-1322,-1321,-1320,-1319,1595,-72,1596,1597,-69,1598,-1314,-1313,1599,1600,-1310,-1309,-1308,-1307,1601,-62,1602,1603,-59,1604,1605,-56,1606,-1300,-1299,1607,1608,-1296,-1295,1609,1610,1611,1612,1613,-1289,1614,1615,-1286,1616,-46,1617,-1283,1618,1619,-1280,1620,-43,1621,1622,-40,1623,1624,1625,1626,-35,1627,1628,1629,1630,1631,-29,1632,-1266,1633,1634,-26,1635,-1262,1636,-24,1637,1638,-21,1639,-1257,1640,1641,-1254,1642,-18,1643,1644,1645,1646,-13]]},{"type":"Polygon","id":101,"arcs":[[1647,1648,-1403,1649,-1401,1650,-1399,1651,1652,-1396,1653,-1394,1654,-1392,1655,1656,-1389,1657,-1387,1658,1659,-1384,1660,-1382,1661,1662,-1379,1663,-1377,1664,-1375,1665,-1373,1666,1667,-1370,1668,1669,1670,1671,-1365,106,107,1672,110,1673,113,1674,116,1675,119,120,1676,1677,1678,125,1679,128,1680,131,1681,134,1682,137,1683,140,1684,143,144,1685,147,1686,150,1687,153,1688,156,1689,159,1690,162,1691,165,1692,168,169,1693,172,1694,175,1695,178,1696,181,182,1697,184,1698,186,1699,188,1700,190,1701,192,1702,194,1703,196,1704,198,199,200,1705,202,203,1706,205,206,1707,208,209,1708,1709,212,1710,1711,1712,1713,4,5,1714,1715,1716,1717,1718,1719,8,1720,10,-1406]]},{"type":"Polygon","id":115,"arcs":[[1721,1722,1723,-1488,1724,1725,-1485,1726,1727,-1482,-1481,1728,1729,-1478,-1477,1730,1731,384,385,1732,1733,1734,-1471,1735,1736,-1468,1737,390,1738,-1466,393,394,1739,1740,1741,1742,1743,1744,1745,-1457,1746,1747,-1454,1748,403,1749,1750,1751,1752,1753,1754,1755,411,1756,-1444,1757,1758,-1441,1759,414,1760,1761,417,1762,-1436,1763,1764,-1433,1765,420,1766,-1430,1767,1768,-1427,1769,423,1770,425,1771,1772,428,1773,-1421,1774,1775,-1418,1776,431,1777,-1416,434,1778,-1413,1779,1780,437,1781,439,1782,1783,1784,1785,1786,1787,1788,1789,1790,1791,1792,1793,1794,1795,1796,1797,1798,1799,1800,1801,1802,1803,1804,1805,1806,1807,1808,1809,1810,1811,1812,1813,1814,1815,1816,-267,1817,1818,1819,1820,1821,1822,-264,1823,1824,1825,1826,1827,1828,-261,-260,1829,1830,1831,1832,1833,-256,1834,1835,-253,1836,1837,1838,-249,-248,1839,1840,1841,-244,1842,1843,-241,344,1844,1845,347,1846,1847,1848,1849,1850,1851,1852,1853,1854,1855,354,1856,1857,1858,1859,359,1860,1861,1862,1863,1864,365,1865,1866,1867,1868,1869,1870,1871,373,374]]},{"type":"Polygon","id":111,"arcs":[[1872,-1795,1873,1874,-1792,1875,-1790,1876,-1788,1877,1878,-1785,1879,-1783,440,1880,442,1881,1882,-12,-11,1883,-9,1884,-1719,1885,1886,-1716,1887,-6,445,1888,1889,288,1890,1891,291,1892,1893,1894,295,1895,1896,1897,299,1898,1899,302,1900,1901,1902,1903,307,1904,1905,1906,311,1907,313,1908,1909,1910,1911,1912,319,1913,1914,1915,1916,324,1917,326,1918,-1797]]},{"type":"Polygon","id":14,"arcs":[[1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,1929,1930,-592,1931,1932,1933,1934,1935,1936,-589,1158,1159,1937,1938,1162,-967,1163,1939,1940,1941,1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959]]},{"type":"Polygon","id":13,"arcs":[[1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,-1930,2048,-1928,2049,2050,-1925,2051,-1923,2052,-1921,2053,-1960]]},{"type":"Polygon","id":73,"arcs":[[2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070,2071,2072,2073,2074,2075,2076,2077,2078,2079,2080,2081,2082,2083,2084,2085,2086,2087,2088,2089,2090,2091,2092,2093,2094,2095,2096,2097,2098,2099,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110,2111,2112,2113,2114,2115,2116,2117,2118,2119,2120,2121,2122,2123,2124,2125,2126,2127,2128,2129,2130,-532,2131,2132,2133,2134,2135,2136,2137,2138,-527,2139,2140,2141,2142,2143,2144,2145,2146,-522,2147,2148,2149,2150,2151,2152,-519,2153,2154,2155,2156,2157,2158,2159,2160,2161,2162,2163,2164,2165,-507,2166,2167,-504,2168,2169,2170,2171,2172,-500,2173,2174,2175]]},{"type":"Polygon","id":83,"arcs":[[499,2176,-2172,-2171,-2170,2177,503,2178,2179,506,2180,2181,2182,2183,2184,2185,2186,2187,2188,2189,2190,-2155,2191,518,2192,-2152,2193,2194,-2149,2195,521,2196,-2146,-2145,2197,2198,-2142,-2141,2199,526,2200,-2138,-2137,2201,2202,-2134,-2133,2203,531,532,533,2204,2205,2206,2207,450,2208,452,2209,2210,455,2211,2212,458,2213,2214,2215,462,2216,2217,2218,2219,2220,2221,2222,2223,2224,2225,2226,2227,2228,2229,2230,2231,2232,2233,2234,2235,2236,2237,2238,2239,2240,2241,2242,2243,2244,2245,2246,2247,2248,2249,2250,493,2251,2252,2253,495,2254,2255,2256,497,2257,-2175,2258]]},{"type":"Polygon","id":82,"arcs":[[2259,-2249,2260,-2247,2261,2262,-2244,2263,2264,-2241,2265,-2239,2266,2267,-2236,2268,2269,-2233,2270,2271,2272,2273,2274,2275,-2226,2276,-2224,2277,2278,-2221,2279,-2219,2280,-2217,463,2281,2282,2283,2284,2285,2286,2287,2288,2289,2290,2291,2292,468,469,2293,2294,2295,2296,2297,2298,472,2299,2300,475,2301,2302,2303,2304,2305,2306,482,2307,2308,2309,2310,2311,2312,2313,2314,489,2315,2316,492,-2251]]},{"type":"Polygon","id":81,"arcs":[[2317,-2291,2318,-2289,2319,-2287,2320,2321,-2284,2322,-2282,464,465,466,467,-2293]]},{"type":"Polygon","id":21,"arcs":[[2323,2324,536,2325,2326,539,2327,2328,542,2329,2330,2331,2332,2333,2334,549,2335,551,2336,2337,2338,2339,2340,2341,558,2342,2343,561,2344,2345,2346,2347,2348,2349,2350,2351,2352,2353,2354,2355,583,584,2356,2357,2358,2359,2360,2361,2362,2363,2364,2365,2366,2367,2368,2369,2370,2371,2372,2373,2374,-466,603]]},{"type":"Polygon","id":23,"arcs":[[2375,2376,2377,2378,2379,-2350,2380,2381,-2347,2382,-2345,562,2383,2384,565,2385,2386,568,2387,2388,571,2389,2390,2391,575,2392,2393,578,2394,2395,581,582,-2356]]},{"type":"Polygon","id":24,"arcs":[[2396,-2373,2397,2398,-2370,2399,-2368,2400,-2366,2401,-2364,2402,-2362,2403,2404,-2359,2405,-2357,585,586,587,588,2406,-1936,2407,2408,-1933,2409,591,2410,2411,2412,2413,2414,2415,2416,2417,2418,2419,2420,2421,2422,2423,602,-467,-2375]]},{"type":"Polygon","id":74,"arcs":[[2424,2425,2426,2427,2428,2429,761,2430,763,2431,765,2432,2433,2434,769,2435,2436,2437,773,2438,775,2439,777,2440,2441,780,2442,2443,2444,2445,2446,2447,787,2448,2449,790,2450,2451,2452,2453,795,2454,2455,2456,2457,800,2458,2459,2460,2461,805,2462,807,2463,809,2464,2465,812,2466,2467,815,2468,2469,2470,2471,2472,2473,2474,823,2475,825,2476,2477,828,2478,2479,831,2480,2481,2482,2483,836,2484,2485,2486,2487,841,2488,2489,844,2490,846,2491,2492,849,2493,2494,852,2495,2496,855,2497,2498,2499,859,2500,2501,862,2502,2503,865,2504,2505,868,2506,2507,871,2508,873,2509,2510,876,2511,878,2512,2513,2514,2515,2516,2517,885,2518,887,-533,-2131,2519,2520,-2128,2521,-2126,2522,-2124,2523,-2122,2524,2525,2526,-2118,2527,2528,-2115,2529,-2113,2530,2531,2532,2533,-2108,2534,2535,-2105,2536,2537,-2102,2538,2539,2540,2541,2542,2543,-2095,2544,-2093,2545,2546,-2090,2547,2548,2549,2550,2551,2552,2553,2554,2555,2556,2557,2558,2559,2560,2561,2562,2563,2564,2565,2566,2567,2568,2569,2570,2571,2572,2573,2574,2575,2576,2577,2578,2579,2580,2581,2582,2583,2584,2585,2586,2587,2588,2589,754]]},{"type":"Polygon","id":44,"arcs":[[2590,2591,2592,2593,2594,2595,2596,2597,2598,2599,2600,2601,2602,2603,2604,2605,2606,2607,2608,2609,2610,2611,2612,2613,2614,2615,2616,2617,2618,2619,2620,2621,2622,2623,2624,2625,2626,2627,2628,-740,2629,2630,2631,2632,2633,2634,-737,2635,-735,2636,2637,2638,2639,2640,2641,2642,2643,-730,2644,-728,2645,-726,-725,2646,2647,2648,2649,2650,2651,-1158,2652,2653,2654,2655,2656,2657,2658,2659,2660,2661,-1151,2662,2663,2664,2665,2666,2667,2668,2669,2670,2671,2672,2673,2674,2675,2676,2677,2678,2679,2680,2681,-1138,2682,2683,2684,2685,2686,2687,-1135,2688,2689,2690,2691,2692,2693,2694,2695,-1130,-1015,2696,2697,-1013,2698,2699,2700,-1243,-1242,2701,2702,-1239,-1238,2703,-1006,2704,2705,2706,-1233,2707,-1002,2708]]},{"type":"Polygon","id":42,"arcs":[[-1001,2709,2710,-998,-997,2711,-995,2712,-993,2713,2714,2715,2716,-990,2717,2718,2719,2720,-987,2721,2722,-984,2723,2724,-981,-980,2725,2726,2727,2728,2729,2730,-977,2731,2732,2733,2734,2735,2736,-974,2737,2738,2739,2740,2741,2742,-971,2743,2744,-968,-1163,2745,2746,-1160,2747,2748,2749,2750,2751,2752,2753,2754,-741,-2629,2755,-2627,2756,2757,2758,-2623,2759,2760,2761,2762,2763,2764,2765,2766,-2614,2767,-2612,2768,-2610,2769,2770,2771,2772,-2605,2773,-2603,2774,-2601,2775,-2599,2776,-2597,2777,2778,-2594,2779,-2592,2780,-2709]]},{"type":"Polygon","id":41,"arcs":[[-588,-748,2781,2782,2783,-746,2784,2785,2786,2787,2788,-742,-2755,2789,-2753,2790,2791,-2750,2792,-2748,-1159]]},{"type":"Polygon","id":34,"arcs":[[2793,-2788,-2787,-2786,2794,745,2795,-2783,2796,747,-587,2797,2798,2799,2800,2801,2802,2803,2804,2805,2806,2807,2808,2809,2810,2811,2812,2813,2814,2815,2816,2817,2818,2819,2820,2821,2822,2823,2824,2825,2826,2827,2828,2829,2830,2831,2832,2833,2834,2835,2836,2837,2838,2839,2840,2841,2842,2843,2844,2845,2846,2847,2848,2849,2850,2851,2852,2853,2854,2855,2856,2857,2858,2859,2860,2861,2862,2863,2864,2865,2866,2867,2868,2869,2870,2871,2872,2873,2874,2875,2876,2877,647,2878,649,2879,651,2880,2881,2882,2883,2884,2885,654,2886,2887,2888,2889,2890,2891,2892,2893,2894,2895,2896,2897,659,2898,2899,2900,2901,2902,2903,2904,2905,2906,2907,2908,2909,2910,2911,666,2912,2913,669,2914,2915,2916,2917,2918,675,2919,677,2920,2921,680,2922,2923,2924,2925,2926,686,687,2927,2928,691,2929,693,2930,2931,2932,2933,2934,2935,2936,2937,2938,2939,2940,2941,2942,2943,704,2944,2945,2946,2947,2948,2949,707,2950,2951,2952,2953,2954,2955,2956,2957,716,2958,2959,719,2960,2961,2962,-2651,2963,2964,-2648,2965,724,2966,726,2967,728,729,2968,-2643,-2642,2969,2970,-2639,-2638,2971,734,2972,736,2973,-2634,2974,2975,-2631,2976,739,740,741]]},{"type":"Polygon","id":91,"arcs":[[2977,2978,2979,2980,2981,2982,2983,2984,-708,2985,-2949,2986,2987,-2946,2988,-705,2989,2990,2991,-2941,-2940,-2939,-2938,2992,2993,-2935,-2934,-2933,-2932,2994,-694,2995,-692,2996,-690,2997,-687,2998,2999,3000,3001,3002,-681,3003,3004,-678,3005,-676,3006,3007,3008,3009,3010,-670,3011,3012,-667,3013,-2911,3014,3015,-2908,3016,3017,-2905,-2904,3018,3019,-2901,-2900,3020,-660,3021,-2897,3022,3023,-2894,3024,3025,-2891,3026,3027,-2888,3028,-655,3029,-2885,3030,3031,-2882,3032,3033,-651,3034,-649,-648,3035,-646,-645,3036,-643,3037,3038,3039,-639,3040,3041,3042,3043,3044,3045,3046,3047,3048,3049,3050,3051,3052,3053,3054,3055,3056,3057,3058,3059,3060,-627,1035,3061,1037,3062,3063,3064,3065,3066,3067,3068,3069,3070,3071,3072,3073,3074,3075,3076,3077,-717]]},{"type":"Polygon","id":72,"arcs":[[3078,3079,750,3080,3081,753,-2590,3082,-2588,3083,3084,-2585,3085,3086,-2582,3087,-2580,3088,-2578,3089,3090,-2575,3091,-2573,3092,-2571,3093,3094,-2568,3095,3096,-2565,3097,3098,-2562,3099,-2560,3100,3101,3102,3103,3104,3105,3106,3107,-2551,3108,3109,-2548,-2089,3110,-2087,3111,3112,-2084,3113,3114,3115,-2080,3116,-2078,3117,3118,-2075,3119,-2073,3120,-2071,3121,3122,-2068,3123,-2066,3124,-2064,3125,-2062,3126,-2060,3127,3128,-2057,3129,-2055,-498,3130,-2256,3131,-496,3132,-2253,3133,-494,-493,3134,3135,-490,3136,-2314,-2313,3137,3138,3139,3140,3141,-483,3142,3143,3144,3145,3146,3147,-476,3148,3149,-473,3150,-2298,3151,3152,-2295,3153,-470,888,3154,3155,891,3156,893,3157,895,3158,3159,3160,3161,3162,3163,3164,3165,3166,3167,3168,3169,3170,3171,3172,3173,3174,3175,3176,3177,3178,3179,3180,3181,3182,3183,3184,3185,3186,3187,3188,3189,3190,3191,3192,3193,3194,3195,3196,3197,3198,3199,3200,3201,3202,3203,3204,3205,3206,3207,3208,3209,3210,3211,3212,3213,3214,3215,3216,3217,3218,3219,3220,3221,3222,3223,3224,3225,3226,3227,3228,3229,3230,3231,3232,3233,3234,3235,3236,3237,3238,3239,3240,3241,3242,3243,3244,3245,3246,3247,3248,3249,3250,3251,3252,3253,3254,3255,3256,3257,3258,3259,3260,3261,3262,3263,3264,3265,3266,3267,3268,3269,3270,3271,3272,3273,3274,3275,3276,3277,3278,3279,3280,3281,3282,3283,3284,3285,3286,3287,3288,3289,3290,3291,3292,3293,3294,3295,3296,-237,964]]},{"type":"Polygon","id":11,"arcs":[[3297,-2025,3298,3299,-2022,3300,-2020,3301,-2018,3302,3303,-2015,3304,-2013,3305,-2011,3306,3307,-2008,3308,-2006,3309,3310,-2003,3311,-2001,3312,3313,-1998,3314,-1996,3315,-1994,3316,3317,-1991,3318,-1989,3319,-1987,3320,3321,-1984,3322,-1982,3323,-1980,3324,3325,-1977,3326,-1975,3327,-1973,3328,3329,-1970,3330,-1968,3331,3332,3333,3334,3335,3336,3337,3338,3339,3340,3341,3342,3343,3344,3345,3346,3347,3348,3349,3350,3351,3352,3353,3354,3355,3356,3357,3358,3359,3360,3361,3362,3363,3364,3365,3366,3367,3368,3369,3370,3371,-2027]]},{"type":"Polygon","id":71,"arcs":[[3372,-3295,3373,3374,-3292,3375,-3290,3376,-3288,3377,3378,3379,3380,3381,3382,3383,3384,3385,3386,3387,3388,3389,3390,3391,3392,3393,3394,-3269,3395,3396,-3266,3397,-3264,3398,3399,-3261,3400,3401,3402,3403,-3256,3404,-3254,3405,-3252,3406,3407,-3249,3408,-3247,3409,3410,3411,3412,3413,-3241,3414,3415,-3238,3416,3417,3418,-3234,3419,3420,3421,3422,-3229,3423,-3227,3424,3425,3426,3427,3428,3429,3430,3431,-3218,3432,3433,3434,3435,3436,-3212,3437,-3210,3438,3439,3440,-3206,3441,-3204,3442,3443,-3201,3444,3445,-3198,3446,3447,-3195,3448,3449,-3192,3450,3451,-3189,3452,3453,3454,-3185,3455,-3183,3456,3457,-3180,3458,-3178,3459,-3176,3460,3461,-3173,3462,-3171,3463,-3169,3464,3465,-3166,3466,3467,-3163,3468,3469,-3160,3470,896,3471,3472,899,3473,3474,3475,3476,3477,3478,3479,3480,3481,905,3482,3483,3484,3485,3486,3487,908,3488,3489,3490,3491,911,3492,3493,3494,3495,3496,3497,914,3498,3499,917,3500,3501,920,921,3502,3503,3504,3505,3506,3507,924,3508,3509,3510,3511,3512,3513,3514,930,3515,3516,933,3517,3518,3519,3520,3521,3522,3523,3524,3525,3526,3527,3528,3529,3530,944,3531,3532,3533,3534,3535,3536,947,3537,3538,3539,3540,3541,3542,3543,3544,3545,3546,3547,3548,3549,3550,3551,3552,3553,3554,3555,3556,3557,3558,3559,3560,3561,3562,3563,963,-239,-238,-3297]]},{"type":"Polygon","id":63,"arcs":[[3564,-3563,3565,3566,-3560,-3559,-3558,-3557,3567,3568,-3554,-3553,3569,3570,-3550,-3549,3571,3572,-3546,-3545,-3544,3573,3574,-3541,-3540,-3539,3575,-948,3576,-3536,3577,3578,-3533,3579,-945,3580,-3530,-3529,-3528,-3527,-3526,3581,3582,-3523,-3522,-3521,-3520,-3519,3583,-934,3584,3585,-931,3586,-3514,-3513,-3512,-3511,-3510,3587,-925,3588,-3507,3589,3590,-3504,3591,-922,3592,-920,3593,3594,-917,3595,-915,3596,-3497,3597,3598,-3494,3599,-1176,3600,3601,3602,3603,-1173,3604,3605,3606,3607,3608,3609,3610,3611,-1168,-1565,3612,-1563,3613,3614,-1560,3615,-1558,3616,-1556,3617,-1554,3618,-1552,3619,3620,-1549,3621,-1547,3622,-1545,3623,3624,-1542,3625,3626,-1539,3627,-1537,3628,-1535,3629,3630,-1532,3631,-1530,3632,-1528,3633,-1526,3634,-1524,3635,3636,-1521,3637,-1519,3638,-1517,3639,3640,-1514,3641,-1512,3642,-1510,3643,3644,-1507,3645,-1505,3646,3647,-1502,3648,3649,-1499,3650,3651,3652,3653,-1494,3654,3655,-374,3656,3657,3658,3659,3660,3661,3662,-366,3663,3664,3665,3666,3667,-360,3668,3669,3670,3671,-355,3672,-1855,-1854,-1853,3673,3674,-1850,-1849,-1848,3675,-348,3676,3677,-345,-240,-964]]},{"type":"Polygon","id":121,"arcs":[[3678,214,3679,3680,217,3681,219,3682,3683,222,3684,224,3685,226,3686,228,3687,3688,3689,3690,233,3691,3692,3693,3694,3695,3696,3697,3698,3699,3700,3701,3702,3703,3704,3705,3706,3707,3708,3709,3710,3711,3712,3713,3714,3715,3716,3717,3718,3719,3720,3721,3722,3723,3724,3725,3726,3727,3728,3729,3730,3731,3732,3733,3734,3735,3736,3737,3738,3739,3740,3741,3742,3743,3744,260,3745,-1828,3746,3747,-1825,3748,263,3749,-1822,3750,3751,-1819,3752,266,267,3753,269,3754,3755,3756,3757,3758,3759,276,3760,279,3761,3762,3763,3764,285]]},{"type":"Polygon","id":119,"arcs":[[3765,3766,330,3767,3768,333,3769,335,3770,337,3771,3772,340,3773,3774,343,3775,3776,3777,-282,3778,-279,3779,3780,3781,3782,3783,3784,3785,-270,3786,-268,-1817,3787,3788,-1814,3789,3790,3791,-1810,3792,-1808,3793,-1806,3794,3795,-1803,3796,3797,-1800,3798,-1798,-1919,327]]},{"type":"Polygon","id":33,"arcs":[[-583,604,3799,3800,3801,3802,3803,3804,3805,3806,3807,3808,615,3809,3810,3811,3812,620,3813,622,3814,3815,625,626,3816,-3060,-3059,3817,3818,-3056,-3055,3819,3820,-3052,-3051,-3050,-3049,-3048,3821,3822,-3045,3823,3824,-3042,3825,638,3826,3827,3828,642,3829,644,3830,646,3831,-2877,3832,3833,-2874,3834,3835,-2871,3836,-2869,3837,3838,-2866,3839,3840,-2863,3841,-2861,3842,3843,-2858,3844,3845,3846,-2854,3847,3848,3849,3850,3851,3852,3853,3854,3855,3856,3857,3858,3859,3860,3861,3862,3863,3864,3865,3866,3867,3868,3869,3870,3871,3872,3873,3874,3875,3876,3877,3878,3879,3880,3881,3882,3883,3884,3885,3886,3887,3888,3889,-584]]},{"type":"Polygon","id":12,"arcs":[[3890,3891,-893,3892,-3156,-890,-889,-469,-468,-603,3893,-2423,-2422,-2421,-2420,-2419,3894,3895,-2416,-2415,-2414,-2413,-2412,3896,-1931,-2048,3897,-2046,3898,3899,-2043,3900,-2041,3901,-2039,3902,3903,-2036,3904,3905,-2033,3906,3907,-2030,3908,-2028,-3372,3909,-3370,3910,3911,-3367,3912,-3365,3913,-3363,3914,3915,-3360,3916,-3358,3917,-3356,3918,-3354,3919,-3352,3920,-3350,3921,-3348,3922,3923,-3345,3924,-3343,3925,-3341,3926,3927,-3338,3928,-3336,3929,3930,-1961,-1959,3931,3932,3933,3934,3935,3936,-1952,3937,-1950,3938,3939,-1947,3940,-1945,3941,3942,3943,3944,-1940,1164,3945,-1567,3946,1166,1167,3947,-3611,-3610,3948,3949,-3607,-3606,3950,1172,3951,3952,3953,3954,1175,-912,3955,-3491,-3490,3956,-909,3957,-3487,3958,3959,-3484,3960,-906,3961,-3481,3962,3963,-3478,3964,3965,3966,3967,-900,3968,3969,-897,-896]]},{"type":"Polygon","id":92,"arcs":[[3970,-2695,-2694,3971,3972,-2691,-2690,3973,1134,3974,-2687,3975,3976,-2684,3977,1137,3978,-2681,-2680,-2679,3979,3980,-2676,-2675,-2674,3981,3982,-2671,-2670,-2669,3983,3984,-2666,-2665,-2664,3985,1150,3986,-2661,-2660,-2659,3987,3988,-2656,-2655,-2654,3989,1157,3990,3991,-720,3992,3993,-3078,3994,-3076,3995,3996,-3073,3997,-3071,3998,3999,4000,4001,4002,-3065,4003,-3063,1038,4004,4005,4006,4007,4008,4009,4010,4011,4012,4013,4014,4015,4016,4017,1053,4018,4019,4020,4021,4022,4023,4024,4025,1062,4026,4027,4028,4029,1067,4030,4031,4032,4033,4034,4035,4036,4037,4038,4039,4040,4041,4042,1081,4043,4044,4045,1085,4046,4047,1088,4048,4049,1091,4050,4051,4052,4053,4054,4055,1098,4056,1100,4057,4058,4059,4060,4061,4062,4063,4064,4065,4066,1111,4067,4068,1114,4069,1116,4070,1118,4071,4072,1121,4073,4074,4075,4076,1126,4077,4078,4079,-211,-210,4080,-208,-207,4081,-205,-204,4082,-202,-201,4083,-199,-198,4084,-196,4085,-194,4086,-192,4087,-190,4088,-188,4089,-186,4090,-184,4091,-182,-181,4092,-178,4093,-175,4094,-172,4095,-169,-168,4096,-165,4097,-162,4098,-159,4099,-156,4100,-153,4101,-150,4102,-147,4103,-144,-143,4104,-140,4105,-137,4106,-134,4107,-131,4108,-128,4109,4110,-1035,4111,4112,4113,-1031,4114,-1199,-1198,4115,4116,-1195,-1194,4117,4118,-1191,4119,4120,-1188,4121,4122,-1185,4123,4124,-1182,4125,-1022,4126,-1020,4127,4128,4129,-1016,1129]]},{"type":"Polygon","id":123,"arcs":[[236,237,4130,4131,4132,4133,4134,4135,4136,4137,4138,4139,4140,4141,4142,4143,4144,4145,4146,4147,4148,4149,4150,4151,4152,4153,4154,4155,4156,4157,4158,4159,4160,4161,4162,4163,4164,4165,4166,4167,4168,4169,4170,4171,4172,4173,4174,235]]},{"type":"Polygon","id":122,"arcs":[[4175,4176,-4172,4177,4178,-4169,4179,4180,-4166,4181,4182,-4163,4183,4184,-4160,4185,-4158,4186,4187,4188,-4154,4189,-4152,4190,4191,-4149,4192,4193,-4146,4194,-4144,4195,-4142,4196,-4140,4197,-4138,4198,-4136,4199,-4134,4200,4201,-4131,238,239,240,4202,4203,243,4204,4205,4206,247,4207,249,4208,4209,252,4210,4211,4212,-1834,257,4213,-1831,4214,259,-3745,4215,4216,4217,4218,4219,4220,4221,-3737,4222,4223,4224,-3733,4225,4226,4227,-3729,4228,4229,4230,4231,4232,4233,-3722,4234,-3720,4235,4236,-3717,4237,4238,-3714,4239,4240,-3711,4241,-3709,4242,-3707,4243,4244,-3704,4245,4246,-3701,4247,4248,-3698,4249,4250,4251,4252,4253,-3692,234,-4175]]},{"type":"Polygon","id":31,"arcs":[[-585,-3890,4254,-3888,4255,-3886,4256,-3884,4257,4258,-3881,4259,-3879,4260,4261,-3876,4262,4263,-3873,4264,4265,4266,4267,4268,4269,4270,-3865,4271,4272,4273,4274,4275,-3859,4276,4277,-3856,4278,4279,4280,-3852,4281,4282,-3849,4283,-2853,4284,4285,-2850,4286,-2848,4287,-2846,4288,-2844,4289,4290,-2841,4291,-2839,4292,-2837,4293,-2835,4294,-2833,4295,4296,-2830,4297,-2828,4298,-2826,4299,-2824,4300,-2822,4301,4302,4303,4304,4305,4306,-2815,4307,-2813,4308,-2811,4309,4310,4311,4312,4313,4314,4315,-2803,4316,4317,-2800,4318,-2798,-586]]},{"type":"Polygon","id":51,"arcs":[[966,967,4319,4320,970,4321,-2742,4322,4323,-2739,4324,973,4325,-2736,4326,4327,-2733,4328,976,4329,-2730,4330,4331,-2727,4332,979,4333,-2725,982,4334,-2723,985,986,4335,-2720,-2719,4336,989,4337,4338,-2715,4339,992,4340,994,4341,996,4342,-2711,999,1000,-1231,4343,-1229,4344,4345,-1226,4346,-1224,4347,-1222,4348,4349,-1219,4350,-1217,4351,-1215,4352,4353,-1212,4354,-1210,-105,965]]}]},"wahlkreise_geo":{"name":"Wahlkreis","type":"GeometryCollection","geometries":[{"type":"Polygon","id":"7 + 8","arcs":[[4355,4356,4357,4358]]},{"type":"Polygon","id":"9","arcs":[[4359,4360,4361,4362]]},{"type":"Polygon","id":"6","arcs":[[4363,4364,4365,4366,4367,-4357]]},{"type":"Polygon","id":"4 + 5","arcs":[[4368,-4365,4369,4370,-4361]]},{"type":"Polygon","id":"3","arcs":[[-4362,-4371,4371,4372]]},{"type":"Polygon","id":"1 + 2","arcs":[[-4372,-4370,-4364,-4356,4373]]},{"type":"Polygon","id":"12","arcs":[[-4358,-4368,4374,4375]]},{"type":"Polygon","id":"11","arcs":[[-4375,-4367,4376,4377]]},{"type":"Polygon","id":"10","arcs":[[-4369,-4360,4378,-4377,-4366]]}]},"zurichsee_geo":{"type":"GeometryCollection","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"geometries":[{"type":"GeometryCollection","geometries":[{"type":"Polygon","arcs":[[4379]]}]}]}},"arcs":[[[1653,7459],[0,5],[0,5],[-1,4],[-1,5],[-2,4]],[[1649,7482],[0,1]],[[1649,7483],[-2,3]],[[1647,7486],[-2,5]],[[1645,7491],[-8,20],[0,76],[0,25],[-1,26],[5,16],[8,30],[-1,6],[0,1],[0,4],[0,6],[0,28],[1,13],[-1,17],[2,10],[-15,18],[-31,12],[-7,2],[-51,17],[4,18],[2,10],[6,26],[1,2],[0,2],[9,35],[12,-4],[6,9],[4,10],[3,8],[6,-2],[6,-2],[9,-1],[1,5],[4,19],[5,19],[10,16],[14,25],[-21,8],[-24,12],[-17,7],[-19,6],[-14,3],[-39,6],[-2,0],[-2,0],[-3,1],[-14,-5],[-20,-9],[-12,-4],[-12,-9],[-8,-5],[-5,-11],[-26,-42],[-7,-42],[-8,-20],[-4,-14],[-12,3],[-29,10],[-22,8],[-32,10],[5,16],[2,22],[-11,19],[-5,7],[-17,-5],[-6,-2],[0,9],[-3,70],[-4,3],[-15,-3],[-36,-10],[-37,-12],[-1,4],[-16,35],[-17,39],[-7,15],[0,1],[-1,2],[1,0],[2,2],[3,5],[2,0],[2,2],[0,3],[2,4],[5,2],[4,3],[1,0],[4,-1],[4,2],[5,3],[1,4],[-1,4],[1,6],[-1,3],[3,5],[-3,6],[-1,1],[-2,0],[-1,3],[1,3],[-1,2],[1,2],[0,1],[2,1],[1,3],[3,2],[1,2],[1,2],[2,1],[1,2],[1,3],[1,0],[0,1],[1,3],[4,2],[2,2],[2,6],[1,1],[4,4],[0,3],[1,1],[3,2],[1,1],[2,3],[1,0],[3,4],[1,2],[0,1],[3,2],[3,2],[1,2],[4,1],[0,3],[2,2],[2,1],[1,1],[2,3],[1,3],[2,5],[2,5],[0,2],[1,1],[1,5],[1,4],[3,7],[1,1],[3,4],[1,1],[1,4],[6,7],[1,3],[2,3],[-1,3],[2,3],[0,1],[-5,5],[-13,13],[-10,12],[-7,13],[-1,3],[-16,33],[-1,38],[28,52],[9,1],[52,4],[50,4],[61,34],[53,29],[21,12],[20,11],[11,6],[10,6],[6,3],[5,3],[7,4],[10,6],[10,5],[2,1],[7,3],[10,7],[14,8],[23,15],[7,4],[12,8],[14,10],[13,10],[-3,15],[-15,22],[10,30],[8,27],[9,30],[14,43],[6,20],[7,20],[32,-19],[31,-15],[14,-34],[9,-17],[20,24],[12,1],[12,-1],[39,-4],[18,-1],[9,-1],[3,4],[-2,2],[2,13],[3,17],[7,39],[4,21],[5,49],[3,-1],[24,-8],[24,-11],[13,-7],[6,-3],[-2,-17],[0,-3],[0,-18],[18,-8],[17,-7],[24,-10],[25,-7],[15,-5],[23,-7],[33,-9],[24,-6],[18,2],[10,6],[5,12],[1,2],[8,6],[24,3],[15,5],[17,5],[8,-1]],[[2252,8893],[-4,-32],[15,-9],[12,-6],[26,-15],[43,-14],[30,-9],[33,-14],[27,-14],[11,-4],[-2,-9],[5,-4],[-1,-11],[-1,-16],[10,-3],[17,-3],[18,-7],[1,0],[20,-6],[9,-3],[18,-5],[3,0],[9,-1],[7,-1],[6,-2],[6,-3],[6,-2],[5,-2],[5,-2],[10,-5],[12,-5],[2,-1],[-1,-4],[-3,-6],[-6,-18],[-1,-17],[7,-6],[17,-18],[12,-20],[1,-3],[14,-23],[16,-18],[16,-17],[22,-23],[8,-8],[2,-3],[14,-15],[24,-16],[34,-18],[26,-12],[2,-1],[32,-18],[2,-1],[35,-24],[41,-28],[24,-21],[19,-25],[2,-2],[12,-15],[22,-62],[-9,-30],[2,-26],[10,-44],[1,-4],[9,-26],[10,-27],[14,7],[4,2],[4,2],[1,1],[2,-2],[1,-2],[2,2],[26,25],[16,8],[-4,11],[0,1],[3,4],[2,3],[3,7],[5,10],[33,-32],[38,-37],[38,-37],[3,-3],[34,11],[14,4]],[[3265,8071],[1,0],[1,0]],[[3267,8071],[1,0],[1,0],[1,0]],[[3270,8071],[1,-43],[14,6],[34,-33],[13,0],[136,-3],[15,0],[64,-2],[0,-13],[52,-1]],[[3599,7982],[8,0],[9,1]],[[3616,7983],[0,-1],[5,-9],[21,-12],[33,-19],[35,5],[31,-20],[25,-17],[19,12],[19,4],[15,1],[12,0],[12,1],[23,-1],[18,1],[31,-1],[14,-2],[-3,-6],[19,-10],[32,-17],[32,-17],[34,-18],[33,-18],[33,-18],[38,-19],[34,-18],[17,-9],[1,-1],[7,-4],[-1,0],[15,-15],[18,-19],[19,-19],[16,-15],[13,-14],[27,-28],[3,3],[20,-42],[1,-2],[4,-13],[5,-13],[4,-15],[4,-11],[-16,-4],[4,-19],[1,1],[17,7]],[[4360,7552],[3,1],[17,7],[5,2],[16,7],[14,6],[4,2],[15,6],[2,1],[8,6]],[[4444,7590],[17,-36],[16,-34],[12,-27]],[[4489,7493],[3,-6],[3,-6]],[[4495,7481],[4,-5],[3,-6]],[[4502,7470],[4,-5],[3,-5]],[[4509,7460],[5,-5],[4,-5]],[[4518,7450],[1,-1],[8,4],[11,-22]],[[4538,7431],[0,-1],[2,-2]],[[4540,7428],[1,-1],[1,-1]],[[4542,7426],[49,-27]],[[4591,7399],[6,-3]],[[4597,7396],[5,-4]],[[4602,7392],[4,-3],[3,-3],[3,-3],[3,-4],[2,-3],[3,-4],[2,-4],[2,-4],[2,-4],[1,-4],[14,-33],[15,-38],[0,-28],[-3,-33]],[[4653,7224],[0,-7],[0,-7],[1,-6],[1,-7]],[[4655,7197],[2,-5]],[[4657,7192],[2,-5]],[[4659,7187],[2,-5],[2,-4],[3,-4]],[[4666,7174],[24,-37]],[[4690,7137],[5,-8],[5,-9]],[[4700,7120],[5,-8],[4,-9]],[[4709,7103],[3,-7],[3,-8]],[[4715,7088],[1,-3]],[[4716,7085],[3,-9],[3,-9]],[[4722,7067],[8,-28]],[[4730,7039],[2,-10],[2,-10]],[[4734,7019],[1,-6]],[[4735,7013],[1,-7],[1,-7]],[[4737,6999],[0,-11],[0,-10]],[[4737,6978],[-8,0],[-1,-25],[-3,-24],[-1,-6],[-1,-12],[-4,-7],[5,-12],[8,-21],[1,-2],[1,-2],[5,-13],[5,-14]],[[4744,6840],[3,-8]],[[4747,6832],[3,-8]],[[4750,6824],[0,-2],[1,-7]],[[4751,6815],[0,-1],[0,-1],[-1,-2],[0,-1],[-1,-1]],[[4749,6809],[-1,-1],[-1,-1],[-1,-1],[-1,0],[-2,-1]],[[4743,6805],[3,-10]],[[4746,6795],[1,0],[1,0],[1,0],[1,0],[0,-1],[1,0]],[[4751,6794],[0,-1],[1,0],[0,-1],[1,-1],[0,-1],[0,-1]],[[4753,6789],[0,-1]],[[4753,6788],[0,-1]],[[4753,6787],[-1,-3]],[[4752,6784],[0,-3]],[[4752,6781],[0,-2]],[[4752,6779],[-2,-2]],[[4750,6777],[-1,-3]],[[4749,6774],[1,-31],[25,10]],[[4775,6753],[-2,-2]],[[4773,6751],[-3,-3]],[[4770,6748],[-3,-24],[-1,-19]],[[4766,6705],[-1,-7],[-1,-8]],[[4764,6690],[-1,-7],[-2,-7]],[[4761,6676],[-1,-6],[-5,-27],[-1,-3],[2,0],[-8,-38]],[[4748,6602],[-1,-4]],[[4747,6598],[0,-4]],[[4747,6594],[0,-5]],[[4747,6589],[1,-4]],[[4748,6585],[1,-3],[1,-4]],[[4750,6578],[2,-3],[2,-3]],[[4754,6572],[6,-9],[14,-23],[-2,-2],[5,-8],[1,-1],[4,-6],[2,-3],[3,-5],[4,-8],[4,-6]],[[4795,6501],[5,-11]],[[4800,6490],[5,-11]],[[4805,6479],[2,-5],[4,-11],[1,-1],[4,-9],[2,-5],[0,-1],[1,-3],[2,-4],[2,-4],[3,-8],[1,-3],[2,-5],[1,-3],[1,-1],[2,-4],[1,-2],[1,-2],[2,-4],[1,-2],[4,-7],[0,-1],[1,-1],[4,-6],[1,-2],[2,-3],[1,-2],[6,-8],[9,-13],[2,1],[1,-1]],[[4869,6359],[0,0]],[[4869,6359],[0,0]],[[4869,6359],[0,0]],[[4869,6359],[1,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[1,0]],[[4871,6359],[0,0]],[[4871,6359],[0,0]],[[4871,6359],[2,-3],[6,-8],[3,-1],[4,-6],[0,-6],[7,-12],[6,-8],[5,-7],[-1,-2],[1,-1],[0,-3],[23,-32],[6,-7],[7,-8],[6,-7],[5,-6],[19,-21],[-10,-14],[6,-7],[0,-3],[1,-15],[0,-15],[0,-17],[0,-2],[1,-17],[0,-20],[1,-30],[1,-49],[1,-32],[1,-36]],[[4972,5964],[0,-1],[0,-1],[-1,-1],[-1,-1]],[[4970,5960],[-1,0],[-1,0],[-1,0],[-1,1]],[[4966,5961],[-8,-9]],[[4958,5952],[1,-4],[1,-4],[1,-4]],[[4961,5940],[0,-5]],[[4961,5935],[-1,-5]],[[4960,5930],[0,-2]],[[4960,5928],[-1,-4],[-1,-4],[-2,-4]],[[4956,5916],[-1,-1]],[[4955,5915],[-2,-5],[-3,-4]],[[4950,5906],[-1,-2]],[[4949,5904],[-4,-5],[-4,-5]],[[4941,5894],[0,-1],[-21,-23],[-13,-15],[-7,-8]],[[4900,5847],[-1,0],[-1,-1],[-1,0],[-1,-1],[-1,0]],[[4895,5845],[-10,-11],[-10,-11],[-6,6],[-2,-2],[-5,6],[-5,4],[-3,3],[-2,-2],[-8,-4],[2,-8],[0,-3]],[[4846,5823],[-4,0]],[[4842,5823],[-3,0]],[[4839,5823],[0,-1],[-15,-3],[-1,0],[-6,-1]],[[4817,5818],[-1,0],[-1,0]],[[4815,5818],[-1,0],[-1,1]],[[4813,5819],[-3,3],[-9,-10],[0,-1],[-1,-1],[3,-2],[-21,-26]],[[4782,5782],[-76,72],[-78,79],[-15,16],[-71,77],[-16,17],[-51,47]],[[4475,6090],[-76,58],[-29,22],[-41,26],[-34,19],[-36,14],[-10,3],[-4,2],[-82,31],[-45,12],[-47,14],[-92,38],[-91,38],[-42,24],[-26,14],[-56,34],[1,3]],[[3765,6442],[-6,4]],[[3759,6446],[-12,7]],[[3747,6453],[-13,7]],[[3734,6460],[-13,7]],[[3721,6467],[-13,5]],[[3708,6472],[-14,6]],[[3694,6478],[-14,5]],[[3680,6483],[-13,4]],[[3667,6487],[-15,4]],[[3652,6491],[-14,3]],[[3638,6494],[-14,2]],[[3624,6496],[-14,2]],[[3610,6498],[-15,2]],[[3595,6500],[-67,4],[-37,3],[-112,8],[-98,8]],[[3281,6523],[-12,1]],[[3269,6524],[-12,1]],[[3257,6525],[-11,2]],[[3246,6527],[-11,2]],[[3235,6529],[-12,3],[-12,4]],[[3211,6536],[-11,3]],[[3200,6539],[-12,4]],[[3188,6543],[-11,5]],[[3177,6548],[-11,5]],[[3166,6553],[-10,5]],[[3156,6558],[-11,6]],[[3145,6564],[-10,6]],[[3135,6570],[-10,7]],[[3125,6577],[-10,6]],[[3115,6583],[-10,8]],[[3105,6591],[-9,7]],[[3096,6598],[-9,8]],[[3087,6606],[-9,8]],[[3078,6614],[-9,9]],[[3069,6623],[-8,9]],[[3061,6632],[-8,9]],[[3053,6641],[-8,10]],[[3045,6651],[-7,9]],[[3038,6660],[-45,62]],[[2993,6722],[-7,9]],[[2986,6731],[-7,8]],[[2979,6739],[-7,9]],[[2972,6748],[-7,8]],[[2965,6756],[-8,8]],[[2957,6764],[-8,8]],[[2949,6772],[-8,8]],[[2941,6780],[-8,7]],[[2933,6787],[-9,7]],[[2924,6794],[-9,7]],[[2915,6801],[-9,7]],[[2906,6808],[-9,6]],[[2897,6814],[-9,6]],[[2888,6820],[-9,6]],[[2879,6826],[-10,5]],[[2869,6831],[-9,5]],[[2860,6836],[-10,5]],[[2850,6841],[-10,5]],[[2840,6846],[-10,4]],[[2830,6850],[-11,4]],[[2819,6854],[-10,3]],[[2809,6857],[-10,4]],[[2799,6861],[-11,3]],[[2788,6864],[-10,2]],[[2778,6866],[-95,22]],[[2683,6888],[-12,3]],[[2671,6891],[-12,2]],[[2659,6893],[-13,2]],[[2646,6895],[-13,1]],[[2633,6896],[-12,1]],[[2621,6897],[-13,1]],[[2608,6898],[-13,0]],[[2595,6898],[-12,-1]],[[2583,6897],[-13,-1]],[[2570,6896],[-12,-1]],[[2558,6895],[-13,-2]],[[2545,6893],[-13,-2]],[[2532,6891],[-41,-9],[-115,-23]],[[2376,6859],[-10,-2],[-10,-1]],[[2356,6856],[-10,-1],[-11,-1]],[[2335,6854],[-10,0],[-11,0]],[[2314,6854],[-10,1],[-11,1]],[[2293,6856],[-10,1],[-10,2]],[[2273,6859],[-10,2],[-10,3]],[[2253,6864],[-11,3],[-9,3]],[[2233,6870],[-10,4],[-10,4]],[[2213,6878],[-9,5],[-10,4]],[[2194,6887],[-9,6],[-9,5]],[[2176,6898],[-9,6],[-8,7]],[[2159,6911],[-8,6],[-8,7]],[[2143,6924],[-8,7],[-8,8]],[[2127,6939],[-7,8],[-7,8]],[[2113,6955],[-7,8],[-6,9]],[[2100,6972],[-6,9],[-6,9]],[[2088,6990],[-19,31],[-40,66],[-24,40]],[[2005,7127],[-7,11],[-8,12]],[[1990,7150],[-9,11],[-8,11]],[[1973,7172],[-10,11],[-9,10]],[[1954,7193],[-10,10],[-10,10]],[[1934,7213],[-10,9],[-11,9]],[[1913,7231],[-11,8],[-12,8]],[[1890,7247],[-11,7],[-12,7]],[[1867,7261],[-12,7],[-12,6]],[[1843,7274],[-13,5],[-13,6]],[[1817,7285],[-12,4],[-13,4]],[[1792,7293],[-14,4],[-13,3]],[[1765,7300],[-13,3],[-14,2]],[[1738,7305],[-20,2],[-19,2]],[[1699,7309],[2,31],[-1,0],[0,2],[0,2],[-1,19],[-2,22],[0,1],[1,1],[0,2],[1,7],[2,18],[-6,2],[-5,1],[-6,1],[-3,0],[-17,2],[-9,2],[1,14],[-3,3],[0,20]],[[6883,8648],[3,-2]],[[6886,8646],[1,4]],[[6887,8650],[6,-3]],[[6893,8647],[4,-2]],[[6897,8645],[6,-1]],[[6903,8644],[4,-2],[4,0]],[[6911,8642],[59,-9]],[[6970,8633],[8,-2],[8,-2]],[[6986,8629],[6,-2],[5,-2]],[[6997,8625],[4,-1],[1,3],[4,6],[29,21],[7,10],[7,8],[9,15],[20,28],[4,6],[6,-196],[-6,1],[-1,-1],[-1,-10],[-1,-4],[-5,-10],[-1,-2],[-1,-12],[-1,-6],[-3,-6],[0,-5],[-1,-5],[1,-6],[2,-6],[1,-6],[1,-6],[2,-12],[0,-4],[1,-4],[1,-13],[0,-8],[-1,-6],[-1,-15],[0,-12],[0,-6],[1,-11],[-1,-11],[1,-5],[5,-13],[2,-4],[3,-10],[0,-3],[1,-75],[5,1],[1,-4]],[[7092,8226],[0,-1],[-1,0],[0,-1],[0,-1],[0,-1]],[[7091,8222],[2,-7],[1,-16]],[[7094,8199],[0,-8]],[[7094,8191],[0,-8],[-2,-24]],[[7092,8159],[0,-4],[-1,-4]],[[7091,8151],[0,-22],[0,-2],[-8,-18],[-1,-3],[-14,-26],[-7,-11],[-14,-18],[-15,-16],[-10,-9]],[[7022,8026],[-1,-3]],[[7021,8023],[-1,-2]],[[7020,8021],[0,-2]],[[7020,8019],[1,-3]],[[7021,8016],[0,-4],[3,-8],[5,-16],[12,-15]],[[7041,7973],[3,-3],[14,-7],[86,-31],[123,-44],[155,-55],[173,-62],[77,-27],[52,-19],[149,-52]],[[7873,7673],[19,-7],[50,-35],[18,0],[23,-12],[14,-2],[41,-1],[47,-10],[14,-3],[40,-9],[38,-9],[195,-46],[15,-7],[10,-8],[15,-3],[-3,-27],[-4,1],[-44,7],[-17,3],[-12,-32],[-2,-5],[-19,-49],[0,-5],[-10,-27],[-1,-3],[-4,-9],[-7,-19],[-2,-6],[-1,0],[-29,-76],[-35,-91],[-7,-19],[1,0],[136,-59],[-40,-103],[-26,-67],[-14,-36],[23,-10],[22,-10],[7,-3],[60,-25],[26,-11],[2,-5],[-8,-18],[-11,-20],[-6,-12],[-8,-19],[-3,-9],[-7,-20],[-4,-16],[-3,-13],[-1,-8],[-1,-8],[1,-12],[0,-4],[-6,-11],[-2,-3],[0,-1],[-69,42],[-27,16],[-15,-24],[-14,-24],[-5,-9],[-3,2],[-4,-7],[-8,-12],[-5,-6],[-5,-3],[-8,-3],[-7,5],[-17,13],[-20,17],[-27,32],[-20,-9],[-14,18],[-58,-30],[-35,-17],[-15,-11],[-68,-45],[-1,-1],[-3,-2],[14,-27],[9,-15],[14,-19],[6,-7],[2,-2],[5,-4],[13,-7],[19,-8],[7,0],[5,0],[-2,-2],[-6,-9],[-25,-27],[-4,-4],[-20,-22],[-18,-19],[-25,-28],[-2,-2],[-7,-6],[-3,-3],[-20,-13],[-5,-2],[-3,-21],[-35,1],[-7,-1],[-3,-2],[-27,-13],[1,-2],[-25,-12],[-5,-4],[-14,-9],[-21,-17],[-13,-11],[-13,-9],[-6,-5],[-4,-5],[-3,-5],[-5,-10],[-1,-4],[-7,-16],[-4,-24],[-1,-8],[-2,-12],[-1,-9],[-12,-41],[-5,-34],[-10,-30],[-5,-16],[-1,-2],[-1,-4],[-2,-3],[-2,-4],[-15,-32],[0,-1],[2,-13],[1,-13],[1,-3],[1,-17],[1,-17]],[[7616,5949],[-27,-16],[-23,-21],[-5,5]],[[7561,5917],[-3,3],[-7,6],[13,27],[13,27],[-26,34],[-24,32],[-20,28],[-21,30],[-1,0],[0,2],[-21,25],[-7,9],[-13,15],[-15,15],[-9,26],[-9,24],[-23,11],[-30,14],[-3,-28],[-9,-11],[-6,-30],[-30,9],[-16,-22],[-11,-13],[-37,4],[-28,1],[-24,-9],[-25,-21],[-5,-8],[-50,26],[-25,12],[-10,5],[-6,-8],[-9,-3],[-9,0],[-55,22],[-45,19],[-42,18],[-5,2],[-44,18],[-45,19]],[[6819,6247],[-3,-2]],[[6816,6245],[-10,4],[-29,54],[-78,97],[-80,98],[-121,90],[-14,11],[-9,19],[-9,11],[-12,13],[-10,8],[-16,21],[-17,16],[-17,17],[-9,11],[-32,50],[-24,29],[-25,30],[-27,25],[-32,13],[-33,2],[-19,-5],[1,5],[-20,9],[-9,14],[-14,-28],[-89,-16],[-22,-3],[-12,-2],[-20,-2],[-1,0],[-1,0],[-17,8],[-9,14],[-2,2],[-8,13],[-2,2],[-2,3],[-13,20],[-7,10],[2,5],[10,18],[12,20],[18,22],[11,11],[3,3],[17,13],[16,12],[7,6],[2,6],[5,13],[5,13],[0,1],[4,15],[1,5],[3,8],[2,4]],[[6064,7083],[10,27],[1,3],[16,30],[10,15],[10,17],[19,22]],[[6130,7197],[4,3]],[[6134,7200],[7,5]],[[6141,7205],[20,11],[2,10],[0,6],[-3,28],[-2,16],[-1,3],[-3,15],[-50,-21],[-21,6],[-6,2],[1,1],[20,24],[1,0]],[[6099,7306],[4,5],[3,5]],[[6106,7316],[4,7]],[[6110,7323],[4,6],[3,7]],[[6117,7336],[0,1],[3,7],[12,28],[10,24],[0,2]],[[6142,7398],[3,5]],[[6145,7403],[2,5]],[[6147,7408],[1,2]],[[6148,7410],[3,4],[2,3]],[[6153,7417],[16,12],[6,4],[3,2],[0,-1]],[[6178,7434],[4,2]],[[6182,7436],[4,2],[4,1]],[[6190,7439],[5,1]],[[6195,7440],[5,1]],[[6200,7441],[5,0]],[[6205,7441],[4,0],[4,0],[5,-1]],[[6218,7440],[6,-1],[3,0]],[[6227,7439],[1,6],[2,12],[1,9],[3,23]],[[6234,7489],[1,1],[0,1],[1,0]],[[6236,7491],[0,1],[1,0],[1,0],[1,0]],[[6239,7492],[2,7]],[[6241,7499],[-1,0],[0,1],[-1,0],[-1,1]],[[6238,7501],[0,1],[-1,0],[0,1],[0,1]],[[6237,7504],[6,41],[-1,12],[0,12],[0,15],[0,14],[-1,12],[0,8],[0,19],[-1,17],[0,14],[0,11],[-1,10],[-4,3],[-1,23],[-1,0],[-1,4],[0,25],[0,7],[-2,48],[0,4],[-1,58],[-1,46],[0,14],[-2,62],[-1,59],[-1,7],[0,32],[-1,8],[-1,18],[0,3]],[[6222,8110],[24,1],[0,3],[-12,0],[2,2],[10,110],[0,5],[3,0],[3,2],[3,0]],[[6255,8233],[12,1],[13,1]],[[6280,8235],[-1,15]],[[6279,8250],[2,1]],[[6281,8251],[11,1],[10,1]],[[6302,8253],[12,3],[12,2]],[[6326,8258],[12,3],[11,3]],[[6349,8264],[8,3],[8,3]],[[6365,8270],[10,3]],[[6375,8273],[10,4]],[[6385,8277],[9,5]],[[6394,8282],[10,4]],[[6404,8286],[11,6]],[[6415,8292],[11,6]],[[6426,8298],[11,7]],[[6437,8305],[23,15]],[[6460,8320],[4,3]],[[6464,8323],[28,18]],[[6492,8341],[1,-4],[44,16],[18,6],[60,21],[15,6],[3,0],[28,11],[12,2],[17,-6],[3,0],[8,0],[24,18],[12,11],[14,20],[1,5],[2,5],[4,8],[1,3],[0,1],[3,7],[6,13],[2,5],[5,15],[4,13],[4,26],[3,-1],[2,7],[3,10],[4,11],[9,21],[16,14],[21,3],[11,-5],[2,18],[-15,24],[4,8],[40,-5]],[[3515,9754],[1,0],[1,0]],[[3517,9754],[0,-1],[1,0]],[[3518,9753],[54,-53]],[[3572,9700],[4,-3],[5,-4]],[[3581,9693],[5,-3],[5,-3]],[[3591,9687],[39,-17]],[[3630,9670],[4,-2]],[[3634,9668],[5,-1]],[[3639,9667],[4,-1]],[[3643,9666],[5,-1]],[[3648,9665],[4,0]],[[3652,9665],[5,0]],[[3657,9665],[4,1]],[[3661,9666],[5,1]],[[3666,9667],[5,1],[5,2]],[[3676,9670],[5,1],[5,2]],[[3686,9673],[91,42]],[[3777,9715],[14,6],[14,7]],[[3805,9728],[13,7],[12,8]],[[3830,9743],[1,1],[1,0],[1,0],[1,0],[1,0]],[[3835,9744],[1,-1],[1,0],[0,-1],[1,-1],[0,-1]],[[3838,9740],[9,5],[6,-13]],[[3853,9732],[2,-4],[2,-3],[3,-3],[3,-3]],[[3863,9719],[1,0],[2,0],[1,0]],[[3867,9719],[2,0],[1,0],[1,1]],[[3871,9720],[4,1],[1,-1],[1,-12]],[[3877,9708],[9,4],[9,5]],[[3895,9717],[19,11]],[[3914,9728],[13,8]],[[3927,9736],[11,5]],[[3938,9741],[3,2]],[[3941,9743],[4,2],[4,1]],[[3949,9746],[5,2],[4,1]],[[3958,9749],[25,8]],[[3983,9757],[1,0]],[[3984,9757],[2,0]],[[3986,9757],[1,0]],[[3987,9757],[1,-1]],[[3988,9756],[57,-19],[16,-2],[62,-8],[140,-19],[55,-7],[0,3],[47,156],[1,7],[8,-2]],[[4374,9865],[8,-2],[8,-3]],[[4390,9860],[57,-21],[42,-15],[0,-1]],[[4489,9823],[13,-4],[63,-23],[7,-3],[7,-2],[42,-14],[8,-3],[8,-2],[-1,3],[12,41]],[[4648,9816],[0,1],[1,2],[1,1],[1,1],[2,1]],[[4653,9822],[1,1],[2,0],[2,1],[1,0],[2,-1]],[[4661,9823],[51,-13],[21,-5],[26,-7],[10,-3],[18,-4]],[[4787,9791],[2,-1],[3,0],[3,1]],[[4795,9791],[2,0],[3,1],[2,2]],[[4802,9794],[24,16],[5,1],[13,-7],[8,-7],[4,-4],[12,-16],[16,-11],[30,-10],[23,-4],[2,0],[3,0],[6,0],[0,4],[14,-2],[12,-4],[2,-1],[21,-14],[19,-12],[7,-5],[14,-4],[24,-3],[59,-6],[37,-3],[5,0]],[[5162,9702],[2,-1]],[[5164,9701],[2,0]],[[5166,9701],[2,-1]],[[5168,9700],[3,-1],[10,-5],[9,-7],[5,61],[8,6],[80,-16],[11,-2],[26,-5],[2,-1],[24,-5],[2,0],[5,-1],[3,-1],[32,-6],[-1,4],[-18,51],[-8,23],[-17,49],[17,-6],[-2,5],[44,-19],[35,-14],[4,10],[19,-10],[13,-7],[13,-9],[12,-8],[14,-8],[13,-6],[38,-17],[14,-6],[59,-24]],[[5637,9725],[12,-4],[11,-4]],[[5660,9717],[11,-3],[12,-2]],[[5683,9712],[61,-10],[7,-3],[2,4],[11,-5],[20,-11],[10,-5],[9,-1],[10,3],[12,2],[35,-4],[5,-1],[23,-5],[15,-3],[32,-2],[12,0],[43,-13],[43,-8],[16,-1],[1,-3],[1,-5],[4,-23],[3,-18],[1,-3],[0,-5],[4,-18],[2,-14],[1,-3],[2,-11],[2,-12],[5,-27],[6,-34],[6,-32],[1,-2],[3,-19],[11,-41],[12,-46],[19,-70],[4,2],[0,-6],[3,0],[5,-11],[27,-36],[2,-3],[4,-3],[11,-4],[-5,-6],[-43,-50],[21,-16],[-26,-42],[19,-12],[-2,-4],[-25,-41],[-22,-38],[-23,-39],[-6,-10],[-43,-72]],[[6034,8872],[-12,-19]],[[6022,8853],[-11,-18]],[[6011,8835],[-7,-12],[0,-1],[-10,-17],[-9,-15],[-1,-2],[362,-223],[11,-7],[6,2],[21,8],[2,-7],[5,-14],[1,-5],[1,-2],[27,-77],[23,-67],[27,10],[1,-3],[3,-10],[18,-52]],[[6064,7083],[-11,7],[-9,-14],[-8,-12],[-8,-12],[-7,-12],[-8,-12],[-11,-16],[-2,6],[-2,2],[-1,0],[-36,26],[-26,18],[-38,62],[-6,10]],[[5891,7136],[-5,-4]],[[5886,7132],[-4,-4],[-5,-3]],[[5877,7125],[-14,-11]],[[5863,7114],[-1,-1]],[[5862,7113],[0,0]],[[5862,7113],[-1,-1]],[[5861,7112],[0,-1]],[[5861,7111],[0,-1]],[[5861,7110],[-1,-1]],[[5860,7109],[-6,1],[-16,-13]],[[5838,7097],[-10,-8],[-11,-9]],[[5817,7080],[-10,-9],[-10,-9]],[[5797,7062],[-6,-6]],[[5791,7056],[-5,-6]],[[5786,7050],[-10,-10]],[[5776,7040],[-8,-7]],[[5768,7033],[-8,-8]],[[5760,7025],[-3,-4]],[[5757,7021],[-11,-9]],[[5746,7012],[-14,-13]],[[5732,6999],[-19,-18],[1,-7],[-7,-4]],[[5707,6970],[-3,-2]],[[5704,6968],[-6,-4]],[[5698,6964],[-4,-3],[-4,-4]],[[5690,6957],[-15,-14]],[[5675,6943],[-15,-15]],[[5660,6928],[-7,-8],[-7,-8]],[[5646,6912],[-7,-8],[-7,-8]],[[5632,6896],[-1,2]],[[5631,6898],[-27,19]],[[5604,6917],[0,4],[1,4]],[[5605,6925],[0,3],[-1,4]],[[5604,6932],[-1,5],[-1,4]],[[5602,6941],[-2,4],[-2,3]],[[5598,6948],[-3,4],[-3,3]],[[5592,6955],[-3,3],[-4,3]],[[5585,6961],[-3,2],[-4,2]],[[5578,6965],[-4,1],[-5,1]],[[5569,6967],[-7,2]],[[5562,6969],[-8,0]],[[5554,6969],[-4,33]],[[5550,7002],[-7,-1]],[[5543,7001],[-8,-3]],[[5535,6998],[-1,0]],[[5534,6998],[-1,1],[-1,1]],[[5532,7000],[0,1],[-3,-1],[-24,-7],[-32,-9],[-43,-13],[-13,-4],[-5,18],[-13,13],[39,39],[-2,3],[17,17],[-8,10],[-2,-1],[-4,-5],[-2,-1],[-11,13],[2,2],[5,5],[-8,8],[-13,7],[2,4],[-5,6],[-13,7],[0,2],[-9,8],[-4,4],[-17,15],[-13,11],[-4,3],[-10,9],[-7,6],[-3,3],[-12,11],[-4,3],[-10,8],[-5,5],[-2,2],[-2,2],[-8,9],[-8,8],[0,1],[-14,16],[-8,9],[-5,5],[1,1]],[[5252,7253],[3,4]],[[5255,7257],[4,3]],[[5259,7260],[4,3]],[[5263,7263],[2,2],[-12,13],[-9,11],[-3,-3],[-10,-12],[-16,18],[-5,-3],[-7,11],[-9,15]],[[5194,7315],[7,5]],[[5201,7320],[6,5]],[[5207,7325],[5,3]],[[5212,7328],[5,4]],[[5217,7332],[5,5]],[[5222,7337],[8,6]],[[5230,7343],[0,1],[1,0],[1,0],[1,0],[1,0]],[[5234,7344],[1,0],[1,-1],[1,0],[0,-1]],[[5237,7342],[3,5]],[[5240,7347],[-9,12]],[[5231,7359],[-4,5]],[[5227,7364],[-5,6]],[[5222,7370],[-4,5]],[[5218,7375],[-6,8]],[[5212,7383],[-2,1]],[[5210,7384],[-1,2]],[[5209,7386],[-11,11],[-12,14],[-7,8],[-10,11],[-13,14],[-26,29],[-25,28],[-6,6],[-19,22]],[[5080,7529],[-2,2],[-1,2],[-1,3]],[[5076,7536],[0,2],[0,2],[0,2],[1,2]],[[5077,7544],[-11,10]],[[5066,7554],[-3,-8]],[[5063,7546],[-3,-7]],[[5060,7539],[-3,-7]],[[5057,7532],[0,1]],[[5057,7533],[0,1],[-1,0]],[[5056,7534],[-13,5],[-9,3],[-9,3],[-1,0],[-27,9],[-24,9]],[[4973,7563],[-1,0],[-1,0],[-1,0],[0,-1]],[[4970,7562],[-1,0],[0,-1],[-1,0],[0,-1]],[[4968,7560],[-9,7],[4,12],[-2,0],[-6,-3],[-10,4],[-2,1],[-67,37],[-36,19],[-41,23],[-41,22],[-4,3],[-22,12],[-3,1],[-12,7],[-7,4],[-2,1],[-4,-10]],[[4704,7700],[-1,-4]],[[4703,7696],[0,-1]],[[4703,7695],[-4,-8]],[[4699,7687],[-4,-8]],[[4695,7679],[-1,0]],[[4694,7679],[1,0],[0,1],[0,1]],[[4695,7681],[0,1],[0,1],[-1,1]],[[4694,7684],[-3,5],[-8,12],[-7,12]],[[4676,7713],[-2,3]],[[4674,7716],[-2,4]],[[4672,7720],[-1,4]],[[4671,7724],[-1,4],[-1,4],[-1,4]],[[4668,7736],[-1,4],[0,5]],[[4667,7745],[-1,0],[-13,-1],[-2,1],[-4,3],[-1,1],[-7,4],[-5,3],[-10,6],[-1,1],[-1,1],[-1,0],[-9,6],[-9,5],[-12,7],[-10,7],[-10,6],[-8,-14],[-2,-4],[2,-4],[-11,15],[-11,15],[-8,-7]],[[4533,7796],[-9,11],[-9,12]],[[4515,7819],[-1,-1],[-2,-2],[-10,-13],[-2,-2],[-7,-10],[-23,-28],[-21,-16],[-2,-1]],[[4447,7746],[-14,-11],[-11,-8],[-8,-5],[-6,-4],[-13,-10],[9,-17]],[[4404,7691],[5,-9],[4,-10]],[[4413,7672],[1,-2],[4,-2],[3,-7],[0,-2],[2,-6],[11,-36]],[[4434,7617],[2,-7],[2,-7]],[[4438,7603],[3,-7],[3,-6]],[[2252,8893],[1,9],[1,2],[6,11],[1,3],[6,14],[16,22],[1,0],[42,-17],[48,-18],[3,3],[0,1],[3,7],[26,78],[1,4],[2,5],[1,2],[12,36],[1,3],[-5,4],[-23,17],[-2,2],[-13,9],[-4,3],[-6,5],[2,48],[-1,17],[0,12],[-1,6],[0,1],[2,1],[10,3],[-1,3],[-3,19],[0,5],[-2,10],[-4,2],[-42,17],[-18,7],[-18,4],[-23,10],[0,5],[-8,4],[-26,10],[-14,7],[-30,16],[-21,8],[-31,23],[-21,3],[-6,1],[-16,12],[-24,51],[-6,23],[4,22],[-1,9],[-5,24],[-13,17],[-4,3],[3,3],[-3,3],[0,5],[1,8],[1,12],[2,12],[2,20],[0,1],[-1,8],[7,10],[12,18],[3,4],[3,4],[3,3],[2,4],[3,3],[6,8],[2,3],[9,12],[3,4],[0,1],[2,2],[4,5],[1,2],[15,25],[554,156],[3,2],[259,138],[34,13],[39,4],[20,2],[4,1],[4,2],[75,-47],[14,-10],[15,-7],[13,-4],[128,-60],[201,-94],[10,-6],[7,-4],[5,-4],[-5,-3],[6,-6]],[[7663,2676],[-6,3]],[[7657,2679],[-6,4]],[[7651,2683],[-6,4]],[[7645,2687],[-5,3]],[[7640,2690],[-1,1]],[[7639,2691],[-5,2]],[[7634,2693],[-7,-15]],[[7627,2678],[-6,2]],[[7621,2680],[-7,3]],[[7614,2683],[0,0]],[[7614,2683],[-5,1],[-6,2]],[[7603,2686],[-6,1],[-6,1]],[[7591,2688],[-10,1]],[[7581,2689],[-7,1],[-7,0]],[[7567,2690],[-1,0]],[[7566,2690],[-4,0]],[[7562,2690],[5,-9],[10,-25],[-184,-138],[-5,-5],[-3,-2],[-11,-9],[-2,1],[-5,0],[0,-1],[-3,0],[-9,-10],[-1,-1],[-13,13],[-23,-20],[-23,5],[-8,1],[-9,2],[-17,3],[2,-16],[-17,-8],[-6,-3],[-13,-7],[-11,-5],[-28,-12],[-21,-9],[-21,-9],[-12,-5],[-9,-4],[-7,-3],[-30,-13],[-4,-2],[-3,-1],[-25,-10],[-8,-3],[-4,11],[-16,-5],[-33,-13],[3,-6],[-6,-2],[-2,0],[-21,-7],[-2,1],[3,-14],[-9,-4],[-1,0],[-69,-31],[-34,77],[-71,-42],[-23,-13],[-5,-3],[-14,-8],[-15,-9],[-4,-1],[-11,18],[-6,-4],[-4,5],[-1,3],[-3,3],[-5,10]],[[6695,2351],[-9,-6],[-16,-5],[-15,-4],[-2,-1],[-11,-3],[-10,-5],[-4,-1],[4,-8],[0,-1],[3,-7],[-2,-1],[-25,-15],[-2,-1],[-7,-1],[-1,-1]],[[6598,2291],[-10,-7],[-20,-15],[-9,-7],[-593,-458]],[[5966,1804],[-667,1032]],[[5299,2836],[5,920]],[[5304,3756],[184,78],[23,9],[2,1],[15,0],[4,0],[9,4],[16,6],[13,6],[6,2],[22,14],[4,5],[11,16],[11,17]],[[5624,3914],[13,20],[8,12],[3,5],[2,2],[8,12],[1,1],[0,1],[10,15],[1,1],[12,19]],[[5682,4002],[9,-1],[1,-2],[2,0]],[[5694,3999],[1,-1]],[[5695,3998],[1,0]],[[5696,3998],[13,-3],[3,-1],[7,-3],[0,1],[3,-2],[0,-1],[6,-2],[-1,-2],[5,-1],[4,-2]],[[5736,3982],[5,-2],[4,-1]],[[5745,3979],[5,-1],[5,-1]],[[5755,3977],[1,2],[3,0],[6,-2],[1,1],[2,-1],[3,-1],[2,0],[1,0],[11,-1],[14,-2],[3,0],[0,-1]],[[5802,3972],[5,0]],[[5807,3972],[4,-1]],[[5811,3971],[5,-1]],[[5816,3970],[6,-2]],[[5822,3968],[5,-1],[6,-2]],[[5833,3965],[5,-2],[6,-2]],[[5844,3961],[0,0]],[[5844,3961],[7,-3]],[[5851,3958],[6,-3]],[[5857,3955],[4,-2]],[[5861,3953],[3,-1]],[[5864,3952],[4,0]],[[5868,3952],[4,-1]],[[5872,3951],[7,-4],[3,-2],[1,-1]],[[5883,3944],[2,-1]],[[5885,3943],[2,-2]],[[5887,3941],[19,-9],[8,-4],[19,-12],[19,-13],[8,-7],[3,-3],[3,5],[6,-4],[5,-6],[5,-6],[3,-6]],[[5985,3876],[13,4],[1,1],[22,11],[7,-5],[7,-4],[13,-9],[4,-9]],[[6052,3865],[0,-1],[1,-1],[1,0],[0,-1]],[[6054,3862],[18,-7],[13,-6],[8,-3],[11,-4]],[[6104,3842],[1,-1],[1,1],[1,0]],[[6107,3842],[13,-3],[5,-8]],[[6125,3831],[-1,-1],[1,0],[0,-1]],[[6125,3829],[0,-1],[-2,-2],[-1,-3],[6,-6],[1,1],[6,-7],[-1,-1],[6,-7],[1,1],[2,-1]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[1,0],[12,-13],[3,-3],[9,-10],[11,-12],[10,-12],[9,-9],[2,-2]],[[6200,3742],[11,-11]],[[6211,3731],[6,-6]],[[6217,3725],[10,-9],[3,-3],[7,-7]],[[6237,3706],[9,-7]],[[6246,3699],[12,-10]],[[6258,3689],[12,-9]],[[6270,3680],[13,-9]],[[6283,3671],[4,-3],[4,-3]],[[6291,3665],[5,-3]],[[6296,3662],[7,-3],[7,-3]],[[6310,3656],[8,-2],[7,-2]],[[6325,3652],[1,-1]],[[6326,3651],[2,0]],[[6328,3651],[2,0],[1,0],[2,1]],[[6333,3652],[-15,-22],[13,-6]],[[6331,3624],[1,0]],[[6332,3624],[1,0],[0,-1],[1,0]],[[6334,3623],[3,-4]],[[6337,3619],[0,0]],[[6337,3619],[1,-1]],[[6338,3618],[0,-1]],[[6338,3617],[0,0]],[[6338,3617],[3,-8],[5,-13],[0,-1],[12,-34],[8,-24],[3,-7],[1,-5],[13,-16],[7,-9],[5,-6],[6,-8],[1,-3],[1,-2],[0,-1],[1,1],[1,1],[1,0],[5,0],[1,-4],[2,0],[1,-1],[4,-1],[7,-2]],[[6426,3474],[4,-1]],[[6430,3473],[3,-2]],[[6433,3471],[3,-2]],[[6436,3469],[3,-2]],[[6439,3467],[5,-6],[3,-4],[7,-8],[2,-2],[3,-3],[1,-1],[1,0],[3,-3],[5,-4],[1,-1],[6,-4],[2,-1],[1,-1],[4,-1],[6,0],[10,1],[8,1],[5,1],[6,0],[5,1],[2,2],[1,1],[3,1],[13,-1],[2,-1],[6,-1],[11,-3],[11,0],[4,0],[1,1],[6,0],[10,1],[6,0],[2,0],[3,1],[1,0],[2,1],[2,1],[2,0],[5,2],[8,4],[7,3],[1,0],[6,-2],[3,-1],[5,-3],[2,-3],[3,-3],[5,-6],[5,-6],[3,-3],[11,-9],[10,-10],[7,-9],[7,-12],[4,-5],[5,-3],[4,-3],[5,-1],[5,0],[6,1],[4,2],[11,8],[8,5],[7,3],[11,3],[11,-3],[6,-3],[15,-6],[0,-1],[1,0],[13,-3],[12,-3],[5,-1],[4,-1],[5,-3],[6,-4],[4,-5],[4,-6],[3,-7],[1,-5],[0,-7],[-1,-5],[-3,-10],[-1,-3],[0,-7],[2,-7],[4,-5],[4,-3],[6,-2],[2,-1],[3,1],[6,1],[5,2],[11,5],[4,2],[8,2],[10,1],[3,0],[6,-1],[9,0],[17,2],[1,0],[12,2],[18,2],[4,0],[7,1],[5,1],[5,0],[11,0],[4,0],[3,-1],[3,-1],[1,-1],[3,-4],[1,-1],[1,-1],[1,-4],[1,-5],[2,-3],[2,-4],[1,-2],[11,-11],[4,-3],[9,-7],[7,-6],[2,-2],[7,-5],[9,-6],[6,-5],[4,-3],[4,-3],[9,-6],[12,-10],[3,-5],[1,-1],[0,-3],[2,-17],[0,-1],[1,-4],[3,-5],[4,-3],[3,-3],[6,-2],[4,-3],[3,-3],[4,-4],[2,-4],[1,-2],[1,-4],[1,-1],[0,-1],[0,-2],[0,-2],[0,-5],[-2,-5],[-2,-9],[0,-10],[1,-8],[1,-5],[0,-1],[2,-7],[3,-6],[4,-4],[1,-1],[2,-1],[3,-2],[5,0],[6,0],[2,1],[2,0],[2,0],[9,0],[6,-2],[4,-3],[4,-5],[-2,-2],[1,-5],[3,2],[6,-22],[2,-6],[1,-2],[2,-2],[4,-2],[6,2],[15,9],[9,1],[15,-6],[2,-1],[3,-6],[5,-5],[5,-2],[9,3],[7,2],[13,2],[4,-1],[4,-6],[4,-6],[-2,-10],[-2,-6],[0,-4],[5,-6],[5,-4],[12,-3],[8,-2],[20,-4],[5,-3],[7,-3],[11,-11],[5,-8],[3,-8],[-3,-6],[-2,-5],[0,-5],[0,-1],[2,-5],[4,-6],[7,-1],[3,0],[6,0],[6,1],[6,2],[6,2],[4,1],[7,-2],[8,-4],[5,-8],[5,-1],[1,-3],[6,-5],[3,-1],[3,1],[6,7],[8,11],[7,5],[14,11],[6,-2],[3,-9],[0,-7],[8,-11],[6,0],[4,-2],[17,-1],[5,-2],[9,-5],[1,-4],[1,-1]],[[7583,2889],[4,-6],[1,-8],[4,-11],[2,-10],[4,-4],[1,-1],[12,-1],[6,-2],[6,-4],[2,-5],[3,-4],[11,-4],[4,-1],[3,1],[10,4],[8,11],[7,6],[1,2],[6,4],[13,3],[5,-1],[4,-2],[4,-4],[3,-3],[0,-3],[3,-2],[8,-1],[12,-9],[8,-10],[10,-4],[7,-1],[10,11],[3,8],[4,11],[5,3],[9,1],[6,-2]],[[7792,2851],[-3,-5],[-7,-17],[-3,-11],[-8,-15],[-13,-8],[-6,-4],[-5,-3],[-10,-10],[-7,-9],[-7,-14],[-8,-6],[-7,-12],[-1,-2],[-10,-6],[2,-4],[-15,-7],[-9,-3],[-2,0],[12,-12],[-4,-1],[-5,-1],[-4,-7],[-3,-6],[-2,-4],[-4,-8]],[[5195,1180],[6,-7]],[[5201,1173],[7,-6]],[[5208,1167],[-5,-6],[-2,-4],[-14,-22],[-12,-18],[-16,-25],[-4,1],[-6,0],[-4,-3],[-4,-5],[-17,-33],[-3,-8],[-5,-7],[-5,-7],[-10,-6],[-20,-12],[-20,-18],[-2,-1],[-5,-5],[-13,-11],[-2,-1],[-9,-6],[-10,-8],[-12,-11],[-6,-8],[-8,-10],[-6,-6],[-6,-6]],[[4982,921],[1,-6]],[[4983,915],[0,-5],[0,-6]],[[4983,904],[-1,-8]],[[4982,896],[0,-3],[-1,-2],[-1,-3],[-1,-2]],[[4979,886],[-2,-2],[-2,-1],[-2,-2],[-2,0]],[[4971,881],[0,-11],[-16,-4]],[[4955,866],[-7,-2],[-6,-1]],[[4942,863],[-6,-1]],[[4936,862],[-8,-2]],[[4928,860],[-7,-1],[-7,0]],[[4914,859],[-6,-1]],[[4908,858],[-8,-1]],[[4900,857],[-29,-1]],[[4871,856],[-10,-1],[-11,-1]],[[4850,854],[0,0]],[[4850,854],[-10,-1],[-10,-2]],[[4830,851],[-8,-2],[-7,-1]],[[4815,848],[-5,-2]],[[4810,846],[-10,-2],[-10,-3]],[[4790,841],[-12,-5]],[[4778,836],[-11,-4]],[[4767,832],[-10,-4],[-23,-10],[-9,-4]],[[4725,814],[-3,-3]],[[4722,811],[-3,-3]],[[4719,808],[2,-2],[-6,-9],[-4,-10],[-2,-15],[1,-6],[-4,-32],[-4,-14],[-15,-29],[-9,-21],[-52,-8],[-20,-3],[-1,-21],[-1,-23],[0,-18],[-1,-6],[0,-10],[-15,0],[-10,4],[-14,6],[-4,0],[-3,-1],[-18,-4],[-24,-7],[-5,-29],[-1,-10],[0,-5],[-26,4],[3,-20],[-34,1],[-3,0],[-66,2],[-2,-12],[-7,-27],[-77,29],[-3,-15],[0,-12],[-1,-16],[-2,-4],[1,0],[2,-8],[0,-7],[-1,-17],[0,-28],[-4,-5],[-5,-15],[-10,-21],[-7,-19],[-16,7],[-23,8],[-23,2],[-39,-1],[0,-36],[-33,-1],[-13,0],[-15,-1],[-27,1],[-26,8]],[[4052,332],[-6,-1],[-4,0],[-24,0],[-19,-5],[-4,-1],[-12,-7],[-3,-2]],[[3980,316],[-3,-2]],[[3977,314],[-2,-3]],[[3975,311],[-5,-5]],[[3970,306],[-2,-3]],[[3968,303],[-4,-3]],[[3964,300],[-12,-8]],[[3952,292],[-2,-2],[-2,-2]],[[3948,288],[-1,-1],[-1,-3]],[[3946,284],[-8,-14]],[[3938,270],[-2,-3],[-2,-2]],[[3934,265],[-2,-2],[-1,-1],[-2,-1]],[[3929,261],[-3,-1],[-3,0]],[[3923,260],[-22,-1],[-20,-2],[-6,0],[-4,-1],[-1,-1],[-5,-2],[-3,-1],[-4,-1],[-3,-1],[-4,1],[-3,1],[-7,-1],[-15,2],[-10,3],[-5,0],[-2,0],[-4,-1],[-7,-4],[-6,-5],[-6,-4],[-4,-3],[-7,-6],[-4,-3],[-4,-6],[-4,-4],[-4,-2],[-4,0]],[[3755,218],[-2,-1]],[[3753,217],[-3,1]],[[3750,218],[-4,1],[-10,2],[-4,1],[-34,6]],[[3698,228],[-1,1],[-2,1]],[[3695,230],[-2,0],[-1,1]],[[3692,231],[-3,2],[-3,1],[-6,1],[-3,-1],[-4,0],[-4,-1],[-2,1],[-3,-1],[-4,1],[-5,-3],[-2,0],[-1,-1],[-3,-2],[-3,-2],[-3,-1],[-2,-2],[-2,0],[-4,-1],[-2,-2],[-2,0],[-12,-12],[-3,-3],[-2,-1],[-6,-9],[-2,-2],[-7,-8],[-9,-7],[-6,-4],[-5,0],[-2,-1],[-7,-2],[-2,-1],[-12,-3],[-13,-3],[-35,-5],[-27,-3],[-12,2],[-2,-16],[-2,-17],[-9,4],[-19,3],[-11,2],[-6,4],[-10,5],[-18,11],[-6,2],[-12,2],[-1,-1],[-14,-13],[-1,-2],[-14,-10],[-15,-1],[-18,-7],[-27,-8],[-16,-4],[-16,-5],[-24,-1],[-30,-19],[-16,-25],[-10,-16],[-10,-8],[-11,-8],[-12,-7],[-8,-4],[-12,-10],[-10,-9],[-3,9],[-16,5],[-13,7],[-11,6],[-8,25],[-8,4],[-11,5],[-10,13],[-14,20],[-9,21],[-6,11],[-12,28],[-1,5],[-1,12],[-2,28],[-1,8],[-9,11],[-10,6],[0,6],[1,13],[6,28],[3,33],[-1,13],[-3,25],[1,6],[-1,11],[-3,16],[10,27],[-1,21],[3,15],[0,3],[2,10],[4,50],[2,2],[7,11],[5,10],[10,16],[5,9],[3,13],[0,39],[2,12],[0,8],[11,11],[6,17],[-32,103],[5,18],[-32,41],[-8,25],[5,24],[5,41],[-7,23],[-6,27],[5,24],[13,21],[9,18],[-21,17],[2,19],[7,17],[9,15],[15,15],[19,15],[14,7],[6,13],[3,10],[1,5],[2,6],[4,19],[-6,6],[-11,17],[-7,19],[-9,30],[-1,31],[-4,20],[6,35],[3,39],[8,20],[10,21]],[[3043,1410],[13,13],[15,11],[-4,24],[-2,24],[-11,34],[2,31],[13,7],[11,20],[9,36],[8,33],[5,25],[-3,19],[3,20],[14,-1],[14,20],[9,19],[10,21],[3,26],[8,16],[12,13],[11,22],[16,18],[14,14],[14,16],[19,23],[7,7],[19,9],[24,18],[7,13],[20,21],[40,20],[22,15],[21,21],[25,19],[16,14],[14,7],[15,2],[13,1],[10,-1],[30,-9],[0,1],[4,-1],[4,0],[5,-2],[3,0],[8,1],[9,-1],[11,0],[7,1],[6,0],[10,-1],[7,1],[7,-1],[2,0],[11,0],[4,-1],[7,-2],[3,1],[1,-1],[3,1],[5,0],[4,-2],[2,0],[4,0],[9,-4],[3,-1],[2,-1],[3,-1],[3,1],[4,1],[4,0],[4,1],[2,-1],[5,0],[8,-3],[3,-3],[4,1],[2,-1],[2,-1],[7,-3],[1,0],[6,-2],[6,-2],[3,-3],[4,-1],[2,-4],[2,-1],[1,-2],[4,-3],[2,-3],[6,-7],[1,-1],[4,2],[4,2],[7,2],[10,4],[6,-1],[4,1],[3,1],[5,3],[2,1],[4,0],[3,0],[2,-1],[1,0],[2,0],[4,-1],[3,1],[7,0],[3,-1],[2,-2],[8,1],[3,1],[7,1],[10,-1],[3,-1],[2,0],[0,1],[4,8],[9,9],[26,22],[25,21],[10,8],[6,4]],[[3948,2106],[-1,4],[17,7],[-55,157],[-12,37],[-13,37],[-13,37],[-10,29],[-9,25],[-5,18],[-3,18],[-2,18],[-3,19],[1,19],[4,18],[6,17],[7,18],[8,16],[8,17],[11,15],[12,13],[14,13],[15,10],[15,10],[16,8],[10,2],[28,11],[30,13],[35,14]],[[4059,2726],[35,14],[22,9],[37,18],[40,18],[20,10],[39,23],[18,14]],[[4270,2832],[11,9],[11,9],[9,11],[8,12],[9,17],[6,19],[1,14],[2,13],[-2,21],[-5,39],[-5,39],[-4,34],[-1,18],[-1,19],[-2,46],[0,20],[-1,20],[-2,19],[-3,19],[-3,19],[-5,19],[-8,39],[-8,36],[-8,40],[-9,39],[-7,32],[-7,30],[-4,22],[-18,115],[-3,22],[-5,39],[-2,56],[0,15],[1,24],[2,25],[2,14],[3,19],[4,19],[4,19],[5,18],[7,18],[7,18],[7,18],[9,17]],[[4265,3962],[9,17],[10,16],[10,16],[12,15],[12,15],[12,15],[13,14],[13,14],[32,32],[32,33],[33,33],[32,34],[33,33]],[[4518,4249],[46,46],[12,-15]],[[4576,4280],[12,-15],[2,-3],[4,-5],[4,-5],[22,-28],[17,-21],[4,-6],[3,3],[3,4],[5,3],[4,3],[4,2],[11,6],[11,7],[5,3],[11,7],[17,9],[20,12],[2,1],[10,6],[12,7],[10,2],[26,15],[27,16],[4,2],[2,-4],[5,-7],[12,3],[3,0],[16,4],[21,6],[5,1],[18,-44]],[[4908,4264],[1,-3],[2,-3],[3,-2]],[[4914,4256],[2,-2],[3,-1],[3,-1]],[[4922,4252],[36,-4],[36,-5],[8,-1],[7,-2],[7,-3],[6,-4],[1,1],[4,-3],[3,-3],[4,-5],[2,-3],[2,-4],[9,-15],[-2,-1],[9,-14],[8,-15],[3,-4],[14,-24],[6,-11],[1,-2],[3,-5],[23,-38],[0,-1],[11,-18],[11,-19],[6,-9],[5,-10],[11,-18],[2,-4],[1,-3],[3,-6],[2,-2],[1,-1],[11,-18]],[[5176,3978],[-1,-1]],[[5175,3977],[0,0]],[[5175,3977],[0,0]],[[5175,3977],[-1,-1]],[[5174,3976],[0,0]],[[5174,3976],[0,-1]],[[5174,3975],[0,0]],[[5174,3975],[0,-1]],[[5174,3974],[0,0]],[[5174,3974],[1,0]],[[5175,3974],[6,-12],[21,-36],[102,-170]],[[5966,1804],[-615,-475],[-7,-5],[-5,-3],[-39,-28],[-12,-13],[-5,-10],[-4,-4],[-7,-7],[-2,-2],[-7,-9],[-1,-1],[-3,-5],[-7,-11],[-12,-18],[-11,-17],[-2,-7],[-2,-6],[-24,17],[-6,-20]],[[3043,1410],[-2,3],[1,12],[0,12],[-2,11],[-3,12],[-5,10],[-5,11],[-6,10],[-23,29],[-6,7],[-4,5],[-39,42],[-5,6],[-5,6],[-12,21],[-8,14],[-25,36],[-9,12],[-20,26],[-4,6],[-3,7],[-10,39],[-10,38],[-2,16],[-2,15],[-8,45],[-4,15],[-8,14],[-7,11],[-7,8],[-8,6],[-19,13],[-5,4],[-4,6],[-2,6],[-1,7],[0,24],[1,16],[2,17],[2,5],[3,5],[4,3],[31,20],[6,5],[6,1],[4,12],[3,7],[1,8],[1,13],[2,11],[1,8],[-1,18],[-2,10],[-7,15],[-6,15],[-10,19],[-13,13],[-10,9],[-4,6],[-20,33],[-26,45],[-4,6],[-4,3],[-18,10],[-5,4],[-10,8]],[[2688,2320],[-3,2],[-3,2],[-3,1]],[[2679,2325],[-3,1],[-3,1],[-4,0]],[[2669,2327],[-2,-1],[-2,0],[-2,1],[-3,1]],[[2660,2328],[-2,1],[-1,1],[-2,1],[-2,2]],[[2653,2333],[-2,3]],[[2651,2336],[-1,2]],[[2650,2338],[-1,3]],[[2649,2341],[-1,3]],[[2648,2344],[-1,3]],[[2647,2347],[-1,3]],[[2646,2350],[0,10],[-1,0]],[[2645,2360],[0,4],[-1,4]],[[2644,2368],[-1,3]],[[2643,2371],[-1,3],[-1,3],[-2,3]],[[2639,2380],[-3,5]],[[2636,2385],[-3,4]],[[2633,2389],[-3,4]],[[2630,2393],[-4,3],[-6,5],[-6,4],[-6,4],[-4,2],[-3,2],[-24,12]],[[2577,2425],[-3,1],[-3,2],[-3,0]],[[2568,2428],[-2,1]],[[2566,2429],[0,5],[-6,1],[-33,17],[-44,100],[-1,7],[-5,2],[-29,10],[-10,17],[-6,25],[-10,11],[-6,22],[0,15],[-45,-9],[-5,-1],[-8,8],[-15,19],[-20,27],[-8,14],[-12,17],[-5,6],[-3,4],[-11,11],[1,0],[-9,3],[-11,4],[-4,6],[0,7],[-41,8],[-27,-6],[-7,15],[10,42],[17,38],[-4,7],[-6,18],[-15,23],[-19,10],[-21,22],[-22,17],[-1,6],[-17,12],[1,4],[-12,8],[-12,10],[1,4],[-10,22],[-12,33],[-2,22],[0,19],[2,36],[0,41],[-6,2],[-3,25],[-10,22],[-2,8],[-8,17],[-15,18],[-25,23]],[[1995,3303],[7,15],[5,12],[23,34],[31,42],[24,39],[18,28],[29,40],[26,37],[20,29],[16,22],[15,20],[27,42],[36,8],[18,9],[21,10],[33,15],[16,10],[43,27],[39,26],[41,19],[26,13],[40,20],[27,11],[4,2],[10,3],[3,0],[2,0],[4,-1],[4,29],[4,21],[0,1],[-1,8],[-5,15],[-5,3],[-10,2],[-3,9],[-2,8]],[[2581,3931],[1,-1],[0,-1]],[[2582,3929],[1,-1],[1,-1]],[[2584,3927],[1,-1],[1,0]],[[2586,3926],[1,-1],[1,0]],[[2588,3925],[1,0]],[[2589,3925],[1,1]],[[2590,3926],[1,0]],[[2591,3926],[1,0]],[[2592,3926],[0,1]],[[2592,3927],[1,1],[0,1]],[[2593,3929],[1,0],[0,1],[0,1]],[[2594,3931],[0,1]],[[2594,3932],[1,8],[2,7]],[[2597,3947],[1,5]],[[2598,3952],[2,9],[2,10]],[[2602,3971],[-2,1],[10,33],[11,34],[2,-1]],[[2623,4038],[5,13],[4,12]],[[2632,4063],[8,19],[0,2]],[[2640,4084],[3,6]],[[2643,4090],[3,6]],[[2646,4096],[-1,1],[5,12],[5,14],[4,14],[-3,5]],[[2656,4142],[-5,0]],[[2651,4142],[-5,0]],[[2646,4142],[-5,0]],[[2641,4142],[-5,-1]],[[2636,4141],[-6,-2],[-6,-2]],[[2624,4137],[-5,-3],[-5,-3]],[[2614,4131],[-8,11]],[[2606,4142],[5,4],[5,5]],[[2616,4151],[5,5],[4,5]],[[2625,4161],[0,1],[1,1],[0,1]],[[2626,4164],[0,1],[0,1],[-1,1],[0,1]],[[2625,4168],[4,20]],[[2629,4188],[2,-1]],[[2631,4187],[1,0]],[[2632,4187],[2,0]],[[2634,4187],[2,0]],[[2636,4187],[1,0],[2,1]],[[2639,4188],[2,1],[2,1]],[[2643,4190],[12,12]],[[2655,4202],[6,7],[6,7]],[[2667,4216],[8,8],[8,8]],[[2683,4232],[0,4]],[[2683,4236],[1,1]],[[2684,4237],[6,5]],[[2690,4242],[7,5]],[[2697,4247],[10,7]],[[2707,4254],[9,6],[9,5]],[[2725,4265],[12,7],[60,32]],[[2797,4304],[8,4],[8,5]],[[2813,4313],[-2,1]],[[2811,4314],[13,8]],[[2824,4322],[11,8],[10,7]],[[2845,4337],[3,0],[5,4],[1,1]],[[2854,4342],[7,6],[7,5]],[[2868,4353],[7,6],[6,6]],[[2881,4365],[7,6],[6,7]],[[2894,4378],[10,10]],[[2904,4388],[2,3]],[[2906,4391],[1,-1]],[[2907,4390],[9,11]],[[2916,4401],[9,10]],[[2925,4411],[8,11]],[[2933,4422],[9,12],[9,13]],[[2951,4447],[1,1]],[[2952,4448],[8,13],[8,13]],[[2968,4474],[36,66],[17,30],[16,27],[17,28],[27,39],[-1,12],[-19,23],[-11,25]],[[3050,4724],[0,1]],[[3050,4725],[1,0]],[[3051,4725],[0,1]],[[3051,4726],[0,1]],[[3051,4727],[0,1]],[[3051,4728],[0,1]],[[3051,4729],[-1,1]],[[3050,4730],[0,1]],[[3050,4731],[-5,7],[-4,7]],[[3041,4745],[-5,6],[-5,7]],[[3031,4758],[-9,13],[-18,25],[-28,39],[-7,8],[-22,30],[-28,39],[-6,8],[-24,33],[-15,21]],[[2874,4974],[-1,1],[-1,1]],[[2872,4976],[-1,1],[-1,1]],[[2870,4978],[1,1],[-10,7],[-13,8],[17,22],[-2,7],[13,19],[1,2]],[[2877,5044],[9,12],[9,13]],[[2895,5069],[8,10]],[[2903,5079],[9,12]],[[2912,5091],[2,2]],[[2914,5093],[11,13]],[[2925,5106],[8,10]],[[2933,5116],[8,9],[7,8]],[[2948,5133],[5,5]],[[2953,5138],[11,12],[17,18],[10,11],[6,7],[4,3],[28,30]],[[3029,5219],[11,12]],[[3040,5231],[11,12]],[[3051,5243],[22,26],[22,25],[7,8]],[[3102,5302],[4,4]],[[3106,5306],[4,4]],[[3110,5310],[1,1],[1,0]],[[3112,5311],[1,0],[1,0],[1,0]],[[3115,5311],[9,-5]],[[3124,5306],[2,0]],[[3126,5306],[2,-1]],[[3128,5305],[2,-1]],[[3130,5304],[2,0]],[[3132,5304],[28,-3]],[[3160,5301],[3,-1]],[[3163,5300],[2,0]],[[3165,5300],[3,-1]],[[3168,5299],[2,-2]],[[3170,5297],[38,-26],[10,-7],[9,-5],[7,-5],[4,-3],[11,-7],[10,-7],[8,-5],[14,-10]],[[3281,5222],[11,-7]],[[3292,5215],[12,-9],[25,-18],[25,-18],[32,-22],[17,-12],[13,-9],[9,-7],[13,-9],[14,-9],[-1,-1],[15,-11],[-1,-2],[7,-6],[2,-2],[-1,-7],[11,-15],[8,-8],[8,-7],[13,2],[13,1],[7,1],[7,-4],[11,-7],[14,-8],[8,-6],[11,-7],[27,-16],[15,-10],[25,-16],[45,-35],[11,-8],[11,-8],[8,-6],[17,-13],[9,-7],[6,-3],[6,-5],[11,-7],[13,-9],[7,-4],[7,-5],[5,-3],[5,-3],[4,-2],[3,-1],[7,-4],[10,-5],[12,-6],[11,-14],[5,-1],[14,-5]],[[3878,4819],[0,1],[0,1],[1,1],[0,1],[1,1],[0,1]],[[3880,4825],[1,0],[1,0],[1,1],[1,0],[1,0],[1,-1]],[[3886,4825],[34,-12],[14,-5],[10,-4],[10,-4],[9,-3],[4,-1],[6,-3],[24,-10],[1,0],[-1,0]],[[3997,4783],[20,-7]],[[4017,4776],[4,-9],[5,-12],[5,-11],[7,-12],[6,-11],[7,-10],[8,-10],[8,-10],[1,-1],[9,-10],[1,1],[1,0],[18,-21],[30,-32],[30,-33],[0,1],[25,-26],[24,-26],[0,-1],[10,-11],[2,2],[42,-44]],[[4260,4490],[0,0]],[[4260,4490],[0,-1]],[[4260,4489],[1,0]],[[4261,4489],[0,-1],[0,1],[12,-13],[20,-32],[3,-4],[8,-10],[3,2],[8,-11],[8,-10],[4,-5],[3,-4],[5,-8],[12,-15],[8,-10],[10,-14],[7,-9],[7,-9],[7,-10],[7,-9],[9,8],[6,5],[6,-7],[7,-9],[6,-8],[8,-2],[15,-4],[16,-4],[0,-1],[14,-3],[15,-4],[5,-2]],[[4500,4287],[2,0],[2,0],[2,0]],[[4506,4287],[1,-21],[-2,-2],[1,-2],[12,-13]],[[8078,5516],[6,-2],[6,-3]],[[8090,5511],[6,-2],[6,-2]],[[8102,5507],[8,-5],[6,-3],[7,-4]],[[8123,5495],[1,0],[0,-1],[1,0],[0,-1]],[[8125,5493],[0,-1],[0,-1],[0,-1]],[[8125,5490],[-7,-12],[-7,-8],[-6,-8],[2,-2],[-12,-14],[-8,-10],[17,-21],[17,-20],[18,-21],[3,-4],[6,-9],[3,-5],[3,-3],[6,-5],[1,-1],[8,-8],[9,-8],[8,-7],[12,-11],[1,-1],[9,-9],[10,-10],[10,-13],[3,-4],[0,-22],[0,-5],[4,-4],[7,-6],[17,-13],[8,-6],[15,-12],[8,-8],[17,-8],[8,-4],[7,-18],[3,-9],[0,-1],[30,-18],[15,-15],[2,-1],[11,-12],[5,-5],[20,-18],[-6,-23],[-10,-21],[-6,-8],[-4,-7],[1,-9],[12,-28],[2,-20],[9,-14],[15,-22],[9,-13],[-17,-31],[-14,-31],[20,-13],[21,-15],[28,-41],[16,-32],[-11,-13],[-13,-10],[28,-23],[28,-20],[21,-24],[22,-20],[17,-15],[19,8],[24,-24],[14,-27],[10,-25],[19,-37],[9,-8],[3,-3],[-5,-5]],[[8669,4517],[0,-5],[1,-7]],[[8670,4505],[1,-2],[0,-1],[1,-2]],[[8672,4500],[1,-1],[2,-2],[1,-1]],[[8676,4496],[3,-2]],[[8679,4494],[4,-2]],[[8683,4492],[4,-1]],[[8687,4491],[3,-1]],[[8690,4490],[10,-2]],[[8700,4488],[4,-1]],[[8704,4487],[4,-1]],[[8708,4486],[4,-1]],[[8712,4485],[4,-2],[16,-8]],[[8732,4475],[4,-2]],[[8736,4473],[3,-2]],[[8739,4471],[4,-3]],[[8743,4468],[3,-3]],[[8746,4465],[3,-3]],[[8749,4462],[3,-4]],[[8752,4458],[3,-3]],[[8755,4455],[2,-4],[10,-19]],[[8767,4432],[4,-6]],[[8771,4426],[4,-6]],[[8775,4420],[5,-6]],[[8780,4414],[5,-5],[6,-6]],[[8791,4403],[4,-5],[4,-5]],[[8799,4393],[3,-6],[3,-5]],[[8805,4382],[6,-14]],[[8811,4368],[2,-4]],[[8813,4364],[2,-3]],[[8815,4361],[3,-3]],[[8818,4358],[2,-3]],[[8820,4355],[6,-4],[5,-5]],[[8831,4346],[5,-6],[5,-5]],[[8841,4335],[27,-33],[14,-18],[11,-14]],[[8893,4270],[2,-4],[1,-3]],[[8896,4263],[1,-4],[1,-3]],[[8898,4256],[0,-3]],[[8898,4253],[1,-4],[1,-3]],[[8900,4246],[2,-4],[2,-3]],[[8904,4239],[3,-2],[2,-2]],[[8909,4235],[4,-2],[3,-1]],[[8916,4232],[9,-2]],[[8925,4230],[4,-1]],[[8929,4229],[5,-2]],[[8934,4227],[4,-2]],[[8938,4225],[5,-3]],[[8943,4222],[16,-14],[26,-19],[12,-11]],[[8997,4178],[4,-4],[4,-5],[3,-4]],[[9008,4165],[3,-5],[2,-5],[2,-5]],[[9015,4150],[1,-3],[2,-2],[2,-2],[2,-1]],[[9022,4142],[2,-2],[2,-1],[3,0],[2,0]],[[9031,4139],[9,1]],[[9040,4140],[3,0]],[[9043,4140],[3,0]],[[9046,4140],[3,0]],[[9049,4140],[3,-1],[39,-9],[59,-12]],[[9150,4118],[9,-2],[7,-3]],[[9166,4113],[8,-3],[8,-3]],[[9182,4107],[30,-15]],[[9212,4092],[6,-3],[6,-3]],[[9224,4086],[5,-4],[5,-3]],[[9234,4079],[8,-6],[44,60],[16,21]],[[9302,4154],[4,-1]],[[9306,4153],[3,0]],[[9309,4153],[4,0]],[[9313,4153],[3,0]],[[9316,4153],[3,2]],[[9319,4155],[3,1]],[[9322,4156],[3,2],[3,3],[2,3],[2,3],[1,4]],[[9333,4171],[2,5],[103,-28],[3,1],[51,61],[12,-11],[14,-22],[8,-18],[8,-29],[9,-24],[12,-29]],[[9555,4077],[2,-3],[2,-3]],[[9559,4071],[-3,-2],[-3,-3],[-2,-6],[0,-3],[-5,-6],[2,-3],[-2,-4],[-4,-3],[1,-5],[-2,-2],[-1,-3],[-7,-4],[-1,-2],[-3,-1],[-1,-1],[1,-3],[1,-2],[-1,-2],[-2,-3],[-1,-3],[-2,-3],[0,-2],[1,-4],[1,-1],[-1,-2],[-1,-1],[0,-2],[1,-1],[0,-2],[-1,-1],[-1,-8],[-1,-1],[1,-2],[-1,-1],[0,-2],[-2,-4],[1,-2],[-1,-3],[0,-2],[-2,-2],[-1,-3],[0,-2],[-1,-2],[-1,-2],[0,-1],[1,-2],[-1,-1],[-1,-3],[0,-2],[0,-2],[-1,-1],[-4,-3],[-2,-4],[-2,-1],[-1,-1],[-2,-2],[-1,0],[-2,0],[-4,-3],[-3,-3],[-1,-1],[-1,-1],[-2,-2],[-1,-3],[-3,-4],[-1,-1],[-2,-1],[-1,-1],[-4,-2],[-2,0],[-1,-1],[-1,-4],[-2,-1],[-3,-4],[-2,-1],[-2,-3],[-4,-2],[-2,-3],[-6,-5],[-1,-1],[-1,-2],[-2,-1],[-2,0],[-3,1],[-1,2],[-1,0],[-2,-1],[-2,-5],[-5,-4],[-6,0],[-5,2],[-2,4],[-5,-1],[-2,-3],[-3,-1],[0,-2],[5,-15],[8,-30],[1,-3],[13,-39],[8,-13],[3,-45],[1,-9],[0,-1],[0,-5],[-47,-9],[0,-2],[0,-5],[0,-4],[-1,-4],[0,-4],[-2,-35],[-2,-22],[-1,-22],[10,0],[20,-5],[21,-3],[53,-2],[54,-3],[33,0],[4,0],[27,-5],[36,-7],[22,-11],[11,-3],[5,-2],[-2,-3],[5,-2],[18,-13],[25,-19],[18,-15],[33,-29],[3,-3],[9,-5],[17,-9],[10,-4],[1,-1],[10,-2],[-5,-2],[-2,0],[-26,-21]],[[9804,3438],[-2,-2],[-2,-2],[-1,-2]],[[9799,3432],[-1,-3],[-1,-3],[-1,-3]],[[9796,3423],[-1,-15],[-4,-20],[-1,-39]],[[9790,3349],[-1,-6]],[[9789,3343],[-2,-5],[-1,-6]],[[9786,3332],[-18,-45]],[[9768,3287],[-1,-4],[-1,-4],[-1,-4]],[[9765,3275],[0,-3],[0,-3]],[[9765,3269],[0,-5],[1,-5]],[[9766,3259],[1,-4],[1,-5]],[[9768,3250],[3,-8]],[[9771,3242],[2,-3],[1,-3]],[[9774,3236],[1,-1]],[[9775,3235],[2,-3]],[[9777,3232],[2,-3]],[[9779,3229],[8,-8],[8,-9],[2,-1],[10,-9],[16,-13],[10,-10],[13,-14],[5,-6],[1,1],[14,-17],[13,-19],[4,-6]],[[9883,3118],[2,-1],[1,1],[1,0]],[[9887,3118],[1,0],[1,1],[1,0]],[[9890,3119],[-2,-1],[2,-2],[-7,-9],[3,-8]],[[9886,3099],[2,-3],[2,-3],[3,-3]],[[9893,3090],[23,-21],[30,-27],[32,-26]],[[9978,3016],[3,-2],[3,-2],[4,-1]],[[9988,3011],[3,-1],[4,-1],[4,0]],[[9999,3009],[-5,-5],[-1,-1],[-2,-3],[-13,-8],[-12,-7],[-10,-10],[-6,0],[-1,-3],[2,-1],[-4,-7],[-3,-2]],[[9944,2962],[-4,-4]],[[9940,2958],[-5,-4]],[[9935,2954],[-6,-3]],[[9929,2951],[-5,-3]],[[9924,2948],[-6,-3]],[[9918,2945],[-6,-2],[-26,-9],[-29,-7],[-22,-5]],[[9835,2922],[-2,-1]],[[9833,2921],[-3,-1],[-2,-1],[-3,-2]],[[9825,2917],[-2,-3],[-2,-3],[-2,-3]],[[9819,2908],[-2,-7],[-1,-2]],[[9816,2899],[-1,-1],[0,-1],[-1,-1],[-1,-1],[-1,0]],[[9812,2895],[-1,-1],[-1,0],[-1,0],[-1,0],[-1,0]],[[9807,2894],[-20,7],[-39,7]],[[9748,2908],[-4,0],[-4,1]],[[9740,2909],[-4,1],[-4,2]],[[9732,2912],[-35,13]],[[9697,2925],[-2,0],[-2,0],[-2,0]],[[9691,2925],[-2,-1],[-2,-1],[-1,-1]],[[9686,2922],[-1,1],[-4,1],[0,13],[-2,1],[-22,2],[-22,-2],[-26,-2],[-4,-1],[-1,11],[0,8],[-3,19]],[[9601,2973],[-4,-1],[-5,-2]],[[9592,2970],[-4,0],[-5,-1]],[[9583,2969],[-17,0]],[[9566,2969],[-5,-1],[-4,0]],[[9557,2968],[-14,-4]],[[9543,2964],[-5,0],[-5,-1],[-5,0]],[[9528,2963],[-5,1],[-5,1],[-5,2]],[[9513,2967],[-16,7],[-11,6]],[[9486,2980],[-3,1],[-4,2],[-4,0],[-4,1]],[[9471,2984],[-7,-1],[-1,-2]],[[9463,2981],[-2,2],[-3,2],[-3,1]],[[9455,2986],[-2,1],[-3,1],[-2,0]],[[9448,2988],[-3,-1],[-2,0],[-2,-1],[-2,-2]],[[9439,2984],[-2,-1]],[[9437,2983],[-2,-2]],[[9435,2981],[-1,-3]],[[9434,2978],[-4,-6],[-1,-3]],[[9429,2969],[-2,-3],[-3,-3],[-2,-3]],[[9422,2960],[-2,3],[-1,1],[-6,-2],[-5,-5],[-11,1],[-3,-2],[-17,0],[-4,2],[-8,2],[-4,-3],[-3,0],[-4,1],[-3,-4],[-5,-1],[0,5],[-3,2],[-4,-2],[-2,2],[-1,-1],[-4,2],[-2,4],[-11,1],[-9,5],[-3,2],[-18,4],[-7,1],[-6,-1],[-1,6],[-3,0],[-5,-3],[-7,-7],[-7,0],[-6,-7],[-3,-2],[0,-4],[-1,-2],[-1,0],[-12,-11],[-5,2],[-5,0],[-3,-3],[-2,-5],[-5,-1],[-1,0],[-2,-3],[-2,-5],[-3,-12],[-6,-5],[-3,-1],[-4,-5],[-11,-4],[-6,1],[-5,-6],[-8,-1],[-7,-3],[-5,5],[-6,1],[-8,-2],[-8,4],[-3,-1],[-2,-5],[-5,2],[-12,7],[-5,2],[-6,-2],[-5,1],[-6,-4],[-5,2],[-18,-2],[-8,-1],[-8,-6],[-6,5],[-6,-2],[-1,-2],[-9,-5],[-17,0],[-10,2],[-5,2],[-8,-1],[-4,2],[-7,1],[-2,2],[-8,1],[-8,0],[-5,4],[-20,6],[-8,1],[-11,6],[-7,-2],[-14,0],[-10,-1],[-6,-1],[-7,3],[-8,-4],[-5,1],[-6,-7],[-11,-10],[-4,-6],[-17,-6],[-4,-1],[-1,-1],[1,-5],[0,-1],[-5,-1],[-6,3],[-1,0],[-5,-12],[-4,-2],[-8,-2],[-2,-8],[-1,-8],[-2,-2],[-8,-3],[-9,-15],[1,-5],[-5,-10],[-8,-11],[-3,-2],[-5,-7],[9,-11],[-1,-4],[-5,-7],[-4,-2],[-5,-15],[4,-5],[0,-7],[-2,-6],[4,-5],[1,-6],[0,-4],[-3,-8],[0,-5],[-2,-3],[3,-5],[-1,-7],[-1,-4],[0,-18],[0,-3],[-3,1],[-6,-1],[-12,-3],[-14,0],[-21,-1],[-4,0],[-7,-1],[-5,1],[-7,2],[-5,2],[-6,5],[-4,4],[-9,11],[-7,5],[-6,0],[-4,0],[-4,0],[-7,1],[-3,0],[-17,4],[-3,1],[-5,4],[-8,8],[-4,5],[-5,3],[-8,2],[-7,8],[-5,0],[-5,-1],[-6,1],[-8,1],[-9,1],[-8,-1],[-2,-1],[-10,-1],[-4,0],[-5,5],[-7,7],[-8,6],[-7,1],[-11,0],[-10,-4],[-7,-4],[-17,-9],[-3,0],[-4,2],[-4,0],[-3,-1],[-2,-1],[-8,-6],[-6,1],[-4,4],[0,7],[-3,7],[-6,2],[-6,5],[-6,2],[-8,0],[-13,-3],[-8,6],[-1,7],[-5,5],[-4,1],[-5,-1],[-5,-3],[-9,-7],[-10,-7],[-11,-8],[-4,2],[-9,4],[-9,7],[-16,-8],[-5,-1],[-8,-4],[-4,-1],[-3,1],[-4,5],[-4,10],[-1,3],[-2,5],[-2,8],[-3,7],[-7,7],[-6,3],[-5,2],[-8,2],[-8,0],[-11,-1],[-6,1],[-8,1],[-6,2],[-10,6],[-10,7],[-6,6],[-1,4],[-3,11],[0,5],[-1,5],[-2,4],[-6,8],[-7,5],[-9,8],[-5,7],[-3,3],[-2,2],[-8,4],[-7,-1],[-4,-4],[-8,-6],[-5,-10],[-7,-10],[-3,-8],[-6,-4],[-5,0],[-7,5],[-3,5],[-4,3],[-7,-1],[-9,0],[-8,2],[-7,0],[-7,-1],[-2,-1],[-12,1],[-10,-5],[-6,1],[-8,3],[-8,2],[-10,1],[-14,3],[-5,6],[-5,6],[-4,1],[-2,0],[-5,-3],[-4,-9],[-2,-9],[-5,-9],[-10,-4],[-7,1],[-8,4],[-8,4],[-7,6],[-7,1],[-10,-3],[-7,-1],[-5,3],[-7,3],[-1,-3]],[[5682,4002],[1,1],[0,15],[-1,8],[4,6],[1,1],[9,15],[4,6],[4,6],[12,-8],[5,-2],[11,12],[9,9],[15,14],[13,14],[3,2],[1,2],[-11,14],[-10,13],[-8,11],[-9,11],[15,17],[19,22],[22,24],[4,0],[-7,8],[-14,17],[-4,6],[-2,2],[-7,9],[-1,1],[0,-1],[-2,3],[1,0],[-1,2],[-1,-1],[-6,8],[0,1],[-19,23],[-4,6],[-12,14],[0,1],[-14,18],[-3,4],[-12,13],[6,9],[11,18],[5,8],[2,1],[13,20],[9,14],[14,24],[-4,3],[9,14],[8,14],[1,1],[2,3],[8,14],[11,17],[5,8],[1,2],[1,3],[1,2],[1,4]],[[5791,4528],[0,4]],[[5791,4532],[0,4]],[[5791,4536],[0,5]],[[5791,4541],[-1,4]],[[5790,4545],[0,5]],[[5790,4550],[-2,4]],[[5788,4554],[-4,15]],[[5784,4569],[-9,24],[-11,38],[-4,16],[-3,9],[-5,24]],[[5752,4680],[-4,16]],[[5748,4696],[-4,15]],[[5744,4711],[-3,10],[-20,68],[-4,13]],[[5717,4802],[-1,6],[-2,5]],[[5714,4813],[-1,8]],[[5713,4821],[-1,3]],[[5712,4824],[0,2],[0,2],[1,2]],[[5713,4830],[1,2],[1,1],[1,2]],[[5716,4835],[-6,7]],[[5710,4842],[0,1],[-1,0]],[[5709,4843],[0,1]],[[5709,4844],[-2,6],[1,0],[-1,3],[-1,0],[-8,20],[-8,29],[-13,44]],[[5677,4946],[0,1],[0,1]],[[5677,4948],[0,1]],[[5677,4949],[-5,20]],[[5672,4969],[0,-1],[1,-1],[0,-1],[1,-1],[1,0]],[[5675,4965],[1,-1],[1,0],[1,0],[1,1],[1,0]],[[5680,4965],[11,6],[12,8],[10,5],[30,15],[22,10]],[[5765,5009],[4,2]],[[5769,5011],[7,4]],[[5776,5015],[6,4]],[[5782,5019],[2,1]],[[5784,5020],[5,5]],[[5789,5025],[6,5]],[[5795,5030],[1,2],[6,4]],[[5802,5036],[2,3],[2,2],[2,4],[1,3]],[[5809,5048],[1,3],[0,4],[-1,3],[0,4]],[[5809,5062],[8,3],[1,-2],[-1,0],[1,-1],[0,-1],[1,-1],[1,0],[-1,1],[1,1],[-1,0],[2,1],[-1,1],[7,7],[-1,1],[1,1],[-1,2],[11,11],[2,3],[0,1],[3,2],[-1,1],[3,2],[-1,1],[2,2],[3,3],[6,6],[8,10],[16,19],[2,3],[5,6]],[[5885,5145],[0,1]],[[5885,5146],[0,0]],[[5885,5146],[0,1]],[[5885,5147],[1,1]],[[5886,5148],[0,0]],[[5886,5148],[9,12],[13,17],[1,-1],[5,8],[5,7],[3,4],[-12,11],[-7,8],[-7,7],[-1,1],[-6,6],[-2,3],[-2,2],[-6,6],[-7,9],[-8,9],[-6,9],[-3,4],[-10,14],[-1,1],[-8,15],[-9,16],[-1,-1]],[[5826,5315],[-4,6]],[[5822,5321],[-5,6]],[[5817,5327],[-4,4],[-33,36],[-2,19],[6,-2],[3,1],[15,11],[2,2],[6,4],[3,2],[9,7],[11,8],[1,1],[18,18],[7,6],[10,9],[10,8],[12,13],[6,6],[9,11],[5,4],[3,4],[1,-1],[5,5],[8,3]],[[5928,5506],[0,-1]],[[5928,5505],[1,0]],[[5929,5505],[0,0]],[[5929,5505],[1,0]],[[5930,5505],[1,-1]],[[5931,5504],[0,0]],[[5931,5504],[1,0]],[[5932,5504],[0,1]],[[5932,5505],[1,0]],[[5933,5505],[1,0]],[[5934,5505],[4,3],[10,10],[-2,2],[11,11],[1,-1]],[[5958,5530],[0,-1],[1,0],[1,0]],[[5960,5529],[1,0],[1,1]],[[5962,5530],[4,4]],[[5966,5534],[0,1]],[[5966,5535],[0,0]],[[5966,5535],[0,0]],[[5966,5535],[1,0]],[[5967,5535],[0,1]],[[5967,5536],[0,0]],[[5967,5536],[-1,3]],[[5966,5539],[0,2]],[[5966,5541],[-1,2]],[[5965,5543],[-1,2]],[[5964,5545],[0,1]],[[5964,5546],[0,0]],[[5964,5546],[0,0]],[[5964,5546],[0,1]],[[5964,5547],[0,1],[1,0]],[[5965,5548],[-1,12],[4,5],[17,16],[1,1],[16,16],[4,5],[3,2],[2,3],[19,20],[7,8],[6,7],[10,10],[6,8],[1,3],[4,2],[4,7],[5,13],[2,10],[0,3],[2,10],[1,6],[1,8],[3,9],[0,1],[4,8],[16,21],[-7,5],[6,6],[-3,3],[1,1],[1,1],[9,16],[5,9],[5,8],[4,2],[22,13],[31,18],[1,-3],[31,1],[10,-2],[9,-2],[8,9],[17,22],[21,27],[12,14],[20,16],[11,16],[8,13],[19,19],[20,20],[10,-12],[10,-10],[11,-15],[24,-28],[21,-17],[8,-7],[31,-27],[2,-4],[-1,-4],[18,20],[23,37],[4,7],[4,12],[2,8],[12,32],[24,27],[23,26],[23,26],[3,2],[-1,2],[9,0],[7,5],[2,2],[2,4],[30,21],[22,16],[7,6],[6,9],[14,26],[16,28],[43,30],[44,29]],[[7616,5949],[17,0],[40,2],[3,0],[7,0],[1,0],[0,8],[-1,6],[0,11],[1,5],[1,5],[-1,6],[-3,4],[1,8],[4,5],[3,8],[0,10],[1,4],[3,2],[3,4],[3,9],[2,9],[4,12],[4,4],[1,3],[-1,2],[0,6],[4,10],[2,5],[-1,6],[2,3],[5,3],[4,6],[2,6],[7,7],[2,3],[1,0],[2,-1],[29,-9],[19,-4],[16,-4],[21,-1],[5,0],[1,0],[0,-8],[1,-5],[-1,-1],[-3,-1],[-2,-2],[-1,-1],[0,-4],[3,-13],[0,-1],[1,0],[5,-6],[1,-4],[-1,-2],[0,-1],[1,-1],[2,-2],[10,-9],[2,-3],[2,-4],[3,-2],[6,-14],[2,-3],[2,-8],[1,-1],[5,-2],[0,-3],[-1,-4],[-12,-32],[-24,-59],[68,-33],[3,-2],[20,-9],[37,-19],[11,-6],[9,-5],[27,-14],[11,-7],[8,-5],[15,-9],[3,-1],[0,2],[17,-7],[6,-2],[19,-10],[18,-9],[17,-11],[15,-11],[15,-14],[10,-12],[14,-16],[-2,-11],[-3,-25],[29,-1],[2,0],[-7,-20],[-2,-5],[-3,-8],[-6,-13],[-6,-17],[-5,-8],[-2,-3],[-14,-18],[-29,14],[-15,6],[-16,5],[-18,9],[-30,18],[-21,-41],[-8,-17],[-10,-25],[-14,9],[-12,7],[-7,-21],[1,-2],[14,-4],[27,-8],[28,-8],[11,-3],[-1,-4],[22,-6]],[[4782,5782],[46,-41],[141,-126],[43,-37],[107,-96]],[[5119,5482],[-21,-26],[5,-15],[2,-7],[2,1],[8,-30],[-1,0],[1,-5],[1,1],[2,-10],[2,-9],[4,-20],[2,-19],[2,-20],[1,-19],[-1,-12],[0,-8],[-1,-19],[-3,-20],[-3,-19],[-4,-19],[-1,-2],[-4,-14],[-3,2],[-12,-32],[-2,-6]],[[5095,5155],[-42,32],[-7,-18],[-1,1],[-4,2]],[[5041,5172],[-5,3]],[[5036,5175],[-5,2]],[[5031,5177],[-16,7],[1,3],[-21,8]],[[4995,5195],[0,1],[1,0],[0,1],[0,1]],[[4996,5198],[0,1],[-1,1]],[[4995,5200],[-3,1],[-30,13],[-1,2],[-57,23],[-50,21],[-51,22],[-50,21],[-40,17],[-41,17],[1,1],[-18,8],[-3,-3],[-18,8],[-28,12],[1,1],[4,9],[0,1],[-16,7],[-5,1],[-4,1]],[[4586,5383],[0,-1]],[[4586,5382],[1,0]],[[4587,5382],[0,-1]],[[4587,5381],[1,-1],[0,-1],[0,-1],[0,-1]],[[4588,5377],[0,-1],[0,-1],[-1,0]],[[4587,5375],[-2,-2]],[[4585,5373],[-3,-3]],[[4582,5370],[-3,-3]],[[4579,5367],[-3,-3]],[[4576,5364],[-2,-4]],[[4574,5360],[-2,-4]],[[4572,5356],[-2,-4]],[[4570,5352],[-2,-3],[-19,7],[8,20],[-10,14]],[[4547,5390],[0,1],[0,1]],[[4547,5392],[0,1]],[[4547,5393],[-14,20],[-4,3],[-2,3],[-83,42]],[[4444,5461],[-4,2]],[[4440,5463],[-6,2],[-7,3],[-6,2]],[[4421,5470],[-11,2]],[[4410,5472],[-5,1],[-4,2]],[[4401,5475],[-5,1]],[[4396,5476],[-7,3],[-7,3]],[[4382,5482],[-5,3],[-4,3]],[[4373,5488],[-6,6]],[[4367,5494],[-5,5]],[[4362,5499],[-5,6]],[[4357,5505],[-18,8],[-13,5],[-149,62],[-89,36]],[[4088,5616],[-81,33],[-36,15],[-30,13],[-26,11],[2,1],[0,1],[-4,2],[-15,6],[-1,-1],[-3,1],[-40,16],[-22,8],[-16,7],[-35,15],[-16,7],[-2,1],[-20,8],[-22,9],[-42,18],[-43,27],[-10,7],[-21,23]],[[3605,5844],[-4,6],[-3,6],[-4,7]],[[3594,5863],[-2,5],[-2,6]],[[3590,5874],[-1,5],[-2,4]],[[3587,5883],[-5,20]],[[3582,5903],[-2,6],[-2,6]],[[3578,5915],[-3,6],[-3,6]],[[3572,5927],[-3,6],[-3,5]],[[3566,5938],[-4,6],[-4,5]],[[3558,5949],[-5,6],[-5,6]],[[3548,5961],[-6,6],[-5,6]],[[3537,5973],[-2,12],[-7,4],[-2,0],[1,-7],[4,-20],[-35,-14],[-18,7],[-46,18],[-17,7],[-48,9],[-14,7],[-8,3],[-15,7],[-21,10]],[[3309,6016],[-5,4],[-5,4],[-5,5]],[[3294,6029],[-9,-11],[-42,17],[-28,16],[-13,9],[-12,11],[-58,63],[-13,12],[-15,10],[-13,7],[-29,13],[-92,41]],[[2970,6217],[-133,59],[35,0],[36,0],[36,0],[37,-1],[36,0]],[[3017,6275],[4,0],[5,1]],[[3026,6276],[5,0],[4,1]],[[3035,6277],[6,1]],[[3041,6278],[17,14],[20,21],[16,17]],[[3094,6330],[-4,5],[-5,5]],[[3085,6340],[-32,36]],[[3053,6376],[-2,2],[-2,3],[-1,2]],[[3048,6383],[-2,3],[-1,3],[0,3]],[[3045,6392],[-1,2],[0,3],[0,3],[1,2]],[[3045,6402],[1,3],[1,2],[2,2],[2,2]],[[3051,6411],[3,2]],[[3054,6413],[4,2]],[[3058,6415],[3,1]],[[3061,6416],[4,1]],[[3065,6417],[14,4]],[[3079,6421],[8,1],[7,2]],[[3094,6424],[7,0]],[[3101,6424],[8,1]],[[3109,6425],[18,2],[37,3],[29,2],[16,17],[14,1],[-4,4],[0,2],[4,18],[5,24],[1,2],[6,29]],[[1995,3303],[-11,10],[0,9],[-1,9],[-6,21],[-21,42],[-38,42],[-20,18],[-30,18],[-26,13],[-27,16],[-24,14],[-29,11],[-6,4],[-22,14],[-35,-10],[-4,-2],[-2,0],[-31,-14],[-12,-7],[-11,-7],[-3,-1],[-3,-2],[-30,5],[-31,9],[-32,10],[-25,5],[-19,4],[-22,3],[-29,9],[-14,-5],[-36,4],[-27,15],[-33,31],[-21,10],[-6,2],[-11,5],[-9,4],[-18,8],[-1,4],[-6,19],[-7,44],[-7,41],[-6,19],[-7,20],[-14,44],[-1,3],[-5,18],[-6,14],[-2,6],[4,7],[-10,7],[-57,43],[-49,31],[-18,10],[-6,3],[-26,18],[-9,6],[-16,14],[-3,2],[-14,15],[-14,25],[-1,5],[-4,10],[-2,8],[-7,-2],[-27,16],[-33,41],[-4,49],[-1,48],[17,32],[8,10],[6,5]],[[942,4255],[5,2],[5,2]],[[952,4259],[-4,13],[22,8],[0,1],[37,30],[15,12],[36,31],[3,2],[19,16],[6,4],[19,16],[6,5],[27,21],[4,2],[46,36],[16,12],[17,31],[8,15],[3,5],[11,21],[20,36],[0,22],[3,0],[0,20],[-3,25],[-4,17],[-7,35]],[[1252,4695],[-2,-1],[-85,-11],[-31,-7],[-29,-15],[-40,22],[-40,26],[-43,28],[-47,48],[-7,7],[-16,18],[-15,15],[-59,51],[-43,35],[-42,33],[-44,35],[-36,26],[-38,12],[-36,6],[-47,1],[-22,5],[-58,20],[-65,8],[-58,0],[-46,4],[-46,-1],[-45,0],[-34,3],[-39,16],[-77,78],[-36,37],[-26,51],[30,2],[45,2],[31,5],[28,5],[40,10],[31,7],[2,0],[4,1]],[[211,5277],[2,-2],[4,-2],[3,-2]],[[220,5271],[4,-1],[3,0],[4,0]],[[231,5270],[5,0],[5,0],[5,-1]],[[246,5269],[6,-1],[5,-1],[6,-2]],[[263,5265],[9,-3],[9,-4]],[[281,5258],[8,-3],[8,-4]],[[297,5251],[5,-2],[4,-2],[5,-1]],[[311,5246],[5,0]],[[316,5246],[5,0]],[[321,5246],[5,1]],[[326,5247],[4,2],[4,1]],[[334,5250],[4,1],[4,0]],[[342,5251],[3,1],[3,0]],[[348,5252],[2,1],[2,2]],[[352,5255],[7,4],[5,3]],[[364,5262],[5,3],[5,2],[5,2]],[[379,5269],[5,1],[6,2],[5,0]],[[395,5272],[16,3],[16,3]],[[427,5278],[15,4],[14,4]],[[456,5286],[6,1],[5,3]],[[467,5290],[4,3],[5,3]],[[476,5296],[3,3],[3,2]],[[482,5301],[4,2],[3,2]],[[489,5305],[3,131]],[[492,5436],[4,-4],[5,-4]],[[501,5428],[6,-3],[6,-3]],[[513,5422],[6,-2],[6,-2]],[[525,5418],[6,-1],[6,0]],[[537,5417],[24,-1]],[[561,5416],[4,-1],[5,1]],[[570,5416],[4,0],[4,1]],[[578,5417],[2,1],[3,2],[2,2],[2,2]],[[587,5424],[2,3],[1,3],[1,4],[0,3]],[[591,5437],[0,3]],[[591,5440],[0,3]],[[591,5443],[-1,3]],[[590,5446],[-2,3]],[[588,5449],[-1,3]],[[587,5452],[-2,2]],[[585,5454],[-4,6],[-4,5],[-5,5]],[[572,5470],[-6,6],[-6,5],[-6,5]],[[554,5486],[-7,4]],[[547,5490],[-5,4]],[[542,5494],[-3,3],[-3,3],[-2,3],[-2,4]],[[532,5507],[3,1],[2,1],[2,1],[2,2],[2,2]],[[543,5514],[1,2],[0,3],[1,2],[0,3],[-1,2]],[[544,5526],[-6,21],[29,15],[9,26],[14,20],[25,34],[24,32],[19,33],[20,35],[14,37],[7,18],[5,14],[21,27],[6,29],[8,36],[5,15],[-9,7],[41,58],[94,132],[1,2],[19,26],[76,68],[2,1],[16,-13],[5,-4],[5,0],[16,4],[7,-1],[7,-3],[29,-24],[12,-8],[19,-11],[1,2],[-2,2],[2,2],[-4,8],[-6,17],[-6,20],[0,8],[6,24],[5,32],[1,3],[2,12],[2,8],[0,4],[1,3],[1,7],[3,14],[1,8],[3,15],[-2,9],[-1,4],[-2,5],[-3,9],[-2,4],[-3,6],[-5,11],[-6,6],[-3,3],[-4,3],[-3,2],[-4,3],[-1,0],[-7,5],[-9,5],[-2,1],[-9,4],[-2,1],[-8,5],[-1,1],[-7,8],[-15,17],[-1,1],[-8,9],[-4,5],[-2,2],[-1,2],[-16,20],[-13,21],[-2,4],[0,1],[3,23],[16,-5],[4,-2],[6,-7],[4,-1],[33,-4],[56,-8],[11,-2],[3,0],[8,2],[1,0],[7,-1],[4,-1],[2,-1],[7,-2],[8,-1],[5,-1],[11,-4],[11,-4],[9,0],[3,-1],[10,-5],[6,-2],[5,-2],[2,-1],[8,-4],[6,-3],[4,-3],[10,-6],[6,-3],[4,-3],[10,-6],[3,-2],[6,-5],[9,-6],[4,5],[3,5],[6,2],[1,2],[4,5],[2,3],[7,12],[13,-8],[2,-2],[9,-5],[15,-10],[3,-2],[14,-8],[12,-8],[3,-2],[10,17],[-32,20],[3,4]],[[1328,6477],[-2,3]],[[1326,6480],[-2,4]],[[1324,6484],[-1,3]],[[1323,6487],[-1,3]],[[1322,6490],[-1,4]],[[1321,6494],[-1,3]],[[1320,6497],[-1,5],[1,5],[0,5],[1,4],[2,5],[2,4]],[[1325,6525],[0,1]],[[1325,6526],[1,0]],[[1326,6526],[2,4],[2,3]],[[1330,6533],[3,3],[2,2]],[[1335,6538],[4,2]],[[1339,6540],[3,2]],[[1342,6542],[3,2]],[[1345,6544],[4,2]],[[1349,6546],[4,1],[5,1]],[[1358,6548],[5,1],[5,0]],[[1368,6549],[6,-1]],[[1374,6548],[7,0]],[[1381,6548],[7,-2]],[[1388,6546],[7,-1]],[[1395,6545],[4,-1]],[[1399,6544],[3,-1]],[[1402,6543],[4,-2]],[[1406,6541],[3,-2]],[[1409,6539],[14,41],[13,41],[-265,110],[1,4],[-26,11],[-26,11],[-26,11],[-52,21],[-26,11],[-49,21],[0,2],[11,29],[0,1],[14,39],[4,10],[108,-43],[22,61],[4,12],[-34,14],[-74,29],[6,15],[75,209],[7,33]],[[1110,7232],[12,-1],[13,-2]],[[1135,7229],[12,-1]],[[1147,7228],[12,0]],[[1159,7228],[13,-1],[12,0]],[[1184,7227],[13,1]],[[1197,7228],[12,0],[13,1]],[[1222,7229],[12,2]],[[1234,7231],[12,2],[12,2]],[[1258,7235],[11,2],[10,2]],[[1279,7239],[213,53]],[[1492,7292],[11,2],[10,2]],[[1513,7296],[18,4],[19,3]],[[1550,7303],[18,3],[19,2]],[[1587,7308],[14,1],[14,1]],[[1615,7310],[15,0]],[[1630,7310],[16,1],[15,0]],[[1661,7311],[19,-1],[19,-1]],[[2970,6217],[-99,-86],[-3,-3],[-1,-4],[-28,-66],[-24,-59],[-20,-47],[38,-18],[39,-17],[38,-18],[38,-17],[-5,-12],[38,-17],[19,-8],[19,-9],[3,-2],[33,-15],[17,-8],[10,-4],[12,-6],[1,0],[11,-5],[12,-6],[10,-4],[6,-3],[5,-2],[14,-7],[12,-5],[6,-3],[6,-3],[12,-5],[10,-5],[10,-4],[8,-4]],[[3217,5745],[-1,0],[-1,0]],[[3215,5745],[-1,0]],[[3214,5745],[-1,0],[-1,0]],[[3212,5745],[0,-1],[-1,-1]],[[3211,5743],[-8,-10],[-26,-31],[-10,-12],[-1,0],[-21,-24],[-27,-34]],[[3118,5632],[-1,-1],[-1,-2],[0,-1],[0,-2],[0,-1]],[[3116,5625],[0,-2],[1,-1],[1,-2],[1,-1],[1,-1]],[[3120,5618],[-13,8],[-10,-12],[0,-1],[34,-22],[32,-22],[32,-21],[32,-21],[27,-18]],[[3254,5509],[1,-1]],[[3255,5508],[1,-1]],[[3256,5507],[1,-1]],[[3257,5506],[0,-1]],[[3257,5505],[1,-1]],[[3258,5504],[0,-2]],[[3258,5502],[0,-1]],[[3258,5501],[0,-1]],[[3258,5500],[0,-2]],[[3258,5498],[-1,-1]],[[3257,5497],[0,-1]],[[3257,5496],[-1,-1]],[[3256,5495],[-13,-16],[-25,-30],[-24,-30],[-25,-29],[-20,-25]],[[3149,5365],[-2,-2]],[[3147,5363],[-2,-1]],[[3145,5362],[-2,-2]],[[3143,5360],[-3,-1]],[[3140,5359],[-3,0]],[[3137,5359],[-2,0]],[[3135,5359],[-14,0],[-19,-17],[1,-5],[7,-27]],[[4576,4280],[20,20],[8,9],[9,9],[8,10],[8,10],[7,10],[8,10],[7,11],[6,10],[7,11],[6,11],[6,11],[5,11],[-4,3],[3,6],[-2,1],[8,18],[1,-1],[8,22],[16,36],[7,17],[4,11],[12,27],[4,9],[11,27],[3,7],[6,14],[-1,0]],[[4757,4620],[4,11],[2,4],[2,4],[14,36],[4,9],[4,9],[1,-1],[1,2],[5,9],[19,34],[4,-2],[31,49],[1,2],[-2,1],[3,3],[1,-1],[2,4],[17,26],[8,12],[8,11],[7,7],[34,32],[1,1],[-4,2],[12,14],[8,9],[2,-2],[7,7],[-1,1],[1,1],[44,47],[16,22],[8,10],[20,29]],[[5041,5022],[3,4]],[[5044,5026],[2,4]],[[5046,5030],[0,1],[4,9],[2,4],[5,13],[6,13],[26,71],[6,14]],[[5119,5482],[23,-20],[14,-23],[28,-45],[27,-60],[67,-142]],[[5278,5192],[15,6],[1,0],[10,4],[2,1],[14,5],[15,3],[16,6],[3,-9],[2,-7],[8,-28],[7,-29],[3,-9],[2,-10],[1,-11],[12,12],[13,1],[5,0],[4,0],[6,1],[1,0]],[[5418,5128],[1,0],[1,1]],[[5420,5129],[13,8],[4,2],[14,10],[15,8]],[[5466,5157],[1,-2],[0,-1],[16,-16],[1,1],[3,-8],[2,-5],[1,-3],[3,-8],[2,-2],[4,-11],[4,-9],[1,-4],[5,-10],[8,-19],[0,-1],[1,-1],[10,-26],[24,-58]],[[5552,4974],[1,-2]],[[5553,4972],[2,-2]],[[5555,4970],[1,-1]],[[5556,4969],[2,-1]],[[5558,4968],[1,-1],[1,-1],[1,0],[26,9]],[[5587,4975],[1,1]],[[5588,4976],[1,1]],[[5589,4977],[-1,1],[11,4],[41,13],[3,-2],[20,6],[9,-30]],[[3017,6275],[3,0],[6,1]],[[3026,6276],[3,0],[6,1]],[[3035,6277],[2,0],[4,1]],[[3094,6330],[-3,3],[-6,7]],[[3053,6376],[-1,1],[0,1]],[[3052,6378],[-1,1],[-1,0],[0,1],[-1,1]],[[3049,6381],[-1,2]],[[3048,6383],[-1,1],[0,1]],[[3047,6385],[-1,1],[0,1],[0,1],[-1,1]],[[3045,6389],[0,3]],[[3045,6392],[-1,0],[0,1]],[[3044,6393],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1]],[[3044,6401],[1,1]],[[3045,6402],[0,1]],[[3045,6403],[1,1],[0,1],[0,1],[1,0],[0,1],[1,1],[1,1],[0,1],[1,0]],[[3050,6410],[1,1]],[[3051,6411],[1,1],[1,0]],[[3053,6412],[1,1]],[[3054,6413],[1,1]],[[3055,6414],[3,1]],[[3058,6415],[1,0],[1,1]],[[3060,6416],[1,0]],[[3061,6416],[1,1]],[[3062,6417],[3,0]],[[3079,6421],[5,1],[10,2]],[[3094,6424],[2,0],[5,0]],[[3101,6424],[2,1],[6,0]],[[3235,6529],[4,0],[7,-2]],[[3257,6525],[24,-2]],[[3610,6498],[28,-4]],[[3652,6491],[28,-8]],[[3694,6478],[27,-11]],[[3734,6460],[25,-14]],[[4475,6090],[-1,-29],[6,-7],[2,-2],[2,-1],[-1,-2],[1,0],[-2,-6],[-1,-1],[-2,-5],[0,-2],[-17,-8],[3,-12],[-5,1],[-5,1],[-8,-4]],[[4447,6013],[0,0]],[[4447,6013],[-1,0],[0,-1],[-1,0]],[[4445,6012],[0,0]],[[4445,6012],[0,-1]],[[4445,6011],[-1,0],[0,-1]],[[4444,6010],[-1,0]],[[4443,6010],[-2,-6],[-9,-20],[-11,-26]],[[4421,5958],[0,0]],[[4421,5958],[0,-1]],[[4421,5957],[0,-1]],[[4421,5956],[-1,0],[0,-1]],[[4420,5955],[1,-1]],[[4421,5954],[0,0]],[[4421,5954],[1,-5],[-6,4],[-2,2],[-12,-11],[9,-8],[10,-9],[-11,-13],[-11,-10],[-11,-10],[-13,-10],[-1,0],[-3,-2],[-18,-4]],[[4353,5878],[1,0]],[[4354,5878],[0,-1],[0,-1]],[[4354,5876],[0,0]],[[4354,5876],[0,0]],[[4354,5876],[0,-1],[0,-1],[-1,0]],[[4353,5874],[0,0]],[[4353,5874],[-10,-7],[-33,-17],[-23,-11],[-10,-5],[-34,-18],[-1,0],[3,-2],[-14,-7],[-15,-9],[-14,-8],[-13,-9],[-12,-10],[-6,-5],[-7,-7],[-2,-2],[-5,-6],[-1,-1],[-4,-3],[-6,-7],[-9,-13],[-9,-13],[-8,-15],[-4,-7],[-6,2],[-21,-57],[-1,-3],[0,-18]],[[3605,5844],[-3,3],[-2,4]],[[3600,5851],[-2,4]],[[3598,5855],[-4,8]],[[3594,5863],[-1,3],[-3,8]],[[3590,5874],[-1,3],[-2,6]],[[3582,5903],[-1,4],[-2,4]],[[3579,5911],[-1,4]],[[3578,5915],[-2,4]],[[3576,5919],[-4,8]],[[3572,5927],[-2,4],[-2,4]],[[3568,5935],[-2,3]],[[3566,5938],[-3,4]],[[3563,5942],[-5,7]],[[3558,5949],[-3,4],[-7,8]],[[3548,5961],[-4,4],[-7,8]],[[3309,6016],[-4,3],[-4,3]],[[3301,6022],[-7,7]],[[4489,7493],[2,-4],[4,-8]],[[4495,7481],[2,-4],[5,-7]],[[4502,7470],[2,-3],[5,-7]],[[4509,7460],[3,-4],[6,-6]],[[4538,7431],[0,0]],[[4538,7431],[0,-1],[1,0],[0,-1]],[[4539,7429],[1,-1]],[[4540,7428],[0,0]],[[4540,7428],[1,-1],[1,0]],[[4542,7427],[0,-1]],[[4591,7399],[2,-1],[4,-2]],[[4597,7396],[2,-2],[3,-2]],[[4653,7224],[0,-3],[0,-3]],[[4653,7218],[0,-3],[0,-3],[0,-3],[1,-3],[0,-3]],[[4654,7203],[1,-6]],[[4655,7197],[1,-2],[1,-3]],[[4659,7187],[1,-3],[1,-2]],[[4661,7182],[2,-3]],[[4663,7179],[3,-5]],[[4690,7137],[4,-6],[6,-11]],[[4700,7120],[3,-5],[6,-12]],[[4709,7103],[2,-5],[4,-10]],[[4715,7088],[0,-1],[1,-2]],[[4716,7085],[2,-6],[4,-12]],[[4730,7039],[1,-7],[3,-13]],[[4734,7019],[1,-2],[0,-4]],[[4735,7013],[1,-5],[1,-9]],[[4737,6999],[0,-7],[0,-14]],[[4744,6840],[1,-3],[2,-5]],[[4747,6832],[1,-3],[2,-5]],[[4751,6815],[0,0]],[[4751,6815],[0,-1],[0,-1],[0,-1],[-1,0],[0,-1],[0,-1],[-1,0],[0,-1]],[[4749,6809],[0,0]],[[4749,6809],[0,-1]],[[4749,6808],[-1,0],[0,-1],[-1,0],[-1,-1],[-1,0],[-1,0],[0,-1]],[[4744,6805],[-1,0]],[[4746,6795],[1,0]],[[4747,6795],[1,0],[1,0],[1,0],[0,-1],[1,0]],[[4751,6794],[0,0]],[[4751,6794],[0,0]],[[4751,6794],[0,-1],[1,0],[0,-1],[0,-1],[1,0],[0,-1]],[[4753,6790],[0,-1]],[[4753,6789],[0,-1]],[[4753,6788],[0,-1]],[[4753,6787],[0,-1],[-1,-2]],[[4752,6784],[0,-1],[0,-1]],[[4752,6782],[0,-1]],[[4752,6781],[0,0]],[[4752,6781],[0,-2]],[[4752,6779],[-1,0],[0,-1]],[[4751,6778],[0,-1],[-1,0]],[[4750,6777],[0,-1],[0,-1]],[[4750,6775],[-1,-1]],[[4775,6753],[-1,0],[-1,-2]],[[4773,6751],[-1,-1],[-2,-2]],[[4766,6705],[-1,-5],[-1,-10]],[[4764,6690],[-1,-5],[-2,-9]],[[4748,6602],[0,-2],[0,-1]],[[4748,6599],[-1,-1]],[[4747,6598],[0,-2],[0,-1],[0,-1]],[[4747,6594],[0,-2],[0,-1],[0,-2]],[[4747,6589],[1,-1]],[[4748,6588],[0,-3]],[[4748,6585],[0,-1],[1,-2]],[[4749,6582],[0,-1],[1,-1],[0,-2]],[[4750,6578],[1,-1],[0,-2],[1,-1]],[[4752,6574],[2,-2]],[[4795,6501],[1,-4],[4,-7]],[[4800,6490],[2,-3],[3,-8]],[[4869,6359],[0,0]],[[4869,6359],[0,0]],[[4869,6359],[0,0]],[[4869,6359],[0,0]],[[4869,6359],[1,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[1,0]],[[4871,6359],[0,0]],[[4871,6359],[0,0]],[[4871,6359],[0,0]],[[4972,5964],[0,-1]],[[4972,5963],[0,-1],[0,-1],[-1,0],[0,-1],[-1,0]],[[4970,5960],[0,0]],[[4970,5960],[0,0]],[[4970,5960],[-1,0],[-1,0],[-1,0],[0,1],[-1,0]],[[4966,5961],[0,0]],[[4958,5952],[0,-2],[1,-1]],[[4959,5949],[0,-2],[1,-1],[0,-2],[0,-1]],[[4960,5943],[1,-3]],[[4961,5940],[0,-2],[0,-1]],[[4961,5937],[0,-2]],[[4961,5935],[0,-2]],[[4961,5933],[-1,-3]],[[4960,5930],[0,-1],[0,-1]],[[4960,5928],[0,-2],[-1,-1]],[[4959,5925],[0,-2],[0,-1],[-1,-2],[-1,-1]],[[4957,5919],[-1,-3]],[[4955,5915],[-1,-3],[-4,-6]],[[4950,5906],[0,-1],[-1,-1]],[[4949,5904],[-3,-4],[-5,-6]],[[4900,5847],[0,0]],[[4900,5847],[-1,0],[0,-1],[-1,0],[-1,0],[0,-1],[-1,0]],[[4896,5845],[-1,0]],[[4846,5823],[-1,0],[-1,0]],[[4844,5823],[-2,0]],[[4842,5823],[-1,0]],[[4841,5823],[-2,0]],[[4817,5818],[-1,0]],[[4816,5818],[-1,0]],[[4815,5818],[0,0]],[[4815,5818],[-1,0]],[[4814,5818],[-1,0],[0,1]],[[4813,5819],[0,0]],[[3765,6442],[3,20],[0,1],[0,3],[3,19],[1,6],[0,1],[0,5],[0,12],[1,11],[0,6],[3,21],[0,8],[1,0],[1,10],[2,8],[2,11],[6,32],[2,6],[-4,2],[-3,1],[-5,2],[-3,2],[-3,0],[3,8],[1,2],[8,23],[2,3],[2,6],[-3,0],[-5,4],[0,1],[-1,0],[-2,8],[-2,0],[-4,9],[-2,6],[1,7],[-1,0],[-2,7],[-1,1],[-1,3],[-8,23],[-5,12],[-1,4],[-6,21],[-2,-1],[-1,7]],[[3742,6783],[1,0],[3,1]],[[3746,6784],[2,0],[5,2]],[[3753,6786],[2,0],[3,1]],[[3758,6787],[2,1],[3,0]],[[3763,6788],[12,4],[0,2],[-2,6],[-5,13],[-1,1],[-10,29],[-2,3],[-1,7],[-4,17],[-1,1],[-8,13],[-12,-3],[-6,8],[-3,7]],[[3720,6896],[1,1],[2,1]],[[3723,6898],[2,1],[2,1]],[[3727,6900],[37,17],[40,17],[14,14]],[[3818,6948],[0,1]],[[3818,6949],[0,1],[0,1],[1,0],[0,1],[1,0]],[[3820,6952],[0,0]],[[3820,6952],[3,2],[8,3]],[[3831,6957],[2,1],[2,1]],[[3835,6959],[1,1],[2,1]],[[3838,6961],[3,2]],[[3841,6963],[2,1],[1,1]],[[3844,6965],[1,2],[2,1]],[[3847,6968],[2,3]],[[3849,6971],[15,17]],[[3864,6988],[1,1],[1,2]],[[3866,6991],[1,1],[1,2]],[[3868,6994],[7,11],[3,3],[18,35],[3,5],[6,7]],[[3905,7055],[1,1],[1,2]],[[3907,7058],[0,1],[1,2]],[[3908,7061],[2,3]],[[3910,7064],[1,2],[0,1]],[[3911,7067],[1,2],[0,2]],[[3912,7071],[1,3]],[[3913,7074],[2,11]],[[3915,7085],[0,2],[1,2]],[[3916,7089],[0,2],[1,2],[1,1]],[[3918,7094],[1,4]],[[3919,7098],[1,1],[1,2]],[[3921,7101],[1,2],[1,1],[1,2]],[[3924,7106],[2,3]],[[3926,7109],[25,28]],[[3951,7137],[1,1],[1,1]],[[3953,7139],[1,2],[1,1],[1,2],[1,1],[1,1],[1,2],[0,1],[1,2]],[[3960,7151],[1,3]],[[3961,7154],[0,1],[1,2]],[[3962,7157],[65,102],[106,164],[41,63],[54,83],[11,-15],[12,-18],[17,-24],[12,-16],[12,-16],[9,-13],[13,-16],[4,3],[2,2],[15,12],[28,17],[2,1],[-4,24],[-1,42]],[[4444,7590],[-2,4],[-4,9]],[[4438,7603],[-1,5],[-3,9]],[[4413,7672],[-3,7],[-6,12]],[[4515,7819],[6,-8],[12,-15]],[[4667,7745],[0,-3],[1,-6]],[[4668,7736],[0,-2],[1,-3]],[[4669,7731],[0,-2]],[[4669,7729],[2,-5]],[[4671,7724],[1,-2],[0,-2]],[[4672,7720],[1,-2],[1,-2]],[[4694,7684],[0,-1]],[[4694,7683],[1,0],[0,-1]],[[4695,7682],[0,-1]],[[4695,7681],[0,0]],[[4695,7681],[0,-1],[0,-1],[-1,0]],[[4694,7679],[0,0]],[[4695,7679],[1,3],[3,5]],[[4699,7687],[1,3],[3,5]],[[4703,7696],[0,1],[1,3]],[[4968,7560],[0,1]],[[4968,7561],[1,0],[0,1],[1,0]],[[4970,7562],[0,0]],[[4970,7562],[0,1]],[[4970,7563],[1,0],[1,0]],[[4972,7563],[1,0]],[[5056,7534],[0,0]],[[5056,7534],[1,0],[0,-1]],[[5057,7533],[0,0]],[[5057,7533],[0,0]],[[5057,7533],[0,-1]],[[5057,7532],[0,0]],[[5060,7539],[1,2],[2,5]],[[5063,7546],[1,3],[2,5]],[[5077,7544],[-1,-1]],[[5076,7543],[0,-1],[0,-1],[0,-1],[0,-1],[0,-1],[0,-1]],[[5076,7537],[0,-1]],[[5076,7536],[0,-1],[1,0]],[[5077,7535],[0,-1],[0,-1],[1,-1],[0,-1],[1,0],[0,-1]],[[5079,7530],[1,-1]],[[5209,7386],[0,-1],[1,-1]],[[5210,7384],[1,0],[1,-1]],[[5212,7383],[2,-3],[4,-5]],[[5218,7375],[1,-1],[3,-4]],[[5222,7370],[2,-2],[3,-4]],[[5227,7364],[2,-1],[2,-4]],[[5231,7359],[3,-4],[6,-8]],[[5237,7342],[0,0]],[[5237,7342],[0,1],[-1,0],[0,1],[-1,0],[-1,0]],[[5234,7344],[0,0]],[[5234,7344],[-1,0]],[[5233,7344],[-1,0],[-1,0],[-1,0],[0,-1]],[[5230,7343],[0,0]],[[5230,7343],[-3,-2],[-5,-4]],[[5222,7337],[-2,-2],[-3,-3]],[[5217,7332],[-2,-1],[-3,-3]],[[5212,7328],[-2,-1],[-3,-2]],[[5207,7325],[-2,-2],[-4,-3]],[[5201,7320],[-3,-1],[-4,-4]],[[5263,7263],[-2,-1],[-2,-2]],[[5259,7260],[-2,-2],[-2,-1]],[[5532,7000],[1,0],[0,-1]],[[5533,6999],[1,0]],[[5534,6999],[0,-1]],[[5534,6998],[0,0]],[[5534,6998],[1,0]],[[5535,6998],[0,0]],[[5535,6998],[3,1],[5,2]],[[5543,7001],[2,0],[5,1]],[[5554,6969],[4,0],[4,0]],[[5569,6967],[2,0],[2,-1]],[[5573,6966],[1,0],[2,-1],[2,0]],[[5578,6965],[1,-1],[2,-1],[1,-1]],[[5582,6962],[3,-1]],[[5585,6961],[2,-1],[1,-2]],[[5588,6958],[1,-1],[2,-1],[1,-1]],[[5592,6955],[1,-1],[2,-2],[1,-1]],[[5596,6951],[2,-3]],[[5598,6948],[1,-1],[0,-1]],[[5599,6946],[1,-1],[0,-1],[1,-1]],[[5601,6943],[1,-2]],[[5602,6941],[0,-1],[1,-2]],[[5603,6938],[0,-1],[1,-1],[0,-1]],[[5604,6935],[0,-3]],[[5604,6932],[0,-2],[1,-5]],[[5605,6925],[0,-3],[-1,-5]],[[5631,6898],[-4,-5],[-7,-9]],[[5620,6884],[-3,-5],[-6,-10]],[[5611,6869],[-21,-37],[-23,-40],[-8,-14]],[[5559,6778],[-3,-6],[-7,-14]],[[5549,6758],[-4,-6],[-7,-14]],[[5538,6738],[-3,-6],[-7,-14]],[[5528,6718],[-3,-7],[-6,-14]],[[5519,6697],[-13,-38]],[[5506,6659],[-1,-3],[-2,-5]],[[5503,6651],[0,-2],[-2,-6]],[[5501,6643],[2,0],[12,-2],[4,-7],[5,-9],[-7,-14],[-4,-8],[-4,-10],[-2,-2],[-2,-11],[10,-2],[7,-16],[-13,-7],[-1,2],[-18,-9],[-3,3],[-2,-11],[-2,-1],[-3,-16],[0,-2],[-2,-14],[-2,-8],[-14,3],[-2,-11],[0,-3],[-4,-19]],[[5456,6469],[0,-2],[-1,-3]],[[5455,6464],[-1,-4],[-1,-8]],[[5453,6452],[2,-48],[1,-7],[0,-1],[1,-6],[3,-19],[0,-2],[0,-6],[2,-18],[2,-39],[1,-11],[0,-1],[1,-20],[2,-29],[0,-1],[1,-8],[2,-8],[0,-2],[3,-15],[1,-3],[4,-23]],[[5479,6185],[0,0]],[[5479,6185],[0,-1],[0,-1]],[[5479,6183],[0,0]],[[5479,6183],[0,0]],[[5479,6183],[0,-1],[-1,0]],[[5478,6182],[0,-1]],[[5478,6181],[2,-14]],[[5480,6167],[0,1]],[[5480,6168],[0,1],[-1,0]],[[5479,6169],[0,0]],[[5479,6169],[0,0]],[[5479,6169],[-1,0],[-1,0]],[[5477,6169],[0,0]],[[5477,6169],[-15,-14],[-4,-3],[-1,-2],[-2,-2],[-10,-10],[-3,-4],[-6,-6],[-6,-7],[11,-14],[7,4],[8,4],[16,-17],[1,-1],[-3,-3],[5,-6],[-6,-6],[1,-1],[8,-8],[9,-22],[5,-10],[7,-11],[3,-4],[8,-13],[-10,-11],[-2,-2],[-4,-4],[-19,-20],[-4,-4],[-3,-4],[-19,-19],[-19,-21]],[[5430,5928],[-1,0]],[[5429,5928],[-1,0],[0,-1],[-1,0],[-1,0]],[[5426,5927],[0,0]],[[5426,5927],[0,1]],[[5426,5928],[-1,0],[0,1],[-1,0]],[[5424,5929],[0,1]],[[5424,5930],[5,-20],[2,-13]],[[5431,5897],[0,-1]],[[5431,5896],[1,0],[0,-1],[0,-1],[1,-1]],[[5433,5893],[0,-1]],[[5433,5892],[-10,-12],[2,-3],[5,-10],[7,-13],[3,-4],[6,-12],[-2,-1],[-9,-6],[-12,-7],[-1,-1],[-13,-7],[-9,-6],[-1,-1],[10,-19],[-6,-4],[2,-2],[2,-2],[2,-7],[5,-21],[4,-17],[-2,-3],[-13,-3],[-10,-3],[6,-9]],[[5399,5719],[0,0]],[[5399,5719],[-1,0],[0,-1],[-1,0]],[[5397,5718],[0,-1]],[[5397,5717],[0,0]],[[5397,5717],[0,-1],[0,-1]],[[5397,5715],[0,0]],[[5397,5715],[8,-15],[4,-8],[2,-3],[6,-3],[6,-3],[11,-6],[15,-7],[1,0],[1,2],[1,-1]],[[5452,5671],[0,-1]],[[5452,5670],[-1,-1],[0,-1],[0,-1],[-1,-1]],[[5450,5666],[0,-1]],[[5450,5665],[0,-1]],[[5450,5664],[0,-1]],[[5450,5663],[0,-1]],[[5450,5662],[0,-1],[0,-1]],[[5450,5660],[0,0]],[[5450,5660],[0,-2]],[[5450,5658],[3,-11],[2,-11],[2,-10],[2,-8],[3,-17],[2,-7],[2,-10],[4,-17],[1,-5],[1,-9],[3,-13],[2,-11]],[[5477,5529],[0,0]],[[5477,5529],[0,-1]],[[5477,5528],[0,0]],[[5477,5528],[0,-1]],[[5477,5527],[-1,-1]],[[5476,5526],[0,0]],[[5476,5526],[-6,-4],[-4,-3]],[[5466,5519],[-1,0]],[[5465,5519],[0,-1],[-1,0]],[[5464,5518],[-1,0]],[[5463,5518],[-5,-6],[-11,9],[0,-1],[-10,-11],[3,-10],[1,-4],[2,-9],[2,-6],[2,-7],[3,-11],[-11,-9],[-1,-1],[12,-15],[2,2],[11,-14],[-12,-4],[0,-1],[7,-12]],[[5458,5408],[-1,0]],[[5457,5408],[0,1]],[[5457,5409],[-1,0]],[[5456,5409],[0,1]],[[5456,5410],[-1,0],[-1,0]],[[5454,5410],[0,0]],[[5454,5410],[-4,-1],[-17,-6],[-2,-1],[0,-3],[8,-22],[4,-16],[5,-15],[11,-35],[-4,-2],[4,-10],[2,-1],[9,-22],[0,-1],[2,-3],[9,-25],[7,-18],[3,-7],[2,-4],[3,-7],[5,-9],[1,-4],[8,-15],[1,-2],[-14,-7],[-3,-1],[-5,-3],[-12,-6],[-11,-7]],[[5420,5129],[0,-1]],[[5420,5128],[-1,0],[-1,0]],[[5418,5128],[0,0]],[[4813,5819],[0,0]],[[4814,5818],[1,0]],[[4815,5818],[0,0]],[[4816,5818],[1,0]],[[4839,5823],[1,0],[1,0]],[[4841,5823],[1,0]],[[4842,5823],[1,0],[1,0]],[[4844,5823],[2,0]],[[4895,5845],[1,0]],[[4900,5847],[0,0]],[[4941,5894],[3,3],[5,7]],[[4949,5904],[1,2]],[[4950,5906],[2,3],[3,6]],[[4956,5916],[1,2],[0,1]],[[4959,5925],[1,3]],[[4960,5928],[0,2]],[[4960,5930],[1,2],[0,1]],[[4961,5937],[0,3]],[[4961,5940],[-1,1],[0,2]],[[4959,5949],[-1,3]],[[4966,5961],[0,0]],[[4970,5960],[0,0]],[[4970,5960],[0,0]],[[4972,5963],[0,1]],[[4871,6359],[0,0]],[[4870,6359],[0,0]],[[4870,6359],[0,0]],[[4869,6359],[0,0]],[[4805,6479],[-2,4],[-3,7]],[[4800,6490],[-2,4],[-3,7]],[[4754,6572],[-1,1],[-1,1]],[[4749,6582],[-1,3]],[[4748,6585],[0,2],[0,1]],[[4748,6599],[0,3]],[[4761,6676],[1,5],[2,9]],[[4764,6690],[0,5],[2,10]],[[4770,6748],[1,1],[2,2]],[[4773,6751],[0,1],[2,1]],[[4749,6774],[0,1],[1,0]],[[4751,6778],[1,1]],[[4752,6779],[0,1],[0,1]],[[4752,6782],[0,2]],[[4752,6784],[0,1],[1,2]],[[4753,6787],[0,1]],[[4753,6788],[0,1]],[[4753,6789],[0,1]],[[4751,6794],[0,0]],[[4751,6794],[0,0]],[[4747,6795],[-1,0]],[[4743,6805],[1,0]],[[4749,6808],[0,1]],[[4749,6809],[0,0]],[[4751,6815],[0,0]],[[4750,6824],[-1,3],[-2,5]],[[4747,6832],[-1,2],[-2,6]],[[4737,6978],[0,7],[0,14]],[[4737,6999],[-1,4],[-1,10]],[[4735,7013],[0,2],[-1,4]],[[4734,7019],[-1,7],[-3,13]],[[4722,7067],[-2,6],[-4,12]],[[4716,7085],[0,1],[-1,2]],[[4715,7088],[-2,5],[-4,10]],[[4709,7103],[-3,6],[-6,11]],[[4700,7120],[-3,6],[-7,11]],[[4666,7174],[-2,2],[-1,3]],[[4661,7182],[-2,5]],[[4659,7187],[-1,2],[-1,3]],[[4655,7197],[0,3],[-1,3]],[[4653,7218],[0,6]],[[4602,7392],[-2,1],[-3,3]],[[4597,7396],[-2,1],[-4,2]],[[4542,7426],[0,1]],[[4540,7428],[0,0]],[[4540,7428],[-1,1]],[[4538,7431],[0,0]],[[4518,7450],[-3,3],[-6,7]],[[4509,7460],[-2,3],[-5,7]],[[4502,7470],[-2,4],[-5,7]],[[4495,7481],[-2,4],[-4,8]],[[3962,7157],[0,-1],[-1,-2]],[[3961,7154],[-1,-2],[0,-1]],[[3953,7139],[-2,-2]],[[3926,7109],[-1,-2],[-1,-1]],[[3921,7101],[-2,-3]],[[3919,7098],[-1,-2],[0,-2]],[[3916,7089],[-1,-4]],[[3913,7074],[0,-2],[-1,-1]],[[3911,7067],[-1,-3]],[[3910,7064],[-1,-2],[-1,-1]],[[3907,7058],[-2,-3]],[[3868,6994],[-1,-1],[-1,-2]],[[3866,6991],[-1,-1],[-1,-2]],[[3849,6971],[-1,-2],[-1,-1]],[[3844,6965],[-3,-2]],[[3841,6963],[-1,-1],[-2,-1]],[[3835,6959],[-4,-2]],[[3820,6952],[0,0]],[[3818,6949],[0,-1]],[[3727,6900],[-1,0],[-3,-2]],[[3723,6898],[-1,-1],[-2,-1]],[[3763,6788],[-2,0],[-3,-1]],[[3758,6787],[-2,0],[-3,-1]],[[3753,6786],[-2,-1],[-5,-1]],[[3746,6784],[-2,0],[-2,-1]],[[3747,6453],[-26,14]],[[3708,6472],[-28,11]],[[3667,6487],[-29,7]],[[3624,6496],[-29,4]],[[3269,6524],[-23,3]],[[3246,6527],[-4,1],[-7,1]],[[3235,6529],[-8,2],[-16,5]],[[3200,6539],[-23,9]],[[3166,6553],[-21,11]],[[3135,6570],[-20,13]],[[3105,6591],[-18,15]],[[3078,6614],[-17,18]],[[3053,6641],[-15,19]],[[2986,6731],[-14,17]],[[2965,6756],[-16,16]],[[2941,6780],[-17,14]],[[2915,6801],[-18,13]],[[2888,6820],[-19,11]],[[2860,6836],[-20,10]],[[2830,6850],[-21,7]],[[2799,6861],[-21,5]],[[2671,6891],[-25,4]],[[2633,6896],[-25,2]],[[2595,6898],[-25,-2]],[[2558,6895],[-26,-4]],[[2356,6856],[-21,-2]],[[2314,6854],[-21,2]],[[2273,6859],[-20,5]],[[2233,6870],[-20,8]],[[2194,6887],[-18,11]],[[2159,6911],[-16,13]],[[2127,6939],[-14,16]],[[2100,6972],[-12,18]],[[1973,7172],[-19,21]],[[1913,7231],[-23,16]],[[1843,7274],[-26,11]],[[1765,7300],[-27,5]],[[1738,7305],[-13,1],[-26,3]],[[1653,7459],[0,2],[0,2],[0,2],[0,2],[0,1],[0,2],[-1,2],[0,2],[0,1],[-1,2],[-1,2],[-1,3]],[[1649,7482],[0,1]],[[1649,7483],[-1,1],[-1,2]],[[1647,7486],[-1,2],[-1,3]],[[3265,8071],[0,0]],[[3265,8071],[1,0],[1,0]],[[3267,8071],[0,0]],[[3267,8071],[1,0]],[[3268,8071],[1,0]],[[3269,8071],[1,0]],[[3599,7982],[6,0],[11,1]],[[5604,6917],[0,2],[1,6]],[[5605,6925],[0,2],[-1,5]],[[5604,6932],[0,2],[0,1]],[[5603,6938],[-1,3]],[[5602,6941],[0,1],[-1,1]],[[5599,6946],[-1,2]],[[5598,6948],[-1,1],[-1,2]],[[5588,6958],[-3,3]],[[5585,6961],[-1,0],[-2,1]],[[5573,6966],[-4,1]],[[5569,6967],[-3,1],[-4,1]],[[5550,7002],[-2,0],[-5,-1]],[[5543,7001],[-3,-1],[-5,-2]],[[5535,6998],[0,0]],[[5534,6998],[0,0]],[[5534,6998],[0,1]],[[5533,6999],[-1,1]],[[5252,7253],[2,2],[1,2]],[[5194,7315],[2,2],[5,3]],[[5201,7320],[2,2],[4,3]],[[5207,7325],[2,1],[3,2]],[[5212,7328],[1,2],[4,2]],[[5217,7332],[2,2],[3,3]],[[5222,7337],[3,2],[5,4]],[[5230,7343],[0,0]],[[5233,7344],[1,0]],[[5234,7344],[0,0]],[[5237,7342],[0,0]],[[5240,7347],[-3,4],[-6,8]],[[5231,7359],[-1,2],[-3,3]],[[5227,7364],[-2,2],[-3,4]],[[5222,7370],[-1,2],[-3,3]],[[5218,7375],[-2,3],[-4,5]],[[5212,7383],[-1,0],[-1,1]],[[5210,7384],[0,1],[-1,1]],[[5080,7529],[-1,1]],[[5077,7535],[-1,1]],[[5076,7536],[0,1]],[[5076,7543],[1,1]],[[5066,7554],[-1,-3],[-2,-5]],[[5063,7546],[-1,-2],[-2,-5]],[[5057,7532],[0,0]],[[5057,7533],[0,0]],[[5057,7533],[0,0]],[[5056,7534],[0,0]],[[4973,7563],[-1,0]],[[4970,7563],[0,-1]],[[4970,7562],[0,0]],[[4968,7561],[0,-1]],[[4704,7700],[0,-2],[-1,-2]],[[4703,7695],[-2,-2],[-2,-6]],[[4699,7687],[-2,-3],[-2,-5]],[[4694,7679],[0,0]],[[4695,7681],[0,0]],[[4695,7681],[0,1]],[[4694,7683],[0,1]],[[4676,7713],[-1,1],[-1,2]],[[4671,7724],[-1,3],[-1,2]],[[4669,7731],[-1,5]],[[4668,7736],[-1,3],[0,6]],[[4533,7796],[-6,7],[-12,16]],[[4447,7746],[-10,16],[-11,15],[3,3],[2,1],[-1,1],[0,1],[-6,1]],[[4424,7784],[-1,0]],[[4423,7784],[0,1]],[[4423,7785],[-1,0]],[[4422,7785],[0,0]],[[4422,7785],[0,1]],[[4422,7786],[0,0]],[[4422,7786],[-23,28]],[[4399,7814],[0,0]],[[4399,7814],[0,1],[0,1]],[[4399,7816],[0,0]],[[4399,7816],[0,0]],[[4399,7816],[0,1]],[[4399,7817],[0,0]],[[4399,7817],[14,18],[2,3],[7,9],[2,-1],[15,19],[11,14],[3,1],[8,11],[0,3],[22,28],[21,29],[1,0],[4,2],[-4,1],[8,12],[3,3],[30,45],[33,50],[27,41],[25,37],[3,5],[85,-17],[2,9],[5,27],[5,31],[8,38],[7,39],[7,38],[7,39],[7,36],[1,3]],[[4768,8390],[41,8],[147,27],[125,24],[2,0],[3,1],[3,0],[-1,-7]],[[5088,8443],[1,0],[0,1]],[[5089,8444],[2,0]],[[5091,8444],[1,0]],[[5092,8444],[1,0]],[[5093,8444],[5,2]],[[5098,8446],[1,0],[2,1]],[[5101,8447],[2,0]],[[5103,8447],[41,5],[17,2],[27,3],[34,3],[50,6]],[[5272,8466],[1,0],[2,0]],[[5275,8466],[1,0],[2,0]],[[5278,8466],[3,-1]],[[5281,8465],[4,-1]],[[5285,8464],[1,0],[2,0]],[[5288,8464],[1,0]],[[5289,8464],[0,0]],[[5289,8464],[0,-1],[1,0]],[[5290,8463],[0,-1]],[[5290,8462],[0,-1]],[[5290,8461],[-3,-32],[-2,-27],[-2,-19],[3,0],[-5,-45],[-2,-29],[-4,-50],[-5,-54],[-1,-5],[64,-5],[87,-8],[43,-4],[24,-2],[4,0],[14,-1],[49,0],[5,0],[5,1],[18,3],[17,2],[1,-3],[0,-7],[3,-33],[1,-1],[12,-47],[2,-7],[1,0],[23,5],[23,3],[23,2],[22,1],[22,1],[26,2],[11,0],[25,1],[2,2],[80,1],[38,1],[37,0],[40,1],[8,0],[4,0],[7,0],[59,0],[75,1],[37,1],[41,0]],[[6237,7504],[0,-1]],[[6237,7503],[0,-1],[1,0],[0,-1]],[[6238,7501],[0,0]],[[6238,7501],[0,-1]],[[6238,7500],[1,0],[1,-1]],[[6240,7499],[1,0]],[[6239,7492],[-1,0]],[[6238,7492],[-1,0],[-1,0],[0,-1]],[[6236,7491],[0,0]],[[6236,7491],[0,0]],[[6236,7491],[-1,0],[0,-1],[0,-1],[-1,0]],[[6234,7489],[0,0]],[[6218,7440],[-3,1],[-2,0]],[[6213,7441],[-3,0]],[[6210,7441],[-5,0]],[[6205,7441],[-3,0],[-2,0]],[[6200,7441],[-3,0],[-2,-1]],[[6190,7439],[-3,-1],[-5,-2]],[[6182,7436],[-1,0],[-3,-2]],[[6153,7417],[-2,-2],[-3,-5]],[[6148,7410],[0,-1],[-1,-1]],[[6147,7408],[-1,-2],[-1,-3]],[[6117,7336],[-2,-4],[-5,-9]],[[6110,7323],[-1,-2],[-3,-5]],[[6106,7316],[-2,-3],[-5,-7]],[[6141,7205],[-2,-2],[-5,-3]],[[6134,7200],[-1,-1],[-3,-2]],[[5891,7136],[-2,-1],[-3,-3]],[[5886,7132],[-2,-2],[-7,-5]],[[5863,7114],[0,0]],[[5863,7114],[-1,-1]],[[5862,7113],[0,0]],[[5862,7113],[0,-1],[-1,0]],[[5861,7112],[0,0]],[[5861,7112],[0,-1]],[[5861,7111],[0,0]],[[5861,7111],[0,-1]],[[5861,7110],[-1,0]],[[5860,7110],[0,-1]],[[5838,7097],[-7,-5],[-14,-12]],[[5817,7080],[-7,-6],[-13,-12]],[[5797,7062],[-2,-2],[-4,-4]],[[5791,7056],[-1,-2],[-4,-4]],[[5776,7040],[-2,-2],[-6,-5]],[[5768,7033],[-2,-3],[-6,-5]],[[5760,7025],[-1,-1],[-2,-3]],[[5757,7021],[-4,-3],[-7,-6]],[[5746,7012],[-4,-5],[-10,-8]],[[5707,6970],[-1,0],[-2,-2]],[[5704,6968],[-2,-1],[-4,-3]],[[5698,6964],[-2,-2],[-6,-5]],[[5690,6957],[-5,-5],[-10,-9]],[[5675,6943],[-5,-5],[-10,-10]],[[5660,6928],[-5,-5],[-9,-11]],[[5646,6912],[-5,-5],[-9,-11]],[[4399,7817],[0,0]],[[4399,7816],[0,0]],[[4399,7816],[0,0]],[[4399,7814],[0,0]],[[4422,7786],[0,0]],[[4422,7785],[0,0]],[[4422,7785],[1,0]],[[4423,7784],[1,0]],[[4404,7691],[4,-6],[5,-13]],[[4434,7617],[1,-5],[3,-9]],[[4438,7603],[2,-4],[4,-9]],[[3616,7983],[-6,-1],[-11,0]],[[3270,8071],[-1,0]],[[3268,8071],[-1,0]],[[3267,8071],[0,0]],[[3265,8071],[0,0]],[[3515,9754],[1,0],[1,0]],[[3517,9754],[0,-1],[1,0]],[[3572,9700],[2,-1],[1,-2],[2,-1],[4,-3]],[[3581,9693],[2,-1],[2,-2],[2,-1],[4,-2]],[[3630,9670],[2,-1],[2,-1]],[[3634,9668],[2,0],[3,-1]],[[3639,9667],[2,-1],[2,0]],[[3648,9665],[2,0],[2,0]],[[3652,9665],[3,0],[2,0]],[[3657,9665],[2,0],[2,1]],[[3666,9667],[3,0],[7,3]],[[3676,9670],[3,1],[7,2]],[[3777,9715],[10,4],[18,9]],[[3805,9728],[8,5],[17,10]],[[3830,9743],[1,0],[0,1],[1,0],[1,0],[1,0],[1,0]],[[3835,9744],[0,-1],[1,0],[1,0],[0,-1],[1,0],[0,-1],[0,-1]],[[3853,9732],[0,-1],[1,-1],[0,-1],[1,-1],[1,-1],[0,-1],[1,-1],[1,0],[0,-1],[1,-1],[1,-1],[1,-1],[2,-2]],[[3863,9719],[1,0],[1,0],[1,0],[1,0]],[[3867,9719],[1,0],[1,0],[1,0],[1,1]],[[3877,9708],[6,3],[12,6]],[[3914,9728],[5,3],[8,5]],[[3927,9736],[4,1],[7,4]],[[3938,9741],[1,1],[2,1]],[[3941,9743],[3,1],[5,2]],[[3949,9746],[3,1],[6,2]],[[3983,9757],[1,0]],[[3984,9757],[1,0],[1,0]],[[3986,9757],[1,0]],[[3987,9757],[1,0],[0,-1]],[[4374,9865],[16,-5]],[[4489,9823],[-1,-4],[0,-1],[-76,-126],[0,-3],[-1,0],[-7,-16],[-9,-31],[2,-1],[-7,-36],[-4,-48],[-5,-47],[0,-23],[1,-24],[2,-54],[-2,-2],[1,-26],[3,-15],[0,-10],[-21,-39],[0,-41],[-1,-48],[-5,-6],[1,0],[0,-3],[-1,-6],[-37,1],[-13,1],[-24,1],[-28,1],[-3,-48],[20,-2],[-2,-35],[-1,0],[-1,-37],[-1,0],[1,-34],[-6,-1],[-19,0],[-23,0],[-7,-1],[-20,0],[-15,0],[-21,-1],[-9,0],[-30,-1],[-17,0],[-13,0],[-12,-1],[-14,0],[-4,0],[-17,0],[-10,-1],[0,-4],[0,-4],[8,-38],[3,-9],[7,-12],[11,-15],[2,-3],[31,-31],[22,-24],[27,-35],[11,-22],[1,-4],[4,-19],[4,-17],[5,-21],[5,-25],[1,-3],[-2,0],[23,-66],[24,-68],[22,-62],[21,-58],[8,-20],[1,-3],[-1,0],[1,-4],[2,1],[6,-19],[1,-4],[5,-13],[11,-1],[7,-1],[44,-3],[1,-1],[25,-2],[8,-1],[9,0],[7,-1],[1,0],[8,-1],[8,-1],[8,-1],[9,-1],[3,0],[5,0],[8,-1],[8,-1],[1,0],[7,-1],[8,-1],[9,0],[28,-2],[2,-1],[2,0],[34,0],[16,0],[21,2],[12,1],[32,4],[32,4],[8,2],[7,1],[29,7],[27,7],[17,4],[9,-68],[0,-1],[14,2],[-3,-7]],[[5196,4068],[0,0]],[[5196,4068],[0,-1],[0,-1],[-1,0],[0,-1]],[[5195,4065],[0,0]],[[5195,4065],[5,-32]],[[5200,4033],[0,0]],[[5200,4033],[1,-1],[0,-1],[0,-1],[0,-1],[0,-1],[0,-1]],[[5201,4027],[0,0]],[[5201,4027],[0,-1]],[[5201,4026],[0,-1],[-1,-1],[0,-1],[-1,0],[0,-1],[-1,-1]],[[5198,4021],[0,0]],[[5198,4021],[9,-19]],[[5207,4002],[-17,-13],[-14,-11]],[[4922,4252],[0,1],[-1,0]],[[4921,4253],[-1,0],[-1,0],[-1,0],[0,1],[-1,0],[-1,1],[-1,0]],[[4915,4255],[-1,1]],[[4914,4256],[-1,1],[-1,0]],[[4912,4257],[0,1],[-1,0],[0,1],[-1,1],[-1,1],[0,1],[-1,1]],[[4908,4263],[0,1]],[[5041,5022],[1,1],[2,3]],[[5044,5026],[0,1],[2,3]],[[5278,5192],[-17,-18]],[[5261,5174],[1,-2],[1,-4]],[[5263,5168],[1,-1],[1,-4]],[[5265,5163],[0,-2],[1,-3]],[[5266,5158],[1,-2],[1,-3]],[[5268,5153],[-1,0]],[[5267,5153],[0,0]],[[5267,5153],[1,0],[0,-1]],[[5268,5152],[0,0]],[[5268,5152],[0,0]],[[5268,5152],[0,-1]],[[5268,5151],[0,0]],[[5268,5151],[5,-20],[4,-17],[9,-33],[0,-2],[3,-8],[1,-3]],[[5290,5068],[1,-3],[2,-7]],[[5293,5058],[1,-3],[2,-7]],[[5296,5048],[1,-4],[2,-8]],[[5299,5036],[1,-5],[2,-8]],[[5302,5023],[0,-4],[1,-9]],[[5303,5010],[0,-4],[0,-9]],[[5303,4997],[0,-15],[7,-3],[2,-11],[2,-14],[1,-7],[1,-6]],[[5316,4941],[-21,1],[0,-20],[5,-27],[-25,-4],[-4,16],[-3,18],[-3,11],[-2,11],[-17,1],[-18,2],[-5,-13],[-2,-6],[-11,3],[-2,1],[-10,4],[-15,7],[-17,7],[-9,-27],[-3,-9],[-3,-9],[-8,-24],[-3,-12],[-5,-13],[-3,-9],[-9,-29],[-5,-15],[-4,-12],[-4,-11],[-8,-25],[-4,-12],[-5,-14],[-4,-13],[-3,-10],[-4,-10],[-6,-22],[1,-10],[0,-15],[0,-13],[1,-12],[0,-11],[0,-22],[1,-35],[3,-15],[11,-46],[5,-21],[3,-11],[2,-9],[2,-6],[0,-12],[6,-22],[5,-12],[14,-58],[9,-38],[4,-24],[2,-9],[8,-32],[11,-47],[7,-29],[3,-10],[8,-33],[3,-15],[4,-13],[7,-29]],[[5316,4941],[0,-1]],[[5316,4940],[0,-3],[1,-6]],[[5317,4931],[0,-5],[1,-11]],[[5318,4915],[0,-5],[0,-10]],[[5318,4900],[0,-6],[-1,-10]],[[5317,4884],[0,-3],[-1,-6]],[[5316,4875],[0,-3],[-1,-6]],[[5315,4866],[0,-1],[-3,-19],[-2,-7],[-6,-12],[2,0],[-1,-2],[-7,-5],[-2,-17],[-3,-25],[-2,-24],[-3,-32],[-3,0],[0,-3],[2,-8],[0,-1],[1,-1],[1,-4],[-2,-1],[3,-10],[1,-5],[4,-5],[0,-10],[-1,-8],[0,-3],[-1,-5],[-2,-6],[-2,-8],[0,-3],[-1,-7],[-1,-7],[0,-3],[0,-12],[0,-17],[-2,0],[2,-17],[-1,0],[0,-2],[2,0],[-1,-13],[0,-4],[-1,-9],[-1,-5],[0,-5],[2,0],[-1,-3],[2,0],[0,-28],[0,-5],[-1,0],[0,-3],[2,-12],[1,1],[0,-1],[1,-5],[0,-3],[-1,-3],[1,-15],[0,-25],[1,-45],[0,-12],[-1,-37]],[[5291,4344],[0,0]],[[5291,4344],[0,-1]],[[5291,4343],[0,0]],[[5291,4343],[0,0]],[[5291,4343],[1,0]],[[5292,4343],[0,0]],[[5292,4343],[8,2],[2,-8]],[[5302,4337],[0,0]],[[5302,4337],[-1,-1]],[[5301,4336],[0,0]],[[5301,4336],[0,0]],[[5301,4336],[0,0]],[[5301,4336],[0,0]],[[5301,4336],[0,-2],[0,-2],[-1,0],[-4,-38],[0,-4]],[[5296,4290],[0,-1]],[[5296,4289],[0,-1]],[[5296,4288],[0,0]],[[5296,4288],[0,0]],[[5296,4288],[1,0],[0,-1]],[[5297,4287],[1,0]],[[5298,4287],[-1,-17],[-1,-8]],[[5296,4262],[0,0]],[[5296,4262],[0,-1],[-1,0]],[[5295,4261],[0,0]],[[5295,4261],[0,0]],[[5295,4261],[0,-1],[-1,0],[0,-1]],[[5294,4259],[0,0]],[[5294,4259],[-2,-49],[-2,-48],[1,0],[0,-4]],[[5291,4158],[0,0]],[[5291,4158],[0,0]],[[5291,4158],[0,0]],[[5291,4158],[0,0]],[[5291,4158],[0,-1],[-1,0]],[[5290,4157],[0,0]],[[5290,4157],[0,-15],[-1,-11],[2,0],[-1,-10],[-2,0],[0,-1]],[[5288,4120],[0,-1],[1,-2]],[[5289,4117],[0,-1],[0,-3]],[[5289,4113],[5,-22]],[[5294,4091],[1,-1]],[[5295,4090],[0,-1],[0,-1],[1,0],[0,-1],[0,-1],[1,-1],[1,-1],[0,-1],[1,-1]],[[5299,4082],[1,0]],[[5300,4082],[0,-1],[1,0]],[[5301,4081],[1,-1],[1,-1],[1,0],[0,-1],[1,0],[1,0],[1,-1],[1,0]],[[5308,4077],[2,0]],[[5310,4077],[1,2],[3,-2],[1,-2]],[[5315,4075],[0,0]],[[5315,4075],[1,0]],[[5316,4075],[0,0]],[[5316,4075],[0,0]],[[5316,4075],[0,-1]],[[5316,4074],[0,0]],[[5316,4074],[4,-17]],[[5320,4057],[0,0]],[[5320,4057],[0,-1]],[[5320,4056],[0,0]],[[5320,4056],[0,0]],[[5320,4056],[0,0]],[[5320,4056],[0,0]],[[5320,4056],[0,-3]],[[5320,4053],[-3,-3],[-1,2]],[[5316,4052],[-1,-1]],[[5315,4051],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0],[0,-1]],[[5312,4048],[-1,-1]],[[5311,4047],[-1,-1]],[[5310,4046],[0,-1],[-1,-1],[0,-1]],[[5309,4043],[0,-1]],[[5309,4042],[-1,-1]],[[5308,4041],[0,-1],[0,-1]],[[5308,4039],[0,-1]],[[5308,4038],[0,0]],[[5308,4038],[0,-1],[0,-1]],[[5308,4036],[0,-1]],[[5308,4035],[2,-5],[-7,-2],[0,1],[-20,-6],[2,-7],[-17,-5],[-6,-1]],[[5262,4010],[0,-1],[-1,0]],[[5261,4009],[0,-1],[0,-1],[-1,-1],[0,-1],[-1,0],[0,-1],[-1,-1],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0],[-1,0],[0,-1],[-1,0]],[[5253,4000],[-1,0]],[[5252,4000],[-1,0]],[[5251,4000],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,1],[-1,0],[-1,1],[-1,0],[0,1],[-1,0]],[[5240,4003],[0,1]],[[5240,4004],[-7,-2],[-25,-7],[-1,7]],[[5198,4021],[0,0]],[[5201,4026],[0,1]],[[5201,4027],[0,0]],[[5200,4033],[0,0]],[[5195,4065],[0,0]],[[5196,4068],[0,0]],[[6125,3831],[6,3],[10,5],[11,4],[12,6],[4,2],[11,5],[15,7],[3,1],[11,5],[11,5],[4,2],[16,7],[11,6],[14,6],[2,1],[7,3],[5,2],[12,5],[3,2],[16,7],[8,4],[4,1],[4,-1],[3,-2],[6,6],[12,-14],[10,-10],[3,-4],[14,-16],[15,-17],[14,-15]],[[6402,3847],[0,0]],[[6402,3847],[1,0]],[[6403,3847],[0,0]],[[6403,3847],[0,0]],[[6403,3847],[0,-1],[1,1]],[[6404,3847],[1,0]],[[6405,3847],[18,10],[14,9],[13,8],[16,9],[11,7],[12,7],[8,4],[13,8],[13,8],[5,3],[6,3],[15,10],[20,11],[1,1],[12,8],[2,2],[7,4],[11,8],[10,6],[-1,1],[9,5]],[[6620,3979],[0,1]],[[6620,3980],[1,0],[0,1]],[[6621,3981],[0,0]],[[6621,3981],[10,3],[14,9]],[[6645,3993],[0,0]],[[6645,3993],[0,1],[1,0]],[[6646,3994],[0,0]],[[6646,3994],[0,0]],[[6646,3994],[0,1]],[[6646,3995],[0,1]],[[6646,3996],[3,2]],[[6649,3998],[0,0]],[[6649,3998],[1,0]],[[6650,3998],[0,0]],[[6650,3998],[1,0]],[[6651,3998],[0,0]],[[6651,3998],[0,0]],[[6651,3998],[1,-1],[21,15],[6,9],[20,9],[7,4],[9,5],[-2,3],[6,3],[1,-2],[6,-12],[-1,-4],[5,-9],[12,-23],[1,0],[5,2],[14,8],[8,10],[12,13],[2,2],[7,7],[13,12],[1,2],[1,-1],[2,3]],[[6808,4053],[-2,2],[-5,4]],[[6801,4059],[-2,2],[-4,5]],[[6795,4066],[-1,0]],[[6794,4066],[0,1],[-1,0],[0,1],[0,1]],[[6793,4069],[-1,1]],[[6792,4070],[0,0]],[[6792,4070],[0,1],[0,1],[0,1]],[[6792,4073],[0,1]],[[6792,4074],[1,3],[4,-2],[15,21],[5,-4],[9,6],[1,1],[19,12],[19,12],[25,16],[3,1],[26,8],[31,18],[6,2],[20,7],[4,1],[25,5],[20,7],[23,17],[26,13],[3,2],[20,11],[22,14],[22,14],[37,25],[22,14],[27,12],[20,10],[9,5],[2,1],[11,7],[1,1],[1,1],[2,1],[1,0],[28,23],[13,9],[11,8],[16,17],[-2,9],[-3,17],[-2,18],[-3,17],[-4,16],[-8,29],[-2,23],[-2,14],[-1,3],[-3,14],[-9,18],[-20,29],[-12,17],[-6,14],[-5,20],[-10,45],[14,5],[25,9],[23,7],[21,7],[29,6],[28,6],[35,8],[19,2],[27,7],[1,-1],[2,-4],[3,1],[10,0],[9,-1],[19,-2],[15,-6],[19,-11],[15,-13],[20,-19],[15,-10],[15,-8],[7,-6],[12,-1],[22,-1],[18,-1],[12,-4],[15,-4],[8,-28],[-2,-37],[-4,-30],[-4,-21],[5,-21],[6,-27],[11,-48],[7,-16],[6,-14],[13,-25],[15,-26],[18,-38],[18,-39],[18,-26],[21,-8],[33,-6],[30,-5],[20,1],[21,11],[24,12],[26,-4],[35,-9],[29,-8],[3,-1]],[[8057,4249],[-7,-31],[-12,-23],[-14,-27],[-2,0],[-4,-1],[-6,-28],[-7,-29],[-5,-23],[-5,-25],[-3,-11],[-5,-18],[-6,-16],[-10,-15],[-7,-8],[-6,-9],[-2,-2],[-4,-6],[-6,-1],[-4,-3],[-4,2],[-10,-3],[-8,-1],[-2,-3],[-7,-3],[-8,-3],[-4,-3],[-2,-1],[-3,-2],[-4,-1],[-6,-6],[-7,-3],[-3,-4],[-14,-7],[-3,-4],[-4,0],[-4,-10],[-5,-5],[-1,-4],[-3,0],[-4,-3],[-11,-12],[-2,-4],[-8,-7],[0,-2],[-4,-8],[-1,-4],[-3,-2],[-1,-14],[-2,-2],[-3,-16],[-3,-1],[-1,-7],[-8,-16],[-4,-7],[-2,-9],[-4,-2],[-1,-5],[-3,-3],[0,-12],[0,-2],[-4,-5],[0,-3],[-4,-6],[0,-2],[-2,-3],[-3,1],[-1,-3],[-2,-8],[1,-11],[-4,-11],[-4,-4],[-1,-3],[-4,-3],[0,-3],[-1,-6],[1,-4],[0,-2],[-1,-1],[-13,2],[-5,2],[-9,0],[-9,-5],[-8,-1],[-3,-3],[-3,-1],[-9,5],[-2,1],[-3,-1],[-2,-5],[-3,-1],[-7,3],[-3,-1],[-1,-2],[-6,0],[-6,-2],[-2,0],[-5,4],[-6,2],[-2,1],[-18,5],[-11,1],[-8,-1],[-5,-6],[-1,-2],[-1,-5],[-5,-6],[-3,-2],[-6,-1],[-4,0],[-3,2],[-2,3],[-2,3],[-1,5],[-2,2],[-1,0],[0,1],[-7,1],[-3,0],[-8,-6],[-3,-2],[-11,-3],[-5,-3],[-3,-1],[-3,1],[-5,0],[-4,-6],[-1,-3],[-3,-5],[-3,-2],[-8,0],[-3,0],[-4,3],[-1,3],[0,3],[-4,0],[-2,0],[-6,-2],[-3,-4],[-5,-3],[-5,0],[-4,8],[-4,0],[-10,-4],[-4,-1],[-3,0],[-5,0],[-4,1],[-4,4],[-7,4],[-2,4],[-4,4],[-3,3],[-3,1],[-10,7],[-6,1],[-4,1],[-1,1],[0,3],[-3,5],[-2,7],[-2,6],[-5,8],[-1,5],[2,7],[0,6],[-7,13],[0,5],[0,3],[1,1],[1,1],[8,5],[3,10],[-1,6],[-5,7],[-1,5],[1,4],[2,3],[4,2],[8,3],[4,5],[0,5],[-8,14],[-2,6],[-10,5],[-12,-2],[-7,5],[-4,1],[-13,5],[-8,2],[-8,3],[-2,2],[-3,2],[-6,3],[-6,1],[-6,0],[-4,0],[-2,1],[-4,0],[-3,3],[-5,5],[-5,0],[-7,-3],[-11,-1],[-10,1],[-5,1],[-4,1],[-7,-2],[-7,-1],[-3,-1],[-4,-2],[-3,-3],[-2,-2],[-2,-1],[-3,-5],[-2,-6],[-1,-2],[-23,-16],[-4,-7],[-3,-13],[-5,-8],[-1,-4]],[[7170,3806],[1,-1],[1,-1]],[[7172,3804],[1,-1],[1,-1]],[[7174,3802],[1,0],[1,-1],[0,-1],[1,-1],[1,-1],[0,-1],[1,-1],[0,-1]],[[7179,3795],[2,-1]],[[7181,3794],[4,0],[-1,-15],[7,-33]],[[7191,3746],[1,-4],[2,-9]],[[7194,3733],[1,-4],[3,-7]],[[7198,3722],[0,-1],[0,-1]],[[7198,3720],[1,-4],[3,-6]],[[7202,3710],[0,-1],[1,-2]],[[7203,3707],[2,-5],[3,-8]],[[7208,3694],[1,0],[1,-2],[-1,0],[0,-1],[16,-47],[1,-5]],[[7226,3639],[1,-4],[2,-4]],[[7229,3631],[3,-8]],[[7232,3623],[0,0]],[[7232,3623],[1,-2],[2,-4]],[[7235,3617],[2,-3],[3,-5]],[[7240,3609],[-3,-10],[0,-1],[3,-10],[-2,-7],[-1,-4]],[[7237,3577],[-1,-2],[-1,-6]],[[7235,3569],[0,-2],[-1,-5]],[[7234,3562],[0,-4],[0,-3]],[[7234,3555],[1,-7]],[[7235,3548],[-3,-2],[-1,0],[-7,-4],[-4,-3],[-3,-3],[-9,-4],[-9,0],[-10,4],[-8,4],[-1,1],[-4,-8],[-1,-7],[0,-3]],[[7175,3523],[3,-2],[4,-3]],[[7182,3518],[3,-3]],[[7185,3515],[6,-6]],[[7191,3509],[3,-3],[3,-3]],[[7197,3503],[3,-4]],[[7200,3499],[5,-7]],[[7205,3492],[3,-4],[2,-4]],[[7210,3484],[4,-9]],[[7214,3475],[6,-13],[1,1],[2,-6],[8,-18],[2,-4],[-4,-2],[5,-15],[7,-25],[-1,0],[0,-4],[1,-3],[-9,-11],[-1,-1],[6,-6],[13,-19],[8,-6],[7,-3],[28,-6],[1,0],[0,-5],[1,-3],[0,-4]],[[7295,3322],[0,-1],[0,-1]],[[7295,3320],[0,-1],[0,-1],[0,-1],[0,-1]],[[7295,3316],[0,-2]],[[7295,3314],[-44,-30],[20,-41],[-7,-7],[7,-7],[28,-28],[35,-32],[17,-20],[6,3],[2,2],[2,2],[2,-4],[4,-14],[0,-2],[6,-17],[5,2],[2,-6],[4,-9],[5,-12],[3,-9],[4,-7],[2,-6],[2,-2],[4,-7],[10,-15],[13,-15],[6,-8],[1,2],[3,1],[1,2],[3,2],[4,3],[1,1],[4,2],[2,1],[2,2],[-4,4],[19,10]],[[7469,3055],[1,0],[1,0]],[[7471,3055],[0,-1],[1,0],[1,0],[1,-1],[1,0],[1,0],[1,0]],[[7477,3053],[2,-1]],[[7479,3052],[1,0]],[[7480,3052],[0,-6],[1,-4],[4,-12],[3,-3],[5,-3],[4,-2],[8,-4],[12,-9],[32,-31],[29,-23],[21,-21],[1,1],[4,4],[7,10],[9,12],[14,-14],[10,-11],[-7,-8],[-3,-4],[-13,-16],[-9,-7],[-10,-6],[-5,-2],[-7,-2],[-7,-2]],[[6439,3467],[-1,1],[-1,0]],[[6437,3468],[-1,1]],[[6436,3469],[-1,1]],[[6435,3470],[-2,1]],[[6433,3471],[-1,1],[-1,0]],[[6431,3472],[-1,1]],[[6430,3473],[-1,0]],[[6429,3473],[-3,1]],[[6338,3617],[0,0]],[[6338,3617],[0,0]],[[6338,3617],[0,1]],[[6338,3618],[0,0]],[[6338,3618],[-1,1]],[[6337,3619],[0,0]],[[6337,3619],[0,0]],[[6337,3619],[0,0]],[[6334,3623],[-1,0]],[[6333,3623],[0,1],[-1,0]],[[6332,3624],[0,0]],[[6332,3624],[0,0]],[[6332,3624],[-1,0]],[[6331,3624],[0,0]],[[6333,3652],[-1,0],[0,-1]],[[6332,3651],[-1,0],[-1,0],[-1,0]],[[6329,3651],[-1,0]],[[6328,3651],[-1,0],[-1,0]],[[6326,3651],[-1,1]],[[6325,3652],[-5,1],[-10,3]],[[6310,3656],[-5,2],[-9,4]],[[6296,3662],[-1,1],[-4,2]],[[6291,3665],[-3,2],[-5,4]],[[6283,3671],[-4,3],[-9,6]],[[6270,3680],[-4,3],[-8,6]],[[6258,3689],[-4,3],[-8,7]],[[6246,3699],[-3,3],[-6,4]],[[6217,3725],[-2,2],[-4,4]],[[6211,3731],[-4,3],[-7,8]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6125,3829],[0,0]],[[6125,3829],[0,1],[-1,0],[0,1],[1,0]],[[6125,3831],[0,0]],[[6143,3803],[0,0]],[[6143,3803],[0,0]],[[6200,3742],[4,-4],[7,-7]],[[6211,3731],[2,-2],[4,-4]],[[6237,3706],[3,-2],[6,-5]],[[6246,3699],[4,-3],[8,-7]],[[6258,3689],[4,-3],[8,-6]],[[6270,3680],[4,-3],[9,-6]],[[6283,3671],[3,-2],[5,-4]],[[6291,3665],[2,-1],[3,-2]],[[6296,3662],[5,-2],[9,-4]],[[6310,3656],[5,-2],[10,-2]],[[6325,3652],[1,-1]],[[6326,3651],[1,0],[1,0]],[[6328,3651],[1,0]],[[6332,3651],[1,1]],[[6331,3624],[0,0]],[[6332,3624],[0,0]],[[6332,3624],[0,0]],[[6333,3623],[1,0]],[[6337,3619],[0,0]],[[6337,3619],[1,-1]],[[6338,3618],[0,0]],[[6338,3617],[0,0]],[[6426,3474],[1,0],[2,-1]],[[6431,3472],[2,-1]],[[6433,3471],[1,-1],[1,0]],[[6437,3468],[2,-1]],[[7663,2676],[-2,1],[-4,2]],[[7657,2679],[-2,2],[-4,2]],[[7651,2683],[-2,1],[-4,3]],[[7645,2687],[-2,1],[-3,2]],[[7639,2691],[-2,0],[-3,2]],[[7627,2678],[-2,1],[-4,1]],[[7621,2680],[-2,1],[-5,2]],[[7614,2683],[-3,1],[-8,2]],[[7603,2686],[-4,0],[-8,2]],[[7581,2689],[-4,0],[-10,1]],[[7567,2690],[-1,0]],[[7566,2690],[-1,0],[-3,0]],[[6695,2351],[-2,3],[0,1],[-12,20],[-8,13],[-5,10],[-13,22],[-1,1],[-18,31],[-2,3],[-9,16],[-3,5],[-1,1],[-24,41],[0,1],[-1,3],[-2,2],[-11,18],[-2,7],[-3,6],[-9,12],[0,1],[-3,4],[-9,11],[0,1],[-6,7],[-1,2]],[[6550,2593],[-2,3],[-4,7]],[[6544,2603],[-4,6],[-4,12],[-9,24],[-1,0],[-7,20],[-7,16],[0,2],[-8,19],[-5,13],[0,2],[-5,12],[-6,14],[-1,3],[0,1],[-4,8],[-2,6],[-3,5],[-2,6],[-3,5],[-3,5],[-3,6],[-3,5],[-19,31],[-4,7],[-3,7],[-4,7],[-4,7],[-3,7],[-4,8],[-3,7],[-3,6],[-1,5],[-1,3],[-1,1],[-2,6],[-3,7],[-1,5],[-1,3],[-2,7],[-2,6],[0,1],[-1,4]],[[6402,2928],[0,0]],[[6402,2928],[0,-1]],[[6402,2927],[0,0]],[[6402,2927],[0,0]],[[6402,2927],[0,-1],[-1,0]],[[6401,2926],[0,0]],[[6401,2926],[-7,30]],[[6394,2956],[-1,5],[-2,11]],[[6391,2972],[0,3],[-1,6]],[[6390,2981],[0,5],[-1,12]],[[6389,2998],[-1,3],[0,5]],[[6388,3006],[0,4],[0,8]],[[6388,3018],[0,4],[0,8]],[[6388,3030],[0,8]],[[6388,3038],[0,4],[0,7]],[[6388,3049],[0,3],[-1,7]],[[6387,3059],[-1,1]],[[6386,3060],[0,3],[-1,4]],[[6385,3067],[-1,3],[0,3]],[[6384,3073],[-1,3]],[[6383,3076],[-2,6]],[[6381,3082],[-2,5]],[[6379,3087],[0,1],[-1,3]],[[6378,3091],[-1,1],[-1,2]],[[6376,3094],[-3,8]],[[6373,3102],[-1,1],[0,2]],[[6372,3105],[-1,1],[-1,1]],[[6370,3107],[-1,1],[-5,11]],[[6364,3119],[0,0]],[[6364,3119],[0,1],[0,1],[0,1],[-1,0]],[[6363,3122],[0,1]],[[6363,3123],[-10,14],[-16,24],[-2,3],[-15,22],[-9,13],[-5,8],[-4,6],[-4,6],[-4,9],[-14,27],[-11,22],[-5,9],[-4,8],[-11,18],[-5,9],[-9,15],[-17,29],[-19,33],[-3,3],[-2,4],[-1,0],[0,1],[-2,3],[-4,7],[-12,17],[-9,10],[-2,4],[3,1],[-2,2],[-2,4],[-3,4],[-2,5],[-1,4],[-2,5],[-3,15],[-2,7],[-7,27],[-2,6],[-2,7],[-1,5],[-2,5],[-2,5],[-3,6],[-2,5],[-2,4],[-3,5],[-2,5],[-2,3],[-1,1],[-3,5],[-3,4],[-3,5],[-9,11],[-3,6],[-13,17],[-3,5],[-1,1],[-6,8],[-3,4],[-3,5],[-3,4],[-2,5],[-3,5],[-2,4],[-3,5],[-2,5],[-2,5],[-2,5],[-2,5],[-11,31],[-5,14],[-2,7],[-6,18],[-4,11],[-11,16],[-1,2],[-1,10],[-1,8],[-1,4],[-1,3],[-3,8],[-2,7],[-3,-1],[-5,14],[-1,16],[-3,10],[-2,4],[0,2]],[[6052,3865],[0,0]],[[6052,3865],[0,-1],[1,0],[0,-1],[1,0],[0,-1]],[[6054,3862],[0,0]],[[6104,3842],[0,0]],[[6104,3842],[0,-1],[1,0],[1,0],[0,1],[1,0]],[[6107,3842],[0,0]],[[6125,3831],[0,0]],[[6125,3829],[0,0]],[[6363,3123],[0,-1]],[[6364,3119],[0,0]],[[6370,3107],[1,0],[1,-2]],[[6372,3105],[0,-1],[1,-2]],[[6376,3094],[1,-1],[1,-2]],[[6378,3091],[0,-1],[1,-3]],[[6381,3082],[1,-3],[1,-3]],[[6384,3073],[1,-6]],[[6385,3067],[0,-2],[1,-5]],[[6387,3059],[0,-3],[1,-7]],[[6388,3049],[0,-4],[0,-7]],[[6388,3030],[0,-4],[0,-8]],[[6388,3018],[0,-4],[0,-8]],[[6388,3006],[0,-2],[1,-6]],[[6389,2998],[0,-6],[1,-11]],[[6390,2981],[1,-3],[0,-6]],[[6391,2972],[1,-5],[2,-11]],[[6401,2926],[0,0]],[[6402,2927],[0,0]],[[6402,2927],[0,0]],[[6402,2928],[0,0]],[[6544,2603],[2,-3],[4,-7]],[[6598,2291],[-7,12],[-4,7],[-1,5],[-13,34],[-3,9],[-3,7],[-3,7],[-4,6],[-17,29],[-17,29],[-17,29],[-18,31],[-19,32],[-18,31],[-19,32],[-18,31],[-19,32],[-19,32],[-18,31],[-6,9],[-34,43],[-8,4],[-25,16],[-5,12],[-2,7],[-9,9],[-3,10]],[[6269,2827],[0,1]],[[6269,2828],[1,0],[0,1]],[[6270,2829],[0,0]],[[6270,2829],[0,0]],[[6270,2829],[0,1]],[[6270,2830],[-1,0]],[[6269,2830],[-3,6],[-4,7],[-5,7],[-2,4],[-13,21],[-7,11],[-6,10],[-6,11],[-7,10],[0,1],[-7,12],[-6,9],[-3,5],[-2,2],[-8,15],[-1,0],[1,0],[-2,2],[-4,6],[-6,10],[-9,14],[-5,10],[-5,7],[-6,11],[-5,7],[-8,13],[-4,5],[-3,6],[-5,8],[-5,9],[-2,3],[-1,-1],[-7,10],[-3,6],[-5,8],[-12,19],[-12,16],[-9,16],[-8,13],[-1,2],[-19,31],[-2,-1],[-4,11],[-3,1],[-4,6],[-1,5],[-5,9],[-2,-2],[-5,9],[-5,8],[-4,5],[-17,27],[-6,11],[-11,21],[1,0],[-6,11],[-6,13],[-9,17],[-1,2],[-9,16],[-2,3],[-11,21],[-7,12],[-10,17],[-5,10],[-5,11]],[[5905,3435],[0,0]],[[5905,3435],[0,1]],[[5905,3436],[0,0]],[[5905,3436],[-8,14],[-4,-3],[-1,3],[-10,18],[4,2],[-2,4],[-6,10],[-5,9],[-5,8],[-6,11],[-6,12],[-6,11],[-2,2],[-14,25],[-4,9],[-6,10],[-1,2],[-3,-2],[-6,10],[-8,16],[-6,11],[-8,14],[-9,15],[-9,18],[-3,7],[1,1],[-3,6],[-4,7],[0,1],[-1,1],[-5,8],[0,2],[-5,8],[-1,2],[-5,9],[-2,3],[-8,14],[-5,9],[-4,7],[-9,4],[-8,14],[-7,14],[-7,12],[-7,13],[-2,2],[-6,12],[-6,10],[-5,9],[-10,18],[-6,11],[-12,21],[-7,13],[-6,10],[-7,1]],[[5694,3999],[0,-1]],[[5694,3998],[1,0]],[[5695,3998],[0,0]],[[5695,3998],[0,0]],[[5695,3998],[1,0]],[[5696,3998],[0,0]],[[5736,3982],[3,-1],[6,-2]],[[5745,3979],[4,-1],[6,-1]],[[5802,3972],[2,0],[3,0]],[[5807,3972],[1,-1],[3,0]],[[5811,3971],[2,0],[3,-1]],[[5816,3970],[2,-1],[4,-1]],[[5822,3968],[4,-1],[7,-2]],[[5833,3965],[4,-1],[7,-3]],[[5844,3961],[2,-1],[5,-2]],[[5851,3958],[2,-1],[4,-2]],[[5857,3955],[1,-1],[3,-1]],[[5861,3953],[1,0],[2,-1]],[[5864,3952],[2,0],[1,0]],[[5867,3952],[1,0]],[[5868,3952],[2,0]],[[5870,3952],[2,-1]],[[5883,3944],[1,-1],[1,0]],[[5885,3943],[1,-1],[1,-1]],[[5905,3436],[0,0]],[[5905,3435],[0,0]],[[6269,2830],[1,0]],[[6270,2829],[0,0]],[[6270,2829],[0,0]],[[6269,2828],[0,-1]],[[5195,1180],[2,-3],[4,-4]],[[5201,1173],[2,-2],[5,-4]],[[4982,921],[0,-2],[1,-4]],[[4983,915],[0,-4],[0,-7]],[[4982,896],[0,-1],[0,-1],[0,-1],[0,-1],[-1,-1],[0,-1],[0,-1],[-1,0],[0,-1],[0,-1],[-1,-1]],[[4979,886],[-1,-1],[-1,-1],[-1,0],[0,-1],[-1,0],[-1,-1],[-1,0],[0,-1],[-1,0],[-1,0]],[[4955,866],[-4,-1],[-9,-2]],[[4942,863],[-2,-1],[-4,0]],[[4936,862],[-3,-1],[-5,-1]],[[4928,860],[-5,0],[-9,-1]],[[4914,859],[-2,-1],[-4,0]],[[4908,858],[-3,0],[-5,-1]],[[4871,856],[-7,-1],[-14,-1]],[[4850,854],[-7,-1],[-13,-2]],[[4830,851],[-5,-1],[-10,-2]],[[4815,848],[-2,-1],[-3,-1]],[[4810,846],[-7,-1],[-13,-4]],[[4790,841],[-4,-2],[-8,-3]],[[4778,836],[-4,-1],[-7,-3]],[[4725,814],[-1,-1],[-2,-2]],[[4722,811],[-1,-1],[-2,-2]],[[4052,332],[-23,14],[-19,20],[-15,24],[-6,27],[-6,28],[-2,3],[7,39],[8,38],[7,39],[2,9],[1,10],[1,10],[-1,10],[0,10],[-1,10],[-2,9],[-2,8],[-2,8],[-3,7],[-3,7],[-3,8],[-19,33],[-19,33],[-19,32],[-11,24],[-18,34],[-10,19],[-9,21],[-6,22],[-3,22],[0,23],[5,23],[8,21],[9,20],[12,19],[12,16],[25,29],[23,31],[22,31],[23,32],[15,20],[1,3],[33,45],[5,6]],[[4069,1229],[1,2],[2,2]],[[4072,1233],[1,3],[2,2],[1,2],[1,3],[1,2]],[[4078,1245],[2,5]],[[4080,1250],[1,3],[1,3]],[[4082,1256],[0,2],[1,3],[0,3],[1,3],[0,2]],[[4084,1269],[0,6]],[[4084,1275],[0,5],[-1,5]],[[4083,1285],[-1,9]],[[4082,1294],[-1,5],[-1,5]],[[4080,1304],[-3,9]],[[4077,1313],[-8,29],[-14,22],[3,0],[-9,14],[-9,12],[-1,2],[-8,9],[-2,3],[-1,1],[-12,12],[-14,13],[-17,13],[-10,9],[-2,2],[-29,26],[-22,20],[-6,5],[-14,13],[-13,15],[-5,4],[-1,1],[-15,23],[-12,26],[-8,27],[-4,29],[1,28],[5,28],[11,26],[14,34],[15,35],[16,36],[10,22],[-2,0],[1,3],[2,8],[15,34],[10,23],[7,24],[7,28],[3,33],[0,22],[-2,27],[-7,32],[-5,12],[5,2],[-2,6]],[[4270,2832],[10,-15],[-5,-4],[6,-10],[1,-1],[2,-2],[4,-4],[9,-11],[11,-15],[8,-11],[60,-2],[21,-4],[14,-1],[13,0],[5,1],[3,2],[2,0],[5,5],[17,6],[2,0]],[[4458,2766],[0,0]],[[4458,2766],[1,1],[1,0],[0,1],[1,0]],[[4461,2768],[0,0]],[[4461,2768],[0,1]],[[4461,2769],[1,0],[0,1],[0,1],[0,1]],[[4462,2772],[0,0]],[[4462,2772],[10,-6],[23,4],[1,0],[22,4],[1,2]],[[4519,2776],[0,2],[0,1]],[[4519,2779],[0,2]],[[4519,2781],[0,3]],[[4519,2784],[1,9],[7,3],[25,-6],[26,-12],[1,-1],[8,-4],[2,4],[21,0],[21,0]],[[4631,2777],[0,0]],[[4631,2777],[1,0],[1,0],[0,1]],[[4633,2778],[0,0]],[[4633,2778],[0,0]],[[4633,2778],[1,0],[0,1]],[[4634,2779],[0,1]],[[4634,2780],[4,23],[2,0],[1,7],[6,-1],[25,0],[2,-3],[53,-13],[12,-1],[0,-5],[2,-2],[51,-13],[2,-1],[0,-3],[8,-1],[16,0],[12,1],[17,2],[20,3],[33,5],[50,7],[349,51]],[[4077,1313],[2,-5],[1,-4]],[[4080,1304],[2,-10]],[[4082,1294],[1,-5],[0,-4]],[[4083,1285],[1,-10]],[[4084,1275],[0,-3],[0,-3]],[[4082,1256],[-2,-6]],[[4080,1250],[-1,-2],[-1,-3]],[[4072,1233],[-3,-4]],[[3980,316],[-1,-1],[-2,-1]],[[3977,314],[-1,-1],[-1,-2]],[[3970,306],[0,-1],[-2,-2]],[[3968,303],[-1,-1],[-3,-2]],[[3952,292],[0,-1],[-1,0],[-1,-1],[-1,0],[-1,-2]],[[3948,288],[-1,-1],[0,-1],[-1,0],[0,-2]],[[3938,270],[-1,-1],[0,-1],[-1,-1],[-1,-1],[-1,-1]],[[3934,265],[-1,-1],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0],[-1,-1]],[[3929,261],[-1,0],[-1,0],[-1,-1],[-1,0],[-1,0],[-1,0]],[[3755,218],[-1,-1],[-1,0]],[[3753,217],[-1,1],[-2,0]],[[3698,228],[0,1],[-1,0],[-1,0],[-1,1]],[[3695,230],[-1,0],[-1,1],[-1,0]],[[4634,2780],[0,-1]],[[4633,2778],[0,0]],[[4633,2778],[0,0]],[[4631,2777],[0,0]],[[4519,2784],[0,-2],[0,-1]],[[4519,2779],[0,-3]],[[4462,2772],[0,0]],[[4461,2769],[0,-1]],[[4461,2768],[0,0]],[[4458,2766],[0,0]],[[4908,4264],[0,-1]],[[4912,4257],[2,-1]],[[4914,4256],[1,-1]],[[4921,4253],[1,-1]],[[5176,3978],[-1,0]],[[5175,3978],[0,-1]],[[5175,3977],[0,0]],[[5175,3977],[0,0]],[[5175,3977],[0,-1],[-1,0]],[[5174,3976],[0,0]],[[5174,3976],[0,0]],[[5174,3976],[0,0]],[[5174,3976],[0,-1]],[[5174,3975],[0,0]],[[5174,3975],[0,-1]],[[5174,3974],[0,0]],[[5174,3974],[1,0]],[[5175,3974],[0,0]],[[8670,4505],[0,-1],[1,0],[0,-1],[0,-1],[1,-1],[0,-1]],[[8672,4500],[1,0],[0,-1],[0,-1],[1,0],[1,-1],[1,-1]],[[8676,4496],[1,-1],[1,0],[1,-1]],[[8679,4494],[2,-1],[2,-1]],[[8683,4492],[1,0],[1,-1],[2,0]],[[8687,4491],[1,0],[2,-1]],[[8700,4488],[2,0],[2,-1]],[[8708,4486],[2,0],[2,-1]],[[8732,4475],[2,-1],[2,-1]],[[8736,4473],[1,-1],[2,-1]],[[8739,4471],[2,-2],[2,-1]],[[8746,4465],[2,-2],[1,-1]],[[8749,4462],[2,-2],[1,-2]],[[8752,4458],[2,-2],[1,-1]],[[8767,4432],[2,-3],[2,-3]],[[8775,4420],[3,-3],[2,-3]],[[8791,4403],[2,-2],[1,-2],[2,-2],[3,-4]],[[8799,4393],[1,-2],[2,-3],[1,-2],[2,-4]],[[8811,4368],[1,-1],[0,-2],[1,-1]],[[8813,4364],[1,-1],[1,-2]],[[8815,4361],[1,-1],[1,-1],[1,-1]],[[8818,4358],[1,-1],[1,-2]],[[8820,4355],[4,-3],[7,-6]],[[8831,4346],[3,-4],[7,-7]],[[8893,4270],[0,-1],[1,-1],[0,-1],[1,-1],[0,-1],[1,-2]],[[8896,4263],[1,-1],[0,-1],[0,-1],[1,-1],[0,-1],[0,-2]],[[8898,4253],[0,-1],[1,-1],[0,-1],[0,-1],[0,-1],[1,-1],[0,-1]],[[8900,4246],[0,-1],[1,-1],[0,-1],[1,0],[0,-1],[0,-1],[1,0],[1,-2]],[[8904,4239],[1,0],[0,-1],[1,0],[0,-1],[1,0],[0,-1],[1,0],[1,-1]],[[8909,4235],[1,-1],[1,0],[1,0],[0,-1],[1,0],[1,0],[1,0],[1,-1]],[[8925,4230],[1,0],[2,-1],[1,0]],[[8929,4229],[2,-1],[3,-1]],[[8934,4227],[2,-1],[1,-1],[1,0]],[[8938,4225],[2,-1],[3,-2]],[[8997,4178],[2,-2],[2,-2],[1,-1],[2,-2],[1,-2],[3,-4]],[[9008,4165],[1,-2],[2,-2],[1,-2],[1,-3],[1,-2],[1,-4]],[[9015,4150],[1,-1],[0,-1],[1,-1],[0,-1],[1,-1],[0,-1],[1,0],[0,-1],[1,0],[0,-1],[1,0],[1,0]],[[9022,4142],[0,-1],[1,0],[0,-1],[1,0],[1,0],[1,0],[0,-1],[1,0],[1,0],[1,0],[1,0],[1,0]],[[9040,4140],[1,0],[2,0]],[[9046,4140],[1,0],[2,0]],[[9150,4118],[6,-1],[10,-4]],[[9166,4113],[6,-1],[10,-5]],[[9212,4092],[4,-2],[8,-4]],[[9224,4086],[3,-3],[7,-4]],[[9302,4154],[1,0],[1,-1],[1,0],[1,0]],[[9306,4153],[1,0],[1,0],[1,0]],[[9309,4153],[1,0],[1,0],[1,0],[1,0]],[[9313,4153],[1,0],[1,0],[1,0]],[[9316,4153],[1,1],[1,0],[1,1]],[[9319,4155],[1,0],[2,1]],[[9322,4156],[1,0],[1,1],[1,1],[1,1],[1,1],[1,0],[0,1],[1,1],[0,1],[1,0],[0,1],[1,1],[0,1],[1,1],[1,1],[0,1],[0,2]],[[9555,4077],[0,-1],[1,-1],[0,-1],[1,-1],[1,0],[1,-2]],[[9804,3438],[-1,-1],[-1,-1],[-1,-1],[0,-1],[-1,0],[0,-1],[-1,-1]],[[9799,3432],[-1,-1],[0,-1],[0,-1],[-1,-1],[0,-1],[0,-1],[0,-1],[-1,-1],[0,-1]],[[9790,3349],[-1,-2],[0,-4]],[[9789,3343],[-1,-2],[0,-2],[-1,-2],[-1,-5]],[[9768,3287],[0,-2],[-1,-1],[0,-2],[-1,-2],[0,-2],[-1,-3]],[[9765,3275],[0,-2],[0,-4]],[[9765,3269],[0,-2],[0,-2],[0,-2],[0,-2],[1,-2]],[[9766,3259],[0,-1],[0,-2],[1,-2],[1,-4]],[[9771,3242],[1,-2],[0,-1],[1,-1],[1,-2]],[[9774,3236],[1,-1]],[[9775,3235],[0,-1],[1,-1],[1,-1]],[[9777,3232],[0,-1],[2,-2]],[[9883,3118],[1,-1],[1,0],[0,1],[1,0],[1,0]],[[9887,3118],[1,0],[1,1],[1,0]],[[9886,3099],[1,-2],[0,-1],[1,-1],[1,-1],[1,-1],[1,-1],[2,-2]],[[9978,3016],[1,0],[1,-1],[1,-1],[1,0],[0,-1],[2,0],[1,-1],[1,0],[2,-1]],[[9988,3011],[1,-1],[1,0],[1,0],[1,0],[1,0],[1,-1],[1,0],[2,0],[2,0]],[[9944,2962],[-2,-2],[-2,-2]],[[9940,2958],[-3,-2],[-2,-2]],[[9929,2951],[-2,-2],[-3,-1]],[[9924,2948],[-3,-2],[-3,-1]],[[9835,2922],[-1,-1],[-1,0]],[[9833,2921],[-1,0],[-1,-1],[-1,0],[-1,0],[0,-1],[-1,0],[-1,-1],[-2,-1]],[[9825,2917],[0,-1],[-1,0],[0,-1],[-1,-1],[-1,-1],[0,-1],[-1,0],[0,-1],[-1,-1],[-1,-2]],[[9816,2899],[0,-1],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0]],[[9812,2895],[-1,0],[0,-1],[-1,0],[-1,0],[-1,0],[-1,0]],[[9748,2908],[-3,0],[-5,1]],[[9740,2909],[-3,1],[-5,2]],[[9697,2925],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]],[[9691,2925],[-1,0],[-1,0],[0,-1],[-1,0],[-1,-1],[-1,0],[0,-1]],[[9601,2973],[-1,0],[-2,-1],[-2,-1],[-4,-1]],[[9592,2970],[-2,0],[-2,0],[-1,-1],[-4,0]],[[9566,2969],[-2,0],[-2,0],[-2,-1],[-3,0]],[[9543,2964],[-2,0],[-2,0],[-2,-1],[-2,0],[-2,0],[-1,0],[-4,0]],[[9528,2963],[-2,1],[-2,0],[-2,0],[-2,1],[-2,0],[-1,1],[-4,1]],[[9486,2980],[-1,0],[-1,1],[-1,0],[-1,1],[-1,0],[-1,0],[-2,1],[-1,0],[-1,0],[-1,0],[-1,0],[-3,1]],[[9463,2981],[-1,0],[0,1],[-1,0],[0,1],[-1,0],[0,1],[-1,0],[0,1],[-1,0],[-1,1],[-2,0]],[[9455,2986],[0,1],[-1,0],[-1,0],[-1,1],[-1,0],[-1,0],[-1,0],[-1,0]],[[9448,2988],[-1,0],[-1,0],[-1,-1],[-1,0],[-1,0],[-1,-1],[-1,0],[-1,0],[0,-1],[-1,-1]],[[9439,2984],[-1,0],[-1,-1]],[[9437,2983],[-1,-1],[0,-1],[-1,0]],[[9435,2981],[0,-1],[-1,0],[0,-2]],[[9429,2969],[-1,-1],[-1,-1],[-1,-1],[-1,-2],[0,-1],[-1,-1],[-2,-2]],[[7480,3052],[-1,0]],[[7479,3052],[-1,0],[-1,1]],[[7471,3055],[-2,0]],[[7295,3314],[0,1],[0,1]],[[7295,3320],[0,2]],[[7214,3475],[-2,4],[-2,5]],[[7210,3484],[-5,8]],[[7205,3492],[-3,4],[-2,3]],[[7197,3503],[-6,6]],[[7191,3509],[-3,3],[-3,3]],[[7182,3518],[-7,5]],[[7235,3548],[-1,4],[0,3]],[[7234,3555],[0,7]],[[7234,3562],[1,2],[0,5]],[[7235,3569],[1,3],[1,5]],[[7240,3609],[-2,3],[-3,5]],[[7235,3617],[-1,2],[-2,4]],[[7232,3623],[-2,4],[-1,4]],[[7229,3631],[-3,8]],[[7208,3694],[-1,4],[-4,9]],[[7203,3707],[0,1],[-1,2]],[[7202,3710],[-1,3],[-3,7]],[[7198,3720],[0,2]],[[7198,3722],[-2,4],[-2,7]],[[7194,3733],[-1,4],[-2,9]],[[7181,3794],[-1,1],[-1,0]],[[7174,3802],[-2,2]],[[7172,3804],[-2,2]],[[8057,4249],[5,-2],[39,-11],[17,-5],[4,-1],[5,-2],[12,-3],[21,-6],[17,0],[28,0],[17,0],[17,1],[43,9],[27,11],[31,12],[5,-30],[7,-42],[42,8],[56,17],[26,-57],[40,42],[23,6],[40,-39],[24,11],[14,-50],[3,-2],[7,12],[4,-3]],[[8631,4125],[1,2],[2,4]],[[8634,4131],[2,2],[3,4]],[[8639,4137],[27,28],[-1,6],[28,23]],[[8693,4194],[4,4],[4,3]],[[8701,4201],[7,8]],[[8708,4209],[3,4],[4,4]],[[8715,4217],[5,9]],[[8720,4226],[2,3],[1,3]],[[8723,4232],[2,5]],[[8725,4237],[1,3],[1,3]],[[8727,4243],[2,6]],[[8729,4249],[9,45]],[[8738,4294],[0,2],[0,3]],[[8738,4299],[0,3],[0,2]],[[8738,4304],[0,6]],[[8738,4310],[-1,3],[0,2]],[[8737,4315],[-1,3],[0,2]],[[8736,4320],[-2,6]],[[8734,4326],[-1,2],[-1,3]],[[8732,4331],[-1,3],[-1,2]],[[8730,4336],[-2,5]],[[8728,4341],[-2,3],[-1,2]],[[8725,4346],[-2,2],[-2,2]],[[8721,4350],[-3,5]],[[8718,4355],[-15,14]],[[8703,4369],[-2,2],[-1,2]],[[8700,4373],[-2,2]],[[8698,4375],[-3,4]],[[8695,4379],[-2,2],[-1,2]],[[8692,4383],[-1,2]],[[8691,4385],[-3,4]],[[8688,4389],[-10,32],[-9,29],[-12,50]],[[8657,4500],[0,0]],[[8657,4500],[0,1],[0,1]],[[8657,4502],[0,1]],[[8657,4503],[0,0]],[[8657,4503],[0,1],[0,1]],[[8657,4505],[1,0]],[[8658,4505],[0,1]],[[8658,4506],[0,1],[1,0],[0,1],[1,1],[1,1]],[[8661,4510],[0,0]],[[8661,4510],[3,3],[5,4]],[[4101,5210],[0,1]],[[4101,5211],[-1,0],[-1,0]],[[4099,5211],[0,0]],[[4099,5211],[-8,-16]],[[4091,5195],[-3,-5],[-5,-10]],[[4083,5180],[-3,-5],[-6,-10]],[[4074,5165],[-17,-27],[-19,-29]],[[4038,5109],[0,0]],[[4038,5109],[1,0],[0,-1]],[[4039,5108],[1,-1]],[[4040,5107],[2,-1],[-9,-15],[-3,2]],[[4030,5093],[0,0]],[[4030,5093],[-1,0],[-1,0]],[[4028,5093],[0,0]],[[4028,5093],[-14,-22]],[[4014,5071],[-4,-7],[-8,-14]],[[4002,5050],[-4,-7],[-7,-15]],[[3991,5028],[-1,-2],[-1,-5]],[[3989,5021],[0,0]],[[3989,5021],[0,-1]],[[3989,5020],[1,0]],[[3990,5020],[3,-2],[-5,-12],[-2,1]],[[3986,5007],[0,1]],[[3986,5008],[-1,0],[-1,0]],[[3984,5008],[0,0]],[[3984,5008],[-3,-9],[-5,-16]],[[3976,4983],[-2,-8],[-3,-16]],[[3971,4959],[-1,-8],[-2,-16]],[[3968,4935],[0,-8],[-1,-16]],[[3967,4911],[1,-8],[0,-16]],[[3968,4887],[1,-8],[2,-16]],[[3971,4863],[1,-8],[4,-16]],[[3976,4839],[0,-1]],[[3976,4838],[1,-5],[3,-10]],[[3980,4823],[2,-6],[4,-11]],[[3986,4806],[1,0]],[[3987,4806],[0,-1],[1,0]],[[3988,4805],[0,0]],[[3988,4805],[2,-1],[7,-21]],[[3886,4825],[0,0]],[[3886,4825],[-1,1],[-1,0],[-1,0],[-1,0],[0,-1],[-1,0]],[[3881,4825],[-1,0]],[[3880,4825],[0,-1]],[[3880,4824],[-1,-1],[0,-1],[0,-1],[-1,0],[0,-1],[0,-1]],[[3878,4819],[0,0]],[[3292,5215],[-4,2],[-7,5]],[[3170,5297],[-1,1]],[[3169,5298],[-1,1]],[[3168,5299],[-1,0]],[[3167,5299],[-2,1]],[[3165,5300],[-1,0]],[[3164,5300],[-1,0]],[[3163,5300],[-1,1]],[[3162,5301],[-2,0]],[[3132,5304],[-1,0],[-1,0]],[[3128,5305],[-1,0],[-1,1]],[[3115,5311],[-1,0]],[[3114,5311],[-1,0],[-1,0]],[[3112,5311],[0,0]],[[3112,5311],[0,0]],[[3112,5311],[-1,0],[-1,0],[0,-1]],[[3110,5310],[0,0]],[[3135,5359],[1,0]],[[3136,5359],[1,0]],[[3137,5359],[1,0],[1,0],[1,0]],[[3140,5359],[1,1]],[[3141,5360],[2,0]],[[3143,5360],[0,1],[1,0]],[[3144,5361],[1,1]],[[3145,5362],[1,0],[0,1],[1,0]],[[3147,5363],[1,1]],[[3148,5364],[1,1]],[[3256,5495],[0,0]],[[3256,5495],[0,1],[1,0]],[[3257,5496],[0,1]],[[3257,5497],[1,1]],[[3258,5498],[0,0]],[[3258,5498],[0,1]],[[3258,5499],[0,1]],[[3258,5500],[0,1]],[[3258,5501],[0,1]],[[3258,5502],[0,0]],[[3258,5502],[0,1]],[[3258,5503],[0,1]],[[3258,5504],[-1,1]],[[3257,5505],[0,1]],[[3257,5506],[0,0]],[[3257,5506],[-1,0],[0,1]],[[3256,5507],[0,0]],[[3256,5507],[-1,1]],[[3255,5508],[-1,1]],[[3254,5509],[0,0]],[[3120,5618],[-1,0]],[[3119,5618],[0,1],[-1,0],[0,1],[-1,0],[0,1],[0,1],[-1,0],[0,1],[0,1]],[[3116,5624],[0,1]],[[3116,5625],[0,0]],[[3116,5625],[0,1],[0,1],[0,1],[0,1],[0,1],[1,0],[0,1],[0,1]],[[3117,5632],[1,0]],[[3211,5743],[0,1]],[[3211,5744],[1,0],[0,1]],[[3212,5745],[1,0]],[[3213,5745],[1,0]],[[3214,5745],[0,0]],[[3214,5745],[1,0]],[[3215,5745],[1,0],[1,0]],[[3217,5745],[0,0]],[[3294,6029],[4,-4],[3,-3]],[[3301,6022],[8,-6]],[[3537,5973],[4,-4],[7,-8]],[[3548,5961],[3,-4],[7,-8]],[[3558,5949],[3,-4],[2,-3]],[[3568,5935],[4,-8]],[[3572,5927],[2,-4],[2,-4]],[[3579,5911],[3,-8]],[[3587,5883],[1,-3],[2,-6]],[[3590,5874],[1,-4],[3,-7]],[[3594,5863],[2,-4],[2,-4]],[[3600,5851],[5,-7]],[[4088,5616],[1,-19],[4,-36],[11,-50],[12,-59],[10,-63],[3,-42],[1,-34],[-5,-47],[-14,-38],[-9,-18],[-1,0]],[[4357,5505],[2,-3],[3,-3]],[[4362,5499],[3,-3],[2,-2]],[[4382,5482],[5,-2],[9,-4]],[[4401,5475],[3,-1],[6,-2]],[[4421,5470],[4,-1],[4,-2]],[[4429,5467],[4,-1]],[[4433,5466],[7,-3]],[[4440,5463],[2,-1],[2,-1]],[[4547,5393],[0,0]],[[4547,5393],[0,-1]],[[4547,5392],[0,-1],[0,-1]],[[4547,5390],[0,0]],[[4570,5352],[1,2],[1,2]],[[4572,5356],[1,2],[1,2]],[[4576,5364],[2,1],[1,2]],[[4579,5367],[2,2],[1,1]],[[4587,5375],[0,0]],[[4587,5375],[1,0],[0,1],[0,1]],[[4588,5377],[0,0]],[[4588,5377],[0,0]],[[4588,5377],[0,1],[0,1],[0,1],[-1,1]],[[4587,5381],[0,0]],[[4587,5382],[0,0]],[[4587,5382],[-1,0]],[[4586,5382],[0,0]],[[4586,5382],[0,0]],[[4586,5382],[0,1]],[[4586,5383],[0,0]],[[4995,5200],[0,0]],[[4995,5200],[1,-1],[0,-1]],[[4996,5198],[0,0]],[[4996,5198],[0,0]],[[4996,5198],[0,-1],[0,-1],[-1,0]],[[4995,5196],[0,-1]],[[5031,5177],[2,-1],[3,-1]],[[5036,5175],[2,-1],[3,-2]],[[5046,5030],[-1,-1],[-1,-3]],[[5044,5026],[-1,-2],[-2,-2]],[[4757,4620],[-31,10],[-5,2],[0,1],[-4,1],[-25,9],[-13,6],[-1,-3],[-2,1],[-12,5],[-19,4],[-12,1],[-15,-1],[-1,-1],[-9,-2],[-7,-2],[-14,-4],[-12,-4],[-16,-5],[-13,-4],[-22,-6],[-8,-5],[-13,7],[-13,5],[-3,1],[-35,19],[-3,1],[-13,7],[-11,6],[-11,6],[-11,6],[-8,4],[-8,4],[-8,5],[-11,5],[-6,4],[-5,3],[-14,7],[-2,-1],[-11,-2],[0,-1]],[[4330,4709],[0,0]],[[4330,4709],[0,1],[0,1],[0,1]],[[4330,4712],[0,1]],[[4330,4713],[0,0]],[[4330,4713],[-1,0],[0,1],[-1,0],[-1,0],[0,1]],[[4327,4715],[0,0]],[[4327,4715],[-21,1],[-23,1],[-39,2],[-11,0],[-11,1],[-2,0],[-15,1],[-16,0],[-11,1],[-8,2],[-4,0],[-9,3],[-7,2],[-22,6],[0,1],[-10,3],[-9,3],[-14,5],[0,1],[-25,10],[-45,16],[-1,-1],[-7,3]],[[3988,4805],[0,0]],[[3987,4806],[-1,0]],[[3986,4806],[-2,6],[-4,11]],[[3980,4823],[-1,5],[-3,10]],[[3976,4839],[-2,8],[-3,16]],[[3971,4863],[-1,8],[-2,16]],[[3968,4887],[0,8],[-1,16]],[[3967,4911],[1,8],[0,16]],[[3968,4935],[1,8],[2,16]],[[3971,4959],[2,8],[3,16]],[[3976,4983],[2,8],[6,17]],[[3984,5008],[0,0]],[[3986,5008],[0,-1]],[[3990,5020],[-1,0]],[[3989,5021],[0,0]],[[3989,5021],[1,3],[1,4]],[[3991,5028],[4,8],[7,14]],[[4002,5050],[4,7],[8,14]],[[4028,5093],[0,0]],[[4030,5093],[0,0]],[[4040,5107],[0,1],[-1,0]],[[4038,5109],[0,0]],[[4074,5165],[3,5],[6,10]],[[4083,5180],[3,5],[5,10]],[[4099,5211],[0,0]],[[4101,5211],[0,-1]],[[4506,4287],[-1,0]],[[4505,4287],[-1,0],[-1,0],[-1,0],[-1,0]],[[4501,4287],[-1,0]],[[4261,4489],[0,0]],[[4261,4489],[-1,0]],[[4260,4489],[0,1]],[[4260,4490],[0,0]],[[4260,4490],[0,0]],[[4327,4715],[0,0]],[[4330,4713],[0,0]],[[4330,4713],[0,-1]],[[4330,4709],[0,0]],[[4260,4490],[0,0]],[[4261,4489],[0,0]],[[4500,4287],[1,0]],[[4505,4287],[1,0]],[[4265,3962],[-6,26],[-11,8],[-1,3],[0,3],[-5,14],[-2,-1]],[[4240,4015],[0,3],[-1,2]],[[4239,4020],[-1,3],[0,3],[-1,3]],[[4237,4029],[0,5]],[[4237,4034],[0,3],[-1,3]],[[4236,4040],[0,3],[1,2],[0,3]],[[4237,4048],[1,6]],[[4238,4054],[0,2]],[[4238,4056],[0,1],[1,1]],[[4239,4058],[0,2],[1,4]],[[4240,4064],[1,2],[1,3]],[[4242,4069],[1,3],[1,5]],[[4244,4077],[1,2],[2,5]],[[4247,4084],[9,22],[-6,5],[-17,9],[-7,9],[2,1],[-5,6],[-8,11],[-7,10],[-8,10],[-7,9],[-9,13],[-7,8],[-7,10],[-5,7],[-6,7],[-2,3]],[[4157,4224],[0,0]],[[4157,4224],[0,1],[-1,0],[-1,0]],[[4155,4225],[0,0]],[[4155,4225],[-13,15],[-11,13],[-10,10],[-1,2],[-1,0],[-1,1],[-8,9],[-9,10],[-6,6],[-9,10],[-9,9],[-3,-1],[-12,3],[-4,7]],[[4058,4319],[-2,2],[-1,2]],[[4055,4323],[-2,3]],[[4053,4326],[-1,1],[-1,2]],[[4051,4329],[-3,2]],[[4048,4331],[-1,1],[-3,3]],[[4044,4335],[-2,1],[-2,1]],[[4040,4337],[-1,1]],[[4039,4338],[-4,1]],[[4035,4339],[-3,1],[-24,7],[2,2],[-10,4],[-1,-2],[-13,5],[-27,18],[-9,4],[-8,3],[-2,1],[-12,6],[-8,3]],[[3920,4391],[0,0]],[[3920,4391],[-1,0]],[[3919,4391],[0,0]],[[3919,4391],[-11,3],[-6,3]],[[3902,4397],[-1,1],[-1,0]],[[3900,4398],[-1,1],[-1,0],[-1,1],[-1,0]],[[3896,4400],[-2,0]],[[3894,4400],[-1,1],[-1,0]],[[3892,4401],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]],[[3887,4401],[-2,-1]],[[3885,4400],[-25,-4],[-9,-2],[-7,-1],[-4,-1],[-3,0],[-13,-3],[-9,-1],[-19,-4],[-7,-1],[-10,-2],[-3,0],[-4,-1],[-4,-1]],[[3768,4379],[0,0]],[[3768,4379],[-1,0],[0,-1],[-1,0],[0,-1],[-1,0]],[[3765,4377],[0,-1]],[[3765,4376],[-9,-5],[-2,0],[-13,-3],[-69,-6],[-11,-2],[-7,-2],[-7,-1],[-7,-1],[-7,-2],[-7,-1],[-13,-2]],[[3613,4351],[0,0]],[[3613,4351],[-1,0],[0,-1],[-1,0]],[[3611,4350],[0,-1]],[[3611,4349],[0,0]],[[3611,4349],[0,-1],[1,0]],[[3612,4348],[0,-1]],[[3612,4347],[-11,2],[-9,-2],[-12,-2],[-18,-4],[-5,-1],[-12,-2],[1,-2],[-3,-1],[-13,-2],[-25,-2],[-13,-2],[-10,-2],[-13,-3],[-10,-2],[-52,-10],[-2,0],[-1,0],[-1,0],[-16,-4]],[[3387,4308],[0,0]],[[3387,4308],[-1,0],[0,1]],[[3386,4309],[-1,0]],[[3385,4309],[-13,-3],[-13,-2],[-18,-4],[-15,-2],[-12,-3],[-6,-1],[-12,-2],[-15,-3]],[[3281,4289],[-1,0],[-3,-1]],[[3277,4288],[-2,0],[-2,-1]],[[3273,4287],[-15,-6]],[[3258,4281],[-2,0],[-26,-5],[-8,-1],[-12,-2]],[[3210,4273],[-2,-1],[-6,-1]],[[3202,4271],[-2,0],[-6,-1]],[[3194,4270],[0,1]],[[3194,4271],[0,1],[-1,0]],[[3193,4272],[0,0]],[[3193,4272],[0,0]],[[3193,4272],[0,1],[-1,0],[-1,0]],[[3191,4273],[0,0]],[[3191,4273],[-14,-3],[-11,-2],[-7,-1],[-16,-3],[-12,-2],[-3,-1],[-11,-2],[-13,-2],[-9,-2],[-16,-3],[-18,-4],[-33,-6]],[[3028,4242],[-2,0],[-5,-1]],[[3021,4241],[-3,-1],[-5,-1]],[[3013,4239],[-29,-6],[-36,-6],[-11,-2],[-3,0],[-3,-1],[-21,-4],[-24,-5],[-3,-1],[-30,-6],[-12,-3],[-4,-1],[-15,-3],[-18,-4],[-12,-3],[-16,-3],[-23,-5],[-9,-3]],[[2744,4183],[-1,0],[-2,-1]],[[2741,4182],[-2,-1],[-3,-2]],[[2736,4179],[-2,-1]],[[2734,4178],[-5,-3]],[[2729,4175],[5,-15],[0,-2],[-18,-7],[-8,-4],[-3,-3],[-30,-17]],[[2675,4127],[-3,-1],[-4,-4]],[[2668,4122],[-3,-2],[-2,-2]],[[2663,4118],[-3,-3]],[[2660,4115],[-4,-5]],[[2656,4110],[-2,-2],[-3,-3]],[[2651,4105],[-1,-3]],[[2650,4102],[-4,-6]],[[2656,4142],[-3,0],[-2,0]],[[2646,4142],[-2,0],[-3,0]],[[2636,4141],[-2,-1],[-3,-1]],[[2631,4139],[-2,0]],[[2629,4139],[-5,-2]],[[2624,4137],[-2,-1],[-2,-1]],[[2620,4135],[-2,-1]],[[2618,4134],[-4,-3]],[[2606,4142],[2,2],[2,2]],[[2610,4146],[2,1]],[[2612,4147],[4,4]],[[2616,4151],[2,2],[2,2]],[[2620,4155],[2,2]],[[2622,4157],[3,4]],[[2625,4161],[0,0]],[[2625,4161],[0,1],[1,1],[0,1]],[[2626,4164],[0,0]],[[2626,4164],[0,1]],[[2626,4165],[0,1],[-1,1]],[[2625,4167],[0,1]],[[2629,4188],[1,0]],[[2630,4188],[1,-1]],[[2631,4187],[0,0]],[[2631,4187],[1,0]],[[2632,4187],[1,0]],[[2633,4187],[1,0]],[[2634,4187],[1,0]],[[2635,4187],[1,0]],[[2636,4187],[0,0]],[[2636,4187],[1,0],[1,0],[1,0]],[[2639,4187],[0,1]],[[2639,4188],[1,0]],[[2640,4188],[1,0],[0,1],[1,0]],[[2642,4189],[1,1]],[[2655,4202],[4,5],[8,9]],[[2667,4216],[5,5],[11,11]],[[2683,4236],[1,1]],[[2684,4237],[2,2],[4,3]],[[2690,4242],[2,2],[5,3]],[[2697,4247],[3,3],[7,4]],[[2707,4254],[6,4],[12,7]],[[2797,4304],[5,3],[11,6]],[[2811,4314],[5,3],[8,5]],[[2824,4322],[7,5],[14,10]],[[2854,4342],[5,4],[9,7]],[[2868,4353],[4,4],[9,8]],[[2881,4365],[5,4],[8,9]],[[2894,4378],[4,3],[6,7]],[[2904,4388],[1,1],[1,2]],[[2916,4401],[17,21]],[[2933,4422],[6,8],[12,17]],[[2952,4448],[5,9],[11,17]],[[3050,4724],[0,0]],[[3050,4724],[0,1]],[[3050,4725],[1,0]],[[3051,4725],[0,1]],[[3051,4726],[0,1]],[[3051,4727],[0,0]],[[3051,4727],[0,1]],[[3051,4728],[0,0]],[[3051,4728],[0,1]],[[3051,4729],[-1,0],[0,1]],[[3050,4730],[0,0]],[[3050,4730],[0,1]],[[3050,4731],[-3,4],[-6,10]],[[3041,4745],[-3,4],[-7,9]],[[2874,4974],[-1,0],[0,1]],[[2873,4975],[0,0]],[[2873,4975],[-1,1]],[[2872,4976],[-1,1]],[[2871,4977],[0,0]],[[2871,4977],[-1,1]],[[2877,5044],[6,8],[12,17]],[[2895,5069],[3,3],[5,7]],[[2903,5079],[3,4],[6,8]],[[2912,5091],[1,0],[1,2]],[[2914,5093],[3,4],[8,9]],[[2925,5106],[2,3],[6,7]],[[2933,5116],[5,6],[10,11]],[[2948,5133],[2,2],[3,3]],[[3029,5219],[4,4],[7,8]],[[3040,5231],[4,4],[7,8]],[[3102,5302],[1,2],[3,2]],[[3106,5306],[1,2],[3,2]],[[3110,5310],[0,0]],[[3112,5311],[0,0]],[[3112,5311],[0,0]],[[3114,5311],[1,0]],[[3124,5306],[1,0],[1,0]],[[3128,5305],[1,0],[1,-1]],[[3160,5301],[1,0],[1,0]],[[3164,5300],[1,0]],[[3165,5300],[1,-1],[1,0]],[[3169,5298],[1,-1]],[[3281,5222],[3,-2],[8,-5]],[[3878,4819],[0,0]],[[3880,4824],[0,1]],[[3880,4825],[1,0]],[[3886,4825],[0,0]],[[2953,5138],[-1,-1],[-4,-4]],[[2948,5133],[-5,-6],[-10,-11]],[[2933,5116],[-3,-3],[-5,-7]],[[2925,5106],[-4,-4],[-7,-9]],[[2914,5093],[-1,-1],[-1,-1]],[[2912,5091],[-3,-4],[-6,-8]],[[2903,5079],[-3,-4],[-5,-6]],[[2895,5069],[-6,-9],[-12,-16]],[[2870,4978],[0,-1],[1,0]],[[2871,4977],[1,-1]],[[2872,4976],[0,-1],[1,0]],[[2873,4975],[1,-1]],[[3031,4758],[4,-4],[6,-9]],[[3041,4745],[3,-5],[6,-9]],[[3050,4731],[0,-1]],[[3051,4728],[0,-1]],[[3051,4727],[0,0]],[[3050,4724],[0,0]],[[2968,4474],[-5,-8],[-11,-18]],[[2951,4447],[-5,-8],[-13,-17]],[[2925,4411],[-18,-21]],[[2906,4391],[0,-1],[-2,-2]],[[2904,4388],[-3,-3],[-7,-7]],[[2894,4378],[-4,-5],[-9,-8]],[[2881,4365],[-4,-4],[-9,-8]],[[2868,4353],[-5,-4],[-9,-7]],[[2845,4337],[-7,-5],[-14,-10]],[[2824,4322],[-4,-2],[-9,-6]],[[2813,4313],[-6,-3],[-10,-6]],[[2725,4265],[-6,-3],[-12,-8]],[[2707,4254],[-3,-2],[-7,-5]],[[2697,4247],[-2,-2],[-5,-3]],[[2690,4242],[-2,-2],[-4,-3]],[[2684,4237],[-1,-1]],[[2683,4232],[-6,-5],[-10,-11]],[[2667,4216],[-4,-4],[-8,-10]],[[2643,4190],[-1,0],[0,-1]],[[2640,4188],[-1,0]],[[2639,4188],[0,-1]],[[2636,4187],[0,0]],[[2636,4187],[-1,0]],[[2633,4187],[-1,0]],[[2632,4187],[-1,0]],[[2630,4188],[-1,0]],[[2625,4168],[0,-1]],[[2626,4165],[0,-1]],[[2626,4164],[0,0]],[[2625,4161],[0,0]],[[2625,4161],[-2,-2],[-1,-2]],[[2620,4155],[-4,-4]],[[2616,4151],[-2,-2],[-2,-2]],[[2610,4146],[-4,-4]],[[2614,4131],[2,1],[2,2]],[[2620,4135],[4,2]],[[2624,4137],[3,1],[2,1]],[[2631,4139],[5,2]],[[2636,4141],[3,0],[2,1]],[[2646,4142],[3,0],[2,0]],[[2646,4096],[-2,-3],[-1,-3]],[[2632,4063],[-3,-8],[-6,-17]],[[2602,3971],[-1,-6],[-3,-13]],[[2598,3952],[-1,-2],[0,-3]],[[2597,3947],[-1,-5],[-2,-10]],[[2594,3931],[0,-1]],[[2594,3930],[0,-1]],[[2594,3929],[-1,0]],[[2593,3929],[0,-1]],[[2593,3928],[0,-1]],[[2593,3927],[-1,0]],[[2592,3927],[0,0]],[[2592,3927],[0,-1]],[[2592,3926],[-1,0]],[[2591,3926],[-1,0]],[[2590,3926],[-1,0],[0,-1]],[[2589,3925],[0,0]],[[2589,3925],[-1,0]],[[2588,3925],[0,0]],[[2588,3925],[-1,0],[0,1],[-1,0]],[[2586,3926],[-1,0],[-1,1]],[[2584,3927],[0,0]],[[2584,3927],[0,0]],[[2584,3927],[-1,0],[0,1],[-1,1]],[[2582,3929],[0,1]],[[2582,3930],[-1,1]],[[942,4255],[3,1],[7,3]],[[1252,4695],[6,0],[11,15],[7,9],[4,5],[21,25],[14,16],[17,18],[8,8],[5,6],[0,1],[-5,9],[20,17],[24,17],[15,10],[31,18],[-3,2],[1,1],[0,1],[18,9],[20,6],[37,82],[5,-2],[9,-1],[1,-16],[12,-1],[12,0],[0,8],[1,15],[2,11],[7,2],[22,6],[5,2],[22,11],[10,8],[25,18],[22,23],[2,3],[7,6],[16,12],[5,5],[1,2],[13,9],[10,8],[8,7],[19,17],[18,15],[8,8],[5,20],[14,12],[25,16],[4,3],[22,15],[6,4],[19,15],[6,-6],[17,-20],[18,-22],[1,-1],[1,1],[23,18],[27,-1],[1,10],[18,36],[19,1],[9,-1],[16,-2],[17,-2],[7,8],[15,17],[2,3],[15,-12],[1,-1],[25,-20],[11,34],[9,26],[1,5],[3,-2],[8,22],[9,26],[9,22],[14,0],[11,20],[1,0],[2,3],[-11,7],[-8,5],[25,19],[6,17],[5,15],[42,-17],[10,-4],[27,-11],[12,-5],[21,-8],[21,-8]],[[2326,5403],[9,-4],[19,-8]],[[2354,5391],[1,-1]],[[2355,5390],[1,0],[4,-2]],[[2360,5388],[7,-3],[14,-7]],[[2381,5378],[10,-5],[18,-10]],[[2409,5363],[3,-2],[7,-4]],[[2419,5357],[6,-3],[10,-6]],[[2435,5348],[16,-10],[9,3],[9,15],[10,17],[24,39],[5,8],[7,-6],[8,4],[7,-6],[4,0],[26,-22],[26,-22],[4,5],[8,15],[22,-19],[13,-9],[15,24],[21,34],[23,36],[3,6],[4,6],[6,-3],[1,-1],[4,-3],[39,-26],[17,-11],[22,-15],[41,-27],[2,-2],[8,-5],[-3,-3],[-6,-8],[-17,-20],[-2,-2],[1,-1],[8,-8],[0,-1],[6,-8],[10,-11],[7,-7],[4,-5],[7,-7],[3,-3],[3,-3],[3,-4],[2,-1],[7,-6],[4,-4],[3,-3],[9,-8],[8,-7],[4,-3],[4,-3],[13,-10],[2,-1],[4,-4],[14,-15],[6,6],[2,3],[1,1],[2,2],[2,3],[3,3],[6,6],[5,6],[3,3],[2,3],[3,3],[5,6],[3,3],[12,-8],[26,-17],[5,-3]],[[3023,5237],[0,0]],[[3023,5237],[1,-1],[0,-1],[1,0],[0,-1]],[[3025,5234],[0,0]],[[3025,5234],[0,-1]],[[3025,5233],[0,-1],[0,-1],[-1,0],[0,-1]],[[3024,5230],[0,0]],[[3024,5230],[-1,-4],[6,-7]],[[8078,5516],[4,-2],[8,-3]],[[8090,5511],[4,-1],[8,-3]],[[8123,5495],[1,0],[0,-1],[1,0],[0,-1]],[[8125,5493],[0,-1],[0,-1],[0,-1]],[[8661,4510],[0,0]],[[8658,4506],[0,-1]],[[8658,4505],[-1,0]],[[8657,4503],[0,0]],[[8657,4503],[0,-1]],[[8657,4500],[0,0]],[[8688,4389],[2,-2],[1,-2]],[[8692,4383],[3,-4]],[[8695,4379],[1,-2],[2,-2]],[[8700,4373],[3,-4]],[[8718,4355],[1,-2],[2,-3]],[[8725,4346],[3,-5]],[[8728,4341],[1,-2],[1,-3]],[[8732,4331],[2,-5]],[[8734,4326],[1,-3],[1,-3]],[[8737,4315],[1,-5]],[[8738,4310],[0,-3],[0,-3]],[[8738,4299],[0,-5]],[[8729,4249],[-1,-3],[-1,-3]],[[8727,4243],[-2,-6]],[[8725,4237],[-1,-3],[-1,-2]],[[8723,4232],[-3,-6]],[[8720,4226],[-2,-4],[-3,-5]],[[8715,4217],[-7,-8]],[[8708,4209],[-3,-4],[-4,-4]],[[8701,4201],[-8,-7]],[[8639,4137],[-2,-2],[-3,-4]],[[8634,4131],[-1,-2],[-2,-4]],[[6792,4074],[0,-1]],[[6792,4070],[0,0]],[[6792,4070],[0,-1],[1,0]],[[6794,4066],[1,0]],[[6795,4066],[2,-3],[4,-4]],[[6801,4059],[2,-2],[5,-4]],[[6651,3998],[0,0]],[[6651,3998],[-1,0]],[[6650,3998],[0,0]],[[6649,3998],[0,0]],[[6646,3996],[0,-1]],[[6646,3994],[0,0]],[[6646,3994],[0,0]],[[6645,3993],[0,0]],[[6621,3981],[0,0]],[[6620,3980],[0,-1]],[[6405,3847],[-1,0]],[[6403,3847],[0,0]],[[6403,3847],[0,0]],[[6402,3847],[0,0]],[[6107,3842],[0,0]],[[6104,3842],[0,0]],[[6054,3862],[0,0]],[[6052,3865],[0,0]],[[5887,3941],[0,1],[-2,1]],[[5885,3943],[-2,1]],[[5872,3951],[-1,0],[-1,1]],[[5867,3952],[-3,0]],[[5864,3952],[-1,0],[-2,1]],[[5861,3953],[-1,1],[-3,1]],[[5857,3955],[-2,1],[-4,2]],[[5851,3958],[-3,1],[-4,2]],[[5844,3961],[-4,1],[-7,3]],[[5833,3965],[-4,1],[-7,2]],[[5822,3968],[-2,1],[-4,1]],[[5816,3970],[-1,0],[-4,1]],[[5811,3971],[-2,0],[-2,1]],[[5807,3972],[-2,0],[-3,0]],[[5755,3977],[-3,0],[-7,2]],[[5745,3979],[-3,1],[-6,2]],[[5696,3998],[0,0]],[[5695,3998],[0,0]],[[5695,3998],[0,0]],[[5694,3998],[0,1]],[[5791,4528],[0,2],[0,2]],[[5791,4532],[0,2],[0,2]],[[5791,4541],[0,2],[-1,2]],[[5790,4550],[-1,1],[-1,3]],[[5784,4569],[0,1]],[[5784,4570],[0,1],[-1,1],[0,1]],[[5783,4573],[0,1]],[[5783,4574],[0,1],[0,1]],[[5783,4576],[1,1],[0,1]],[[5784,4578],[0,2]],[[5784,4580],[1,0],[0,1]],[[5785,4581],[0,1],[1,0],[0,1]],[[5786,4583],[1,1]],[[5787,4584],[1,1]],[[5788,4585],[1,1],[1,1]],[[5790,4587],[1,0]],[[5791,4587],[9,5],[31,17],[10,5],[2,1],[13,5],[9,4],[1,1],[1,0],[1,0],[11,5],[17,6],[-1,-3],[10,-19],[2,-3],[-4,-2],[6,-10],[8,-14],[11,-19],[3,-6],[14,-24],[2,-3],[10,-18],[4,-6],[5,-9],[6,-11],[14,-22],[0,-1],[1,1],[31,20],[-1,3],[1,1],[9,3],[6,2],[1,0],[-3,5],[7,4]],[[6038,4505],[0,-1]],[[6038,4504],[1,0],[0,-1],[1,0],[0,-1],[1,0]],[[6041,4502],[0,0]],[[6041,4502],[1,0]],[[6042,4502],[1,0],[1,0],[1,0]],[[6045,4502],[0,1]],[[6045,4503],[17,11],[6,4],[15,10],[9,7]],[[6092,4535],[0,0]],[[6092,4535],[1,0],[0,1],[1,0],[0,1],[0,1]],[[6094,4538],[0,0]],[[6094,4538],[0,1]],[[6094,4539],[0,1],[0,1],[0,1]],[[6094,4542],[0,0]],[[6094,4542],[5,4],[4,-7],[1,0],[2,2],[17,13],[14,11],[2,1],[6,5],[1,1],[5,3],[3,1],[4,3],[2,1],[5,2],[6,4],[11,6],[-5,11],[13,13]],[[6190,4616],[1,-1],[3,-3]],[[6194,4612],[1,-1]],[[6195,4611],[2,-1],[1,0]],[[6198,4610],[1,-1],[1,-1],[2,-1],[1,0]],[[6203,4607],[3,-1]],[[6206,4606],[1,-1],[1,0]],[[6208,4605],[2,-1],[1,0],[2,0],[1,-1]],[[6214,4603],[3,0]],[[6217,4603],[2,0],[2,0]],[[6221,4603],[1,0]],[[6222,4603],[4,0]],[[6226,4603],[1,0],[2,1]],[[6229,4604],[7,1],[-1,7],[3,1]],[[6238,4613],[1,0],[3,0]],[[6242,4613],[1,0],[2,0]],[[6245,4613],[1,0]],[[6246,4613],[2,-1]],[[6248,4612],[1,0],[3,-1]],[[6252,4611],[11,25],[5,3],[6,6],[2,2],[2,1],[3,3],[10,3],[4,15],[0,1],[7,-2],[2,7],[5,20],[1,3],[10,20],[1,0],[1,1],[1,0],[3,18],[0,1],[0,7],[0,7],[0,12],[-2,19],[11,7],[3,1]],[[6338,4791],[-1,3],[-3,4]],[[6334,4798],[7,5],[5,7],[14,2],[18,1],[14,4],[38,5],[0,2],[3,0],[16,3],[11,1],[0,-1],[12,1]],[[6472,4828],[5,1],[9,1]],[[6486,4830],[1,0],[1,0]],[[6488,4830],[4,-1],[8,0]],[[6500,4829],[13,-2],[2,-2],[13,8],[11,4]],[[6539,4837],[1,0],[1,0]],[[6541,4837],[1,0]],[[6542,4837],[2,0]],[[6544,4837],[1,0],[2,0]],[[6547,4837],[2,1],[5,2]],[[6554,4840],[3,1],[2,1]],[[6559,4842],[5,2]],[[6564,4844],[6,4],[10,5],[13,8],[14,8],[3,1]],[[6610,4870],[3,2],[3,1]],[[6616,4873],[6,3]],[[6622,4876],[3,1],[5,1]],[[6630,4878],[2,1],[4,0]],[[6636,4879],[1,1],[3,0]],[[6640,4880],[2,0],[3,0]],[[6645,4880],[1,0],[1,0]],[[6647,4880],[1,0],[2,0]],[[6650,4880],[20,-1],[7,0]],[[6677,4879],[3,0],[2,0]],[[6682,4879],[3,0],[2,1]],[[6687,4880],[6,0]],[[6693,4880],[1,1],[3,0]],[[6697,4881],[3,1],[2,1]],[[6702,4883],[6,2]],[[6708,4885],[5,3],[16,7],[17,8],[16,8],[15,7]],[[6777,4918],[6,3],[12,6]],[[6795,4927],[1,0],[2,1]],[[6798,4928],[6,4],[13,8]],[[6817,4940],[48,30]],[[6865,4970],[4,2],[8,5]],[[6877,4977],[4,2],[9,4]],[[6890,4983],[27,13]],[[6917,4996],[5,3],[5,1]],[[6927,5000],[10,4]],[[6937,5004],[5,1],[5,1]],[[6947,5006],[10,2]],[[6957,5008],[1,0]],[[6958,5008],[1,2],[-15,22],[-17,27],[-5,5],[6,1],[23,7],[35,17],[29,16],[25,10],[12,8],[17,13],[19,15],[7,3],[6,-1],[-9,10],[-26,34],[-36,49],[-23,32],[-16,21],[-26,36],[9,5],[1,1],[0,1]],[[6975,5342],[-1,0]],[[6974,5342],[0,1],[0,1],[-1,0]],[[6973,5344],[0,1]],[[6973,5345],[0,0]],[[6973,5345],[0,1],[0,1],[0,1]],[[6973,5348],[1,0]],[[6974,5348],[19,58],[18,58]],[[7011,5464],[2,4],[1,4]],[[7014,5472],[2,4]],[[7016,5476],[4,8]],[[7020,5484],[1,2],[3,5]],[[7024,5491],[3,4],[5,7]],[[7032,5502],[3,3],[2,4]],[[7037,5509],[3,3]],[[7040,5512],[7,6]],[[7047,5518],[3,2],[3,3]],[[7053,5523],[4,2]],[[7057,5525],[7,5]],[[7064,5530],[44,26],[8,5],[7,4]],[[7123,5565],[1,1],[3,1]],[[7127,5567],[1,1],[3,1]],[[7131,5569],[13,6],[5,0],[0,3]],[[7149,5578],[4,-1],[9,0]],[[7162,5577],[4,0],[9,1]],[[7175,5578],[5,0],[10,1]],[[7190,5579],[5,1],[9,2]],[[7204,5582],[5,2],[4,1]],[[7213,5585],[9,3]],[[7222,5588],[4,2],[5,2]],[[7231,5592],[8,5]],[[7239,5597],[5,3],[9,7]],[[7253,5607],[5,3],[9,7]],[[7267,5617],[9,7],[17,14]],[[7293,5638],[4,4],[7,6]],[[7304,5648],[3,4],[7,6]],[[7314,5658],[1,1],[1,1]],[[7316,5660],[1,2]],[[7317,5662],[1,1]],[[7318,5663],[1,2]],[[7319,5665],[1,1],[0,1]],[[7320,5667],[0,1],[1,1],[0,1],[1,1]],[[7322,5671],[0,2]],[[7322,5673],[2,8]],[[7324,5681],[0,0]],[[7324,5681],[0,1],[0,1],[1,0]],[[7325,5683],[0,0]],[[7325,5683],[0,1]],[[7325,5684],[1,0],[0,1],[1,0]],[[7327,5685],[0,1]],[[7327,5686],[16,10],[16,10],[11,14],[6,12],[19,36],[8,32],[23,41],[24,17],[52,19],[29,12],[19,12],[9,10],[2,6]],[[5320,4056],[0,0]],[[5320,4056],[0,0]],[[5320,4056],[0,0]],[[5320,4057],[0,0]],[[5316,4074],[0,0]],[[5316,4075],[0,0]],[[5316,4075],[0,0]],[[5315,4075],[0,0]],[[5310,4077],[-1,0],[-1,0]],[[5301,4081],[-1,1]],[[5300,4082],[-1,0]],[[5295,4090],[-1,1]],[[5289,4113],[0,1],[0,3]],[[5289,4117],[-1,1],[0,2]],[[5290,4157],[0,0]],[[5291,4158],[0,0]],[[5291,4158],[0,0]],[[5291,4158],[0,0]],[[5294,4259],[0,0]],[[5295,4261],[0,0]],[[5295,4261],[0,0]],[[5296,4262],[0,0]],[[5298,4287],[-1,0]],[[5296,4288],[0,0]],[[5296,4288],[0,0]],[[5296,4289],[0,1]],[[5301,4336],[0,0]],[[5301,4336],[0,0]],[[5301,4336],[0,0]],[[5302,4337],[0,0]],[[5292,4343],[0,0]],[[5291,4343],[0,0]],[[5291,4343],[0,0]],[[5291,4344],[0,0]],[[5315,4866],[1,3],[0,6]],[[5316,4875],[1,3],[0,6]],[[5317,4884],[1,5],[0,11]],[[5318,4900],[0,5],[0,10]],[[5318,4915],[56,-7],[35,-1],[4,0],[0,1],[0,1],[0,7],[0,5],[0,8],[8,0],[0,-1],[4,0],[0,1],[9,0],[13,-25],[8,-22],[2,-4],[4,-10],[8,-20],[2,-5],[4,-8],[4,-9],[11,-27],[3,-9],[4,-10],[1,0],[4,-11],[4,-9],[6,-14],[15,-28],[5,-9],[7,-13],[4,-6],[6,-11],[3,-6],[3,-6],[2,-4],[5,-8],[4,-8],[9,-20],[1,1],[3,-10],[3,-11],[4,-12],[-6,-2],[6,-28],[6,-28],[2,-17],[1,-32],[-16,-25],[-2,-3],[-9,-16],[-10,1],[-1,-5],[-3,-6],[1,0],[0,-1],[-3,-4],[-1,-1],[0,-1],[-4,-6],[-3,-3],[2,-6],[11,-5],[2,-1],[5,-16],[5,2]],[[5569,4392],[0,0]],[[5569,4392],[0,1],[0,1],[1,0],[0,1],[1,0]],[[5571,4395],[0,0]],[[5571,4395],[0,0]],[[5571,4395],[1,0],[0,-1],[1,0]],[[5573,4394],[0,-1]],[[5573,4393],[12,-29],[10,-19],[6,-11],[10,-20],[6,-12]],[[5617,4302],[0,0]],[[5617,4302],[0,-1]],[[5617,4301],[0,0]],[[5617,4301],[0,0]],[[5617,4301],[0,0]],[[5617,4301],[1,0]],[[5618,4301],[5,-11],[3,-4],[-1,-9],[-2,-4],[-6,-10],[-6,-9],[-10,-18],[-6,-8],[-4,-5],[-3,-4],[-6,-6],[-10,-8],[-10,-7],[-30,-21],[-9,-6],[-7,-5],[-16,-11],[-11,-7],[-7,-5],[-20,-11]],[[5462,4132],[0,0]],[[5462,4132],[0,-1],[0,-1],[-1,0],[-1,0],[0,-1],[-1,0]],[[5459,4129],[0,0]],[[5459,4129],[-20,-10],[-26,-8]],[[5413,4111],[0,-1],[-1,0]],[[5412,4110],[0,-1],[0,-1],[-1,0],[0,-1],[-1,-1],[0,-1],[-1,0],[0,-1],[-1,0],[0,-1]],[[5408,4103],[-1,0]],[[5407,4103],[-2,1],[-3,-3],[1,-3]],[[5403,4098],[0,0]],[[5403,4098],[0,0]],[[5403,4098],[0,0]],[[5403,4098],[0,0]],[[5403,4098],[-1,0],[0,-1]],[[5402,4097],[0,0]],[[5402,4097],[5,-17]],[[5407,4080],[0,0]],[[5407,4080],[0,-1]],[[5407,4079],[0,0]],[[5407,4079],[0,0]],[[5407,4079],[0,0]],[[5407,4079],[0,0]],[[5407,4079],[1,-3],[-21,-5],[-67,-18]],[[7327,5686],[0,-1]],[[7325,5684],[0,-1]],[[7325,5683],[0,0]],[[7324,5681],[0,0]],[[7322,5673],[0,-1],[0,-1]],[[7320,5667],[-1,-2]],[[7319,5665],[0,-1],[-1,-1]],[[7318,5663],[-1,-1]],[[7317,5662],[-1,-1],[0,-1]],[[7316,5660],[-2,-2]],[[7314,5658],[-3,-3],[-7,-7]],[[7304,5648],[-4,-3],[-7,-7]],[[7293,5638],[-8,-7],[-18,-14]],[[7267,5617],[-5,-4],[-9,-6]],[[7253,5607],[-4,-4],[-10,-6]],[[7239,5597],[-4,-2],[-4,-3]],[[7231,5592],[-9,-4]],[[7222,5588],[-4,-1],[-5,-2]],[[7213,5585],[-9,-3]],[[7204,5582],[-5,-1],[-9,-2]],[[7190,5579],[-5,0],[-10,-1]],[[7175,5578],[-4,-1],[-9,0]],[[7162,5577],[-4,0],[-9,1]],[[7131,5569],[-1,0],[-3,-2]],[[7127,5567],[-2,-1],[-2,-1]],[[7064,5530],[-4,-2],[-3,-3]],[[7053,5523],[-6,-5]],[[7047,5518],[-4,-3],[-3,-3]],[[7037,5509],[-5,-7]],[[7032,5502],[-3,-3],[-5,-8]],[[7024,5491],[-1,-2],[-3,-5]],[[7020,5484],[-2,-4],[-2,-4]],[[7014,5472],[-3,-8]],[[6974,5348],[-1,0]],[[6973,5345],[0,0]],[[6973,5345],[0,-1]],[[6974,5342],[1,0]],[[6958,5008],[-1,0]],[[6957,5008],[-5,-1],[-5,-1]],[[6947,5006],[-10,-2]],[[6937,5004],[-5,-2],[-5,-2]],[[6927,5000],[-10,-4]],[[6890,4983],[-5,-2],[-8,-4]],[[6877,4977],[-4,-2],[-8,-5]],[[6817,4940],[-6,-4],[-13,-8]],[[6798,4928],[-1,0],[-2,-1]],[[6795,4927],[-6,-3],[-12,-6]],[[6708,4885],[-3,-1],[-3,-1]],[[6702,4883],[-5,-2]],[[6697,4881],[-1,0],[-3,-1]],[[6693,4880],[-3,0],[-3,0]],[[6682,4879],[-5,0]],[[6650,4880],[-1,0],[-2,0]],[[6647,4880],[-1,0],[-1,0]],[[6645,4880],[-2,0],[-3,0]],[[6640,4880],[-1,0],[-3,-1]],[[6636,4879],[-2,0],[-4,-1]],[[6630,4878],[-3,-1],[-5,-1]],[[6622,4876],[-3,-1],[-3,-2]],[[6616,4873],[-6,-3]],[[6564,4844],[-3,-1],[-2,-1]],[[6559,4842],[-5,-2]],[[6554,4840],[-2,-1],[-5,-2]],[[6547,4837],[-1,0],[-2,0]],[[6544,4837],[-1,0],[-1,0]],[[6541,4837],[-2,0]],[[6500,4829],[-4,0],[-8,1]],[[6488,4830],[-2,0]],[[6486,4830],[-5,-1],[-9,-1]],[[6334,4798],[2,-2],[2,-5]],[[6252,4611],[-1,1],[-3,0]],[[6248,4612],[-1,1],[-1,0]],[[6245,4613],[-3,0]],[[6242,4613],[-1,0],[-3,0]],[[6229,4604],[-1,0],[-2,-1]],[[6226,4603],[-2,0],[-2,0]],[[6221,4603],[-4,0]],[[6217,4603],[-1,0],[-2,0]],[[6208,4605],[-2,1]],[[6206,4606],[-2,0],[-1,1]],[[6198,4610],[-3,1]],[[6195,4611],[0,1],[-1,0]],[[6194,4612],[-1,2],[-3,2]],[[6094,4542],[0,0]],[[6094,4539],[0,-1]],[[6094,4538],[0,0]],[[6092,4535],[0,0]],[[6045,4503],[0,-1]],[[6042,4502],[-1,0]],[[6041,4502],[0,0]],[[6038,4504],[0,1]],[[5791,4587],[-1,0]],[[5788,4585],[-1,-1]],[[5787,4584],[0,-1],[-1,0]],[[5785,4581],[-1,-1]],[[5784,4580],[0,-1],[0,-1]],[[5783,4576],[0,-2]],[[5783,4574],[0,-1]],[[5784,4570],[0,-1]],[[5752,4680],[-1,5],[-3,11]],[[5748,4696],[-1,5],[-3,10]],[[5717,4802],[-1,4],[-2,7]],[[5714,4813],[0,3],[-1,5]],[[5713,4821],[0,1],[-1,2]],[[5712,4824],[0,1]],[[5712,4825],[0,1],[0,1],[0,1],[1,1]],[[5713,4829],[0,1]],[[5713,4830],[0,1]],[[5713,4831],[1,1],[0,1],[1,0],[0,1]],[[5715,4834],[1,1]],[[5710,4842],[0,1]],[[5710,4843],[0,0]],[[5710,4843],[-1,0]],[[5709,4843],[0,1]],[[5709,4844],[0,0]],[[5709,4844],[0,0]],[[5677,4946],[0,0]],[[5677,4946],[0,1],[0,1]],[[5677,4948],[0,1]],[[5677,4949],[0,0]],[[5672,4969],[0,-1]],[[5672,4968],[0,-1],[1,0],[0,-1],[1,0],[0,-1],[1,0]],[[5675,4965],[0,0]],[[5675,4965],[0,0]],[[5675,4965],[1,0],[0,-1],[1,0],[1,0],[1,0],[0,1],[1,0]],[[5680,4965],[0,0]],[[5765,5009],[1,1],[3,1]],[[5769,5011],[3,2],[4,2]],[[5782,5019],[1,1],[1,0]],[[5784,5020],[2,3],[3,2]],[[5802,5036],[0,1],[1,0]],[[5803,5037],[1,1],[0,1],[1,0],[0,1],[1,0],[0,1],[0,1],[1,1],[1,1],[0,1],[1,1]],[[5809,5046],[0,2]],[[5809,5048],[0,1]],[[5809,5049],[1,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[0,1],[-1,0],[0,1],[0,1]],[[5809,5060],[0,2]],[[5885,5145],[0,0]],[[5885,5145],[0,1]],[[5885,5146],[0,0]],[[5885,5146],[0,1]],[[5885,5147],[1,0],[0,1]],[[5886,5148],[0,0]],[[5886,5148],[0,0]],[[5826,5315],[-1,2],[-3,4]],[[5822,5321],[-2,2],[-3,4]],[[5928,5506],[0,0]],[[5928,5506],[0,-1]],[[5928,5505],[1,0]],[[5929,5505],[0,0]],[[5929,5505],[1,0]],[[5930,5505],[0,-1]],[[5930,5504],[1,0]],[[5931,5504],[0,0]],[[5931,5504],[0,0]],[[5931,5504],[1,0]],[[5932,5504],[0,1]],[[5932,5505],[1,0]],[[5933,5505],[0,0]],[[5933,5505],[1,0]],[[5958,5530],[0,0]],[[5958,5530],[0,-1],[1,0],[1,0]],[[5960,5529],[0,0]],[[5960,5529],[0,0]],[[5960,5529],[1,0],[0,1],[1,0]],[[5962,5530],[0,0]],[[5966,5534],[0,0]],[[5966,5534],[0,1]],[[5966,5535],[0,0]],[[5966,5535],[0,0]],[[5966,5535],[0,0]],[[5966,5535],[0,0]],[[5966,5535],[1,0]],[[5967,5535],[0,1]],[[5967,5536],[0,0]],[[5967,5536],[0,0]],[[5967,5536],[0,1],[-1,1]],[[5966,5538],[0,1]],[[5966,5539],[0,0]],[[5966,5539],[0,2]],[[5966,5541],[0,1]],[[5966,5542],[-1,1]],[[5965,5543],[0,1]],[[5965,5544],[-1,1]],[[5964,5545],[0,0]],[[5964,5545],[0,1]],[[5964,5546],[0,0]],[[5964,5546],[0,0]],[[5964,5546],[0,0]],[[5964,5546],[0,1]],[[5964,5547],[0,0]],[[5964,5547],[0,1]],[[5964,5548],[1,0]],[[5965,5548],[-1,0]],[[5964,5547],[0,0]],[[5964,5547],[0,-1]],[[5964,5545],[0,0]],[[5964,5545],[1,0],[0,-1]],[[5966,5542],[0,-1]],[[5966,5541],[0,-1],[0,-1]],[[5966,5538],[1,-2]],[[5967,5536],[0,0]],[[5966,5535],[0,0]],[[5966,5535],[0,0]],[[5966,5534],[0,0]],[[5962,5530],[0,0]],[[5960,5529],[0,0]],[[5960,5529],[0,0]],[[5958,5530],[0,0]],[[5934,5505],[-1,0]],[[5931,5504],[0,0]],[[5931,5504],[-1,0]],[[5928,5506],[0,0]],[[5817,5327],[2,-2],[3,-4]],[[5822,5321],[1,-2],[3,-4]],[[5886,5148],[0,0]],[[5885,5145],[0,0]],[[5809,5062],[0,-1],[0,-1]],[[5809,5049],[0,-1]],[[5809,5048],[0,-1],[0,-1]],[[5803,5037],[-1,-1]],[[5795,5030],[-3,-2],[-3,-3]],[[5784,5020],[-1,0],[-1,-1]],[[5782,5019],[-3,-2],[-3,-2]],[[5769,5011],[-1,-1],[-3,-1]],[[5680,4965],[0,0]],[[5675,4965],[0,0]],[[5675,4965],[0,0]],[[5672,4968],[0,1]],[[5589,4977],[0,-1]],[[5589,4976],[-1,0]],[[5588,4976],[0,-1]],[[5588,4975],[-1,0]],[[5558,4968],[-1,0]],[[5557,4968],[0,1],[-1,0]],[[5556,4969],[0,1]],[[5556,4970],[-1,0]],[[5555,4970],[-1,1]],[[5554,4971],[0,1],[-1,0]],[[5553,4972],[0,1]],[[5553,4973],[-1,1]],[[5454,5410],[0,0]],[[5456,5410],[0,-1]],[[5456,5409],[1,0]],[[5457,5408],[1,0]],[[5463,5518],[1,0]],[[5465,5519],[1,0]],[[5476,5526],[0,0]],[[5477,5527],[0,1]],[[5477,5528],[0,0]],[[5477,5529],[0,0]],[[5450,5658],[0,1],[0,1]],[[5450,5660],[0,2]],[[5450,5662],[0,1]],[[5450,5664],[0,1]],[[5450,5665],[0,1]],[[5452,5670],[0,1]],[[5397,5715],[0,0]],[[5397,5717],[0,0]],[[5397,5717],[0,1]],[[5399,5719],[0,0]],[[5433,5892],[0,1]],[[5431,5896],[0,1]],[[5424,5930],[0,-1]],[[5426,5928],[0,-1]],[[5426,5927],[0,0]],[[5429,5928],[1,0]],[[5477,6169],[0,0]],[[5479,6169],[0,0]],[[5479,6169],[0,0]],[[5480,6168],[0,-1]],[[5478,6181],[0,1]],[[5479,6183],[0,0]],[[5479,6183],[0,0]],[[5479,6185],[0,0]],[[5453,6452],[0,4],[2,8]],[[5455,6464],[0,1],[1,4]],[[5501,6643],[1,3],[1,5]],[[5503,6651],[1,3],[2,5]],[[5519,6697],[3,7],[6,14]],[[5528,6718],[3,7],[7,13]],[[5538,6738],[4,7],[7,13]],[[5549,6758],[3,7],[7,13]],[[5611,6869],[3,5],[6,10]],[[5620,6884],[4,4],[7,10]],[[5632,6896],[5,6],[9,10]],[[5646,6912],[5,5],[9,11]],[[5660,6928],[5,5],[10,10]],[[5675,6943],[5,5],[10,9]],[[5690,6957],[3,3],[5,4]],[[5698,6964],[2,2],[4,2]],[[5704,6968],[1,1],[2,1]],[[5732,6999],[5,4],[9,9]],[[5746,7012],[4,3],[7,6]],[[5757,7021],[1,2],[2,2]],[[5760,7025],[3,2],[5,6]],[[5768,7033],[3,2],[5,5]],[[5786,7050],[2,2],[3,4]],[[5791,7056],[2,2],[4,4]],[[5797,7062],[7,6],[13,12]],[[5817,7080],[7,6],[14,11]],[[5860,7109],[0,1]],[[5861,7111],[0,1]],[[5861,7112],[0,0]],[[5863,7114],[0,0]],[[5877,7125],[4,2],[5,5]],[[5886,7132],[2,2],[3,2]],[[6883,8648],[1,-1],[2,-1]],[[6887,8650],[2,-1],[4,-2]],[[6893,8647],[2,-1],[2,-1]],[[6903,8644],[2,-1],[6,-1]],[[6970,8633],[5,-1],[11,-3]],[[6986,8629],[4,-1],[7,-3]],[[7092,8226],[0,-1],[-1,0],[0,-1],[0,-1],[0,-1]],[[7094,8199],[0,-4],[0,-4]],[[7092,8159],[0,-1],[0,-1],[0,-2],[0,-1],[-1,-1],[0,-2]],[[7022,8026],[-1,-1],[0,-1],[0,-1]],[[7021,8023],[0,-1],[-1,-1]],[[7020,8021],[0,-1],[0,-1]],[[7020,8019],[0,-1],[1,-2]],[[7041,7973],[-3,-3],[-18,-22],[-1,-4]],[[7019,7944],[-1,-1],[-1,-4]],[[7017,7939],[0,-2],[-1,-4]],[[7016,7933],[-1,-3],[-2,-7]],[[7013,7923],[-1,-4],[-2,-7]],[[7010,7912],[0,0]],[[7010,7912],[0,-1]],[[7010,7911],[0,0]],[[7010,7911],[0,0]],[[7010,7911],[0,-1],[-1,0]],[[7009,7910],[0,0]],[[7009,7910],[0,0]],[[7009,7910],[-1,0],[0,-1]],[[7008,7909],[0,0]],[[7008,7909],[-1,0]],[[7007,7909],[0,1],[-1,0]],[[7006,7910],[0,0]],[[7006,7910],[-12,-20]],[[6994,7890],[0,-1]],[[6994,7889],[-1,0],[0,-1]],[[6993,7888],[0,0]],[[6993,7888],[-1,-1]],[[6992,7887],[-1,0],[0,-1]],[[6991,7886],[-1,0]],[[6990,7886],[0,0]],[[6990,7886],[-1,-1]],[[6989,7885],[-1,0]],[[6988,7885],[0,0]],[[6988,7885],[-1,0]],[[6987,7885],[-1,0]],[[6986,7885],[-3,-1],[-27,-5],[-32,-6],[-8,-2],[-3,-1]],[[6913,7870],[-6,-1],[-6,-2]],[[6901,7867],[-10,-5]],[[6891,7862],[-6,-3],[-5,-3]],[[6880,7856],[-10,-6]],[[6870,7850],[-3,-2],[-5,-4]],[[6862,7844],[-3,-2],[-5,-5]],[[6854,7837],[-16,-16]],[[6838,7821],[-4,-3],[-8,-8]],[[6826,7810],[-4,-4],[-7,-8]],[[6815,7798],[-8,-9],[-14,-17]],[[6793,7772],[-11,17],[-9,-10],[-15,-20],[-4,-6],[-2,2],[-18,-23],[-16,-21],[-15,-22],[2,-2],[-6,-9],[0,-1],[-5,-7],[-16,-21],[-10,-12],[-10,-11],[-3,-4],[-3,-3],[-7,-2],[-1,-1],[-2,2],[-4,-3],[4,-6],[-2,-3],[-5,-5],[-7,-6],[-2,-3],[-10,-9],[-6,-7],[-6,-6],[-4,-3],[-6,-6],[-4,-3],[-4,-4],[-1,2],[-2,-3],[1,-1],[-18,-16],[-1,-1],[-2,-1],[-4,-1],[-6,-5],[-3,-6],[-9,-7],[-9,-7],[-9,-7],[-8,-8],[-3,-3],[-1,-1],[-10,-7]],[[6501,7482],[-4,-3],[-8,-6]],[[6489,7473],[-4,-3],[-9,-5]],[[6476,7465],[-6,-4],[-12,-6]],[[6458,7455],[-1,-1],[-3,-1],[-9,-4],[-3,-1],[-10,-4],[-3,-1],[-9,-3],[-3,-1],[-2,-1],[-16,-5]],[[6399,7433],[-7,-2],[-13,-4]],[[6379,7427],[-3,-1],[-7,-1]],[[6369,7425],[-3,-1],[-7,-1]],[[6359,7423],[-5,0],[-10,-1]],[[6344,7422],[-5,0],[-10,1]],[[6329,7423],[-4,0],[-7,1]],[[6318,7424],[-4,1],[-8,1]],[[6306,7426],[-20,3],[-5,1],[-17,3],[-13,2],[-3,0],[-9,2],[-12,2]],[[6234,7489],[0,0]],[[6236,7491],[0,0]],[[6236,7491],[0,0]],[[6238,7492],[1,0]],[[6241,7499],[-1,0]],[[6238,7500],[0,1]],[[6238,7501],[0,0]],[[6237,7503],[0,1]],[[6255,8233],[8,1],[17,1]],[[6279,8250],[2,1]],[[6281,8251],[7,0],[14,2]],[[6302,8253],[8,2],[16,3]],[[6326,8258],[8,2],[15,4]],[[6349,8264],[6,2],[10,4]],[[6365,8270],[4,1],[6,2]],[[6385,8277],[19,9]],[[6415,8292],[22,13]],[[6437,8305],[7,5],[16,10]],[[6460,8320],[1,1],[3,2]],[[6464,8323],[10,6],[18,12]],[[4648,9816],[0,1],[0,1],[1,0],[0,1],[1,0],[0,1],[1,1],[1,0],[0,1],[1,0]],[[4653,9822],[1,1],[1,0],[1,0],[0,1],[1,0],[1,0],[1,0],[1,0],[1,-1]],[[4787,9791],[1,-1],[1,0],[1,0],[1,0],[1,0],[1,0],[2,1]],[[4795,9791],[1,0],[1,0],[1,0],[0,1],[1,0],[1,0],[0,1],[1,0],[1,1]],[[5162,9702],[1,0],[1,-1]],[[5166,9701],[1,0],[1,-1]],[[5637,9725],[8,-3],[15,-5]],[[5660,9717],[8,-2],[15,-3]],[[6034,8872],[-4,-6],[-8,-13]],[[6022,8853],[-3,-6],[-8,-12]],[[6492,8341],[-9,-6],[-19,-12]],[[6464,8323],[-1,-1],[-3,-2]],[[6460,8320],[-8,-5],[-15,-10]],[[6426,8298],[-22,-12]],[[6394,8282],[-19,-9]],[[6375,8273],[-3,-1],[-7,-2]],[[6365,8270],[-5,-2],[-11,-4]],[[6349,8264],[-7,-2],[-16,-4]],[[6326,8258],[-8,-2],[-16,-3]],[[6302,8253],[-7,-1],[-14,-1]],[[6281,8251],[-1,-1],[-1,0]],[[6280,8235],[-8,-1],[-17,-1]],[[5290,8461],[0,1]],[[5290,8462],[0,1]],[[5289,8464],[0,0]],[[5289,8464],[-1,0]],[[5288,8464],[-1,0],[-2,0]],[[5281,8465],[-1,0],[-2,1]],[[5275,8466],[-3,0]],[[5103,8447],[-1,0],[-1,0]],[[5101,8447],[-3,-1]],[[5093,8444],[-1,0]],[[5092,8444],[-1,0]],[[5089,8444],[0,-1],[-1,0]],[[2688,2320],[-1,1],[-1,1],[-1,1],[-1,0],[-1,1],[-1,0],[-1,1],[-2,0]],[[2679,2325],[-1,1],[-1,0],[-1,0],[-1,1],[-1,0],[-1,0],[-1,0],[-1,0],[-2,0]],[[2669,2327],[-1,-1],[-1,0],[-1,0],[-1,0],[-1,1],[-1,0],[-1,0],[-2,1]],[[2660,2328],[-1,0],[-1,1],[-1,0],[0,1],[-1,0],[-1,1],[-1,1],[-1,1]],[[2653,2333],[0,1],[-1,1],[-1,1]],[[2651,2336],[-1,1],[0,1]],[[2650,2338],[-1,1],[0,2]],[[2649,2341],[-1,1],[0,1],[0,1]],[[2648,2344],[-1,1],[0,1],[0,1]],[[2647,2347],[0,1],[-1,2]],[[2645,2360],[0,2],[0,1],[0,2],[-1,3]],[[2644,2368],[0,1],[-1,2]],[[2643,2371],[0,1],[-1,2],[0,1],[-1,1],[-1,2],[-1,2]],[[2639,2380],[-1,3],[-2,2]],[[2633,2389],[-2,2],[-1,2]],[[2577,2425],[-2,1],[-1,0],[-1,1],[-1,0],[-2,1],[-2,0]],[[2568,2428],[-1,0],[-1,1]],[[2581,3931],[0,-1],[1,0]],[[2584,3927],[0,0]],[[2584,3927],[0,0]],[[2588,3925],[0,0]],[[2588,3925],[1,0]],[[2592,3927],[0,0]],[[2592,3927],[1,0]],[[2593,3928],[0,1]],[[2593,3929],[1,0]],[[2594,3930],[0,1]],[[2594,3932],[1,5],[2,10]],[[2597,3947],[0,2],[1,3]],[[2598,3952],[1,6],[3,13]],[[2623,4038],[3,9],[6,16]],[[2640,4084],[2,3],[1,3]],[[2646,4096],[2,3],[2,3]],[[2651,4105],[5,5]],[[2656,4110],[2,3],[2,2]],[[2663,4118],[5,4]],[[2668,4122],[2,2],[5,3]],[[2729,4175],[2,1],[3,2]],[[2736,4179],[5,3]],[[2741,4182],[1,0],[2,1]],[[3013,4239],[3,0],[5,2]],[[3021,4241],[2,0],[5,1]],[[3191,4273],[0,0]],[[3193,4272],[0,0]],[[3193,4272],[0,0]],[[3194,4271],[0,-1]],[[3194,4270],[3,1],[5,0]],[[3202,4271],[3,1],[5,1]],[[3258,4281],[0,0]],[[3258,4281],[1,0],[0,-1]],[[3259,4280],[0,0]],[[3259,4280],[0,0]],[[3259,4280],[0,-1],[1,-1]],[[3260,4278],[0,0]],[[3260,4278],[0,-4],[2,-7]],[[3262,4267],[0,-4],[2,-7]],[[3264,4256],[1,1]],[[3265,4257],[1,-4],[1,-6]],[[3267,4247],[1,-3],[2,-7]],[[3270,4237],[2,-9],[3,-14]],[[3275,4214],[1,-3],[2,-8]],[[3278,4203],[2,-7],[4,-13]],[[3284,4183],[2,-6],[5,-13]],[[3291,4164],[2,-7],[5,-13]],[[3298,4144],[2,-6],[5,-13]],[[3305,4125],[8,-18],[10,-21]],[[3323,4086],[2,-4],[4,-8]],[[3329,4074],[0,-1],[2,-3]],[[3331,4070],[3,-7],[6,-13]],[[3340,4050],[1,-2],[2,-3]],[[3343,4045],[3,-6],[6,-13]],[[3352,4026],[5,-8],[8,-15]],[[3365,4003],[3,-6],[8,-12]],[[3376,3985],[16,-27],[13,-23],[9,-15],[-3,-8],[-17,-18],[14,-7],[-4,-4]],[[3404,3883],[1,0],[1,0]],[[3406,3883],[1,0]],[[3407,3883],[6,-1]],[[3413,3882],[1,0],[1,0]],[[3415,3882],[1,0]],[[3416,3882],[76,-18],[23,-6],[72,-17],[3,-3],[-42,-20],[-33,-16],[-34,-21],[-8,-5],[-21,-16],[-23,-17],[-13,-14],[-6,-6],[-4,-5],[-29,-34],[-24,-26],[-11,-12],[1,-2],[12,-21],[16,-29],[15,-26],[11,-19],[31,-54],[28,-50],[28,-49],[24,13],[3,2],[15,14],[12,10],[12,11],[13,11],[12,8],[13,8],[12,9],[13,9],[-1,3],[12,7],[14,-27],[7,1],[-11,-9],[3,-6],[1,-1],[10,-19],[10,-17],[4,-7],[10,-19],[5,-10],[9,-16],[18,-34],[25,-48],[1,0],[27,16],[7,-16],[-4,-6],[-4,-6],[-4,-6],[-3,-6],[-3,-7],[-2,-6],[-9,-28]],[[3735,3224],[0,-2],[-1,-1]],[[3734,3221],[0,-2]],[[3734,3219],[-1,-4]],[[3733,3215],[0,-3],[-1,-3]],[[3732,3209],[0,-3]],[[3732,3206],[-2,-6]],[[3730,3200],[-8,-27]],[[3722,3173],[-2,-4],[-4,-10]],[[3716,3159],[-1,-2]],[[3715,3157],[-2,-4],[-2,-8]],[[3711,3145],[-2,-3],[8,-25],[8,-30],[7,-46],[8,-76],[3,-23],[-2,-25],[-2,-25],[-1,-10],[21,13],[34,45],[33,45],[34,45],[35,46],[1,18],[2,27],[7,2],[5,5],[5,6],[-3,-6],[0,-6],[2,-19],[-1,-7],[1,0],[22,-21],[12,-12],[19,-37],[21,-35],[18,-41],[34,-162],[11,-40],[8,-22]],[[5788,4554],[1,-2],[1,-2]],[[5790,4550],[0,-3],[0,-2]],[[5791,4541],[0,-2],[0,-3]],[[5175,3974],[0,0]],[[5174,3976],[0,0]],[[5174,3976],[0,0]],[[5175,3978],[1,0]],[[5240,4004],[0,-1]],[[5251,4000],[1,0]],[[5252,4000],[1,0]],[[5261,4009],[1,1]],[[5308,4035],[0,1]],[[5308,4038],[0,0]],[[5308,4038],[0,1]],[[5308,4041],[1,1]],[[5309,4042],[0,1]],[[5310,4046],[1,1]],[[5311,4047],[1,1]],[[5315,4051],[1,1]],[[5407,4079],[0,0]],[[5407,4079],[0,0]],[[5407,4079],[0,0]],[[5407,4080],[0,0]],[[5402,4097],[0,0]],[[5403,4098],[0,0]],[[5403,4098],[0,0]],[[5403,4098],[0,0]],[[5407,4103],[1,0]],[[5412,4110],[1,1]],[[5459,4129],[0,0]],[[5462,4132],[0,0]],[[5618,4301],[-1,0]],[[5617,4301],[0,0]],[[5617,4301],[0,0]],[[5617,4302],[0,0]],[[5573,4393],[0,1]],[[5571,4395],[0,0]],[[5571,4395],[0,0]],[[5569,4392],[0,0]],[[5318,4915],[0,6],[-1,10]],[[5317,4931],[0,3],[-1,6]],[[5303,4997],[0,4],[0,9]],[[5303,5010],[-1,4],[0,9]],[[5302,5023],[-1,4],[-2,9]],[[5299,5036],[0,4],[-3,8]],[[5296,5048],[-1,4],[-2,6]],[[5293,5058],[-1,4],[-2,6]],[[5268,5151],[0,0]],[[5268,5152],[0,0]],[[5268,5152],[0,0]],[[5267,5153],[0,0]],[[5268,5153],[-1,2],[-1,3]],[[5266,5158],[0,2],[-1,3]],[[5265,5163],[-1,2],[-1,3]],[[5263,5168],[0,2],[-2,4]],[[5418,5128],[0,0]],[[5420,5128],[0,1]],[[5552,4974],[1,0],[0,-1]],[[5554,4971],[1,-1]],[[5555,4970],[1,0]],[[5557,4968],[1,0]],[[5587,4975],[1,0]],[[5588,4975],[0,1]],[[5588,4976],[1,0]],[[5589,4976],[0,1]],[[5677,4949],[0,0]],[[5677,4946],[0,0]],[[5709,4844],[0,0]],[[5709,4844],[0,-1]],[[5709,4843],[1,0]],[[5710,4843],[0,-1]],[[5716,4835],[-1,-1]],[[5713,4831],[0,-1]],[[5713,4830],[0,-1]],[[5712,4825],[0,-1]],[[5712,4824],[1,-1],[0,-2]],[[5713,4821],[0,-2],[1,-6]],[[5714,4813],[1,-3],[2,-8]],[[5744,4711],[1,-5],[3,-10]],[[5748,4696],[2,-6],[2,-10]],[[3217,5745],[0,0]],[[3214,5745],[0,0]],[[3214,5745],[-1,0]],[[3211,5744],[0,-1]],[[3118,5632],[-1,0]],[[3116,5625],[0,0]],[[3116,5625],[0,-1]],[[3119,5618],[1,0]],[[3254,5509],[0,0]],[[3256,5507],[1,-1]],[[3257,5506],[0,0]],[[3258,5503],[0,-1]],[[3258,5502],[0,0]],[[3258,5499],[0,-1]],[[3258,5498],[0,0]],[[3256,5495],[0,0]],[[3149,5365],[-1,-1]],[[3144,5361],[-1,-1]],[[3143,5360],[-1,0],[-1,0]],[[3136,5359],[-1,0]],[[3110,5310],[-2,-1],[-2,-3]],[[3106,5306],[-2,-1],[-2,-3]],[[3051,5243],[-4,-4],[-7,-8]],[[3040,5231],[-4,-4],[-7,-8]],[[3024,5230],[0,0]],[[3025,5233],[0,1]],[[3025,5234],[0,0]],[[3023,5237],[0,0]],[[2435,5348],[-5,3],[-11,6]],[[2419,5357],[-3,2],[-7,4]],[[2409,5363],[-9,5],[-19,10]],[[2381,5378],[-7,3],[-14,7]],[[2360,5388],[-2,1],[-3,1]],[[2354,5391],[-10,4],[-18,8]],[[211,5277],[1,-1],[1,-1],[1,0],[1,-1],[1,-1],[1,0],[1,-1],[2,-1]],[[220,5271],[1,0],[1,0],[1,0],[1,-1],[1,0],[1,0],[1,0],[1,0],[1,0],[2,0]],[[231,5270],[3,0],[3,0],[3,0],[6,-1]],[[246,5269],[3,0],[4,-1],[3,-1],[7,-2]],[[263,5265],[6,-2],[12,-5]],[[281,5258],[5,-2],[11,-5]],[[297,5251],[2,-1],[1,-1],[2,0],[2,-1],[2,-1],[1,0],[4,-1]],[[311,5246],[2,0],[1,0],[2,0]],[[316,5246],[2,0],[2,0],[1,0]],[[321,5246],[2,1],[3,0]],[[326,5247],[3,1],[5,2]],[[334,5250],[2,0],[6,1]],[[342,5251],[1,0],[1,1],[1,0],[1,0],[2,0]],[[348,5252],[0,1],[1,0],[1,0],[0,1],[1,0],[1,1]],[[364,5262],[3,2],[3,1],[3,1],[6,3]],[[379,5269],[3,1],[3,1],[3,0],[7,1]],[[395,5272],[11,2],[21,4]],[[427,5278],[10,3],[19,5]],[[456,5286],[2,0],[3,1],[2,1],[4,2]],[[467,5290],[1,1],[2,1],[2,1],[4,3]],[[476,5296],[2,2],[4,3]],[[482,5301],[3,1],[4,3]],[[492,5436],[1,-1],[2,-2],[2,-2],[2,-1],[2,-2]],[[501,5428],[3,-1],[2,-1],[2,-1],[5,-3]],[[513,5422],[2,-1],[2,0],[3,-1],[2,-1],[3,-1]],[[525,5418],[2,0],[3,0],[2,-1],[5,0]],[[561,5416],[2,-1],[2,0],[1,0],[4,1]],[[570,5416],[1,0],[2,0],[1,0],[4,1]],[[578,5417],[1,1],[1,0],[1,1],[1,0],[0,1],[1,0],[1,1],[1,1],[1,1],[1,1]],[[587,5424],[0,1],[1,1],[1,1],[0,1],[1,1],[0,1],[0,1],[1,0],[0,1],[0,1],[0,1],[0,1],[0,2]],[[591,5437],[0,1],[0,1],[0,1]],[[591,5440],[0,1],[0,1],[0,1]],[[591,5443],[-1,1],[0,2]],[[590,5446],[-1,1],[0,1],[-1,1]],[[588,5449],[0,1],[0,1],[-1,1]],[[587,5452],[-1,1],[-1,1]],[[585,5454],[-3,5],[-3,4],[-7,7]],[[572,5470],[-4,4],[-3,3],[-4,3],[-7,6]],[[554,5486],[-3,2],[-4,2]],[[542,5494],[-1,1],[-1,1],[-1,1],[-1,1],[-1,2],[-1,1],[-1,1],[-1,1],[0,1],[-2,3]],[[532,5507],[1,0],[1,0],[1,1],[1,0],[1,0],[0,1],[1,0],[1,1],[1,0],[0,1],[1,1],[1,1],[1,1]],[[543,5514],[0,1],[0,1],[1,0],[0,1],[0,1],[0,1],[1,1],[0,1],[0,1],[0,1],[0,1],[0,1],[-1,0],[0,1]],[[1328,6477],[-1,2],[-1,1]],[[1326,6480],[-1,2],[-1,2]],[[1323,6487],[-1,2],[0,1]],[[1322,6490],[-1,2],[0,2]],[[1320,6497],[0,2],[0,1],[-1,2],[0,1],[0,2],[0,2],[1,1],[0,2],[0,1],[0,1],[1,2],[0,1],[0,2],[1,1],[0,2],[1,1],[0,1],[2,3]],[[1325,6525],[0,1]],[[1325,6526],[1,0]],[[1326,6526],[0,2],[1,1],[1,1],[2,3]],[[1330,6533],[1,1],[1,1],[1,1],[2,2]],[[1335,6538],[2,1],[2,1]],[[1342,6542],[1,1],[2,1]],[[1349,6546],[1,0],[2,1],[2,0],[4,1]],[[1358,6548],[2,0],[2,1],[2,0],[4,0]],[[1368,6549],[2,0],[4,-1]],[[1374,6548],[2,0],[5,0]],[[1381,6548],[2,-1],[5,-1]],[[1388,6546],[2,0],[5,-1]],[[1395,6545],[2,0],[2,-1]],[[1399,6544],[1,0],[2,-1]],[[1402,6543],[2,-1],[2,-1]],[[1406,6541],[1,-1],[2,-1]],[[1110,7232],[8,-1],[17,-2]],[[1135,7229],[4,0],[8,-1]],[[1159,7228],[25,-1]],[[1197,7228],[25,1]],[[1234,7231],[24,4]],[[1258,7235],[7,1],[14,3]],[[1492,7292],[7,1],[14,3]],[[1513,7296],[12,3],[25,4]],[[1550,7303],[12,2],[25,3]],[[1587,7308],[9,1],[19,1]],[[1630,7310],[31,1]],[[1661,7311],[13,-1],[25,-1]],[[1699,7309],[13,-1],[26,-3]],[[1792,7293],[25,-8]],[[1867,7261],[23,-14]],[[1934,7213],[20,-20]],[[1990,7150],[15,-23]],[[2100,6972],[13,-17]],[[2127,6939],[16,-15]],[[2159,6911],[17,-13]],[[2194,6887],[19,-9]],[[2233,6870],[20,-6]],[[2273,6859],[20,-3]],[[2314,6854],[21,0]],[[2356,6856],[20,3]],[[2545,6893],[25,3]],[[2583,6897],[25,1]],[[2621,6897],[25,-2]],[[2659,6893],[24,-5]],[[2788,6864],[21,-7]],[[2819,6854],[21,-8]],[[2850,6841],[19,-10]],[[2879,6826],[18,-12]],[[2906,6808],[18,-14]],[[2933,6787],[16,-15]],[[2957,6764],[15,-16]],[[2979,6739],[14,-17]],[[3045,6651],[16,-19]],[[3069,6623],[18,-17]],[[3096,6598],[19,-15]],[[3125,6577],[20,-13]],[[3156,6558],[21,-10]],[[3188,6543],[23,-7]],[[3211,6536],[8,-3],[16,-4]],[[3109,6425],[-3,0],[-5,-1]],[[3101,6424],[-2,0],[-5,0]],[[3094,6424],[-5,-1],[-10,-2]],[[3065,6417],[-1,0],[-2,0]],[[3060,6416],[-2,-1]],[[3058,6415],[-2,-1],[-1,0]],[[3053,6412],[-2,-1]],[[3051,6411],[-1,-1]],[[3045,6403],[0,-1]],[[3045,6402],[-1,-1]],[[3044,6393],[1,-1]],[[3045,6392],[0,-2],[0,-1]],[[3047,6385],[1,-2]],[[3048,6383],[0,-1],[1,-1]],[[3052,6378],[1,-2]],[[3085,6340],[3,-3],[6,-7]],[[3041,6278],[-2,-1],[-4,0]],[[3035,6277],[-3,-1],[-6,0]],[[3026,6276],[-3,-1],[-6,0]],[[6819,6247],[1,5],[-6,6],[5,11],[2,3],[4,5],[3,5],[16,19],[16,19],[15,20],[15,19],[2,3],[8,-3],[8,0],[9,3],[6,4],[4,4],[4,5],[2,8],[2,9],[-1,7],[-1,6],[-6,26],[-6,27],[-4,20],[-5,23],[-3,10],[-2,5],[-4,5],[-4,4],[-21,18],[3,2],[6,8],[2,1],[13,8],[5,5],[4,4],[5,5],[2,2],[3,3],[1,3],[2,3],[2,3],[2,3],[0,2],[1,2],[1,3],[1,2],[2,3],[2,1],[1,1],[1,3],[1,2],[1,1],[3,3],[5,4],[4,2],[2,3],[1,1],[4,2],[1,2],[2,1],[2,0],[3,0],[1,2],[2,2],[3,3],[4,4],[5,4],[4,4],[2,2],[2,4],[3,5],[3,1],[4,2],[0,2],[1,2],[4,1],[3,2],[3,2],[3,3],[3,1],[4,2],[3,1],[4,0],[1,1],[3,0],[2,1],[3,-1],[4,2],[2,2],[2,1],[2,1],[2,2],[3,2],[2,5],[5,1],[3,3],[3,1],[4,1],[3,3],[4,0],[3,3],[3,1],[3,3],[11,1],[6,9],[2,2],[-4,10],[-4,18],[-2,9],[-3,9],[-3,8],[-4,10],[-4,10],[-2,9],[10,-1],[-6,12],[-4,8],[-12,53],[2,3],[-27,37],[-6,22],[-8,21],[-11,20],[-16,25],[-22,30],[-2,3],[1,1],[24,31],[18,-14],[20,-16],[39,-30],[27,-27],[27,-27],[17,-17],[1,8],[4,17],[26,38],[15,34],[12,26],[22,37],[21,35],[11,24],[-3,6]],[[7257,7166],[-3,2],[-4,4]],[[7250,7172],[-2,2],[-4,5]],[[7244,7179],[-17,22],[8,11]],[[7235,7212],[-1,1]],[[7234,7213],[1,1],[0,1],[0,1],[0,1],[1,0]],[[7236,7217],[0,1]],[[7236,7218],[3,5],[5,2],[2,3],[8,18]],[[7254,7246],[0,0]],[[7254,7246],[0,1]],[[7254,7247],[0,0]],[[7254,7247],[-9,5]],[[7245,7252],[0,0]],[[7245,7252],[1,0],[0,1],[1,0],[0,1],[0,1],[1,0]],[[7248,7255],[0,1]],[[7248,7256],[1,9],[7,35]],[[7256,7300],[1,7],[2,13]],[[7259,7320],[0,6],[0,13]],[[7259,7339],[-2,37]],[[7257,7376],[0,3],[-1,7]],[[7256,7386],[0,1],[-1,2]],[[7255,7389],[-4,3],[9,19],[34,12],[5,2]],[[7299,7425],[5,1],[9,4]],[[7313,7430],[16,5],[2,3],[3,1],[3,-3],[39,14],[17,6],[2,1],[14,5],[17,6],[29,10]],[[7455,7478],[2,1],[4,1]],[[7461,7480],[1,0],[4,2]],[[7466,7482],[4,1],[7,3]],[[7477,7486],[8,4]],[[7485,7490],[3,1],[7,3]],[[7495,7494],[37,16],[5,-1]],[[7537,7509],[5,1],[10,2]],[[7552,7512],[5,2],[8,3]],[[7565,7517],[31,11],[7,2],[34,12],[41,14],[0,1],[7,2],[11,3],[33,12]],[[7729,7574],[2,1],[4,2]],[[7735,7577],[2,1],[5,3]],[[7742,7581],[24,-22]],[[7766,7559],[2,1],[5,0]],[[7773,7560],[5,0],[10,0]],[[7788,7560],[14,-1],[1,-10],[10,1],[-3,8]],[[7810,7558],[3,0],[6,-1]],[[7819,7557],[4,0],[6,-2]],[[7829,7555],[12,26],[2,2],[-12,21],[-4,8]],[[7827,7612],[3,1],[6,1]],[[7836,7614],[3,1],[6,2]],[[7845,7617],[32,11],[22,8],[-16,20],[-12,11],[2,6]],[[7845,7617],[-3,-1],[-6,-2]],[[7836,7614],[-3,-1],[-6,-1]],[[7829,7555],[-3,1],[-7,1]],[[7819,7557],[-3,1],[-6,0]],[[7788,7560],[-5,0],[-10,0]],[[7773,7560],[-2,0],[-5,-1]],[[7742,7581],[-2,-2],[-5,-2]],[[7735,7577],[-2,-1],[-4,-2]],[[7565,7517],[-4,-2],[-9,-3]],[[7552,7512],[-5,-1],[-10,-2]],[[7495,7494],[-3,-1],[-7,-3]],[[7477,7486],[-4,-1],[-7,-3]],[[7466,7482],[-2,-1],[-3,-1]],[[7461,7480],[-2,-1],[-4,-1]],[[7313,7430],[-4,-2],[-10,-3]],[[7255,7389],[1,-1],[0,-2]],[[7256,7386],[1,-3],[0,-7]],[[7259,7339],[0,-6],[0,-13]],[[7259,7320],[-1,-7],[-2,-13]],[[7248,7256],[0,-1]],[[7245,7252],[0,0]],[[7254,7247],[0,0]],[[7254,7246],[0,0]],[[7236,7218],[0,-1]],[[7234,7213],[1,-1]],[[7244,7179],[2,-2],[4,-5]],[[7250,7172],[2,-2],[5,-4]],[[6130,7197],[1,1],[3,2]],[[6134,7200],[3,2],[4,3]],[[6099,7306],[2,4],[5,6]],[[6106,7316],[2,2],[2,5]],[[6110,7323],[3,4],[4,9]],[[6142,7398],[1,3],[2,2]],[[6147,7408],[0,1],[1,1]],[[6148,7410],[2,2],[3,5]],[[6178,7434],[1,1],[3,1]],[[6182,7436],[3,1],[5,2]],[[6190,7439],[3,1],[2,0]],[[6205,7441],[2,0],[3,0]],[[6213,7441],[5,-1]],[[6306,7426],[4,-1],[8,-1]],[[6318,7424],[3,0],[8,-1]],[[6329,7423],[5,0],[10,-1]],[[6344,7422],[5,1],[10,0]],[[6359,7423],[3,1],[7,1]],[[6369,7425],[3,1],[7,1]],[[6379,7427],[7,2],[13,4]],[[6458,7455],[6,3],[12,7]],[[6476,7465],[5,2],[8,6]],[[6489,7473],[4,3],[8,6]],[[6793,7772],[7,9],[15,17]],[[6815,7798],[3,4],[8,8]],[[6826,7810],[4,4],[8,7]],[[6854,7837],[3,2],[5,5]],[[6862,7844],[2,2],[6,4]],[[6870,7850],[5,3],[5,3]],[[6880,7856],[11,6]],[[6891,7862],[5,3],[5,2]],[[6901,7867],[12,3]],[[6986,7885],[1,0]],[[6988,7885],[0,0]],[[6988,7885],[1,0]],[[6990,7886],[0,0]],[[6990,7886],[1,0]],[[6992,7887],[1,1]],[[6993,7888],[0,0]],[[6994,7889],[0,1]],[[7006,7910],[0,0]],[[7007,7909],[1,0]],[[7008,7909],[0,0]],[[7009,7910],[0,0]],[[7009,7910],[0,0]],[[7010,7911],[0,0]],[[7010,7911],[0,0]],[[7010,7912],[0,0]],[[7010,7912],[1,4],[2,7]],[[7013,7923],[1,3],[2,7]],[[7016,7933],[0,2],[1,4]],[[7017,7939],[1,2],[1,3]],[[3711,3145],[1,4],[3,8]],[[3716,3159],[2,5],[4,9]],[[3730,3200],[1,3],[1,3]],[[3732,3209],[1,6]],[[3733,3215],[1,2],[0,2]],[[3734,3221],[1,3]],[[3416,3882],[-1,0]],[[3415,3882],[-1,0],[-1,0]],[[3407,3883],[-1,0]],[[3406,3883],[-1,0],[-1,0]],[[3376,3985],[-4,6],[-7,12]],[[3365,4003],[-4,8],[-9,15]],[[3352,4026],[-3,6],[-6,13]],[[3343,4045],[-1,2],[-2,3]],[[3340,4050],[-3,6],[-6,14]],[[3331,4070],[-1,1],[-1,3]],[[3329,4074],[-2,4],[-4,8]],[[3305,4125],[-2,7],[-5,12]],[[3298,4144],[-3,7],[-4,13]],[[3291,4164],[-2,6],[-5,13]],[[3284,4183],[-2,7],[-4,13]],[[3278,4203],[-1,4],[-2,7]],[[3270,4237],[-1,3],[-2,7]],[[3267,4247],[0,3],[-2,7]],[[3264,4256],[-1,4],[-1,7]],[[3262,4267],[-1,4],[-1,7]],[[3260,4278],[0,0]],[[3259,4280],[0,0]],[[3259,4280],[0,0]],[[3258,4281],[0,0]],[[3273,4287],[1,0],[3,1]],[[3277,4288],[1,1],[3,0]],[[3385,4309],[1,0]],[[3387,4308],[0,0]],[[3612,4347],[0,1]],[[3611,4349],[0,0]],[[3611,4349],[0,1]],[[3613,4351],[0,0]],[[3765,4376],[0,1]],[[3768,4379],[0,0]],[[3885,4400],[1,1],[1,0]],[[3892,4401],[2,-1]],[[3894,4400],[1,0],[1,0]],[[3900,4398],[2,-1]],[[3919,4391],[0,0]],[[3920,4391],[0,0]],[[4035,4339],[2,-1],[2,0]],[[4040,4337],[4,-2]],[[4044,4335],[1,-2],[3,-2]],[[4048,4331],[1,-1],[2,-1]],[[4051,4329],[2,-3]],[[4053,4326],[1,-2],[1,-1]],[[4055,4323],[3,-4]],[[4155,4225],[0,0]],[[4157,4224],[0,0]],[[4247,4084],[-1,-2],[-2,-5]],[[4244,4077],[-1,-3],[-1,-5]],[[4242,4069],[-1,-2],[-1,-3]],[[4240,4064],[-1,-2],[0,-4]],[[4239,4058],[-1,-1],[0,-1]],[[4238,4056],[0,-1],[0,-1]],[[4238,4054],[-1,-3],[0,-3]],[[4236,4040],[1,-6]],[[4237,4034],[0,-3],[0,-2]],[[4239,4020],[1,-5]],[[5041,5172],[-1,1],[-4,2]],[[5036,5175],[-1,0],[-4,2]],[[4995,5195],[0,1]],[[4996,5198],[0,0]],[[4996,5198],[0,0]],[[4995,5200],[0,0]],[[4586,5383],[0,0]],[[4586,5382],[0,0]],[[4586,5382],[0,0]],[[4587,5382],[0,0]],[[4587,5381],[0,0]],[[4588,5377],[0,0]],[[4588,5377],[0,0]],[[4587,5375],[0,0]],[[4585,5373],[-1,-1],[-2,-2]],[[4576,5364],[-1,-2],[-1,-2]],[[4547,5390],[0,0]],[[4547,5393],[0,0]],[[4444,5461],[-1,1],[-3,1]],[[4440,5463],[-3,1],[-4,2]],[[4429,5467],[-8,3]],[[4410,5472],[-3,1],[-6,2]],[[4396,5476],[-4,2],[-10,4]],[[4373,5488],[-3,3],[-3,3]],[[4353,5874],[0,0]],[[4354,5876],[0,0]],[[4354,5876],[0,0]],[[4354,5878],[-1,0]],[[4421,5954],[0,0]],[[4420,5955],[1,1]],[[4421,5956],[0,1]],[[4421,5958],[0,0]],[[4443,6010],[1,0]],[[4445,6011],[0,1]],[[4445,6012],[0,0]],[[4447,6013],[0,0]],[[5966,1804],[-667,1032],[5,920],[185,78],[23,9],[2,1],[15,0],[3,0],[10,4],[16,6],[13,6],[5,2],[23,14],[3,4],[11,17],[11,16],[13,20],[8,13],[3,5],[2,2],[8,12],[1,1],[0,1],[10,15],[1,1],[12,19],[1,1],[0,15],[-1,8],[4,6],[1,1],[9,15],[4,6],[4,6],[12,-8],[5,-2],[11,12],[9,8],[15,15],[13,14],[3,2],[1,2],[-10,14],[-11,13],[-8,11],[-9,11],[15,17],[19,22],[22,24],[4,0],[-6,8],[-14,17],[-5,6],[-2,2],[-6,9],[-1,1],[-1,-1],[-2,2],[1,1],[-1,1],[-1,0],[-6,8],[-19,24],[-4,6],[-12,14],[-14,19],[-3,3],[-11,14],[5,9],[11,18],[5,8],[2,1],[13,19],[9,15],[15,24],[-5,3],[9,13],[9,15],[0,1],[2,3],[9,14],[11,17],[4,8],[1,2],[1,3],[1,2],[1,3],[0,5],[0,4],[0,5],[0,4],[-1,5],[-1,4],[-5,15],[-9,24],[-11,37],[-4,17],[-2,9],[-6,24],[-4,15],[-4,16],[-3,10],[-20,68],[-4,13],[-1,6],[-1,5],[-2,8],[0,3],[-1,2],[1,2],[0,2],[1,2],[1,1],[1,2],[-6,7],[0,1],[-1,0],[0,1],[-2,6],[1,0],[-1,3],[-1,0],[-7,20],[-9,29],[-13,44],[0,1],[0,1],[0,1],[-5,20]],[[5672,4969],[0,-1],[1,-1],[0,-1],[1,-1],[1,0],[1,-1],[1,0],[1,0],[1,0],[1,1],[11,6],[12,8],[10,5],[30,14],[22,11],[4,2],[7,4],[6,4],[2,1],[5,5],[6,5],[1,1],[6,5],[2,3],[2,2],[2,3],[1,4],[1,3],[0,4],[0,3],[-1,4],[8,3],[1,-2],[-1,0],[2,-2],[-1,0],[1,-2],[1,1],[-1,1],[1,0],[0,1],[2,1],[-1,1],[7,7],[-2,1],[2,1],[-2,2],[11,10],[0,1],[3,3],[-1,0],[3,3],[-1,1],[3,2],[-1,1],[3,2],[2,3],[6,6],[9,10],[15,19],[2,3],[5,6],[0,1],[1,1],[0,1],[9,12],[13,17],[1,-1],[6,7],[5,7],[2,5],[-12,11],[-7,8],[-7,7],[-1,1],[-5,6],[-3,2],[-2,2],[-6,7],[-7,9],[-7,9],[-7,8],[-3,4],[-10,15],[0,1],[-9,15],[-9,16],[-1,-1],[-4,6],[-5,6],[-4,4],[-33,36],[-2,19],[7,-2],[3,1],[14,11],[2,1],[6,5],[3,2],[9,7],[11,8],[1,1],[18,18],[7,6],[10,9],[10,8],[12,13],[6,6],[10,10],[4,5],[3,4],[1,-1],[5,5],[8,3],[1,-1],[1,0],[0,-1],[1,0],[1,0],[1,0],[0,1],[1,0],[4,3],[10,10],[-2,2],[11,11],[1,-1],[0,-1],[1,0],[1,0],[1,0],[1,0],[0,1],[4,4],[1,1],[0,1],[0,2],[-1,3],[-1,2],[0,2],[-1,0],[0,1],[0,1],[1,0],[0,1],[-1,11],[4,6],[18,16],[0,1],[16,16],[5,4],[2,3],[2,2],[19,21],[7,8],[7,7],[9,10],[6,8],[2,2],[3,3],[4,7],[5,13],[2,10],[1,3],[1,10],[1,6],[2,8],[2,9],[0,1],[4,7],[16,22],[-7,5],[6,6],[-3,3],[1,1],[1,1],[9,16],[5,9],[5,8],[4,2],[22,13],[32,18],[0,-3],[31,1],[10,-2],[9,-3],[8,10],[18,21],[20,27],[12,15],[20,16],[11,16],[8,12],[19,19],[20,21],[10,-13],[10,-9],[11,-15],[25,-28],[20,-17],[8,-7],[31,-27],[3,-4],[-2,-5],[18,21],[23,37],[4,7],[4,12],[2,7],[12,33],[24,27],[23,26],[23,26],[3,2],[-1,2],[9,0],[7,5],[2,2],[2,3],[30,22],[22,16],[8,6],[5,9],[14,26],[16,28],[43,29],[44,30]],[[6816,6245],[3,2],[45,-19],[44,-19],[5,-1],[42,-18],[45,-19],[55,-22],[9,0],[9,3],[7,7],[9,-4],[25,-12],[50,-26],[5,7],[25,22],[24,8],[28,-1],[37,-4],[11,13],[16,23],[30,-9],[6,30],[9,11],[4,28],[29,-14],[23,-11],[9,-24],[10,-26],[14,-15],[13,-15],[7,-9],[21,-26],[1,-1],[21,-30],[21,-29],[23,-31],[26,-34],[-13,-27],[-12,-27],[6,-6],[3,-3],[5,-5],[23,21],[27,15]],[[7616,5948],[17,1],[40,2],[3,0],[7,0],[2,0],[-1,8],[-1,6],[0,11],[1,5],[1,5],[-1,6],[-2,4],[0,8],[4,5],[3,8],[0,10],[2,4],[2,2],[3,4],[3,9],[2,9],[5,12],[3,4],[1,2],[-1,3],[0,6],[4,10],[2,4],[0,7],[1,3],[5,3],[4,6],[2,6],[7,7],[2,3],[1,0],[2,-1],[29,-9],[19,-4],[16,-4],[21,-1],[5,0],[2,-1],[-1,-7],[1,-6],[-1,0],[-3,-1],[-2,-2],[-1,-1],[0,-5],[3,-12],[0,-1],[1,-1],[5,-5],[1,-4],[0,-3],[0,-1],[2,-2],[11,-9],[1,-3],[3,-4],[2,-2],[6,-14],[3,-3],[1,-8],[1,-1],[5,-2],[0,-3],[-1,-4],[-12,-32],[-24,-59],[68,-33],[3,-2],[20,-9],[37,-20],[11,-5],[10,-5],[27,-14],[10,-7],[8,-5],[16,-9],[2,-1],[0,2],[18,-7],[6,-2],[19,-10],[17,-9],[17,-11],[15,-11],[15,-14],[10,-12],[14,-16],[-1,-11],[-4,-25],[29,-1],[3,0],[-8,-21],[-2,-4],[-3,-8],[-5,-14],[-7,-16],[-4,-8],[-2,-3],[-15,-18],[-29,14],[-15,6],[-16,5],[-18,9],[-30,18],[-20,-41],[-9,-17],[-10,-26],[-14,9],[-12,8],[-7,-21],[1,-2],[14,-4],[28,-8],[27,-8],[11,-3],[-1,-4],[22,-7],[6,-2],[6,-2],[6,-2],[6,-3],[8,-4],[7,-3],[7,-4],[0,-1],[1,0],[0,-1],[0,-1],[0,-1],[0,-1],[-7,-12],[-6,-8],[-7,-9],[2,-1],[-12,-14],[-8,-10],[17,-21],[17,-20],[19,-21],[2,-4],[6,-9],[4,-5],[2,-3],[7,-5],[0,-1],[9,-8],[9,-8],[7,-7],[12,-12],[1,0],[9,-9],[10,-10],[10,-14],[3,-3],[0,-22],[0,-6],[4,-3],[8,-6],[16,-13],[8,-6],[16,-12],[7,-8],[17,-8],[8,-4],[7,-19],[3,-8],[1,-2],[29,-18],[15,-14],[2,-2],[11,-11],[5,-5],[20,-18],[-6,-24],[-9,-21],[-7,-7],[-4,-7],[2,-9],[11,-29],[2,-19],[9,-14],[15,-22],[9,-13],[-17,-32],[-14,-30],[20,-13],[21,-15],[29,-41],[15,-32],[-11,-13],[-13,-11],[28,-22],[28,-20],[21,-25],[22,-19],[17,-15],[19,8],[24,-25],[14,-26],[10,-25],[19,-37],[9,-8],[4,-3],[-6,-5],[0,-5],[1,-7],[1,-2],[1,-1],[0,-2],[2,-2],[1,-1],[1,-1],[4,-2],[3,-2],[4,-1],[4,-1],[9,-2],[5,-1],[4,-1],[4,-1],[3,-2],[16,-8],[4,-2],[3,-2],[4,-3],[3,-3],[4,-3],[2,-4],[3,-4],[2,-4],[11,-18],[3,-6],[5,-6],[4,-6],[5,-5],[6,-6],[4,-5],[4,-5],[4,-6],[2,-6],[6,-13],[2,-4],[2,-3],[3,-3],[3,-3],[5,-5],[5,-5],[5,-5],[5,-6],[27,-32],[14,-18],[11,-15],[2,-3],[1,-3],[2,-4],[0,-3],[1,-3],[0,-4],[1,-3],[2,-4],[2,-3],[3,-2],[3,-2],[3,-2],[3,-1],[9,-2],[5,-1],[4,-2],[5,-3],[4,-3],[16,-13],[26,-19],[12,-12],[4,-3],[4,-5],[3,-4],[3,-5],[3,-5],[2,-6],[1,-2],[1,-2],[2,-2],[2,-2],[2,-1],[2,-1],[3,0],[2,0],[9,1],[3,0],[3,0],[3,0],[3,-1],[39,-9],[60,-12],[8,-2],[8,-3],[7,-3],[8,-3],[30,-15],[6,-3],[6,-3],[5,-4],[6,-4],[7,-5],[45,60],[15,21],[4,-1],[3,0],[4,0],[3,0],[4,1],[2,2],[3,2],[3,3],[2,3],[2,3],[2,4],[1,5],[103,-28],[3,1],[51,61],[12,-11],[14,-23],[8,-17],[8,-29],[9,-25],[12,-28],[2,-3],[2,-3],[-2,-3],[-4,-3],[-2,-5],[1,-3],[-6,-6],[2,-3],[-2,-4],[-4,-3],[1,-5],[-2,-2],[-1,-3],[-7,-4],[-1,-2],[-2,-1],[-1,-1],[0,-3],[1,-2],[-1,-2],[-2,-3],[-1,-3],[-2,-3],[0,-2],[2,-4],[0,-1],[-1,-2],[-1,-1],[0,-2],[2,-1],[-1,-3],[0,-1],[-2,-7],[0,-1],[0,-2],[-1,-1],[0,-2],[-2,-4],[1,-2],[-1,-4],[0,-1],[-1,-2],[-2,-3],[0,-2],[-1,-2],[-1,-2],[0,-1],[1,-2],[0,-1],[-2,-3],[1,-2],[-1,-2],[-1,-2],[-3,-2],[-3,-4],[-2,-1],[-1,-1],[-1,-2],[-2,-1],[-2,0],[-4,-2],[-2,-3],[-2,-1],[-1,-1],[-1,-2],[-2,-3],[-2,-5],[-2,-1],[-2,0],[-1,-1],[-4,-2],[-2,-1],[-1,0],[-1,-4],[-2,-1],[-2,-4],[-3,-1],[-2,-3],[-4,-3],[-2,-2],[-5,-5],[-2,-1],[-1,-2],[-2,-1],[-2,0],[-3,1],[-1,1],[-1,1],[-2,-1],[-1,-5],[-6,-5],[-6,0],[-5,3],[-2,4],[-4,-1],[-3,-3],[-3,-1],[0,-2],[5,-15],[8,-30],[1,-3],[14,-39],[7,-13],[0,-1],[3,-44],[1,-9],[0,-1],[1,-5],[-47,-9],[-1,-2],[0,-5],[0,-4],[0,-4],[-1,-4],[-2,-35],[-2,-22],[-1,-22],[10,-1],[20,-4],[21,-3],[53,-3],[54,-2],[34,0],[4,0],[26,-5],[37,-8],[21,-10],[11,-3],[5,-2],[-2,-3],[5,-2],[18,-13],[25,-19],[18,-15],[33,-30],[3,-2],[9,-6],[17,-8],[10,-5],[2,0],[9,-3],[-5,-1],[-1,0],[-26,-21],[-3,-2],[-1,-2],[-2,-3],[-1,-2],[-1,-3],[-1,-3],[-1,-16],[-4,-19],[-1,-39],[-1,-6],[-1,-6],[-2,-5],[-18,-45],[-1,-4],[-1,-4],[-1,-4],[0,-3],[0,-3],[0,-5],[1,-5],[1,-4],[1,-5],[3,-8],[2,-3],[1,-3],[1,-1],[2,-3],[2,-3],[8,-8],[9,-9],[1,-1],[10,-9],[16,-13],[10,-10],[14,-14],[4,-6],[1,1],[14,-17],[13,-19],[5,-7],[1,0],[1,0],[1,1],[1,0],[1,1],[1,0],[-1,-1],[1,-2],[-7,-9],[3,-9],[2,-3],[2,-2],[3,-3],[23,-22],[30,-26],[32,-26],[3,-2],[3,-2],[4,-1],[4,-1],[3,-1],[4,0],[-5,-5],[-1,-2],[-2,-3],[-13,-7],[-12,-7],[-10,-10],[-6,0],[-1,-3],[2,-2],[-4,-6],[-2,-2],[-5,-4],[-5,-4],[-5,-4],[-6,-3],[-6,-2],[-5,-2],[-27,-9],[-29,-7],[-22,-5],[-2,-1],[-3,-1],[-2,-2],[-2,-1],[-3,-3],[-2,-3],[-1,-3],[-3,-7],[-1,-2],[0,-1],[-1,-1],[-1,-1],[-1,-1],[-1,0],[-1,-1],[-1,0],[-1,0],[-1,0],[-1,0],[-20,7],[-39,6],[-4,1],[-4,1],[-4,1],[-3,1],[-36,13],[-2,1],[-2,0],[-2,0],[-2,-1],[-1,-1],[-2,-1],[-1,1],[-4,1],[0,13],[-2,1],[-22,2],[-22,-2],[-26,-2],[-4,-1],[-1,11],[0,8],[-2,19],[-5,-2],[-5,-1],[-4,-1],[-5,0],[-17,0],[-5,-1],[-4,-1],[-14,-3],[-5,-1],[-5,0],[-5,0],[-5,1],[-5,1],[-5,2],[-16,7],[-10,6],[-4,1],[-4,1],[-4,1],[-4,0],[-7,0],[-1,-2],[-2,2],[-3,2],[-2,1],[-3,1],[-3,1],[-2,0],[-3,-1],[-2,0],[-2,-1],[-2,-2],[-2,-1],[-2,-2],[-1,-3],[-4,-6],[-1,-3],[-2,-3],[-3,-3],[-2,-3],[-2,3],[0,1],[-7,-2],[-5,-6],[-11,2],[-3,-2],[-17,0],[-4,2],[-8,2],[-4,-3],[-3,0],[-4,1],[-3,-5],[-4,0],[-1,5],[-3,2],[-4,-2],[-2,1],[-5,2],[-2,4],[-11,1],[-9,5],[-3,2],[-18,4],[-7,1],[-5,-1],[-2,6],[-2,0],[-6,-3],[-6,-7],[-7,0],[-6,-7],[-4,-2],[0,-5],[-1,-1],[-1,0],[-11,-11],[-6,2],[-5,0],[-3,-3],[-2,-5],[-5,-1],[-1,-1],[-1,-2],[-3,-5],[-3,-12],[-6,-5],[-3,-1],[-4,-5],[-11,-4],[-6,0],[-5,-5],[-8,-1],[-6,-3],[-6,5],[-6,0],[-8,-1],[-8,4],[-3,-1],[-2,-5],[-5,1],[-12,8],[-4,2],[-7,-2],[-4,1],[-6,-4],[-6,2],[-18,-2],[-8,-1],[-7,-6],[-7,5],[-5,-2],[-2,-2],[-9,-5],[-17,0],[-10,2],[-5,2],[-7,-1],[-5,2],[-7,1],[-2,2],[-8,1],[-8,-1],[-5,4],[-20,6],[-7,1],[-12,7],[-7,-2],[-14,0],[-10,-1],[-6,-1],[-7,3],[-7,-4],[-6,1],[-6,-7],[-11,-10],[-4,-7],[-16,-6],[-5,0],[-1,-1],[1,-5],[0,-1],[-5,-1],[-5,3],[-2,-1],[-5,-11],[-4,-3],[-7,-1],[-3,-8],[-1,-8],[-1,-3],[-9,-2],[-8,-15],[0,-5],[-5,-11],[-8,-10],[-3,-2],[-5,-7],[9,-11],[-1,-5],[-5,-6],[-4,-2],[-5,-15],[4,-5],[0,-7],[-1,-6],[3,-5],[1,-7],[0,-3],[-3,-8],[0,-5],[-2,-3],[3,-5],[0,-7],[-2,-5],[0,-17],[0,-3],[-3,0],[-6,0],[-12,-3],[-13,0],[-22,-1],[-4,0],[-7,-1],[-5,1],[-7,1],[-5,3],[-6,4],[-4,5],[-9,11],[-7,5],[-6,0],[-4,0],[-4,0],[-7,1],[-2,0],[-17,4],[-4,1],[-5,4],[-8,8],[-4,5],[-5,3],[-8,2],[-7,8],[-5,0],[-5,-1],[-6,1],[-8,1],[-9,1],[-8,-2],[-2,0],[-10,-1],[-4,0],[-5,4],[-7,8],[-8,6],[-7,1],[-11,-1],[-10,-3],[-7,-4],[-17,-9],[-2,-1],[-5,3],[-4,0],[-3,-1],[-2,-1],[-8,-6],[-6,1],[-4,4],[0,7],[-3,7],[-6,2],[-6,5],[-6,2],[-8,-1],[-13,-2],[-8,6],[-1,7],[-5,5],[-4,1],[-4,-1],[-6,-3],[-8,-7],[-11,-7],[-11,-8],[-4,1],[-9,5],[-9,7],[-16,-8],[-4,-1],[-9,-5],[-4,0],[-3,1],[-3,5],[-4,10],[-1,3],[-3,5],[-1,8],[-4,7],[-7,6],[-5,3],[-6,3],[-8,2],[-8,-1],[-10,0],[-7,1],[-8,1],[-6,2],[-10,5],[-10,8],[-5,6],[-2,4],[-3,11],[0,5],[-1,5],[-1,4],[-7,8],[-7,5],[-8,8],[-6,7],[-2,3],[-3,2],[-8,4],[-7,-1],[-4,-4],[-8,-6],[-5,-10],[-7,-10],[-3,-8],[-6,-4],[-5,0],[-6,5],[-3,5],[-4,3],[-8,-1],[-9,0],[-8,2],[-6,0],[-7,-1],[-3,-1],[-12,1],[-10,-5],[-6,1],[-7,3],[-9,2],[-10,1],[-14,3],[-5,6],[-5,6],[-4,1],[-2,0],[-5,-3],[-4,-9],[-2,-9],[-5,-9],[-9,-5],[-8,2],[-8,4],[-8,4],[-7,6],[-7,1],[-10,-3],[-6,-1],[-6,3],[-7,3],[-1,-3],[-3,-5],[-7,-17],[-3,-11],[-8,-15],[-12,-8],[-7,-5],[-5,-3],[-10,-9],[-7,-9],[-7,-14],[0,-1],[-8,-5],[-7,-12],[-1,-2],[-10,-6],[2,-4],[-15,-7],[-9,-3],[-2,0],[12,-12],[-4,-1],[-5,-2],[-4,-6],[-3,-6],[-2,-4],[-4,-8],[-6,3],[-6,4],[-6,4],[-5,3],[-1,1],[-5,2],[-7,-15],[-6,2],[-7,2],[1,1],[-6,1],[-6,1],[-6,2],[-6,0],[-10,2],[-7,0],[-7,1],[-1,0],[-3,0],[4,-9],[10,-25],[-184,-139],[-5,-4],[-3,-2],[-11,-9],[-2,1],[-5,0],[0,-1],[-3,0],[-9,-10],[-1,-1],[-13,13],[-23,-20],[-23,4],[-8,2],[-9,2],[-17,3],[2,-16],[-17,-8],[-6,-4],[-13,-6],[-11,-5],[-28,-12],[-21,-9],[-20,-9],[-13,-5],[-9,-4],[-7,-3],[-30,-13],[-4,-2],[-3,-1],[-25,-10],[-7,-3],[-5,11],[-16,-6],[-33,-12],[3,-6],[-6,-2],[-2,0],[-21,-7],[-2,1],[4,-14],[-10,-4],[-1,-1],[-69,-30],[-34,77],[-71,-42],[-22,-13],[-6,-3],[-13,-8],[-16,-9],[-3,-1],[-12,18],[-6,-5],[-3,6],[-2,3],[-2,3],[-6,10],[-9,-6],[-16,-5],[-15,-4],[-2,-1],[-10,-3],[-11,-5],[-3,-1],[3,-8],[0,-1],[3,-7],[-2,-1],[-25,-15],[-2,-1],[-7,-2],[-1,0],[-9,-7],[-20,-15],[-9,-7],[-594,-458]],[[1699,7309],[20,-2],[20,-2],[13,-3],[13,-2],[14,-3],[13,-4],[13,-4],[13,-5],[12,-5],[13,-5],[12,-6],[12,-7],[12,-7],[12,-7],[11,-8],[11,-9],[11,-8],[10,-9],[10,-10],[10,-10],[10,-10],[9,-11],[9,-11],[8,-11],[8,-12],[7,-12],[24,-39],[41,-66],[18,-31],[6,-9],[6,-9],[6,-9],[7,-8],[7,-8],[7,-8],[8,-8],[8,-7],[8,-7],[8,-7],[9,-6],[8,-6],[9,-5],[10,-6],[9,-5],[9,-4],[10,-4],[10,-4],[10,-3],[10,-3],[10,-3],[10,-2],[10,-2],[11,-1],[10,-1],[10,-1],[11,0],[10,0],[11,1],[10,1],[10,1],[11,2],[114,23],[42,9],[12,2],[13,2],[12,1],[13,1],[13,0],[12,0],[13,0],[13,-1],[12,-1],[13,-2],[12,-2],[13,-3],[94,-22],[11,-3],[10,-3],[10,-3],[11,-3],[10,-4],[10,-5],[10,-4],[10,-5],[9,-5],[10,-6],[9,-5],[10,-6],[9,-7],[9,-6],[8,-7],[9,-7],[8,-7],[8,-8],[8,-8],[8,-8],[7,-8],[7,-9],[7,-9],[7,-9],[45,-61],[7,-10],[8,-9],[8,-9],[8,-9],[9,-9],[9,-8],[9,-8],[9,-7],[10,-8],[10,-7],[10,-6],[10,-6],[11,-6],[11,-5],[11,-5],[11,-5],[11,-4],[11,-3],[12,-4],[12,-3]],[[3235,6529],[-6,-29],[0,-2],[-6,-25],[-4,-17],[0,-2],[4,-4],[-14,-2],[-16,-16],[-28,-2],[0,-1],[-37,-2],[-19,-2],[-8,-1],[-7,-1],[-7,-1],[-7,-1],[-15,-4],[-4,-1],[-3,-1],[-4,-2],[-3,-2],[-2,-2],[-2,-2],[-1,-2],[-1,-3],[-1,-3],[0,-2],[0,-3],[1,-3],[1,-2],[1,-3],[1,-3],[2,-3],[1,-2],[2,-2],[32,-36],[5,-5],[4,-5],[-16,-17],[-20,-21],[-17,-14],[-5,-1],[-5,-1],[-5,-1],[-4,0],[-5,0],[-36,0],[-36,0],[-36,1],[-36,0],[-35,0],[133,-59],[-100,-87],[-3,-2],[-1,-4],[-28,-66],[-24,-60],[-20,-46],[39,-18],[38,-17],[38,-18],[38,-17],[-5,-12],[38,-17],[19,-9],[19,-9],[3,-1],[34,-15],[16,-8],[10,-4],[12,-6],[1,0],[11,-5],[12,-6],[10,-5],[7,-3],[4,-1],[14,-7],[12,-5],[6,-3],[6,-3],[12,-5],[10,-5],[10,-4],[8,-4],[-1,0],[-1,0],[-1,0],[-1,0],[0,-1],[-1,0],[-1,-1],[-8,-10],[-26,-31],[-10,-12],[-1,0],[-20,-24],[-28,-34],[-1,-1],[-1,-2],[0,-1],[0,-2],[0,-2],[0,-1],[1,-2],[1,-1],[1,-1],[1,-1],[-12,8],[-11,-13],[1,0],[33,-22],[33,-22],[32,-21],[32,-21],[26,-18],[1,-1],[1,-1],[1,-1],[0,-1],[1,-1],[0,-2],[0,-1],[0,-2],[0,-1],[-1,-1],[0,-1],[-1,-1],[-13,-16],[-24,-30],[-25,-30],[-25,-29],[-20,-25],[-2,-2],[-2,-1],[-2,-2],[-3,-1],[-2,0],[-3,0],[-14,0],[-19,-17],[1,-5],[7,-27]],[[3110,5310],[-4,-4],[-4,-4],[-7,-8],[-21,-25],[-1,-1],[-22,-25],[-11,-12],[-10,-12],[-29,-30],[-3,-4],[-6,-6],[-10,-11],[-18,-18],[-11,-12],[-4,-5],[-8,-9],[-8,-8],[-8,-10],[-11,-14],[-2,-1],[-9,-13],[-8,-10],[-9,-12],[-8,-12],[-2,-2],[-12,-19],[2,-7],[-17,-22],[12,-8],[10,-7],[-1,-2],[1,0],[1,-1],[1,-1],[1,-1],[15,-21],[24,-33],[6,-8],[29,-39],[21,-30],[7,-9],[28,-38],[19,-26],[9,-12],[4,-7],[5,-7],[5,-7],[4,-7],[1,-1],[0,-1],[0,-1],[0,-1],[0,-1],[-1,-1],[11,-25],[20,-23],[0,-12],[-27,-39],[-16,-28],[-17,-27],[-17,-30],[1,0],[-37,-66],[-8,-13],[-8,-13],[0,-1],[-9,-13],[-10,-13],[-8,-10],[-9,-11],[-9,-10],[-2,-2],[-11,-11],[-6,-6],[-7,-6],[-6,-6],[-7,-6],[-7,-6],[-7,-5],[-1,-1],[-4,-4],[-3,0],[-11,-7],[-11,-8],[-13,-8],[2,-1],[-8,-5],[-8,-5],[-60,-32],[-11,-6],[-10,-5],[-9,-6],[-10,-7],[-7,-5],[-6,-5],[-1,-1],[0,-5],[-8,-7],[-8,-8],[-6,-7],[-6,-7],[-12,-12],[-2,-1],[-1,-1],[-2,-1],[-2,0],[-2,0],[-2,0],[-1,0],[-2,1],[-4,-20],[0,-1],[1,-1],[0,-1],[0,-1],[0,-1],[0,-1],[-1,0],[0,-1],[-4,-5],[-4,-5],[-5,-5],[-5,-4],[7,-11],[5,3],[6,3],[5,2],[6,2],[5,0],[5,1],[5,0],[5,-1],[3,-5],[-4,-13],[-5,-14],[-4,-12],[0,-1],[-3,-6],[-2,-6],[-1,-2],[-7,-19],[-5,-12],[-5,-13],[-2,1],[-10,-34],[-10,-33],[2,-1],[-3,-10],[-2,-9],[-1,-5],[-1,-7],[-1,-8],[-1,-1],[0,-1],[0,-1],[0,-1],[-1,0],[-1,-1],[0,-1],[-1,0],[-1,0],[-1,-1],[-2,0],[-1,1],[-1,0],[-1,1],[-1,1],[-1,1],[0,2],[2,-9],[2,-8],[10,-3],[5,-2],[5,-15],[1,-8],[0,-1],[-4,-21],[-4,-29],[-4,1],[-2,0],[-3,0],[-10,-4],[-3,-1],[-28,-11],[-40,-20],[-26,-13],[-41,-19],[-39,-26],[-43,-27],[-16,-10],[-32,-15],[-22,-10],[-18,-9],[-36,-8],[-27,-42],[-15,-21],[-15,-21],[-21,-29],[-26,-37],[-28,-40],[-19,-28],[-24,-39],[-30,-42],[-23,-34],[-6,-12],[-6,-15]],[[1996,3303],[-12,10],[0,9],[0,9],[-7,21],[-20,42],[-38,41],[-21,19],[-29,18],[-27,13],[-27,16],[-23,14],[-30,11],[-6,4],[-21,14],[-35,-10],[-5,-2],[-2,0],[-30,-14],[-13,-7],[-11,-7],[-2,-1],[-4,-2],[-30,5],[-31,9],[-31,9],[-26,6],[-19,4],[-21,3],[-30,9],[-14,-5],[-36,4],[-27,15],[-33,31],[-21,10],[-5,2],[-11,4],[-10,5],[-18,8],[-1,3],[-6,20],[-7,44],[-7,41],[-6,18],[-7,21],[-14,44],[-1,3],[-5,18],[-6,14],[-2,6],[4,6],[-9,8],[-58,43],[-49,31],[-18,10],[-6,3],[-26,18],[-9,6],[-16,14],[-2,2],[-15,15],[-14,25],[-1,4],[-4,11],[-2,8],[-7,-2],[-27,16],[-32,41],[-5,49],[-1,48],[17,32],[9,10],[5,5],[5,2],[5,2],[-4,13],[22,8],[0,1],[37,30],[15,12],[36,30],[3,2],[19,16],[6,5],[19,16],[6,5],[27,20],[4,3],[47,36],[16,12],[17,31],[7,15],[3,5],[11,21],[20,36],[0,22],[4,-1],[0,21],[-4,25],[-4,17],[-7,34],[-2,0],[-85,-11],[-31,-7],[-29,-15],[-40,22],[-40,26],[-42,28],[-48,48],[-7,7],[-16,18],[-15,15],[-59,51],[-43,35],[-42,33],[-43,35],[-37,25],[-38,12],[-36,7],[-46,0],[-23,6],[-58,20],[-65,8],[-57,0],[-46,4],[-47,-1],[-45,0],[-34,3],[-39,16],[-77,77],[-36,38],[-26,51],[31,1],[44,3],[31,5],[28,5],[41,10],[31,7],[1,0],[4,1],[3,-2],[3,-2],[3,-2],[4,-1],[3,0],[4,0],[5,0],[5,0],[5,-1],[6,-1],[5,-1],[6,-2],[9,-3],[9,-4],[8,-4],[8,-4],[5,-1],[5,-2],[4,-1],[5,0],[6,0],[5,1],[3,1],[4,2],[4,0],[4,1],[3,0],[3,1],[2,1],[3,2],[6,4],[6,3],[4,2],[5,3],[5,2],[6,1],[5,1],[5,1],[16,3],[16,3],[15,4],[15,3],[5,2],[5,3],[5,2],[4,4],[3,2],[3,3],[4,2],[4,2],[2,131],[5,-4],[5,-4],[5,-3],[6,-3],[6,-2],[6,-2],[6,-1],[6,0],[24,-2],[5,0],[4,0],[4,1],[4,1],[2,1],[3,2],[2,2],[2,2],[2,3],[1,3],[1,3],[1,4],[-1,3],[0,3],[-1,3],[-1,3],[-2,3],[-2,2],[-4,6],[-4,5],[-5,5],[-6,6],[-6,5],[-6,5],[-6,4],[-6,4],[-3,3],[-2,3],[-3,3],[-1,4],[2,0],[2,1],[3,2],[1,2],[2,2],[1,2],[1,3],[0,2],[0,3],[-1,2],[-6,21],[29,15],[9,26],[14,20],[25,34],[24,32],[19,33],[20,35],[14,37],[7,18],[6,14],[20,27],[6,29],[8,36],[5,15],[-9,6],[41,59],[94,132],[1,2],[20,26],[75,68],[2,1],[16,-13],[5,-4],[5,0],[16,4],[7,-1],[7,-3],[29,-24],[12,-9],[19,-10],[2,1],[-2,3],[2,2],[-5,8],[-6,17],[-6,20],[0,8],[6,24],[6,31],[0,3],[3,13],[1,8],[1,4],[0,3],[1,7],[3,14],[1,8],[3,15],[-2,9],[-1,4],[-2,5],[-3,9],[-2,4],[-3,6],[-5,11],[-6,6],[-3,3],[-4,3],[-3,2],[-4,3],[-8,5],[-9,5],[-2,1],[-9,4],[-2,1],[-8,5],[0,1],[-8,8],[-15,16],[-1,2],[-8,9],[-4,5],[-2,2],[-1,2],[-15,20],[-13,21],[-2,4],[-1,1],[3,22],[16,-4],[4,-2],[7,-8],[3,0],[33,-5],[56,-7],[11,-2],[3,0],[8,2],[1,0],[7,-2],[4,0],[2,-1],[7,-2],[8,-1],[5,-1],[11,-4],[11,-4],[9,0],[3,-1],[10,-5],[7,-2],[4,-2],[2,-1],[8,-4],[6,-4],[4,-2],[10,-6],[6,-3],[4,-3],[10,-6],[3,-3],[6,-4],[10,-7],[3,6],[3,5],[6,1],[2,3],[3,5],[2,3],[8,11],[12,-7],[3,-2],[8,-5],[16,-10],[2,-2],[14,-8],[13,-8],[2,-2],[10,17],[-31,19],[2,5],[-2,3],[-1,4],[-2,3],[-1,3],[-1,4],[-1,3],[0,5],[0,5],[0,5],[1,4],[2,5],[2,4],[0,1],[1,0],[2,4],[2,3],[3,2],[3,3],[3,2],[3,2],[3,2],[4,1],[4,2],[5,1],[5,0],[5,1],[6,-1],[7,-1],[7,-1],[8,-1],[3,-1],[4,-2],[3,-1],[3,-2],[14,41],[13,40],[-265,111],[1,4],[-26,11],[-26,10],[-25,12],[-53,21],[-26,11],[-49,21],[1,2],[10,28],[0,2],[14,39],[4,10],[108,-43],[22,61],[4,12],[-33,14],[-75,29],[6,15],[75,209],[7,33],[13,-2],[12,-1],[12,-1],[13,-1],[12,0],[13,0],[12,0],[12,1],[13,1],[12,2],[12,2],[13,2],[10,2],[10,2],[214,53],[10,2],[10,2],[18,4],[19,3],[18,3],[19,2],[14,1],[14,1],[16,0],[15,1],[16,-1],[18,0],[19,-1]],[[5672,4969],[-9,30],[-20,-6],[-3,2],[-41,-13],[-10,-4],[0,-2],[-1,-1],[-1,0],[-26,-9],[-1,0],[-1,1],[-1,0],[-1,2],[-2,1],[-1,2],[-1,2],[-24,58],[-11,26],[-1,1],[0,1],[-8,19],[-4,10],[-2,4],[-4,9],[-4,10],[-1,3],[-4,8],[-1,3],[-2,5],[-3,7],[-1,0],[-16,16],[0,1],[-1,2],[-14,-9],[-15,-9],[-4,-2],[-13,-9],[-1,0],[-1,0],[-1,0],[-5,-1],[-5,0],[-5,0],[-12,-2],[-13,-12],[-1,12],[-2,10],[-2,9],[-8,28],[-8,29],[-2,7],[-3,8],[-16,-6],[-15,-2],[-14,-5],[-2,-1],[-10,-4],[-16,-6],[-66,142],[-28,60],[-28,45],[-14,23],[-23,20]],[[5119,5482],[-107,96],[-43,37],[-141,126],[-46,40]],[[4782,5781],[21,27],[-2,2],[-1,0],[1,1],[1,1],[8,10],[3,-3],[1,-1],[1,0],[1,0],[1,0],[7,1],[16,3],[-1,1],[4,0],[3,0],[1,3],[-2,7],[7,4],[3,3],[2,-3],[5,-4],[5,-6],[2,2],[6,-6],[10,11],[11,11],[1,0],[1,0],[1,1],[1,1],[7,8],[14,15],[20,23],[0,1],[4,4],[4,6],[1,2],[3,4],[3,5],[0,1],[2,4],[1,4],[1,4],[1,2],[0,5],[0,5],[-1,4],[-1,4],[-1,3],[8,10],[1,0],[0,-1],[1,0],[1,0],[1,0],[1,0],[0,1],[1,0],[0,1],[0,1],[0,1],[0,35],[-1,33],[-2,49],[0,29],[-1,21],[0,16],[0,3],[-1,17],[0,15],[-1,15],[0,3],[-5,7],[9,14],[-18,20],[-6,7],[-6,7],[-6,8],[-7,7],[-23,32],[0,2],[-1,2],[2,1],[-5,8],[-6,8],[-8,12],[0,5],[-4,7],[-3,1],[-5,8],[-3,3],[0,-1],[-1,0],[-1,1],[-1,1],[-1,-2],[-10,14],[-5,8],[-1,2],[-3,3],[-1,2],[-4,6],[-1,1],[-4,8],[-1,2],[-2,4],[-1,1],[-1,3],[-2,4],[0,1],[-2,3],[-2,5],[-1,3],[-3,8],[-2,4],[-2,4],[-1,3],[0,1],[-2,4],[-4,10],[0,1],[-5,11],[-2,5],[-5,11],[-5,11],[-3,6],[-5,8],[-3,5],[-2,3],[-4,6],[0,1],[-6,8],[3,2],[-15,23],[-6,8],[-2,4],[-2,3],[-1,4],[-1,3],[0,4],[-1,4],[1,5],[0,4],[8,38],[-2,0],[1,3],[5,27],[1,6],[2,7],[1,7],[1,8],[1,7],[1,19],[3,24],[3,3],[2,2],[-25,-10],[-1,31],[2,2],[1,3],[0,2],[1,2],[0,3],[0,1],[0,2],[0,1],[0,1],[-1,1],[0,1],[-1,1],[-1,0],[0,1],[-1,0],[-1,0],[-1,0],[-3,10],[1,0],[1,1],[1,1],[1,1],[1,1],[1,1],[0,1],[1,1],[0,2],[0,1],[-1,6],[0,3],[-3,7],[-2,9],[-6,13],[-5,13],[-1,3],[0,2],[-9,21],[-5,12],[4,7],[1,12],[1,6],[3,24],[1,25],[9,0],[0,10],[-1,10],[-1,8],[-1,7],[0,6],[-3,10],[-2,10],[-8,28],[-3,9],[-3,9],[-1,3],[-3,8],[-3,7],[-4,9],[-5,8],[-4,8],[-6,9],[-24,37],[-3,4],[-2,4],[-2,5],[-2,5],[-1,5],[-2,7],[-1,6],[0,7],[0,6],[3,34],[0,28],[-15,38],[-13,33],[-2,4],[-2,4],[-2,4],[-2,4],[-2,4],[-3,3],[-3,4],[-3,3],[-3,3],[-3,3],[-6,4],[-6,3],[-49,27],[-1,1],[-1,1],[-1,2],[-1,1],[-11,22],[-8,-4],[-1,1],[-4,5],[-4,4],[-4,6],[-4,5],[-3,5],[-3,6],[-4,6],[-2,5],[-13,28],[-16,34],[-17,35]],[[4444,7589],[-3,7],[-2,7],[-3,7],[-2,7],[-11,36],[-2,6],[0,2],[-3,7],[-4,2],[-1,2],[-4,10],[-4,9],[-9,17],[13,10],[6,4],[7,5],[11,8],[14,10],[3,2],[20,16],[23,28],[8,10],[1,2],[10,13],[2,2],[1,1],[0,-1],[9,-11],[9,-11],[9,7],[10,-16],[11,-14],[-2,4],[2,3],[8,15],[10,-6],[11,-7],[11,-7],[9,-5],[9,-6],[1,-1],[1,0],[2,-1],[10,-6],[4,-3],[7,-5],[1,0],[5,-3],[1,-1],[14,0],[0,1],[0,-5],[1,-4],[1,-4],[1,-4],[1,-4],[2,-4],[1,-4],[3,-4],[7,-11],[7,-12],[3,-5],[1,-1],[0,-1],[0,-1],[0,-1],[0,-1],[0,-1],[0,1],[4,8],[4,8],[0,1],[1,3],[4,11],[2,-1],[7,-4],[13,-7],[2,-1],[22,-13],[4,-2],[42,-23],[40,-22],[36,-19],[67,-37],[2,-1],[10,-4],[6,2],[2,1],[-4,-12],[9,-7],[0,1],[1,0],[0,1],[1,0],[1,1],[1,0],[1,-1],[24,-8],[28,-9],[9,-3],[9,-3],[13,-5],[1,0],[0,-1],[0,-1],[3,7],[3,7],[3,8],[11,-10],[-1,-2],[0,-2],[0,-2],[1,-2],[0,-3],[2,-2],[1,-2],[19,-22],[6,-6],[26,-28],[25,-29],[13,-14],[10,-11],[8,-9],[12,-13],[10,-11],[1,-2],[2,-1],[6,-8],[4,-5],[5,-6],[5,-5],[9,-12],[-4,-5],[0,1],[-1,0],[-1,1],[-1,0],[-1,0],[-1,0],[-1,0],[-1,-1],[-8,-6],[-5,-5],[-5,-4],[-5,-3],[-6,-5],[-7,-5],[9,-15],[7,-12],[5,4],[16,-18],[10,12],[3,2],[9,-10],[12,-13],[-2,-2],[-4,-3],[-4,-3],[-3,-4],[-1,-1],[5,-5],[8,-9],[14,-16],[1,-1],[7,-8],[8,-9],[2,-2],[3,-2],[5,-5],[9,-8],[4,-3],[13,-12],[2,-2],[7,-6],[10,-9],[4,-3],[13,-11],[17,-15],[4,-4],[9,-8],[0,-2],[13,-7],[6,-6],[-2,-4],[12,-7],[8,-8],[-5,-5],[-2,-2],[12,-13],[1,1],[4,5],[2,1],[9,-10],[-18,-17],[2,-3],[-38,-39],[12,-14],[5,-17],[13,4],[43,12],[32,10],[24,7],[3,1],[1,-2],[1,-1],[1,0],[1,0],[7,2],[8,2],[3,-33],[8,0],[8,-2],[4,-1],[4,-1],[4,-2],[3,-3],[4,-2],[3,-3],[3,-4],[3,-3],[2,-4],[2,-3],[2,-4],[0,-5],[1,-4],[0,-4],[0,-4],[-1,-4],[27,-19],[2,-1],[6,8],[7,8],[7,8],[7,8],[15,15],[15,14],[4,4],[4,3],[6,4],[3,2],[7,4],[-1,7],[20,18],[14,12],[10,10],[3,4],[9,7],[7,8],[10,10],[6,6],[5,5],[10,10],[10,9],[11,9],[10,8],[16,12],[7,0],[0,1],[0,1],[0,1],[1,1],[1,0],[0,1],[15,11],[4,3],[5,4],[4,4],[6,-10],[38,-62],[26,-18],[36,-26],[1,0],[3,-2],[2,-6],[10,16],[8,12],[7,12],[8,12],[8,12],[9,14],[11,-7]],[[6064,7083],[-2,-4],[-3,-9],[-1,-4],[-4,-15],[0,-1],[-5,-13],[-5,-14],[-2,-6],[-7,-5],[-16,-12],[-16,-13],[-4,-3],[-11,-11],[-18,-22],[-12,-20],[-9,-18],[-3,-5],[7,-10],[14,-20],[1,-3],[2,-3],[8,-12],[2,-3],[9,-13],[17,-8],[1,0],[1,0],[20,2],[12,2],[22,2],[89,17],[14,28],[9,-15],[20,-8],[-1,-5],[20,5],[33,-3],[31,-12],[27,-25],[25,-30],[25,-29],[31,-50],[9,-11],[18,-17],[16,-16],[16,-21],[10,-8],[12,-13],[9,-12],[9,-19],[14,-10],[121,-90],[80,-99],[78,-96],[29,-54],[10,-4]],[[3235,6529],[11,-2],[11,-2],[12,-1],[12,-2],[99,-7],[111,-8],[38,-3],[67,-5],[14,-1],[14,-2],[15,-2],[14,-4],[14,-3],[14,-4],[13,-5],[14,-6],[13,-6],[13,-6],[13,-7],[13,-7],[5,-4],[-1,-3],[56,-34],[26,-14],[42,-24],[91,-38],[93,-38],[46,-14],[46,-13],[81,-30],[4,-2],[10,-3],[37,-14],[33,-19],[41,-26],[30,-22],[75,-59],[52,-46],[15,-17],[71,-77],[16,-16],[77,-80],[76,-72]],[[5119,5482],[-21,-26],[5,-15],[3,-7],[1,1],[8,-30],[-1,-1],[1,-4],[1,1],[3,-10],[2,-9],[3,-20],[3,-19],[1,-20],[1,-19],[0,-12],[-1,-8],[-1,-20],[-3,-19],[-3,-19],[-4,-20],[-1,-1],[-4,-14],[-3,2],[-12,-32],[-2,-7],[-5,-13],[-27,-71],[-5,-13],[-6,-13],[-2,-4],[-4,-10],[-2,-4],[-3,-4],[-20,-29],[-8,-10],[-16,-22],[-44,-47],[-1,-2],[1,0],[-7,-8],[-2,2],[-8,-9],[-12,-13],[4,-2],[-1,-1],[-34,-33],[-7,-7],[-8,-11],[-8,-11],[-17,-26],[-2,-4],[-1,1],[-2,-3],[1,-1],[-1,-3],[-31,-48],[-3,2],[-19,-34],[-6,-9],[0,-2],[-2,1],[-4,-9],[-4,-10],[-14,-35],[-2,-4],[-1,-4],[-5,-11],[1,0],[-6,-14],[-3,-7],[-11,-27],[-4,-9],[-12,-28],[-4,-10],[-7,-17],[-16,-37],[-8,-21],[-1,1],[-7,-18],[1,-1],[-3,-6],[5,-3],[-6,-11],[-6,-11],[-6,-11],[-6,-11],[-7,-10],[-7,-11],[-8,-10],[-7,-10],[-8,-10],[-8,-10],[-9,-9],[-8,-9],[-20,-20],[-12,15],[-46,-46]],[[4518,4249],[-12,13],[-1,1],[3,3],[-2,21],[-2,0],[-2,0],[-2,0],[-5,2],[-15,4],[-13,3],[-1,1],[-16,4],[-15,4],[-8,2],[-6,8],[-7,9],[-5,7],[-7,-5],[-9,-8],[-7,9],[-7,10],[-7,9],[-7,9],[-10,13],[-8,11],[-12,15],[-5,8],[-3,3],[-4,6],[-8,10],[-8,11],[-3,-2],[-8,10],[-3,4],[-20,32],[-12,12],[0,1],[-1,0],[0,1],[-41,44],[-3,-2],[-10,11],[0,1],[-24,26],[-24,26],[-1,-1],[-30,33],[-29,32],[-19,21],[-2,-1],[-9,10],[-1,1],[-8,10],[-8,10],[-7,10],[-6,11],[-6,12],[-6,11],[-5,12],[-3,9],[-1,0],[-19,7],[-1,0],[-24,10],[-6,2],[-4,2],[-9,3],[-10,4],[-10,3],[-14,6],[-34,12],[-1,1],[-1,0],[-1,0],[-1,-1],[-1,0],[0,-1],[-1,0],[-1,-1],[0,-1],[0,-1],[0,-1],[0,-1],[-15,4],[-4,2],[-1,0],[-11,14],[-12,6],[-10,5],[-7,3],[-2,2],[-5,2],[-5,3],[-5,3],[-7,4],[-7,5],[-13,9],[-10,7],[-7,5],[-5,3],[-10,6],[0,1],[-17,12],[-8,7],[-11,8],[-10,8],[-46,35],[-25,16],[-15,10],[-26,16],[-11,7],[-9,5],[-14,9],[-11,7],[-7,4],[-7,-1],[-13,-2],[-13,-1],[-8,7],[-8,8],[-10,15],[1,7],[-2,2],[-8,5],[1,2],[-15,11],[1,2],[-13,9],[-13,9],[-9,7],[-13,9],[-18,12],[-31,22],[-26,18],[-24,17],[-13,9],[-11,8],[-14,10],[-8,5],[-10,7],[-11,7],[-4,3],[-7,5],[-9,5],[-10,6],[0,1],[-38,26],[-2,1],[-3,1],[-2,1],[-3,1],[-28,3],[-2,0],[-2,1],[-2,0],[-2,1],[-9,5],[-1,0],[-1,0],[-1,0],[-1,0],[-1,-1]],[[4518,4249],[-32,-34],[-33,-33],[-33,-33],[-32,-33],[-32,-33],[-13,-13],[-13,-14],[-12,-15],[-12,-15],[-11,-15],[-11,-16],[-10,-16],[-9,-17],[-8,-17],[-8,-18],[-7,-18],[-6,-18],[-6,-18],[-4,-19],[-4,-19],[-3,-19],[-1,-15],[-2,-24],[-1,-24],[0,-15],[1,-56],[5,-39],[3,-22],[18,-115],[4,-22],[8,-30],[7,-32],[8,-39],[8,-40],[8,-36],[9,-39],[4,-19],[3,-19],[3,-19],[2,-19],[1,-20],[1,-20],[1,-46],[1,-19],[2,-18],[4,-34],[4,-39],[5,-39],[2,-21],[-1,-13],[-2,-15],[-6,-18],[-9,-17],[-8,-12],[-9,-11],[-11,-9],[-11,-9],[-18,-14],[-39,-23],[-20,-10],[-40,-18],[-36,-18],[-23,-9],[-35,-14],[-34,-15],[-31,-12],[-27,-12],[-11,-2],[-16,-7],[-15,-10],[-15,-10],[-13,-13],[-12,-14],[-11,-14],[-9,-17],[-8,-16],[-7,-18],[-5,-17],[-4,-19],[-2,-18],[3,-19],[2,-18],[3,-19],[6,-17],[8,-25],[10,-29],[13,-37],[13,-37],[13,-37],[54,-158],[-17,-6],[1,-4],[-6,-4],[-10,-8],[-25,-21],[-26,-22],[-9,-9],[-3,-8],[-1,-1],[-2,0],[-3,1],[-10,1],[-7,-1],[-3,-2],[-8,0],[-2,2],[-3,1],[-7,0],[-2,-1],[-5,1],[-1,0],[-2,0],[-2,1],[-3,0],[-4,0],[-2,-1],[-5,-4],[-3,0],[-4,-1],[-5,1],[-11,-4],[-6,-2],[-5,-2],[-4,-2],[0,1],[-1,0],[-6,7],[-2,3],[-4,3],[-1,1],[-1,2],[-3,4],[-3,1],[-4,2],[-6,3],[-6,2],[-1,0],[-6,2],[-3,2],[-2,0],[-3,0],[-4,3],[-8,2],[-5,1],[-2,1],[-3,-2],[-5,1],[-4,-2],[-3,0],[-3,1],[-2,0],[-3,1],[-9,5],[-3,0],[-3,0],[-4,1],[-4,1],[-4,-1],[-1,1],[-3,-1],[-6,2],[-5,1],[-11,0],[-2,0],[-6,1],[-8,-1],[-10,1],[-6,0],[-7,-1],[-11,-1],[-9,2],[-7,-1],[-4,0],[-4,2],[-5,0],[-4,1],[1,-1],[-31,9],[-10,1],[-13,-1],[-15,-2],[-14,-7],[-16,-14],[-25,-19],[-21,-21],[-22,-15],[-40,-20],[-19,-21],[-8,-13],[-24,-19],[-19,-8],[-7,-8],[-19,-22],[-14,-16],[-13,-14],[-17,-18],[-11,-23],[-12,-12],[-7,-16],[-4,-27],[-10,-21],[-9,-19],[-14,-19],[-13,1],[-4,-20],[3,-19],[-5,-25],[-8,-33],[-9,-36],[-10,-20],[-14,-7],[-1,-31],[10,-34],[2,-24],[4,-24],[-14,-11],[-13,-13]],[[3044,1410],[-3,3],[2,12],[-1,12],[-2,11],[-3,12],[-5,10],[-5,11],[-6,9],[-23,30],[-6,7],[-4,5],[-39,42],[-5,6],[-4,6],[-13,21],[-8,14],[-25,35],[-9,13],[-20,25],[-4,7],[-3,7],[-10,39],[-9,38],[-3,16],[-2,14],[-8,46],[-4,15],[-8,14],[-7,10],[-7,8],[-8,7],[-19,13],[-5,4],[-4,6],[-2,6],[0,7],[-1,24],[1,16],[3,17],[1,5],[3,5],[4,3],[31,20],[6,5],[7,1],[4,12],[2,7],[1,8],[1,13],[2,11],[1,8],[-1,18],[-2,10],[-6,15],[-7,15],[-10,19],[-12,13],[-10,9],[-5,6],[-20,33],[-26,44],[-4,7],[-4,3],[-17,9],[-6,5],[-10,8],[-3,2],[-2,2],[-3,1],[-4,1],[-3,1],[-3,-1],[-3,0],[-2,0],[-2,1],[-2,0],[-2,1],[-2,2],[-2,1],[-1,2],[-2,2],[-2,3],[-1,3],[-1,3],[-1,3],[0,3],[-1,10],[-1,0],[0,4],[-1,4],[-1,3],[-1,3],[-1,3],[-2,3],[-3,5],[-3,4],[-3,3],[-4,4],[-6,4],[-6,5],[-6,4],[-4,2],[-3,2],[-24,12],[-3,1],[-3,1],[-3,1],[-2,1],[1,5],[-6,1],[-34,17],[-43,100],[-1,6],[-6,3],[-28,10],[-10,16],[-6,26],[-11,11],[-6,22],[1,14],[-45,-8],[-5,-1],[-9,7],[-15,20],[-20,26],[-8,15],[-11,17],[-6,6],[-3,4],[-11,10],[1,1],[-9,3],[-10,4],[-5,6],[0,7],[-41,8],[-27,-6],[-7,15],[10,42],[17,37],[-4,8],[-6,18],[-15,23],[-19,9],[-21,23],[-22,16],[-1,7],[-16,11],[0,5],[-12,8],[-12,10],[1,4],[-10,22],[-12,33],[-2,22],[0,19],[3,36],[-1,41],[-6,1],[-3,26],[-10,22],[-2,8],[-8,17],[-15,18],[-24,23]],[[5966,1804],[-615,-475],[-7,-5],[-4,-4],[-39,-27],[-12,-13],[-6,-10],[-4,-4],[-7,-7],[-1,-2],[-8,-9],[-1,-1],[-3,-5],[-7,-11],[-12,-18],[-10,-17],[-3,-7],[-2,-6],[-24,17],[-6,-21],[6,-6],[7,-6],[-5,-7],[-2,-3],[-14,-22],[-12,-18],[-16,-25],[-4,1],[-5,0],[-5,-3],[-4,-5],[-16,-33],[-4,-8],[-5,-8],[-5,-6],[-9,-6],[-21,-12],[-20,-18],[-2,-1],[-5,-5],[-13,-11],[-2,-1],[-8,-6],[-11,-8],[-11,-12],[-7,-8],[-8,-9],[-6,-6],[-6,-6],[1,-6],[0,-6],[0,-5],[0,-8],[-1,-3],[0,-2],[-2,-3],[-1,-2],[-2,-2],[-2,-1],[-2,-2],[-2,-1],[0,-10],[-16,-4],[-6,-2],[-7,-1],[-6,-1],[-8,-2],[-7,-1],[-7,-1],[-6,0],[-8,-1],[-29,-1],[-10,-1],[-10,-1],[-1,0],[-10,-2],[-10,-1],[-7,-2],[-8,-1],[-5,-2],[-10,-3],[-10,-3],[-12,-4],[-11,-4],[-10,-4],[-23,-10],[-8,-4],[-4,-3],[-3,-3],[2,-2],[-6,-9],[-3,-10],[-2,-15],[0,-6],[-4,-32],[-4,-14],[-15,-30],[-9,-20],[-52,-8],[-20,-3],[-1,-21],[-1,-23],[0,-19],[0,-5],[-1,-10],[-15,0],[-10,4],[-14,6],[-3,-1],[-4,0],[-18,-4],[-24,-7],[-5,-29],[-1,-10],[0,-5],[-26,4],[4,-20],[-35,1],[-3,0],[-66,2],[-2,-12],[-6,-27],[-78,29],[-2,-15],[-1,-12],[-1,-16],[-2,-4],[2,0],[1,-8],[1,-7],[-2,-18],[1,-27],[-5,-5],[-5,-15],[-10,-21],[-7,-20],[-16,8],[-22,7],[-24,3],[-39,-1],[1,-36],[-34,-1],[-13,-1],[-15,0],[-26,1],[-26,7],[-6,0],[-5,0],[-23,0],[-19,-5],[-5,-1],[-12,-7],[-3,-2],[-3,-2],[-2,-3],[-4,-5],[-3,-3],[-3,-3],[-12,-8],[-2,-2],[-2,-2],[-2,-2],[-1,-2],[-8,-14],[-2,-3],[-2,-2],[-1,-2],[-2,-1],[-2,-1],[-3,-1],[-3,0],[-21,-1],[-20,-2],[-6,-1],[-4,-1],[-2,0],[-5,-2],[-2,-1],[-4,-2],[-4,0],[-4,1],[-3,1],[-7,-1],[-15,2],[-10,3],[-4,0],[-3,0],[-4,-1],[-7,-4],[-6,-5],[-5,-4],[-5,-3],[-7,-6],[-3,-4],[-4,-5],[-5,-4],[-4,-2],[-4,-1],[-2,0],[-2,1],[-5,1],[-10,2],[-4,0],[-33,7],[-2,1],[-2,0],[-1,1],[-2,1],[-3,2],[-3,1],[-6,1],[-2,-1],[-5,0],[-3,-1],[-3,0],[-3,0],[-4,1],[-4,-3],[-3,0],[-1,-1],[-3,-2],[-3,-2],[-2,-1],[-3,-2],[-2,0],[-4,-1],[-2,-2],[-2,-1],[-12,-11],[-3,-3],[-2,-1],[-6,-9],[-2,-2],[-7,-8],[-9,-7],[-5,-4],[-6,-1],[-2,0],[-6,-2],[-3,-1],[-12,-3],[-13,-3],[-35,-5],[-26,-3],[-12,2],[-2,-16],[-2,-17],[-10,4],[-19,3],[-11,2],[-6,4],[-10,5],[-17,11],[-7,2],[-12,2],[-1,-1],[-14,-14],[0,-1],[-15,-10],[-15,-1],[-18,-8],[-27,-7],[-16,-4],[-16,-5],[-24,-1],[-30,-20],[-16,-24],[-10,-16],[-10,-8],[-11,-8],[-12,-7],[-8,-4],[-12,-10],[-10,-9],[-3,9],[-16,5],[-13,7],[-11,6],[-8,25],[-7,4],[-12,5],[-10,13],[-13,19],[-10,22],[-6,11],[-12,28],[-1,5],[-1,11],[-2,29],[-1,8],[-9,10],[-10,7],[1,6],[1,13],[5,28],[3,33],[-1,13],[-2,25],[0,6],[-1,11],[-2,16],[9,27],[-1,21],[3,15],[1,3],[2,10],[4,50],[1,2],[7,11],[5,10],[10,15],[6,10],[2,13],[1,38],[1,13],[1,8],[10,11],[6,17],[-32,103],[5,17],[-32,41],[-8,26],[5,23],[5,41],[-7,24],[-6,26],[6,25],[12,21],[9,18],[-20,17],[1,19],[7,17],[9,14],[15,16],[19,15],[14,7],[7,13],[2,10],[1,5],[2,6],[4,19],[-5,6],[-11,17],[-8,19],[-8,30],[-2,31],[-4,20],[7,35],[3,39],[7,20],[11,21]],[[6064,7083],[11,27],[1,3],[15,30],[10,15],[11,17],[18,22],[4,3],[7,4],[20,12],[2,10],[0,6],[-3,27],[-2,16],[0,4],[-3,14],[-51,-20],[-21,6],[-6,1],[2,2],[19,24],[1,0],[4,5],[4,5],[3,6],[4,7],[3,7],[0,1],[3,6],[12,29],[10,24],[1,2],[2,5],[2,5],[1,2],[3,4],[2,3],[16,12],[6,4],[3,1],[4,2],[4,2],[4,1],[5,1],[5,1],[5,0],[4,0],[5,0],[4,-1],[7,-1],[2,0],[1,6],[2,12],[1,9],[4,22],[0,1],[0,1],[1,1],[1,1],[1,0],[1,0],[2,7],[-1,0],[-1,1],[-1,1],[0,1],[0,1],[6,42],[-1,12],[-1,12],[0,15],[0,14],[0,12],[-1,8],[0,19],[0,17],[-1,14],[0,11],[-1,10],[-4,3],[0,23],[-2,0],[0,3],[-1,26],[0,7],[-1,48],[0,3],[-2,59],[-1,46],[0,14],[-2,62],[-1,59],[0,7],[-1,32],[0,7],[-1,19],[-1,3],[25,1],[-1,3],[-12,0],[3,2],[9,110],[0,5],[3,0],[3,2],[3,0],[13,1],[12,1],[-1,15],[2,0],[11,2],[11,1],[11,2],[12,3],[12,3],[11,3],[9,3],[8,3],[9,3],[10,4],[9,4],[10,5],[11,6],[11,6],[11,7],[23,15],[5,3],[27,18]],[[6492,8341],[2,-4],[44,16],[17,6],[60,21],[15,5],[3,1],[29,10],[11,3],[17,-6],[3,0],[8,0],[24,18],[12,11],[14,20],[2,5],[1,4],[4,9],[1,3],[1,1],[3,6],[5,14],[3,5],[4,15],[4,13],[4,25],[3,0],[2,7],[3,10],[4,11],[9,21],[16,14],[21,3],[11,-5],[2,17],[-15,25],[4,8],[40,-5],[3,-2],[1,4],[6,-3],[5,-2],[5,-2],[4,-1],[4,-1],[59,-8],[8,-2],[9,-2],[5,-2],[5,-2],[4,-1],[2,3],[3,6],[29,21],[7,10],[7,8],[9,15],[21,28],[3,6],[6,-196],[-6,0],[-1,0],[-1,-11],[-1,-3],[-5,-10],[-1,-3],[-1,-11],[-1,-6],[-3,-7],[0,-4],[0,-5],[1,-6],[1,-6],[1,-7],[1,-6],[2,-11],[1,-4],[0,-4],[1,-14],[0,-7],[-1,-6],[-1,-15],[0,-12],[0,-6],[1,-11],[-1,-12],[1,-5],[5,-12],[2,-4],[3,-10],[0,-3],[1,-75],[6,0],[1,-3],[-1,0],[0,-1],[-1,0],[0,-1],[0,-1],[0,-1],[2,-7],[1,-16],[0,-9],[0,-8],[-2,-23],[0,-4],[-1,-4],[0,-22],[0,-2],[-8,-19],[-1,-2],[-14,-26],[-6,-11],[-14,-18],[-16,-17],[-10,-9],[-1,-2],[0,-2],[0,-2],[0,-3],[1,-4],[2,-8],[5,-16],[12,-15],[3,-4],[14,-6],[86,-31],[123,-44],[155,-55],[173,-62],[77,-27],[52,-19],[149,-52],[19,-7],[50,-35],[18,-1],[23,-11],[14,-2],[42,-1],[46,-10],[14,-3],[41,-9],[37,-9],[195,-46],[16,-7],[10,-8],[14,-3],[-3,-27],[-4,1],[-44,7],[-17,3],[-12,-32],[-2,-5],[-19,-49],[1,-5],[-11,-27],[-1,-3],[-4,-9],[-7,-19],[-2,-6],[0,-1],[-29,-75],[-36,-91],[-7,-19],[1,0],[136,-59],[-40,-103],[-26,-67],[-14,-36],[23,-10],[22,-10],[7,-3],[60,-25],[26,-11],[2,-6],[-8,-17],[-11,-20],[-6,-12],[-8,-19],[-3,-9],[-6,-20],[-5,-16],[-3,-13],[-1,-8],[0,-8],[0,-12],[0,-4],[-6,-11],[-2,-3],[0,-1],[-69,42],[-27,16],[-14,-24],[-15,-24],[-5,-9],[-3,2],[-4,-7],[-8,-12],[-5,-6],[-5,-3],[-7,-3],[-8,5],[-17,12],[-20,18],[-27,32],[-20,-9],[-14,17],[-58,-29],[-35,-18],[-15,-10],[-68,-46],[-1,0],[-3,-2],[14,-27],[9,-15],[14,-20],[6,-6],[2,-2],[5,-4],[13,-7],[19,-8],[7,-1],[5,1],[-2,-2],[-6,-9],[-25,-28],[-4,-4],[-20,-21],[-18,-20],[-25,-27],[-2,-2],[-7,-6],[-3,-3],[-20,-13],[-5,-2],[-2,-21],[-36,1],[-6,-2],[-4,-1],[-27,-13],[1,-2],[-25,-12],[-5,-4],[-14,-10],[-21,-16],[-13,-11],[-12,-9],[-7,-5],[-4,-5],[-3,-5],[-4,-10],[-2,-4],[-7,-16],[-4,-24],[-1,-8],[-2,-12],[-1,-10],[-12,-40],[-5,-34],[-10,-30],[-5,-16],[-1,-3],[-1,-3],[-2,-3],[-2,-4],[-15,-32],[0,-1],[2,-13],[2,-13],[0,-3],[1,-17],[1,-18]],[[4444,7589],[-8,-5],[-1,-1],[-15,-6],[-5,-2],[-14,-6],[-16,-7],[-5,-2],[-17,-7],[-3,-1],[-17,-7],[-1,-1],[-3,19],[15,4],[-3,11],[-5,15],[-5,13],[-4,13],[-1,2],[-20,42],[-3,-3],[-26,28],[-14,13],[-16,16],[-19,19],[-18,19],[-14,15],[-7,4],[-1,1],[-17,9],[-34,18],[-37,19],[-34,18],[-33,18],[-34,18],[-32,17],[-32,17],[-19,10],[3,6],[-14,2],[-31,0],[-18,0],[-23,0],[-12,0],[-12,0],[-15,-1],[-19,-4],[-19,-12],[-25,17],[-31,20],[-34,-5],[-33,19],[-21,12],[-6,9],[0,1],[-8,-1],[-9,0],[-52,1],[0,13],[-64,1],[-15,1],[-136,2],[-13,1],[-34,33],[-13,-6],[-2,42],[-1,1],[-1,0],[-1,0],[-1,0],[-1,0],[-14,-5],[-34,-10],[-3,3],[-38,37],[-38,37],[-33,32],[-5,-11],[-3,-6],[-2,-3],[-2,-4],[-1,-1],[4,-11],[-15,-8],[-27,-25],[-2,-2],[-1,2],[-2,2],[-1,-1],[-3,-2],[-5,-2],[-14,-8],[-10,28],[-9,25],[-1,5],[-9,44],[-3,26],[9,30],[-22,62],[-12,15],[-2,2],[-19,25],[-24,21],[-41,28],[-35,24],[-1,0],[-33,19],[-1,1],[-27,12],[-33,17],[-24,17],[-15,15],[-2,2],[-8,9],[-22,23],[-16,17],[-16,18],[-14,23],[-1,2],[-12,21],[-17,17],[-7,7],[2,17],[5,18],[3,6],[2,4],[-3,1],[-11,5],[-11,5],[-4,2],[-6,2],[-6,2],[-6,3],[-6,2],[-6,1],[-10,0],[-3,1],[-18,5],[-9,3],[-19,6],[-2,0],[-18,7],[-17,3],[-9,3],[1,16],[0,11],[-4,4],[1,9],[-11,4],[-27,14],[-33,14],[-30,9],[-43,14],[-25,14],[-13,7],[-15,9],[4,32]],[[2252,8893],[1,9],[1,2],[6,11],[1,3],[6,14],[16,22],[1,0],[42,-17],[48,-18],[3,3],[1,1],[2,7],[26,78],[2,4],[1,4],[1,3],[12,36],[1,3],[-4,4],[-23,17],[-3,2],[-12,9],[-4,3],[-7,5],[3,48],[-1,17],[-1,12],[0,6],[0,1],[1,1],[10,3],[0,3],[-3,19],[-1,5],[-2,9],[-3,2],[-43,18],[-17,7],[-18,4],[-23,10],[-1,5],[-8,4],[-26,10],[-13,7],[-31,16],[-21,8],[-31,23],[-21,3],[-6,1],[-15,12],[-24,51],[-7,22],[4,22],[-1,10],[-5,23],[-13,18],[-3,2],[2,3],[-3,4],[1,5],[1,8],[1,12],[1,12],[2,20],[0,1],[-1,8],[7,10],[13,18],[2,4],[4,4],[2,3],[2,3],[3,4],[7,8],[1,3],[9,12],[4,4],[1,3],[4,5],[1,2],[16,25],[553,156],[3,1],[259,139],[34,13],[39,4],[20,1],[4,2],[5,2],[74,-48],[15,-9],[14,-7],[13,-4],[128,-60],[201,-94],[10,-6],[7,-5],[5,-4],[-5,-2],[6,-6],[1,0],[1,0],[0,-1],[1,0],[0,-1],[54,-52],[5,-4],[4,-3],[5,-3],[6,-3],[38,-17],[5,-2],[4,-1],[4,-1],[5,-1],[5,0],[4,0],[5,1],[4,0],[5,2],[5,1],[5,2],[5,2],[92,42],[13,6],[14,7],[13,7],[13,8],[1,1],[1,0],[1,0],[1,-1],[1,0],[1,0],[1,-1],[0,-1],[1,-1],[9,4],[5,-12],[2,-4],[2,-3],[3,-3],[3,-3],[2,0],[1,0],[1,-1],[2,1],[1,0],[1,0],[4,2],[1,-1],[1,-12],[9,4],[9,5],[19,11],[14,7],[10,6],[3,1],[4,2],[4,2],[5,2],[4,1],[25,7],[2,1],[1,0],[1,0],[2,-1],[57,-19],[15,-2],[62,-8],[140,-19],[55,-7],[0,3],[47,155],[2,8],[8,-2],[8,-2],[7,-3],[57,-21],[43,-15],[-1,-1],[13,-4],[63,-23],[7,-3],[7,-2],[42,-14],[9,-3],[8,-2],[-2,3],[12,40],[1,2],[0,2],[1,1],[2,1],[1,1],[2,1],[1,0],[2,1],[2,0],[1,-1],[51,-13],[22,-6],[25,-6],[10,-3],[18,-4],[3,-1],[2,0],[3,0],[3,1],[2,1],[3,2],[24,16],[4,1],[13,-7],[9,-7],[3,-4],[13,-16],[15,-11],[30,-11],[23,-3],[2,0],[4,0],[6,0],[-1,4],[14,-2],[12,-4],[2,-1],[21,-14],[19,-12],[8,-5],[14,-5],[23,-2],[59,-6],[38,-3],[4,0],[2,-1],[2,0],[3,-1],[2,-1],[10,-5],[9,-7],[6,61],[7,6],[81,-16],[10,-3],[26,-4],[2,-1],[24,-5],[2,0],[5,-1],[3,-1],[33,-7],[-2,5],[-17,50],[-8,24],[-17,49],[16,-6],[-2,5],[45,-19],[35,-14],[4,10],[18,-10],[13,-7],[13,-9],[13,-8],[13,-8],[13,-6],[38,-18],[14,-5],[60,-24],[11,-4],[11,-4],[12,-3],[11,-3],[61,-9],[7,-4],[2,5],[11,-5],[20,-11],[10,-5],[9,-1],[10,3],[12,2],[35,-4],[5,-1],[23,-5],[15,-3],[32,-2],[12,-1],[43,-12],[43,-8],[16,-1],[1,-3],[1,-5],[4,-23],[3,-18],[1,-4],[1,-4],[3,-18],[3,-14],[0,-4],[2,-11],[2,-11],[5,-27],[7,-34],[5,-32],[1,-3],[3,-19],[11,-40],[12,-46],[19,-71],[5,2],[-1,-5],[3,0],[5,-11],[27,-36],[3,-3],[3,-3],[11,-5],[-4,-5],[-44,-50],[21,-16],[-26,-42],[19,-13],[-2,-3],[-25,-41],[-22,-38],[-23,-39],[-6,-10],[-43,-72],[-11,-19],[-12,-18],[-7,-12],[0,-1],[-10,-17],[-9,-15],[-1,-2],[362,-223],[11,-7],[7,2],[20,8],[2,-7],[5,-14],[2,-5],[0,-2],[27,-77],[23,-67],[27,10],[1,-3],[4,-10],[17,-52]],[[1699,7309],[2,31],[-1,0],[0,2],[0,2],[-1,19],[-1,21],[0,2],[0,1],[0,2],[1,7],[2,18],[-6,1],[-5,2],[-6,0],[-3,1],[-17,2],[-9,1],[1,15],[-2,3],[0,20],[0,5],[-1,5],[-1,4],[-1,5],[-2,4],[0,1],[-2,3],[-2,5],[-8,20],[0,76],[0,25],[0,25],[4,17],[8,30],[0,5],[0,2],[0,4],[0,5],[-1,28],[1,14],[-1,17],[2,10],[-14,18],[-32,11],[-7,3],[-51,17],[4,18],[2,9],[7,27],[0,2],[0,2],[9,35],[12,-5],[6,10],[4,10],[3,7],[6,-2],[7,-1],[8,-1],[1,5],[4,19],[5,18],[11,17],[13,25],[-20,8],[-24,12],[-17,6],[-19,6],[-15,4],[-38,6],[-2,0],[-3,0],[-3,0],[-14,-4],[-20,-9],[-12,-4],[-12,-9],[-8,-5],[-5,-11],[-26,-42],[-7,-42],[-8,-20],[-4,-14],[-12,3],[-29,10],[-22,8],[-31,10],[4,16],[2,21],[-11,20],[-4,7],[-18,-5],[-5,-2],[-1,8],[-3,71],[-4,3],[-15,-3],[-35,-11],[-37,-11],[-1,4],[-16,35],[-18,39],[-7,15],[0,1],[-1,2],[1,0],[2,2],[3,5],[2,0],[2,2],[0,3],[2,4],[5,2],[4,3],[1,0],[5,-1],[3,2],[5,3],[2,4],[-2,4],[1,6],[-1,3],[3,4],[-2,7],[-2,1],[-2,0],[0,3],[0,3],[-1,2],[1,2],[2,2],[1,3],[4,2],[0,2],[2,2],[2,1],[0,1],[1,4],[1,0],[1,1],[0,3],[4,2],[2,2],[2,6],[1,1],[4,4],[1,2],[0,2],[3,1],[2,2],[1,3],[1,0],[3,4],[2,2],[-1,0],[3,3],[3,2],[1,2],[4,1],[1,3],[1,2],[2,1],[1,1],[2,3],[1,2],[2,6],[2,4],[0,3],[1,1],[1,5],[2,4],[3,7],[1,1],[2,4],[1,1],[1,3],[6,8],[1,3],[2,3],[0,3],[2,3],[-1,1],[-5,5],[-13,13],[-10,12],[-7,13],[-1,3],[-16,33],[0,38],[27,52],[9,1],[52,4],[50,4],[61,34],[53,29],[21,12],[20,11],[11,6],[11,6],[5,3],[5,3],[7,4],[10,5],[10,6],[2,1],[7,3],[11,7],[13,8],[23,15],[7,4],[12,8],[14,9],[14,11],[-4,15],[-15,21],[10,31],[8,27],[10,30],[13,43],[6,20],[7,20],[33,-19],[30,-15],[15,-34],[9,-17],[19,23],[13,2],[12,-1],[39,-5],[17,-1],[9,0],[3,4],[-2,2],[2,13],[3,17],[7,39],[4,21],[5,49],[4,-1],[23,-8],[25,-11],[13,-7],[5,-3],[-2,-17],[0,-3],[1,-18],[18,-8],[16,-7],[24,-10],[25,-7],[15,-5],[23,-7],[33,-9],[24,-6],[18,2],[10,6],[5,12],[1,2],[8,5],[24,4],[15,5],[17,5],[8,-1]],[[5349,1334],[-24,35],[-3,32],[-15,19],[-12,4],[3,-18],[-5,-9],[-10,-2],[-7,10],[11,20],[-42,37],[-40,-9],[-16,1],[-5,7],[2,7],[24,11],[1,5],[-16,47],[-6,4],[-25,-11],[-2,10],[26,16],[2,7],[18,5],[12,15],[8,17],[-4,17],[-16,-5],[-15,-38],[-27,10],[-14,63],[-43,135],[8,33],[-38,-9],[-8,25],[-19,-4],[-48,116],[-4,14],[5,6],[24,14],[-18,124],[0,9],[9,5],[-24,88],[-31,-3],[34,15],[-2,5],[-20,21],[-23,-5],[-4,5],[2,6],[20,5],[-13,50],[6,9],[-7,26],[45,7],[1,7],[-2,9],[-82,-11],[-3,4],[-19,141],[51,9],[22,19],[-7,30],[-17,18],[-9,26],[10,69],[1,173],[9,95],[-7,126],[23,19],[20,61],[6,107],[-14,1],[2,16],[-10,0],[-16,16],[-8,81],[25,10],[5,27],[43,1],[-1,19],[-53,-5],[-5,4],[-10,171],[26,2],[-1,6],[-26,2],[50,87],[9,6],[11,49],[8,11],[-18,33],[0,28],[17,29],[44,44],[102,78],[-7,19],[21,15],[3,-5],[24,4],[6,3],[0,10],[7,1],[20,-3],[10,11],[19,4],[0,9],[21,4],[16,30],[91,23],[12,-12],[11,-28],[-5,-5],[24,-55],[-5,-3],[9,-19],[-6,-6],[2,-6],[11,2],[82,-222],[7,-5],[41,-91],[4,-136],[-11,-133],[3,-68],[5,-7],[26,6],[49,-104],[9,1],[14,-24],[10,-61],[22,-16],[16,-23],[39,-78],[3,-20],[-21,-41],[-2,-28],[8,-10],[26,14],[17,-2],[-14,-16],[-22,-3],[3,-13],[-7,-6],[7,-13],[17,4],[14,-16],[38,3],[9,-8],[29,3],[92,-10],[37,-14],[20,9],[27,-5],[13,-12],[31,-6],[86,-56],[20,12],[33,-9],[48,-53],[54,-83],[14,-51],[0,-36],[24,-24],[19,13],[9,-5],[-33,-35],[23,-35],[12,8],[8,-11],[-18,-5],[24,-64],[30,15],[10,-9],[-29,-15],[2,-16],[38,-52],[1,-8],[25,-25],[13,8],[28,4],[7,-9],[8,-4],[22,-31],[19,-33],[32,-94],[33,-76],[2,-18],[18,-38],[2,-38],[3,-23],[4,-59],[8,-70],[11,-76],[10,-34],[7,-27],[8,-20],[10,3],[14,-37],[4,-12],[-1069,-1082],[-13,26],[-53,167],[-23,54],[11,6],[-14,74],[9,9],[-16,36],[-17,-8],[-10,5],[-24,45],[8,7],[-6,13],[10,7],[-2,6],[-9,-6],[0,-1],[-13,-7],[-25,46],[24,19],[-43,86],[-13,-6],[-15,-1],[-16,29],[3,10],[21,12],[11,-10],[1,1],[-12,13],[-15,-9],[-38,55],[-14,-10],[-35,68],[-11,96],[-8,10],[-3,4]]],"transform":{"scale":[0.00001774567834584659,0.0000114459843644562],"translate":[8.44801379462696,47.3202184380549]}};

});