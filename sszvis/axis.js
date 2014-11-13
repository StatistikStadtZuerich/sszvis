/**
 * Axis component
 *
 * This component is an extension of d3.axis and provides the same interface
 * with some custom additions. It provides good defaults for sszvis charts
 * and helps with some commonly used functionality.
 *
 * @module sszvis/axis
 *
 * The following properties are directly delegated to the d3.axis component.
 * They are documented in the d3 documentation.
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 *
 * @property {function} scale         Delegates to d3.axis
 * @property {function} orient        Delegates to d3.axis
 * @property {function} ticks         Delegates to d3.axis
 * @property {function} tickValues    Delegates to d3.axis
 * @property {function} tickSize      Delegates to d3.axis
 * @property {function} innerTickSize Delegates to d3.axis
 * @property {function} outerTickSize Delegates to d3.axis
 * @property {function} tickPadding   Delegates to d3.axis
 * @property {function} tickFormat    Delegates to d3.axis
 *
 * The following properties are custom additions.
 *
 * @property {function} highlight Whether or not an axis tick should be visually highlighted
 *
 * FIXME: document missing custom properties
 *
 * @return {d3.component}
 */
namespace('sszvis.axis', function(module) {
'use strict';

  var TICK_PROXIMITY_THRESHOLD = 8;
  var TICK_END_THRESHOLD = 12;
  var LABEL_PROXIMITY_THRESHOLD = 10;

  module.exports = (function() {

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
        .prop('backdrop')
        .prop('hideBorderTickThreshold').hideBorderTickThreshold(TICK_PROXIMITY_THRESHOLD)
        .prop('highlight', d3.functor)
        .prop('showZeroY').showZeroY(false)
        .prop('slant')
        .prop('textWrap')
        .prop('tickColor')
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
            .attr('transform', sszvis.fn.translateString(sszvis.fn.roundPixelCrisp(0), sszvis.fn.roundPixelCrisp(2)))
            .call(axisDelegate);

          var axisScale = axisDelegate.scale();

          // Place axis ticks on rounded pixel values to prevent anti-aliasing
          selection.selectAll('.tick')
            .attr('transform', function() {
              return sszvis.fn.roundTransformString(this.getAttribute('transform'));
            });

          selection.selectAll('.sszvis-axis--bottom line')
            .attr('transform', sszvis.fn.translateString(0, 3));


          // hide ticks which are too close to one endpoint
          var rangeExtent = sszvis.fn.scaleRange(axisScale);
          group.selectAll('.tick line')
            .each(function(d) {
              var pos = axisScale(d);
              d3.select(this)
                .classed('hidden', absDistance(pos, rangeExtent[0]) < props.hideBorderTickThreshold || absDistance(pos, rangeExtent[1]) < props.hideBorderTickThreshold);
            });


          // Highlight axis labels that return true for props.highlight.
          // Hide axis labels that overlap with highlighted labels.
          if (props.highlight) {
            var activeBounds = [];
            var passiveBounds = [];
            group.selectAll('.tick text')
              .classed('hidden', false)
              .classed('active', props.highlight)
              .each(function(d) {
                var bounds = {
                  node: this,
                  bounds: this.getBoundingClientRect()
                };
                if (props.highlight(d)) {
                  bounds.left  -= LABEL_PROXIMITY_THRESHOLD;
                  bounds.right += LABEL_PROXIMITY_THRESHOLD;
                  activeBounds.push(bounds);
                } else {
                  passiveBounds.push(bounds);
                }
              });

            activeBounds.forEach(function(active) {
              passiveBounds.forEach(function(passive) {
                d3.select(passive.node).classed('hidden', boundsOverlap(passive.bounds, active.bounds));
              });
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
                return !sszvis.fn.stringEqual(d, extent[0]) && !sszvis.fn.stringEqual(d, extent[1]);
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
            var extent = sszvis.fn.scaleRange(axisScale);
            var min = extent[0];
            var max = extent[1];

            group.selectAll('g.tick text')
              .style('text-anchor', function(d) {
                var value = axisScale(d);
                if (absDistance(value, min) < TICK_END_THRESHOLD) {
                  return 'start';
                } else if (absDistance(value, max) < TICK_END_THRESHOLD) {
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
            var title = group.selectAll('.sszvis-axis__title')
              .data([props.title]);

            title.enter()
              .append('text')
              .classed('sszvis-axis__title', true);

            title.exit().remove();

            title
              .text(function(d) { return d; })
              .attr('transform', function() {
                var orientation = axisDelegate.orient(),
                    extent = sszvis.fn.scaleRange(axisScale),
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


          /**
           * Add a background to axis labels to make them more readable on
           * colored backgrounds
           */
          if (props.backdrop && props.slant) {
            console.warn('Can\'t apply backdrop to slanted labels');
          } else if (props.backdrop) {
            selection.selectAll('.sszvis-axis .tick').each(function() {
              var g = d3.select(this);
              var dim = g.select('text').node().getBBox();
              var hPadding = 2;
              var rect = g.select('rect');
              if (rect.empty()) {
                rect = g.insert('rect', ':first-child');
              }
              rect
                .attr('class', 'sszvis-axis__label-background')
                .attr('height', dim.height)
                .attr('width', dim.width + 2 * hPadding)
                .attr('x', dim.x - hPadding)
                .attr('y', dim.y);
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
        .tickFormat(sszvis.fn.arity(1, sszvis.format.number));
    };

    axisX.time = function() {
      return axisX()
        .tickFormat(sszvis.format.axisTimeFormat)
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
      return axisY().tickFormat(sszvis.format.axisTimeFormat);
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


  /* Helper functions
  ----------------------------------------------- */

  function absDistance(a, b) {
    return Math.abs(a - b);
  }

  function boundsOverlap(boundsA, boundsB) {
    return !(boundsB.left > boundsA.right ||
             boundsB.right < boundsA.left ||
             boundsB.top > boundsA.bottom ||
             boundsB.bottom < boundsA.top);
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
