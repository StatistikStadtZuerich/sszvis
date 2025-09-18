import { select } from 'd3';
import { component } from '../d3-component.js';
import { identity, last, first } from '../fn.js';
import { error } from '../logger.js';

/**
 * Linear Color Scale Legend
 *
 * Use for displaying the values of a continuous linear color scale.
 *
 * @module sszvis/legend/linearColorScale
 *
 * @property {function} scale                   The scale to use to generate the legend
 * @property {array} displayValues              A list of specific values to display. If not specified, defaults to using scale.ticks
 * @property {number} width                     The pixel width of the legend (default 200).
 * @property {number} segments                  The number of segments to aim for. Note, this is only used if displayValues isn't specified,
 *                                              and then it is passed as the argument to scale.ticks for finding the ticks. (default)
 * @property {array} labelText                  Text or a text-returning function to use as the titles for the legend endpoints. If not supplied,
 *                                              defaults to using the first and last tick values.
 * @property {function} labelFormat             An optional formatter function for the end labels. Usually should be sszvis.formatNumber.
 */

function linearColorScale () {
  return component().prop("scale").prop("displayValues").displayValues([]).prop("width").width(200).prop("segments").segments(8).prop("labelText").prop("labelFormat").labelFormat(identity).render(function () {
    const selection = select(this);
    const props = selection.props();
    if (!props.scale) {
      error("legend.linearColorScale - a scale must be specified.");
      return false;
    }
    const domain = props.scale.domain();
    let values = props.displayValues;
    if (values.length === 0 && props.scale.ticks) {
      values = props.scale.ticks(props.segments - 1);
    }
    values.push(last(domain));

    // Avoid division by zero
    const segWidth = values.length > 0 ? props.width / values.length : 0;
    const segHeight = 10;
    const segments = selection.selectAll("rect.sszvis-legend__mark").data(values).join("rect").classed("sszvis-legend__mark", true);
    segments.attr("x", (d, i) => i * segWidth - 1) // The offsets here cover up half-pixel antialiasing artifacts
    .attr("y", 0).attr("width", segWidth + 1) // The offsets here cover up half-pixel antialiasing artifacts
    .attr("height", segHeight).attr("fill", d => props.scale(d));
    const startEnd = [first(domain), last(domain)];
    const labelText = props.labelText || startEnd;

    // rounded end caps for the segments
    const endCaps = selection.selectAll("circle.ssvis-legend--mark").data(startEnd).join("circle").attr("class", "ssvis-legend--mark");
    endCaps.attr("cx", (d, i) => i * props.width).attr("cy", segHeight / 2).attr("r", segHeight / 2).attr("fill", d => props.scale(d));
    const labels = selection.selectAll(".sszvis-legend__label").data(labelText).join("text").classed("sszvis-legend__label", true);
    const labelPadding = 16;
    labels.style("text-anchor", (d, i) => i === 0 ? "end" : "start").attr("dy", "0.35em") // vertically-center
    .attr("transform", (d, i) => "translate(" + (i * props.width + (i === 0 ? -1 : 1) * labelPadding) + ", " + segHeight / 2 + ")").text((d, i) => props.labelFormat(d, i));
  });
}

export { linearColorScale as default };
//# sourceMappingURL=linearColorScale.js.map
