/**
 * Confidence Bar annotation
 *
 * A generic component for creating confidence bars that display confidence intervals or error ranges.
 * The component should be passed an array of data values, each of which will be used to
 * render confidence bars by passing them through the accessor functions. Confidence bars consist of
 * a vertical line connecting the confidence bounds and horizontal caps at the top and bottom.
 *
 * @module sszvis/annotation/confidenceBar
 *
 * @template T The type of the data objects used in the confidence bars
 * @param {number, function} x               The x-position accessor for the confidence bars (currently unused)
 * @param {number, function} y               The y-position accessor for the confidence bars
 * @param {number, function} confidenceLow   Accessor function for the lower confidence bound
 * @param {number, function} confidenceHigh  Accessor function for the upper confidence bound
 * @param {number, function} width           The width of the horizontal confidence cap
 * @param {number} groupSize                 The number of items in each group
 * @param {number} groupWidth                The width allocated for each group
 * @param {number} groupSpace                The spacing between items within a group (default: 0.05)
 * @param {function} groupScale              Scale function for positioning groups horizontally
 *
 * @returns {sszvis.component} An confidence bar annotation component
 */
import { type NumberValue } from "d3";
import { type Component } from "../d3-component.js";
type Datum<T = unknown> = T & {
    __sszvisGroupedBarConfidenceIndex__?: number;
};
interface ConfidenceBarComponent<T = unknown> extends Component {
    x(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
    y(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
    confidenceLow(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
    confidenceHigh(accessor?: (d: Datum<T>) => NumberValue): ConfidenceBarComponent<T>;
    width(width?: number): ConfidenceBarComponent<T>;
    groupSize(size?: number): ConfidenceBarComponent<T>;
    groupWidth(width?: number): ConfidenceBarComponent<T>;
    groupSpace(space?: number): ConfidenceBarComponent<T>;
    groupScale(scale?: (d: Datum<T>) => number): ConfidenceBarComponent<T>;
}
export default function <T = unknown>(): ConfidenceBarComponent<T>;
export {};
//# sourceMappingURL=confidenceBar.d.ts.map