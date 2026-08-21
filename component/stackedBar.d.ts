/**
 * Stacked Bar components
 *
 * This module holds the vertical and the horizontal stacked bar chart, together with the two
 * data layout functions that prepare their input. Both components are variations on the same
 * concept and read the same intermediate representation of a stack, but they lay it out along
 * different dimensions, which is why there are two constructors rather than an orientation
 * property.
 *
 * The layout functions, stackedBarVerticalData and stackedBarHorizontalData, take their
 * accessors in the order (stackAcc, seriesAcc, valueAcc) and return a function over a flat
 * array of rows: stackAcc groups the rows into stacks, seriesAcc into the layers within a
 * stack, and valueAcc supplies the number that is stacked. The accessors are deliberately not
 * named after the axes, because which axis each one belongs to depends on the orientation: the
 * examples call stackedBarVerticalData(xAcc, cAcc, yAcc) but stackedBarHorizontalData(yAcc,
 * cAcc, xAcc) - see docs/bar-chart-vertical-stacked/basic.js and
 * docs/bar-chart-horizontal-stacked/basic.js.
 *
 * The result is an array of series, one per series key, each holding the [y0, y1] pairs
 * d3.stack computed, and each pair tagged with its `series`, its `stack` and, as `data`, the
 * single source row it was computed from. That array is what gets bound to the chart layer. The
 * rows passed in are not modified: the d3v3 stack layout used to write `y0` and `y` onto every
 * data object, but d3v7 returns pairs instead and leaves the source data alone.
 *
 * @module sszvis/component/stackedBar/horizontal
 * @module sszvis/component/stackedBar/vertical
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the stack values, i.e. the domain of the ordinal scale
 *
 * @property {function} xScale          Required. On a vertical chart, a band scale over the
 *                                      stack values, used to position each stack. On a
 *                                      horizontal chart, a linear scale over the stacked
 *                                      values, used for both the left edge and the width of
 *                                      every segment. Not defaulted: unset, it throws.
 * @property {function} yScale          Required, and the mirror image of xScale. On a vertical
 *                                      chart, a linear scale over the stacked values, used for
 *                                      both the top edge and the height of every segment; on a
 *                                      horizontal chart, a band scale over the stack values.
 *                                      Also not defaulted, and also throws when unset.
 * @property {number, function} width   Required by the vertical orientation, which sizes its
 *                                      bars with it - usually xScale.bandwidth(). The
 *                                      horizontal orientation computes its width from xScale
 *                                      and never reads the property. Omitting it on a vertical
 *                                      chart is not reported: every bar gets width 0.
 * @property {number, function} height  Required by the horizontal orientation, and ignored by
 *                                      the vertical one, which computes its height from yScale.
 *                                      Fails just as silently when omitted on a horizontal
 *                                      chart: every bar gets height 0.
 * @property {string, function} fill    Optional. A constant or an accessor over a slice. When
 *                                      unset, no fill attribute is written at all and the
 *                                      rectangles fall back to the SVG/CSS default.
 * @property {string, function} stroke  Optional. A constant or an accessor over a slice. When
 *                                      unset, a 1px #FFFFFF stroke separates the segments -
 *                                      centred on the bar edge, so it overpaints half a pixel
 *                                      on each side. A truthy value such as "none" replaces the
 *                                      separator, but every falsy value falls back to it, so it
 *                                      cannot be removed by null or an empty string.
 *
 * Note: the two layout functions are the same computation and differ only in the stack order,
 * i.e. in which series key ends up on the baseline. The vertical layout stacks in reverse key
 * order, so the last key sits on the baseline; the horizontal one keeps the key order, so the
 * first key does.
 *
 * Note: the value of a cell is read from its first row only, so data that is not already
 * aggregated to one row per (stack, series) pair is silently truncated rather than summed. The
 * same unguarded read throws when a stack is missing one of the series keys, so every stack has
 * to carry a row for every series - callers with sparse data have to pad it with zero rows.
 *
 * Note: the series keys come from Object.keys over the grouped data, and JavaScript orders
 * integer-like keys numerically regardless of insertion order. A series accessor returning
 * years or numeric codes therefore loses the caller's ordering, and since the key order is the
 * stacking order, the stack silently changes shape. The stacks themselves are reordered the
 * same way, which is only cosmetic, since each slice is positioned by its own stack value.
 *
 * Note: `keys` and `maxValue` are hung off the returned array rather than wrapped in an object,
 * so any array operation - a spread, a map, a filter, a trip through JSON - drops them, and
 * `keys` shadows Array.prototype.keys, which makes the layout a badly behaved array. `maxValue`
 * is the maximum of the upper bounds only, so it is not the extent of the data when a value is
 * negative, and it is undefined rather than 0 for an empty layout, which turns into a NaN axis
 * when it is fed straight into a scale domain the way the examples do.
 *
 * Note: a negative value produces a negative rect width on a horizontal chart, which the
 * browser rejects, so the segment is simply not drawn. Neither orientation supports values
 * below the baseline.
 *
 * Note: the four scale and size properties are required but neither defaulted nor validated.
 * Two of them fail silently as zero-size bars, and the two scales throw a low-level TypeError
 * that names neither the property nor the component.
 *
 * Note: the group join uses the descendant selector `.sszvis-stack` rather than a child
 * selector and no key function, so any pre-existing stack below the target group, at any depth,
 * is captured and re-bound, and surviving groups and rects are matched by index rather than by
 * series. The component also forwards neither bar's `transition` property nor its tooltip
 * anchor properties, so every render attaches a transition that is immediately discarded, and
 * the tooltip anchor is always at the top centre of a segment. See
 * test/component/stackedBar.test.ts.
 *
 * @return {sszvis.component}
 */
import { type SeriesPoint } from "d3";
import { type Component, type PropertySetter, type RenderCallback } from "../d3-component.js";
/**
 * One slice of a stack: the [y0, y1] point d3.stack produces, with `data` narrowed from the
 * whole cascade row to the single datum the slice was computed from, and tagged with the
 * series and the stack it belongs to. It is d3's own SeriesPoint, which is why it is an
 * Array rather than a two-element tuple.
 */
export type StackedBarSlice<T, X extends string | number = string> = SeriesPoint<T> & {
    /** The series key the slice belongs to. */
    series: string;
    /** The stack the slice belongs to, as the stack accessor returned it. */
    stack: X;
};
/** All slices sharing a series key, i.e. one layer of the stack, as d3 hands it over. */
export type StackedBarSeries<T, X extends string | number = string> = StackedBarSlice<T, X>[] & {
    key: string;
    index: number;
};
/**
 * What stackedBar*Data returns: the series, with the series keys and the largest stacked
 * total hung off the array itself rather than wrapped in an object.
 *
 * `keys` shadows Array.prototype.keys, so the inherited member is omitted before the
 * property is declared. Intersecting the two instead would leave the layout callable as
 * `layout.keys()`, which type-checks as the built-in iterator but throws a TypeError at
 * runtime. Omitting it costs assignability back to a plain array, which is the point: the
 * layout is not a well-behaved one. Indexing, length, the array methods, spread and for-of
 * all still work.
 */
export type StackedBarLayout<T, X extends string | number = string> = Omit<StackedBarSeries<T, X>[], "keys"> & {
    keys: string[];
    maxValue: number | undefined;
};
export declare const stackedBarHorizontalData: <T, X extends string | number = string>(_stackAcc: (datum: T) => X, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number) => (data: T[]) => StackedBarLayout<T, X>;
export declare const stackedBarVerticalData: <T, X extends string | number = string>(_stackAcc: (datum: T) => X, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number) => (data: T[]) => StackedBarLayout<T, X>;
/** A scale over the stack values - a band scale in practice, hence the undefined. */
type StackScale<X> = (value: X) => number | undefined;
/** A scale over the stacked values. */
type ValueScale = (value: number) => number;
/** A constant or an accessor over one slice; fn.functor normalises both on set. */
type SliceValue<U, R> = R | ((slice: U, index: number) => R);
/**
 * How a bar dimension reads back once it is stored: the four dimensions are wrapped by
 * fn.functor on set, so they are always functions by the time the renderer reads them. Both
 * parameters are optional because a constant becomes a functor that ignores its arguments.
 */
type StoredDimension<T, X extends string | number> = (slice?: StackedBarSlice<T, X>, index?: number) => number;
/** fill is stored exactly as set, and may be left unset, in which case no fill is written. */
type FillValue<T, X extends string | number> = SliceValue<StackedBarSlice<T, X>, string | undefined>;
/**
 * stroke is stored exactly as set. Every falsy value is accepted and means the same thing,
 * since the renderer falls back to the white default for all of them.
 */
type StrokeValue<T, X extends string | number> = string | null | undefined | ((slice: StackedBarSlice<T, X>, index: number) => string | undefined);
/**
 * `component()` hands back whatever interface it is asked for, but the two builder methods
 * it inherits are declared as returning the plain Component, so a component interface has
 * to re-declare them to survive its own construction chain.
 */
interface StackedBarBuilder<C extends Component> extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): C;
    render(callback: RenderCallback): C;
}
/**
 * Setters take `<U = ...>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface StackedBarVerticalComponent<T = unknown, X extends string | number = string> extends StackedBarBuilder<StackedBarVerticalComponent<T, X>> {
    xScale(): StackScale<X>;
    xScale<V = X>(scale: (value: V) => number | undefined): StackedBarVerticalComponent<T, X>;
    width(): StoredDimension<T, X>;
    width<U = StackedBarSlice<T, X>>(value: SliceValue<U, number>): StackedBarVerticalComponent<T, X>;
    yScale(): ValueScale;
    yScale(scale: ValueScale): StackedBarVerticalComponent<T, X>;
    height(): StoredDimension<T, X>;
    height<U = StackedBarSlice<T, X>>(value: SliceValue<U, number>): StackedBarVerticalComponent<T, X>;
    fill(): FillValue<T, X>;
    fill<U = StackedBarSlice<T, X>>(value: SliceValue<U, string | undefined>): StackedBarVerticalComponent<T, X>;
    stroke(): StrokeValue<T, X>;
    stroke<U = StackedBarSlice<T, X>>(value: string | null | undefined | ((slice: U, index: number) => string | undefined)): StackedBarVerticalComponent<T, X>;
}
export interface StackedBarHorizontalComponent<T = unknown, X extends string | number = string> extends StackedBarBuilder<StackedBarHorizontalComponent<T, X>> {
    xScale(): ValueScale;
    xScale(scale: ValueScale): StackedBarHorizontalComponent<T, X>;
    width(): StoredDimension<T, X>;
    width<U = StackedBarSlice<T, X>>(value: SliceValue<U, number>): StackedBarHorizontalComponent<T, X>;
    yScale(): StackScale<X>;
    yScale<V = X>(scale: (value: V) => number | undefined): StackedBarHorizontalComponent<T, X>;
    height(): StoredDimension<T, X>;
    height<U = StackedBarSlice<T, X>>(value: SliceValue<U, number>): StackedBarHorizontalComponent<T, X>;
    fill(): FillValue<T, X>;
    fill<U = StackedBarSlice<T, X>>(value: SliceValue<U, string | undefined>): StackedBarHorizontalComponent<T, X>;
    stroke(): StrokeValue<T, X>;
    stroke<U = StackedBarSlice<T, X>>(value: string | null | undefined | ((slice: U, index: number) => string | undefined)): StackedBarHorizontalComponent<T, X>;
}
export declare function stackedBarHorizontal<T = unknown, X extends string | number = string>(): StackedBarHorizontalComponent<T, X>;
export declare function stackedBarVertical<T = unknown, X extends string | number = string>(): StackedBarVerticalComponent<T, X>;
export {};
//# sourceMappingURL=stackedBar.d.ts.map