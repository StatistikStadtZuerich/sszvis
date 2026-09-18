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
 * The datum bound to the chart layer is the sides array, never a wrapper around it: either the
 * return value of stackedPyramidData(sideAcc, rowAcc, seriesAcc, valueAcc), which is that array,
 * or the `sides` field of stackedPyramidLayout(...)(rows), which is the same array with the
 * maximum beside it rather than assigned onto it. Binding the layout object itself draws nothing
 * - d3's data join over a non-iterable yields an empty selection, without an error. Each accessor
 * is called with one source row: sideAcc groups the rows into the sides of the pyramid, rowAcc
 * into the vertical positions within a side, seriesAcc into the layers of each row's stack, and
 * valueAcc supplies the number that is stacked.
 *
 * The result is an array of sides, each an array of the series d3.stack produced for that side,
 * each series an array of the [y0, y1] slices it computed - so a slice is addressed as
 * data[side][series][row], and the caller picks the two sides positionally. Every slice carries
 * five properties beyond its pair: its `series` key, its `side` as the side accessor returned it,
 * its `row`, its own `value`, and its `data`, narrowed from the whole grouped row to the single
 * source row the slice was computed from - or undefined, where the row carries no value for that
 * series and the slice is a zero-width pad. d3's own `key` and `index` are carried across onto each
 * series. The largest stacked total across both sides is what the horizontal scale's domain is
 * built from: stackedPyramidData assigns it onto the returned array as `maxValue`, where it is
 * deprecated because no array operation carries it, and stackedPyramidLayout returns it beside
 * the sides. The rows passed in are not modified.
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
 *                                            colour the series. It is called with the slice's
 *                                            `data`, so it reads a source row rather than a slice,
 *                                            and with d3's index, as bar's own fill is.
 * @property {number, function} barHeight     The height of a bar. Required: an unset prop throws a
 *                                            TypeError naming it before anything is drawn. It used
 *                                            to be the one dimension handed straight to bar, so an
 *                                            unset value reached bar's missing-value guard as
 *                                            undefined and became 0, and the chart rendered an
 *                                            empty axis frame with no bars and no warning.
 * @property {number, function} barWidth      The width of a bar. Required: an unset prop throws a
 *                                            named TypeError before anything is drawn, because the
 *                                            component computes both the x and the width of every
 *                                            bar itself. A function is a scale over stacked values,
 *                                            called with one of the numbers out of a slice's [y0,
 *                                            y1] pair rather than with the slice - pyramid calls
 *                                            the same property with the bar's datum, and an
 *                                            accessor written for pyramid reads properties off a
 *                                            number here and yields NaN, which bar's guard turns
 *                                            into 0. It is called with d3's index, as pyramid calls
 *                                            it, so an index-aware accessor works; before that it
 *                                            saw undefined for the index and collapsed every width
 *                                            and every x to 0 on both sides. A number is the
 *                                            constant width of every segment, measured from the
 *                                            spine outwards, and is the one dimension not run
 *                                            through fn.functor, so that a constant stays
 *                                            distinguishable from a scale.
 * @property {number, function} barPosition   The vertical position of a bar, i.e. its top edge.
 *                                            Required: an unset prop throws a TypeError naming it
 *                                            before anything is drawn. It is
 *                                            called with the slice's `row`, i.e. the value the
 *                                            layout's row accessor returned, so it is a scale over
 *                                            the row domain. It is called with d3's index too, as
 *                                            bar's own accessors are; before that it went through
 *                                            fn.compose, which forwards every argument only to the
 *                                            innermost function, so an index-aware accessor
 *                                            yielded NaN and bar's guard flattened it to 0.
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
 *                                            reference points, {row, value}: barWidth maps the
 *                                            value to x and barPosition the row to y, the same way
 *                                            round as in the bars, so a slice of the layout
 *                                            satisfies the shape unchanged. Optional, and so is the
 *                                            data: an accessor that yields undefined or null for
 *                                            some states draws no line for that state and warns,
 *                                            rather than throwing. Returning an empty array hides it
 *                                            silently, and removes the path element with it.
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
 * that differ only in type merge, and the number 1 and the string "1" land in the same cell, whose
 * rows are then summed together. The ordering follows from the same coercion: JavaScript
 * iterates array-index keys in ascending numeric order regardless of insertion order, so dense
 * non-negative integer rows sort themselves, while negative, fractional or plain string rows fall
 * back to insertion order and are laid out in whatever order the input happened to be in. Since
 * barPosition receives the row's own value that ordering is cosmetic for the bars - it decides only
 * which slice is drawn first - but a `row` that is a string comes back as the accessor returned it,
 * not as the cascade's stringified key. The sides are ordered the same way and
 * picked positionally, so a dataset whose first row is male puts men on the left and silently
 * mirrors the chart. The series escape this: their key order is the stacking order, so it is taken
 * from the data rather than from the cascade row, and a series accessor returning years or numeric
 * codes keeps the order it returned them in - though the `series` tag still comes back as a string
 * even when the accessor returned a number. Nothing enforces the
 * cardinality of two the layout function's own documentation requires of the side accessor either:
 * a single side leaves the right accessor returning undefined, which throws from d3's data join,
 * and a third side is returned and then dropped without a word by the caller's positional
 * accessors. Shared with stackedBarData.
 *
 * Note: a cell's value is the sum of every row the accessors placed in it, so data that is not
 * already aggregated to one row per (side, row, series) triplet stacks to its true total. The
 * layout function still documents the triplet as appearing exactly once; what has changed is that
 * a violation is no longer silently understated to the cell's first row. Shared with
 * stackedBarData.
 *
 * Note: stackedPyramidData hangs `maxValue` off the returned array rather than wrapping it in an
 * object, so any array operation - a spread, a map, a filter, a trip through JSON - drops it. The
 * property is deprecated for that reason; stackedPyramidLayout returns the same value beside the
 * sides. It is the maximum of the upper bounds only, so it is not the extent of the data when a
 * value is negative. An empty layout reports 0, so a scale domain built from it stays valid. A
 * slice's `value` is a convenience of the same kind: the component never reads it, and it
 * duplicates d[1] - d[0] as it stood when the layout ran, so it goes stale if a caller rewrites
 * the pair. Shared with stackedBarData. See test/component/stackedPyramid.test.ts.
 *
 * Note: a reference series is an array of {row, value} points, so barWidth maps the value to x and
 * barPosition the row to y - the same division of labour as in the bars, which is what makes the
 * outline land in their coordinate system. Neither property receives d3's index, on the line or in
 * the bars. pyramid's byte-identical lineComponent still takes plain data, since there both
 * properties read the bar's datum and the question does not arise. The only stackedPyramid example
 * sets neither reference accessor.
 *
 * Note: one smaller mismatch rides along, shared with pyramid. The bars are pushed outwards by
 * SPINE_PADDING, a deliberate cosmetic gap at the spine, while the line is drawn straight from
 * barWidth and so agrees with the axis scale, which puts a reference value equal to a bar value
 * half a pixel inside that bar's outer edge, symmetrically on both sides. The vertical half of
 * that pair is no longer one: the line adds half a bar height to barPosition, so the outline runs
 * through the bars' mid-lines rather than along their top edges.
 *
 * Note: a reference line's d attribute is only ever written through a transition, so a freshly
 * rendered path carries no geometry until the first animation frame and anything that measures the
 * chart synchronously - getBBox, a snapshot, an export to PNG - sees an empty path. Entering lines
 * then snap into place, because d3 has no previous d to interpolate from; only updates animate. The
 * bars underneath animate over the same duration, so the outline and the bars it describes stay
 * together for the length of the transition. pyramid's line writes its d at the join as well and
 * so does not share this one.
 *
 * Note: the reference path carries two classes: the generic .sszvis-path, which no rule in
 * sszvis.css defines, and the component-owned .sszvis-stacked-pyramid__referenceline, which the
 * join matches on. Writing both keeps a selector aimed at the generic class working while keeping
 * a foreign path out of the join - pie, stackedArea and stackedAreaMultiples all draw paths under
 * the generic class, and the join has no key function, so an unscoped selector would adopt one of
 * theirs and repaint it. The appearance still comes from four inlined attributes, the opposite
 * choice from pyramid, which sets only .sszvis-pyramid__referenceline and takes all four values
 * from the stylesheet; the class here is deliberately not pyramid's, so the two components do not
 * collide with each other in turn.
 *
 * Note: the reference datum is one array of points per path, so each side is capped at a single
 * line. referenceSeries resolves a side with nothing to draw to no entry at all rather than to one
 * empty entry, which is what lets the exit selection fire and the path leave the DOM when the
 * reference data goes away. The mirror property writes transform="" on the right side rather than
 * omitting the attribute. Shared with pyramid.
 *
 * Note: the stack join is a child selector, ":scope > [data-sszvis-stack]", so only the groups the
 * component owns take part in it and a caller may render content of its own - including further
 * stack groups - inside a series group without the join adopting it. The bars inside each series
 * group are joined by bar itself on its own .sszvis-bar-rect class, so a planted rect carrying
 * only the generic .sszvis-bar class is not captured there either.
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
  sum,
} from "d3";
import { cascade } from "../cascade.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { defaultTransition } from "../transition.js";
import type { ColorValue } from "../types.js";
import bar, { type BarComponent } from "./bar.js";

/* Constants
----------------------------------------------- */
const SPINE_PADDING = 0.5;

/**
 * The properties without which the component cannot draw a bar. Checked by name before any
 * element exists, so a misconfiguration is reported rather than rendered: barHeight used to
 * reach bar as undefined and be flattened to a height of 0, which draws an empty axis frame
 * with no warning. pyramid carries the same list.
 */
const REQUIRED_PROPS = [
  "barHeight",
  "barWidth",
  "barPosition",
  "leftAccessor",
  "rightAccessor",
] as const;

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
 * What stackedPyramidData returns: the plain sides array, with the stacked maximum assigned
 * onto it. It is what the component takes as its data, so it can be bound to a layer directly
 * and the side accessors keep picking the two sides positionally off it.
 *
 * The assigned property is dropped by every array operation, which is why it is deprecated;
 * stackedPyramidLayout returns it beside the array instead.
 */
export type StackedPyramidSidesData<T, S extends string | number = string> = StackedPyramidSide<
  T,
  S
>[] & {
  /**
   * The largest upper bound over every slice of both sides - zero when there are none.
   *
   * @deprecated Read `maxValue` off stackedPyramidLayout instead; assigned onto an array it
   * does not survive a copy.
   */
  maxValue: number;
};

/**
 * What stackedPyramidLayout returns: the sides in `sides`, with the largest stacked total
 * across both of them beside them rather than assigned onto the array. Copying the layout - a
 * spread, a map, a trip through JSON - carries `maxValue` with it, and `layout.sides` is a
 * well-behaved array. `sides` is what gets bound to the chart layer.
 */
export interface StackedPyramidLayout<T, S extends string | number = string> {
  /** One entry per side, in the order the side accessor first mentions each. Bind this. */
  sides: StackedPyramidSide<T, S>[];
  /** The largest upper bound over every slice of both sides - zero when there are none. */
  maxValue: number;
}

/* Data layout
----------------------------------------------- */

/**
 * This function prepares the data for the stackedPyramid component, returning the sides in
 * `sides` with the stacked maximum beside them. Prefer it over stackedPyramidData in new code:
 * the metadata survives being copied.
 *
 * The input data is expected to have at least four columns:
 *
 *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
 *  - row: determines on which row (vertical position) the value goes.
 *  - series: determines in which series (for the stack) the value is.
 *  - value: the numerical value.
 *
 * The combination of each distinct (side,row,series) triplet SHOULD appear only once in the data.
 * Where it does not, every row of the cell is summed rather than only the first being read.
 */
export function stackedPyramidLayout<T, S extends string | number = string>(
  sideAcc: (datum: T) => S,
  // cascade stringifies its keys, so a numeric row or series accessor - an age, a year, a
  // category code - groups the same way a string one does, which is why `series` stays a
  // string even though the keys themselves come from the data rather than from the row.
  rowValueAcc: (datum: T) => string | number,
  seriesAcc: (datum: T) => string | number,
  valueAcc: (datum: T) => number,
) {
  return (data: T[]): StackedPyramidLayout<T, S> => {
    const grouped: CascadeRow<T>[][] = cascade<T>()
      .arrayBy(sideAcc)
      .arrayBy(rowValueAcc)
      .objectBy(seriesAcc)
      .apply(data);

    const sides = grouped.map((rows) => {
      const side = sideAcc(firstCell(rows[0]));
      // The union of the series across every row of the side, so a series that appears in
      // only some of the rows still gets a layer. The key order is the stacking order, and it
      // is taken from the data rather than from the cascade rows: those are plain objects,
      // which enumerate integer-like keys numerically, so a series accessor returning years or
      // numeric codes lost the caller's ordering and silently restacked the chart. Filtered to
      // this side, since a side's layers are the series that side actually carries. The same
      // correction stackedBarData makes.
      const keys = fn.set(
        data.filter((datum) => String(sideAcc(datum)) === String(side)),
        (datum) => String(seriesAcc(datum)),
      );

      const stacks = d3Stack<CascadeRow<T>, string>()
        .keys(keys)
        // Every row the accessors placed in a cell contributes to that cell's value, so data
        // that is not pre-aggregated to one row per (side, row, series) triplet stacks to its
        // true total rather than to its first row - which was silently understated, with no
        // warning and no error, just a shorter bar. A cell the row has no datum for stacks as
        // zero rather than throwing. The same correction stackedBarData makes.
        .value((x, key) => sum(x[key] ?? [], valueAcc))(rows);

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
            // Taken from the stacked pair rather than from the cell's first row, so it is the
            // whole cell where the accessors placed more than one row there - the same total
            // the bar is drawn at. Reading the first row instead left a slice whose value
            // disagreed with its own extent, which a reference line built from the layout's
            // own slices then drew at the understated figure while the bars behind it showed
            // the total. A padding slice has an empty pair, so it still reports 0.
            value: d[1] - d[0],
          });
        });
        return Object.assign(slices, { key: stack.key, index: stack.index });
      });
    });

    // Compute the max value, for convenience. This value is needed to construct
    // the horizontal scale.
    const maxValue = max(sides, (s) => max(s, (rows) => max(rows, (row) => row[1]))) ?? 0;

    return { sides, maxValue };
  };
}

/**
 * The array-returning form of the layout: the sides themselves, with the stacked maximum
 * assigned onto them so that `.datum(stackedPyramidData(...)(rows))` still binds a real array
 * and the side accessors can index into it.
 */
export function stackedPyramidData<T, S extends string | number = string>(
  sideAcc: (datum: T) => S,
  rowValueAcc: (datum: T) => string | number,
  seriesAcc: (datum: T) => string | number,
  valueAcc: (datum: T) => number,
) {
  const layout = stackedPyramidLayout<T, S>(sideAcc, rowValueAcc, seriesAcc, valueAcc);
  return (data: T[]): StackedPyramidSidesData<T, S> => {
    const { sides, maxValue } = layout(data);
    return Object.assign(sides, { maxValue });
  };
}

/* Component
----------------------------------------------- */

/**
 * A barWidth scale: a function from one of the numbers out of a slice's [y0, y1] pair - never
 * from the slice itself - to a distance from the spine. The bars pass d3's index along with the
 * value; the reference line has no bar index to pass, so the parameter stays optional.
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
  index?: number,
) => number;

/** How barFill reads back. It is called with the slice's `data`, so it reads a source row. */
type StoredFill<T> = (datum: T, index?: number) => ColorValue | undefined;

/** Pulls one side's series out of the datum bound to the chart layer. */
type SideAccessor<T, S extends string | number> = (
  data: StackedPyramidSide<T, S>[],
) => StackedPyramidSide<T, S>;

/**
 * One point of a reference outline. Each half is mapped by the property that owns it in the
 * bars: barWidth reads the `value`, barPosition the `row`, so the outline is drawn in the same
 * coordinate system as the bars it describes. A slice satisfies the shape as it stands, so one
 * of the layout's own series can be handed over as a reference series unchanged.
 */
export interface StackedPyramidReferencePoint {
  /** The row the point sits on, in the row domain barPosition is a scale over. */
  row: string | number;
  /** The stacked value the point describes, in the domain barWidth is a scale over. */
  value: number;
}

/** Pulls one side's reference series out of the datum bound to the chart layer. */
type ReferenceAccessor<T, S extends string | number> = (
  data: StackedPyramidSide<T, S>[],
) => StackedPyramidReferencePoint[];

/** A constant or an accessor; either is accepted, since fn.functor normalises both. */
type PyramidValue<A, R> = R | ((value: A, index: number) => R);

/**
 * A constant or an accessor over a slice's source row. barFill is called with the slice's `data`
 * and with d3's index, as bar's own fill is. A padding slice - one
 * standing for a series the row has no observation for - is zero-width, so the accessor is not
 * called for it and never has to handle a missing row.
 */
type FillValue<U> = ColorValue | undefined | ((datum: U) => ColorValue | undefined);

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
export interface StackedPyramidComponent<
  T = unknown,
  S extends string | number = string,
> extends ComponentBuilder<StackedPyramidComponent<T, S>> {
  barHeight(): StoredHeight<T, S>;
  barHeight<U = StackedPyramidSlice<T, S>>(
    value: PyramidValue<U, number>,
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
  leftAccessor<U = StackedPyramidSide<T, S>[]>(
    accessor: (data: U) => StackedPyramidSide<T, S>,
  ): StackedPyramidComponent<T, S>;
  rightAccessor(): SideAccessor<T, S>;
  rightAccessor<U = StackedPyramidSide<T, S>[]>(
    accessor: (data: U) => StackedPyramidSide<T, S>,
  ): StackedPyramidComponent<T, S>;
  leftRefAccessor(): ReferenceAccessor<T, S> | undefined;
  leftRefAccessor<U = StackedPyramidSide<T, S>[]>(
    accessor: (data: U) => StackedPyramidReferencePoint[],
  ): StackedPyramidComponent<T, S>;
  rightRefAccessor(): ReferenceAccessor<T, S> | undefined;
  rightRefAccessor<U = StackedPyramidSide<T, S>[]>(
    accessor: (data: U) => StackedPyramidReferencePoint[],
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
      .render(function (this: Element, data: StackedPyramidSide<T, S>[]) {
        const selection = select(this);
        const props = selection.props<StackedPyramidProps<T, S>>();

        // Validation, before any element exists. Every one of these is a misconfiguration
        // that can never render, so none of them is left to fail on its own terms: barWidth
        // used to throw from the component's own closure, barPosition from inside fn.compose,
        // and barHeight not at all - it reached bar as undefined and was flattened to 0.
        for (const name of REQUIRED_PROPS) {
          if (props[name] === undefined) {
            throw new TypeError(
              `[sszvis.stackedPyramid] the ${name} property is required` +
                (name === "barWidth"
                  ? ": pass a scale over the stacked values, or a number for a constant segment width."
                  : "."),
            );
          }
        }

        // Established by the loop above, which the compiler does not follow through the
        // indexed access.
        const barWidth = props.barWidth as StoredWidth;

        // A constant barWidth is a segment width rather than a scale, so it is used directly
        // instead of being subtracted from itself, which would collapse every bar to zero.
        const widthScale = typeof barWidth === "function" ? barWidth : null;
        const constantWidth = typeof barWidth === "function" ? 0 : barWidth;
        // Each of these is called from an accessor bar owns, so it is handed (d, i) and passes
        // both on: an index-aware barWidth used to see undefined for i, and `30 + undefined` is
        // NaN, which bar's guard turns into a width and an x of 0. pyramid forwards the index
        // through its own mirroring closure for the same reason.
        /** The edge of a segment nearer the spine, measured outwards from it. */
        const innerEdge = (d: StackedPyramidSlice<T, S>, i: number) =>
          widthScale ? widthScale(d[0], i) : 0;
        /** The edge of a segment further from the spine. */
        const outerEdge = (d: StackedPyramidSlice<T, S>, i: number) =>
          widthScale ? widthScale(d[1], i) : constantWidth;
        // A constant barWidth still has to respect the synthetic padding a sparse row is
        // filled with: that slice stands for a series the row has no observation for, so it
        // is a zero-width pad rather than a full-width bar. The scale branch gets this for
        // free, since a pad's two bounds are equal. A genuine zero-valued observation keeps
        // the fixed width, which is the point of constant mode.
        const segmentWidth = (d: StackedPyramidSlice<T, S>, i: number) =>
          widthScale
            ? widthScale(d[1], i) - widthScale(d[0], i)
            : d.data === undefined
              ? 0
              : constantWidth;

        // A padding slice stands for a series this row has no observation for. It is drawn
        // zero-wide, so its fill is never visible - and calling barFill for it would hand a
        // row-shaped accessor an undefined datum, which is what used to throw. Skipped
        // rather than widened, so the public accessor contract stays honest.
        const barFillOf = (d: StackedPyramidSlice<T, S>, i: number) =>
          d.data === undefined ? undefined : props.barFill(d.data, i);

        // barPosition is called with the slice's row rather than the slice, but with the same
        // index bar hands its own accessors. It used to go through fn.compose, which forwards
        // every argument only to the innermost function - rowAcc - so barPosition, the outer
        // one, received exactly one and an index-aware accessor returned NaN, which bar's
        // guard flattened to y="0".
        const barPositionOf = (d: StackedPyramidSlice<T, S>, i: number) =>
          props.barPosition(rowAcc(d), i);

        // Components

        const leftBar = bar<StackedPyramidSlice<T, S>>()
          .x((d, i) => -SPINE_PADDING - outerEdge(d, i))
          .y(barPositionOf)
          .height(props.barHeight)
          .width(segmentWidth)
          .fill(barFillOf)
          .tooltipAnchor(props.tooltipAnchor);

        const rightBar = bar<StackedPyramidSlice<T, S>>()
          .x((d, i) => SPINE_PADDING + innerEdge(d, i))
          .y(barPositionOf)
          .height(props.barHeight)
          .width(segmentWidth)
          .fill(barFillOf)
          .tooltipAnchor(props.tooltipAnchor);

        const leftStack = stackComponent<T, S>().stackElement(leftBar);

        const rightStack = stackComponent<T, S>().stackElement(rightBar);

        // The line reads a reference point's value through the same scale, or parks it at the
        // constant when barWidth is one.
        const referenceWidth: WidthScale = widthScale ?? (() => constantWidth);

        // The outline is centred on the bars, so it needs their height - but a reference point
        // is {row, value}, not a slice, so there is nothing on the point to measure. The
        // heights are read off the side's own slices instead, which is what lets a per-slice
        // barHeight accessor work here: it receives the slice it expects, rather than the
        // undefined an argument-less call would hand it. Keyed by row and built per side, so a
        // height that varies by row - or between the two sides - reaches the reference point it
        // belongs to rather than being taken from whichever slice happened to come first.
        //
        // A reference point on a row the bars do not cover falls back to the first height this
        // side resolved, rather than to 0: a chart-wide height is the normal case, and falling
        // to 0 for the odd row would kink the outline instead of merely offsetting it. With no
        // slices at all, or no barHeight - a chart that draws no bars, which the component
        // already tolerates silently - the fallback is 0 and the outline sits on the bars' top
        // edges, where it was before this was corrected. Neither case throws.
        const halfHeightsByRow = (side: StackedPyramidSide<T, S>) => {
          const byRow = new Map<string, number>();
          if (props.barHeight !== undefined) {
            for (const series of side) {
              for (const [index, slice] of series.entries()) {
                const key = String(slice.row);
                if (byRow.has(key)) continue;
                const height = Number(props.barHeight(slice, index));
                if (Number.isFinite(height)) byRow.set(key, height / 2);
              }
            }
          }
          return { byRow, fallback: byRow.values().next().value ?? 0 };
        };

        const leftHeights = halfHeightsByRow(props.leftAccessor(data));
        const rightHeights = halfHeightsByRow(props.rightAccessor(data));

        const leftLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(referenceWidth)
          .halfHeightByRow(leftHeights.byRow)
          .halfHeightDefault(leftHeights.fallback)
          .mirror(true);

        const rightLine = lineComponent()
          .barPosition(props.barPosition)
          .barWidth(referenceWidth)
          .halfHeightByRow(rightHeights.byRow)
          .halfHeightDefault(rightHeights.fallback);

        // Rendering

        selection.selectGroup("leftStack").datum(props.leftAccessor(data)).call(leftStack);

        selection.selectGroup("rightStack").datum(props.rightAccessor(data)).call(rightStack);

        selection
          .selectGroup("leftReference")
          .datum(referenceSeries(props.leftRefAccessor, data, "leftRefAccessor"))
          .call(leftLine);

        selection
          .selectGroup("rightReference")
          .datum(referenceSeries(props.rightRefAccessor, data, "rightRefAccessor"))
          .call(rightLine);
      })
  );
}

type StackProps<T, S extends string | number> = {
  stackElement: BarComponent<StackedPyramidSlice<T, S>>;
};

interface StackComponent<T, S extends string | number> extends ComponentBuilder<
  StackComponent<T, S>
> {
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

/**
 * Resolves one side's reference series into the array-of-series the line component joins on:
 * one entry when there is something to draw, none otherwise. A series with no points therefore
 * removes its path rather than leaving an empty one behind.
 *
 * An accessor returning undefined or null breaks its contract, so it is warned about - but it
 * is warned about rather than thrown on, because it is data-driven: an accessor indexing into
 * a cascaded object hits it as soon as one series is missing from one state, and that must not
 * take the chart down. An empty array is a legitimately empty series and passes silently. The
 * same resolver pyramid uses.
 */
function referenceSeries<T, S extends string | number>(
  accessor: ReferenceAccessor<T, S> | undefined,
  data: StackedPyramidSide<T, S>[],
  name: string,
): StackedPyramidReferencePoint[][] {
  if (accessor === undefined) return [];
  const series = accessor(data);
  if (!Array.isArray(series)) {
    logger.warn(
      `[stackedPyramid] ${name} returned ${String(series)} rather than an array; no reference line was drawn. Return an empty array for a state that has no reference series.`,
    );
    return [];
  }
  return series.length === 0 ? [] : [series];
}

type ReferenceLineProps = {
  barPosition: StoredPosition;
  barWidth: WidthScale;
  halfHeightByRow: ReadonlyMap<string, number>;
  halfHeightDefault: number;
  mirror: boolean;
};

interface ReferenceLineComponent extends ComponentBuilder<ReferenceLineComponent> {
  barPosition(): StoredPosition;
  barPosition(value: StoredPosition): ReferenceLineComponent;
  barWidth(): WidthScale;
  barWidth(value: WidthScale): ReferenceLineComponent;
  halfHeightByRow(): ReadonlyMap<string, number>;
  halfHeightByRow(value: ReadonlyMap<string, number>): ReferenceLineComponent;
  halfHeightDefault(): number;
  halfHeightDefault(value: number): ReferenceLineComponent;
  mirror(): boolean;
  mirror(value: boolean): ReferenceLineComponent;
}

/**
 * Draws one side's reference outline as a single path. The data is one array of reference
 * points per path, so the datum handed to this component is an array of arrays - in practice
 * always of length one, since each side has at most one reference line.
 */
function lineComponent(): ReferenceLineComponent {
  return component<ReferenceLineComponent>()
    .prop("barPosition")
    .prop("barWidth")
    .prop("halfHeightByRow")
    .halfHeightByRow(new Map<string, number>())
    .prop("halfHeightDefault")
    .halfHeightDefault(0)
    .prop("mirror")
    .mirror(false)
    .render(function (this: Element, data: StackedPyramidReferencePoint[][]) {
      const selection = select(this);
      const props = selection.props<ReferenceLineProps>();

      // Each half of a point is mapped by the property that owns it, so the outline lands in
      // the coordinate system the bars are drawn in.
      // The bars are pushed outwards by SPINE_PADDING, so the outline is too - otherwise a
      // reference value equal to a bar value lands half a pixel inside that bar's outer edge
      // rather than on it. barPosition is a bar's top edge, so half that row's bar height is
      // added to put the outline through the mid-lines of the bars it describes. Both are the
      // corrections pyramid's own reference line makes.
      const pointX = (d: StackedPyramidReferencePoint) => SPINE_PADDING + props.barWidth(d.value);
      const pointY = (d: StackedPyramidReferencePoint) =>
        props.barPosition(d.row) +
        (props.halfHeightByRow.get(String(d.row)) ?? props.halfHeightDefault);

      const lineGen = d3Line<StackedPyramidReferencePoint>()
        // A point whose geometry is not a finite number is skipped, which breaks the outline
        // at the gap instead of poisoning the path string from there on: d3 writes NaN into
        // d verbatim, and the browser then renders the valid prefix and drops everything
        // after it. bar guards its own geometry the same way, so the bars survive a gap the
        // outline used to be truncated by. The same guard pyramid uses.
        .defined((d) => isDrawable(pointX(d)) && isDrawable(pointY(d)))
        .x(pointX)
        .y(pointY);

      // Matching on the component's own class rather than the generic .sszvis-path one, which
      // pie, stackedArea and stackedAreaMultiples also use, keeps a foreign path in the same
      // group out of the join. The generic class stays in the written attribute, so no
      // selector written against it changes meaning.
      const line = selection
        .selectAll<SVGPathElement, StackedPyramidReferencePoint[]>(
          "path.sszvis-stacked-pyramid__referenceline",
        )
        .data(data)
        .join("path")
        .attr("class", "sszvis-path sszvis-stacked-pyramid__referenceline")
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

/** Whether a computed coordinate can be written into a path string at all. */
function isDrawable(value: number): boolean {
  return Number.isFinite(Number(value));
}
