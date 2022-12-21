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
 * @property {number} hideLabelThreshold                By default, labels are hidden when they are closer than LABEL_PROXIMITY_THRESHOLD to a highlighted label.
 *                                                      If this value is set to 0 or lower, labels won't be hidden, even if they overlap with the highlighted label.
 * @property {function} highlightTick                   Specifies a predicate function to use to determine whether axis ticks should be highlighted.
 *                                                      Any tick value which returns true for this predicate function will be treated specially as a highlighted tick.
 *                                                      Note that this function does NOT have any effect over which ticks are actually included on the axis. To create special
 *                                                      custom ticks, use tickValues.
 * @property {boolean} showZeroY                        Whether the axis should display a label for at y=0.
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 *                                                      Use "horizontal" to reset to a horizontal slant.
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
 * @return {sszvis.component}
 */

import { select, axisBottom, axisTop, axisLeft, axisRight, extent } from "d3";

import * as fn from "./fn.js";
import {
  halfPixel,
  transformTranslateSubpixelShift,
} from "./svgUtils/crisp.js";
import translateString from "./svgUtils/translateString.js";
import textWrap from "./svgUtils/textWrap.js";
import { formatNumber, formatAxisTimeFormat, formatText } from "./format.js";
import { range } from "./scale.js";
import * as logger from "./logger.js";
import { component } from "./d3-component.js";

var TICK_PROXIMITY_THRESHOLD = 8;
var TICK_END_THRESHOLD = 12;
var LABEL_PROXIMITY_THRESHOLD = 10;

var axis = function () {
  // var axisDelegate = d3.axisBottom();
  // axisDelegate.orient = function() { return 'bottom'; };

  var axisComponent = component()
    .prop("scale")
    .prop("orient")
    .prop("ticks")
    .prop("tickValues")
    .prop("tickSize")
    .prop("tickSizeInner")
    .prop("tickSizeOuter")
    .prop("tickPadding")
    .prop("tickFormat")

    .prop("_scale")

    .prop("orient")
    .orient("bottom")
    .prop("alignOuterLabels")
    .alignOuterLabels(false)
    .prop("contour")
    .prop("hideBorderTickThreshold")
    .hideBorderTickThreshold(TICK_PROXIMITY_THRESHOLD)
    .prop("hideLabelThreshold")
    .hideLabelThreshold(LABEL_PROXIMITY_THRESHOLD)
    .prop("highlightTick", fn.functor)
    .prop("showZeroY")
    .showZeroY(false)
    .prop("slant")
    .prop("textWrap")
    .prop("tickLength")
    .prop("title")
    .prop("titleAnchor") // start, end, or middle
    .prop("titleCenter") // a boolean value - whether to center the title
    .prop("dxTitle") // a numeric value for the left offset of the title
    .prop("dyTitle") // a numeric value for the top offset of the title
    .prop("titleVertical")
    .prop("vertical")
    .vertical(false)
    //this property is typically used for the x-axis, but not for the y axis
    //it creates a gap between chart and x-axis by offsetting the the chart by a number of pixels
    .prop("yOffset")
    .yOffset(0)
    .render(function () {
      var selection = select(this);
      var props = selection.props();

      var isBottom = !props.vertical && props.orient === "bottom";

      var axisDelegate = (function () {
        switch (props.orient) {
          case "bottom":
            return axisBottom();
          case "top":
            return axisTop();
          case "left":
            return axisLeft();
          case "right":
            return axisRight();
        }
      })();

      [
        "scale",
        "ticks",
        "tickValues",
        "tickSizeInner",
        "tickSizeOuter",
        "tickPadding",
        "tickFormat",
        "tickSize",
      ].forEach(function (prop) {
        if (props[prop] !== undefined) {
          if (axisDelegate[prop] === undefined) {
            throw new Error('axis: "' + prop + '" not available');
          }
          axisDelegate[prop](props[prop]);
        }
      });

      if (props._scale) {
        axisDelegate.scale(props._scale);
      }

      var group = selection
        .selectGroup("sszvis-axis")
        .classed("sszvis-axis", true)
        .classed("sszvis-axis--top", !props.vertical && props.orient === "top")
        .classed("sszvis-axis--bottom", isBottom)
        .classed("sszvis-axis--vertical", props.vertical)
        .attr("transform", translateString(0, props.yOffset))
        .call(axisDelegate);

      group
        .attr("fill", null)
        .attr("font-size", null)
        .attr("font-family", null);
      // .attr("text-anchor", null);

      var axisScale = axisDelegate.scale();

      // Create selections here which will be used later for many custom configurations
      // Note: Invariant: This is only valid so long as new .tick groups or tick label texts
      // are not being added after these selections are constructed. If that changes, these
      // selections need to be re-constructed.
      var tickGroups = group.selectAll("g.tick");
      var tickTexts = tickGroups.selectAll("text");

      // To prevent anti-aliasing on elements that need to be rendered crisply
      // we need to position them on a half-pixel grid: 0.5, 1.5, 2.5, etc.
      // We can't translate the whole .tick group, however, because this
      // leads to weird type rendering artefacts in some browsers. That's
      // why we reach into the group and translate lines onto the half-pixel
      // grid by taking the translation of the group into account.
      tickGroups.each(function () {
        var subpixelShift = transformTranslateSubpixelShift(
          this.getAttribute("transform")
        );
        var dx = halfPixel(0) - subpixelShift[0];
        var dy = halfPixel(isBottom ? 2 : 0) + subpixelShift[1];
        select(this).select("line").attr("transform", translateString(dx, dy));
      });

      tickTexts.each(function () {
        if (props.orient === "top" || props.orient === "bottom") {
          select(this).attr("dx", "-0.5");
        }
        if (props.orient === "left" || props.orient === "right") {
          select(this).attr("y", "-0.5");
        }
      });

      // Place axis line on a half-pixel grid to prevent anti-aliasing
      group.selectAll("path.domain");
      // .attr('transform', translateString(halfPixel(0), halfPixel(0)));

      // hide ticks which are too close to one endpoint
      var rangeExtent = range(axisScale);
      tickGroups.selectAll("line").each(function (d) {
        var pos = axisScale(d),
          d3this = select(this);
        d3this.classed(
          "hidden",
          !d3this.classed("sszvis-axis__longtick") &&
            (absDistance(pos, rangeExtent[0]) < props.hideBorderTickThreshold ||
              absDistance(pos, rangeExtent[1]) < props.hideBorderTickThreshold)
        );
      });

      if (fn.defined(props.tickLength)) {
        var domainExtent = extent(axisScale.domain());
        var ticks = tickGroups.filter(function (d) {
          return (
            !fn.stringEqual(d, domainExtent[0]) &&
            !fn.stringEqual(d, domainExtent[1])
          );
        });
        var orientation = props.orient;

        var longLinePadding = 2;
        if (orientation === "left" || orientation === "right") {
          ticks.selectAll("text").each(function () {
            longLinePadding = Math.max(
              this.getBoundingClientRect().width,
              longLinePadding
            );
          });
          longLinePadding += 2; // a lil' extra on the end
        }

        var lines = ticks.selectAll("line.sszvis-axis__longtick").data([0]);

        if (props.tickLength > longLinePadding) {
          var newLines = lines
            .enter()
            .append("line")
            .classed("sszvis-axis__longtick", true);

          lines = lines.merge(newLines);

          if (orientation === "top") {
            lines.attr("y1", longLinePadding).attr("y2", props.tickLength);
          } else if (orientation === "bottom") {
            lines.attr("y1", -longLinePadding).attr("y2", -props.tickLength);
          } else if (orientation === "left") {
            lines.attr("x1", -longLinePadding).attr("x2", -props.tickLength);
          } else if (orientation === "right") {
            lines.attr("x1", longLinePadding).attr("x2", props.tickLength);
          }
        } else {
          lines.remove();
        }
      }

      if (props.alignOuterLabels) {
        var alignmentBounds = range(axisScale);
        var min = alignmentBounds[0];
        var max = alignmentBounds[1];

        tickTexts.style("text-anchor", function (d) {
          var value = axisScale(d);
          if (absDistance(value, min) < TICK_END_THRESHOLD) {
            return "start";
          } else if (absDistance(value, max) < TICK_END_THRESHOLD) {
            return "end";
          }
          return "middle";
        });
      }

      if (fn.defined(props.textWrap)) {
        tickTexts.call(textWrap, props.textWrap);
      }

      if (props.slant) {
        tickTexts.call(slantLabel[props.orient][props.slant]);
      }

      // Highlight axis labels that return true for props.highlightTick.
      if (props.highlightTick) {
        var activeBounds = [];
        var passiveBounds = [];

        tickTexts
          .classed("hidden", false)
          .classed("active", props.highlightTick);

        // Hide axis labels that overlap with highlighted labels unless
        // the labels are slanted (in which case the bounding boxes overlap)
        if (props.hideLabelThreshold > 0 && !props.slant) {
          tickTexts.each(function (d) {
            // although getBoundingClientRect returns coordinates relative to the window, not the document,
            // this should still work, since all tick bounds are affected equally by scroll position changes.
            var bcr = this.getBoundingClientRect();
            var b = {
              node: this,
              bounds: {
                top: bcr.top,
                right: bcr.right,
                bottom: bcr.bottom,
                left: bcr.left,
              },
            };
            if (props.highlightTick(d)) {
              b.bounds.left -= props.hideLabelThreshold;
              b.bounds.right += props.hideLabelThreshold;
              activeBounds.push(b);
            } else {
              passiveBounds.push(b);
            }
          });

          activeBounds.forEach(function (active) {
            passiveBounds.forEach(function (passive) {
              select(passive.node).classed(
                "hidden",
                boundsOverlap(passive.bounds, active.bounds)
              );
            });
          });
        }
      }

      if (props.title) {
        var title = group.selectAll(".sszvis-axis__title").data([props.title]);

        var newTitle = title
          .enter()
          .append("text")
          .classed("sszvis-axis__title", true);

        title.exit().remove();

        title
          .merge(newTitle)
          .text(function (d) {
            return d;
          })
          .attr("transform", function () {
            var orient = props.orient,
              axisScaleExtent = range(axisScale),
              titleProps;

            if (props.titleCenter) {
              titleProps = {
                left:
                  orient === "left" || orient === "right"
                    ? 0
                    : orient === "top" || orient === "bottom"
                    ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2
                    : 0,
                top:
                  orient === "left" || orient === "right"
                    ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2
                    : orient === "top"
                    ? 0
                    : orient === "bottom"
                    ? 32
                    : 0,
              };
            } else {
              titleProps = {
                left:
                  orient === "left" || orient === "right" || orient === "top"
                    ? 0
                    : orient === "bottom"
                    ? axisScaleExtent[1]
                    : 0,
                top:
                  orient === "left" || orient === "right" || orient === "top"
                    ? 0
                    : orient === "bottom"
                    ? 32
                    : 0,
              };
            }

            titleProps.vertical = !!props.titleVertical;
            titleProps.left += props.dxTitle || 0;
            titleProps.top += props.dyTitle || 0;
            return (
              "translate(" +
              titleProps.left +
              ", " +
              titleProps.top +
              ") rotate(" +
              (titleProps.vertical ? "-90" : "0") +
              ")"
            );
          })
          .style("text-anchor", function () {
            var orient = props.orient;
            if (typeof props.titleAnchor !== "undefined") {
              return props.titleAnchor;
            } else if (orient === "left") {
              return "end";
            } else if (orient === "right") {
              return "start";
            } else if (orient === "top" || orient === "bottom") {
              return "end";
            }
          });
      }

      /**
       * Add a background to axis labels to make them more readable on
       * colored backgrounds
       */
      if (props.contour && props.slant) {
        logger.warn("Can't apply contour to slanted labels");
      } else if (props.contour) {
        tickGroups.each(function () {
          var g = select(this);
          var textNode = g.select("text").node();
          var textContour = g.select(".sszvis-axis__label-contour");
          if (textContour.empty()) {
            textContour = select(textNode.cloneNode()).classed(
              "sszvis-axis__label-contour",
              true
            );
            this.insertBefore(textContour.node(), textNode);
          }
          textContour.text(textNode.textContent);
        });
      }
    });

  // axisComponent.__delegate__ = axisDelegate;

  return axisComponent;
};

var setOrdinalTicks = function (count) {
  // in this function, the 'this' context should be an sszvis.axis
  var domain = this.scale().domain(),
    values = [],
    step = Math.round(domain.length / count);

  // include the first value
  if (typeof domain[0] !== "undefined") values.push(domain[0]);
  for (var i = step, l = domain.length; i < l - 1; i += step) {
    if (typeof domain[i] !== "undefined") values.push(domain[i]);
  }
  // include the last value
  if (typeof domain[domain.length - 1] !== "undefined")
    values.push(domain[domain.length - 1]);

  this.tickValues(values);

  return count;
};

export var axisX = function () {
  return axis()
    .yOffset(2) //gap between chart and x-axis
    .ticks(3)
    .tickSizeInner(4)
    .tickSizeOuter(6.5)
    .tickPadding(6)
    .tickFormat(fn.arity(1, formatNumber));
};

axisX.time = function () {
  return axisX().tickFormat(formatAxisTimeFormat).alignOuterLabels(true);
};

axisX.ordinal = function () {
  return (
    axisX()
      // extend this class a little with a custom implementation of 'ticks'
      // that allows you to set a custom number of ticks,
      // including the first and last value in the ordinal scale
      .prop("ticks", setOrdinalTicks)
      .tickFormat(formatText)
  );
};

// need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
axisX.pyramid = function () {
  return axisX()
    .ticks(10)
    .prop("scale", function (s) {
      var extended = s.copy(),
        extendedDomain = extended.domain(),
        extendedRange = extended.range();

      extended
        // the domain is mirrored - ±domain[1]
        .domain([-extendedDomain[1], extendedDomain[1]])
        // the range is mirrored – ±range[1]
        .range([
          extendedRange[0] - extendedRange[1],
          extendedRange[0] + extendedRange[1],
        ]);

      this._scale(extended);
      return extended;
    })
    .tickFormat(function (v) {
      // this tick format means that the axis appears to be divergent around 0
      // when in fact it is -domain[1] -> +domain[1]
      return formatNumber(Math.abs(v));
    });
};

export var axisY = function () {
  var newAxis = axis()
    .ticks(6)
    .tickSize(0, 0)
    .tickPadding(0)
    .tickFormat(function (d) {
      return 0 === d && !newAxis.showZeroY() ? null : formatNumber(d);
    })
    .vertical(true);
  return newAxis;
};

axisY.time = function () {
  return axisY().tickFormat(formatAxisTimeFormat);
};

axisY.ordinal = function () {
  return (
    axisY()
      // add custom 'ticks' function
      .prop("ticks", setOrdinalTicks)
      .tickFormat(formatText)
  );
};

/* Helper functions
----------------------------------------------- */

function absDistance(a, b) {
  return Math.abs(a - b);
}

function boundsOverlap(boundsA, boundsB) {
  return !(
    boundsB.left > boundsA.right ||
    boundsB.right < boundsA.left ||
    boundsB.top > boundsA.bottom ||
    boundsB.bottom < boundsA.top
  );
}

var slantLabel = {
  top: {
    horizontal: function (selection) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("transform", null);
    },
    vertical: function (selection) {
      selection
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "0.35em") // vertically-center
        .attr("transform", "rotate(-90)");
    },
    diagonal: function (selection) {
      selection
        .style("text-anchor", "start")
        .attr("dx", "0.1em")
        .attr("dy", "0.1em")
        .attr("transform", "translate(-0.5) rotate(-45)");
    },
  },
  bottom: {
    horizontal: function (selection) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("transform", null);
    },
    vertical: function (selection) {
      selection
        .style("text-anchor", "end")
        .attr("dx", "-1em")
        .attr("dy", "-0.75em")
        .attr("transform", "rotate(-90)");
    },
    diagonal: function (selection) {
      selection
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0em")
        .attr("transform", "rotate(-45)");
    },
  },
};
