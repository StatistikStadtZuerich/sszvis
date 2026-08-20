/**
 * Stacked Bar component
 *
 * This component includes both the vertical and horizontal stacked bar chart components.
 * Both are constiations on the same concept, and they both use the same abstract intermediate
 * representation for the stack, but are rendered using different dimensions. Note that using
 * this component will add the properties 'y0' and 'y' to any passed-in data objects, as part of
 * computing the stack intermediate representation. Existing properties with these names will be
 * overwritten.
 *
 * @module sszvis/component/stackedBar/horizontal
 * @module sszvis/component/stackedBar/vertical
 *
 * @property {function} xAccessor           Specifies an x-accessor for the stack layout. The result of this function
 *                                          is used to compute the horizontal extent of each element in the stack.
 *                                          The return value must be a number.
 * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
 *                                          the elements of each stack, both the left offset value and the width of each stack segment.
 * @property {number, function} width       Specifies a width for the bars in the stack layout. This value is not used in the
 *                                          horizontal orientation. (xScale is used instead).
 * @property {function} yAccessor           The y-accessor. The return values of this function are used to group elements together as stacks.
 * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
 * @property {number, function} height      Specify the height of each rectangle. This value determines the height of each element in the stacks.
 * @property {string, function} fill        Specify a fill value for the rectangles (default black).
 * @property {string, function} stroke      Specify a stroke value for the stack rectangles (default none).
 * @property {string} orientation           Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart.
 *                                          Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.
 *
 * @return {sszvis.component}
 */

import {
  stack as d3Stack,
  max,
  type Selection,
  type SeriesPoint,
  select,
  stackOrderNone,
  stackOrderReverse,
} from "d3";
import { cascade } from "../cascade.js";
import {
  type Component,
  component,
  type PropertySetter,
  type RenderCallback,
} from "../d3-component.js";
import * as fn from "../fn.js";
import bar, { type BarComponent } from "./bar.js";

const stackAcc = fn.prop("stack");

// Accessors for the first and second element of a tuple (2-element array).
const fst = fn.prop("0");
const snd = fn.prop("1");

/* Types
----------------------------------------------- */

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
export type StackedBarLayout<T, X extends string | number = string> = Omit<
  StackedBarSeries<T, X>[],
  "keys"
> & {
  keys: string[];
  maxValue: number | undefined;
};

/** One row of the cascade: every series of one stack, each holding that cell's data. */
type CascadeRow<T> = Record<string, T[]>;

/** The stack order accessors d3 exposes; the two layouts differ only in which they use. */
type StackOrder = typeof stackOrderNone;

/* Data layout
----------------------------------------------- */

/**
 * Both layouts are the same computation and differ only in the stack order, which decides
 * which series key ends up on the baseline.
 */
function stackedBarData(order: StackOrder) {
  return <T, X extends string | number = string>(
    _stackAcc: (datum: T) => X,
    // cascade.objectBy stringifies its keys, so a numeric series accessor - a year, or a
    // category code - groups the same way a string one does. The keys themselves are read
    // back off the cascade row with Object.keys, which is why `series` stays a string.
    seriesAcc: (datum: T) => string | number,
    valueAcc: (datum: T) => number
  ) =>
    (data: T[]): StackedBarLayout<T, X> => {
      const rows: CascadeRow<T>[] = cascade<T>().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);

      // Collect all keys ()
      const keys = rows.reduce<string[]>(
        (a, row) => fn.set<string, string>([...a, ...Object.keys(row)]),
        []
      );

      const stacks = d3Stack<CascadeRow<T>, string>()
        .keys(keys)
        // Only the first datum of each cell is read, and the read is unguarded: a stack
        // that is missing one of the series keys throws here.
        .value((x, key) => valueAcc(x[key][0]))
        .order(order)(rows);

      // Simplify the 'data' property. The slices themselves are the objects d3 created,
      // rewritten in place, so a caller holding one sees the new shape. The series arrays
      // are rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
      // series - have to be carried across by hand.
      const series = stacks.map((stack) => {
        const slices = stack.map((d) => {
          const datum = d.data[stack.key][0];
          return Object.assign(d, {
            series: stack.key,
            data: datum,
            stack: _stackAcc(datum),
          });
        });
        return Object.assign(slices, { key: stack.key, index: stack.index });
      });

      const maxValue = max(series, (stack) => max(stack, (d) => d[1]));

      return Object.assign(series, { keys, maxValue });
    };
}

export const stackedBarHorizontalData = stackedBarData(stackOrderNone);
export const stackedBarVerticalData = stackedBarData(stackOrderReverse);

/* Component
----------------------------------------------- */

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
type StoredDimension<T, X extends string | number> = (
  slice?: StackedBarSlice<T, X>,
  index?: number
) => number;

/** fill is stored exactly as set, and may be left unset, in which case no fill is written. */
type FillValue<T, X extends string | number> = SliceValue<
  StackedBarSlice<T, X>,
  string | undefined
>;

/**
 * stroke is stored exactly as set. Every falsy value is accepted and means the same thing,
 * since the renderer falls back to the white default for all of them.
 */
type StrokeValue<T, X extends string | number> =
  | string
  | null
  | undefined
  | ((slice: StackedBarSlice<T, X>, index: number) => string | undefined);

/** The props the two orientations share, both stored exactly as they were set. */
type ColorProps<T, X extends string | number> = {
  fill: FillValue<T, X>;
  stroke: StrokeValue<T, X>;
};

/**
 * The props as the vertical renderer sees them: the x-axis carries the stacks and the y-axis
 * the values. None of the four required props is defaulted or validated.
 */
type VerticalProps<T, X extends string | number> = ColorProps<T, X> & {
  xScale: StackScale<X>;
  yScale: ValueScale;
  width: StoredDimension<T, X>;
  height: StoredDimension<T, X>;
};

/** The props as the horizontal renderer sees them, with the two axes swapped. */
type HorizontalProps<T, X extends string | number> = ColorProps<T, X> & {
  xScale: ValueScale;
  yScale: StackScale<X>;
  width: StoredDimension<T, X>;
  height: StoredDimension<T, X>;
};

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
export interface StackedBarVerticalComponent<T = unknown, X extends string | number = string>
  extends StackedBarBuilder<StackedBarVerticalComponent<T, X>> {
  xScale(): StackScale<X>;
  xScale<V = X>(scale: (value: V) => number | undefined): StackedBarVerticalComponent<T, X>;
  width(): StoredDimension<T, X>;
  width<U = StackedBarSlice<T, X>>(value: SliceValue<U, number>): StackedBarVerticalComponent<T, X>;
  yScale(): ValueScale;
  yScale(scale: ValueScale): StackedBarVerticalComponent<T, X>;
  height(): StoredDimension<T, X>;
  height<U = StackedBarSlice<T, X>>(
    value: SliceValue<U, number>
  ): StackedBarVerticalComponent<T, X>;
  fill(): FillValue<T, X>;
  fill<U = StackedBarSlice<T, X>>(
    value: SliceValue<U, string | undefined>
  ): StackedBarVerticalComponent<T, X>;
  stroke(): StrokeValue<T, X>;
  stroke<U = StackedBarSlice<T, X>>(
    value: string | null | undefined | ((slice: U, index: number) => string | undefined)
  ): StackedBarVerticalComponent<T, X>;
}

export interface StackedBarHorizontalComponent<T = unknown, X extends string | number = string>
  extends StackedBarBuilder<StackedBarHorizontalComponent<T, X>> {
  xScale(): ValueScale;
  xScale(scale: ValueScale): StackedBarHorizontalComponent<T, X>;
  width(): StoredDimension<T, X>;
  width<U = StackedBarSlice<T, X>>(
    value: SliceValue<U, number>
  ): StackedBarHorizontalComponent<T, X>;
  yScale(): StackScale<X>;
  yScale<V = X>(scale: (value: V) => number | undefined): StackedBarHorizontalComponent<T, X>;
  height(): StoredDimension<T, X>;
  height<U = StackedBarSlice<T, X>>(
    value: SliceValue<U, number>
  ): StackedBarHorizontalComponent<T, X>;
  fill(): FillValue<T, X>;
  fill<U = StackedBarSlice<T, X>>(
    value: SliceValue<U, string | undefined>
  ): StackedBarHorizontalComponent<T, X>;
  stroke(): StrokeValue<T, X>;
  stroke<U = StackedBarSlice<T, X>>(
    value: string | null | undefined | ((slice: U, index: number) => string | undefined)
  ): StackedBarHorizontalComponent<T, X>;
}

/**
 * Joins one group per series and draws that series' slices with the bar component. This is
 * everything the two orientations have in common; they differ only in how the four bar
 * dimensions are derived from the props.
 */
function drawStacks<T, X extends string | number>(
  selection: Selection<Element, unknown, null, undefined>,
  data: StackedBarSeries<T, X>[],
  barGen: BarComponent<StackedBarSlice<T, X>>
): void {
  const groups = selection
    .selectAll(".sszvis-stack")
    .data(data)
    .join("g")
    .classed("sszvis-stack", true);

  groups.call(barGen);
}

export function stackedBarHorizontal<
  T = unknown,
  X extends string | number = string,
>(): StackedBarHorizontalComponent<T, X> {
  return component<StackedBarHorizontalComponent<T, X>>()
    .prop("xScale", fn.functor)
    .prop("width", fn.functor)
    .prop("yScale", fn.functor)
    .prop("height", fn.functor)
    .prop("fill")
    .prop("stroke")
    .render(function (this: Element, data: StackedBarSeries<T, X>[]) {
      const selection = select(this);
      const props = selection.props<HorizontalProps<T, X>>();

      const barGen = bar<StackedBarSlice<T, X>>()
        .x(fn.compose(props.xScale, fst))
        .y(fn.compose(props.yScale, stackAcc))
        .width((d) => props.xScale(d[1]) - props.xScale(d[0]))
        .height(props.height)
        .fill(props.fill)
        .stroke(props.stroke || "#FFFFFF");

      drawStacks(selection, data, barGen);
    });
}

export function stackedBarVertical<
  T = unknown,
  X extends string | number = string,
>(): StackedBarVerticalComponent<T, X> {
  return component<StackedBarVerticalComponent<T, X>>()
    .prop("xScale", fn.functor)
    .prop("width", fn.functor)
    .prop("yScale", fn.functor)
    .prop("height", fn.functor)
    .prop("fill")
    .prop("stroke")
    .render(function (this: Element, data: StackedBarSeries<T, X>[]) {
      const selection = select(this);
      const props = selection.props<VerticalProps<T, X>>();

      const barGen = bar<StackedBarSlice<T, X>>()
        .x(fn.compose(props.xScale, stackAcc))
        .y(fn.compose(props.yScale, snd))
        .width(props.width)
        .height((d) => props.yScale(d[0]) - props.yScale(d[1]))
        .fill(props.fill)
        .stroke(props.stroke || "#FFFFFF");

      drawStacks(selection, data, barGen);
    });
}
