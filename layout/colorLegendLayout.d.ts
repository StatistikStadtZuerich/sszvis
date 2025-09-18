/**
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 */
export function colorLegendLayout({ legendLabels, axisLabels, slant }: {
    legendLabels: any;
    axisLabels?: never[] | undefined;
    slant?: string | undefined;
}, container: any): {
    axisLabelPadding: number;
    legendPadding: number;
    bottomPadding: number;
    legendWidth: number;
    legend: any;
    scale: import("../color").ExtendedOrdinalScale;
};
/**
 * colorLegendDimensions
 *
 * Compute all the dimensions necessary to generate an ordinal color legend.
 */
export function colorLegendDimensions(labels: any, containerWidth: any): {
    columns: any;
    rows: number;
    columnWidth: number | null | undefined;
    legendWidth: number;
    horizontalFloat: boolean;
    orientation: string | null;
};
//# sourceMappingURL=colorLegendLayout.d.ts.map