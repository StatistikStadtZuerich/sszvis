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
import { type Component } from "../d3-component";
import type { AnySelection, BooleanAccessor, NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
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
export declare const annotationRuler: <T = unknown>() => RulerComponent<T>;
export declare const rulerLabelVerticalSeparate: <T = unknown>(cAcc: (d: T) => string | number) => (g: AnySelection) => void;
export {};
//# sourceMappingURL=ruler.d.ts.map