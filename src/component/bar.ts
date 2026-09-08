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
 * @template T The type of the data values bound to the bars
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
 *                                            the pyramid chart. Entries beyond the first two are ignored, and an array
 *                                            with fewer than two entries produces a NaN coordinate rather than a warning.
 * @property {boolean} transition             Whether or not to transition the geometry of the bar component when it
 *                                            changes. Defaults to true, and eases over 300ms.
 *
 * Note: entering bars receive their geometry on the join, before the transition starts, so they
 * appear in place rather than animating up from nothing. Only updates animate. fill and stroke are
 * deliberately not transitioned - a colour change jumps - because the colour scales these charts
 * use are categorical and interpolating between two category colours reads as a third category.
 *
 * Note: the geometry accessors are guarded: x, y, width and height must be finite numbers, so NaN,
 * Infinity, undefined, null and anything that does not coerce to a finite number all become 0. A
 * value that does coerce is normalised to its number, so a numeric string is written as a number.
 * See test/component/bar.test.ts.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

/**
 * Every visual property is wrapped by fn.functor on set, so it is always stored as a
 * function by the time the renderer reads it. The result stays `unknown` because the
 * geometry guard accepts anything and coerces it, a numeric string or a boolean included.
 */
type ValueAccessor<T> = (datum?: T, index?: number) => unknown;

/**
 * fill and stroke resolve to a colour, or to nothing - either because the accessor returned
 * nothing, or because the property was never set at all, in which case the prop itself is
 * undefined. d3 removes the attribute for null and undefined alike.
 */
type ColorAccessor<T> = (datum?: T, index?: number) => string | null | undefined;

type BarProps<T> = {
  x: ValueAccessor<T>;
  y: ValueAccessor<T>;
  width: ValueAccessor<T>;
  height: ValueAccessor<T>;
  fill?: ColorAccessor<T>;
  stroke?: ColorAccessor<T>;
  centerTooltip?: boolean;
  tooltipAnchor?: (number | string)[];
  transition: boolean;
};

/**
 * A constant or an accessor over the component's datum type; either is accepted, since
 * fn.functor normalises both. d3 hands an accessor the datum and its index, and declaring
 * fewer parameters is fine.
 */
type BarValue<T, R> = R | ((datum: T, index: number) => R);

export interface BarComponent<T = unknown> extends ComponentBuilder<BarComponent<T>> {
  x(): ValueAccessor<T>;
  x<U = T>(value: BarValue<U, number>): BarComponent<T>;
  y(): ValueAccessor<T>;
  y<U = T>(value: BarValue<U, number>): BarComponent<T>;
  width(): ValueAccessor<T>;
  width<U = T>(value: BarValue<U, number>): BarComponent<T>;
  height(): ValueAccessor<T>;
  height<U = T>(value: BarValue<U, number>): BarComponent<T>;
  fill(): ColorAccessor<T> | undefined;
  fill<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
  stroke(): ColorAccessor<T> | undefined;
  stroke<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
  centerTooltip(): boolean | undefined;
  centerTooltip(center: boolean): BarComponent<T>;
  tooltipAnchor(): (number | string)[] | undefined;
  tooltipAnchor(anchor: (number | string)[]): BarComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): BarComponent<T>;
}

/**
 * Coerces a geometry value to a finite number, substituting 0 for anything else.
 *
 * Coercion first, so a numeric string still works; the finiteness check then catches NaN
 * and Infinity as well as the values that do not coerce at all. Shared in substance with
 * dot's guard - the two components are expected to agree, and there is no home for the
 * helper short of a new module.
 */
function toFinite(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function bar<T = unknown>(): BarComponent<T> {
  return component<BarComponent<T>>()
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
    .render(function (this: Element, data: T[]) {
      const selection = select(this);
      const props = selection.props<BarProps<T>>();

      const xAt = (datum: T, index: number) => toFinite(props.x(datum, index));
      const yAt = (datum: T, index: number) => toFinite(props.y(datum, index));
      const wAt = (datum: T, index: number) => toFinite(props.width(datum, index));
      const hAt = (datum: T, index: number) => toFinite(props.height(datum, index));
      const fillAt = (datum: T, index: number) => props.fill?.(datum, index) ?? null;
      const strokeAt = (datum: T, index: number) => props.stroke?.(datum, index) ?? null;

      // Entering bars are given their geometry on the join, so they are in place before any
      // transition starts. The geometry is then applied exactly once more - to the transition
      // when there is one, and to the plain selection otherwise - so an update tweens from its
      // previous value instead of from the value it already holds.
      //
      // Matching on the component's own class rather than the generic .sszvis-bar one keeps a
      // foreign rect out of the join - groupedBars draws rects under the generic class, and the
      // join has no key function, so an unscoped descendant selector would adopt one of those,
      // or one left over from an earlier chart, as bar zero and shift the whole series by one.
      // The generic class stays on the node, so no CSS selector changes meaning.
      const bars = selection
        .selectAll<SVGRectElement, T>("rect.sszvis-bar-rect")
        .data(data)
        .join((enter) =>
          enter
            .append("rect")
            .attr("class", "sszvis-bar sszvis-bar-rect")
            .attr("x", xAt)
            .attr("y", yAt)
            .attr("width", wAt)
            .attr("height", hAt)
        )
        .attr("fill", fillAt)
        .attr("stroke", strokeAt);

      if (props.transition) {
        bars
          .transition(defaultTransition())
          .attr("x", xAt)
          .attr("y", yAt)
          .attr("width", wAt)
          .attr("height", hAt);
      } else {
        bars.attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt);
      }

      // Tooltip anchors
      let tooltipPosition: (datum: T, index: number) => [number, number];
      if (props.centerTooltip) {
        tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i) + hAt(d, i) / 2];
      } else if (props.tooltipAnchor) {
        const uv = props.tooltipAnchor.map((value) => Number.parseFloat(String(value)));
        tooltipPosition = (d, i) => [xAt(d, i) + uv[0] * wAt(d, i), yAt(d, i) + uv[1] * hAt(d, i)];
      } else {
        tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i)];
      }

      const ta = tooltipAnchor<T>().position(tooltipPosition);

      selection.call(ta);
    });
}
