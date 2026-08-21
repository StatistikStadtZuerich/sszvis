/**
 * Stacked Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is the output of stackedPyramidData(sideAcc, rowAcc,
 * seriesAcc, valueAcc), which returns a function over a flat array of rows. Each accessor is called
 * with one source row: sideAcc groups the rows into the sides of the pyramid, rowAcc into the
 * vertical positions within a side, seriesAcc into the layers of each row's stack, and valueAcc
 * supplies the number that is stacked.
 *
 * The result is an array of sides, each an array of the series d3.stack produced for that side,
 * each series an array of the [y0, y1] slices it computed - so a slice is addressed as
 * data[side][series][row], and the caller picks the two sides positionally. Every slice carries
 * five properties beyond its pair: its `series` key, its `side` as the side accessor returned it,
 * its `row`, its own `value`, and its `data`, narrowed from the whole grouped row to the single
 * source row the slice was computed from. d3's own `key` and `index` are carried across onto each
 * series. The largest stacked total across both sides is attached to the returned array as
 * `maxValue`, which is what the horizontal scale's domain is built from. The rows passed in are not
 * modified.
 *
 * The component always creates four sub-groups, in this order: leftStack, rightStack, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint over the
 * bars, and the reference groups are created even when no reference accessor is configured. Within
 * a side each series gets its own group, marked with a [data-sszvis-stack] attribute and no class -
 * stackedBar uses a .sszvis-stack class for the same job - and is drawn by its own bar component,
 * the left one mirrored across the spine. Both sides are pushed outwards by SPINE_PADDING, so a one
 * pixel gap runs down the middle of the chart, and every bar dimension is read from the same
 * accessors on both sides.
 *
 * @module sszvis/component/stackedPyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of one row of the input data, i.e. of a slice's `data`
 * @template S The type the side accessor returns, i.e. of a slice's `side`
 *
 * @property {string, function} [barFill]     The color of a bar. Defaults to #000 and applies to
 *                                            both sides; a per-datum accessor is the usual way to
 *                                            colour the series. It is composed with the slice's
 *                                            `data`, so it reads a source row rather than a slice,
 *                                            and fn.compose forwards d3's arguments only to the
 *                                            innermost function, so it is called with that row
 *                                            alone.
 * @property {number, function} barHeight     The height of a bar. Required, but omitting it is not
 *                                            reported: it is the one dimension handed straight to
 *                                            bar, so the value reaches bar's missing-value guard as
 *                                            undefined and becomes 0, and the chart renders an
 *                                            empty axis frame with no bars and no warning. Of the
 *                                            three required dimensions only this one fails
 *                                            silently. Shared with pyramid.
 * @property {number, function} barWidth      The width of a bar. Required, and an unset prop throws
 *                                            a TypeError from the component's own closure, because
 *                                            the component computes both the x and the width of
 *                                            every bar itself. It is called with one of the numbers
 *                                            out of a slice's [y0, y1] pair rather than with the
 *                                            slice, so it has to be a scale over stacked values and
 *                                            not an accessor over data - pyramid calls the same
 *                                            property with the bar's datum, and an accessor written
 *                                            for pyramid reads properties off a number here and
 *                                            yields NaN, which bar's guard turns into 0. It is also
 *                                            called without d3's index and group, so an index-aware
 *                                            or node-aware accessor collapses every width and every
 *                                            x to 0 on both sides; pyramid has the same omission on
 *                                            its left side only. A constant is accepted and is
 *                                            worse than an error: the width is computed as
 *                                            barWidth(d[1]) - barWidth(d[0]), so a constant
 *                                            subtracts itself and every segment disappears while
 *                                            still being positioned at the constant offset.
 * @property {number, function} barPosition   The vertical position of a bar, i.e. its top edge.
 *                                            Required, and an unset prop throws too, but from
 *                                            inside fn.compose ("Cannot read properties of
 *                                            undefined (reading 'call')") rather than from the
 *                                            component's own closure the way barWidth does. Both
 *                                            surface while bar is applying its attributes. It is
 *                                            called with the slice's `row`, which is that row's
 *                                            index within its side and not the value the row
 *                                            accessor returned, and with nothing else, so an
 *                                            index-aware accessor yields NaN and bar's guard
 *                                            flattens it to 0.
 * @property {Array<number>} [tooltipAnchor]  The anchor position for the tooltips. Uses
 *                                            sszvis.component.bar.tooltipAnchor under the hood to
 *                                            optionally reposition the tooltip anchors in the
 *                                            pyramid chart. Default value is [0.5, 0.5], which
 *                                            centers tooltips on the bars. The value is handed to
 *                                            both bars unchanged rather than being mirrored, and
 *                                            bar measures from its own upper left corner, which on
 *                                            the left side is a segment's outer edge, so any x
 *                                            other than 0.5 lands on visually opposite sides of the
 *                                            pyramid. An array with fewer than two entries yields a
 *                                            NaN coordinate, as documented on bar; the component
 *                                            adds no validation of its own. Shared with pyramid.
 * @property {function} leftAccessor          Data for the left side, i.e. a function picking one
 *                                            side out of the layout - the sides are an array, so
 *                                            docs/population-pyramid/pyramid-stacked.js uses
 *                                            prop("0") and prop("1"). Required: an unset accessor
 *                                            throws "props.leftAccessor is not a function" from the
 *                                            renderer, and an accessor that returns undefined or
 *                                            null throws from d3's data join instead, with a
 *                                            message that names neither the property nor the
 *                                            component.
 * @property {function} rightAccessor         Data for the right side. Same requirements as
 *                                            leftAccessor.
 * @property {function} [leftRefAccessor]     Reference data for the left side, drawn as a single
 *                                            path outlining the reference series. The elements are
 *                                            handed to barWidth for x and to barPosition for y, so
 *                                            they have to be plain numbers. Optional, but the guard
 *                                            tests whether the accessor was set, not what it
 *                                            returns: an accessor that yields undefined or null for
 *                                            some states throws instead of hiding the line.
 *                                            Returning an empty array does hide it, though the
 *                                            classed path element stays in the DOM with no d
 *                                            attribute, where CSS and hit tests can still find it.
 * @property {function} [rightRefAccessor]    Reference data for the right side. Same as
 *                                            leftRefAccessor.
 *
 * Note: a side's series keys are read off that side's first row alone, with Object.keys, so a
 * series absent from the first row is dropped from the whole side and its values appear neither in
 * the chart nor in maxValue - stackedBarData takes the union of the keys across every row instead.
 * The stack value is then read as x[key][0] with no guard, so a later row that is missing one of
 * the first row's keys dies on an undefined cell with a TypeError. Between them the two mean every
 * row of a side has to carry every series and the first row decides which, so callers with sparse
 * data have to pad it with zero rows.
 *
 * Note: a slice's `row` is the position of its row within the side, not the value the row accessor
 * returned, and that index is what the component feeds to barPosition. It lines up with the data
 * only when the row values happen to be a dense zero-based range, which is what
 * docs/population-pyramid/pyramid-stacked.js relies on: it builds its position scale over
 * d3.range(0, 101) and its ages happen to run from 0 to 100. The source row still knows its real
 * value; only the tag on the slice is an index.
 *
 * Note: the cascade groups on String(key) - for the sides, the rows and the series alike - so keys
 * that differ only in type merge, and the number 1 and the string "1" land in the same cell where
 * only the first of them is stacked. The ordering follows from the same coercion: JavaScript
 * iterates array-index keys in ascending numeric order regardless of insertion order, so dense
 * non-negative integer rows sort themselves, which is what makes the index-as-position quirk above
 * survivable, while negative, fractional or plain string rows fall back to insertion order and are
 * laid out in whatever order the input happened to be in. The sides are ordered the same way and
 * picked positionally, so a dataset whose first row is male puts men on the left and silently
 * mirrors the chart. For the series the key order is the stacking order, so a series accessor
 * returning years or numeric codes restacks the chart in ascending numeric order, and the `series`
 * tag comes back as a string even when the accessor returned a number. Nothing enforces the
 * cardinality of two the layout function's own documentation requires of the side accessor either:
 * a single side leaves the right accessor returning undefined, which throws from d3's data join,
 * and a third side is returned and then dropped without a word by the caller's positional
 * accessors. Shared with stackedBarData.
 *
 * Note: the value of a cell is read from its first row only, so data that is not already aggregated
 * to one row per (side, row, series) triplet is silently truncated rather than summed. The layout
 * function requires the triplet to appear exactly once and says it makes no effort to normalize the
 * data if that is not the case, but nothing reports a violation. Shared with stackedBarData.
 *
 * Note: `maxValue` is hung off the returned array rather than wrapped in an object, so any array
 * operation - a spread, a map, a filter, a trip through JSON - drops it. It is the maximum of the
 * upper bounds only, so it is not the extent of the data when a value is negative, and it is
 * undefined rather than 0 for an empty layout, where it coerces to NaN in the scale domain the
 * examples feed it into, so the scale maps every value to NaN and the axis draws its domain line
 * with no ticks at all. A slice's `value` is a convenience of the same kind:
 * the component never reads it, and it duplicates d[1] - d[0] as it stood when the layout ran, so
 * it goes stale if a caller rewrites the pair. Shared with stackedBarData. See
 * test/component/stackedPyramid.test.ts.
 *
 * Note: the reference lines cannot be drawn in the coordinate system the bars use. The line
 * generator is d3.line().x(barWidth).y(barPosition), so both props are called with the same
 * reference element, while in the bars barWidth is called with a stacked value and barPosition with
 * a row index. No element satisfies both: a series of stacked values gives an x that is right and a
 * y that is as many rows down as the value is large. d3.line also calls its x accessor as (d, i,
 * data), so barWidth receives the index on the line and nowhere else, which leaves one property
 * with two calling conventions as well as two coordinate systems. The only stackedPyramid example
 * sets neither reference accessor; the reference-line example uses the plain pyramid instead, where
 * both props read the datum and the problem does not arise.
 *
 * Note: two smaller mismatches ride along, both of them shared with pyramid. The bars are pushed
 * outwards by SPINE_PADDING, a deliberate cosmetic gap at the spine, while the line is drawn
 * straight from barWidth and so agrees with the axis scale, which puts a reference value equal to a
 * bar value half a pixel inside that bar's outer edge, symmetrically on both sides. And the line
 * takes its y from barPosition alone and never accounts for barHeight, so the outline runs along
 * the bars' top edges rather than their mid-lines, half a bar height above the values it describes.
 *
 * Note: a reference line's d attribute is only ever written through a transition, so a freshly
 * rendered path carries no geometry until the first animation frame and anything that measures the
 * chart synchronously - getBBox, a snapshot, an export to PNG - sees an empty path. Entering lines
 * then snap into place, because d3 has no previous d to interpolate from; only updates animate. The
 * bars underneath do not animate at all - bar's transition property is inert - so on a state change
 * the outline eases towards its new position while the bars jump, and the two visibly detach for
 * the length of the transition. bar also guards every geometry value against NaN while the line
 * hands barWidth and barPosition straight to d3.line, so one missing value poisons the path string
 * and the browser renders the valid prefix and drops the rest of the outline. All of this is shared
 * with pyramid.
 *
 * Note: the reference path is classed .sszvis-path, which no rule in sszvis.css defines - its
 * appearance comes from four inlined attributes instead, the opposite choice from pyramid, which
 * sets only .sszvis-pyramid__referenceline and takes all four values from the stylesheet. The class
 * collides with the one pie, stackedArea and stackedAreaMultiples use for their own paths, so a
 * selector written for any of those also matches a stackedPyramid reference line, and since the
 * join has no key function a foreign path that happens to carry the class is adopted as the
 * reference line and repainted rather than left alone. That is harmless while each component owns
 * its own selectGroup, which is how every example is written.
 *
 * Note: the reference datum is wrapped in an array, one array of points per path, so each side is
 * capped at a single line and, while a reference accessor is set, the join always has exactly one
 * element and the exit selection can never fire: once a line has been rendered its path element
 * stays in the DOM even after the reference data goes away, with only its d attribute dropped. Only
 * removing the accessor itself empties the group. The mirror property writes transform="" on the
 * right side rather than omitting the attribute. Shared with pyramid.
 *
 * Note: the stack join is selectAll("[data-sszvis-stack]"), a descendant selector rather than a
 * child selector, so a stack group nested at any depth below a side's group is captured alongside
 * the direct children. The exit selection then removes a legitimate series group, and the reorder
 * that follows has to sort a selection in which one element is an ancestor of another, so d3 throws
 * a HierarchyRequestError and aborts the whole render rather than just that side. A child selector
 * would make it unreachable. Nothing nests stack groups today, so reaching it needs a caller to
 * have put something of its own inside one. stackedBar's version of the same unscoped selector only
 * re-binds.
 *
 * Note: neither join uses a key function, so on a re-render the stack groups and the rects inside
 * them are matched by index rather than by series. When a series is dropped from anywhere but the
 * end, the groups that remain are re-bound to different series and every bar in them is rewritten.
 * Only the geometry moves, so it is invisible, but any state held on a stack group - a class, a
 * listener, an in-flight transition - follows the position rather than the series. Shared with
 * stackedBar.
 *
 * Note: bar defaults its transition property to true and this component neither sets it nor exposes
 * it, so every render creates a d3 transition per rect and then overwrites the geometry on the
 * plain selection immediately. Nothing animates, but the transition state is still attached and
 * interrupts any transition already running on those rects. Shared with stackedBar. The component
 * also leaves bar's stroke unset, so unlike stackedBar, which paints a 1px white separator between
 * segments, the segments of a row touch without a seam.
 *
 * Note: bar guards NaN but not negative numbers. A negative stacked value inverts the pair, so the
 * width goes negative, which the browser rejects and the segment is not drawn, and on the left side
 * the double sign flip moves x to the right of the spine. Neither side of the pyramid supports
 * values below the baseline. Reaching this needs negative input data, which a population pyramid
 * should not see. See test/component/stackedPyramid.test.ts.
 *
 * @return {sszvis.component}
 */
import { type SeriesPoint } from "d3";
import { type Component, type PropertySetter, type RenderCallback, type SelectionRenderCallback } from "../d3-component.js";
/**
 * One slice of a stack: the [y0, y1] point d3.stack produced, with `data` narrowed from the
 * whole cascade row to the single row the slice was computed from, and tagged with the
 * series, the side and the row it belongs to. It is d3's own SeriesPoint, which is why it is
 * an Array rather than a two-element tuple.
 */
export type StackedPyramidSlice<T, S extends string | number = string> = SeriesPoint<T> & {
    /** The series key the slice belongs to. */
    series: string;
    /** The side the slice belongs to, as the side accessor returned it. */
    side: S;
    /** The position of the slice's row within its side - an index, not the row's own value. */
    row: number;
    /** The slice's own value, i.e. d[1] - d[0] as it was when the layout ran. */
    value: number;
};
/** All slices sharing a series key, i.e. one layer of one side's stack, as d3 hands it over. */
export type StackedPyramidSeries<T, S extends string | number = string> = StackedPyramidSlice<T, S>[] & {
    key: string;
    index: number;
};
/** One side of the pyramid: the series d3.stack produced for it. */
export type StackedPyramidSide<T, S extends string | number = string> = StackedPyramidSeries<T, S>[];
/**
 * What stackedPyramidData returns: the sides, with the largest stacked total across both of
 * them hung off the array itself rather than wrapped in an object.
 */
export type StackedPyramidLayout<T, S extends string | number = string> = StackedPyramidSide<T, S>[] & {
    maxValue: number | undefined;
};
/**
 * This function prepares the data for the stackedPyramid component
 *
 * The input data is expected to have at least four columns:
 *
 *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
 *  - row: determines on which row (vertical position) the value goes.
 *  - series: determines in which series (for the stack) the value is.
 *  - value: the numerical value.
 *
 * The combination of each distinct (side,row,series) triplet MUST appear only once
 * in the data. This function makes no effort to normalize the data if that's not the case.
 */
export declare function stackedPyramidData<T, S extends string | number = string>(sideAcc: (datum: T) => S, _rowAcc: (datum: T) => string | number, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number): (data: T[]) => StackedPyramidLayout<T, S>;
/**
 * How barWidth reads back once it is stored. It is wrapped by fn.functor on set, so it is
 * always a function by the time the renderer reads it, and the component calls it with one of
 * the numbers out of a slice's [y0, y1] pair - never with the slice itself. Both parameters
 * are optional because a constant becomes a functor that ignores its arguments, and because
 * the component passes neither d3's index nor its group.
 */
type StoredWidth = (value?: number, index?: number) => number;
/**
 * How barPosition reads back. In the bars it is called with a slice's row index; on a
 * reference line d3.line calls it with the reference element itself, which is why a reference
 * series has to be an array of numbers.
 */
type StoredPosition = (value?: number, index?: number) => number;
/** How barHeight reads back: unlike the other two dimensions it is handed straight to bar. */
type StoredHeight<T, S extends string | number> = (slice?: StackedPyramidSlice<T, S>, index?: number) => number;
/** How barFill reads back. It is composed with the slice's `data`, so it reads a source row. */
type StoredFill<T> = (datum?: T, index?: number) => string | undefined;
/** Pulls one side's series out of the datum bound to the chart layer. */
type SideAccessor<T, S extends string | number> = (data: StackedPyramidLayout<T, S>) => StackedPyramidSide<T, S>;
/**
 * Pulls one side's reference series out of the datum bound to the chart layer. The elements
 * are handed to barWidth for x and to barPosition for y, so they have to be plain numbers.
 */
type ReferenceAccessor<T, S extends string | number> = (data: StackedPyramidLayout<T, S>) => number[];
/** A constant or an accessor; either is accepted, since fn.functor normalises both. */
type PyramidValue<A, R> = R | ((value: A, index: number) => R);
/**
 * A constant or an accessor over a slice's source row. barFill is composed with the slice's
 * `data`, and fn.compose forwards d3's index only to the innermost function, so unlike bar's
 * own fill this one is called with the datum alone.
 */
type FillValue<U> = string | undefined | ((datum: U) => string | undefined);
/**
 * `component()` hands back whatever interface it is asked for, but the three builder methods
 * it inherits are declared as returning the plain Component, so a component interface has to
 * re-declare them to survive its own construction chain. Without this the chain's type
 * degrades to `any` at the first undeclared setter - `.barFill("#000")` resolves through
 * Component's index signature - and the interface below is then never checked against the
 * component that is actually built.
 */
interface ComponentBuilder<C extends Component> extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): C;
    render(callback: RenderCallback): C;
    renderSelection(callback: SelectionRenderCallback): C;
}
/**
 * Setters take `<U = ...>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface StackedPyramidComponent<T = unknown, S extends string | number = string> extends ComponentBuilder<StackedPyramidComponent<T, S>> {
    barHeight(): StoredHeight<T, S>;
    barHeight<U = StackedPyramidSlice<T, S>>(value: PyramidValue<U, number>): StackedPyramidComponent<T, S>;
    barWidth(): StoredWidth;
    barWidth(value: PyramidValue<number, number>): StackedPyramidComponent<T, S>;
    barPosition(): StoredPosition;
    barPosition(value: PyramidValue<number, number>): StackedPyramidComponent<T, S>;
    barFill(): StoredFill<T>;
    barFill<U = T>(value: FillValue<U>): StackedPyramidComponent<T, S>;
    tooltipAnchor(): (number | string)[];
    tooltipAnchor(anchor: (number | string)[]): StackedPyramidComponent<T, S>;
    leftAccessor(): SideAccessor<T, S>;
    leftAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => StackedPyramidSide<T, S>): StackedPyramidComponent<T, S>;
    rightAccessor(): SideAccessor<T, S>;
    rightAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => StackedPyramidSide<T, S>): StackedPyramidComponent<T, S>;
    leftRefAccessor(): ReferenceAccessor<T, S> | undefined;
    leftRefAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => number[]): StackedPyramidComponent<T, S>;
    rightRefAccessor(): ReferenceAccessor<T, S> | undefined;
    rightRefAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => number[]): StackedPyramidComponent<T, S>;
}
export declare function stackedPyramid<T = unknown, S extends string | number = string>(): StackedPyramidComponent<T, S>;
export {};
//# sourceMappingURL=stackedPyramid.d.ts.map