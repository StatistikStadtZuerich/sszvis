/**
 * Nested Stacked Bars Vertical component
 *
 * This component renders a group of vertical stacked bar charts side by side. The input data
 * is an array of stack layouts, one per nested group, each as returned by
 * stackedBarVerticalData; callers usually tag every layout with the key they cascaded by so
 * that `offset` can read it. For each layout the component emits a group positioned by
 * `offset`, an ordinal x-axis, and a stackedBarVertical, and finally passes all tooltip
 * anchors of all groups to `tooltip` in a single call.
 *
 * `offset`, `xScale`, `yScale`, `xAcc` and `tooltip` are required and are validated before
 * anything is rendered: a missing one throws an error naming the component and the property.
 * `fill`, `stroke`, `xLabel` and `slant` are optional.
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
 * @property {function} xAcc                Required. An x-accessor over a slice datum. Kept for backwards
 *                                          compatibility and validated, but no longer read: the nested
 *                                          groups are labelled from their own nest key. Deprecation
 *                                          candidate.
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
 * Each nested group carries its nest key in `data-nested-stacked-bars`, taken from the `nest`
 * property callers tag the stack layout with (the same key `offset` reads), and falling back to
 * the group's index when the layout is untagged. A nested group with no stacks is reported with
 * a console warning and rendered as an empty group rather than taking the whole chart down.
 *
 * @return {sszvis.component}
 */
import { type ScaleBand } from "d3";
import { type SlantDirection } from "../axis.js";
import { type ComponentBuilder } from "../d3-component.js";
import type { AnySelection } from "../types.js";
import type { StackedBarSeries, StackedBarSlice } from "./stackedBar.js";
export type { StackedBarSeries, StackedBarSlice } from "./stackedBar.js";
/**
 * The stack layout of a single nested group, as returned by stackedBarVerticalData.
 * Callers usually tag it with the key they cascaded by, which is what `offset` reads.
 */
export type NestedStack<T, X extends string | number = string> = StackedBarSeries<T, X>[] & {
    /** The key the caller cascaded by, used to position and to label the group. */
    nest?: string | number;
};
/**
 * Setters take `<U = T>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface NestedStackedBarsVerticalComponent<T = unknown, X extends string | number = string> extends ComponentBuilder<NestedStackedBarsVerticalComponent<T, X>> {
    offset(): (datum: NestedStack<T, X>) => number | undefined;
    offset<U = NestedStack<T, X>>(accessor: (datum: U) => number | undefined): this;
    xScale(): ScaleBand<X>;
    xScale(scale: ScaleBand<X>): this;
    yScale(): (value: number) => number;
    yScale(scale: (value: number) => number): this;
    fill(): string | ((slice: StackedBarSlice<T, X>) => string);
    fill<U = StackedBarSlice<T, X>>(value: string | ((slice: U) => string)): this;
    stroke(): string | null | undefined | ((slice: StackedBarSlice<T, X>, index: number) => string | undefined);
    stroke<U = StackedBarSlice<T, X>>(value: string | null | undefined | ((slice: U, index: number) => string | undefined)): this;
    tooltip(): (selection: AnySelection) => void;
    tooltip(tooltip: (selection: AnySelection) => void): this;
    xAcc(): (datum: T) => X;
    xAcc<U = T>(accessor: (datum: U) => X): this;
    xLabel(): (() => string | undefined) | undefined;
    xLabel(label: string | (() => string)): this;
    slant(): SlantDirection | undefined;
    slant(direction: SlantDirection): this;
}
export declare const nestedStackedBarsVertical: <T = unknown, X extends string | number = string>() => NestedStackedBarsVerticalComponent<T, X>;
//# sourceMappingURL=nestedStackedBar.d.ts.map