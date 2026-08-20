/**
 * Stacked Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at it's spine, i.e. the center of
 * the chart.
 *
 * @module sszvis/component/stackedPyramid
 *
 * @requires sszvis.component.bar
 *
 * @property {number, d3.scale} [barFill]          The color of a bar
 * @property {number, d3.scale} barHeight          The height of a bar
 * @property {number, d3.scale} barWidth           The width of a bar
 * @property {number, d3.scale} barPosition        The vertical position of a bar
 * @property {Array<number, number>} tooltipAnchor The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars
 * @property {function}         leftAccessor       Data for the left side
 * @property {function}         rightAccessor      Data for the right side
 * @property {function}         [leftRefAccessor]  Reference data for the left side
 * @property {function}         [rightRefAccessor] Reference data for the right side
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
import {
  type Component,
  component,
  type PropertySetter,
  type RenderCallback,
  type SelectionRenderCallback,
} from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";
import bar, { type BarComponent } from "./bar.js";

/* Constants
----------------------------------------------- */
const SPINE_PADDING = 0.5;

const dataAcc = fn.prop("data");
const rowAcc = fn.prop("row");

/* Types
----------------------------------------------- */

/** One row of the cascade: every series of one row of one side, each holding that cell's data. */
type CascadeRow<T> = Record<string, T[]>;

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
  maxValue: number | undefined;
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
  _rowAcc: (datum: T) => string | number,
  seriesAcc: (datum: T) => string | number,
  valueAcc: (datum: T) => number
) {
  return (data: T[]): StackedPyramidLayout<T, S> => {
    const grouped: CascadeRow<T>[][] = cascade<T>()
      .arrayBy(sideAcc)
      .arrayBy(_rowAcc)
      .objectBy(seriesAcc)
      .apply(data);

    const sides = grouped.map((rows) => {
      // Only the first row of the side is consulted, so a series that is absent from it is
      // dropped from the whole side, and a later row missing one of these keys throws below.
      const keys = Object.keys(rows[0]);
      const side = sideAcc(rows[0][keys[0]][0]);

      const stacks = d3Stack<CascadeRow<T>, string>()
        .keys(keys)
        // Only the first datum of each cell is read, and the read is unguarded.
        .value((x, key) => valueAcc(x[key][0]))(rows);

      // Simplify the 'data' property. The slices themselves are the objects d3 created,
      // rewritten in place, so a caller holding one sees the new shape. The series arrays are
      // rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
      // series - have to be carried across by hand.
      return stacks.map((stack, i) => {
        const slices = stack.map((d, row) => {
          const datum = d.data[keys[i]][0];
          return Object.assign(d, {
            data: datum,
            series: keys[i],
            side,
            // The row's position within the side, not the value the row accessor returned.
            row,
            value: valueAcc(datum),
          });
        });
        return Object.assign(slices, { key: stack.key, index: stack.index });
      });
    });

    // Compute the max value, for convenience. This value is needed to construct
    // the horizontal scale.
    const maxValue = max(sides, (s) => max(s, (rows) => max(rows, (row) => row[1])));

    return Object.assign(sides, { maxValue });
  };
}

/* Component
----------------------------------------------- */

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
type StoredHeight<T, S extends string | number> = (
  slice?: StackedPyramidSlice<T, S>,
  index?: number
) => number;

/** How barFill reads back. It is composed with the slice's `data`, so it reads a source row. */
type StoredFill<T> = (datum?: T, index?: number) => string | undefined;

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
 * A constant or an accessor over a slice's source row. barFill is composed with the slice's
 * `data`, and fn.compose forwards d3's index only to the innermost function, so unlike bar's
 * own fill this one is called with the datum alone.
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
export interface StackedPyramidComponent<T = unknown, S extends string | number = string>
  extends ComponentBuilder<StackedPyramidComponent<T, S>> {
  barHeight(): StoredHeight<T, S>;
  barHeight<U = StackedPyramidSlice<T, S>>(
    value: PyramidValue<U, number>
  ): StackedPyramidComponent<T, S>;
  barWidth(): StoredWidth;
  barWidth(value: PyramidValue<number, number>): StackedPyramidComponent<T, S>;
  barPosition(): StoredPosition;
  barPosition(value: PyramidValue<number, number>): StackedPyramidComponent<T, S>;
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
  return component<StackedPyramidComponent<T, S>>()
    .prop("barHeight", fn.functor)
    .prop("barWidth", fn.functor)
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

      // Components

      const leftBar = bar<StackedPyramidSlice<T, S>>()
        .x((d) => -SPINE_PADDING - props.barWidth(d[1]))
        .y(fn.compose(props.barPosition, rowAcc))
        .height(props.barHeight)
        .width((d) => props.barWidth(d[1]) - props.barWidth(d[0]))
        .fill(fn.compose(props.barFill, dataAcc))
        .tooltipAnchor(props.tooltipAnchor);

      const rightBar = bar<StackedPyramidSlice<T, S>>()
        .x((d) => SPINE_PADDING + props.barWidth(d[0]))
        .y(fn.compose(props.barPosition, rowAcc))
        .height(props.barHeight)
        .width((d) => props.barWidth(d[1]) - props.barWidth(d[0]))
        .fill(fn.compose(props.barFill, dataAcc))
        .tooltipAnchor(props.tooltipAnchor);

      const leftStack = stackComponent<T, S>().stackElement(leftBar);

      const rightStack = stackComponent<T, S>().stackElement(rightBar);

      const leftLine = lineComponent()
        .barPosition(props.barPosition)
        .barWidth(props.barWidth)
        .mirror(true);

      const rightLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth);

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
    });
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
        .selectAll<SVGGElement, StackedPyramidSeries<T, S>>("[data-sszvis-stack]")
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
  barWidth: StoredWidth;
  mirror: boolean;
};

interface ReferenceLineComponent extends ComponentBuilder<ReferenceLineComponent> {
  barPosition(): StoredPosition;
  barPosition(value: StoredPosition): ReferenceLineComponent;
  barWidth(): StoredWidth;
  barWidth(value: StoredWidth): ReferenceLineComponent;
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
