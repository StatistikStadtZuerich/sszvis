/**
 * Select control
 *
 * Control for switching top-level filter values. Use this control for changing between several
 * options which affect the state of the chart. This component should be rendered into an html layer.
 *
 * This control is part of the `optionSelectable` class of controls and can be used interchangeably
 * with other controls of this class (sszvis.control.buttonGroup).
 *
 * @module sszvis/control/select
 *
 * @property {array} values         an array of values which are the options available in the control.
 * @property {any} current          the currently selected value of the select control. Should be one of the options passed to .values()
 * @property {number} width         The total width of the select control. If text labels exceed this width they will be trimmed to fit using an ellipsis mark. (default: 300px)
 * @property {function} change      A callback/event handler function to call when the user clicks on a value.
 *                                  Note that clicking on a value does not necessarily change any state unless this callback function does something.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";

import * as fn from "../fn.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("values")
    .prop("current")
    .prop("width")
    .width(300)
    .prop("change")
    .change(fn.identity)
    .render(function () {
      const selection = select(this);
      const props = selection.props();

      let wrapperEl = selection
        .selectAll(".sszvis-control-optionSelectable")
        .data(["sszvis-control-select"], (d) => d);
      const newWrapperEl = wrapperEl
        .enter()
        .append("div")
        .classed("sszvis-control-optionSelectable", true)
        .classed("sszvis-control-select", true);
      wrapperEl.exit().remove();

      wrapperEl = wrapperEl.merge(newWrapperEl);

      wrapperEl.style("width", props.width + "px");

      const metricsEl = wrapperEl
        .selectDiv("selectMetrics")
        .classed("sszvis-control-select__metrics", true);

      let selectEl = wrapperEl.selectAll(".sszvis-control-select__element").data([1]);

      const newSelectEl = selectEl
        .enter()
        .append("select")
        .classed("sszvis-control-select__element", true)
        .on("change", function (e) {
          // We store the index in the select's value instead of the datum
          // because an option's value can only hold strings.
          const i = select(this).property("value");
          props.change(e, props.values[i]);
          // Prevent highlights on the select element after users have selected
          // an option by moving away from it.
          setTimeout(() => {
            window.focus();
          }, 0);
        });

      selectEl = selectEl.merge(newSelectEl);

      selectEl.style("width", props.width + 30 + "px");

      const optionEls = selectEl.selectAll("option").data(props.values);

      const newOptionEls = optionEls.enter().append("option");

      optionEls.exit().remove();

      optionEls
        .merge(newOptionEls)
        .attr("selected", (d) => (d === props.current ? "selected" : null))
        .attr("value", (d, i) => i)
        .text((d) => truncateToWidth(metricsEl, props.width - 40, d));
    });
}

function truncateToWidth(metricsEl, maxWidth, originalString) {
  const MAX_RECURSION = 1000;
  const fitText = function (str, i) {
    metricsEl.text(str);
    const textWidth = Math.ceil(metricsEl.node().clientWidth);
    return i < MAX_RECURSION && textWidth > maxWidth ? fitText(str.slice(0, -2) + "…", i + 1) : str;
  };
  return fitText(originalString, 0);
}
