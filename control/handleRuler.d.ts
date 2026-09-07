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
import { type NumberValue } from "d3";
import { type ComponentBuilder } from "../d3-component.js";
import type { BooleanAccessor, NumberAccessor, StringAccessor } from "../types.js";
export interface HandleRulerComponent<T = unknown> extends ComponentBuilder<HandleRulerComponent<T>> {
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
export default function handleRuler<T = unknown>(): HandleRulerComponent<T>;
//# sourceMappingURL=handleRuler.d.ts.map