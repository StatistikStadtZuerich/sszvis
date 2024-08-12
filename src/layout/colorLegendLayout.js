import { max, sum } from "d3";
import { scaleQual12, scaleQual6 } from "../color";
import {
  DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
  legendColorOrdinal,
} from "../legend/ordinalColorScale";
import { measureAxisLabel, measureDimensions, measureLegendLabel } from "../measure";

const DEFAULT_COLUMN_COUNT = 2;
const LABEL_PADDING = 40;

/**
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 */
export function colorLegendLayout(
  { legendLabels, axisLabels = [], slant = "horizontal" },
  container
) {
  const containerWidth = measureDimensions(container).width;
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
export function colorLegendDimensions(labels, containerWidth) {
  const labelCount = labels.length;
  const maxLabelWidth = max(labels, labelWidth);
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

function axisLabelHeight(slant, labels) {
  switch (slant) {
    case "vertical": {
      return 40 + max(labels, measureAxisLabel);
    }
    case "diagonal": {
      return 40 + Math.sqrt(2 * Math.pow(max(labels, measureAxisLabel) / 2, 2));
    }
    default: {
      return 60;
    }
  }
}

function labelWidth(label) {
  return measureLegendLabel(label) + LABEL_PADDING;
}

function numCols(totalWidth, columnWidth, num) {
  return num <= 1
    ? 1
    : columnWidth <= totalWidth / num
      ? num
      : numCols(totalWidth, columnWidth, num - 1);
}
