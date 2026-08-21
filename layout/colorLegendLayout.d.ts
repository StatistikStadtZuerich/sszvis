import { type ExtendedOrdinalScale } from "../color";
import { type LegendOrientation, type OrdinalColorScaleComponent } from "../legend/ordinalColorScale";
import { type MeasurableElement } from "../measure";
export type ColorLegendLayoutOptions = {
    legendLabels: string[];
    axisLabels?: string[];
    /** "vertical" and "diagonal" reserve room for rotated labels; anything else, including an
     * unrecognised value, is treated as horizontal. */
    slant?: string;
};
export type ColorLegendLayout = {
    axisLabelPadding: number;
    legendPadding: number;
    bottomPadding: number;
    legendWidth: number;
    legend: OrdinalColorScaleComponent<string>;
    scale: ExtendedOrdinalScale;
};
export type ColorLegendDimensions = {
    columns: number;
    rows: number;
    columnWidth: number | null;
    legendWidth: number;
    horizontalFloat: boolean;
    orientation: LegendOrientation | null;
};
/**
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 *
 * Behaviour notes:
 * - scaleQual6 is used up to six labels, scaleQual12 above six; colours repeat
 *   silently beyond twelve labels.
 * - axisLabelPadding is 60 for slant "horizontal" (and for any unrecognised slant),
 *   40 + widest axis label for "vertical", and 40 + widest axis label / sqrt(2) for
 *   "diagonal".
 * - A "vertical" or "diagonal" slant with no axisLabels gives NaN, which propagates
 *   into bottomPadding and thus into sszvis.bounds().
 * - legendPadding is rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT.
 */
export declare function colorLegendLayout({ legendLabels, axisLabels, slant }: ColorLegendLayoutOptions, container: MeasurableElement): ColorLegendLayout;
/**
 * colorLegendDimensions
 *
 * Compute all the dimensions necessary to generate an ordinal color legend.
 *
 * Behaviour notes:
 * - Single column for four or fewer labels; otherwise at most two columns
 *   (numCols only counts down from DEFAULT_COLUMN_COUNT = 2).
 * - Horizontal float only when there is one column AND all labels fit on one line.
 * - Each label is padded by 40px.
 * - columnWidth is null for a single column.
 * - legendWidth is columns * widest label, so for a floated legend it under-reports
 *   the actual line width.
 * - An empty label list gives legendWidth NaN.
 * - An unmeasurable container (width 0 or undefined) silently degrades to one
 *   column, one row per label.
 */
export declare function colorLegendDimensions(labels: string[], containerWidth: number): ColorLegendDimensions;
//# sourceMappingURL=colorLegendLayout.d.ts.map