/**
 * Grouped Bars component
 *
 * This component includes both the vertical and horizontal grouped bar chart components.
 * Both are variations on the same concept, using the same grouping logic but rendered
 * using different dimensions.
 *
 * The input to the grouped bar component should be an array of arrays, where each inner
 * array contains the bars for a single group. Each of the inner arrays becomes a group, and
 * each element in those inner arrays becomes a bar.
 *
 * In addition to the raw data, the user must provide other information necessary for calculating
 * the layout of the groups of bars, namely the number of bars in each group (this component requires that
 * all groups have the same number of bars), a scale for finding the offset of each group (usually an
 * instance of d3.scaleBand), a width/height for groups, and position/dimension scales for the bars in the group.
 * Note that the number of bars in each group and the group width/height determines how wide/tall each bar will be,
 * and this is calculated internally to the groupedBars component.
 *
 * The groups are calculated and laid out entirely by the groupedBars component.
 *
 * @module sszvis/component/groupedBars/vertical
 * @module sszvis/component/groupedBars/horizontal
 *
 * @property {scale} groupScale         This should be a scale function for determining the correct group offset of a member of a group.
 *                                      This function is passed the group member, and should return a value for the group offset which
 *                                      is the same for all members of the group. The within-group offset (which is different for each member)
 *                                      is then added to this group offset in order to position the bars individually within the group.
 *                                      So, for instance, if the groups are based on the "city" property, the groupScale should return
 *                                      the same value for all data objects with "city = Zurich".
 * @property {number} groupSize         This property tells groupedBars how many bars to expect for each group. It is used to assist in
 *                                      calculating the within-group layout and size of the bars. This number is treated as the same for all
 *                                      groups. Groups with less members than this number will have visible gaps. (Note that having less members
 *                                      in a group is not the same as having a member with a missing value, which will be discussed later)
 * @property {number} groupWidth        The width of the groups (vertical orientation). This value is treated as the same for all groups.
 *                                      The width available to the groups is divided up among the bars.
 * @property {number} groupHeight       The height of the groups (horizontal orientation). This value is treated as the same for all groups.
 *                                      The height available to the groups is divided up among the bars.
 * @property {number} groupSpace        The percentage of space between each bar within a group. (default: 0.05). Usually the default is fine here.
 * @property {function} x               The x-position of the bars (horizontal orientation). This function is given a data value and should return
 *                                      an x-value. Used for horizontal grouped bars.
 * @property {function} y               The y-position of the bars (vertical orientation). This function is given a data value and should return
 *                                      a y-value. Used for vertical grouped bars.
 * @property {function} width           The width of the bars (horizontal orientation). This function is given a data value and should return
 *                                      a width value. Used for horizontal grouped bars.
 * @property {function} height          The height of the bars (vertical orientation). This function is given a data value and should return
 *                                      a height value. Used for vertical grouped bars.
 * @property {string, function} fill    A functor which gives the color for each bar (often based on the bar's group). This can be a string or a function.
 * @property {string, function} stroke  The stroke color for each bar (default: none)
 * @property {function} defined         A predicate function which can be used to determine whether a bar has a defined value. (default: true).
 *                                      Any bar for which this function returns false, meaning that it has an undefined (missing) value,
 *                                      will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with
 *                                      missing values from bars with very small values, which would display as a very thin rectangle.
 *
 * @return {sszvis.component}
 */

import { range, type ScaleBand, scaleBand, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import translateString from "../svgUtils/translateString.js";

// Extended datum type that includes the internal index property
type DatumWithIndex<T> = T & {
  __sszvisGroupedBarIndex__?: number;
};

type GroupedBarsProps<T = unknown> = {
  groupScale: (datum: T) => number;
  groupSize: number;
  groupWidth: number;
  groupHeight: number;
  groupSpace: number;
  x: (datum: T, index: number) => number;
  y: (datum: T, index: number) => number;
  width: number | ((datum: T) => number);
  height: number | ((datum: T) => number);
  fill: string | ((datum: T) => string);
  stroke?: string | ((datum: T) => string);
  defined: (datum: T) => boolean;
};

// Component interface with proper method overloads
interface GroupedBarsComponent<T = unknown> extends Component {
  groupScale(): (datum: T) => number;
  groupScale(scale: (datum: T) => number): GroupedBarsComponent<T>;
  groupSize(): number;
  groupSize(size: number): GroupedBarsComponent<T>;
  groupWidth(): number;
  groupWidth(width: number): GroupedBarsComponent<T>;
  groupHeight(): number;
  groupHeight(height: number): GroupedBarsComponent<T>;
  groupSpace(): number;
  groupSpace(space: number): GroupedBarsComponent<T>;
  x(): (datum: T, index: number) => number;
  x(accessor: (datum: T, index: number) => number): GroupedBarsComponent<T>;
  y(): (datum: T, index: number) => number;
  y(accessor: (datum: T, index: number) => number): GroupedBarsComponent<T>;
  width(): number | ((datum: T) => number);
  width(value: number | ((datum: T) => number)): GroupedBarsComponent<T>;
  height(): number | ((datum: T) => number);
  height(value: number | ((datum: T) => number)): GroupedBarsComponent<T>;
  fill(): string | ((datum: T) => string);
  fill(value: string | ((datum: T) => string)): GroupedBarsComponent<T>;
  stroke(): string | ((datum: T) => string) | undefined;
  stroke(value: string | ((datum: T) => string)): GroupedBarsComponent<T>;
  defined(): (datum: T) => boolean;
  defined(predicate: boolean | ((datum: T) => boolean)): GroupedBarsComponent<T>;
}

// Config type for vertical and horizontal configurations
type GroupedBarsConfig<T> = {
  inGroupRange(props: GroupedBarsProps<T>): [number, number];
  x(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): (d: DatumWithIndex<T>, i: number) => number;
  y(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): (d: DatumWithIndex<T>, i: number) => number;
  width(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): number | ((d: DatumWithIndex<T>) => number);
  height(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): number | ((d: DatumWithIndex<T>) => number);
  missingTransform(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): (d: DatumWithIndex<T>, i: number) => string;
  tooltipPosition(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>
  ): (group: T[]) => [number, number];
};

function groupedBars<T = unknown>(config: GroupedBarsConfig<T>): GroupedBarsComponent<T> {
  return component()
    .prop("groupScale")
    .prop("groupSize")
    .prop("groupWidth")
    .prop("groupHeight")
    .prop("groupSpace")
    .groupSpace(0.05)
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("width")
    .prop("height")
    .prop("fill")
    .prop("stroke")
    .prop("defined", fn.functor)
    .defined(true)
    .render(function (this: Element, data: T[][]) {
      const selection = select(this);
      const props = selection.props<GroupedBarsProps<T>>();

      const inGroupScale = scaleBand<number>()
        .domain(range(props.groupSize))
        .padding(props.groupSpace)
        .paddingOuter(0)
        .rangeRound(config.inGroupRange(props));

      const groups = selection
        .selectAll<SVGGElement, T[]>("g.sszvis-bargroup")
        .data(data)
        .join("g")
        .classed("sszvis-bargroup", true);

      const barUnits = groups
        .selectAll<SVGGElement, DatumWithIndex<T>>("g.sszvis-barunit")
        .data((d) => d as DatumWithIndex<T>[])
        .join("g")
        .classed("sszvis-barunit", true);

      barUnits.each((d, i) => {
        d.__sszvisGroupedBarIndex__ = i;
      });

      const unitsWithValue = barUnits.filter(props.defined);

      // clear the units before rendering
      unitsWithValue.selectAll("*").remove();

      //sszsch: fix: reset previously assigned translations
      unitsWithValue.attr("transform", () => translateString(0, 0));

      unitsWithValue
        .append("rect")
        .classed("sszvis-bar", true)
        .attr("fill", props.fill)
        .attr("stroke", props.stroke ?? null)
        .attr("x", config.x(props, inGroupScale))
        .attr("y", config.y(props, inGroupScale))
        .attr("width", config.width(props, inGroupScale))
        .attr("height", config.height(props, inGroupScale));

      const unitsWithoutValue = barUnits.filter(fn.not(props.defined));

      unitsWithoutValue.selectAll("*").remove();

      unitsWithoutValue.attr("transform", config.missingTransform(props, inGroupScale));

      unitsWithoutValue
        .append("line")
        .classed("sszvis-bar--missing line1", true)
        .attr("x1", -4)
        .attr("y1", -4)
        .attr("x2", 4)
        .attr("y2", 4);

      unitsWithoutValue
        .append("line")
        .classed("sszvis-bar--missing line2", true)
        .attr("x1", 4)
        .attr("y1", -4)
        .attr("x2", -4)
        .attr("y2", 4);

      const ta = tooltipAnchor<T[]>().position(config.tooltipPosition(props, inGroupScale));

      selection.call(ta);
    });
}

const createVerticalConfig = <T>(): GroupedBarsConfig<T> => ({
  inGroupRange: (props) => [0, props.groupWidth],
  x: (props, inGroupScale) => (d) =>
    props.groupScale(d) + (inGroupScale(d.__sszvisGroupedBarIndex__!) ?? 0),
  y: (props) => props.y,
  width: (_props, inGroupScale) => inGroupScale.bandwidth(),
  height: (props) => props.height,
  missingTransform: (props, inGroupScale) => (d, i) =>
    translateString(
      props.groupScale(d) +
        (inGroupScale(d.__sszvisGroupedBarIndex__!) ?? 0) +
        inGroupScale.bandwidth() / 2,
      props.y(d, i)
    ),
  tooltipPosition: (props, inGroupScale) => (group) => {
    let xTotal = 0;
    let tallest = Infinity;
    for (const [i, d] of group.entries()) {
      const datum = d as DatumWithIndex<T>;
      xTotal +=
        props.groupScale(datum) +
        (inGroupScale(datum.__sszvisGroupedBarIndex__!) ?? 0) +
        inGroupScale.bandwidth() / 2;
      // smaller y is higher
      tallest = Math.min(tallest, props.y(datum, i));
    }
    const xAverage = xTotal / group.length;
    return [xAverage, tallest];
  },
});

const createHorizontalConfig = <T>(): GroupedBarsConfig<T> => {
  return {
    inGroupRange: (props) => [0, props.groupHeight],
    x: (props) => props.x,
    y: (props, inGroupScale) => (d) =>
      props.groupScale(d) + (inGroupScale(d.__sszvisGroupedBarIndex__!) ?? 0),
    width: (props) => props.width,
    height: (_props, inGroupScale) => inGroupScale.bandwidth(),
    missingTransform: (props, inGroupScale) => (d, i) =>
      translateString(
        props.x(d, i),
        props.groupScale(d) +
          (inGroupScale(d.__sszvisGroupedBarIndex__!) ?? 0) +
          inGroupScale.bandwidth() / 2
      ),
    tooltipPosition: (props, inGroupScale) => (group) => {
      let yTotal = 0;
      let rightmost = -Infinity;
      for (const [i, d] of group.entries()) {
        const datum = d as DatumWithIndex<T>;
        yTotal +=
          props.groupScale(datum) +
          (inGroupScale(datum.__sszvisGroupedBarIndex__!) ?? 0) +
          inGroupScale.bandwidth() / 2;
        // larger x is more to the right
        rightmost = Math.max(rightmost, props.x(datum, i));
      }
      const yAverage = yTotal / group.length;
      return [rightmost, yAverage];
    },
  };
};

export const groupedBarsVertical = <T = unknown>() => groupedBars<T>(createVerticalConfig<T>());

export const groupedBarsHorizontal = <T = unknown>() => groupedBars<T>(createHorizontalConfig<T>());

// Backward compatibility - default export is vertical
export default groupedBarsVertical;
