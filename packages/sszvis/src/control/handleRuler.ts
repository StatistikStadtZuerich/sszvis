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
 * Note: there is one rule, one handle and one grip mark however many data points are bound, so
 * they are positioned from a single datum - the first one. An `x` accessor is called with that
 * datum; for data whose `x` values differ, the ruler follows the first. With no data bound there is
 * no first datum, so an `x` accessor is called with `undefined` - pass a number in that case.
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
/** Vertical nudge that drops a label's baseline clear of its dot. */
const LABEL_BASELINE_NUDGE = 5;

/**
 * A half-pixel position accessor as d3 invokes it: the datum plus d3's remaining
 * (i, nodes) arguments, with `this` bound to the element.
 */
type CrispAccessor<D> = (this: unknown, d: D, ...rest: unknown[]) => number;

interface HandleRulerProps<T> {
  /**
   * Called with a data value. The rule, the handle and the grip mark are bound to the
   * first datum, so an accessor positions them from that one. See the module docs.
   */
  x: (d: T) => NumberValue;
  y: (d: T) => NumberValue;
  top: number;
  bottom: number;
  /** Not functor-wrapped: a plain string label is passed straight to d3's .html(). */
  label: StringAccessor<T>;
  color?: string | ((d: T) => string);
  flip: (d: T) => boolean;
}

export interface HandleRulerComponent<T = unknown> extends ComponentBuilder<
  HandleRulerComponent<T>
> {
  x(): (d: T) => NumberValue;
  x(accessor: NumberAccessor<T>): HandleRulerComponent<T>;
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
  return component<HandleRulerComponent<T>>()
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
      const crispX = fn.compose(halfPixel, props.x) as CrispAccessor<T>;
      const crispY = fn.compose(halfPixel, props.y) as CrispAccessor<T>;

      const bottom = props.bottom - RULE_BOTTOM_INSET;
      const handleTop = props.top - HANDLE_HEIGHT;

      // There is a single rule, handle and grip mark whatever the data, so the group they
      // live in is bound to one datum - the first - and `props.x` is read from that. The
      // dots and labels below are joined on the whole data array as usual. The array holds
      // one slot even for empty data, so the ruler still renders (from a constant `x`).
      const rulerDatum = [data[0]] as T[];

      const group = selection
        .selectAll<SVGGElement, T>(".sszvis-handleRuler__group")
        .data(rulerDatum)
        .join("g")
        .classed("sszvis-handleRuler__group", true);

      // The static parts are joined rather than appended so that a re-render - the normal
      // case for an interactive ruler - neither duplicates them nor moves them in front of
      // the dots, which are joined further down and must stay on top.
      group
        .selectAll<SVGLineElement, T>(".sszvis-ruler__rule")
        .data((d) => [d])
        .join("line")
        .classed("sszvis-ruler__rule", true)
        .attr("x1", crispX)
        .attr("y1", halfPixel(props.top))
        .attr("x2", crispX)
        .attr("y2", halfPixel(bottom));

      group
        .selectAll<SVGRectElement, T>(".sszvis-handleRuler__handle")
        .data((d) => [d])
        .join("rect")
        .classed("sszvis-handleRuler__handle", true)
        .attr("x", (d) => crispX(d) - HANDLE_WIDTH / 2)
        .attr("y", halfPixel(handleTop))
        .attr("width", HANDLE_WIDTH)
        .attr("height", HANDLE_HEIGHT)
        .attr("rx", 2)
        .attr("ry", 2);

      group
        .selectAll<SVGLineElement, T>(".sszvis-handleRuler__handle-mark")
        .data((d) => [d])
        .join("line")
        .classed("sszvis-handleRuler__handle-mark", true)
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
          // A constant nudge, whether the dot sits on the ruler or above its top; only a
          // dot below `bottom` needs none. The same expression lives in
          // src/annotation/ruler.ts and the two must not drift.
          const dy = y > props.bottom ? 0 : LABEL_BASELINE_NUDGE;

          return translateString(x + dx, y + dy);
        })
        .style("text-anchor", (d) => (props.flip(d) ? "end" : "start"))
        .html(props.label);
    });
}
