/**
 * Radius size legend
 *
 * Use for showing how different radius sizes correspond to data values.
 *
 * The legend draws one nested circle per tick, all resting on a common baseline, with a
 * dashed leader line and a label at the top edge of each circle.
 *
 * When tickValues are not supplied, the ticks default to the domain maximum, the value at
 * the midpoint of the scale's range, and the domain minimum. Deriving that middle tick
 * calls scale.invert(), so the default only works for a continuous scale; pass tickValues
 * explicitly to use any other kind.
 *
 * Every tick produces a circle, a leader line and a label, including a tick whose value
 * maps to a zero radius - the circle is then invisible but the line and label still mark
 * that value. Pass tickValues to leave it out.
 *
 * @module sszvis/legend/radius
 *
 * @property {function} scale         A scale to use to generate the radius sizes
 * @property {function} [tickFormat]  Formatter function for the labels (default identity)
 * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
 *
 * @returns {sszvis.component}
 */
import { type NumberValue } from "d3";
import { type Component } from "../d3-component.js";
/** The subset of a d3 scale this legend relies on. */
interface RadiusScale {
    (value: NumberValue): number;
    domain(): NumberValue[];
    range(): number[];
    /** Required only when tickValues are not supplied. */
    invert?(value: number): NumberValue;
}
/** Formats a tick label. The default is fn.identity, which passes the value through. */
type TickFormatter = (value: NumberValue, index: number) => string | number;
export interface RadiusLegendComponent extends Component {
    scale(): RadiusScale;
    scale(scale: RadiusScale): RadiusLegendComponent;
    tickFormat(): TickFormatter;
    tickFormat(format: TickFormatter): RadiusLegendComponent;
    tickValues(): NumberValue[] | undefined;
    tickValues(values: NumberValue[]): RadiusLegendComponent;
}
export default function (): RadiusLegendComponent;
export {};
//# sourceMappingURL=radius.d.ts.map