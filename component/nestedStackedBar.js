import { select } from 'd3';
import { axisX } from '../axis.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { warn } from '../logger.js';
import translateString from '../svgUtils/translateString.js';
import { stackedBarVertical } from './stackedBar.js';

/**
 * Nested Stacked Bars Vertical component
 *
 * This component renders a group of vertical stacked bar charts side by side. The input data
 * is an array of stack layouts, one per nested group, each as returned by
 * stackedBarVerticalData; callers usually tag every layout with the key they cascaded by so
 * that `offset` can read it. For each layout the component emits a group positioned by
 * `offset`, an ordinal x-axis, and a stackedBarVertical, and finally passes all tooltip
 * anchors of all groups to `tooltip` in a single call.
 *
 * `offset`, `xScale`, `yScale` and `tooltip` are required and are validated before anything is
 * rendered: a missing one throws an error naming the component and the property. `fill`,
 * `stroke`, `xAcc`, `xLabel` and `slant` are optional.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the x-axis values, i.e. the domain of the x-scale
 *
 * @property {function} offset              Required. Positions the nested groups. Receives the whole
 *                                          stack layout of a group and returns an x-offset in pixels.
 *                                          An offset that is not a finite number is reported with a
 *                                          console warning and treated as 0, so the group still gets a
 *                                          valid transform instead of one the renderer discards.
 * @property {function} xScale              Required. A band scale for the stack layout. Used to position
 *                                          the stacks and, via its bandwidth, to size the bars. Must be a
 *                                          band scale: `bandwidth()` is called on it directly.
 * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
 *                                          used to position each stack, and to place the x-axis at the
 *                                          baseline. The baseline is `yScale(0)` clamped into the scale's
 *                                          own range, so a y-domain that excludes 0 keeps the axis inside
 *                                          the plotting area; clamping is reported with a console warning.
 *                                          A scale without a `range()` (for instance a constant boxed by
 *                                          fn.functor) is used as-is.
 * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
 *                                          anchors of every nested group in one selection.
 * @property {function} xAcc                Optional and never read. An x-accessor over a slice datum,
 *                                          kept so that the existing call sites keep working: the nested
 *                                          groups are labelled from their own nest key instead.
 *                                          Deprecated; a major version will remove it.
 * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
 *                                          attribute is written at all and the rectangles fall back to the
 *                                          SVG/CSS default.
 * @property {string, function} stroke      Optional. Forwarded to stackedBarVertical, which defaults it to
 *                                          #FFFFFF so that the stack segments are separated by a white
 *                                          line. Pass "none" for seamless stacks.
 * @property {string, function} xLabel      Optional. The title of the nested x-axis. A function is
 *                                          evaluated before the axis renders it; unset means no title.
 * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
 *                                          "diagonal"). Unset leaves them upright. The only prop that is not
 *                                          wrapped in fn.functor.
 *
 * Each nested group carries its nest key in `data-nested-stacked-bars`, taken from the `nest`
 * property callers tag the stack layout with (the same key `offset` reads), and falling back to
 * the group's index when the layout is untagged. A nested group with no stacks is reported with
 * a console warning and rendered as an empty group rather than taking the whole chart down.
 *
 * @return {sszvis.component}
 */
/** Reports a required property the caller left unset, naming it. */
function required(value, name) {
  if (value === undefined) {
    throw new Error("[nestedStackedBarsVertical] the ".concat(name, " property is required"));
  }
  return value;
}
/**
 * The y-coordinate of the x-axis: `yScale(0)`, kept inside the scale's own range so that a
 * y-domain excluding 0 - which a linear scale extrapolates past the end of its range - does not
 * push the axis out of the plotting area. Warns when it has to clamp. A scale that exposes no
 * `range()` cannot be checked, so its value is used unchanged.
 */
function baseline(yScale) {
  const zero = yScale(0);
  const scaleRange = Reflect.get(yScale, "range");
  if (typeof scaleRange !== "function") return zero;
  const extent = scaleRange.call(yScale).filter(v => Number.isFinite(v));
  if (extent.length < 2) return zero;
  const low = Math.min(...extent);
  const high = Math.max(...extent);
  if (zero >= low && zero <= high) return zero;
  const clamped = zero < low ? low : high;
  warn("[nestedStackedBarsVertical] the y-scale baseline ".concat(zero, " falls outside its range [").concat(low, ", ").concat(high, "]; placing the x-axis at ").concat(clamped));
  return clamped;
}
const nestedStackedBarsVertical = () => component().prop("offset", functor).prop("xScale", functor).prop("yScale", functor).prop("fill", functor).prop("stroke").prop("tooltip", functor).prop("xAcc", functor).prop("xLabel", functor).prop("slant").render(function (data) {
  const selection = select(this);
  const props = selection.props();
  const offset = required(props.offset, "offset");
  const xScale = required(props.xScale, "xScale");
  const yScale = required(props.yScale, "yScale");
  const tooltip = required(props.tooltip, "tooltip");
  const {
    fill,
    stroke,
    xLabel
  } = props;
  const xAxis = axisX.ordinal().scale(xScale).tickSize(0).orient("bottom").slant(props.slant)
  // xLabel is wrapped by fn.functor, so it is always a function here; the axis binds its
  // title as text data and never calls it, so evaluate it first.
  .title(xLabel === null || xLabel === void 0 ? void 0 : xLabel());
  const group = selection.selectAll("[data-nested-stacked-bars]").data(data);
  const nestedGroups = group.join("g").attr("data-nested-stacked-bars", (d, i) => {
    if (d.length === 0) {
      warn("[nestedStackedBarsVertical] the nested group at index ".concat(i, " has no stacks; rendering it empty"));
    }
    return d.nest === undefined ? i : d.nest;
  });
  nestedGroups.attr("transform", d => {
    const x = offset(d);
    if (!Number.isFinite(x)) {
      warn("[nestedStackedBarsVertical] the offset accessor returned ".concat(x, "; positioning the group at 0"));
    }
    return translateString(Number.isFinite(x) ? x : 0, 0);
  });
  nestedGroups.selectGroup("nested-x-axis").attr("transform", translateString(0, baseline(yScale))).call(xAxis);
  const stackedBars = stackedBarVertical().xScale(xScale).width(xScale.bandwidth()).yScale(yScale).fill(fill).stroke(stroke);
  const bars = nestedGroups.selectGroup("barchart").call(stackedBars);
  bars.selectAll("[data-tooltip-anchor]").call(tooltip);
});

export { nestedStackedBarsVertical };
//# sourceMappingURL=nestedStackedBar.js.map
