/**
 * Circle annotation
 *
 * A component for creating circular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/circle
 *
 * @param {number, function} x        The x-position of the center of the data area.
 * @param {number, function} y        The y-position of the center of the data area.
 * @param {number, function} r        The radius of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
 *
 * @returns {sszvis.component} a circular data area component
 */

import { select } from "d3";

import * as fn from "../fn.js";
import ensureDefsElement from "../svgUtils/ensureDefsElement.js";
import { dataAreaPattern } from "../patterns.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("r", fn.functor)
    .prop("dx", fn.functor)
    .prop("dy", fn.functor)
    .prop("caption", fn.functor)
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);

      let dataArea = selection.selectAll(".sszvis-dataareacircle").data(data);

      const newDataArea = dataArea.enter().append("circle").classed("sszvis-dataareacircle", true);
      dataArea = dataArea.merge(newDataArea);

      dataArea
        .attr("cx", props.x)
        .attr("cy", props.y)
        .attr("r", props.r)
        .attr("fill", "url(#data-area-pattern)");

      if (props.caption) {
        let dataCaptions = selection.selectAll(".sszvis-dataareacircle__caption").data(data);

        const newDataCaptions = dataCaptions
          .enter()
          .append("text")
          .classed("sszvis-dataareacircle__caption", true);
        dataCaptions = dataCaptions.merge(newDataCaptions);

        dataCaptions
          .attr("x", props.x)
          .attr("y", props.y)
          .attr("dx", props.dx)
          .attr("dy", props.dy)
          .text(props.caption);
      }
    });
}
