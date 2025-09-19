/**
 * Range Flag annotation
 *
 * The range flag component creates a pair of small white circles which fit well with the range ruler.
 * However, this is a separate component for implementation reasons, because the data for the range flag
 * should usually be only one value, distinct from the range ruler which expects multiple values. The range
 * flag also creates a tooltip anchor between the two dots, to which you can attach a tooltip. See the
 * interactive stacked area chart examples for a use of the range flag.
 *
 * @module sszvis/annotation/rangeFlag
 *
 * @property {number functor} x           A value for the x-value of the range flag
 * @property {number functor} y0          A value for the y-value of the lower range flag dot
 * @property {number functor} y1          A value for the y-value of the upper range flag dot
 *
 * @returns {sszvis.component}
 */

import { type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { halfPixel } from "../svgUtils/crisp";
import type { AnySelection, NumberAccessor } from "../types";
import tooltipAnchor from "./tooltipAnchor";

// Type definitions for range flag component
type Datum<T = unknown> = T;

interface RangeFlagProps<T = unknown> {
  x: (d: Datum<T>) => NumberValue;
  y0: (d: Datum<T>) => NumberValue;
  y1: (d: Datum<T>) => NumberValue;
}

interface RangeFlagComponent<T = unknown> extends Component {
  x(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
  y0(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
  y1(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
}

export default function <T = unknown>(): RangeFlagComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y0", fn.functor)
    .prop("y1", fn.functor)
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select<Element, Datum<T>>(this);
      const props = selection.props<RangeFlagProps<T>>();

      const crispX = fn.compose(halfPixel, props.x);
      const crispY0 = fn.compose(halfPixel, props.y0);
      const crispY1 = fn.compose(halfPixel, props.y1);

      selection
        .selectAll(".sszvis-rangeFlag__mark.bottom")
        .data(data)
        .call(makeFlagDot("bottom", crispX, crispY0));

      selection
        .selectAll(".sszvis-rangeFlag__mark.top")
        .data(data)
        .call(makeFlagDot("top", crispX, crispY1));

      const ta = tooltipAnchor<Datum<T>>().position((d) => [
        crispX(d),
        halfPixel((Number(props.y0(d)) + Number(props.y1(d))) / 2),
      ]);

      selection.call(ta);
    }) as RangeFlagComponent<T>;
}

function makeFlagDot<T>(classed: string, cx: (d: Datum<T>) => number, cy: (d: Datum<T>) => number) {
  return (dot: AnySelection) => {
    dot
      .join("circle")
      .classed("sszvis-rangeFlag__mark", true)
      .classed(classed, true)
      .attr("r", 3.5)
      .attr("cx", cx)
      .attr("cy", cy);
  };
}
