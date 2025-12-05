import { select, scaleBand, range } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';
import { functor, not } from '../fn.js';
import translateString from '../svgUtils/translateString.js';

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
function createGroupedBarsComponent(config) {
  return component().prop("groupScale").prop("groupSize").prop("groupWidth").prop("groupHeight").prop("groupSpace").groupSpace(0.05).prop("x", functor).prop("y", functor).prop("width").prop("height").prop("fill").prop("stroke").prop("defined", functor).defined(true).render(function (data) {
    var _props$stroke;
    const selection = select(this);
    const props = selection.props();
    const inGroupScale = scaleBand().domain(range(props.groupSize)).padding(props.groupSpace).paddingOuter(0).rangeRound(config.inGroupRange(props));
    const groups = selection.selectAll("g.sszvis-bargroup").data(data).join("g").classed("sszvis-bargroup", true);
    const barUnits = groups.selectAll("g.sszvis-barunit").data(d => d).join("g").classed("sszvis-barunit", true);
    barUnits.each((d, i) => {
      d.__sszvisGroupedBarIndex__ = i;
    });
    const unitsWithValue = barUnits.filter(props.defined);
    // clear the units before rendering
    unitsWithValue.selectAll("*").remove();
    //sszsch: fix: reset previously assigned translations
    unitsWithValue.attr("transform", () => translateString(0, 0));
    unitsWithValue.append("rect").classed("sszvis-bar", true).attr("fill", props.fill).attr("stroke", (_props$stroke = props.stroke) !== null && _props$stroke !== void 0 ? _props$stroke : null).attr("x", config.x(props, inGroupScale)).attr("y", config.y(props, inGroupScale)).attr("width", config.width(props, inGroupScale)).attr("height", config.height(props, inGroupScale));
    const unitsWithoutValue = barUnits.filter(not(props.defined));
    unitsWithoutValue.selectAll("*").remove();
    unitsWithoutValue.attr("transform", config.missingTransform(props, inGroupScale));
    unitsWithoutValue.append("line").classed("sszvis-bar--missing line1", true).attr("x1", -4).attr("y1", -4).attr("x2", 4).attr("y2", 4);
    unitsWithoutValue.append("line").classed("sszvis-bar--missing line2", true).attr("x1", 4).attr("y1", -4).attr("x2", -4).attr("y2", 4);
    const ta = tooltipAnchor().position(config.tooltipPosition(props, inGroupScale));
    selection.call(ta);
  });
}
const createVerticalConfig = () => ({
  inGroupRange: _ref => {
    let {
      groupWidth
    } = _ref;
    return [0, groupWidth];
  },
  x: (_ref2, inGroupScale) => {
    let {
      groupScale
    } = _ref2;
    return (d, _i) => {
      var _inGroupScale;
      return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale !== void 0 ? _inGroupScale : 0 : 0);
    };
  },
  y: _ref3 => {
    let {
      y
    } = _ref3;
    return y;
  },
  width: (_, inGroupScale) => inGroupScale.bandwidth(),
  height: _ref4 => {
    let {
      height
    } = _ref4;
    return height;
  },
  missingTransform: (_ref5, inGroupScale) => {
    let {
      groupScale,
      y
    } = _ref5;
    return (d, i) => {
      var _inGroupScale2;
      return translateString(groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale2 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale2 !== void 0 ? _inGroupScale2 : 0 : 0) + inGroupScale.bandwidth() / 2, y(d, i));
    };
  },
  tooltipPosition: (_ref6, inGroupScale) => {
    let {
      groupScale,
      y
    } = _ref6;
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
  x: _ref7 => {
    let {
      x
    } = _ref7;
    return x;
  },
  y: (_ref8, inGroupScale) => {
    let {
      groupScale
    } = _ref8;
    return d => {
      var _inGroupScale4;
      return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale4 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale4 !== void 0 ? _inGroupScale4 : 0 : 0);
    };
  },
  width: _ref9 => {
    let {
      width
    } = _ref9;
    return width;
  },
  height: (_, inGroupScale) => inGroupScale.bandwidth(),
  missingTransform: (_ref0, inGroupScale) => {
    let {
      groupScale,
      x
    } = _ref0;
    return (d, i) => {
      var _inGroupScale5;
      return translateString(x(d, i), groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale5 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale5 !== void 0 ? _inGroupScale5 : 0 : 0) + inGroupScale.bandwidth() / 2);
    };
  },
  tooltipPosition: (_ref1, inGroupScale) => {
    let {
      groupScale,
      x
    } = _ref1;
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
