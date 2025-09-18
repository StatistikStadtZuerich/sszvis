/**
 * Tooltip annotation
 *
 * Use this component to add a tooltip to the document. The tooltip component should be
 * called on a selection of [data-tooltip-anchor], which contain the information necessary to
 * position the tooltip and provide it with data. The tooltip's visibility should be toggled
 * using the .visible property, passing a predicate function. Tooltips will be displayed
 * when .visible returns true.
 *
 * @module sszvis/annotation/tooltip
 *
 * @property {seletion} renderInto      Provide a selection container into which to render the tooltip.
 *                                      Unlike most other components, the tooltip isn't rendered directly into the selection
 *                                      on which it is called. Instead, it's rendered into whichever selection is
 *                                      passed to the renderInto option
 * @property {function} visible         Provide a predicate function which accepts a datum and determines whether the associated
 *                                      tooltip should be visible. (default: false)
 * @property {function} header          A function accepting a datum. The result becomes the header of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 * @property {function} body            A function accepting a datum. The result becomes the body of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 *                                      - an array of arrays, which produces a tabular layout where each
 *                                      sub-array is one row in the table.
 * @property {function} orientation     A string or function returning a string which determines the orientation. This determines
 *                                      which direction the tooltip sits relative to its point.
 *                                      Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right).
 *                                      Default is "bottom".
 * @property {number} dx                A number for the x-offset of the tooltip
 * @property {number} dy                A number for the y-offset of the tooltip
 * @property {function} opacity         A function or number which determines the opacity of the tooltip. Default is 1.
 *
 * @return {sszvis.component}
 *
 */

import { select } from "d3";
import { component } from "../d3-component.js";
import * as fn from "../fn.js";

/* Configuration
----------------------------------------------- */
const SMALL_CORNER_RADIUS = 3;
const LARGE_CORNER_RADIUS = 4;
const TIP_SIZE = 6;
const BLUR_PADDING = 5;

/* Exported module
----------------------------------------------- */
export default function () {
  const renderer = tooltipRenderer();

  return component()
    .delegate("header", renderer)
    .delegate("body", renderer)
    .delegate("orientation", renderer)
    .delegate("dx", renderer)
    .delegate("dy", renderer)
    .delegate("opacity", renderer)
    .prop("renderInto")
    .prop("visible", fn.functor)
    .visible(false)
    .renderSelection((selection) => {
      const props = selection.props();
      const intoBCR = props.renderInto.node().getBoundingClientRect();

      const tooltipData = [];
      selection.each(function (d) {
        if (props.visible(d)) {
          const thisBCR = this.getBoundingClientRect();
          const pos = [thisBCR.left - intoBCR.left, thisBCR.top - intoBCR.top];
          tooltipData.push({
            datum: d,
            x: pos[0],
            y: pos[1],
          });
        }
      });

      props.renderInto.datum(tooltipData).call(renderer);
    });
}

/**
 * Tooltip renderer
 * @private
 */
const tooltipRenderer = function () {
  return component()
    .prop("header")
    .prop("body")
    .prop("orientation", fn.functor)
    .orientation("bottom")
    .prop("dx", fn.functor)
    .dx(1)
    .prop("dy", fn.functor)
    .dy(1)
    .prop("opacity", fn.functor)
    .opacity(1)
    .renderSelection((selection) => {
      const tooltipData = selection.datum();
      const props = selection.props();

      const isDef = fn.defined;
      const isSmall =
        (isDef(props.header) && !isDef(props.body)) || (!isDef(props.header) && isDef(props.body));

      // Select tooltip elements

      const tooltip = selection.selectAll(".sszvis-tooltip").data(tooltipData).join("div");

      tooltip
        .style("pointer-events", "none")
        .style("opacity", props.opacity)
        .style("padding-top", (d) => (props.orientation(d) === "top" ? TIP_SIZE + "px" : null))
        .style("padding-right", (d) => (props.orientation(d) === "right" ? TIP_SIZE + "px" : null))
        .style("padding-bottom", (d) =>
          props.orientation(d) === "bottom" ? TIP_SIZE + "px" : null
        )
        .style("padding-left", (d) => (props.orientation(d) === "left" ? TIP_SIZE + "px" : null))
        .classed("sszvis-tooltip", true);

      // Enter: tooltip background

      const enterBackground = tooltip
        .selectAll(".sszvis-tooltip__background")
        .data([0])
        .join("svg")
        .attr("class", "sszvis-tooltip__background")
        .attr("height", 0)
        .attr("width", 0);

      const enterBackgroundPath = enterBackground.selectAll("path").data([0]).join("path");

      if (supportsSVGFilters()) {
        const filter = enterBackground
          .selectAll("filter")
          .data([0])
          .join("filter")
          .attr("id", "sszvisTooltipShadowFilter")
          .attr("height", "150%");

        filter
          .selectAll("feGaussianBlur")
          .data([0])
          .join("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 2);

        filter
          .selectAll("feComponentTransfer")
          .data([0])
          .join("feComponentTransfer")
          .selectAll("feFuncA")
          .data([0])
          .join("feFuncA")
          .attr("type", "linear")
          .attr("slope", 0.2);

        const merge = filter.selectAll("feMerge").data([0]).join("feMerge");
        merge.selectAll("feMergeNode").data([0]).join("feMergeNode"); // Contains the blurred image
        merge
          .selectAll("feMergeNode")
          .data([0])
          .join("feMergeNode") // Contains the element that the filter is applied to
          .attr("in", "SourceGraphic");

        enterBackgroundPath.attr("filter", "url(#sszvisTooltipShadowFilter)");
      } else {
        enterBackground.classed("sszvis-tooltip__background--fallback", true);
      }

      // Enter: tooltip content

      const enterContent = tooltip
        .selectAll(".sszvis-tooltip__content")
        .data([0])
        .join("div")
        .classed("sszvis-tooltip__content", true);

      enterContent
        .selectAll(".sszvis-tooltip__header")
        .data([0])
        .join("div")
        .classed("sszvis-tooltip__header", true);

      enterContent
        .selectAll(".sszvis-tooltip__body")
        .data([0])
        .join("div")
        .classed("sszvis-tooltip__body", true);

      // Update: content

      tooltip
        .select(".sszvis-tooltip__header")
        .datum(fn.prop("datum"))
        .html(props.header || fn.functor(""));

      tooltip
        .select(".sszvis-tooltip__body")
        .datum(fn.prop("datum"))
        .html((d) => {
          const body = props.body ? fn.functor(props.body)(d) : "";
          return Array.isArray(body) ? formatTable(body) : body;
        });

      selection
        .selectAll(".sszvis-tooltip")
        .classed("sszvis-tooltip--small", isSmall)
        .each(function (d) {
          const tip = select(this);
          // only using dimensions.width and dimensions.height here. Not affected by scroll position
          const dimensions = tip.node().getBoundingClientRect();
          const orientation = Reflect.apply(props.orientation, this, arguments);

          // Position tooltip element

          switch (orientation) {
            case "top": {
              tip
                .style("left", d.x - dimensions.width / 2 + "px")
                .style("top", d.y + props.dy(d) + "px");
              break;
            }
            case "bottom": {
              tip
                .style("left", d.x - dimensions.width / 2 + "px")
                .style("top", d.y - props.dy(d) - dimensions.height + "px");
              break;
            }
            case "left": {
              tip
                .style("left", d.x + props.dx(d) + "px")
                .style("top", d.y - dimensions.height / 2 + "px");
              break;
            }
            case "right": {
              tip
                .style("left", d.x - props.dx(d) - dimensions.width + "px")
                .style("top", d.y - dimensions.height / 2 + "px");
              break;
            }
          }

          // Position background element

          const bgHeight = dimensions.height + 2 * BLUR_PADDING;
          const bgWidth = dimensions.width + 2 * BLUR_PADDING;
          tip
            .select(".sszvis-tooltip__background")
            .attr("height", bgHeight)
            .attr("width", bgWidth)
            .style("left", -BLUR_PADDING + "px")
            .style("top", -BLUR_PADDING + "px")
            .select("path")
            .attr(
              "d",
              tooltipBackgroundGenerator(
                [BLUR_PADDING, BLUR_PADDING],
                [bgWidth - BLUR_PADDING, bgHeight - BLUR_PADDING],
                orientation,
                isSmall ? SMALL_CORNER_RADIUS : LARGE_CORNER_RADIUS
              )
            );
        });
    });
};

/**
 * formatTable
 */
function formatTable(rows) {
  const tableBody = rows
    .map((row) => "<tr>" + row.map((cell) => "<td>" + cell + "</td>").join("") + "</tr>")
    .join("");
  return '<table class="sszvis-tooltip__body__table">' + tableBody + "</table>";
}

function x(d) {
  return d[0];
}
function y(d) {
  return d[1];
}
function side(cx, cy, x0, y0, x1, y1, showTip) {
  const mx = x0 + (x1 - x0) / 2;
  const my = y0 + (y1 - y0) / 2;

  const corner = ["Q", cx, cy, x0, y0];

  let tip = [];
  if (showTip && y0 === y1) {
    tip =
      x0 < x1
        ? // Top
          ["L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my]
        : // Bottom
          ["L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my];
  } else if (showTip && x0 === x1) {
    tip =
      y0 < y1
        ? // Right
          ["L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE]
        : // Left
          ["L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE];
  }

  const end = ["L", x1, y1];

  return [...corner, ...tip, ...end];
}

/**
 * Tooltip background generator
 *
 * Generates a path description with a tip on the specified side.
 *
 *           top
 *         ________
 *   left |        | right
 *        |___  ___|
 *            \/
 *          bottom
 *
 * @param  {Vector} a           Top-left corner of the tooltip rectangle (x, y)
 * @param  {Vector} b           Bottom-right corner of the tooltip rectangle (x, y)
 * @param  {String} orientation The tip will point in this direction (top, right, bottom, left)
 *
 * @return {Path}               SVG path description
 */
function tooltipBackgroundGenerator(a, b, orientation, radius) {
  switch (orientation) {
    case "top": {
      a[1] = a[1] + TIP_SIZE;
      break;
    }
    case "bottom": {
      b[1] = b[1] - TIP_SIZE;
      break;
    }
    case "left": {
      a[0] = a[0] + TIP_SIZE;
      break;
    }
    case "right": {
      b[0] = b[0] - TIP_SIZE;
      break;
    }
  }

  return [
    // Start
    ["M", x(a), y(a) + radius],
    // Top side
    side(x(a), y(a), x(a) + radius, y(a), x(b) - radius, y(a), orientation === "top"),
    // Right side
    side(x(b), y(a), x(b), y(a) + radius, x(b), y(b) - radius, orientation === "right"),
    // Bottom side
    side(x(b), y(b), x(b) - radius, y(b), x(a) + radius, y(b), orientation === "bottom"),
    // Left side
    side(x(a), y(b), x(a), y(b) - radius, x(a), y(a) + radius, orientation === "left"),
  ]
    .map((d) => d.join(" "))
    .join(" ");
}

/**
 * Detect whether the current browser supports SVG filters
 */
function supportsSVGFilters() {
  return (
    window["SVGFEColorMatrixElement"] !== undefined &&
    SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE == 2
  );
}
