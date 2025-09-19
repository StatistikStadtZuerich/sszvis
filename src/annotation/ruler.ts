/**
 * Ruler annotation
 *
 * The ruler component can be used to create a vertical line which highlights data at a certain
 * x-value, for instance in a line chart or area chart. The ruler expects data to be bound to
 * the layer it renders into, and it will generate a small dot for each data point it finds.
 *
 * @module sszvis/annotation/ruler
 *
 * @property {number} top                 A number which is the y-position of the top of the ruler line
 * @property {number} bottom              A number which is the y-position of the bottom of the ruler line
 * @property {function} x                 A number or function returning a number for the x-position of the ruler line.
 * @property {function} y                 A function for determining the y-position of the ruler dots. Should take a data
 *                                        value as an argument and return a y-position.
 * @property {function} label             A function for determining the labels of the ruler dots. Should take a
 *                                        data value as argument and return a label.
 * @property {string, function} color     A string or function to specify the color of the ruler dots.
 * @property {function} flip              A boolean or function which returns a boolean that specifies
 *                                        whether the labels on the ruler dots should be flipped. (they default to the right side)
 * @property {function} labelId           An id accessor function for the labels. This is used to match label data to svg elements,
 *                                        and it is used by the reduceOverlap algorithm to match calculated bounds and positions with
 *                                        labels. The default implementation uses the x and y positions of each label, but when labels
 *                                        overlap, these positions are the same (and one will be removed!). It's generally a good idea
 *                                        to provide your own function here, but you should especially use this when multiple labels
 *                                        could overlap with each other. Usually this will be some kind of category accessor function.
 * @property {boolean} reduceOverlap      Use an iterative relaxation algorithm to adjust the positions of the labels (when there is more
 *                                        than one label) so that they don't overlap. This can be computationally expensive, when there are
 *                                        many labels that need adjusting. This is turned off by default.
 *
 * @return {sszvis.component}
 */

import { ascending, type NumberValue, select } from "d3";
import { type Component, component } from "../d3-component";
import * as fn from "../fn";
import { halfPixel } from "../svgUtils/crisp";
import translateString from "../svgUtils/translateString";
import type { AnySelection, BooleanAccessor, NumberAccessor, StringAccessor } from "../types";

// Type definitions for ruler component
type Datum<T = unknown> = T;

interface RulerProps<T = unknown> {
  top: number;
  bottom: number;
  x: (d: Datum<T>) => NumberValue;
  y: (d: Datum<T>) => NumberValue;
  label: (d: Datum<T>) => string;
  color?: string | ((d: Datum<T>) => string);
  flip: (d: Datum<T>) => boolean;
  labelId?: (d: Datum<T>) => string;
  reduceOverlap: boolean;
}

interface RulerComponent<T = unknown> extends Component {
  top(value?: number): RulerComponent<T>;
  bottom(value?: number): RulerComponent<T>;
  x(accessor?: NumberAccessor<Datum<T>>): RulerComponent<T>;
  y(accessor?: NumberAccessor<Datum<T>>): RulerComponent<T>;
  label(accessor?: StringAccessor<Datum<T>>): RulerComponent<T>;
  color(accessor?: StringAccessor<Datum<T>>): RulerComponent<T>;
  flip(accessor?: BooleanAccessor<Datum<T>>): RulerComponent<T>;
  labelId(accessor?: StringAccessor<Datum<T>>): RulerComponent<T>;
  reduceOverlap(enabled?: boolean): RulerComponent<T>;
}

export const annotationRuler = <T = unknown>(): RulerComponent<T> =>
  component()
    .prop("top")
    .prop("bottom")
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("label")
    .label(fn.functor(""))
    .prop("color")
    .prop("flip", fn.functor)
    .flip(false)
    .prop("labelId", fn.functor)
    .prop("reduceOverlap")
    .reduceOverlap(true)
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select<Element, Datum<T>>(this);
      const props = selection.props<RulerProps<T>>();

      const labelId = props.labelId || ((d: Datum<T>) => `${props.x(d)}_${props.y(d)}`);

      const ruler = selection
        .selectAll<SVGLineElement, Datum<T>>(".sszvis-ruler__rule")
        .data(data, (d) => labelId(d))
        .join("line")
        .classed("sszvis-ruler__rule", true);

      ruler
        .attr("x1", fn.compose(halfPixel, props.x))
        .attr("y1", (d) => Number(props.y(d)))
        .attr("x2", fn.compose(halfPixel, props.x))
        .attr("y2", props.bottom);

      const dot = selection
        .selectAll<SVGCircleElement, Datum<T>>(".sszvis-ruler__dot")
        .data(data, (d) => labelId(d))
        .join("circle")
        .classed("sszvis-ruler__dot", true);

      dot
        .attr("cx", fn.compose(halfPixel, props.x))
        .attr("cy", fn.compose(halfPixel, props.y))
        .attr("r", 3.5)
        .attr("fill", props.color || "black");

      selection
        .selectAll<SVGTextElement, Datum<T>>(".sszvis-ruler__label-outline")
        .data(data, (d) => labelId(d))
        .join("text")
        .classed("sszvis-ruler__label-outline", true);

      const label = selection
        .selectAll<SVGTextElement, Datum<T>>(".sszvis-ruler__label")
        .data(data, (d) => labelId(d))
        .join("text")
        .classed("sszvis-ruler__label", true);

      // Update both label and labelOutline selections

      const crispX = fn.compose(halfPixel, props.x);
      const crispY = fn.compose(halfPixel, props.y);

      const textSelection = selection
        .selectAll<SVGTextElement, Datum<T>>(".sszvis-ruler__label, .sszvis-ruler__label-outline")
        .attr("transform", (d) => {
          const x = crispX(d);
          const y = crispY(d);

          const dx = props.flip(d) ? -10 : 10;
          const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;

          return translateString(x + dx, y + dy);
        })
        .style("text-anchor", (d) => (props.flip(d) ? "end" : "start"))
        .html((d) => props.label(d));

      if (props.reduceOverlap) {
        const THRESHOLD = 2;
        let ITERATIONS = 10;

        interface LabelBounds {
          top: number;
          bottom: number;
          dy: number;
        }

        const labelBounds: LabelBounds[] = [];
        // Optimization for the lookup later
        const labelBoundsIndex: Record<string | number, LabelBounds> = {};

        // Reset vertical shift (set by previous renders)
        textSelection.attr("y", "");

        // Create bounds objects
        label.each(function (this: SVGTextElement, d: Datum<T>) {
          const bounds = this.getBoundingClientRect();
          const item: LabelBounds = {
            top: bounds.top,
            bottom: bounds.bottom,
            dy: 0,
          };
          labelBounds.push(item);
          labelBoundsIndex[labelId(d)] = item;
        });

        // Sort array in place by vertical position
        // (only supports labels of same height)
        labelBounds.sort((a, b) => ascending(a.top, b.top));

        // Using postfix decrement means the expression evaluates to the value of the variable
        // before the decrement takes place. In the case of 10 iterations, this means that the
        // variable gets to 0 after the truthiness of the 10th iteration is tested, and the
        // expression is false at the beginning of the 11th, so 10 iterations are executed.
        // If you use prefix decrement (--ITERATIONS), the variable gets to 0 at the beginning of
        // the 10th iteration, meaning that only 9 iterations are executed.
        while (ITERATIONS--) {
          // Calculate overlap and correct position
          for (const [index, firstLabel] of labelBounds.entries()) {
            for (const secondLabel of labelBounds.slice(index + 1)) {
              const overlap = firstLabel.bottom - secondLabel.top;
              if (overlap >= THRESHOLD) {
                const offset = overlap / 2;
                firstLabel.bottom -= offset;
                firstLabel.top -= offset;
                firstLabel.dy -= offset;
                secondLabel.bottom += offset;
                secondLabel.top += offset;
                secondLabel.dy += offset;
              }
            }
          }
        }

        // Shift vertically to remove overlap
        textSelection.attr("y", (d: Datum<T>) => {
          const textLabel = labelBoundsIndex[labelId(d)];
          return textLabel.dy;
        });
      }
    });

interface LabelBoundsSeparate {
  category: string | number;
  top: number;
  bottom: number;
  dy: number;
}

export const rulerLabelVerticalSeparate =
  <T = unknown>(cAcc: (d: T) => string | number) =>
  (g: AnySelection) => {
    const THRESHOLD = 2;
    const labelBounds: LabelBoundsSeparate[] = [];

    // Reset vertical shift
    g.selectAll<SVGTextElement, Datum<T>>("text").each(function () {
      select(this).attr("y", "");
    });

    // Calculate bounds
    g.selectAll<SVGTextElement, Datum<T>>(".sszvis-ruler__label").each(function (d) {
      const bounds = this.getBoundingClientRect();
      labelBounds.push({
        category: cAcc(d),
        top: bounds.top,
        bottom: bounds.bottom,
        dy: 0,
      });
    });

    // Sort by vertical position (only supports labels of same height)
    labelBounds.sort((a, b) => ascending(a.top, b.top));

    // Calculate overlap and correct position
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < labelBounds.length; j++) {
        for (let k = j + 1; k < labelBounds.length; k++) {
          if (j === k) continue;
          const firstLabel = labelBounds[j];
          const secondLabel = labelBounds[k];
          const overlap = firstLabel.bottom - secondLabel.top;
          if (overlap >= THRESHOLD) {
            firstLabel.bottom -= overlap / 2;
            firstLabel.top -= overlap / 2;
            firstLabel.dy -= overlap / 2;
            secondLabel.bottom += overlap / 2;
            secondLabel.top += overlap / 2;
            secondLabel.dy += overlap / 2;
          }
        }
      }
    }

    // Shift vertically to remove overlap
    g.selectAll<SVGTextElement, Datum<T>>("text").each(function (d) {
      const label = fn.find((l: LabelBoundsSeparate) => l.category === cAcc(d), labelBounds);
      if (label) {
        select(this).attr("y", label.dy);
      }
    });
  };
