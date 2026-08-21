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
