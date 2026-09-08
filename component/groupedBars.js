import { select, scaleBand, range } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';
import { functor, not } from '../fn.js';
import translateString from '../svgUtils/translateString.js';
import { defaultTransition } from '../transition.js';

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
function createGroupedBarsComponent(config) {
  return component().prop("groupScale").prop("groupSize").prop("groupWidth").prop("groupHeight").prop("groupSpace").groupSpace(0.05).prop("x", functor).prop("y", functor).prop("width").prop("height").prop("fill").prop("stroke").prop("defined", functor).defined(true).prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const inGroupScale = scaleBand().domain(range(props.groupSize)).padding(props.groupSpace).paddingOuter(0).rangeRound(config.inGroupRange(props));
    const groups = selection.selectAll("g.sszvis-bargroup").data(data).join("g").classed("sszvis-bargroup", true);
    const barUnits = groups.selectAll("g.sszvis-barunit").data(d => d).join("g").classed("sszvis-barunit", true);
    barUnits.each((d, i) => {
      d.__sszvisGroupedBarIndex__ = i;
    });
    // Accessors are called with the bar's index within its group, which is never the index
    // d3 would supply: a bar's own rect is joined one datum at a time, where d3 passes 0,
    // and the missing-value cross is positioned on a filtered selection, where d3 passes
    // the position among the missing bars only. The index recorded above is used instead.
    // The `each` above tags every datum on every render, before any accessor runs, so the
    // tag is always present here.
    const groupIndexOf = d => d.__sszvisGroupedBarIndex__;
    const configX = config.x(props, inGroupScale);
    const configY = config.y(props, inGroupScale);
    const configWidth = config.width(props, inGroupScale);
    const configHeight = config.height(props, inGroupScale);
    const configMissingTransform = config.missingTransform(props, inGroupScale);
    const xAt = d => configX(d, groupIndexOf(d));
    const yAt = d => configY(d, groupIndexOf(d));
    const widthAt = d => typeof configWidth === "function" ? configWidth(d, groupIndexOf(d)) : configWidth;
    const heightAt = d => typeof configHeight === "function" ? configHeight(d, groupIndexOf(d)) : configHeight;
    const fillAt = d => typeof props.fill === "function" ? props.fill(d, groupIndexOf(d)) : props.fill;
    const strokeAt = d => {
      var _ref;
      return (_ref = typeof props.stroke === "function" ? props.stroke(d, groupIndexOf(d)) : props.stroke) !== null && _ref !== void 0 ? _ref : null;
    };
    const missingTransformAt = d => configMissingTransform(d, groupIndexOf(d));
    const unitsWithValue = barUnits.filter(props.defined);
    const unitsWithoutValue = barUnits.filter(not(props.defined));
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
    const bars = unitsWithValue.selectAll("rect.sszvis-bar-rect").data(d => [d]).join(enter => enter.append("rect").classed("sszvis-bar sszvis-bar-rect", true).attr("x", xAt).attr("y", yAt).attr("width", widthAt).attr("height", heightAt)).attr("fill", fillAt).attr("stroke", strokeAt);
    if (props.transition) {
      bars.transition(defaultTransition()).attr("x", xAt).attr("y", yAt).attr("width", widthAt).attr("height", heightAt);
    } else {
      // A transition scheduled by an earlier render would keep ticking and overwrite the
      // geometry written here, so `transition(false)` is only deterministic once any
      // in-flight tween is interrupted. This matters on a resize or an event that lands
      // mid-animation.
      bars.interrupt().attr("x", xAt).attr("y", yAt).attr("width", widthAt).attr("height", heightAt);
    }
    // The join selectors use component-owned marker classes so a consumer-added
    // <line class="line1"> inside the unit is never adopted or overwritten. The public
    // line1/line2 classes are kept on the component's own lines for styling.
    // The geometry is constant, so it is reapplied on the merged selection: the lines are
    // no longer re-appended on every render, and a mutated attribute must not persist.
    unitsWithoutValue.selectAll("line.sszvis-bar--missing-cross-1").data(d => [d]).join(enter => enter.append("line").classed("sszvis-bar--missing sszvis-bar--missing-cross-1 line1", true)).attr("x1", -4).attr("y1", -4).attr("x2", 4).attr("y2", 4);
    unitsWithoutValue.selectAll("line.sszvis-bar--missing-cross-2").data(d => [d]).join(enter => enter.append("line").classed("sszvis-bar--missing sszvis-bar--missing-cross-2 line2", true)).attr("x1", 4).attr("y1", -4).attr("x2", -4).attr("y2", 4);
    const ta = tooltipAnchor().position(config.tooltipPosition(props, inGroupScale));
    selection.call(ta);
  });
}
const createVerticalConfig = () => ({
  inGroupRange: _ref2 => {
    let {
      groupWidth
    } = _ref2;
    return [0, groupWidth];
  },
  x: (_ref3, inGroupScale) => {
    let {
      groupScale
    } = _ref3;
    return (d, _i) => {
      var _inGroupScale;
      return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale !== void 0 ? _inGroupScale : 0 : 0);
    };
  },
  y: _ref4 => {
    let {
      y
    } = _ref4;
    return y;
  },
  width: (_, inGroupScale) => inGroupScale.bandwidth(),
  height: _ref5 => {
    let {
      height
    } = _ref5;
    return height;
  },
  missingTransform: (_ref6, inGroupScale) => {
    let {
      groupScale,
      y
    } = _ref6;
    return (d, groupIndex) => {
      var _inGroupScale2;
      return translateString(groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale2 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale2 !== void 0 ? _inGroupScale2 : 0 : 0) + inGroupScale.bandwidth() / 2, y(d, groupIndex));
    };
  },
  tooltipPosition: (_ref7, inGroupScale) => {
    let {
      groupScale,
      y
    } = _ref7;
    return group => {
      let xTotal = 0;
      let tallest = Infinity;
      for (const [i, d] of group.entries()) {
        var _inGroupScale3;
        const datum = d;
        xTotal += groupScale(datum) + (datum.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale3 = inGroupScale(datum.__sszvisGroupedBarIndex__)) !== null && _inGroupScale3 !== void 0 ? _inGroupScale3 : 0 : 0) + inGroupScale.bandwidth() / 2;
        // smaller y is higher
        tallest = Math.min(tallest, y(datum, i));
      }
      return [xTotal / group.length, tallest];
    };
  }
});
const createHorizontalConfig = () => ({
  inGroupRange: props => [0, props.groupHeight],
  x: _ref8 => {
    let {
      x
    } = _ref8;
    return x;
  },
  y: (_ref9, inGroupScale) => {
    let {
      groupScale
    } = _ref9;
    return d => {
      var _inGroupScale4;
      return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale4 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale4 !== void 0 ? _inGroupScale4 : 0 : 0);
    };
  },
  width: _ref0 => {
    let {
      width
    } = _ref0;
    return width;
  },
  height: (_, inGroupScale) => inGroupScale.bandwidth(),
  missingTransform: (_ref1, inGroupScale) => {
    let {
      groupScale,
      x
    } = _ref1;
    return (d, groupIndex) => {
      var _inGroupScale5;
      return translateString(x(d, groupIndex), groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale5 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale5 !== void 0 ? _inGroupScale5 : 0 : 0) + inGroupScale.bandwidth() / 2);
    };
  },
  tooltipPosition: (_ref10, inGroupScale) => {
    let {
      groupScale,
      x
    } = _ref10;
    return group => {
      let yTotal = 0;
      let rightmost = -Infinity;
      for (const [i, d] of group.entries()) {
        var _inGroupScale6;
        const datum = d;
        yTotal += groupScale(datum) + (datum.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale6 = inGroupScale(datum.__sszvisGroupedBarIndex__)) !== null && _inGroupScale6 !== void 0 ? _inGroupScale6 : 0 : 0) + inGroupScale.bandwidth() / 2;
        // larger x is more to the right
        rightmost = Math.max(rightmost, x(datum, i));
      }
      return [rightmost, yTotal / group.length];
    };
  }
});
const groupedBarsVertical = () => createGroupedBarsComponent(createVerticalConfig());
const groupedBarsHorizontal = () => createGroupedBarsComponent(createHorizontalConfig());
/**
 * The default grouped bars component is the vertical version.
 *
 * @deprecated Use `groupedBarsVertical` instead.
 */
const groupedBars = groupedBarsVertical;

export { groupedBars, groupedBarsHorizontal, groupedBarsVertical };
//# sourceMappingURL=groupedBars.js.map
