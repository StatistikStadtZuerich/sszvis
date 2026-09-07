/**
 * Linear Color Scale Legend
 *
 * Use for displaying the values of a continuous linear color scale.
 *
 * The ramp is drawn as a row of abutting segments, one per displayed value, with a rounded
 * cap at each end and a label outside each cap. Segments are stretched by a pixel in each
 * direction so that no antialiasing seam shows between them.
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

import { select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";

/** The subset of a d3 scale this legend relies on. */
interface LinearColorScale {
  (value: number): string;
  domain(): number[];
  ticks?(count?: number): number[];
}

type LabelFormatter = (value: unknown, index: number) => string | number;

type LinearColorScaleProps = {
  scale: LinearColorScale;
  displayValues: number[];
  width: number;
  segments: number;
  labelText?: unknown[];
  labelFormat: LabelFormatter;
};

export interface LinearColorScaleComponent extends ComponentBuilder<LinearColorScaleComponent> {
  scale(): LinearColorScale;
  scale(scale: LinearColorScale): LinearColorScaleComponent;
  displayValues(): number[];
  displayValues(values: number[]): LinearColorScaleComponent;
  width(): number;
  width(width: number): LinearColorScaleComponent;
  segments(): number;
  segments(segments: number): LinearColorScaleComponent;
  labelText(): unknown[] | undefined;
  labelText(text: unknown[]): LinearColorScaleComponent;
  labelFormat(): LabelFormatter;
  labelFormat(format: LabelFormatter): LinearColorScaleComponent;
}

export default function legendColorLinear(): LinearColorScaleComponent {
  return (
    component<LinearColorScaleComponent>()
      .prop("scale")
      .prop("displayValues")
      .displayValues([])
      .prop("width")
      .width(200)
      .prop("segments")
      .segments(8)
      .prop("labelText")
      .prop("labelFormat")
      // fn.identity is the documented "no formatting" default. It returns its argument, so it
      // cannot satisfy a formatter type that promises a primitive - d3 stringifies the value
      // at render time, which its own types do not model.
      .labelFormat(fn.identity as LabelFormatter)
      .render(function (this: Element) {
        const selection = select(this);
        const props = selection.props<LinearColorScaleProps>();

        if (!props.scale) {
          logger.error("legend.linearColorScale - a scale must be specified.");
          return;
        }

        const domain = props.scale.domain();

        // Equivalent to fn.last(domain), without widening the element type to undefined.
        const domainMax = domain[domain.length - 1];

        let values = props.displayValues;
        if (values.length === 0 && props.scale.ticks) {
          values = props.scale.ticks(props.segments - 1);
        }
        // Never write into the caller's array, and only extend the ramp to the domain
        // maximum when the values do not already reach it - scale.ticks() usually does.
        values =
          values.length > 0 && values[values.length - 1] === domainMax
            ? [...values]
            : [...values, domainMax];

        const segWidth = props.width / values.length;
        const segHeight = 10;

        const segments = selection
          .selectAll("rect.sszvis-legend__mark")
          .data(values)
          .join("rect")
          .classed("sszvis-legend__mark", true);

        segments
          .attr("x", (_d, i) => i * segWidth - 1) // The offsets here cover up half-pixel antialiasing artifacts
          .attr("y", 0)
          .attr("width", segWidth + 1) // The offsets here cover up half-pixel antialiasing artifacts
          .attr("height", segHeight)
          .attr("fill", (d) => props.scale(d));

        const startEnd = [domain[0], domainMax];
        const labelText = props.labelText || startEnd;

        // rounded end caps for the segments
        const endCaps = selection
          .selectAll("circle.ssvis-legend--mark")
          .data(startEnd)
          .join("circle")
          .attr("class", "ssvis-legend--mark");

        endCaps
          .attr("cx", (_d, i) => i * props.width)
          .attr("cy", segHeight / 2)
          .attr("r", segHeight / 2)
          .attr("fill", (d) => props.scale(d));

        const labels = selection
          .selectAll(".sszvis-legend__label")
          .data(labelText)
          .join("text")
          .classed("sszvis-legend__label", true);

        const labelPadding = 16;

        labels
          .style("text-anchor", (_d, i) => (i === 0 ? "end" : "start"))
          .attr("dy", "0.35em") // vertically-center
          .attr(
            "transform",
            (_d, i) =>
              `translate(${i * props.width + (i === 0 ? -1 : 1) * labelPadding}, ${segHeight / 2})`
          )
          .text((d, i) => props.labelFormat(d, i));
      })
  );
}
