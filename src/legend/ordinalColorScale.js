/**
 * Ordinal Color Scale Legend
 *
 * This component is used for creating a legend for a categorical color scale.
 *
 * @module sszvis/legend/ordinalColorScale
 *
 * @property {d3.scaleOrdinal()} scale         An ordinal scale which will be transformed into the legend.
 * @property {Number} rowHeight                 The height of the rows of the legend.
 * @property {Number} columnWidth               The width of the columns of the legend.
 * @property {Number} rows                      The target number of rows for the legend.
 * @property {Number} columns                    The target number of columns for the legend.
 * @property {String} orientation               The orientation (layout order) of the legend. should be either "horizontal" or "vertical". No default.
 * @property {Boolean} reverse                  Whether to reverse the order that categories appear in the legend. Default false
 * @property {Boolean} rightAlign               Whether to right-align the legend. Default false.
 * @property {Boolean} horizontalFloat          A true value changes the legend layout to the horizontal float version. Default false.
 * @property {Number} floatPadding              The amount of padding between elements in the horizontal float layout. Default 10px
 * @property {Number} floatWidth                The maximum width of the horizontal float layout. Default 600px
 *
 * The color legend works by iterating over the domain of the provided scale, and generating a legend entry for each
 * element in the domain. The entry consists of a label giving the category, and a circle colored with the category's
 * corresponding color. When props.rightAlign is false (the default), the circle comes before the name. When rightAlign
 * is true, the circle comes afterwards. The layout of these labels is governed by the other parameters.
 *
 * Default Layout:
 *
 * Because the labels are svg elements positioned with translate (and do not use the html box model layout algorithm),
 * rowHeight is necessary to provide the vertical height of each row. Generally speaking, 20px is fine for the default text size.
 * In the default layout, labels are organized into rows and columns in a gridded fashion. columnWidth is the total width of
 * any resulting columns. Note that if there is only one column, columnWidth is irrelevant.
 *
 * There are two orientation options for the row/column layout. The 'horizontal' orientation lays out elements from the input
 * domain into rows, creating new rows as necessary. For example, with three columns, the first three elements will form
 * the top row, then the next three in the second row, and so on. With 'vertical' orientation, labels are stacked into a column,
 * and new columns are added as necessary to hold all of the elements. Therefore, in the 'horizontal' orientation, the number of columns
 * is key, as this determines when a row ends and a new row begins. In the 'vertical' layout, the number of rows determines when to start
 * a new column.
 *
 * For the input set { A, B, C, D, E, F, G }
 *
 * Horizontal Orientation (3 columns):
 *
 *      A    B    C
 *      D    E    F
 *      G
 *
 * Horizontal Orientation (2 columns):
 *
 *     A    B
 *     C    D
 *     E    F
 *     G
 *
 * Vertical Orientation (3 rows):
 *
 *      A    D    G
 *      B    E
 *      C    F
 *
 * Vertical Orientation (2 rows):
 *
 *      A    C    E    G
 *      B    D    F
 *
 * If reverse is true, items from the input domain will be added to the layout in reversed order.
 *
 * For example, Horizontal Orientation (4 columns, reverse = true):
 *
 *    G    F    E    D
 *    C    B    A
 *
 * Horizontal Float Layout:
 *
 * If horizontalFloat is true, a different layout entirely is used, which relies on the width of each element
 * to compute the position of the next one. This layout always proceeds left-to-right first, then top-to-bottom
 * if the floatWidth would be exceeded by a new element. Between each element is an amount of padding configurable
 * using the floatPadding property.
 *
 * For the input set { foo, bar, qux, fooBar, baz, fooBarBaz, fooBaz, barFoo }
 *
 * Horizontal Float Layout (within a floatWidth identified by vertical pipes,
 * with 4 spaces of floatPadding).
 *
 * |foo    bar    qux|
 * |fooBar    baz    |      <--- not enough space for fooBarBaz
 * |fooBarBaz        |      <--- not enough space for padding + fooBaz
 * |fooBaz    barFoo |
 */

import { select } from "d3";
import { component } from "../d3-component.js";
import { halfPixel } from "../svgUtils/crisp.js";
import translateString from "../svgUtils/translateString.js";

export var DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = 21;

export function legendColorOrdinal() {
  return component()
    .prop("scale")
    .prop("rowHeight")
    .rowHeight(DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT)
    .prop("columnWidth")
    .columnWidth(200)
    .prop("rows")
    .rows(3)
    .prop("columns")
    .columns(3)
    .prop("verticallyCentered")
    .verticallyCentered(false)
    .prop("orientation")
    .prop("reverse")
    .reverse(false)
    .prop("rightAlign")
    .rightAlign(false)
    .prop("horizontalFloat")
    .horizontalFloat(false)
    .prop("floatPadding")
    .floatPadding(20)
    .prop("floatWidth")
    .floatWidth(600)
    .render(function () {
      var selection = select(this);
      var props = selection.props();

      var domain = props.scale.domain();

      if (props.reverse) {
        domain = [...domain].reverse();
      }

      var rows, cols;
      if (props.orientation === "horizontal") {
        cols = Math.ceil(props.columns);
        rows = Math.ceil(domain.length / cols);
      } else if (props.orientation === "vertical") {
        rows = Math.ceil(props.rows);
        cols = Math.ceil(domain.length / rows);
      }

      var groups = selection.selectAll(".sszvis-legend--entry").data(domain);

      var newGroups = groups.enter().append("g").classed("sszvis-legend--entry", true);

      groups.exit().remove();

      var marks = groups
        .merge(newGroups)
        .selectAll(".sszvis-legend__mark")
        .data((d) => [d]);

      var newMarks = marks.enter().append("circle").classed("sszvis-legend__mark", true);

      marks.exit().remove();

      marks
        .merge(newMarks)
        .attr("cx", props.rightAlign ? -6 : 6)
        .attr("cy", halfPixel(props.rowHeight / 2))
        .attr("r", 5)
        .attr("fill", (d) => props.scale(d))
        .attr("stroke", (d) => props.scale(d))
        .attr("stroke-width", 1);

      var labels = groups
        .merge(newGroups)
        .selectAll(".sszvis-legend__label")
        .data((d) => [d]);

      var newLabels = labels.enter().append("text").classed("sszvis-legend__label", true);

      labels.exit().remove();

      labels
        .merge(newLabels)
        .text((d) => d)
        .attr("dy", "0.35em") // vertically-center
        .style("text-anchor", () => (props.rightAlign ? "end" : "start"))
        .attr("transform", () => {
          var x = props.rightAlign ? -18 : 18;
          var y = halfPixel(props.rowHeight / 2);
          return translateString(x, y);
        });

      var verticalOffset = "";
      if (props.verticallyCentered) {
        verticalOffset = "translate(0," + String(-((domain.length * props.rowHeight) / 2)) + ") ";
      }

      if (props.horizontalFloat) {
        var rowPosition = 0,
          horizontalPosition = 0;
        groups.merge(newGroups).attr("transform", function () {
          // not affected by scroll position
          var width = this.getBoundingClientRect().width;
          if (horizontalPosition + width > props.floatWidth) {
            rowPosition += props.rowHeight;
            horizontalPosition = 0;
          }
          var translate = translateString(horizontalPosition, rowPosition);
          horizontalPosition += width + props.floatPadding;
          return verticalOffset + translate;
        });
      } else {
        groups.merge(newGroups).attr("transform", (d, i) => {
          if (props.orientation === "horizontal") {
            return (
              verticalOffset +
              "translate(" +
              (i % cols) * props.columnWidth +
              "," +
              Math.floor(i / cols) * props.rowHeight +
              ")"
            );
          } else if (props.orientation === "vertical") {
            return (
              verticalOffset +
              "translate(" +
              Math.floor(i / rows) * props.columnWidth +
              "," +
              (i % rows) * props.rowHeight +
              ")"
            );
          }
        });
      }
    });
}
