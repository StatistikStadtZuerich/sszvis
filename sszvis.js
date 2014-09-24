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


  exports.createHtmlLayer = function(selector, bounds) {
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
   * Scale component - for implementing alternatives to d3.scale
   *
   * @module sszvis/scale
  */
  exports.scale = (function() {

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

  /**
   * Axis component based on the d3.axis interface
   *
   * @see https://github.com/mbostock/d3/wiki/SVG-Axes
   * @module sszvis/axis
   */
  exports.axis = (function() {

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
        .prop('alignOuterLabels').alignOuterLabels(false)
        .prop('highlight')
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

          var group = selection.selectGroup('sszvis-axis')
            .classed('sszvis-axis', true)
            .classed('sszvis-axis--horizontal', !props.vertical)
            .classed('sszvis-axis--vertical', props.vertical)
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
            var extent = d3.extent(props.scale.domain());
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
      return axis_x()
        .tickFormat(axisTimeFormat)
        .alignOuterLabels(true);
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
   * Ready-made behaviors
   *
   * @module sszvis/behavior
   */
  var behavior = exports.behavior = (function(module) {

    /**
     * Move behavior
     * @return {d3.component}
     */
    module.move = function() {
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

    module.mouseover = function() {
      var overFunc = fn.identity;
      var outFunc = fn.identity;

      function addMouseOver(selection) {
        selection
          .on('mouseover', overFunc)
          .on('mouseout', outFunc);
      }

      addMouseOver.mouseover = function(func) {
        overFunc = func;
        return this;
      }

      addMouseOver.mouseout = function(func) {
        outFunc = func;
        return this;
      }

      return addMouseOver;
    }

    return module;

  }({}));

  /**
   * Ready-made components
   *
   * @module sszvis/component
   */
  var component = exports.component = (function(module) {

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
        .prop('mouseover')
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
            .attr('height', props.height)

          if (props.mouseover) bars.on("mouseover", props.mouseover);
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
     * Ruler component
     * @return {d3.component}
     */
    module.ruler = function() {
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

          var ruler = selection.selectAll('.sszvis-ruler-rule')
            .data(data);

          ruler.enter()
            .append('line')
            .classed('sszvis-ruler-rule', true);

          ruler
            .attr('x1', x)
            .attr('y1', y)
            .attr('x2', x)
            .attr('y2', baseline)

          ruler.exit().remove();

          var dot = selection.selectAll('.sszvis-ruler-dot')
            .data(data, function(d){ return props.x(d) + '_' + props.y(d)});

          dot.enter()
            .append('circle')
            .classed('sszvis-ruler-dot', true);

          dot
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3.5)

          dot.exit().remove();

        });
    }

    /**
     * Tooltip component
     *
     * @return {d3.component}
     */
     module.tooltip = function() {
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
     module.modularText = function() {
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

    return module;
  }({}));


}(window, d3));
