/**
 * Nested Stacked Bars Vertical component
 *
 * This component renders a group of vertical stacked bar charts side by side. The input data
 * is an array of stack layouts, one per nested group, each as returned by
 * stackedBarVerticalData and each tagged with the group key the caller cascaded by - `key`,
 * or `nest` under its older name. For each layout the component emits a group positioned by
 * `offset`, an ordinal x-axis, and a stackedBarVertical, and finally passes all tooltip
 * anchors of all groups to `tooltip` in a single call.
 *
 * `offset`, `xScale`, `yScale` and `tooltip` are required and are validated before anything is
 * rendered: a missing one throws an error naming the component and the property. `fill`,
 * `stroke`, `xAcc`, `xLabel` and `slant` are optional.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the x-axis values, i.e. the domain of the x-scale
 *
 * @property {function} offset              Required. Positions the nested groups. Receives the whole
 *                                          stack layout of a group and returns an x-offset in pixels.
 *                                          An offset that is not a finite number is reported with a
 *                                          console warning and treated as 0, so the group still gets a
 *                                          valid transform instead of one the renderer discards.
 * @property {function} xScale              Required. A band scale for the stack layout. Used to position
 *                                          the stacks and, via its bandwidth, to size the bars. Must be a
 *                                          band scale: `bandwidth()` is called on it directly.
 * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
 *                                          used to position each stack, and to place the x-axis at the
 *                                          baseline. The baseline is `yScale(0)` clamped into the scale's
 *                                          own range, so a y-domain that excludes 0 keeps the axis inside
 *                                          the plotting area; clamping is reported with a console warning.
 *                                          A scale without a `range()` (for instance a constant boxed by
 *                                          fn.functor) is used as-is.
 * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
 *                                          anchors of every nested group in one selection.
 * @property {function} xAcc                Optional and never read. An x-accessor over a slice datum,
 *                                          kept so that the existing call sites keep working: the nested
 *                                          groups are labelled from their own nest key instead.
 *                                          Deprecated; a major version will remove it.
 * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
 *                                          attribute is written at all and the rectangles fall back to the
 *                                          SVG/CSS default.
 * @property {string, function} stroke      Optional. Forwarded to stackedBarVertical, which defaults it to
 *                                          #FFFFFF so that the stack segments are separated by a white
 *                                          line. Pass "none" for seamless stacks.
 * @property {string, function} xLabel      Optional. The title of the nested x-axis. A function is
 *                                          evaluated before the axis renders it; unset means no title.
 * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
 *                                          "diagonal"). Unset leaves them upright. The only prop that is not
 *                                          wrapped in fn.functor.
 *
 * Each nested group carries its group key in `data-nested-stacked-bars`, read from the `key`
 * field of its own stack layout, or from `nest` where the caller used that name - the same key
 * `offset` reads. The field is a declared part of the layout type rather than an untyped tag,
 * but it is not required: a layout with neither name is reported with a console warning and
 * falls back to the group's index for its label, so the group still renders. `offset` is the
 * caller's own functor and can position a group from anything it likes, the key included, so a
 * missing key does not by itself stop a group being placed. A nested group with no stacks is
 * likewise reported with a console warning and rendered as an empty group rather than taking
 * the whole chart down.
 *
 * @return {sszvis.component}
 */

import { type ScaleBand, select } from "d3";
import { axisX, type SlantDirection } from "../axis.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import translateString from "../svgUtils/translateString.js";
import type { AnySelection } from "../types.js";
import type { StackedBarSeriesData, StackedBarSlice } from "./stackedBar.js";
import { stackedBarVertical } from "./stackedBar.js";

// The slice and series types are stackedBar's own - this component renders through
// stackedBarVertical, so a second declaration here could only drift from it, and did: it
// still said `data: T` after stackedBar narrowed it to `T | undefined` for a stack that
// carries no row for a series.
export type { StackedBarSeries, StackedBarSlice } from "./stackedBar.js";

/**
 * The stack layout of a single nested group, as returned by stackedBarVerticalData, tagged
 * with the key the caller cascaded by. The key is what `offset` usually reads and what labels
 * the group; `key` is its name, `nest` an accepted alias. Both are optional, and a layout
 * carrying neither is warned about and labelled by its index.
 */
export type NestedStack<T, X extends string | number = string> = StackedBarSeriesData<T, X>;

/** The group key of a layout: `key`, or `nest` under its older name. */
function nestKey(layout: { key?: string | number; nest?: string | number }) {
  return layout.key ?? layout.nest;
}

/**
 * The props as the renderer sees them. Everything except `slant` is wrapped by fn.functor
 * on set, so a scale or accessor is stored unchanged while a constant becomes a function
 * returning it.
 */
type NestedStackedBarsProps<T, X extends string | number> = {
  offset: (datum: NestedStack<T, X>) => number | undefined;
  xScale: ScaleBand<X>;
  yScale: (value: number) => number;
  fill: string | ((slice: StackedBarSlice<T, X>) => string);
  stroke:
    | string
    | null
    | undefined
    | ((slice: StackedBarSlice<T, X>, index: number) => string | undefined);
  tooltip: (selection: AnySelection) => void;
  /** Accepted and ignored; see the module JSDoc. */
  xAcc?: (datum: T) => X;
  xLabel?: () => string | undefined;
  slant?: SlantDirection;
};

/**
 * Setters take `<U = T>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface NestedStackedBarsVerticalComponent<T = unknown, X extends string | number = string>
  extends ComponentBuilder<NestedStackedBarsVerticalComponent<T, X>> {
  offset(): (datum: NestedStack<T, X>) => number | undefined;
  offset<U = NestedStack<T, X>>(accessor: (datum: U) => number | undefined): this;
  xScale(): ScaleBand<X>;
  xScale(scale: ScaleBand<X>): this;
  yScale(): (value: number) => number;
  yScale(scale: (value: number) => number): this;
  fill(): string | ((slice: StackedBarSlice<T, X>) => string);
  fill<U = StackedBarSlice<T, X>>(value: string | ((slice: U) => string)): this;
  stroke():
    | string
    | null
    | undefined
    | ((slice: StackedBarSlice<T, X>, index: number) => string | undefined);
  stroke<U = StackedBarSlice<T, X>>(
    value: string | null | undefined | ((slice: U, index: number) => string | undefined)
  ): this;
  tooltip(): (selection: AnySelection) => void;
  tooltip(tooltip: (selection: AnySelection) => void): this;
  /** @deprecated Never read. The nested groups are labelled from their own nest key. */
  xAcc(): ((datum: T) => X) | undefined;
  /** @deprecated Never read. The nested groups are labelled from their own nest key. */
  xAcc<U = T>(accessor: (datum: U) => X): this;
  xLabel(): (() => string | undefined) | undefined;
  xLabel(label: string | (() => string)): this;
  slant(): SlantDirection | undefined;
  slant(direction: SlantDirection): this;
}

/** Reports a required property the caller left unset, naming it. */
function required<V>(value: V | undefined, name: string): V {
  if (value === undefined) {
    throw new Error(`[nestedStackedBarsVertical] the ${name} property is required`);
  }
  return value;
}

/**
 * The y-coordinate of the x-axis: `yScale(0)`, kept inside the scale's own range so that a
 * y-domain excluding 0 - which a linear scale extrapolates past the end of its range - does not
 * push the axis out of the plotting area. Warns when it has to clamp. A scale that exposes no
 * `range()` cannot be checked, so its value is used unchanged.
 */
function baseline(yScale: (value: number) => number): number {
  const zero = yScale(0);
  const scaleRange = Reflect.get(yScale, "range");
  if (typeof scaleRange !== "function") return zero;
  const extent = (scaleRange.call(yScale) as number[]).filter((v) => Number.isFinite(v));
  if (extent.length < 2) return zero;
  const low = Math.min(...extent);
  const high = Math.max(...extent);
  if (zero >= low && zero <= high) return zero;
  const clamped = zero < low ? low : high;
  logger.warn(
    `[nestedStackedBarsVertical] the y-scale baseline ${zero} falls outside its range [${low}, ${high}]; placing the x-axis at ${clamped}`
  );
  return clamped;
}

export default function nestedStackedBarsVertical<
  T = unknown,
  X extends string | number = string,
>(): NestedStackedBarsVerticalComponent<T, X> {
  return component<NestedStackedBarsVerticalComponent<T, X>>()
    .prop("offset", fn.functor)
    .prop("xScale", fn.functor)
    .prop("yScale", fn.functor)
    .prop("fill", fn.functor)
    .prop("stroke")
    .prop("tooltip", fn.functor)
    .prop("xAcc", fn.functor)
    .prop("xLabel", fn.functor)
    .prop("slant")
    .render(function (this: Element, data: NestedStack<T, X>[]) {
      const selection = select(this);
      const props = selection.props<NestedStackedBarsProps<T, X>>();

      const offset = required(props.offset, "offset");
      const xScale = required(props.xScale, "xScale");
      const yScale = required(props.yScale, "yScale");
      const tooltip = required(props.tooltip, "tooltip");
      const { fill, stroke, xLabel } = props;

      const xAxis = axisX
        .ordinal()
        .scale(xScale)
        .tickSize(0)
        .orient("bottom")
        .slant(props.slant)
        // xLabel is wrapped by fn.functor, so it is always a function here; the axis binds its
        // title as text data and never calls it, so evaluate it first.
        .title(xLabel?.());

      const group = selection.selectAll("[data-nested-stacked-bars]").data(data);

      const nestedGroups = group.join("g").attr("data-nested-stacked-bars", (d, i) => {
        if (d.length === 0) {
          logger.warn(
            `[nestedStackedBarsVertical] the nested group at index ${i} has no stacks; rendering it empty`
          );
        }
        const key = nestKey(d);
        if (key === undefined) {
          logger.warn(
            `[nestedStackedBarsVertical] the nested group at index ${i} has no key; labelling it by index`
          );
          return i;
        }
        return key;
      });

      nestedGroups.attr("transform", (d) => {
        const x = offset(d);
        if (!Number.isFinite(x)) {
          logger.warn(
            `[nestedStackedBarsVertical] the offset accessor returned ${x}; positioning the group at 0`
          );
        }
        return translateString(Number.isFinite(x) ? (x as number) : 0, 0);
      });

      nestedGroups
        .selectGroup("nested-x-axis")
        .attr("transform", translateString(0, baseline(yScale)))
        .call(xAxis);

      const stackedBars = stackedBarVertical()
        .xScale(xScale)
        .width(xScale.bandwidth())
        .yScale(yScale)
        .fill(fill)
        .stroke(stroke);

      const bars = nestedGroups.selectGroup("barchart").call(stackedBars);

      bars.selectAll("[data-tooltip-anchor]").call(tooltip);
    });
}
