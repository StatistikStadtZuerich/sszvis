/**
 * @function sszvis.annotationConfidenceArea
 *
 * A component for creating confidence areas. The component should be passed
 * an array of data values, each of which will be used to render a confidence area
 * by passing it through the accessor functions. You can specify the x, y0, and y1
 * properties to define the area. The component also supports stroke, strokeWidth,
 * and fill properties for styling.
 *
 * @module sszvis/annotation/confidenceArea
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

import { area as d3Area, type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { dataAreaPattern } from "../patterns";
import ensureDefsElement from "../svgUtils/ensureDefsElement";
import { defaultTransition } from "../transition";
import type { NumberAccessor, PatternSelection } from "../types";

// Type definitions for confidence area component
type Datum<T = unknown> = T;

interface ConfidenceAreaProps<T = unknown> {
  x: (d: Datum<T>) => NumberValue;
  y0: (d: Datum<T>) => NumberValue;
  y1: (d: Datum<T>) => NumberValue;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  key: (d: Datum<T>, i: number) => string | number;
  valuesAccessor: (d: Datum<T>[]) => Datum<T>[];
  transition: boolean;
}

interface ConfidenceAreaComponent<T = unknown> extends Component {
  x(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
  y0(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
  y1(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
  stroke(stroke?: string): ConfidenceAreaComponent<T>;
  strokeWidth(width?: number): ConfidenceAreaComponent<T>;
  fill(fill?: string): ConfidenceAreaComponent<T>;
  key(accessor?: (d: Datum<T>, i: number) => string | number): ConfidenceAreaComponent<T>;
  valuesAccessor(accessor?: (d: Datum<T>[]) => Datum<T>[]): ConfidenceAreaComponent<T>;
  transition(enabled?: boolean): ConfidenceAreaComponent<T>;
}

export default function <T = unknown>(): ConfidenceAreaComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y0", fn.functor)
    .prop("y1", fn.functor)
    .prop("stroke")
    .prop("strokeWidth")
    .prop("fill")
    .prop("key")
    .key((_: Datum<T>, i: number) => i)
    .prop("valuesAccessor")
    .valuesAccessor(fn.identity)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: Datum<T>[][]) {
      const selection = select(this);
      const props = selection.props() as ConfidenceAreaProps<T>;

      const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
      dataAreaPattern(patternSelection as PatternSelection);

      // Layouts
      const area = d3Area<Datum<T>>()
        .x((d: Datum<T>) => Number(props.x(d)))
        .y0((d: Datum<T>) => Number(props.y0(d)))
        .y1((d: Datum<T>) => Number(props.y1(d)));

      // Rendering

      const path = selection
        .selectAll(".sszvis-area")
        .data(data)
        .join("path")
        .classed("sszvis-area", true);

      if (props.stroke) {
        path.style("stroke", props.stroke);
      }

      path.attr("fill", "url(#data-area-pattern)").order();

      const finalPath = props.transition ? path.transition().call(defaultTransition) : path;

      finalPath.attr("d", (d: Datum<T>[]) => area(props.valuesAccessor(d)));

      if (props.stroke) {
        finalPath.style("stroke", props.stroke);
      }
      if (props.strokeWidth) {
        finalPath.style("stroke-width", props.strokeWidth);
      }

      finalPath.attr("fill", "url(#data-area-pattern)");
    });
}
