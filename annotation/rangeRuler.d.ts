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
import { type Component } from "../d3-component";
import type { BooleanAccessor, NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
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
export default function <T = unknown>(): RangeRulerComponent<T>;
export {};
//# sourceMappingURL=rangeRuler.d.ts.map