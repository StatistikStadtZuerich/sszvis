import * as d3 from "d3";
import {
  DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT,
  legendColorOrdinal
} from "../legend/ordinalColorScale";
import { measureDimensions, measureLegendLabel } from "../measure";

var DEFAULT_COLUMN_COUNT = 2;
var LABEL_PADDING = 40;

/**
 * legendColorOrdinalLayout
 *
 * Compute the width, height, and column count of a legend based on the labels
 * that should fit in it.
 *
 * @param {options} { scale: OrdinalScale<string>, columnCount?: number, rowHeight?: number }
 * @param  {string|DOMElement|d3.selection} el The element to measure
 * @returns { columns: number, rows: number, height: number, width: number, columnWidth: number }
 */
export function legendColorOrdinalLayout(options, container) {
  var labels = options.scale.domain();
  var width = measureDimensions(container).width;
  var labelWidths = labels.map(function(d) {
    return measureLegendLabel(d) + LABEL_PADDING;
  });
  var maxLabelWidth = d3.max(labelWidths);
  var labelCount = labels.length;

  // Use a single column for four or fewer items
  var columnCount = labelCount <= 4 ? 1 : options.columnCount || DEFAULT_COLUMN_COUNT;
  var columns = numCols(width, maxLabelWidth, columnCount);

  // Use a horizontal layout if all labels fit on one line
  var isHorizontal =
    options.columnCount == null && columnCount === 1 && d3.sum(labelWidths) <= width;

  var rows = isHorizontal ? 1 : Math.ceil(labelCount / columns);
  var rowHeight =
    options.rowHeight != null ? options.rowHeight : DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;

  var legend = legendColorOrdinal()
    .scale(options.scale)
    .horizontalFloat(isHorizontal)
    .rows(isHorizontal ? null : rows)
    .columnWidth(isHorizontal ? null : maxLabelWidth)
    .orientation(isHorizontal ? null : "vertical");

  return {
    legend: legend,
    height: rows * rowHeight,
    width: width
  };
}

// -----------------------------------------------------------------------------
// Helpers

function numCols(totalWidth, columnWidth, num) {
  return num <= 1
    ? 1
    : columnWidth <= totalWidth / num
    ? num
    : numCols(totalWidth, columnWidth, num - 1);
}
