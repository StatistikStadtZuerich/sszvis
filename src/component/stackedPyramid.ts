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
 * source row the slice was computed from - or undefined, where the row carries no value for that
 * series and the slice is a zero-width pad. d3's own `key` and `index` are carried across onto each
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
 * @property {number, function} barWidth      The width of a bar. Required: an unset prop throws a
 *                                            named TypeError before anything is drawn, because the
 *                                            component computes both the x and the width of every
 *                                            bar itself. A function is a scale over stacked values,
 *                                            called with one of the numbers out of a slice's [y0,
 *                                            y1] pair rather than with the slice - pyramid calls
 *                                            the same property with the bar's datum, and an
 *                                            accessor written for pyramid reads properties off a
 *                                            number here and yields NaN, which bar's guard turns
 *                                            into 0. It is called without d3's index and group, so
 *                                            an index-aware or node-aware accessor collapses every
 *                                            width and every x to 0 on both sides; pyramid has the
 *                                            same omission on its left side only. A number is the
 *                                            constant width of every segment, measured from the
 *                                            spine outwards, and is the one dimension not run
 *                                            through fn.functor, so that a constant stays
 *                                            distinguishable from a scale.
 * @property {number, function} barPosition   The vertical position of a bar, i.e. its top edge.
 *                                            Required, and an unset prop throws too, but from
 *                                            inside fn.compose ("Cannot read properties of
 *                                            undefined (reading 'call')") rather than from the
 *                                            component's own closure the way barWidth does. Both
 *                                            surface while bar is applying its attributes. It is
 *                                            called with the slice's `row`, i.e. the value the
 *                                            layout's row accessor returned, so it is a scale over
 *                                            the row domain. It is called with nothing else, so an
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
 * Note: a side's series keys are the union of the series across every row of that side, in the
 * order the rows first mention them, and that order is the stacking order. A row that carries no
 * value for one of them contributes a zero slice whose `data` is undefined - the alternative would
 * be to drop the row from the layer entirely, which d3.stack does not offer. Sparse data therefore
 * needs no padding rows. Such a slice is zero-width, so nothing of it is painted and barFill is
 * not called for it: an accessor written over the source row never sees an undefined datum, and
 * does not have to guard for one.
 *
 * Note: the cascade groups on String(key) - for the sides, the rows and the series alike - so keys
 * that differ only in type merge, and the number 1 and the string "1" land in the same cell where
 * only the first of them is stacked. The ordering follows from the same coercion: JavaScript
 * iterates array-index keys in ascending numeric order regardless of insertion order, so dense
 * non-negative integer rows sort themselves, while negative, fractional or plain string rows fall
 * back to insertion order and are laid out in whatever order the input happened to be in. Since
 * barPosition receives the row's own value that ordering is cosmetic for the bars - it decides only
 * which slice is drawn first - but a `row` that is a string comes back as the accessor returned it,
 * not as the cascade's stringified key. The sides are ordered the same way and
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
 * upper bounds only, so it is not the extent of the data when a value is negative. An empty layout
 * reports 0, so a scale domain built from it stays valid. A slice's `value` is a convenience of the
 * same kind:
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
 * Note: the stack join is a child selector, ":scope > [data-sszvis-stack]", so only the groups the
 * component owns take part in it and a caller may render content of its own - including further
 * stack groups - inside a series group without the join adopting it. The bars inside each series
 * group are still joined with an unscoped selectAll(".sszvis-bar") by bar itself, so a planted
 * rect.sszvis-bar descendant is captured there. stackedBar's copy of the same descendant selector
 * on the stack groups is unfixed.
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

import {
  line as d3Line,
  stack as d3Stack,
  max,
  type Selection,
  type SeriesPoint,
  select,
} from "d3";
import { cascade } from "../cascade.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";
import bar, { type BarComponent } from "./bar.js";

/* Constants
----------------------------------------------- */
const SPINE_PADDING = 0.5;

const rowAcc = fn.prop("row");

/* Types
----------------------------------------------- */

/** One row of the cascade: every series of one row of one side, each holding that cell's data. */
type CascadeRow<T> = Record<string, T[]>;

/**
 * The first source row of a cascade row, i.e. of whichever series that row happens to carry.
 * A cascade row exists only because a source row landed in it, so there is always one.
 */
function firstCell<T>(row: CascadeRow<T>): T {
  return Object.values(row)[0][0];
}

/**
 * One slice of a stack: the [y0, y1] point d3.stack produced, with `data` narrowed from the
 * whole cascade row to the single row the slice was computed from, and tagged with the
 * series, the side and the row it belongs to. It is d3's own SeriesPoint, which is why it is
 * an Array rather than a two-element tuple. `data` is undefined on a padding slice, i.e.
 * where a row of the side carries no value for the series.
 */
export type StackedPyramidSlice<T, S extends string | number = string> = SeriesPoint<
  T | undefined
> & {
  /** The series key the slice belongs to. */
  series: string;
  /** The side the slice belongs to, as the side accessor returned it. */
  side: S;
  /** The row the slice belongs to, as the row accessor returned it. */
  row: string | number;
  /** The slice's own value, i.e. d[1] - d[0] as it was when the layout ran. */
  value: number;
};

/** All slices sharing a series key, i.e. one layer of one side's stack, as d3 hands it over. */
export type StackedPyramidSeries<T, S extends string | number = string> = StackedPyramidSlice<
  T,
  S
>[] & {
  key: string;
  index: number;
};

/** One side of the pyramid: the series d3.stack produced for it. */
export type StackedPyramidSide<T, S extends string | number = string> = StackedPyramidSeries<
  T,
  S
>[];

/**
 * What stackedPyramidData returns: the sides, with the largest stacked total across both of
 * them hung off the array itself rather than wrapped in an object.
 */
export type StackedPyramidLayout<T, S extends string | number = string> = StackedPyramidSide<
  T,
  S
>[] & {
  maxValue: number;
};

/* Data layout
----------------------------------------------- */

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
export function stackedPyramidData<T, S extends string | number = string>(
  sideAcc: (datum: T) => S,
  // cascade stringifies its keys, so a numeric row or series accessor - an age, a year, a
  // category code - groups the same way a string one does. The series keys are read back off
  // the cascade row with Object.keys, which is why `series` stays a string.
  rowValueAcc: (datum: T) => string | number,
  seriesAcc: (datum: T) => string | number,
  valueAcc: (datum: T) => number
) {
  return (data: T[]): StackedPyramidLayout<T, S> => {
    const grouped: CascadeRow<T>[][] = cascade<T>()
      .arrayBy(sideAcc)
      .arrayBy(rowValueAcc)
      .objectBy(seriesAcc)
      .apply(data);

    const sides = grouped.map((rows) => {
      // The union of the series across every row of the side, so a series that appears in
      // only some of the rows still gets a layer. The key order is the stacking order, and
      // it follows the order the rows first mention each series in.
      const keys = fn.set<string, string>(rows.flatMap((row) => Object.keys(row)));
      const side = sideAcc(firstCell(rows[0]));

      const stacks = d3Stack<CascadeRow<T>, string>()
        .keys(keys)
        // Only the first datum of each cell is read; a cell the row has no datum for
        // contributes zero.
        .value((x, key) => (x[key] === undefined ? 0 : valueAcc(x[key][0])))(rows);

      // Simplify the 'data' property. The slices themselves are the objects d3 created,
      // rewritten in place, so a caller holding one sees the new shape. The series arrays are
      // rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
      // series - have to be carried across by hand.
      return stacks.map((stack, i) => {
        const slices = stack.map((d) => {
          // A row the side's series is absent from has no source row to point at, so the
          // padding slice carries no data and a zero value.
          const datum = d.data[keys[i]]?.[0];
          return Object.assign(d, {
            data: datum,
            series: keys[i],
            side,
            // The value the row accessor returned, read off whichever series the cascade
            // row does carry - a padding slice has no source row of its own.
            row: rowValueAcc(firstCell(d.data)),
            value: datum === undefined ? 0 : valueAcc(datum),
          });
        });
        return Object.assign(slices, { key: stack.key, index: stack.index });
      });
    });

    // Compute the max value, for convenience. This value is needed to construct
    // the horizontal scale.
    const maxValue = max(sides, (s) => max(s, (rows) => max(rows, (row) => row[1]))) ?? 0;

    return Object.assign(sides, { maxValue });
  };
}

/* Component
----------------------------------------------- */

/**
 * A barWidth scale: a function from one of the numbers out of a slice's [y0, y1] pair - never
 * from the slice itself - to a distance from the spine. Both parameters are optional because
 * the component passes neither d3's index nor its group.
 */
type WidthScale = (value?: number, index?: number) => number;

/**
 * How barWidth reads back. It is the one dimension that is not run through fn.functor, because
 * a constant and a scale mean different things here: the component computes both the x and the
 * width of every bar itself, so a constant is the width of a segment while a scale maps a
 * stacked value to a distance from the spine.
 */
type StoredWidth = number | WidthScale;

/**
 * How barPosition reads back. It is called with a row - the value the layout's row accessor
 * returned - both for the bars and for the points of a reference line, so one position scale
 * over the row domain serves both.
 */
type StoredPosition = (value?: string | number, index?: number) => number;

/** How barHeight reads back: unlike the other two dimensions it is handed straight to bar. */
type StoredHeight<T, S extends string | number> = (
  slice?: StackedPyramidSlice<T, S>,
  index?: number
) => number;

/** How barFill reads back. It is called with the slice's `data`, so it reads a source row. */
type StoredFill<T> = (datum: T, index?: number) => string | undefined;

/** Pulls one side's series out of the datum bound to the chart layer. */
type SideAccessor<T, S extends string | number> = (
  data: StackedPyramidLayout<T, S>
) => StackedPyramidSide<T, S>;

/**
 * Pulls one side's reference series out of the datum bound to the chart layer. The elements
 * are handed to barWidth for x and to barPosition for y, so they have to be plain numbers.
 */
type ReferenceAccessor<T, S extends string | number> = (
  data: StackedPyramidLayout<T, S>
) => number[];

/** A constant or an accessor; either is accepted, since fn.functor normalises both. */
type PyramidValue<A, R> = R | ((value: A, index: number) => R);

/**
 * A constant or an accessor over a slice's source row. barFill is called with the slice's `data`
 * and with nothing else, so unlike bar's own fill it receives no index. A padding slice - one
 * standing for a series the row has no observation for - is zero-width, so the accessor is not
 * called for it and never has to handle a missing row.
 */
type FillValue<U> = string | undefined | ((datum: U) => string | undefined);

type StackedPyramidProps<T, S extends string | number> = {
  barHeight: StoredHeight<T, S>;
  barWidth: StoredWidth;
  barPosition: StoredPosition;
  barFill: StoredFill<T>;
  tooltipAnchor: (number | string)[];
  leftAccessor: SideAccessor<T, S>;
  rightAccessor: SideAccessor<T, S>;
  leftRefAccessor?: ReferenceAccessor<T, S>;
  rightRefAccessor?: ReferenceAccessor<T, S>;
};

/**
 * Setters take `<U = ...>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
export interface StackedPyramidComponent<T = unknown, S extends string | number = string>
  extends ComponentBuilder<StackedPyramidComponent<T, S>> {
  barHeight(): StoredHeight<T, S>;
  barHeight<U = StackedPyramidSlice<T, S>>(
    value: PyramidValue<U, number>
  ): StackedPyramidComponent<T, S>;
  barWidth(): StoredWidth;
  barWidth(value: PyramidValue<number, number>): StackedPyramidComponent<T, S>;
  barPosition(): StoredPosition;
  barPosition<U = string | number>(value: PyramidValue<U, number>): StackedPyramidComponent<T, S>;
  barFill(): StoredFill<T>;
  barFill<U = T>(value: FillValue<U>): StackedPyramidComponent<T, S>;
  tooltipAnchor(): (number | string)[];
  tooltipAnchor(anchor: (number | string)[]): StackedPyramidComponent<T, S>;
  leftAccessor(): SideAccessor<T, S>;
  leftAccessor<U = StackedPyramidLayout<T, S>>(
    accessor: (data: U) => StackedPyramidSide<T, S>
  ): StackedPyramidComponent<T, S>;
  rightAccessor(): SideAccessor<T, S>;
  rightAccessor<U = StackedPyramidLayout<T, S>>(
    accessor: (data: U) => StackedPyramidSide<T, S>
  ): StackedPyramidComponent<T, S>;
  leftRefAccessor(): ReferenceAccessor<T, S> | undefined;
  leftRefAccessor<U = StackedPyramidLayout<T, S>>(
    accessor: (data: U) => number[]
  ): StackedPyramidComponent<T, S>;
  rightRefAccessor(): ReferenceAccessor<T, S> | undefined;
  rightRefAccessor<U = StackedPyramidLayout<T, S>>(
    accessor: (data: U) => number[]
  ): StackedPyramidComponent<T, S>;
}

/* Module
----------------------------------------------- */
export function stackedPyramid<
  T = unknown,
  S extends string | number = string,
>(): StackedPyramidComponent<T, S> {
  return (
    component<StackedPyramidComponent<T, S>>()
      .prop("barHeight", fn.functor)
      // Deliberately not fn.functor: see StoredWidth.
      .prop("barWidth")
      .prop("barPosition", fn.functor)
      .prop("barFill", fn.functor)
      .barFill("#000")
      .prop("tooltipAnchor")
      .tooltipAnchor([0.5, 0.5])
      .prop("leftAccessor")
      .prop("rightAccessor")
      .prop("leftRefAccessor")
      .prop("rightRefAccessor")
      .render(function (this: Element, data: StackedPyramidLayout<T, S>) {
        const selection = select(this);
        const props = selection.props<StackedPyramidProps<T, S>>();

        const barWidth = props.barWidth;
        if (barWidth === undefined) {
          // A misconfiguration that can never render: thrown before any element is created,
          // because the component computes both the x and the width of every bar from it.
          throw new TypeError(
            "[sszvis.stackedPyramid] the barWidth property is required: pass a scale over the " +
              "stacked values, or a number for a constant segment width."
          );
        }

        // A constant barWidth is a segment width rather than a scale, so it is used directly
        // instead of being subtracted from itself, which would collapse every bar to zero.
        const widthScale = typeof barWidth === "function" ? barWidth : null;
        const constantWidth = typeof barWidth === "function" ? 0 : barWidth;
        /** The edge of a segment nearer the spine, measured outwards from it. */
        const innerEdge = (d: StackedPyramidSlice<T, S>) => (widthScale ? widthScale(d[0]) : 0);
        /** The edge of a segment further from the spine. */
        const outerEdge = (d: StackedPyramidSlice<T, S>) =>
          widthScale ? widthScale(d[1]) : constantWidth;
        // A constant barWidth still has to respect the synthetic padding a sparse row is
        // filled with: that slice stands for a series the row has no observation for, so it
        // is a zero-width pad rather than a full-width bar. The scale branch gets this for
        // free, since a pad's two bounds are equal. A genuine zero-valued observation keeps
        // the fixed width, which is the point of constant mode.
        const segmentWidth = (d: StackedPyramidSlice<T, S>) =>
          widthScale
            ? widthScale(d[1]) - widthScale(d[0])
            : d.data === undefined
              ? 0
              : constantWidth;

        // A padding slice stands for a series this row has no observation for. It is drawn
        // zero-wide, so its fill is never visible - and calling barFill for it would hand a
        // row-shaped accessor an undefined datum, which is what used to throw. Skipped
        // rather than widened, so the public accessor contract stays honest.
        const barFillOf = (d: StackedPyramidSlice<T, S>) =>
          d.data === undefined ? undefined : props.barFill(d.data);

        // Components

        const leftBar = bar<StackedPyramidSlice<T, S>>()
          .x((d) => -SPINE_PADDING - outerEdge(d))
          .y(fn.compose(props.barPosition, rowAcc))
          .height(props.barHeight)
          .width(segmentWidth)
          .fill(barFillOf)
          .tooltipAnchor(props.tooltipAnchor);

        const rightBar = bar<StackedPyramidSlice<T, S>>()
          .x((d) => SPINE_PADDING + innerEdge(d))
          .y(fn.compose(props.barPosition, rowAcc))
          .height(props.barHeight)
          .width(segmentWidth)
          .fill(barFillOf)
          .tooltipAnchor(props.tooltipAnchor);

        const leftStack = stackComponent<T, S>().stackElement(leftBar);

        const rightStack = stackComponent<T, S>().stackElement(rightBar);

        // The line reads a reference point's value through the same scale, or parks it at the
        // constant when barWidth is one.
        const referenceWidth: WidthScale = widthScale ?? (() => constantWidth);

        const leftLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(referenceWidth)
          .mirror(true);

        const rightLine = lineComponent().barPosition(props.barPosition).barWidth(referenceWidth);

        // Rendering

        selection.selectGroup("leftStack").datum(props.leftAccessor(data)).call(leftStack);

        selection.selectGroup("rightStack").datum(props.rightAccessor(data)).call(rightStack);

        selection
          .selectGroup("leftReference")
          .datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : [])
          .call(leftLine);

        selection
          .selectGroup("rightReference")
          .datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : [])
          .call(rightLine);
      })
  );
}

type StackProps<T, S extends string | number> = {
  stackElement: BarComponent<StackedPyramidSlice<T, S>>;
};

interface StackComponent<T, S extends string | number>
  extends ComponentBuilder<StackComponent<T, S>> {
  stackElement(): BarComponent<StackedPyramidSlice<T, S>>;
  stackElement(value: BarComponent<StackedPyramidSlice<T, S>>): StackComponent<T, S>;
}

/**
 * Joins one group per series and draws that series' slices with the bar component it was
 * given. The datum handed to this component is one side of the pyramid.
 */
function stackComponent<T, S extends string | number>(): StackComponent<T, S> {
  return component<StackComponent<T, S>>()
    .prop("stackElement")
    .renderSelection((selection: Selection<Element, StackedPyramidSide<T, S>, null, undefined>) => {
      const datum = selection.datum();
      const props = selection.props<StackProps<T, S>>();

      const stack = selection
        // A child selector: a stack group nested inside another one belongs to whoever put
        // it there, and binding it here would remove a real series group and then throw out
        // of the join's reorder.
        .selectAll<SVGGElement, StackedPyramidSeries<T, S>>(":scope > [data-sszvis-stack]")
        .data(datum)
        .join("g")
        .attr("data-sszvis-stack", "");

      stack.each(function (this: SVGGElement, d) {
        select(this).datum(d).call(props.stackElement);
      });
    });
}

type ReferenceLineProps = {
  barPosition: StoredPosition;
  barWidth: WidthScale;
  mirror: boolean;
};

interface ReferenceLineComponent extends ComponentBuilder<ReferenceLineComponent> {
  barPosition(): StoredPosition;
  barPosition(value: StoredPosition): ReferenceLineComponent;
  barWidth(): WidthScale;
  barWidth(value: WidthScale): ReferenceLineComponent;
  mirror(): boolean;
  mirror(value: boolean): ReferenceLineComponent;
}

/**
 * Draws one side's reference outline as a single path. The data is one array of points per
 * path, so the datum handed to this component is an array of arrays - in practice always of
 * length one, since each side has at most one reference line.
 */
function lineComponent(): ReferenceLineComponent {
  return component<ReferenceLineComponent>()
    .prop("barPosition")
    .prop("barWidth")
    .prop("mirror")
    .mirror(false)
    .render(function (this: Element, data: number[][]) {
      const selection = select(this);
      const props = selection.props<ReferenceLineProps>();

      const lineGen = d3Line<number>().x(props.barWidth).y(props.barPosition);

      const line = selection
        .selectAll<SVGPathElement, number[]>(".sszvis-path")
        .data(data)
        .join("path")
        .attr("class", "sszvis-path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3 3");

      line
        .attr("transform", props.mirror ? "scale(-1, 1)" : "")
        .transition(defaultTransition())
        .attr("d", lineGen);
    });
}
