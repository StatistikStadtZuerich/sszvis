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

  exports.colorRanges = {
    qualitative:
    [ "#b8cfe6"
    , "#5182b3"
    , "#e6b7c7"
    , "#cc6788"
    , "#f2cec2"
    , "#e67d73"
    , "#faebaf"
    , "#e6cf73"
    , "#cfe6b8"
    , "#94bf69"
    , "#b8e6d2"
    , "#60bf97"
    ]
  };


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
    var slice = function(list) {
      var slice = Array.prototype.slice;
      return slice.apply(list, slice.call(arguments, 1));
    }

    return {
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

      find: function(predicate, list) {
        var idx = -1;
        var len = list.length;
        while (++idx < len) {
          if (predicate(list[idx])) return list[idx];
        }
      },

      either: function(val, fallback) {
        return (typeof val === "undefined") ? fallback : val;
      },

      identity: function(value) {
        return value;
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

      last: function(arr) {
        return arr[arr.length - 1];
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
        .prop('vertical').vertical(false)
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

          selection.selectGroup('sszvis-axis-wrapper')
            .classed('sszvis-axis', true)
            .classed('sszvis-axis--horizontal', !props.vertical)
            .classed('sszvis-axis--vertical', props.vertical)
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
        })
        .vertical(true);
    }

    axis_y.time = function() {
      return axis_y().tickFormat(axisTimeFormat);
    }

    axis_y.ordinal = function() {
      return axis_y().tickFormat(exports.format.text);
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

    module.interactiveLayer = function() {
      return d3.component()
        .prop('x')
        .prop('y')
        .prop('width')
        .prop('height')
        .prop('mousemove').mousemove(fn.identity)
        .prop('mouseout').mouseout(fn.identity)
        .render(function(data) {
          var selection = d3.select(this);
          var props = selection.props();

          var layer = selection.selectAll('.sszvis-InteractiveLayer')
            .data([0]);

          layer.enter()
            .append('rect')
            .attr('class', 'sszvis-InteractiveLayer');

          layer
            .attr('x', props.x).attr('width',  props.width)
            .attr('y', props.y).attr('height', props.height)
            .attr('fill', 'transparent')
            .on('mousemove', function() {
              var xy = d3.mouse(this), x = xy[0], y = xy[1];
              props.mousemove(x, y);
            })
            .on('mouseout', props.mouseout);
        });
    }

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
            .defined(fn.compose(fn.not(isNaN), props.y))
            .x(fn.compose(props.xScale, props.x))
            .y(fn.compose(props.yScale, props.y))

          var path = selection.selectAll('.sszvis-line')
            .data(data)

          path.enter()
            .append('path')
            .classed("sszvis-line", true)

          path
            .attr("d", line);

        });
    }

    /**
     * Bar component
     * @return {d3.component}
     */
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
            .attr('class', 'sszvis-bar');

          bars
            .attr('x', props.x)
            .attr('y', props.y)
            .attr('width', props.width)
            .attr('height', props.height);
        });
    }


    /**
     * Vertical Ruler component
     * @return {d3.component}
     */
    module.verticalRuler = function() {
      return d3.component()
        .prop('x').x(fn.identity)
        .prop('y').y(fn.identity)
        .prop('xScale')
        .prop('yScale')
        .render(function(data) {
          var selection = d3.select(this);
          var props = selection.props();

          var maxDatum = d3.max(data.map(fn.compose(props.xScale, props.x)));

          var x = fn.compose(props.xScale, props.x);
          var y = fn.compose(props.yScale, props.y);
          var baseline = d3.max(props.yScale.range());

          var ruler = selection.selectAll('.sszvis-verticalRuler-ruler')
            .data(data);

          ruler.enter()
            .append('line')
            .classed('sszvis-verticalRuler-ruler', true);

          ruler
            .attr('x1', x)
            .attr('y1', y)
            .attr('x2', x)
            .attr('y2', baseline)

          ruler.exit().remove();

          var dot = selection.selectAll('.sszvis-verticalRuler-dot')
            .data(data, function(d){ return props.x(d) + '_' + props.y(d)});

          dot.enter()
            .append('circle')
            .classed('sszvis-verticalRuler-dot', true);

          dot
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3.5)

          dot.exit().remove();

        });
    }

    return module;
  }({}));


}(window, d3));
