/**
 * RangeRuler annotation
 *
 * The range ruler is similar to the handle ruler and the ruler, except for each data
 * point which it finds bound to its layer, it generates two small dots, and a label which
 * states the value of the data point. For an example, see the interactive stacked area charts.
 * Note that the interactive stacked area charts also include the rangeFlag component for highlighting
 * certain specific dots. This is a sepearate component.
 *
 * @module sszvis/annotation/rangeRuler
 *
 * @property {number functor} x            A function for the x-position of the ruler.
 * @property {number functor} y0           A function for the y-position of the lower dot. Called for each datum.
 * @property {number functor} y1           A function for the y-position of the upper dot. Called for each datum.
 * @property {number} top                  A number for the y-position of the top of the ruler
 * @property {number} bottom               A number for the y-position of the bottom of the ruler
 * @property {string functor} label        A function which generates labels for each range.
 * @property {number} total                A number to display as the total of the range ruler (at the top)
 * @property {boolean functor} flip        Determines whether the rangeRuler labels should be flipped (they default to the right side)
 *
 * @return {sszvis.component}
 */

import { type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { formatNumber } from "../format";
import { halfPixel } from "../svgUtils/crisp";
import type { BooleanAccessor, NumberAccessor, StringAccessor } from "../types";

// Type definitions for range ruler component
type Datum<T = unknown> = T;

interface RangeRulerProps<T = unknown> {
  x: (d: Datum<T>) => NumberValue;
  y0: (d: Datum<T>) => NumberValue;
  y1: (d: Datum<T>) => NumberValue;
  top: number;
  bottom: number;
  label: (d: Datum<T>) => string | number;
  removeStroke?: boolean;
  total?: number;
  flip: (d?: Datum<T>) => boolean;
}

interface RangeRulerComponent<T = unknown> extends Component {
  x(accessor?: NumberAccessor<Datum<T>>): RangeRulerComponent<T>;
  y0(accessor?: NumberAccessor<Datum<T>>): RangeRulerComponent<T>;
  y1(accessor?: NumberAccessor<Datum<T>>): RangeRulerComponent<T>;
  top(value?: number): RangeRulerComponent<T>;
  bottom(value?: number): RangeRulerComponent<T>;
  label(accessor?: StringAccessor<Datum<T>>): RangeRulerComponent<T>;
  removeStroke(value?: boolean): RangeRulerComponent<T>;
  total(value?: number): RangeRulerComponent<T>;
  flip(accessor?: BooleanAccessor<Datum<T>>): RangeRulerComponent<T>;
}

export default function <T = unknown>(): RangeRulerComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y0", fn.functor)
    .prop("y1", fn.functor)
    .prop("top")
    .prop("bottom")
    .prop("label")
    .prop("removeStroke")
    .label(fn.functor(""))
    .prop("total")
    .prop("flip", fn.functor)
    .flip(false)
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select<Element, Datum<T>>(this);
      const props = selection.props<RangeRulerProps<T>>();

      const crispX = fn.compose(halfPixel, props.x);
      const crispY0 = fn.compose(halfPixel, props.y0);
      const crispY1 = fn.compose(halfPixel, props.y1);
      const middleY = (d: Datum<T>) => {
        return halfPixel((Number(props.y0(d)) + Number(props.y1(d))) / 2);
      };

      const dotRadius = 1.5;

      const line = selection
        .selectAll(".sszvis-rangeRuler__rule")
        .data([0])
        .join("line")
        .classed("sszvis-rangeRuler__rule", true);

      line.attr("x1", crispX).attr("y1", props.top).attr("x2", crispX).attr("y2", props.bottom);

      const marks = selection
        .selectAll(".sszvis-rangeRuler--mark")
        .data(data)
        .join("g")
        .classed("sszvis-rangeRuler--mark", true);

      marks.append("circle").classed("sszvis-rangeRuler__p1", true);
      marks.append("circle").classed("sszvis-rangeRuler__p2", true);
      marks.append("text").classed("sszvis-rangeRuler__label-contour", true);
      marks.append("text").classed("sszvis-rangeRuler__label", true);

      marks
        .selectAll(".sszvis-rangeRuler__p1")
        .data((d) => [d])
        .attr("cx", crispX)
        .attr("cy", crispY0)
        .attr("r", dotRadius);

      marks
        .selectAll(".sszvis-rangeRuler__p2")
        .data((d) => [d])
        .attr("cx", crispX)
        .attr("cy", crispY1)
        .attr("r", dotRadius);

      marks
        .selectAll(".sszvis-rangeRuler__label")
        .data((d) => [d])
        .attr("x", (d) => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        })
        .attr("y", middleY)
        .attr("dy", "0.35em") // vertically-center
        .style("text-anchor", (d) => (props.flip(d) ? "end" : "start"))
        .text(fn.compose(formatNumber, props.label));

      //make the contour behind the the label update with the label
      marks
        .selectAll(".sszvis-rangeRuler__label-contour")
        .data((d) => [d])
        .attr("x", (d) => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        })
        .attr("y", middleY)
        .attr("dy", "0.35em") // vertically-center
        .style("text-anchor", (d) => (props.flip(d) ? "end" : "start"))
        .text(fn.compose(formatNumber, props.label));

      selection.selectAll("g.sszvis-rangeRuler--mark").each(function () {
        const g = select<Element, Datum<T>>(this as Element);
        const textNode = g.select("text").node() as SVGTextElement | null;
        let textContour = g.select<SVGTextElement>(".sszvis-rangeRuler__label-contour");
        if (textContour.empty()) {
          if (textNode) {
            const clonedNode = textNode.cloneNode(true) as SVGTextElement;
            textContour = select(clonedNode);
            textContour
              .classed("sszvis-rangeRuler__label-contour", true)
              .classed("sszvis-rangeRuler__label", false);
            const contourNode = textContour.node() as SVGTextElement | null;
            if (contourNode && this instanceof Element) {
              this.insertBefore(contourNode, textNode);
            }
          }
        } else {
          textContour
            .attr("x", (d) => {
              const offset = props.flip(d) ? -10 : 10;
              return crispX(d) + offset;
            })
            .attr("y", (d) => middleY(d as Datum<T>))
            .attr("dy", "0.35em") // vertically-center
            .style("text-anchor", (d) => {
              return props.flip(d) ? "end" : "start";
            });
        }
        if (textNode) {
          textContour.text(textNode.textContent || "");
        }
      });

      if (!props.removeStroke) {
        marks.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
      }

      const total = selection
        .selectAll(".sszvis-rangeRuler__total")
        .data([fn.last(data)])
        .join("text")
        .classed("sszvis-rangeRuler__total", true);

      total
        .attr("x", (d) => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        })
        .attr("y", props.top - 10)
        .style("text-anchor", (d) => {
          return props.flip(d) ? "end" : "start";
        })
        .text(`Total ${formatNumber(props.total)}`);

      const totalNode = total.node() as SVGTextElement | null;
      let totalContour = selection.select<SVGTextElement>(".sszvis-rangeRuler__total-contour");
      if (totalContour.empty()) {
        if (totalNode) {
          const clonedTotalNode = totalNode.cloneNode(true) as SVGTextElement;
          totalContour = select(clonedTotalNode);
          totalContour
            .classed("sszvis-rangeRuler__total-contour", true)
            .classed("sszvis-rangeRuler__total", false);
          const contourNode = totalContour.node() as SVGTextElement | null;
          if (contourNode && this instanceof Element) {
            this.insertBefore(contourNode, totalNode);
          }
        }
      } else {
        totalContour
          .attr("x", (d) => {
            const offset = props.flip(d) ? -10 : 10;
            return crispX(d) + offset;
          })
          .attr("y", props.top - 10)
          .style("text-anchor", (d) => {
            return props.flip(d) ? "end" : "start";
          });
      }
      if (totalNode) {
        totalContour.text(totalNode.textContent || "");
      }

      if (!props.removeStroke) {
        total.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
      }
    }) as RangeRulerComponent<T>;
}
