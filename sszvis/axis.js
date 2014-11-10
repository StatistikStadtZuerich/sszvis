/**
 * Axis component based on the d3.axis interface
 *
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 * @module sszvis/axis
 */
namespace('sszvis.axis', function(module) {
'use strict';

  var TICK_PROXIMITY_THRESHOLD = 8;

  module.exports = (function() {

    var stringEqual = function(a, b) {
      return a.toString() === b.toString();
    };

    var axisTimeFormat = d3.time.format.multi([
      ['.%L', function(d) { return d.getMilliseconds(); }],
      [':%S', function(d) { return d.getSeconds(); }],
      ['%H:%M', function(d) { return d.getMinutes(); }],
      ['%H Uhr', function(d) { return d.getHours(); }],
      ['%a., %d.', function(d) { return d.getDay() && d.getDate() != 1; }],
      ['%e. %b', function(d) { return d.getDate() != 1; }],
      ['%B', function(d) { return d.getMonth(); }],
      ['%Y', function() { return true; }]
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
        .prop('alignOuterLabels').alignOuterLabels(false)
        .prop('tickColor')
        .prop('halo')
        .prop('highlight')
        .prop('highlightBoundary').highlightBoundary(0)
        .prop('showZeroY').showZeroY(false)
        .prop('slant')
        .prop('textWrap')
        .prop('tickLength')
        .prop('title')
        .prop('titleAnchor') // start, end, or middle
        .prop('titleLeft') // a numeric value for the left offset of the title
        .prop('titleTop') // a numeric value for the top offset of the title
        .prop('titleVertical')
        .prop('vertical').vertical(false)
        .render(function() {
          var selection = d3.select(this);
          var props = selection.props();

          var group = selection.selectGroup('sszvis-axis')
            .classed('sszvis-axis', true)
            .classed('sszvis-axis--top', !props.vertical && axisDelegate.orient() === 'top')
            .classed('sszvis-axis--bottom', !props.vertical && axisDelegate.orient() === 'bottom')
            .classed('sszvis-axis--vertical', props.vertical)
            .classed('sszvis-axis--halo', props.halo)
            .attr('transform', sszvis.fn.translateString(0, 2))
            .call(axisDelegate);

          var axisScale = axisDelegate.scale();

          // Shift axis strokes by half-pixels to ensure they are not blurred
          // due to anti-aliasing effects (even though crispEdges is set).
          selection.selectAll('.sszvis-axis--bottom path')
            .attr('transform', sszvis.fn.translateString(0.5, 0.5));

          selection.selectAll('.sszvis-axis--bottom line')
            .attr('transform', sszvis.fn.translateString(0.5, 3));


          // hide ticks which are too close to one endpoint
          var rangeExtent = scaleRange(axisScale);
          group.selectAll('.tick line')
            .each(function(d) {
              var pos = axisScale(d);
              d3.select(this)
                .classed('hidden', Math.abs(pos - rangeExtent[0]) < TICK_PROXIMITY_THRESHOLD || Math.abs(pos - rangeExtent[1]) < TICK_PROXIMITY_THRESHOLD);
            });

          if (props.highlight) {
            var highlightPositions = [];

            group.selectAll('.tick text')
              .each(function(d) {
                var isHighlight = [].concat(props.highlight).reduce(function(found, highlight) {
                  return found || stringEqual(highlight, d);
                }, false);
                d3.select(this).classed('active', isHighlight);
                if (isHighlight) {
                  highlightPositions.push(axisScale(d));
                }
              });

            group.selectAll('.tick text')
              .each(function(d) {
                var selection = d3.select(this);
                if (selection.classed('active') || props.highlightBoundary === 0) {
                  selection.classed('hidden', false);
                  return;
                }

                var position = axisScale(d);
                var isTooClose = highlightPositions.reduce(function(tooClose, highlightPos) {
                  return tooClose || Math.abs(position - highlightPos) < props.highlightBoundary;
                }, false);
                selection.classed('hidden', isTooClose);
              });
          }

          if (props.tickColor) {
            group.selectAll('.tick line')
              .style('stroke', props.tickColor);
          }

          if (sszvis.fn.defined(props.tickLength)) {
            var extent = d3.extent(axisScale.domain());
            var ticks = group.selectAll('.tick')
              .filter(function(d) {
                return !stringEqual(d, extent[0]) && !stringEqual(d, extent[1]);
              });
            var lines = ticks.selectAll('line');
            var orientation = axisDelegate.orient();
            if (orientation === 'top') {
              lines.attr('y1', props.tickLength);
            } else if (orientation === 'bottom') {
              lines.attr('y1', -props.tickLength);
            } else if (orientation === 'left') {
              lines.attr('x1', -props.tickLength);
            } else if (orientation === 'right') {
              lines.attr('x1', props.tickLength);
            }
            if (orientation === 'left' || orientation === 'right') {
              ticks.selectAll('text').attr('dy', '-0.4em');
            }
          }

          if (props.alignOuterLabels) {
            var extent = d3.extent(axisScale.domain());
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

          if (sszvis.fn.defined(props.textWrap)) {
            group.selectAll('text')
              .call(sszvis.component.textWrap, props.textWrap);
          }

          if (props.slant) {
            group.selectAll('text')
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
              .attr('transform', function() {
                var orientation = axisDelegate.orient(),
                    extent = scaleRange(axisScale),
                    titleProps = sszvis.fn.defaults({
                      vertical: props.titleVertical,
                      left: props.titleLeft,
                      top: props.titleTop
                    }, {
                      vertical: false,
                      left: orientation === 'left' || orientation === 'right' ? 0 : orientation === 'top' || orientation === 'bottom' ? extent[1] : 0,
                      top: orientation === 'left' || orientation === 'right' || orientation === 'top' ? 0 : orientation === 'bottom' ? 35 : 0
                    });
                return 'rotate(' + (titleProps.vertical ? '-90' : '0' ) + ') translate(' + (titleProps.left) + ', ' + (titleProps.top) + ')';
              })
              .style('text-anchor', function() {
                var orientation = axisDelegate.orient();
                if (typeof props.titleAnchor !== 'undefined') {
                  return props.titleAnchor;
                } else if (orientation === 'left') {
                  return 'end';
                } else if (orientation === 'right') {
                  return 'start';
                } else if (orientation === 'top' || orientation === 'bottom') {
                  return 'end';
                }
              });
          }
        });

        axisComponent.__delegate__ = axisDelegate;

        return axisComponent;
    };

    var setOrdinalTicks = function(count) {
      // in this function, the 'this' context should be an sszvis.axis
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

    var axisX = function() {
      return axis()
        .ticks(3)
        .tickSize(4, 6)
        .tickPadding(6)
        .tickFormat(sszvis.format.number);
    };

    axisX.time = function() {
      return axisX()
        .tickFormat(axisTimeFormat)
        .alignOuterLabels(true);
    };

    axisX.ordinal = function() {
      return axisX()
        // extend this class a little with a custom implementation of 'ticks'
        // that allows you to set a custom number of ticks,
        // including the first and last value in the ordinal scale
        .prop('ticks', setOrdinalTicks)
        .tickFormat(sszvis.format.text);
    };

    // need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
    axisX.pyramid = function() {
      return axisX()
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

          this.__delegate__.scale(extended);
          return extended;
        })
        .tickFormat(function(v) {
          // this tick format means that the axis appears to be divergent around 0
          // when in fact it is -domain[1] -> +domain[1]
          return sszvis.format.number(Math.abs(v));
        });
    };

    var axisY = function() {
      var newAxis = axis()
        .ticks(7)
        .tickSize(0, 0)
        .tickPadding(0)
        .tickFormat(function(d) {
          return 0 === d && !newAxis.showZeroY() ? null : sszvis.format.number(d);
        })
        .vertical(true);
      return newAxis;
    };

    axisY.time = function() {
      return axisY().tickFormat(axisTimeFormat);
    };

    axisY.ordinal = function() {
      return axisY()
        // add custom 'ticks' function
        .prop('ticks', setOrdinalTicks)
        .tickFormat(sszvis.format.text);
    };

    return {
      x: axisX,
      y: axisY
    };

  }());

  function scaleExtent(domain) { // borrowed from d3 source - svg.axis
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }

  function scaleRange(scale) { // borrowed from d3 source - svg.axis
    return scale.rangeExtent ? scale.rangeExtent() : scaleExtent(scale.range());
  }

  var slantLabel = {
    top: {
      vertical: function(selection) {
        selection.style('text-anchor', 'start')
          .attr('dx', '0em')
          .attr('dy', '0.35em')
          .attr('transform', 'rotate(-90)');
      },
      diagonal: function(selection) {
        selection.style('text-anchor', 'start')
          .attr('dx', '0.1em')
          .attr('dy', '0.1em')
          .attr('transform', 'rotate(-45)');
      }
    },
    bottom: {
      vertical: function(selection) {
        selection.style('text-anchor', 'end')
          .attr('dx', '-1em')
          .attr('dy', '-0.75em')
          .attr('transform', 'rotate(-90)');
      },
      diagonal:  function(selection) {
        selection.style('text-anchor', 'end')
          .attr('dx', '-0.8em')
          .attr('dy', '0em')
          .attr('transform', 'rotate(-45)');
      }
    }
  };

});
