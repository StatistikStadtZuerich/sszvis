import { select, mean } from 'd3';
import { component } from '../d3-component.js';
import { identity } from '../fn.js';
import { range } from '../scale.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';

/**
 * Radius size legend
 *
 * Use for showing how different radius sizes correspond to data values.
 *
 * The legend draws one nested circle per tick, all resting on a common baseline, with a
 * dashed leader line and a label at the top edge of each circle.
 *
 * When tickValues are not supplied, the ticks default to the domain maximum, the value at
 * the midpoint of the scale's range, and the domain minimum. Deriving that middle tick
 * calls scale.invert(), so the default only works for a continuous scale; pass tickValues
 * explicitly to use any other kind.
 *
 * Every tick produces a circle, a leader line and a label, including a tick whose value
 * maps to a zero radius - the circle is then invisible but the line and label still mark
 * that value. Pass tickValues to leave it out.
 *
 * @module sszvis/legend/radius
 *
 * @property {function} scale         A scale to use to generate the radius sizes
 * @property {function} [tickFormat]  Formatter function for the labels (default identity)
 * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
 *
 * @returns {sszvis.component}
 */
function radius () {
  return component().prop("scale").prop("tickFormat").tickFormat(identity).prop("tickValues").render(function () {
    const selection = select(this);
    const props = selection.props();
    const tickValues = props.tickValues || defaultTickValues(props.scale);
    const maxRadius = range(props.scale)[1];
    const group = selection.selectAll("g.sszvis-legend__elementgroup").data([0]).join("g").attr("class", "sszvis-legend__elementgroup");
    group.attr("transform", translateString(halfPixel(maxRadius), halfPixel(maxRadius)));
    const circles = group.selectAll("circle.sszvis-legend__greyline").data(tickValues).join("circle").classed("sszvis-legend__greyline", true);
    const getCircleCenter = d => maxRadius - props.scale(d);
    const getCircleEdge = d => maxRadius - 2 * props.scale(d);
    circles.attr("r", props.scale).attr("stroke-width", 1).attr("cy", getCircleCenter);
    const lines = group.selectAll("line.sszvis-legend__dashedline").data(tickValues).join("line").classed("sszvis-legend__dashedline", true);
    lines.attr("x1", 0).attr("y1", getCircleEdge).attr("x2", maxRadius + 15).attr("y2", getCircleEdge);
    const labels = group.selectAll(".sszvis-legend__label").data(tickValues).join("text").attr("class", "sszvis-legend__label sszvis-legend__label--small");
    labels.attr("dx", maxRadius + 18).attr("y", getCircleEdge).attr("dy", "0.35em") // vertically-center
    .text(props.tickFormat);
  });
}
/**
 * The default ticks: the domain maximum, the value at the midpoint of the scale's range,
 * and the domain minimum. Deriving the middle value calls scale.invert(), so this only
 * works for a continuous scale - supply tickValues to use any other kind.
 */
function defaultTickValues(scale) {
  var _mean;
  const {
    invert
  } = scale;
  if (!invert) {
    throw new TypeError("legend.radius - scale.invert is required to derive the default ticks; supply tickValues instead.");
  }
  const domain = scale.domain();
  // mean() only returns undefined for an empty range, which a d3 scale never has.
  return [domain[1], invert((_mean = mean(scale.range())) !== null && _mean !== void 0 ? _mean : Number.NaN), domain[0]];
}

export { radius as default };
//# sourceMappingURL=radius.js.map
