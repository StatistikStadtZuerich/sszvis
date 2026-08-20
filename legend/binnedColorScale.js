import { select, scaleLinear } from 'd3';
import { component } from '../d3-component.js';
import { identity } from '../fn.js';
import { error } from '../logger.js';
import { halfPixel } from '../svgUtils/crisp.js';

/**
 * Binned Color Scale Legend
 *
 * Use for displaying the values of discontinuous (binned) color scale's bins
 *
 * Each display value becomes the upper edge of a bin, and a final bin runs from the last
 * display value to the upper endpoint. Bins are floored onto whole pixels and widened by
 * their subpixel remainder so that no gap shows between them, which means adjacent bins
 * overlap very slightly.
 *
 * Every bin except the trailing one carries a tick line and a label beneath its upper
 * edge. The line is snapped to the half-pixel grid to stay crisp while the label is
 * placed on the raw edge, so the two can sit half a pixel apart.
 *
 * @module sszvis/legend/binnedColorScale
 *
 * @property {function} scale           A scale to use to generate the color values
 * @property {array} displayValues      An array of values which should be displayed. Usually these should be the bin edges
 * @property {array} endpoints          The endpoints of the scale (note that these are not necessarily the first and last
 *                                      bin edges). These will become labels at either end of the legend.
 * @property {number} width             The pixel width of the legend. Default 200
 * @property {function} labelFormat     A formatter function for the labels of the displayValues.
 *
 * @return {sszvis.component}
 */
function binnedColorScale () {
  return component().prop("scale").prop("displayValues").prop("endpoints").prop("width").width(200).prop("labelFormat").labelFormat(identity).render(function () {
    const selection = select(this);
    const props = selection.props();
    if (!props.scale) {
      error("legend.binnedColorScale - a scale must be specified.");
      return;
    }
    if (!props.displayValues) {
      error("legend.binnedColorScale - display values must be specified.");
      return;
    }
    if (!props.endpoints) {
      error("legend.binnedColorScale - endpoints must be specified");
      return;
    }
    const segHeight = 10;
    const circleRad = segHeight / 2;
    const innerRange = [0, props.width - 2 * circleRad];
    const barWidth = scaleLinear().domain(props.endpoints).range(innerRange);
    let sum = 0;
    const labelledBins = [];
    let pPrev = props.endpoints[0];
    for (const p of props.displayValues) {
      const w = barWidth(p) - sum;
      const offset = sum % 1;
      labelledBins.push({
        x: Math.floor(circleRad + sum),
        w: w + offset,
        c: props.scale(pPrev),
        p
      });
      sum += w;
      pPrev = p;
    }
    // add the final box (last display value - > endpoint)
    const finalBin = {
      x: Math.floor(circleRad + sum),
      w: innerRange[1] - sum,
      c: props.scale(pPrev)
    };
    const rectData = [...labelledBins, finalBin];
    const circles = selection.selectAll("circle.sszvis-legend__circle").data(props.endpoints).join("circle").classed("sszvis-legend__circle", true);
    circles.attr("r", circleRad).attr("cy", circleRad).attr("cx", (_d, i) => i === 0 ? circleRad : props.width - circleRad).attr("fill", props.scale);
    const segments = selection.selectAll("rect.sszvis-legend__crispmark").data(rectData).join("rect").classed("sszvis-legend__crispmark", true);
    segments.attr("x", d => d.x).attr("y", 0).attr("width", d => d.w).attr("height", segHeight).attr("fill", d => d.c);
    // Every bin except the trailing one gets a tick line and a label.
    const lineData = labelledBins;
    const lines = selection.selectAll("line.sszvis-legend__crispmark").data(lineData).join("line").classed("sszvis-legend__crispmark", true);
    lines.attr("x1", d => halfPixel(d.x + d.w)).attr("x2", d => halfPixel(d.x + d.w)).attr("y1", segHeight + 1).attr("y2", segHeight + 6).attr("stroke", "#B8B8B8");
    const labels = selection.selectAll(".sszvis-legend__axislabel").data(lineData).join("text").classed("sszvis-legend__axislabel", true);
    labels.style("text-anchor", "middle").attr("transform", d => "translate(".concat(d.x + d.w, ",").concat(segHeight + 20, ")")).text(d => props.labelFormat(d.p));
  });
}

export { binnedColorScale as default };
//# sourceMappingURL=binnedColorScale.js.map
