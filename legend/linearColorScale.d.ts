/**
 * Linear Color Scale Legend
 *
 * Use for displaying the values of a continuous linear color scale.
 *
 * The ramp is drawn as a row of abutting segments, one per displayed value, with a rounded
 * cap at each end and a label outside each cap. Segments are stretched by a pixel in each
 * direction so that no antialiasing seam shows between them.
 *
 * @module sszvis/legend/linearColorScale
 *
 * @property {function} scale                   The scale to use to generate the legend
 * @property {array} displayValues              A list of specific values to display. If not specified, defaults to using scale.ticks
 * @property {number} width                     The pixel width of the legend (default 200).
 * @property {number} segments                  The number of segments to aim for. Note, this is only used if displayValues isn't specified,
 *                                              and then it is passed as the argument to scale.ticks for finding the ticks. (default)
 * @property {array} labelText                  Text or a text-returning function to use as the titles for the legend endpoints. If not supplied,
 *                                              defaults to using the first and last tick values.
 * @property {function} labelFormat             An optional formatter function for the end labels. Usually should be sszvis.formatNumber.
 */
import { type Component } from "../d3-component.js";
/** The subset of a d3 scale this legend relies on. */
interface LinearColorScale {
    (value: number): string;
    domain(): number[];
    ticks?(count?: number): number[];
}
type LabelFormatter = (value: unknown, index: number) => string | number;
export interface LinearColorScaleComponent extends Component {
    scale(): LinearColorScale;
    scale(scale: LinearColorScale): LinearColorScaleComponent;
    displayValues(): number[];
    displayValues(values: number[]): LinearColorScaleComponent;
    width(): number;
    width(width: number): LinearColorScaleComponent;
    segments(): number;
    segments(segments: number): LinearColorScaleComponent;
    labelText(): unknown[] | undefined;
    labelText(text: unknown[]): LinearColorScaleComponent;
    labelFormat(): LabelFormatter;
    labelFormat(format: LabelFormatter): LinearColorScaleComponent;
}
export default function (): LinearColorScaleComponent;
export {};
//# sourceMappingURL=linearColorScale.d.ts.map