/**
 * Circle annotation
 *
 * A component for creating circular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/circle
 *
 * @template T The type of the data objects used in the circle annotations
 * @param {number, function} x        The x-position of the center of the data area.
 * @param {number, function} y        The y-position of the center of the data area.
 * @param {number, function} r        The radius of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
 *
 * @returns {sszvis.component} a circular data area component
 */
import { type Component } from "../d3-component";
import type { NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
interface CircleComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
    y(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
    r(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
    dx(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
    dy(accessor?: NumberAccessor<Datum<T>>): CircleComponent<T>;
    caption(accessor?: StringAccessor<Datum<T>>): CircleComponent<T>;
}
export default function <T = unknown>(): CircleComponent<T>;
export {};
//# sourceMappingURL=circle.d.ts.map