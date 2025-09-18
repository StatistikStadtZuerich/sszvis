import { select } from 'd3';
import { axisX } from '../axis.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import translateString from '../svgUtils/translateString.js';
import { stackedBarVertical } from './stackedBar.js';

/**
 * Nested Stacked Bars Vertical component
 *
 * This component renders a nested stacked bar chart with vertical orientation.
 * It uses the same abstract intermediate representation for the stack, but is rendered
 * using vertical dimensions. Note that using this component will add the properties 'y0'
 * and 'y' to any passed-in data objects, as part of computing the stack intermediate representation.
 * Existing properties with these names will be overwritten.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 *
 * @property {function} offset              Specifies an offset function for positioning the nested groups.
 * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
 *                                          the elements of each stack, both the left offset value and the width of each stack segment.
 * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
 * @property {function} fill                Specify a fill value for the rectangles (default black).
 * @property {function} tooltip             Specify a tooltip function for the rectangles.
 * @property {function} xAcc                Specifies an x-accessor for the stack layout. The result of this function
 *                                          is used to compute the horizontal extent of each element in the stack.
 *                                          The return value must be a number.
 * @property {function} xLabel              Specifies a label for the x-axis.
 * @property {string} slant                 Specifies the slant of the x-axis labels.
 *
 * @return {sszvis.component}
 */

const nestedStackedBarsVertical = () => component().prop("offset", functor).prop("xScale", functor).prop("yScale", functor).prop("fill", functor).prop("tooltip", functor).prop("xAcc", functor).prop("xLabel", functor).prop("xLabel", functor).prop("slant").render(function (data) {
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
  const xAxis = axisX.ordinal().scale(xScale).ticks(1).tickSize(0).orient("bottom").slant(props.slant).title(xLabel);
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
