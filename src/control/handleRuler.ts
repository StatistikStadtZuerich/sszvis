/**
 * Ruler with a handle control
 *
 * The handle ruler component is very similar to the ruler component, except that it is rendered
 * with a 24-pixel tall handle at the top. It is moved and repositioned in the same manner as a ruler,
 * so the actual interaction with the handle is up to the developer to specify. This component also
 * creates dots for each data point it finds bound to its layer.
 *
 * @module sszvis/control/handleRuler
 *
 * @property {function} x                   A function or number which determines the x-position of the ruler
 * @property {function} y                   A function which determines the y-position of the ruler dots. Passed data values.
 * @property {number} top                   A number for the y-position of the top of the ruler.
 * @property {number} bottom                A number for the y-position of the bottom of the ruler.
 * @property {string, function} label       A string or string function for the labels of the ruler dots.
 * @property {string, function} color       A string or color for the fill color of the ruler dots.
 * @property {boolean, function} flip       A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)
 *
 * Note: the rule, the handle and the grip mark live in a group whose datum is the constant 0, so
 * an `x` accessor function is called with 0 rather than with a data value and those three elements
 * end up at NaN. In practice `x` has to be a number here, even though the dots and labels - which
 * are bound to the data - do work with an accessor.
 *
 * Note: the three static elements are appended on every render instead of being joined, so a
 * component that re-renders accumulates a rule, a handle and a grip mark each time, with the newest
 * copies painted over the dots.
 *
 * Note: labels are written with `.html()`, as elsewhere in the library, because sszvis.modularText
 * produces markup. Escaping untrusted label data is the caller's responsibility. Unlike
 * sszvis.annotation.ruler, this control neither de-overlaps labels nor defaults `color`, and its
 * labels are joined on the component's own selection rather than on the ruler group - so hiding or
 * moving that group leaves the labels behind.
 *
 * Note: the rule stops 4px above `bottom`, but the label's vertical nudge is decided against the
 * unadjusted `bottom`. A label falling in that 4px band is offset as if it were still on the ruler.
 *
 * Note: a label whose y is above `top` is nudged down by `2 * y` rather than by a constant, so it
 * lands well below its dot - by up to twice the distance to the top of the chart. The same
 * expression appears in sszvis.annotation.ruler.
 *
 * Note: `top` and `bottom` have no defaults; leaving them out writes NaN into the geometry and the
 * ruler silently disappears.
 *
 * See test/control/handleRuler.test.ts.
 *
 * @returns {sszvis.component}
 */

import { type NumberValue, select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { halfPixel } from "../svgUtils/crisp.js";
import translateString from "../svgUtils/translateString.js";
import type { BooleanAccessor, NumberAccessor, StringAccessor } from "../types.js";

/** The gap kept between the bottom of the rule and props.bottom. */
const RULE_BOTTOM_INSET = 4;
const HANDLE_WIDTH = 10;
const HANDLE_HEIGHT = 24;
/** Where the grip mark starts and ends within the handle, as a fraction of its height. */
const HANDLE_MARK_TOP = 0.15;
const HANDLE_MARK_BOTTOM = 0.85;
const DOT_RADIUS = 3.5;
/** Horizontal distance between a dot and its label. */
const LABEL_OFFSET = 10;

/**
 * A half-pixel position accessor as d3 invokes it: the datum plus d3's remaining
 * (i, nodes) arguments, with `this` bound to the element.
 */
type CrispAccessor<D> = (this: unknown, d: D, ...rest: unknown[]) => number;

interface HandleRulerProps<T> {
  /**
   * Called with a data value for the dots and labels, but with the ruler group's
   * placeholder datum (the number 0) for the rule, the handle and the grip mark - hence
   * the union. See the note in the module docs.
   */
  x: (d: T | number) => NumberValue;
  y: (d: T) => NumberValue;
  top: number;
  bottom: number;
  /** Not functor-wrapped: a plain string label is passed straight to d3's .html(). */
  label: StringAccessor<T>;
  color?: string | ((d: T) => string);
  flip: (d: T) => boolean;
}

export interface HandleRulerComponent<T = unknown>
  extends ComponentBuilder<HandleRulerComponent<T>> {
  x(): (d: T | number) => NumberValue;
  x(accessor: NumberAccessor<T | number>): HandleRulerComponent<T>;
  y(): (d: T) => NumberValue;
  y(accessor: NumberAccessor<T>): HandleRulerComponent<T>;
  top(): number;
  top(value: number): HandleRulerComponent<T>;
  bottom(): number;
  bottom(value: number): HandleRulerComponent<T>;
  label(): StringAccessor<T>;
  label(accessor: StringAccessor<T>): HandleRulerComponent<T>;
  color(): string | ((d: T) => string) | undefined;
  color(accessor: StringAccessor<T>): HandleRulerComponent<T>;
  flip(): (d: T) => boolean;
  flip(accessor: BooleanAccessor<T>): HandleRulerComponent<T>;
}

export default function handleRuler<T = unknown>(): HandleRulerComponent<T> {
  return component()
    .prop("x", fn.functor)
    .prop("y", fn.functor)
    .prop("top")
    .prop("bottom")
    .prop("label")
    .label(fn.functor(""))
    .prop("color")
    .prop("flip", fn.functor)
    .flip(false)
    .render(function (this: Element, data: T[]) {
      const selection = select<Element, T>(this);
      const props = selection.props<HandleRulerProps<T>>();

      // Elements need to be placed on half-pixels in order to be rendered
      // crisply across browsers. That's why we create this position accessor
      // here that takes a datum as input, reads out its value (props.x) and
      // then rounds this pixel value to half pixels (1px -> 1.5px, 1.2px -> 1.5px)
      // Composed with fn.compose rather than written as arrow functions so that d3's full
      // (d, i, nodes) argument list and its element-bound `this` still reach the accessor.
      const crispX = fn.compose(halfPixel, props.x) as CrispAccessor<T | number>;
      const crispY = fn.compose(halfPixel, props.y) as CrispAccessor<T>;

      const bottom = props.bottom - RULE_BOTTOM_INSET;
      const handleTop = props.top - HANDLE_HEIGHT;

      const group = selection
        .selectAll<SVGGElement, number>(".sszvis-handleRuler__group")
        .data([0])
        .join("g")
        .classed("sszvis-handleRuler__group", true);

      group.append("line").classed("sszvis-ruler__rule", true);

      group.append("rect").classed("sszvis-handleRuler__handle", true);

      group.append("line").classed("sszvis-handleRuler__handle-mark", true);

      group
        .selectAll<SVGLineElement, number>(".sszvis-ruler__rule")
        .attr("x1", crispX)
        .attr("y1", halfPixel(props.top))
        .attr("x2", crispX)
        .attr("y2", halfPixel(bottom));

      group
        .selectAll<SVGRectElement, number>(".sszvis-handleRuler__handle")
        .attr("x", (d) => crispX(d) - HANDLE_WIDTH / 2)
        .attr("y", halfPixel(handleTop))
        .attr("width", HANDLE_WIDTH)
        .attr("height", HANDLE_HEIGHT)
        .attr("rx", 2)
        .attr("ry", 2);

      group
        .selectAll<SVGLineElement, number>(".sszvis-handleRuler__handle-mark")
        .attr("x1", crispX)
        .attr("y1", halfPixel(handleTop + HANDLE_HEIGHT * HANDLE_MARK_TOP))
        .attr("x2", crispX)
        .attr("y2", halfPixel(handleTop + HANDLE_HEIGHT * HANDLE_MARK_BOTTOM));

      const dots = group
        .selectAll<SVGCircleElement, T>(".sszvis-ruler__dot")
        .data(data)
        .join("circle")
        .classed("sszvis-ruler__dot", true);

      dots
        .attr("cx", crispX)
        .attr("cy", crispY)
        .attr("r", DOT_RADIUS)
        // `?? null` only to satisfy d3's attr signature: it treats null and undefined
        // alike (`value == null` removes the attribute), so this matches the original.
        .attr("fill", props.color ?? null);

      selection
        .selectAll<SVGTextElement, T>(".sszvis-ruler__label-outline")
        .data(data)
        .join("text")
        .classed("sszvis-ruler__label-outline", true);

      selection
        .selectAll<SVGTextElement, T>(".sszvis-ruler__label")
        .data(data)
        .join("text")
        .classed("sszvis-ruler__label", true);

      // Update both labelOutline and labelOutline selections

      selection
        .selectAll<SVGTextElement, T>(".sszvis-ruler__label, .sszvis-ruler__label-outline")
        .attr("transform", (d) => {
          const x = crispX(d);
          const y = crispY(d);

          const dx = props.flip(d) ? -LABEL_OFFSET : LABEL_OFFSET;
          const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;

          return translateString(x + dx, y + dy);
        })
        .style("text-anchor", (d) => (props.flip(d) ? "end" : "start"))
        .html(props.label);
    });
}
