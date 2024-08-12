/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * @module sszvis/component/dot
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *
 * @return {sszvis.component}
 */

import { select } from "d3";

import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("radius")
    .prop("stroke")
    .prop("fill")
    .prop("transition")
    .transition(true)
    .render(function (data) {
      var selection = select(this);
      var props = selection.props();

      var dots = selection.selectAll(".sszvis-circle").data(data);

      dots.exit().remove();

      dots
        .enter()
        .append("circle")
        .classed("sszvis-circle", true)
        .attr("cx", props.x)
        .attr("cy", props.y)
        .attr("r", props.radius)
        .merge(dots)
        .attr("stroke", props.stroke)
        .attr("fill", props.fill);

      if (props.transition) {
        dots = dots.transition(defaultTransition());
      }

      dots.attr("cx", props.x).attr("cy", props.y).attr("r", props.radius);

      // Tooltip anchors

      var ta = tooltipAnchor().position((d) => [props.x(d), props.y(d)]);

      selection.call(ta);
    });
}
