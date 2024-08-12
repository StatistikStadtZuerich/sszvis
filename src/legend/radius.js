/**
 * Radius size legend
 *
 * Use for showing how different radius sizes correspond to data values.
 *
 * @module sszvis/legend/radius
 *
 * @property {function} scale         A scale to use to generate the radius sizes
 * @property {function} [tickFormat]  Formatter function for the labels (default identity)
 * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
 *
 * @returns {sszvis.component}
 */

import { select, mean } from "d3";

import * as fn from "../fn.js";
import { range } from "../scale.js";
import { halfPixel } from "../svgUtils/crisp.js";
import translateString from "../svgUtils/translateString.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("scale")
    .prop("tickFormat")
    .tickFormat(fn.identity)
    .prop("tickValues")
    .render(function () {
      const selection = select(this);
      const props = selection.props();

      const domain = props.scale.domain();
      const tickValues = props.tickValues || [
        domain[1],
        props.scale.invert(mean(props.scale.range())),
        domain[0],
      ];
      const maxRadius = range(props.scale)[1];

      let group = selection.selectAll("g.sszvis-legend__elementgroup").data([0]);

      const newGroup = group.enter().append("g").attr("class", "sszvis-legend__elementgroup");

      // FIXME: No exit?

      group = group.merge(newGroup);

      group.attr("transform", translateString(halfPixel(maxRadius), halfPixel(maxRadius)));

      let circles = group.selectAll("circle.sszvis-legend__greyline").data(tickValues);

      const newCircles = circles.enter().append("circle").classed("sszvis-legend__greyline", true);

      circles.exit().remove();

      circles = circles.merge(newCircles);

      function getCircleCenter(d) {
        return maxRadius - props.scale(d);
      }

      function getCircleEdge(d) {
        return maxRadius - 2 * props.scale(d);
      }

      circles.attr("r", props.scale).attr("stroke-width", 1).attr("cy", getCircleCenter);

      let lines = group.selectAll("line.sszvis-legend__dashedline").data(tickValues);

      const newLines = lines.enter().append("line").classed("sszvis-legend__dashedline", true);

      lines.exit().remove();

      lines = lines.merge(newLines);

      lines
        .attr("x1", 0)
        .attr("y1", getCircleEdge)
        .attr("x2", maxRadius + 15)
        .attr("y2", getCircleEdge);

      let labels = group.selectAll(".sszvis-legend__label").data(tickValues);

      const newLabels = labels
        .enter()
        .append("text")
        .attr("class", "sszvis-legend__label sszvis-legend__label--small");

      labels.exit().remove();

      labels = labels.merge(newLabels);

      labels
        .attr("dx", maxRadius + 18)
        .attr("y", getCircleEdge)
        .attr("dy", "0.35em") // vertically-center
        .text(props.tickFormat);
    });
}
