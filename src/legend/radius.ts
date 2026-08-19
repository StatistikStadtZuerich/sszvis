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
 * @module sszvis/legend/radius
 *
 * @property {function} scale         A scale to use to generate the radius sizes
 * @property {function} [tickFormat]  Formatter function for the labels (default identity)
 * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
 *
 * @returns {sszvis.component}
 */

import { mean, select } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { range } from "../scale.js";
import { halfPixel } from "../svgUtils/crisp.js";
import translateString from "../svgUtils/translateString.js";

/** The subset of a d3 scale this legend relies on. */
interface RadiusScale {
  (value: unknown): number;
  domain(): unknown[];
  range(): unknown[];
  /** Required only when tickValues are not supplied. */
  invert?(value: number): unknown;
}

/** Formats a tick label. The default is fn.identity, which passes the value through. */
type TickFormatter = (value: unknown, index: number) => string | number;

type RadiusLegendProps = {
  scale: RadiusScale;
  tickFormat: TickFormatter;
  tickValues?: unknown[];
};

export interface RadiusLegendComponent extends Component {
  scale(): RadiusScale;
  scale(scale: RadiusScale): RadiusLegendComponent;
  tickFormat(): TickFormatter;
  tickFormat(format: TickFormatter): RadiusLegendComponent;
  tickValues(): unknown[] | undefined;
  tickValues(values: unknown[]): RadiusLegendComponent;
}

export default function (): RadiusLegendComponent {
  return component()
    .prop("scale")
    .prop("tickFormat")
    .tickFormat(fn.identity)
    .prop("tickValues")
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<RadiusLegendProps>();

      const domain = props.scale.domain();
      const tickValues =
        props.tickValues ||
        [
          domain[1],
          // Throws when the scale has no invert; see test/svgUtils - documented above.
          (props.scale.invert as (value: number) => unknown)(
            mean(props.scale.range() as number[]) as number
          ),
          domain[0],
        ];
      const maxRadius = range(props.scale)[1];

      const group = selection
        .selectAll("g.sszvis-legend__elementgroup")
        .data([0])
        .join("g")
        .attr("class", "sszvis-legend__elementgroup");

      group.attr("transform", translateString(halfPixel(maxRadius), halfPixel(maxRadius)));

      const circles = group
        .selectAll("circle.sszvis-legend__greyline")
        .data(tickValues)
        .join("circle")
        .classed("sszvis-legend__greyline", true);

      const getCircleCenter = (d: unknown): number => maxRadius - props.scale(d);
      const getCircleEdge = (d: unknown): number => maxRadius - 2 * props.scale(d);

      circles.attr("r", props.scale).attr("stroke-width", 1).attr("cy", getCircleCenter);

      const lines = group
        .selectAll("line.sszvis-legend__dashedline")
        .data(tickValues)
        .join("line")
        .classed("sszvis-legend__dashedline", true);

      lines
        .attr("x1", 0)
        .attr("y1", getCircleEdge)
        .attr("x2", maxRadius + 15)
        .attr("y2", getCircleEdge);

      const labels = group
        .selectAll(".sszvis-legend__label")
        .data(tickValues)
        .join("text")
        .attr("class", "sszvis-legend__label sszvis-legend__label--small");

      labels
        .attr("dx", maxRadius + 18)
        .attr("y", getCircleEdge)
        .attr("dy", "0.35em") // vertically-center
        .text(props.tickFormat);
    }) as RadiusLegendComponent;
}
