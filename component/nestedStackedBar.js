import { select } from 'd3';
import { axisX } from '../axis.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
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
 * `offset`, `xScale`, `yScale`, `xAcc` and `tooltip` are required; `fill`, `xLabel` and
 * `slant` are optional. None of the required props is defaulted or validated, so omitting one
 * fails at render time with a low-level TypeError rather than a message naming the prop.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the x-axis values, i.e. the domain of the x-scale
 *
 * @property {function} offset              Required. Positions the nested groups. Receives the whole
 *                                          stack layout of a group and returns an x-offset in pixels.
 * @property {function} xScale              Required. A band scale for the stack layout. Used to position
 *                                          the stacks and, via its bandwidth, to size the bars. Must be a
 *                                          band scale: `bandwidth()` is called on it directly.
 * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
 *                                          used to position each stack, and to place the x-axis at yScale(0).
 * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
 *                                          anchors of every nested group in one selection.
 * @property {function} xAcc                Required. An x-accessor, called with the datum of the first slice
 *                                          of the group. Its only use is to write the value into the
 *                                          `data-nested-stacked-bars` attribute; it takes no part in
 *                                          positioning. The return value is stringified into that attribute,
 *                                          so any string or number works.
 * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
 *                                          attribute is written at all and the rectangles fall back to the
 *                                          SVG/CSS default.
 * @property {function} xLabel              Optional, but non-functional - see below.
 * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
 *                                          "diagonal"). Unset leaves them upright. The only prop that is not
 *                                          wrapped in fn.functor.
 *
 * Note: several behaviours of this component are not guessable from its props. `ticks(1)` is
 * hardcoded on the axis, and `axisX.ordinal` reads that as "first and last domain value plus
 * one in between", so with three or more x-categories the middle tick labels silently
 * disappear. The axis is placed at `yScale(0)`, which a linear scale extrapolates past the end
 * of its range, so a y-domain that excludes 0 pushes the axis of every group off the chart
 * without warning. The bars inherit the #FFFFFF separator stroke that stackedBarVertical
 * defaults to, and this component does not expose `stroke`, so it cannot be changed or
 * removed. `xLabel` is wrapped in fn.functor while `axis.title()` expects a string, so the
 * wrapper is stringified into the title text - neither a string nor a function produces the
 * intended label, and the prop cannot be set at all in its current form. The
 * `data-nested-stacked-bars` attribute holds `xAcc(d[0][0].data)`, the x-value of the group's
 * first slice, which is the same for every group and therefore cannot identify the group it
 * names; the same unguarded reach throws for a nested group with no stacks. The group
 * transform is interpolated as `translate(${offset(d)} 0)` with no guard, so an offset scale
 * miss writes the invalid `translate(undefined 0)`. See test/component/nestedStackedBar.test.ts.
 *
 * @return {sszvis.component}
 */
const nestedStackedBarsVertical = () => component().prop("offset", functor).prop("xScale", functor).prop("yScale", functor).prop("fill", functor).prop("tooltip", functor).prop("xAcc", functor).prop("xLabel", functor).prop("slant").render(function (data) {
  const selection = select(this);
  const props = selection.props();
  const {
    offset,
    xScale,
    yScale,
    fill,
    tooltip,
    xAcc,
    xLabel
  } = props;
  const xAxis = axisX.ordinal().scale(xScale).ticks(1).tickSize(0).orient("bottom").slant(props.slant)
  // NOTE: xLabel is wrapped by fn.functor, but the axis renders its title as text
  // without calling it, so the function is stringified into the label. Preserved
  // here to keep the port faithful; see test/component/nestedStackedBar.test.ts.
  .title(xLabel);
  const group = selection.selectAll("[data-nested-stacked-bars]").data(data);
  const nestedGroups = group.join("g").attr("data-nested-stacked-bars", d => xAcc(d[0][0].data));
  nestedGroups.attr("transform", d => "translate(".concat(offset(d), " 0)"));
  nestedGroups.selectGroup("nested-x-axis").attr("transform", translateString(0, yScale(0))).call(xAxis);
  const stackedBars = stackedBarVertical().xScale(xScale).width(xScale.bandwidth()).yScale(yScale).fill(fill);
  const bars = nestedGroups.selectGroup("barchart").call(stackedBars);
  bars.selectAll("[data-tooltip-anchor]").call(tooltip);
});

export { nestedStackedBarsVertical };
//# sourceMappingURL=nestedStackedBar.js.map
