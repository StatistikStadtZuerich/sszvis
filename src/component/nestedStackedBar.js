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

import { select } from "d3";

import * as fn from "../fn.js";
import { component } from "../d3-component.js";
import { axisX } from "../axis.js";
import { stackedBarVertical } from "./stackedBar.js";
import translateString from "../svgUtils/translateString.js";

export const nestedStackedBarsVertical = () =>
  component()
    .prop("offset", fn.functor)
    .prop("xScale", fn.functor)
    .prop("yScale", fn.functor)
    .prop("fill", fn.functor)
    .prop("tooltip", fn.functor)
    .prop("xAcc", fn.functor)
    .prop("xLabel", fn.functor)
    .prop("xLabel", fn.functor)
    .prop("slant")
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      const offset = props.offset;
      const xScale = props.xScale;
      const yScale = props.yScale;
      const fill = props.fill;
      const tooltip = props.tooltip;
      const xAcc = props.xAcc;
      const xLabel = props.xLabel;

      const xAxis = axisX
        .ordinal()
        .scale(xScale)
        .ticks(1)
        .tickSize(0)
        .orient("bottom")
        .slant(props.slant)
        .title(xLabel);

      const group = selection.selectAll("[data-nested-stacked-bars]").data(data);

      group.join("g").attr("data-nested-stacked-bars", (d) => xAcc(d[0][0].data));

      group.attr("transform", (d) => `translate(${offset(d)} 0)`);

      group
        .selectGroup("nested-x-axis")
        .attr("transform", translateString(0, yScale(0)))
        .call(xAxis);

      const stackedBars = stackedBarVertical()
        .xScale(xScale)
        .width(xScale.bandwidth())
        .yScale(yScale)
        .fill(fill);

      const bars = group.selectGroup("barchart").call(stackedBars);

      bars.selectAll("[data-tooltip-anchor]").call(tooltip);
    });
