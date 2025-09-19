/**
 * Rectangle annotation
 *
 * A component for creating rectangular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/rectangle
 *
 * @template T The type of the data objects used in the rectangle annotations
 * @param {number, function} x        The x-position of the upper left corner of the data area.
 * @param {number, function} y        The y-position of the upper left corner of the data area.
 * @param {number, function} width    The width of the data area.
 * @param {number, function} height   The height of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area.
 *
 * @returns {sszvis.component} a rectangular data area component
 */
import { type Component } from "../d3-component";
import type { NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
interface RectangleComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    y(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    width(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    height(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    dx(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    dy(accessor?: NumberAccessor<Datum<T>>): RectangleComponent<T>;
    caption(accessor?: StringAccessor<Datum<T>>): RectangleComponent<T>;
}
export default function <T = unknown>(): RectangleComponent<T>;
export {};
//# sourceMappingURL=rectangle.d.ts.map