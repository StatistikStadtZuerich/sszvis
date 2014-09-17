;(function() {
  "use strict";

  // Namespace
  var sszvis = {
    version: "0.1.0"
  };


  /**
   * fn - a collection of functional helpers
   */
  var fn = {
    clone: function(obj) {
      var copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
    },

    either: function(val, fallback) {
      return (typeof val === "undefined") ? fallback : val;
    },

    has: function(obj, key) {
      return obj ? Object.hasOwnProperty.call(obj, key) : false;
    },

    identity: function(value) {
      return value;
    },

    partial: function(func, var_args) {
      var argsArr = fn.slice(arguments, 1);
      return function(){
        return func.apply(this, argsArr.concat(fn.slice(arguments)));
      };
    },

    prop: function(key) {
      return function(object) {
        return object[key];
      }
    },

    slice: function(array, start, end) {
      start || (start = 0);
      if (typeof end == 'undefined') {
        end = array ? array.length : 0;
      }
      var index = -1;
      var length = end - start || 0;
      var result = Array(length < 0 ? 0 : length);
      while (++index < length) {
        result[index] = array[start + index];
      }
      return result;
    }
  }
  sszvis.fn = fn;


  /*- UTILS ------------------------------------------------------------------*/

  sszvis.utils = {};

  var accessor = function(props, attr, setter) {
    setter || (setter = f.identity);
    return function(val) {
      if (!arguments.length) return props[attr];
      props[attr] = setter(val, props[attr]);
      return this;
    }
  }
  sszvis.utils.accessor = accessor;


  var format = {
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
  sszvis.utils.format = format;


  var parse = {
    date: function(d) {
      return d3.time.format("%d.%m.%Y").parse(d);
    },
    number: function(d) {
      return (d.trim() === '') ? NaN : +d;
    }
  }
  sszvis.utils.parse = parse;


  var translate = function(x, y) {
    return 'translate(' + x + ', ' + y + ')';
  }
  sszvis.utils.translate = translate;


  /*--------------------------------------------------------------------------*/


  /**
   * Factory that returns a selection appended to
   * the given target selector.
   *
   * @param {string|d3.selection} selector
   * @param {d3.bounds} bounds
   *
   * @returns {d3.selection}
   */
  sszvis.createChart = function(selector, bounds) {
    var root = d3.select(selector);
    var svg = root.selectAll('svg').data([0]);
    svg.enter().append('svg');

    svg
      .attr('height', bounds.height)
      .attr('width',  bounds.width)

    var viewport = svg.selectAll('[data-d3-chart]').data([0])
    viewport.enter().append('g')
      .attr('data-d3-chart', '')
      .attr('transform', translate(bounds.padding.left, bounds.padding.right));

    return viewport;
  }


  sszvis.bounds = function(bounds) {
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


  /*--------------------------------------------------------------------------*/

  /**
   * Axis components
   *
   * @namespace axis
   * @see https://github.com/mbostock/d3/wiki/SVG-Axes
   */
  sszvis.axis = (function() {

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
            .attr('transform', translate(0, 2))
            .call(axisDelegate)
        });
    }

    var axis_x = function() {
      return axis()
        .ticks(3)
        .tickSize(4, 7)
        .tickPadding(7)
        .tickFormat(sszvis.utils.format.number)
    };

    axis_x.time = function() {
      return axis_x().tickFormat(axisTimeFormat);
    }

    var axis_y = function() {
      return axis()
        .ticks(7)
        .tickSize(0, 0)
        .tickPadding(0)
        .tickFormat(function(d) {
          return 0 === d ? null : sszvis.utils.format.number(d);
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


  /*--------------------------------------------------------------------------*/


  sszvis.component = {};

  sszvis.component.line = function() {
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


  /*--------------------------------------------------------------------------*/


  sszvis.error = function(msg) {
    alert(msg); // Do something smart here
  };


  // Export library
  window.sszvis = sszvis;
}()); // EOF
