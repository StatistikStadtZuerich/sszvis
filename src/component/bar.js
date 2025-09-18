/**
 * Bar component
 *
 * The bar component is a general-purpose component used to render rectangles, including
 * bars for horizontal and vertical standard and stacked bar charts, bars in the population
 * pyramids, and the boxes of the heat table.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single rectangle. The x-position, y-position, width, and height of each rectangle
 * are then extracted from the data objects using accessor functions.
 *
 * In addition, the user can specify fill and stroke accessor functions. When called, these functions
 * are given each rectangle's data object, and should return a valid fill or stroke color to be applied
 * to the rectangle.
 *
 * The x, y, width, height, fill, and stroke properties may also be specified as constants.
 *
 * @module sszvis/component/bar
 *
 * @property {number, function} x             the x-value of the rectangles. Becomes a functor.
 * @property {number, function} y             the y-value of the rectangles. Becomes a functor.
 * @property {number, function} width         the width-value of the rectangles. Becomes a functor.
 * @property {number, function} height        the height-value of the rectangles. Becomes a functor.
 * @property {string, function} fill          the fill-value of the rectangles. Becomes a functor.
 * @property {string, function} stroke        the stroke-value of the rectangles. Becomes a functor.
 * @property {boolean} centerTooltip          Whether or not to center the tooltip anchor within the bar.
 *                                            The default tooltip anchor position is at the top of the bar,
 *                                            centered in the width dimension. When this property is true,
 *                                            the tooltip anchor will also be centered in the height dimension.
 * @property {Array<Number>} tooltipAnchor    Where, relative to the box formed by the bar, to position the tooltip
 *                                            anchor. This property is overriden if centerTooltip is true. The
 *                                            value should be a two-element array, [x, y], where x is the position (in 0 - 1)
 *                                            of the tooltip in the width dimension, and y is the position (also range 0 - 1)
 *                                            in the height dimension. For example, the upper left corner would be [0, 0],
 *                                            the center of the bar would be [0.5, 0.5], the middle of the right side
 *                                            would be [1, 0.5], and the lower right corner [1, 1]. Used by, for example,
 *                                            the pyramid chart.
 * @property {boolean} transition             Whether or not to transition the visual values of the bar component, when they
 *                                            are changed.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

// replaces NaN values with 0
function handleMissingVal(v) {
  return isNaN(v) ? 0 : v;
}

export default function () {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("width", fn.functor)
    .prop("height", fn.functor)
    .prop("fill", fn.functor)
    .prop("stroke", fn.functor)
    .prop("centerTooltip")
    .prop("tooltipAnchor")
    .prop("transition")
    .transition(true)
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      const xAcc = fn.compose(handleMissingVal, props.x);
      const yAcc = fn.compose(handleMissingVal, props.y);
      const wAcc = fn.compose(handleMissingVal, props.width);
      const hAcc = fn.compose(handleMissingVal, props.height);

      const bars = selection
        .selectAll(".sszvis-bar")
        .data(data)
        .join("rect")
        .classed("sszvis-bar", true)
        .attr("x", xAcc)
        .attr("y", yAcc)
        .attr("width", wAcc)
        .attr("height", hAcc)
        .attr("fill", props.fill)
        .attr("stroke", props.stroke);

      if (props.transition) {
        bars.transition(defaultTransition());
      }

      bars.attr("x", xAcc).attr("y", yAcc).attr("width", wAcc).attr("height", hAcc);

      // Tooltip anchors
      let tooltipPosition;
      if (props.centerTooltip) {
        tooltipPosition = function (d) {
          return [xAcc(d) + wAcc(d) / 2, yAcc(d) + hAcc(d) / 2];
        };
      } else if (props.tooltipAnchor) {
        const uv = props.tooltipAnchor.map(Number.parseFloat);
        tooltipPosition = function (d) {
          return [xAcc(d) + uv[0] * wAcc(d), yAcc(d) + uv[1] * hAcc(d)];
        };
      } else {
        tooltipPosition = function (d) {
          return [xAcc(d) + wAcc(d) / 2, yAcc(d)];
        };
      }

      const ta = tooltipAnchor().position(tooltipPosition);

      selection.call(ta);
    });
}
