/**
 * Binned Color Scale Legend
 *
 * Use for displaying the values of discontinuous (binned) color scale's bins
 *
 * @module sszvis/legend/binnedColorScale
 *
 * @param {function} scale              A scale to use to generate the color values
 * @param {array} displayValues         An array of values which should be displayed. Usually these should be the bin edges
 * @param {array} endpoints             The endpoints of the scale (note that these are not necessarily the first and last
 *                                      bin edges). These will become labels at either end of the legend.
 * @param {number} width                The pixel width of the legend. Default 200
 * @param {function} labelFormat        A formatter function for the labels of the displayValues.
 *
 * @return {sszvis.component}
 */

import { select, scaleLinear } from "d3";

import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { halfPixel } from "../svgUtils/crisp.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("scale")
    .prop("displayValues")
    .prop("endpoints")
    .prop("width")
    .width(200)
    .prop("labelFormat")
    .labelFormat(fn.identity)
    .render(function () {
      const selection = select(this);
      const props = selection.props();

      if (!props.scale) return logger.error("legend.binnedColorScale - a scale must be specified.");
      if (!props.displayValues)
        return logger.error("legend.binnedColorScale - display values must be specified.");
      if (!props.endpoints)
        return logger.error("legend.binnedColorScale - endpoints must be specified");

      const segHeight = 10;
      const circleRad = segHeight / 2;
      const innerRange = [0, props.width - 2 * circleRad];

      const barWidth = scaleLinear().domain(props.endpoints).range(innerRange);
      let sum = 0;
      const rectData = [];
      let pPrev = props.endpoints[0];
      for (const p of props.displayValues) {
        const w = barWidth(p) - sum;
        const offset = sum % 1;
        rectData.push({
          x: Math.floor(circleRad + sum),
          w: w + offset,
          c: props.scale(pPrev),
          p,
        });
        sum += w;
        pPrev = p;
      }

      // add the final box (last display value - > endpoint)
      rectData.push({
        x: Math.floor(circleRad + sum),
        w: innerRange[1] - sum,
        c: props.scale(pPrev),
      });

      const circles = selection
        .selectAll("circle.sszvis-legend__circle")
        .data(props.endpoints)
        .join("circle")
        .classed("sszvis-legend__circle", true);

      circles
        .attr("r", circleRad)
        .attr("cy", circleRad)
        .attr("cx", (d, i) => (i === 0 ? circleRad : props.width - circleRad))
        .attr("fill", props.scale);

      const segments = selection
        .selectAll("rect.sszvis-legend__crispmark")
        .data(rectData)
        .join("rect")
        .classed("sszvis-legend__crispmark", true);

      segments
        .attr("x", (d) => d.x)
        .attr("y", 0)
        .attr("width", (d) => d.w)
        .attr("height", segHeight)
        .attr("fill", (d) => d.c);

      const lineData = rectData.slice(0, -1);

      const lines = selection
        .selectAll("line.sszvis-legend__crispmark")
        .data(lineData)
        .join("line")
        .classed("sszvis-legend__crispmark", true);

      lines
        .attr("x1", (d) => halfPixel(d.x + d.w))
        .attr("x2", (d) => halfPixel(d.x + d.w))
        .attr("y1", segHeight + 1)
        .attr("y2", segHeight + 6)
        .attr("stroke", "#B8B8B8");

      const labels = selection
        .selectAll(".sszvis-legend__axislabel")
        .data(lineData)
        .join("text")
        .classed("sszvis-legend__axislabel", true);

      labels
        .style("text-anchor", "middle")
        .attr("transform", (d) => "translate(" + (d.x + d.w) + "," + (segHeight + 20) + ")")
        .text((d) => props.labelFormat(d.p));
    });
}
