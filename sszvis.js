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
      if (depth >= keys.length) return (valuesSort ? data.sort(valuesSort) : data);

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

  module.exports.values = {
    basicBlue: "#6392C5",
    basicDeepBlue: "#3A75B2"
  };

  module.exports.ranges = {
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
          "497f7b",
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

});


//////////////////////////////////// SECTION ///////////////////////////////////


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

    return {

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
      leftPaddedRange: function(domainLength, range, innerPaddingRatio, leftPadding, maxRangeBand, maxInnerPadding) {
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
      }
    };

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
    }

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

      return d3.component()
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
    }

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
    }

    // TODO: create an ordinal axis that doesn't have to show every label
    axis_x.ordinal = function() {
      return axis_x().tickFormat(format.text);
    }

    var axis_y = function() {
      return axis()
        .ticks(7)
        .tickSize(0, 0)
        .tickPadding(0)
        .tickFormat(function(d) {
          return 0 === d ? null : format.number(d);
        })
        .vertical(true);
    }

    axis_y.time = function() {
      return axis_y().tickFormat(axisTimeFormat);
    }

    axis_y.ordinal = function() {
      return axis_y().tickFormat(format.text);
    }

    return {
      x: axis_x,
      y: axis_y
    }

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
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Legend component
 *
 * @module sszvis/legend
 */
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


namespace('sszvis.createHtmlLayer', function(module) {

  module.exports = function(selector, bounds) {
    var root = d3.select(selector);
    var layer = root.selectAll('div').data([0]);
    layer.enter().append('div');

    layer.style({
      position: 'absolute',
      left: bounds.padding.left + 'px',
      top: bounds.padding.top + 'px'
    });

    return layer;
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


namespace('sszvis.behavior.mouseover', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('mouseover').mouseover(sszvis.fn.identity)
      .prop('mouseout').mouseout(sszvis.fn.identity)
      .render(function() {
        var selection = d3.select(this),
            props = selection.props();

        selection
          .on('mouseover', props.mouseover)
          .on('mouseout', props.mouseout);
      });
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Move behavior
 * @return {d3.component}
 */
namespace('sszvis.behavior.move', function(module) {

  module.exports = function() {
    var event = d3.dispatch('start', 'move', 'end');

    var moveComponent = d3.component()
      .prop('xScale')
      .prop('yScale')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var xExtent = props.xScale.range();
        var yExtent = props.yScale.range().sort();

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
          });
      });

    d3.rebind(moveComponent, event, 'on');

    return moveComponent;
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Segmented Control for switching top-level filter values
 *
 * @module sszvis/control/segmented
 */
namespace('sszvis.control.segmented', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('values')
      .prop('current')
      .prop('width')
      .prop('change').change(sszvis.fn.identity)
      .render(function() {
        var selection = d3.select(this);
        var props = selection.props();

        var buttonWidth = props.width / props.values.length,
            buttonHeight = 20;

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
 * Bar component
 * @return {d3.component}
 */
namespace('sszvis.component.bar', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('width')
      .prop('height')
      .prop('fill')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var bars = selection.selectAll('rect.sszvis-bar')
          .data(data);

        bars.enter()
          .append('rect')
          .attr('class', 'sszvis-bar');

        bars.exit().remove();

        bars
          .attr('fill', props.fill)
          .attr('stroke', props.stroke);

        bars
          .transition()
          .call(sszvis.transition)
          .attr('x', props.x)
          .attr('y', props.y)
          .attr('width', props.width)
          .attr('height', props.height);
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
          .classed('sszvis-bar', true);

        bars.exit().remove();

        bars
          .attr('x', function(d, i) {
            // first term is the x-position of the group, the second term is the x-position of the bar within the group
            return props.groupScale(d) + inGroupScale(i);
          })
          .attr('width', inGroupScale.rangeBand())
          .attr('y', props.y)
          .attr('height', props.height)
          .attr('fill', props.fill);
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

    var fn = sszvis.fn;

    return d3.component()
      .prop('x')
      .prop('y')
      .prop('xScale')
      .prop('yScale')
      .prop('stroke')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var line = d3.svg.line()
          .defined(fn.compose(fn.not(isNaN), props.y))
          .x(fn.compose(props.xScale, props.x))
          .y(fn.compose(props.yScale, props.y))

        var path = selection.selectAll('path.sszvis-line')
          .data(data)

        path.enter()
          .append('path')
          .classed("sszvis-line", true)

        path.exit().remove();

        path
          .attr("d", line)
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
 * Ruler component
 * @return {d3.component}
 */
namespace('sszvis.component.ruler', function(module) {

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
        }

        var maxDatum = d3.max(data, fn.compose(props.xScale, props.x));

        var x = fn.compose(props.xScale, props.x);
        var y = fn.compose(props.yScale, props.y);
        var top = d3.min(props.yScale.range());
        var bottom = d3.max(props.yScale.range());

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
          .text(props.label)

        label.exit().remove();

      });
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('x')
      .prop('y')
      .prop('header').header('')
      .prop('body').body('')
      .prop('visible')
      .prop('orientation')
      .prop('tipsize').tipsize(10)
      .prop('style', function(s) { return s || {} })
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(data);

        tooltip.exit().remove();

        tooltip.style({
          left: function(d) { return props.x(d) + 'px' },
          top: function(d) { return props.y(d) + 'px' }
        });

        var enterTooltip = tooltip.enter()
          .append('div')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true)
          .style(props.style);

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

        var enterTip = enterTipholder.append('div')
          .classed('sszvis-tooltip-tip', true)
          .classed('tip-top', props.orientation === 'top')
          .classed('tip-bot', props.orientation === 'bottom')
          .classed('tip-left', props.orientation === 'left')
          .classed('tip-right', props.orientation === 'right');

        tooltip.selectAll('.sszvis-tooltip-header')
          .data(data)
          .html(props.header);

        tooltip.selectAll('.sszvis-tooltip-body')
          .data(data)
          .html(props.body);

        selection.selectAll('.sszvis-tooltip')
          .each(function(d) {
            var d3this = d3.select(this),
                width = this.offsetWidth,
                height = this.offsetHeight,
                x = props.x(d),
                y = props.y(d);

            d3this.style({
              left: x - width / 2 + 'px',
              top: y - height - props.tipsize + 'px'
            });
          });
      });
   };

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Tooltip component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.tooltip2', function(module) {

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
  }


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
        var data = tooltipData.map(fn.prop('datum'));
        var props = selection.props();

        var tooltip = selection.selectAll('.sszvis-tooltip')
          .data(tooltipData)

        tooltip.exit().remove();

        var enterTooltip = tooltip.enter()
          .append('div')
          .style('pointer-events', 'none')
          .classed('sszvis-tooltip', true);

        var enterBox = enterTooltip.append('div')
          .classed('sszvis-tooltip-box', true)

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

        var enterTip = enterTipholder.append('div')
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

        anchor.enter()
          .append('g')
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

  function translate(position) {
    return 'translate('+ position[0] +','+ position[1] +')';
  }

});


//////////////////////////////////// SECTION ///////////////////////////////////


/**
 * Stacked Chart
 * @return {d3.component}
 */
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
          .classed('sszvis-path', true);

        paths.exit().remove();

        paths
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
          .classed('sszvis-path', true);

        segments.exit().remove();

        segments
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
 * Pyramid Component
 *
 * @return {d3.component}
 */
namespace('sszvis.component.pyramid', function(module) {

  module.exports = function() {
    return d3.component()
      .prop('width')
      .prop('height')
      .prop('groupPadding')
      .prop('alignmentValue')
      .prop('barWidth')
      .prop('extentValue')
      .prop('fill')
      .prop('direction') // links, rechts
      .prop('renderMode').renderMode('bar') // bar, stacked, line
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var rendered;
        if (props.renderMode === 'bar') {
          rendered = selection.selectAll('rect.sszvis-bar')
            .data(data);

          rendered.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          rendered.exit().remove();

          rendered
            .attr('x', props.alignmentValue)
            .attr('y', 0)
            .attr('width', props.barWidth)
            .attr('height', props.extentValue)
            .attr('fill', props.fill);
        } else if (props.renderMode === 'stacked') {
          var stackLayout = d3.layout.stack()
            .x(props.alignmentValue)
            .y(props.extentValue);

          rendered = selection.selectAll('g.sszvis-g')
            .data(stackLayout(data));

          rendered.enter()
            .append('g')
            .classed('sszvis-g', true);

          rendered.exit().remove();

          var bars = rendered.selectAll('rect.sszvis-bar')
            .data(function(d) { return d; });

          bars.enter()
            .append('rect')
            .classed('sszvis-bar', true);

          bars.exit().remove();

          bars
            .attr('x', props.alignmentValue)
            .attr('y', function(d) { return d.y0; })
            .attr('width', props.barWidth)
            .attr('height', function(d) { return d.y; })
            .attr('fill', props.fill);
        } else if (props.renderMode === 'line') {
          var lineGen = d3.svg.line()
            .x(props.alignmentValue)
            .y(props.extentValue);

          rendered = selection.selectAll('path.sszvis-path')
            .data([data]);

          rendered.enter()
            .append('path')
            .classed('sszvis-path', true);

          rendered.exit().remove();

          rendered
            .attr('d', lineGen)
            .attr('fill', 'none')
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3 3');
        }

        if (props.direction === 'left') {
          // 90deg rotation plus +width
          rendered.attr('transform', 'matrix(0, 1, -1, 0, ' + (props.width - props.groupPadding) + ', 0)');
        } else if (props.direction === 'right') {
          // reflection around y = x plus +width
          rendered.attr('transform', 'matrix(0, 1, 1, 0, ' + (props.width + props.groupPadding) + ', 0)');
        }

      });
  };

});