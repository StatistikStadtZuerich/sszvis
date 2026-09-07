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
import { type NumberValue } from "d3";
import { type Component } from "../d3-component.js";
import type { BooleanAccessor, NumberAccessor, StringAccessor } from "../types.js";
export interface HandleRulerComponent<T = unknown> extends Component {
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
export default function handleRuler<T = unknown>(): HandleRulerComponent<T>;
//# sourceMappingURL=handleRuler.d.ts.map