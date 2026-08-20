/**
 * Binned Color Scale Legend
 *
 * Use for displaying the values of discontinuous (binned) color scale's bins
 *
 * Each display value becomes the upper edge of a bin, and a final bin runs from the last
 * display value to the upper endpoint. Bins are floored onto whole pixels and widened by
 * their subpixel remainder so that no gap shows between them, which means adjacent bins
 * overlap very slightly.
 *
 * Every bin except the trailing one carries a tick line and a label beneath its upper
 * edge. The line is snapped to the half-pixel grid to stay crisp while the label is
 * placed on the raw edge, so the two can sit half a pixel apart.
 *
 * @module sszvis/legend/binnedColorScale
 *
 * @property {function} scale           A scale to use to generate the color values
 * @property {array} displayValues      An array of values which should be displayed. Usually these should be the bin edges
 * @property {array} endpoints          The endpoints of the scale (note that these are not necessarily the first and last
 *                                      bin edges). These will become labels at either end of the legend.
 * @property {number} width             The pixel width of the legend. Default 200
 * @property {function} labelFormat     A formatter function for the labels of the displayValues.
 *
 * @return {sszvis.component}
 */
import { type Component } from "../d3-component.js";
/** The subset of a d3 scale this legend relies on. */
type BinnedColorScale = (value: number) => string;
type BinLabelFormatter = (value: number) => string | number;
export interface BinnedColorScaleComponent extends Component {
    scale(): BinnedColorScale;
    scale(scale: BinnedColorScale): BinnedColorScaleComponent;
    displayValues(): number[];
    displayValues(values: number[]): BinnedColorScaleComponent;
    endpoints(): [number, number];
    endpoints(endpoints: [number, number]): BinnedColorScaleComponent;
    width(): number;
    width(width: number): BinnedColorScaleComponent;
    labelFormat(): BinLabelFormatter;
    labelFormat(format: BinLabelFormatter): BinnedColorScaleComponent;
}
export default function (): BinnedColorScaleComponent;
export {};
//# sourceMappingURL=binnedColorScale.d.ts.map