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

import {
  type AxisScale,
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
  type BaseType,
  type AxisDomain as D3AxisDomain,
  type Selection,
  select,
} from "d3";
import { type Component, component } from "./d3-component.js";
import * as fn from "./fn.js";
import { formatAxisTimeFormat, formatNumber, formatText } from "./format.js";
import * as logger from "./logger.js";
import { range } from "./scale.js";
import { halfPixel, transformTranslateSubpixelShift } from "./svgUtils/crisp.js";
import textWrap from "./svgUtils/textWrap.js";
import translateString from "./svgUtils/translateString.js";

const TICK_PROXIMITY_THRESHOLD = 8;
const TICK_END_THRESHOLD = 12;
const LABEL_PROXIMITY_THRESHOLD = 10;

// Type definitions for axis component
type AxisDomain = D3AxisDomain;
type AxisOrientation = "top" | "bottom" | "left" | "right";
type SlantDirection = "horizontal" | "vertical" | "diagonal";
type TextAnchor = "start" | "middle" | "end";

interface AxisProps {
  scale?: AxisScale<AxisDomain>;
  _scale?: AxisScale<AxisDomain>;
  orient?: AxisOrientation;
  ticks?: number | number[];
  tickValues?: AxisDomain[];
  tickSize?: number;
  tickSizeInner?: number;
  tickSizeOuter?: number;
  tickPadding?: number;
  tickFormat?: (d: AxisDomain) => string | null;
  alignOuterLabels?: boolean;
  contour?: boolean;
  hideBorderTickThreshold?: number;
  hideLabelThreshold?: number;
  highlightTick?: (d: AxisDomain) => boolean;
  showZeroY?: boolean;
  slant?: SlantDirection;
  textWrap?: number;
  tickLength?: number;
  title?: string;
  titleAnchor?: TextAnchor;
  titleCenter?: boolean;
  dxTitle?: number;
  dyTitle?: number;
  titleVertical?: boolean;
  vertical?: boolean;
  yOffset?: number;
  [key: string]: unknown; // Allow dynamic property access
}

interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BoundingBoxWithNode {
  node: BaseType;
  bounds: BoundingBox;
}

interface AxisComponent extends Component {
  scale(scale?: AxisScale<AxisDomain>): AxisComponent;
  orient(orientation?: AxisOrientation): AxisComponent;
  ticks(ticks?: number | number[]): AxisComponent;
  tickValues(values?: AxisDomain[]): AxisComponent;
  tickSize(size?: number): AxisComponent;
  tickSizeInner(size?: number): AxisComponent;
  tickSizeOuter(size?: number): AxisComponent;
  tickPadding(padding?: number): AxisComponent;
  tickFormat(format?: (d: AxisDomain) => string | null): AxisComponent;
  alignOuterLabels(align?: boolean): AxisComponent;
  contour(contour?: boolean): AxisComponent;
  hideBorderTickThreshold(threshold?: number): AxisComponent;
  hideLabelThreshold(threshold?: number): AxisComponent;
  highlightTick(predicate?: (d: AxisDomain) => boolean): AxisComponent;
  showZeroY(show?: boolean): AxisComponent;
  slant(direction?: SlantDirection): AxisComponent;
  textWrap(width?: number): AxisComponent;
  tickLength(length?: number): AxisComponent;
  title(title?: string): AxisComponent;
  titleAnchor(anchor?: TextAnchor): AxisComponent;
  titleCenter(center?: boolean): AxisComponent;
  dxTitle(offset?: number): AxisComponent;
  dyTitle(offset?: number): AxisComponent;
  titleVertical(vertical?: boolean): AxisComponent;
  vertical(vertical?: boolean): AxisComponent;
  yOffset(offset?: number): AxisComponent;
}

function axis(): AxisComponent {
  // const axisDelegate = d3.axisBottom();
  // axisDelegate.orient = function() { return 'bottom'; };

  // axisComponent.__delegate__ = axisDelegate;

  return (
    component()
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
      .render(function (this: BaseType) {
        const selection = select(this);
        const props = selection.props() as AxisProps;

        const isBottom = !props.vertical && props.orient === "bottom";

        const scale = props.scale || props._scale;
        let axisDelegate: ReturnType<typeof axisBottom<AxisDomain>>;

        switch (props.orient) {
          case "bottom": {
            axisDelegate = axisBottom(scale as AxisScale<AxisDomain>);
            break;
          }
          case "top": {
            axisDelegate = axisTop(scale as AxisScale<AxisDomain>);
            break;
          }
          case "left": {
            axisDelegate = axisLeft(scale as AxisScale<AxisDomain>);
            break;
          }
          case "right": {
            axisDelegate = axisRight(scale as AxisScale<AxisDomain>);
            break;
          }
          default: {
            axisDelegate = axisBottom(scale as AxisScale<AxisDomain>);
            break;
          }
        }

        for (const prop of [
          "scale",
          "ticks",
          "tickValues",
          "tickSizeInner",
          "tickSizeOuter",
          "tickPadding",
          "tickFormat",
          "tickSize",
        ]) {
          if (props[prop] !== undefined) {
            const axisMethod = (axisDelegate as unknown as Record<string, unknown>)[prop];
            if (typeof axisMethod !== "function") {
              throw new Error(`axis: "${prop}" not available`);
            }
            (axisMethod as (value: unknown) => void)(props[prop]);
          }
        }

        if (props._scale) {
          axisDelegate.scale(props._scale);
        }

        const group = selection
          .selectGroup("sszvis-axis")
          .classed("sszvis-axis", true)
          .classed("sszvis-axis--top", !props.vertical && props.orient === "top")
          .classed("sszvis-axis--bottom", isBottom)
          .classed("sszvis-axis--vertical", Boolean(props.vertical))
          .attr("transform", translateString(0, props.yOffset || 0))
          .call(axisDelegate);

        group.attr("fill", null).attr("font-size", null).attr("font-family", null);
        // .attr("text-anchor", null);

        const axisScale = axisDelegate.scale();

        // Create selections here which will be used later for many custom configurations
        // Note: Inconstiant: This is only valid so long as new .tick groups or tick label texts
        // are not being added after these selections are constructed. If that changes, these
        // selections need to be re-constructed.
        const tickGroups = group.selectAll("g.tick");
        const tickTexts = tickGroups.selectAll("text");

        // To prevent anti-aliasing on elements that need to be rendered crisply
        // we need to position them on a half-pixel grid: 0.5, 1.5, 2.5, etc.
        // We can't translate the whole .tick group, however, because this
        // leads to weird type rendering artefacts in some browsers. That's
        // why we reach into the group and translate lines onto the half-pixel
        // grid by taking the translation of the group into account.
        tickGroups.each(function () {
          const element = this as Element;
          const transform = element.getAttribute("transform");
          if (transform) {
            const subpixelShift = transformTranslateSubpixelShift(transform);
            const dx = halfPixel(0) - subpixelShift[0];
            const dy = halfPixel(isBottom ? 2 : 0) + subpixelShift[1];
            select(this).select("line").attr("transform", translateString(dx, dy));
          }
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
        const rangeExtent = range(axisScale);
        tickGroups.selectAll("line").each(function (d) {
          const pos = axisScale(d as AxisDomain) as number,
            d3this = select(this);
          const min = rangeExtent[0] ?? 0;
          const max = rangeExtent[1] ?? 0;
          d3this.classed(
            "hidden",
            !d3this.classed("sszvis-axis__longtick") &&
              (absDistance(pos, min) < (props.hideBorderTickThreshold || 0) ||
                absDistance(pos, max) < (props.hideBorderTickThreshold || 0))
          );
        });

        if (fn.defined(props.tickLength)) {
          const domain = axisScale.domain();
          // Handle both numeric and string domains for extent calculation
          const domainExtent =
            domain.length > 0 ? [domain[0], domain[domain.length - 1]] : [undefined, undefined];
          const ticks = tickGroups.filter(
            (d) =>
              domainExtent[0] !== undefined &&
              domainExtent[1] !== undefined &&
              !fn.stringEqual(d as AxisDomain, domainExtent[0]) &&
              !fn.stringEqual(d as AxisDomain, domainExtent[1])
          );
          const orientation = props.orient;

          let longLinePadding = 2;
          if (orientation === "left" || orientation === "right") {
            ticks.selectAll("text").each(function () {
              const element = this as Element;
              if (element && "getBoundingClientRect" in element) {
                longLinePadding = Math.max(
                  (element as HTMLElement).getBoundingClientRect().width,
                  longLinePadding
                );
              }
            });
            longLinePadding += 2; // a lil' extra on the end
          }

          const lines = ticks
            .selectAll("line.sszvis-axis__longtick")
            .data([0])
            .join("line")
            .classed("sszvis-axis__longtick", true);

          if (props.tickLength > longLinePadding) {
            switch (orientation) {
              case "top": {
                lines.attr("y1", longLinePadding).attr("y2", props.tickLength);

                break;
              }
              case "bottom": {
                lines.attr("y1", -longLinePadding).attr("y2", -props.tickLength);

                break;
              }
              case "left": {
                lines.attr("x1", -longLinePadding).attr("x2", -props.tickLength);

                break;
              }
              case "right": {
                lines.attr("x1", longLinePadding).attr("x2", props.tickLength);

                break;
              }
              // No default
            }
          } else {
            lines.remove();
          }
        }

        if (props.alignOuterLabels) {
          const alignmentBounds = range(axisScale);
          const min = alignmentBounds[0];
          const max = alignmentBounds[1];

          tickTexts.style("text-anchor", (d) => {
            const value = axisScale(d as AxisDomain) as number;
            const minVal = min ?? 0;
            const maxVal = max ?? 0;
            if (absDistance(value, minVal) < TICK_END_THRESHOLD) {
              return "start";
            } else if (absDistance(value, maxVal) < TICK_END_THRESHOLD) {
              return "end";
            }
            return "middle";
          });
        }

        if (fn.defined(props.textWrap)) {
          tickTexts.call(textWrap, props.textWrap);
        }

        if (props.slant && props.orient && slantLabel[props.orient]?.[props.slant]) {
          tickTexts.call(slantLabel[props.orient][props.slant]);
        }

        // Highlight axis labels that return true for props.highlightTick.
        if (props.highlightTick) {
          const activeBounds: BoundingBoxWithNode[] = [];
          const passiveBounds: BoundingBoxWithNode[] = [];

          tickTexts
            .classed("hidden", false)
            .classed("active", (d) => props.highlightTick?.(d as AxisDomain) || false);

          // Hide axis labels that overlap with highlighted labels unless
          // the labels are slanted (in which case the bounding boxes overlap)
          if ((props.hideLabelThreshold || 0) > 0 && !props.slant) {
            tickTexts.each(function (d) {
              // although getBoundingClientRect returns coordinates relative to the window, not the document,
              // this should still work, since all tick bounds are affected equally by scroll position changes.
              const element = this as HTMLElement;
              if (element && "getBoundingClientRect" in element) {
                const bcr = element.getBoundingClientRect();
                const b = {
                  node: this,
                  bounds: {
                    top: bcr.top,
                    right: bcr.right,
                    bottom: bcr.bottom,
                    left: bcr.left,
                  },
                };
                if (props.highlightTick?.(d as AxisDomain)) {
                  b.bounds.left -= props.hideLabelThreshold || 0;
                  b.bounds.right += props.hideLabelThreshold || 0;
                  activeBounds.push(b);
                } else {
                  passiveBounds.push(b);
                }
              }
            });

            for (const active of activeBounds) {
              for (const passive of passiveBounds) {
                select(passive.node).classed(
                  "hidden",
                  boundsOverlap(passive.bounds, active.bounds)
                );
              }
            }
          }
        }

        if (props.title) {
          const title = group
            .selectAll(".sszvis-axis__title")
            .data([props.title])
            .join("text")
            .classed("sszvis-axis__title", true);

          title
            .text((d) => d)
            .attr("transform", () => {
              const orient = props.orient,
                axisScaleExtent = range(axisScale);

              const titleProps = props.titleCenter
                ? {
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
                    vertical: !!props.titleVertical,
                  }
                : {
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
                    vertical: !!props.titleVertical,
                  };

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
            .style("text-anchor", () => {
              const orient = props.orient;
              if (props.titleAnchor === undefined) {
                switch (orient) {
                  case "left": {
                    return "end";
                  }
                  case "right": {
                    return "start";
                  }
                  case "top":
                  case "bottom": {
                    return "end";
                  }
                  default: {
                    return "end";
                  }
                }
              } else {
                return props.titleAnchor;
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
            const g = select(this);
            const textNode = g.select("text").node() as Element;
            let textContour = g.select(".sszvis-axis__label-contour");
            if (textContour.empty() && textNode && "cloneNode" in textNode) {
              const clonedNode = textNode.cloneNode(true);
              textContour = select(clonedNode as BaseType).classed(
                "sszvis-axis__label-contour",
                true
              );
              const parent = this as Element;
              const contourNode = textContour.node();
              if (
                parent &&
                "insertBefore" in parent &&
                contourNode &&
                contourNode instanceof Node
              ) {
                parent.insertBefore(contourNode, textNode);
              }
            }
            if (textNode && "textContent" in textNode) {
              const textElement = textNode as HTMLElement;
              textContour.text(textElement.textContent || "");
            }
          });
        }
      })
  );
}

const setOrdinalTicks = function (this: AxisComponent, count: number): number {
  // in this function, the 'this' context should be an sszvis.axis
  const domain = this.scale().domain(),
    values: AxisDomain[] = [],
    step = Math.round(domain.length / count);

  // include the first value
  if (domain[0] !== undefined) values.push(domain[0] as AxisDomain);
  for (let i = step, l = domain.length; i < l - 1; i += step) {
    if (domain[i] !== undefined) values.push(domain[i] as AxisDomain);
  }
  // include the last value
  if (domain[domain.length - 1] !== "undefined")
    values.push(domain[domain.length - 1] as AxisDomain);

  this.tickValues(values);

  return count;
};

export const axisX = () =>
  axis()
    .yOffset(2) //gap between chart and x-axis
    .ticks(3)
    .tickSizeInner(4)
    .tickSizeOuter(6.5)
    .tickPadding(6)
    .tickFormat(fn.arity(1, formatNumber));

axisX.time = () =>
  axisX()
    .tickFormat(formatAxisTimeFormat as (d: AxisDomain) => string | null)
    .alignOuterLabels(true);

axisX.ordinal = () =>
  axisX()
    // extend this class a little with a custom implementation of 'ticks'
    // that allows you to set a custom number of ticks,
    // including the first and last value in the ordinal scale
    .prop("ticks", setOrdinalTicks)
    .tickFormat(formatText);

// need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
axisX.pyramid = () =>
  axisX()
    .ticks(10)
    .prop("scale", function (this: AxisComponent, s: AxisScale<AxisDomain>) {
      const extended = (
        s as unknown as {
          copy(): AxisScale<AxisDomain>;
          domain(): AxisDomain[];
          range(): number[];
        }
      ).copy();

      const extendedDomain = (extended as unknown as { domain(): AxisDomain[] }).domain();
      const extendedRange = (extended as unknown as { range(): number[] }).range();

      // Mirror the domain and range for pyramid display
      const mirroredDomain = [-extendedDomain[1] as number, extendedDomain[1] as number];
      const mirroredRange = [
        extendedRange[0] - extendedRange[1],
        extendedRange[0] + extendedRange[1],
      ];

      // Apply mirrored domain and range using type assertion to bypass strict typing
      (extended as unknown as Record<string, (value: unknown) => AxisScale<AxisDomain>>).domain(
        mirroredDomain
      );
      (extended as unknown as Record<string, (value: unknown) => AxisScale<AxisDomain>>).range(
        mirroredRange
      );

      (this as unknown as AxisProps)._scale = extended;
      return extended;
    })
    .tickFormat((v: AxisDomain) =>
      // this tick format means that the axis appears to be divergent around 0
      // when in fact it is -domain[1] -> +domain[1]
      formatNumber(Math.abs(v as number))
    );

export const axisY = (): AxisComponent => {
  const newAxis: AxisComponent = axis()
    .ticks(6)
    .tickSizeInner(0)
    .tickSizeOuter(0)
    .tickPadding(0)
    .tickFormat((d: AxisDomain): string | null =>
      0 === d && !newAxis.showZeroY() ? null : formatNumber(d as number)
    )
    .vertical(true);
  return newAxis;
};

axisY.time = () => axisY().tickFormat(formatAxisTimeFormat as (d: AxisDomain) => string | null);

axisY.ordinal = () =>
  axisY()
    // add custom 'ticks' function
    .prop("ticks", setOrdinalTicks)
    .tickFormat(formatText);

/* Helper functions
----------------------------------------------- */

function absDistance(a: number, b: number): number {
  return Math.abs(a - b);
}

function boundsOverlap(boundsA: BoundingBox, boundsB: BoundingBox): boolean {
  return !(
    boundsB.left > boundsA.right ||
    boundsB.right < boundsA.left ||
    boundsB.top > boundsA.bottom ||
    boundsB.bottom < boundsA.top
  );
}

type SlantFunction = (selection: Selection<BaseType, unknown, BaseType, unknown>) => void;

interface SlantLabelConfig {
  horizontal: SlantFunction;
  vertical: SlantFunction;
  diagonal: SlantFunction;
}

const slantLabel: Record<AxisOrientation, SlantLabelConfig> = {
  top: {
    horizontal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("dy", "0.71em")
        .attr("transform", null);
    },
    vertical(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "0.35em") // vertically-center
        .attr("transform", "rotate(-90)");
    },
    diagonal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "start")
        .attr("dx", "0.1em")
        .attr("dy", "0.1em")
        .attr("transform", "translate(-0.5) rotate(-45)");
    },
  },
  bottom: {
    horizontal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("dy", "0.71em")
        .attr("transform", null);
    },
    vertical(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "end")
        .attr("dx", "-1em")
        .attr("dy", "-0.75em")
        .attr("transform", "rotate(-90)");
    },
    diagonal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0em")
        .attr("transform", "rotate(-45)");
    },
  },
  left: {
    horizontal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("dy", "0.71em")
        .attr("transform", null);
    },
    vertical(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "0em")
        .attr("dy", "0.35em")
        .attr("transform", "rotate(-90)");
    },
    diagonal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0em")
        .attr("transform", "rotate(-45)");
    },
  },
  right: {
    horizontal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "-0.5")
        .attr("dy", "0.71em")
        .attr("transform", null);
    },
    vertical(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "middle")
        .attr("dx", "0em")
        .attr("dy", "0.35em")
        .attr("transform", "rotate(-90)");
    },
    diagonal(selection: Selection<BaseType, unknown, BaseType, unknown>) {
      selection
        .style("text-anchor", "start")
        .attr("dx", "0.1em")
        .attr("dy", "0.1em")
        .attr("transform", "rotate(-45)");
    },
  },
};
