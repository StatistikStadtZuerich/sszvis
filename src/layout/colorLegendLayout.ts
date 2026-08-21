import { max, sum } from "d3";
import { type ExtendedOrdinalScale, scaleQual6, scaleQual12 } from "../color";
import {
  DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
  type LegendOrientation,
  legendColorOrdinal,
  type OrdinalColorScaleComponent,
} from "../legend/ordinalColorScale";
import {
  type MeasurableElement,
  measureAxisLabel,
  measureDimensions,
  measureLegendLabel,
} from "../measure";

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

const DEFAULT_COLUMN_COUNT = 2;
const LABEL_PADDING = 40;

/**
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 */
export function colorLegendLayout(
  { legendLabels, axisLabels = [], slant = "horizontal" }: ColorLegendLayoutOptions,
  container: MeasurableElement
): ColorLegendLayout {
  // an unmeasurable container yields undefined; NaN keeps every comparison below false
  const containerWidth = measureDimensions(container).width ?? Number.NaN;
  const layout = colorLegendDimensions(legendLabels, containerWidth);
  const scale =
    legendLabels.length > 6
      ? scaleQual12().domain(legendLabels)
      : scaleQual6().domain(legendLabels);

  const legend = legendColorOrdinal()
    .scale(scale)
    .horizontalFloat(layout.horizontalFloat)
    .rows(layout.rows)
    .columnWidth(layout.columnWidth)
    .orientation(layout.orientation);

  const axisLabelPadding = axisLabelHeight(slant, axisLabels);
  const legendPadding = layout.rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;

  return {
    axisLabelPadding,
    legendPadding,
    bottomPadding: axisLabelPadding + legendPadding,
    legendWidth: layout.legendWidth,
    legend,
    scale,
  };
}

/**
 * colorLegendDimensions
 *
 * Compute all the dimensions necessary to generate an ordinal color legend.
 */
export function colorLegendDimensions(
  labels: string[],
  containerWidth: number
): ColorLegendDimensions {
  const labelCount = labels.length;
  // d3.max is undefined for an empty label list; NaN propagates the same way
  const maxLabelWidth = max(labels, labelWidth) ?? Number.NaN;
  const totalLabelsWidth = sum(labels, labelWidth);

  // Use a single column for four or fewer items
  const columns =
    labelCount <= 4 ? 1 : numCols(containerWidth, maxLabelWidth, DEFAULT_COLUMN_COUNT);

  // Use a horizontal layout if all labels fit on one line
  const isHorizontal = columns === 1 && totalLabelsWidth <= containerWidth;

  return {
    columns,
    rows: isHorizontal ? 1 : Math.ceil(labelCount / columns),
    columnWidth: columns === 1 ? null : maxLabelWidth,
    legendWidth: columns * maxLabelWidth,
    horizontalFloat: isHorizontal,
    orientation: isHorizontal ? null : "vertical",
  };
}

// -----------------------------------------------------------------------------
// Helpers

function axisLabelHeight(slant: string, labels: string[]): number {
  switch (slant) {
    case "vertical": {
      return 40 + (max(labels, measureAxisLabel) ?? Number.NaN);
    }
    case "diagonal": {
      return 40 + Math.sqrt(2 * ((max(labels, measureAxisLabel) ?? Number.NaN) / 2) ** 2);
    }
    default: {
      return 60;
    }
  }
}

function labelWidth(label: string): number {
  return measureLegendLabel(label) + LABEL_PADDING;
}

function numCols(totalWidth: number, columnWidth: number, num: number): number {
  if (num <= 1) return 1;
  return columnWidth <= totalWidth / num ? num : numCols(totalWidth, columnWidth, num - 1);
}
