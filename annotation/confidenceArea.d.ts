/**
 * @function sszvis.annotationConfidenceArea
 *
 * A component for creating confidence areas. The component should be passed
 * an array of data values, each of which will be used to render a confidence area
 * by passing it through the accessor functions. You can specify the x, y0, and y1
 * properties to define the area. The component also supports stroke, strokeWidth,
 * and fill properties for styling.
 *
 * @module sszvis/annotation/confidenceArea
 *
 * @param {function} x             The x-accessor function.
 * @param {function} y0            The y0-accessor function.
 * @param {function} y1            The y1-accessor function.
 * @param {string} [stroke]        The stroke color of the area.
 * @param {number} [strokeWidth]   The stroke width of the area.
 * @param {string} [fill]          The fill color of the area.
 * @param {function} [key]         The key function for data binding.
 * @param {function} [valuesAccessor] The accessor function for the data values.
 * @param {boolean} [transition]   Whether to apply a transition to the area.
 *
 * @returns {sszvis.component} a confidence area component
 */
import { type Component } from "../d3-component";
import type { NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
interface ConfidenceAreaComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
    y0(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
    y1(accessor?: NumberAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
    stroke(stroke?: string): ConfidenceAreaComponent<T>;
    strokeWidth(width?: number): ConfidenceAreaComponent<T>;
    fill(fill?: string): ConfidenceAreaComponent<T>;
    key(accessor?: StringAccessor<Datum<T>>): ConfidenceAreaComponent<T>;
    valuesAccessor(accessor?: (d: Datum<T>[]) => Datum<T>[]): ConfidenceAreaComponent<T>;
    transition(enabled?: boolean): ConfidenceAreaComponent<T>;
}
export default function <T = unknown>(): ConfidenceAreaComponent<T>;
export {};
//# sourceMappingURL=confidenceArea.d.ts.map