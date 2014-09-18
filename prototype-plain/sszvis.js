;(function(global, d3) {
  "use strict";

  /**
   * The root of the sszvis library
   *
   * @namespace
   * @module sszvis
   */
  var exports = global.sszvis = {
    version: "0.1.0"
  };


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
  exports.bounds = function(bounds) {
    var height  = fn.either(bounds.height, 100);
    var width   = fn.either(bounds.width, 100);
    var padding = {
      top:    fn.either(bounds.top, 0),
      right:  fn.either(bounds.right, 0),
      bottom: fn.either(bounds.bottom, 0),
      left:   fn.either(bounds.left, 0)
    }

    return {
      innerHeight: height - padding.top  - padding.bottom,
      innerWidth:  width  - padding.left - padding.right,
      padding:     padding,
      height:      height,
      width:       width,
    }
  }


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
  exports.createChart = function(selector, bounds) {
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


  /**
   * A collection of functional helper functions
   *
   * @module sszvis/fn
   */
  var fn = exports.fn = (function() {
    return {
      either: function(val, fallback) {
        return (typeof val === "undefined") ? fallback : val;
      },

      identity: function(value) {
        return value;
      },

      partial: function(func, var_args) {
        var argsArr = Array.prototype.slice.call(arguments, 1);
        return function(){
          return func.apply(this, argsArr.concat(Array.prototype.slice.call(arguments)));
        };
      },

      prop: function(key) {
        return function(object) {
          return object[key];
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
      }
    }
  }());


  /**
   * Formatting functions
   *
   * @module sszvis/format
   */
  var format = exports.format = (function() {
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
      }
    }
  }());


  /**
   * Parsing functions
   *
   * @module sszvis/parse
   */
  var parse = exports.parse = (function() {
    return {
      /**
       * Parse Swiss date strings
       * @param  {String} d A Swiss date string, e.g. 17.08.2014
       * @return {Date}
       */
      date: function(d) {
        return d3.time.format("%d.%m.%Y").parse(d);
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
  }());


  /**
   * Axis component based on the d3.axis interface
   *
   * @see https://github.com/mbostock/d3/wiki/SVG-Axes
   * @module sszvis/axis
   */
  exports.axis = (function() {

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
        .prop('scale').scale(axisDelegate.scale())
        .prop('orient').orient(axisDelegate.orient())
        .prop('ticks').ticks(axisDelegate.ticks())
        .prop('tickValues').tickValues(axisDelegate.tickValues())
        .prop('tickSize', function(inner, outer) {
          if (!arguments.length) return this.innerTickSize();
          this.innerTickSize(inner);
          this.outerTickSize(outer);
          return inner;
        })
        .prop('innerTickSize').innerTickSize(axisDelegate.innerTickSize())
        .prop('outerTickSize').outerTickSize(axisDelegate.outerTickSize())
        .prop('tickPadding').tickPadding(axisDelegate.tickPadding())
        .prop('tickFormat').tickFormat(axisDelegate.tickFormat())
        .render(function() {
          var selection = d3.select(this);
          var props = selection.props();

          axisDelegate
            .scale(props.scale)
            .orient(props.orient)
            .ticks(props.ticks)
            .tickValues(props.tickValues)
            .innerTickSize(props.innerTickSize)
            .outerTickSize(props.outerTickSize)
            .tickPadding(props.tickPadding)
            .tickFormat(props.tickFormat)

          selection.selectGroup('sszvis-Axis-Wrapper')
            .attr('transform', 'translate(0, 2)')
            .call(axisDelegate)
        });
    }

    var axis_x = function() {
      return axis()
        .ticks(3)
        .tickSize(4, 7)
        .tickPadding(7)
        .tickFormat(exports.format.number)
    };

    axis_x.time = function() {
      return axis_x().tickFormat(axisTimeFormat);
    }

    axis_x.ordinal = function() {
      return axis_x().tickFormat(exports.format.text);
    }

    var axis_y = function() {
      return axis()
        .ticks(7)
        .tickSize(0, 0)
        .tickPadding(0)
        .tickFormat(function(d) {
          return 0 === d ? null : exports.format.number(d);
        });
    }

    axis_y.time = function() {
      return axis_y().tickFormat(axisTimeFormat);
    }

    return {
      x: axis_x,
      y: axis_y
    }

  }());


  /**
   * Ready-made components
   *
   * @module sszvis/component
   */
  var component = exports.component = (function(module) {

    /**
     * Line component
     * @return {d3.component}
     */
    module.line = function() {
      return d3.component()
        .prop('x')
        .prop('y')
        .prop('xScale')
        .prop('yScale')
        .render(function(data) {
          var selection = d3.select(this);
          var props = selection.props();

          var line = d3.svg.line()
            .defined(function(d) { return !isNaN(props.y(d)); })
            .x(function(d) { return props.xScale(props.x(d)); })
            .y(function(d) { return props.yScale(props.y(d)); })

          var path = selection.selectAll('path')
            .data(data)

          path.enter()
            .append('path')
            .attr("class", "sszvis-Line")

          path
            .attr("d", line);

        });
    }

    module.bar = function() {
      return d3.component()
        .prop('x')
        .prop('y')
        .prop('width')
        .prop('height')
        .render(function(data) {
          var selection = d3.select(this);
          var props = selection.props();

          var bars = selection.selectAll('rect')
            .data(data);

          bars.enter()
            .append('rect')
            .attr('class', 'sszvis-Bar');

          bars
            .attr('x', props.x)
            .attr('y', props.y)
            .attr('width', props.width)
            .attr('height', props.height)
            .attr('data-test', function(d) {
              console.log(d);
              return d.category;
            });
        });
    }

    return module;
  }({}));

}(window, d3));
