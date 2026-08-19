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
 * Note: the transition property does not currently animate anything - the geometry is
 * re-applied to the plain selection immediately after the transition is created, so the
 * values always jump. See test/component/bar.test.ts.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

/**
 * Every visual property is wrapped by fn.functor on set, so it is always stored as a
 * function by the time the renderer reads it.
 */
type ValueAccessor = (...args: unknown[]) => unknown;

/**
 * fill and stroke resolve to a colour, or to nothing when the property was never set -
 * fn.functor then yields undefined, which d3 treats exactly like null and removes the
 * attribute for.
 */
type ColorAccessor = (...args: unknown[]) => string | null;

type BarProps = {
  x: ValueAccessor;
  y: ValueAccessor;
  width: ValueAccessor;
  height: ValueAccessor;
  fill: ColorAccessor;
  stroke: ColorAccessor;
  centerTooltip?: boolean;
  tooltipAnchor?: (number | string)[];
  transition: boolean;
};

/** A constant or an accessor; either is accepted, since fn.functor normalises both. */
type BarValue<R> = R | ((...args: never[]) => R);

export interface BarComponent extends Component {
  x(): ValueAccessor;
  x(value: BarValue<number>): BarComponent;
  y(): ValueAccessor;
  y(value: BarValue<number>): BarComponent;
  width(): ValueAccessor;
  width(value: BarValue<number>): BarComponent;
  height(): ValueAccessor;
  height(value: BarValue<number>): BarComponent;
  fill(): ColorAccessor;
  fill(value: BarValue<string | undefined>): BarComponent;
  stroke(): ColorAccessor;
  stroke(value: BarValue<string | undefined>): BarComponent;
  centerTooltip(): boolean | undefined;
  centerTooltip(center: boolean): BarComponent;
  tooltipAnchor(): (number | string)[] | undefined;
  tooltipAnchor(anchor: (number | string)[]): BarComponent;
  transition(): boolean;
  transition(enabled: boolean): BarComponent;
}

/**
 * Replaces NaN values with 0.
 *
 * Equivalent to the global isNaN, which coerces its argument first. Note that this only
 * catches NaN and undefined: null, Infinity, booleans and numeric strings all coerce to a
 * number and pass through untouched. See test/component/bar.test.ts.
 */
function handleMissingVal(v: unknown): unknown {
  return Number.isNaN(Number(v)) ? 0 : v;
}

export default function (): BarComponent {
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
    .render(function (this: Element, data: unknown[]) {
      const selection = select(this);
      const props = selection.props<BarProps>();

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
      let tooltipPosition: (d: unknown) => [number, number];
      if (props.centerTooltip) {
        tooltipPosition = (d) => [xAcc(d) + wAcc(d) / 2, yAcc(d) + hAcc(d) / 2];
      } else if (props.tooltipAnchor) {
        const uv = props.tooltipAnchor.map((value) => Number.parseFloat(String(value)));
        tooltipPosition = (d) => [xAcc(d) + uv[0] * wAcc(d), yAcc(d) + uv[1] * hAcc(d)];
      } else {
        tooltipPosition = (d) => [xAcc(d) + wAcc(d) / 2, yAcc(d)];
      }

      const ta = tooltipAnchor().position(tooltipPosition);

      selection.call(ta);
    });
}
