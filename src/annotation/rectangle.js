/**
 * Rectangle annotation
 *
 * A component for creating rectangular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/rectangle
 *
 * @param {number, function} x        The x-position of the upper left corner of the data area.
 * @param {number, function} y        The y-position of the upper left corner of the data area.
 * @param {number, function} width    The width of the data area.
 * @param {number, function} height   The height of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area.
 *
 * @returns {sszvis.component} a rectangular data area component
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
    .prop("width", fn.functor)
    .prop("height", fn.functor)
    .prop("dx", fn.functor)
    .prop("dy", fn.functor)
    .prop("caption", fn.functor)
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);

      let dataArea = selection.selectAll(".sszvis-dataarearectangle").data(data);

      // FIXME: no exit?

      const newDataArea = dataArea.enter().append("rect").classed("sszvis-dataarearectangle", true);

      dataArea = dataArea.merge(newDataArea);

      dataArea
        .attr("x", props.x)
        .attr("y", props.y)
        .attr("width", props.width)
        .attr("height", props.height)
        .attr("fill", "url(#data-area-pattern)");

      if (props.caption) {
        let dataCaptions = selection.selectAll(".sszvis-dataarearectangle__caption").data(data);

        // FIXME: no exit?

        const newDataCaptions = dataCaptions
          .enter()
          .append("text")
          .classed("sszvis-dataarearectangle__caption", true);

        dataCaptions = dataCaptions.merge(newDataCaptions);

        dataCaptions
          .attr("x", (d, i) => props.x(d, i) + props.width(d, i) / 2)
          .attr("y", (d, i) => props.y(d, i) + props.height(d, i) / 2)
          .attr("dx", props.dx)
          .attr("dy", props.dy)
          .text(props.caption);
      }
    });
}
