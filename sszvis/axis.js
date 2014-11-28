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
 * @property {boolean} alignOuterLabels                 Whether or not to align the outer labels to the axis extent so that they do not fall outside the axis space.
 * @property {boolean} contour                          Specify a 'contour' background for the axis labels.
 * @property {number} hideBorderTickThreshold           Specifies the pixel distance threshold for the visible tick correction. Ticks which are closer than
 *                                                      this threshold to the end of the axis (i.e. a tick which is 1 or two pixels from the end) will be
 *                                                      hidden from view. This prevents the display of a tick very close to the ending line.
 * @property {function} highlightTick                   Specifies a predicate function to use to determine whether axis ticks should be highlighted.
 *                                                      Any tick value which returns true for this predicate function will be treated specially as a highlighted tick.
 *                                                      Note that this function does NOT have any effect over which ticks are actually included on the axis. To create special
 *                                                      custom ticks, use tickValues.
 * @property {boolean} showZeroY                        Whether the axis should display a label for at y=0.
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 * @property {number} textWrap                          Specify a width at which to wrap the axis label text.
 * @property {number, function} tickLength              specify a number or a function which returns a number for setting the tick length.
 * @property {string} title                             Specify a string to use as the title of this chart. Default title position depends on the chart orientation
 * @property {string} titleAnchor                       specify the title text-anchor. Values are 'start', 'middle', and 'end'. Corresponds to the 'text-anchor' svg styling attribute
 *                                                      the default depends on the axis orient property
 * @property {boolean} titleCenter                      whether or not to center the axis title along the axis. If true, this sets the title anchor point
 *                                                      as the midpoint between axis extremes. Should usually be used with titleAnchor('middle') to ensure exact title centering. (default: false)
 * @property {number} dxTitle                           specify an amount by which to offset the title towards the left. This offsets away from the default position. (default: 0)
 * @property {number} dyTitle                           specify an amount by which to offset the title towards the top. This offsets away from the default position. (default: 0)
 * @property {boolean} titleVertical                    whether or not to rotate the title 90 degrees so that it appears vertical, reading from bottom to top. (default: false)
 * @property {boolean} vertical                         whether the axis is a vertical axis. When true, this property changes certain display properties of the axis according to the style guide.
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
        .prop('contour')
        .prop('hideBorderTickThreshold').hideBorderTickThreshold(TICK_PROXIMITY_THRESHOLD)
        .prop('highlightTick', d3.functor)
        .prop('showZeroY').showZeroY(false)
        .prop('slant')
        .prop('textWrap')
        .prop('tickLength')
        .prop('title')
        .prop('titleAnchor') // start, end, or middle
        .prop('titleCenter') // a boolean value - whether to center the title
        .prop('dxTitle') // a numeric value for the left offset of the title
        .prop('dyTitle') // a numeric value for the top offset of the title
        .prop('titleVertical')
        .prop('vertical').vertical(false)
        .render(function() {
          var selection = d3.select(this);
          var props = selection.props();

          var isBottom = !props.vertical && axisDelegate.orient() === 'bottom';

          var group = selection.selectGroup('sszvis-axis')
            .classed('sszvis-axis', true)
            .classed('sszvis-axis--top', !props.vertical && axisDelegate.orient() === 'top')
            .classed('sszvis-axis--bottom', isBottom)
            .classed('sszvis-axis--vertical', props.vertical)
            .attr('transform', sszvis.svgUtils.translateString(0, 2))
            .call(axisDelegate);

          var axisScale = axisDelegate.scale();

          // To prevent anti-aliasing on elements that need to be rendered crisply
          // we need to position them on a half-pixel grid: 0.5, 1.5, 2.5, etc.
          // We can't translate the whole .tick group, however, because this
          // leads to weird type rendering artefacts in some browsers. That's
          // why we reach into the group and translate lines onto the half-pixel
          // grid by taking the translation of the group into account.
          group.selectAll('.tick')
            .each(function() {
              var subpixelShift = sszvis.fn.transformTranslateSubpixelShift(this.getAttribute('transform'));
              var dx = sszvis.fn.roundPixelCrisp(0) - subpixelShift[0];
              var dy = sszvis.fn.roundPixelCrisp(isBottom ? 2 : 0) - subpixelShift[1];
              d3.select(this).select('line')
                .attr('transform', sszvis.svgUtils.translateString(dx, dy));
            });

          // Place axis line on a half-pixel grid to prevent anti-aliasing
          group.selectAll('path.domain')
            .attr('transform', sszvis.svgUtils.translateString(sszvis.fn.roundPixelCrisp(0), sszvis.fn.roundPixelCrisp(0)));


          // hide ticks which are too close to one endpoint
          var rangeExtent = sszvis.fn.scaleRange(axisScale);
          group.selectAll('.tick line')
            .each(function(d) {
              var pos = axisScale(d),
                  d3this = d3.select(this);
              d3this
                .classed('hidden', !d3this.classed('sszvis-axis__longtick') && (absDistance(pos, rangeExtent[0]) < props.hideBorderTickThreshold || absDistance(pos, rangeExtent[1]) < props.hideBorderTickThreshold));
            });

          if (sszvis.fn.defined(props.tickLength)) {
            var extent = d3.extent(axisScale.domain());
            var ticks = group.selectAll('.tick')
              .filter(function(d) {
                return !sszvis.fn.stringEqual(d, extent[0]) && !sszvis.fn.stringEqual(d, extent[1]);
              });
            var orientation = axisDelegate.orient();

            var longLinePadding = 2;
            if (orientation === 'left' || orientation === 'right') {
              ticks.selectAll('text').each(function() {
                longLinePadding = Math.max(this.getBoundingClientRect().width, longLinePadding);
              });
              longLinePadding += 2; // a lil' extra on the end
            }

            var lines = ticks.selectAll('line.sszvis-axis__longtick')
              .data([0]);

            if (props.tickLength > longLinePadding) {
              lines.enter().append('line')
                .attr('class', 'sszvis-axis__longtick');

              if (orientation === 'top') {
                lines
                  .attr('y1', longLinePadding)
                  .attr('y2', props.tickLength);
              } else if (orientation === 'bottom') {
                lines
                  .attr('y1', -longLinePadding)
                  .attr('y2', -props.tickLength);
              } else if (orientation === 'left') {
                lines
                  .attr('x1', -longLinePadding)
                  .attr('x2', -props.tickLength);
              } else if (orientation === 'right') {
                lines
                  .attr('x1', longLinePadding)
                  .attr('x2', props.tickLength);
              }
            } else {
              lines.remove();
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

          // Highlight axis labels that return true for props.highlightTick.
          if (props.highlightTick) {
            var activeBounds = [];
            var passiveBounds = [];
            var labels = group.selectAll('.tick text');

            labels
              .classed('hidden', false)
              .classed('active', props.highlightTick);

            // Hide axis labels that overlap with highlighted labels unless
            // the labels are slanted (in which case the bounding boxes overlap)
            if (!props.slant) {
              labels
                .each(function(d) {
                  // although getBoundingClientRect returns coordinates relative to the window, not the document,
                  // this should still work, since all tick bounds are affected equally by scroll position changes.
                  var bounds = {
                    node: this,
                    bounds: this.getBoundingClientRect()
                  };
                  if (props.highlightTick(d)) {
                    bounds.left -= LABEL_PROXIMITY_THRESHOLD;
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
          }

          if (props.title) {
            var title = group.selectAll('.sszvis-axis__title')
              .data([props.title]);

            title.enter()
              .append('text')
              .classed('sszvis-axis__title', true);

            title.exit().remove();

            title
              .text(function(d) {
                return d;
              })
              .attr('transform', function() {
                var orientation = axisDelegate.orient(),
                  extent = sszvis.fn.scaleRange(axisScale),
                  titleProps;

                if (props.titleCenter) {
                  titleProps = {
                    left: orientation === 'left' || orientation === 'right' ? 0 : orientation === 'top' || orientation === 'bottom' ? (extent[0] + extent[1]) / 2 : 0,
                    top: orientation === 'left' || orientation === 'right' ? (extent[0] + extent[1]) / 2 : orientation === 'top' ? 0 : orientation === 'bottom' ? 32 : 0
                  };
                } else {
                  titleProps = {
                    left: orientation === 'left' || orientation === 'right' || orientation === 'top' ? 0 : orientation === 'bottom' ? extent[1] : 0,
                    top: orientation === 'left' || orientation === 'right' || orientation === 'top' ? 0 : orientation === 'bottom' ? 32 : 0
                  };
                }

                titleProps.vertical = !!props.titleVertical;
                titleProps.left += props.dxTitle || 0;
                titleProps.top += props.dyTitle || 0;
                return 'translate(' + (titleProps.left) + ', ' + (titleProps.top) + ') rotate(' + (titleProps.vertical ? '-90' : '0') + ')';
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
          if (props.contour && props.slant) {
            sszvis.logger.warn('Can\'t apply contour to slanted labels');
          } else if (props.contour) {
            selection.selectAll('.sszvis-axis .tick').each(function() {
              var g = d3.select(this);
              var textNode = g.select('text').node();
              var textContour = g.select('.sszvis-axis__label-contour');
              if (textContour.empty()) {
                textContour = d3.select(textNode.cloneNode())
                  .classed('sszvis-axis__label-contour', true);
                this.insertBefore(textContour.node(), textNode);
              }
              textContour.text(textNode.textContent);
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
          .attr('dy', '0.35em') // vertically-center
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
      diagonal: function(selection) {
        selection.style('text-anchor', 'end')
          .attr('dx', '-0.8em')
          .attr('dy', '0em')
          .attr('transform', 'rotate(-45)');
      }
    }
  };

});
