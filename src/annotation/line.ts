/**
 * Line annotation
 *
 * A component for creating reference line data areas. The component should be passed
 * an array of data values, each of which will be used to render a reference line
 * by passing it through the accessor functions. You can specify a caption to display,
 * which will be positioned by default at the midpoint of the line you specify,
 * aligned with the angle of the line. The caption can be offset from the midpoint
 * by specifying dx or dy properties.
 *
 * @module sszvis/annotation/line
 *
 * @template T The type of the data objects used in the line annotations
 * @param {any} x1             The x-value, in data units, of the first reference line point.
 * @param {any} x2             The x-value, in data units, of the second reference line point.
 * @param {any} y1             The y-value, in data units, of the first reference line point.
 * @param {any} y2             The y-value, in data units, of the second reference line point.
 * @param {function} xScale         The x-scale of the chart. Used to transform the given x- values into chart coordinates.
 * @param {function} yScale         The y-scale of the chart. Used to transform the given y- values into chart coordinates.
 * @param {number} [dx]           The x-offset of the caption
 * @param {number} [dy]           The y-offset of the caption
 * @param {string} [caption]      A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)
 * @returns {sszvis.component} a linear data area component (reference line)
 */

import { AxisDomain, AxisScale, type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import type { NumberAccessor, StringAccessor } from "../types";

// reference line specified in the form y = mx + b
// user supplies m and b
// default line is y = x

// Type definitions for line annotation component
type Datum<T = unknown> = T;

interface LineProps<T = unknown> {
  x1: NumberValue;
  x2: NumberValue;
  y1: NumberValue;
  y2: NumberValue;
  xScale: AxisScale<AxisDomain>;
  yScale: AxisScale<AxisDomain>;
  dx?: (d: Datum<T>) => NumberValue;
  dy?: (d: Datum<T>) => NumberValue;
  caption?: (d: Datum<T>) => string;
}

interface LineComponent<T = unknown> extends Component {
  x1(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  x2(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  y1(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  y2(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  xScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
  yScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
  dx(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  dy(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
  caption(accessor?: StringAccessor<Datum<T>>): LineComponent<T>;
}

export default function <T = unknown>(): LineComponent<T> {
  return component()
    .prop("x1")
    .prop("x2")
    .prop("y1")
    .prop("y2")
    .prop("xScale")
    .prop("yScale")
    .prop("dx", fn.functor)
    .dx(0)
    .prop("dy", fn.functor)
    .dy(0)
    .prop("caption", fn.functor)
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select(this);
      const props = selection.props() as LineProps<T>;

      const x1 = props.xScale(props.x1) || 0;
      const y1 = props.yScale(props.y1) || 0;
      const x2 = props.xScale(props.x2) || 0;
      const y2 = props.yScale(props.y2) || 0;

      const line = selection
        .selectAll(".sszvis-referenceline")
        .data(data)
        .join("line")
        .classed("sszvis-referenceline", true);

      line.attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);

      if (props.caption) {
        const caption = selection
          .selectAll(".sszvis-referenceline__caption")
          .data([0])
          .join("text")
          .classed("sszvis-referenceline__caption", true);

        caption
          .attr("transform", () => {
            const vx = x2 - x1;
            const vy = y2 - y1;
            const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
            return `translate(${(x1 + x2) / 2},${(y1 + y2) / 2}) rotate(${angle})`;
          })
          .attr("dx", props.dx ? Number(props.dx(data[0])) : null)
          .attr("dy", props.dy ? Number(props.dy(data[0])) : null)
          .text(props.caption ? props.caption(data[0]) : null);
      }
    }) as LineComponent<T>;
}
