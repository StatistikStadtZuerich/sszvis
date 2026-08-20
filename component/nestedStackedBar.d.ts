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
 * `offset`, `xScale`, `yScale`, `xAcc` and `tooltip` are required; `fill`, `xLabel` and
 * `slant` are optional. None of the required props is defaulted or validated, so omitting one
 * fails at render time with a low-level TypeError rather than a message naming the prop.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the x-axis values, i.e. the domain of the x-scale
 *
 * @property {function} offset              Required. Positions the nested groups. Receives the whole
 *                                          stack layout of a group and returns an x-offset in pixels.
 * @property {function} xScale              Required. A band scale for the stack layout. Used to position
 *                                          the stacks and, via its bandwidth, to size the bars. Must be a
 *                                          band scale: `bandwidth()` is called on it directly.
 * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
 *                                          used to position each stack, and to place the x-axis at yScale(0).
 * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
 *                                          anchors of every nested group in one selection.
 * @property {function} xAcc                Required. An x-accessor, called with the datum of the first slice
 *                                          of the group. Its only use is to write the value into the
 *                                          `data-nested-stacked-bars` attribute; it takes no part in
 *                                          positioning. The return value is stringified into that attribute,
 *                                          so any string or number works.
 * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
 *                                          attribute is written at all and the rectangles fall back to the
 *                                          SVG/CSS default.
 * @property {function} xLabel              Optional, but non-functional - see below.
 * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
 *                                          "diagonal"). Unset leaves them upright. The only prop that is not
 *                                          wrapped in fn.functor.
 *
 * Note: several behaviours of this component are not guessable from its props. `ticks(1)` is
 * hardcoded on the axis, and `axisX.ordinal` reads that as "first and last domain value plus
 * one in between", so with three or more x-categories the middle tick labels silently
 * disappear. The axis is placed at `yScale(0)`, which a linear scale extrapolates past the end
 * of its range, so a y-domain that excludes 0 pushes the axis of every group off the chart
 * without warning. The bars inherit the #FFFFFF separator stroke that stackedBarVertical
 * defaults to, and this component does not expose `stroke`, so it cannot be changed or
 * removed. `xLabel` is wrapped in fn.functor while `axis.title()` expects a string, so the
 * wrapper is stringified into the title text - neither a string nor a function produces the
 * intended label, and the prop cannot be set at all in its current form. The
 * `data-nested-stacked-bars` attribute holds `xAcc(d[0][0].data)`, the x-value of the group's
 * first slice, which is the same for every group and therefore cannot identify the group it
 * names; the same unguarded reach throws for a nested group with no stacks. The group
 * transform is interpolated as `translate(${offset(d)} 0)` with no guard, so an offset scale
 * miss writes the invalid `translate(undefined 0)`. See test/component/nestedStackedBar.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ScaleBand } from "d3";
import { type SlantDirection } from "../axis.js";
import { type Component } from "../d3-component.js";
import type { AnySelection } from "../types.js";
/**
 * One slice of a stack: the [y0, y1] pair produced by d3.stack, extended with the
 * properties that stackedBarVerticalData attaches to it.
 */
export type StackedBarSlice<T, X extends string | number = string> = [number, number] & {
    data: T;
    series: string;
    stack: X;
};
/** All slices sharing a series key, i.e. one layer of a stack layout. */
export type StackedBarSeries<T, X extends string | number = string> = StackedBarSlice<T, X>[];
/**
 * The stack layout of a single nested group, as returned by stackedBarVerticalData.
 * Callers usually tag it with the key they cascaded by, which is what `offset` reads.
 */
export type NestedStack<T, X extends string | number = string> = StackedBarSeries<T, X>[];
/**
 * Setters take `<U = T>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface NestedStackedBarsVerticalComponent<T = unknown, X extends string | number = string> extends Component {
    offset(): (datum: NestedStack<T, X>) => number | undefined;
    offset<U = NestedStack<T, X>>(accessor: (datum: U) => number | undefined): this;
    xScale(): ScaleBand<X>;
    xScale(scale: ScaleBand<X>): this;
    yScale(): (value: number) => number;
    yScale(scale: (value: number) => number): this;
    fill(): string | ((slice: StackedBarSlice<T, X>) => string);
    fill<U = StackedBarSlice<T, X>>(value: string | ((slice: U) => string)): this;
    tooltip(): (selection: AnySelection) => void;
    tooltip(tooltip: (selection: AnySelection) => void): this;
    xAcc(): (datum: T) => X;
    xAcc<U = T>(accessor: (datum: U) => X): this;
    xLabel(): (() => string) | undefined;
    xLabel(label: string | (() => string)): this;
    slant(): SlantDirection | undefined;
    slant(direction: SlantDirection): this;
}
export declare const nestedStackedBarsVertical: <T = unknown, X extends string | number = string>() => NestedStackedBarsVerticalComponent<T, X>;
//# sourceMappingURL=nestedStackedBar.d.ts.map