/**
 * Rectangle annotation
 *
 * A component for creating rectangular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/rectangle
 *
 * @template T The type of the data objects used in the rectangle annotations
 * @param {number, function} x        The x-position of the upper left corner of the data area.
 * @param {number, function} y        The y-position of the upper left corner of the data area.
 * @param {number, function} width    The width of the data area.
 * @param {number, function} height   The height of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area.
 *
 * @returns {sszvis.component} a rectangular data area component
 */

import { type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { dataAreaPattern } from "../patterns";
import ensureDefsElement from "../svgUtils/ensureDefsElement";
import type { NumberAccessor, PatternSelection, StringAccessor } from "../types";

// Type definitions for rectangle annotation component
type Datum<T = unknown> = T;

interface RectangleProps<T = unknown> {
  x: (d: Datum<T>) => NumberValue;
  y: (d: Datum<T>) => NumberValue;
  width: (d: Datum<T>) => NumberValue;
  height: (d: Datum<T>) => NumberValue;
  dx?: (d: Datum<T>) => NumberValue;
  dy?: (d: Datum<T>) => NumberValue;
  caption?: (d: Datum<T>) => string;
}

interface RectangleComponent<T = unknown> extends Component {
  x(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  y(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  width(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  height(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  dx(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  dy(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
  caption(accessor?: StringAccessor<Datum<T>>): RectangleComponent<T>;
}

export default function <T = unknown>(): RectangleComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("width", fn.functor)
    .prop("height", fn.functor)
    .prop("dx", fn.functor)
    .prop("dy", fn.functor)
    .prop("caption", fn.functor)
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select<Element, Datum<T>>(this);
      const props = selection.props<RectangleProps<T>>();

      const patternSelection: PatternSelection = ensureDefsElement(
        selection,
        "pattern",
        "data-area-pattern"
      );
      dataAreaPattern(patternSelection);

      const dataArea = selection
        .selectAll(".sszvis-dataarearectangle")
        .data(data)
        .join("rect")
        .classed("sszvis-dataarearectangle", true);

      dataArea
        .attr("x", (d) => Number(props.x(d)))
        .attr("y", (d) => Number(props.y(d)))
        .attr("width", (d) => Number(props.width(d)))
        .attr("height", (d) => Number(props.height(d)))
        .attr("fill", "url(#data-area-pattern)");

      if (props.caption) {
        const dataCaptions = selection
          .selectAll(".sszvis-dataarearectangle__caption")
          .data(data)
          .join("text")
          .classed("sszvis-dataarearectangle__caption", true);

        dataCaptions
          .attr("x", (d) => Number(props.x(d)) + Number(props.width(d)) / 2)
          .attr("y", (d) => Number(props.y(d)) + Number(props.height(d)) / 2)
          .attr("dx", props.dx ? (d) => Number(props.dx?.(d)) : null)
          .attr("dy", props.dy ? (d) => Number(props.dy?.(d)) : null)
          .text((d) => props.caption?.(d) || "");
      }
    }) as RectangleComponent<T>;
}
