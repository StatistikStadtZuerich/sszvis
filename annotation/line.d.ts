/**
 * Line annotation
 *
 * A component for creating reference line data areas. The component should be passed
 * an array of data values, each of which will be used to render a reference line
 * by passing it through the accessor functions. You can specify a caption to display,
 * which will be positioned by default at the midpoint of the line you specify,
 * aligned with the angle of the line. The caption can be offset from the midpoint
 * by specifying dx or dy properties.
 *
 * @module sszvis/annotation/line
 *
 * @template T The type of the data objects used in the line annotations
 * @param {any} x1             The x-value, in data units, of the first reference line point.
 * @param {any} x2             The x-value, in data units, of the second reference line point.
 * @param {any} y1             The y-value, in data units, of the first reference line point.
 * @param {any} y2             The y-value, in data units, of the second reference line point.
 * @param {function} xScale         The x-scale of the chart. Used to transform the given x- values into chart coordinates.
 * @param {function} yScale         The y-scale of the chart. Used to transform the given y- values into chart coordinates.
 * @param {number} [dx]           The x-offset of the caption
 * @param {number} [dy]           The y-offset of the caption
 * @param {string} [caption]      A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)
 * @returns {sszvis.component} a linear data area component (reference line)
 */
import { type AxisScale, type NumberValue } from "d3";
import { type Component } from "../d3-component";
import type { NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
interface LineComponent<T = unknown> extends Component {
    x1(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    x2(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    y1(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    y2(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    xScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
    yScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
    dx(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    dy(accessor?: NumberAccessor<Datum<T>>): LineComponent<T>;
    caption(accessor?: StringAccessor<Datum<T>>): LineComponent<T>;
}
export default function <T = unknown>(): LineComponent<T>;
export {};
//# sourceMappingURL=line.d.ts.map