/**
 * Circle annotation
 *
 * A component for creating circular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/circle
 *
 * @template T The type of the data objects used in the circle annotations
 * @param {number, function} x        The x-position of the center of the data area.
 * @param {number, function} y        The y-position of the center of the data area.
 * @param {number, function} r        The radius of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
 *
 * @returns {sszvis.component} a circular data area component
 */

import { type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { dataAreaPattern } from "../patterns";
import ensureDefsElement from "../svgUtils/ensureDefsElement";
import type { NumberAccessor, PatternSelection, StringAccessor } from "../types";

// Type definitions for circle annotation component
type Datum<T = unknown> = T;

interface CircleProps<T = unknown> {
  x: (d: Datum<T>) => NumberValue;
  y: (d: Datum<T>) => NumberValue;
  r: (d: Datum<T>) => NumberValue;
  dx?: (d: Datum<T>) => NumberValue;
  dy?: (d: Datum<T>) => NumberValue;
  caption?: (d: Datum<T>) => string;
}

interface CircleComponent<T = unknown> extends Component {
  x(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
  y(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
  r(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
  dx(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
  dy(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
  caption(accessor?: StringAccessor<Datum<T>>): CircleComponent<T>;
}

export default function <T = unknown>(): CircleComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("r", fn.functor)
    .prop("dx", fn.functor)
    .prop("dy", fn.functor)
    .prop("caption", fn.functor)
    .render(function (data: Datum<T>[]) {
      const selection = select(this);
      const props = selection.props() as CircleProps<T>;

      const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
      dataAreaPattern(patternSelection as PatternSelection);

      const dataArea = selection
        .selectAll(".sszvis-dataareacircle")
        .data(data)
        .join("circle")
        .classed("sszvis-dataareacircle", true);

      dataArea
        .attr("cx", (d: Datum<T>): number => Number(props.x(d)))
        .attr("cy", (d: Datum<T>): number => Number(props.y(d)))
        .attr("r", (d: Datum<T>): number => Number(props.r(d)))
        .attr("fill", "url(#data-area-pattern)");

      if (props.caption) {
        const dataCaptions = selection
          .selectAll(".sszvis-dataareacircle__caption")
          .data(data)
          .join("text")
          .classed("sszvis-dataareacircle__caption", true);

        dataCaptions
          .attr("x", (d: Datum<T>): number => Number(props.x(d)))
          .attr("y", (d: Datum<T>): number => Number(props.y(d)))
          .attr("dx", props.dx ? (d: Datum<T>): number => Number(props.dx?.(d)) : null)
          .attr("dy", props.dy ? (d: Datum<T>): number => Number(props.dy?.(d)) : null)
          .text(props.caption ? (d: Datum<T>): string => props.caption?.(d) || "" : null);
      }
    }) as CircleComponent<T>;
}
