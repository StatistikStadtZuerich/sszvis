import { type ExtendedOrdinalScale } from "../color.js";
import { type LegendOrientation, type OrdinalColorScaleComponent } from "../legend/ordinalColorScale.js";
import { type MeasurableElement } from "../measure.js";
/** How the axis labels below the legend are rotated. */
export type ColorLegendSlant = "horizontal" | "vertical" | "diagonal";
export type ColorLegendLayoutOptions = {
    legendLabels: string[];
    axisLabels?: string[];
    /** "vertical" and "diagonal" reserve room for rotated labels, "horizontal" (the default)
     * reserves a fixed 60px. Any other value throws. */
    slant?: ColorLegendSlant | null;
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
 * - axisLabelPadding is 60 for slant "horizontal", 40 + widest axis label for "vertical",
 *   and 40 + widest axis label / sqrt(2) for "diagonal". An omitted or null slant is
 *   horizontal; any other value throws.
 * - More labels than the chosen colour scale has colours is warned about, because a d3
 *   ordinal scale recycles its range rather than running out.
 * - A "vertical" or "diagonal" slant with no axisLabels reserves the 40px base padding
 *   and nothing for the labels themselves.
 * - A container that cannot be measured is warned about and treated as having no width.
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
 * - legendWidth is columns * widest label, or the width of the whole line for a floated
 *   legend, which is laid out on one line rather than in columns.
 * - An empty label list gives a zero legendWidth.
 * - A container of no width degrades to one column, one row per label.
 */
export declare function colorLegendDimensions(labels: string[], containerWidth: number): ColorLegendDimensions;
//# sourceMappingURL=colorLegendLayout.d.ts.map