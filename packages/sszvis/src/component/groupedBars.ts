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
 * @template T The type of the data objects in the bar groups
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
 * @property {function} x               The x-position of the bars (horizontal orientation). This function is given a data value and the bar's
 *                                      index within its group, and should return an x-value. Used for horizontal grouped bars.
 * @property {function} y               The y-position of the bars (vertical orientation). This function is given a data value and the bar's
 *                                      index within its group, and should return a y-value. Used for vertical grouped bars.
 * @property {function} width           The width of the bars (horizontal orientation). This function is given a data value and the bar's
 *                                      index within its group, and should return a width value. Used for horizontal grouped bars.
 * @property {function} height          The height of the bars (vertical orientation). This function is given a data value and the bar's
 *                                      index within its group, and should return a height value. Used for vertical grouped bars.
 * @property {string, function} fill    A functor which gives the color for each bar (often based on the bar's group). This can be a string or a
 *                                      function; a function is given a data value and the bar's index within its group.
 * @property {string, function} stroke  The stroke color for each bar (default: none). As with fill, a function is given a data value and the
 *                                      bar's index within its group.
 * @property {function} defined         A predicate function which can be used to determine whether a bar has a defined value. (default: true).
 *                                      Any bar for which this function returns false, meaning that it has an undefined (missing) value,
 *                                      will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with
 *                                      missing values from bars with very small values, which would display as a very thin rectangle.
 * @property {boolean} transition       Whether or not to transition the geometry of the bars when it changes.
 *                                      Defaults to true, and eases over 300ms.
 *
 * Note: every consumer accessor - x, y, width, height, fill and stroke - is called with the bar's
 * index within its group, which is the index inGroupScale is keyed on. That holds for every call
 * site, including the cross-axis coordinate of the missing-value cross. This is a deliberate change
 * from the pre-fix behaviour, where d3 supplied the index within the selection of bars it was
 * applying the attribute to - the bars with a defined value, or the bars without one - so a group
 * containing missing values could see the same datum handed two different indices in one render.
 *
 * Note: the geometry accessors are guarded. A value that is not a finite number - NaN,
 * Infinity, undefined, null, or anything that does not coerce - becomes 0 rather than being
 * written into an attribute, so a bad accessor return parks a bar at 0 instead of producing
 * an invalid rect. The missing-value cross's translation is guarded the same way. fill and
 * stroke are not guarded, because they are colours. This matches bar and dot.
 *
 * Note: each orientation supplies the along-group dimensions itself, so it never calls the
 * consumer's accessors for them. Vertical grouped bars ignore x and width; horizontal grouped bars
 * ignore y and height. Passing one of those has no effect and raises no error.
 *
 * Note: entering bars receive their geometry on the join, before the transition starts, so they
 * appear in place rather than animating up from nothing. Only updates animate. fill and stroke are
 * deliberately not transitioned, matching `bar` - a colour change jumps - because the colour scales
 * these charts use are categorical and interpolating between two category colours reads as a third
 * category. The missing-value cross is positioned by a translation on the bar unit, which is not
 * transitioned either.
 *
 * @return {sszvis.component}
 */

import { range, type ScaleBand, scaleBand, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { toFinite } from "../svgUtils/toFinite.js";
import translateString from "../svgUtils/translateString.js";
import { defaultTransition, OWN_TRANSITION } from "../transition.js";

type GroupedBarsProps<T = unknown> = {
  groupScale: (datum: T) => number;
  groupSize: number;
  groupWidth: number;
  groupHeight: number;
  groupSpace: number;
  x: (datum: T, index: number) => number;
  y: (datum: T, index: number) => number;
  width: number | ((datum: T, index: number) => number);
  height: number | ((datum: T, index: number) => number);
  fill: string | ((datum: T, index: number) => string);
  stroke?: string | ((datum: T, index: number) => string);
  defined: (datum: T) => boolean;
  transition: boolean;
};

// Component interface with proper method overloads
// Setters use `any` to allow passing more specific datum types without requiring explicit generic parameter
interface GroupedBarsComponent<T = unknown> extends ComponentBuilder<GroupedBarsComponent<T>> {
  groupScale(): (datum: T) => number;
  groupScale<U = T>(scale: (datum: U) => number | undefined): GroupedBarsComponent<T>;
  groupSize(): number;
  groupSize(size: number): GroupedBarsComponent<T>;
  groupWidth(): number;
  groupWidth(width: number): GroupedBarsComponent<T>;
  groupHeight(): number;
  groupHeight(height: number): GroupedBarsComponent<T>;
  groupSpace(): number;
  groupSpace(space: number): GroupedBarsComponent<T>;
  x(): (datum: T, index: number) => number;
  x<U = T>(accessor: (datum: U, index: number) => number): GroupedBarsComponent<T>;
  y(): (datum: T, index: number) => number;
  y<U = T>(accessor: (datum: U, index: number) => number): GroupedBarsComponent<T>;
  width(): number | ((datum: T, index: number) => number);
  width<U = T>(value: number | ((datum: U, index: number) => number)): GroupedBarsComponent<T>;
  height(): number | ((datum: T, index: number) => number);
  height<U = T>(value: number | ((datum: U, index: number) => number)): GroupedBarsComponent<T>;
  fill(): string | ((datum: T, index: number) => string);
  fill<U = T>(value: string | ((datum: U, index: number) => string)): GroupedBarsComponent<T>;
  stroke(): string | ((datum: T, index: number) => string) | undefined;
  stroke<U = T>(
    value: string | ((datum: U, index: number) => string) | undefined,
  ): GroupedBarsComponent<T>;
  defined(): (datum: T) => boolean;
  defined<U = T>(predicate: boolean | ((datum: U) => boolean)): GroupedBarsComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): GroupedBarsComponent<T>;
}

// Config type for vertical and horizontal configurations
type GroupedBarsConfig<T> = {
  inGroupRange(props: GroupedBarsProps<T>): [number, number];
  x(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): (d: T, groupIndex: number) => number;
  y(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): (d: T, groupIndex: number) => number;
  width(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): number | ((d: T, groupIndex: number) => number);
  height(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): number | ((d: T, groupIndex: number) => number);
  missingTransform(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): (d: T, groupIndex: number) => string;
  tooltipPosition(
    props: GroupedBarsProps<T>,
    inGroupScale: ScaleBand<number>,
  ): (group: T[]) => [number, number];
};

function createGroupedBarsComponent<T = unknown>(
  config: GroupedBarsConfig<T>,
): GroupedBarsComponent<T> {
  return component<GroupedBarsComponent<T>>()
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
    .prop("transition")
    .transition(true)
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
        .selectAll<SVGGElement, T>("g.sszvis-barunit")
        .data((d) => d)
        .join("g")
        .classed("sszvis-barunit", true);

      // The bar's index within its group is recorded against the unit element rather than
      // written onto the datum, so a datum object reused across groups is not aliased: it is
      // the element that is unique per bar, not the caller's object. This also keeps the datum
      // bound to .sszvis-barunit and to the bar's rect exactly the caller's own object, which
      // consumers rely on - a mouseover handler on `.sszvis-barunit rect` receives it and may
      // compare it by identity.
      const groupIndexByUnit = new WeakMap<Element, number>();
      barUnits.each(function (_d, i) {
        groupIndexByUnit.set(this, i);
      });

      // Accessors are called with the bar's index within its group, which is never the index
      // d3 would supply: a bar's own rect is joined one datum at a time, where d3 passes 0,
      // and the missing-value cross is positioned on a filtered selection, where d3 passes
      // the position among the missing bars only. The index recorded above is used instead.
      //
      // It is resolved from the element the callback is running on, so there are two shapes.
      // A callback on the bar unit - the missing-value cross's transform - reads the unit
      // directly; a callback on the bar's rect reads the rect's parent, which is the unit.
      // The `each` above covers the whole barUnits join before any accessor runs, so every
      // unit is in the map by the time an accessor can ask. A miss therefore means the DOM
      // was changed underneath the component, and it throws rather than defaulting: a `?? 0`
      // here would place the bar at its group's left edge, on top of whichever bar belongs
      // there, which is the silent misrender the configs stopped risking.
      //
      // Note this is only about the index lookup. The configs still apply `?? 0` to the
      // inGroupScale result, whose domain is range(groupSize), so a group holding more
      // members than groupSize leaves its trailing bars with no band and stacks them at the
      // group's left edge. That is long-standing behaviour for a group larger than declared
      // - the component documents the under-full case as visible gaps and does not define
      // the over-full one - and it is unchanged here.
      const indexOfUnit = (unit: Element) => {
        const index = groupIndexByUnit.get(unit);
        if (index === undefined) {
          throw new Error("[groupedBars] a bar unit is missing its in-group index");
        }
        return index;
      };
      const indexOfRect = (rect: Element) => indexOfUnit(rect.parentNode as Element);

      const configX = config.x(props, inGroupScale);
      const configY = config.y(props, inGroupScale);
      const configWidth = config.width(props, inGroupScale);
      const configHeight = config.height(props, inGroupScale);
      const configMissingTransform = config.missingTransform(props, inGroupScale);

      // Guarded the way bar and dot guard theirs, so a consumer accessor returning NaN cannot
      // reach an attribute. fill and stroke are deliberately not guarded - they are colours,
      // and neither bar nor dot guards those either.
      const xAt = function (this: SVGRectElement, d: T) {
        return toFinite(configX(d, indexOfRect(this)));
      };
      const yAt = function (this: SVGRectElement, d: T) {
        return toFinite(configY(d, indexOfRect(this)));
      };
      const widthAt = function (this: SVGRectElement, d: T) {
        return toFinite(
          typeof configWidth === "function" ? configWidth(d, indexOfRect(this)) : configWidth,
        );
      };
      const heightAt = function (this: SVGRectElement, d: T) {
        return toFinite(
          typeof configHeight === "function" ? configHeight(d, indexOfRect(this)) : configHeight,
        );
      };
      const fillAt = function (this: SVGRectElement, d: T) {
        return typeof props.fill === "function" ? props.fill(d, indexOfRect(this)) : props.fill;
      };
      const strokeAt = function (this: SVGRectElement, d: T) {
        return (
          (typeof props.stroke === "function"
            ? props.stroke(d, indexOfRect(this))
            : props.stroke) ?? null
        );
      };
      const missingTransformAt = function (this: SVGGElement, d: T) {
        return configMissingTransform(d, indexOfUnit(this));
      };

      const unitsWithValue = barUnits.filter(props.defined);
      const unitsWithoutValue = barUnits.filter(fn.not(props.defined));

      // A unit keeps its children across renders so they can tween, so each shape is joined
      // within the unit and the shapes belonging to the other state are joined against no
      // data, which removes them. That is what lets a bar switch between a rect and the
      // missing-value cross without the unit being emptied.
      unitsWithValue.selectAll("line.sszvis-bar--missing").data([]).exit().remove();
      unitsWithoutValue.selectAll("rect.sszvis-bar-rect").data([]).exit().remove();

      // The unit's translation only positions the missing-value cross. A unit that regains a
      // value has to lose it again, because its rect is positioned in the unit's own frame.
      unitsWithValue.attr("transform", () => translateString(0, 0));
      unitsWithoutValue.attr("transform", missingTransformAt);

      // Entering bars are given their geometry on the join, so they are in place before any
      // transition starts. The geometry is then applied exactly once more - to the transition
      // when there is one, and to the plain selection otherwise - so an update tweens from its
      // previous value instead of from the value it already holds.
      //
      // The join selector uses the component-owned marker class, as bar() does, so a
      // consumer-added <rect class="sszvis-bar"> inside the unit is never adopted by the
      // join nor removed by its exit. The public sszvis-bar class stays on the component's
      // own rect for styling and consumer selection.
      const bars = unitsWithValue
        .selectAll<SVGRectElement, T>("rect.sszvis-bar-rect")
        .data((d) => [d])
        .join((enter) =>
          enter
            .append("rect")
            .classed("sszvis-bar sszvis-bar-rect", true)
            .attr("x", xAt)
            .attr("y", yAt)
            .attr("width", widthAt)
            .attr("height", heightAt),
        )
        .attr("fill", fillAt)
        .attr("stroke", strokeAt);

      if (props.transition) {
        bars
          .transition(defaultTransition(OWN_TRANSITION))
          .attr("x", xAt)
          .attr("y", yAt)
          .attr("width", widthAt)
          .attr("height", heightAt);
      } else {
        // A transition scheduled by an earlier render would keep ticking and overwrite the
        // geometry written here, so `transition(false)` is only deterministic once any
        // in-flight tween is interrupted. This matters on a resize or an event that lands
        // mid-animation.
        // Interrupted by name, so a transition the consumer scheduled on these rects keeps
        // running; only the geometry this component owns is stopped.
        bars
          .interrupt(OWN_TRANSITION)
          .attr("x", xAt)
          .attr("y", yAt)
          .attr("width", widthAt)
          .attr("height", heightAt);
      }

      // The join selectors use component-owned marker classes so a consumer-added
      // <line class="line1"> inside the unit is never adopted or overwritten. The public
      // line1/line2 classes are kept on the component's own lines for styling.
      // The geometry is constant, so it is reapplied on the merged selection: the lines are
      // no longer re-appended on every render, and a mutated attribute must not persist.
      unitsWithoutValue
        .selectAll("line.sszvis-bar--missing-cross-1")
        .data((d) => [d])
        .join((enter) =>
          enter
            .append("line")
            .classed("sszvis-bar--missing sszvis-bar--missing-cross-1 line1", true),
        )
        .attr("x1", -4)
        .attr("y1", -4)
        .attr("x2", 4)
        .attr("y2", 4);

      unitsWithoutValue
        .selectAll("line.sszvis-bar--missing-cross-2")
        .data((d) => [d])
        .join((enter) =>
          enter
            .append("line")
            .classed("sszvis-bar--missing sszvis-bar--missing-cross-2 line2", true),
        )
        .attr("x1", 4)
        .attr("y1", -4)
        .attr("x2", -4)
        .attr("y2", 4);

      const ta = tooltipAnchor<T[]>().position(config.tooltipPosition(props, inGroupScale));

      selection.call(ta);
    });
}

const createVerticalConfig = <T>(): GroupedBarsConfig<T> => ({
  inGroupRange: ({ groupWidth }) => [0, groupWidth],
  x:
    ({ groupScale }, inGroupScale) =>
    (d, groupIndex) =>
      groupScale(d) + (inGroupScale(groupIndex) ?? 0),
  y: ({ y }) => y,
  width: (_, inGroupScale) => inGroupScale.bandwidth(),
  height: ({ height }) => height,
  missingTransform:
    ({ groupScale, y }, inGroupScale) =>
    (d, groupIndex) =>
      // Both coordinates are guarded as a whole, not just the consumer accessor: translateString
      // interpolates its arguments into a string, so one non-finite term anywhere in the
      // expression would yield transform="translate(NaN,0)" rather than a placed cross.
      translateString(
        toFinite(groupScale(d) + (inGroupScale(groupIndex) ?? 0) + inGroupScale.bandwidth() / 2),
        toFinite(y(d, groupIndex)),
      ),
  tooltipPosition:
    ({ groupScale, y }, inGroupScale) =>
    (group) => {
      let xTotal = 0;
      let tallest = Infinity;
      for (const [i, d] of group.entries()) {
        xTotal += groupScale(d) + (inGroupScale(i) ?? 0) + inGroupScale.bandwidth() / 2;
        // smaller y is higher
        tallest = Math.min(tallest, y(d, i));
      }
      return [xTotal / group.length, tallest];
    },
});

const createHorizontalConfig = <T>(): GroupedBarsConfig<T> => ({
  inGroupRange: (props) => [0, props.groupHeight],
  x: ({ x }) => x,
  y:
    ({ groupScale }, inGroupScale) =>
    (d, groupIndex) =>
      groupScale(d) + (inGroupScale(groupIndex) ?? 0),
  width: ({ width }) => width,
  height: (_, inGroupScale) => inGroupScale.bandwidth(),
  missingTransform:
    ({ groupScale, x }, inGroupScale) =>
    (d, groupIndex) =>
      // Guarded as a whole, as in the vertical config.
      translateString(
        toFinite(x(d, groupIndex)),
        toFinite(groupScale(d) + (inGroupScale(groupIndex) ?? 0) + inGroupScale.bandwidth() / 2),
      ),
  tooltipPosition:
    ({ groupScale, x }, inGroupScale) =>
    (group) => {
      let yTotal = 0;
      let rightmost = -Infinity;
      for (const [i, d] of group.entries()) {
        yTotal += groupScale(d) + (inGroupScale(i) ?? 0) + inGroupScale.bandwidth() / 2;
        // larger x is more to the right
        rightmost = Math.max(rightmost, x(d, i));
      }
      return [rightmost, yTotal / group.length];
    },
});

export const groupedBarsVertical = <T = unknown>() =>
  createGroupedBarsComponent<T>(createVerticalConfig<T>());

export const groupedBarsHorizontal = <T = unknown>() =>
  createGroupedBarsComponent<T>(createHorizontalConfig<T>());

/**
 * The default grouped bars component is the vertical version.
 *
 * @deprecated Use `groupedBarsVertical` instead.
 */
export const groupedBars = groupedBarsVertical;
