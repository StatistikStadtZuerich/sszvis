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
