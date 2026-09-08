import { max, sum } from 'd3';
import { scaleQual12, scaleQual6 } from '../color.js';
import legendColorOrdinal, { DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT } from '../legend/ordinalColorScale.js';
import { warn } from '../logger.js';
import { measureDimensions, measureAxisLabel, measureLegendLabel } from '../measure.js';

/**
 * Color Legend Layout
 *
 * Sizes an ordinal color legend to the available width: it picks the number of
 * rows and columns, the label slant, and the bottom padding the chart needs to
 * leave for it.
 *
 * @module sszvis/layout/colorLegendLayout
 */
const SLANTS = ["horizontal", "vertical", "diagonal"];
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
function colorLegendLayout(_ref, container) {
  let {
    legendLabels,
    axisLabels = [],
    slant
  } = _ref;
  // an omitted slant - null included, as the docs examples pass it - is horizontal
  const resolvedSlant = slant !== null && slant !== void 0 ? slant : "horizontal";
  if (!SLANTS.includes(resolvedSlant)) {
    throw new RangeError("colorLegendLayout: slant must be one of ".concat(SLANTS.join(", "), ", got ").concat(slant));
  }
  const measuredWidth = measureDimensions(container).width;
  if (!measuredWidth) {
    warn("colorLegendLayout could not measure its container, and is laying the legend out as if it had no width:", container);
  }
  const containerWidth = measuredWidth !== null && measuredWidth !== void 0 ? measuredWidth : 0;
  const layout = colorLegendDimensions(legendLabels, containerWidth);
  const scale = legendLabels.length > 6 ? scaleQual12().domain(legendLabels) : scaleQual6().domain(legendLabels);
  if (legendLabels.length > scale.range().length) {
    warn("colorLegendLayout: ".concat(legendLabels.length, " labels share the ").concat(scale.range().length, " colours of this scale, so some categories are drawn in the same colour"));
  }
  const legend = legendColorOrdinal().scale(scale).horizontalFloat(layout.horizontalFloat).rows(layout.rows).columnWidth(layout.columnWidth).orientation(layout.orientation);
  const axisLabelPadding = axisLabelHeight(resolvedSlant, axisLabels);
  const legendPadding = layout.rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;
  return {
    axisLabelPadding,
    legendPadding,
    bottomPadding: axisLabelPadding + legendPadding,
    legendWidth: layout.legendWidth,
    legend,
    scale
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
 * - legendWidth is columns * widest label, or the width of the whole line for a floated
 *   legend, which is laid out on one line rather than in columns.
 * - An empty label list gives a zero legendWidth.
 * - A container of no width degrades to one column, one row per label.
 */
function colorLegendDimensions(labels, containerWidth) {
  var _max;
  const labelCount = labels.length;
  // an empty legend has no labels to be as wide as
  const maxLabelWidth = (_max = max(labels, labelWidth)) !== null && _max !== void 0 ? _max : 0;
  const totalLabelsWidth = sum(labels, labelWidth);
  // Use a single column for four or fewer items
  const columns = labelCount <= 4 ? 1 : numCols(containerWidth, maxLabelWidth, DEFAULT_COLUMN_COUNT);
  // Use a horizontal layout if all labels fit on one line
  const isHorizontal = columns === 1 && totalLabelsWidth <= containerWidth;
  return {
    columns,
    rows: isHorizontal ? 1 : Math.ceil(labelCount / columns),
    columnWidth: columns === 1 ? null : maxLabelWidth,
    // a floated legend is one line of labels, not a column of the widest one
    legendWidth: isHorizontal ? totalLabelsWidth : columns * maxLabelWidth,
    horizontalFloat: isHorizontal,
    orientation: isHorizontal ? null : "vertical"
  };
}
// -----------------------------------------------------------------------------
// Helpers
function axisLabelHeight(slant, labels) {
  switch (slant) {
    case "vertical":
      {
        var _max2;
        return 40 + ((_max2 = max(labels, measureAxisLabel)) !== null && _max2 !== void 0 ? _max2 : 0);
      }
    case "diagonal":
      {
        var _max3;
        return 40 + Math.sqrt(2 * (((_max3 = max(labels, measureAxisLabel)) !== null && _max3 !== void 0 ? _max3 : 0) / 2) ** 2);
      }
    default:
      {
        return 60;
      }
  }
}
function labelWidth(label) {
  return measureLegendLabel(label) + LABEL_PADDING;
}
function numCols(totalWidth, columnWidth, num) {
  if (num <= 1) return 1;
  return columnWidth <= totalWidth / num ? num : numCols(totalWidth, columnWidth, num - 1);
}

export { colorLegendDimensions, colorLegendLayout };
//# sourceMappingURL=colorLegendLayout.js.map
