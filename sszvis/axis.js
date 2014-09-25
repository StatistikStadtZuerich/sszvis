/**
 * Axis component based on the d3.axis interface
 *
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 * @module sszvis/axis
 */
namespace('sszvis.axis', function(module) {

  module.exports = (function() {

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

});
