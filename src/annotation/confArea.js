/**
 * @function sszvis.annotationConfArea
 *
 * A component for creating confidence areas. The component should be passed
 * an array of data values, each of which will be used to render a confidence area
 * by passing it through the accessor functions. You can specify the x, y0, and y1
 * properties to define the area. The component also supports stroke, strokeWidth,
 * and fill properties for styling.
 *
 * @module sszvis/annotation/confArea
 *
 * @param {function} x             The x-accessor function.
 * @param {function} y0            The y0-accessor function.
 * @param {function} y1            The y1-accessor function.
 * @param {string} [stroke]        The stroke color of the area.
 * @param {number} [strokeWidth]   The stroke width of the area.
 * @param {string} [fill]          The fill color of the area.
 * @param {function} [key]         The key function for data binding.
 * @param {function} [valuesAccessor] The accessor function for the data values.
 * @param {boolean} [transition]   Whether to apply a transition to the area.
 *
 * @returns {sszvis.component} a confidence area component
 */

import { select, area as d3Area } from "d3";

import * as fn from "../fn.js";
import ensureDefsElement from "../svgUtils/ensureDefsElement.js";
import { dataAreaPattern } from "../patterns.js";
import { defaultTransition } from "../transition.js";

import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("x")
    .prop("y0")
    .prop("y1")
    .prop("stroke")
    .prop("strokeWidth")
    .prop("fill")
    .prop("key")
    .key((_, i) => i)
    .prop("valuesAccessor")
    .valuesAccessor(fn.identity)
    .prop("transition")
    .transition(true)
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      ensureDefsElement(selection, "pattern", "data-area-pattern").call(dataAreaPattern);

      // Layouts
      const area = d3Area().x(props.x).y0(props.y0).y1(props.y1);

      // Rendering

      let path = selection
        .selectAll(".sszvis-area")
        .data(data, props.key)
        .join("path")
        .classed("sszvis-area", true)
        .style("stroke", props.stroke)
        .attr("fill", "url(#data-area-pattern)")
        .order();

      if (props.transition) {
        path = path.transition().call(defaultTransition);
      }

      path
        .attr("d", fn.compose(area, props.valuesAccessor))
        .style("stroke", props.stroke)
        .style("stroke-width", props.strokeWidth)
        .attr("fill", "url(#data-area-pattern)");
    });
}
