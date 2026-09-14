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
 * @property {array} labelText                  An array of labels for the legend endpoints. If not supplied, defaults to the
 *                                              first and last tick values. For string labels, name the type:
 *                                              `legendColorLinear<string>()`.
 * @property {function} labelFormat             An optional formatter function for the end labels. Usually should be sszvis.formatNumber.
 */

import { select } from "d3";
import { colorToString } from "../color.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import type { ColorValue } from "../types.js";

/** The subset of a d3 scale this legend relies on. */
interface LinearColorScale {
  (value: number): ColorValue;
  domain(): number[];
  ticks?(count?: number): number[];
}

/**
 * Formats one endpoint label. The value is whatever `labelText` holds, or the scale's own
 * numeric domain endpoints when `labelText` is not set - so a formatter always has to cope
 * with a number. `sszvis.formatNumber` fits the default without a wrapper; a legend given
 * string labels names its own type: `legendColorLinear<string>()`.
 */
type LabelFormatter<T = number> = (value: T | number, index: number) => string | number;

type LinearColorScaleProps<T = number> = {
  scale: LinearColorScale;
  displayValues: number[];
  width: number;
  segments: number;
  labelText?: T[];
  labelFormat: LabelFormatter<T>;
};

export interface LinearColorScaleComponent<T = number> extends ComponentBuilder<
  LinearColorScaleComponent<T>
> {
  scale(): LinearColorScale;
  scale(scale: LinearColorScale): LinearColorScaleComponent<T>;
  displayValues(): number[];
  displayValues(values: number[]): LinearColorScaleComponent<T>;
  width(): number;
  width(width: number): LinearColorScaleComponent<T>;
  segments(): number;
  segments(segments: number): LinearColorScaleComponent<T>;
  labelText(): T[] | undefined;
  labelText(text: T[]): LinearColorScaleComponent<T>;
  labelFormat(): LabelFormatter<T>;
  labelFormat(format: LabelFormatter<T>): LinearColorScaleComponent<T>;
}

export default function legendColorLinear<T = number>(): LinearColorScaleComponent<T> {
  return (
    component<LinearColorScaleComponent<T>>()
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
      .labelFormat(fn.identity as LabelFormatter<T>)
      .render(function (this: Element) {
        const selection = select(this);
        const props = selection.props<LinearColorScaleProps<T>>();

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
          .attr("fill", (d) => colorToString(props.scale(d)));

        const startEnd = [domain[0], domainMax];
        const labelText: readonly (number | T)[] = props.labelText ?? startEnd;

        // rounded end caps for the segments
        const endCaps = selection
          .selectAll("circle.sszvis-legend__mark")
          .data(startEnd)
          .join("circle")
          .attr("class", "sszvis-legend__mark");

        endCaps
          .attr("cx", (_d, i) => i * props.width)
          .attr("cy", segHeight / 2)
          .attr("r", segHeight / 2)
          .attr("fill", (d) => colorToString(props.scale(d)));

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
              `translate(${i * props.width + (i === 0 ? -1 : 1) * labelPadding}, ${segHeight / 2})`,
          )
          .text((d, i) => props.labelFormat(d, i));
      })
  );
}
