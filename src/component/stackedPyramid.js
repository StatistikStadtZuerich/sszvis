/**
 * Stacked Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at it's spine, i.e. the center of
 * the chart.
 *
 * @module sszvis/component/stackedPyramid
 *
 * @requires sszvis.component.bar
 *
 * @property {number, d3.scale} [barFill]          The color of a bar
 * @property {number, d3.scale} barHeight          The height of a bar
 * @property {number, d3.scale} barWidth           The width of a bar
 * @property {number, d3.scale} barPosition        The vertical position of a bar
 * @property {Array<number, number>} tooltipAnchor The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars
 * @property {function}         leftAccessor       Data for the left side
 * @property {function}         rightAccessor      Data for the right side
 * @property {function}         [leftRefAccessor]  Reference data for the left side
 * @property {function}         [rightRefAccessor] Reference data for the right side
 *
 * @return {sszvis.component}
 */

import { select, stack as d3Stack, line as d3Line, max } from "d3";

import * as fn from "../fn.js";
import { cascade } from "../cascade.js";
import { defaultTransition } from "../transition.js";
import bar from "./bar.js";
import { component } from "../d3-component.js";

/* Constants
----------------------------------------------- */
var SPINE_PADDING = 0.5;

var dataAcc = fn.prop("data");
var rowAcc = fn.prop("row");

/**
 * This function prepares the data for the stackedPyramid component
 *
 * The input data is expected to have at least four columns:
 *
 *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
 *  - row: determines on which row (vertical position) the value goes.
 *  - series: determines in which series (for the stack) the value is.
 *  - value: the numerical value.
 *
 * The combination of each distinct (side,row,series) triplet MUST appear only once
 * in the data. This function makes no effort to normalize the data if that's not the case.
 */
export function stackedPyramidData(sideAcc, _rowAcc, seriesAcc, valueAcc) {
  return function (data) {
    var sides = cascade()
      .arrayBy(sideAcc)
      .arrayBy(_rowAcc)
      .objectBy(seriesAcc)
      .apply(data)
      .map(function (rows) {
        var keys = Object.keys(rows[0]);
        var side = sideAcc(rows[0][keys[0]][0]);

        var stacks = d3Stack()
          .keys(keys)
          .value(function (x, key) {
            return valueAcc(x[key][0]);
          })(rows);

        stacks.forEach(function (stack, i) {
          stack.forEach(function (d, row) {
            d.data = d.data[keys[i]][0];
            d.series = keys[i];
            d.side = side;
            d.row = row;
            d.value = valueAcc(d.data);
            return d;
          });
        });

        return stacks;
      });

    // Compute the max value, for convenience. This value is needed to construct
    // the horizontal scale.
    sides.maxValue = max(sides, function (side) {
      return max(side, function (rows) {
        return max(rows, function (row) {
          return row[1];
        });
      });
    });

    return sides;
  };
}

/* Module
----------------------------------------------- */
export function stackedPyramid() {
  return component()
    .prop("barHeight", fn.functor)
    .prop("barWidth", fn.functor)
    .prop("barPosition", fn.functor)
    .prop("barFill", fn.functor)
    .barFill("#000")
    .prop("tooltipAnchor")
    .tooltipAnchor([0.5, 0.5])
    .prop("leftAccessor")
    .prop("rightAccessor")
    .prop("leftRefAccessor")
    .prop("rightRefAccessor")
    .render(function (data) {
      var selection = select(this);
      var props = selection.props();

      // Components

      var leftBar = bar()
        .x(function (d) {
          return -SPINE_PADDING - props.barWidth(d[1]);
        })
        .y(fn.compose(props.barPosition, rowAcc))
        .height(props.barHeight)
        .width(function (d) {
          return props.barWidth(d[1]) - props.barWidth(d[0]);
        })
        .fill(fn.compose(props.barFill, dataAcc))
        .tooltipAnchor(props.tooltipAnchor);

      var rightBar = bar()
        .x(function (d) {
          return SPINE_PADDING + props.barWidth(d[0]);
        })
        .y(fn.compose(props.barPosition, rowAcc))
        .height(props.barHeight)
        .width(function (d) {
          return props.barWidth(d[1]) - props.barWidth(d[0]);
        })
        .fill(fn.compose(props.barFill, dataAcc))
        .tooltipAnchor(props.tooltipAnchor);

      var leftStack = stackComponent().stackElement(leftBar);

      var rightStack = stackComponent().stackElement(rightBar);

      var leftLine = lineComponent()
        .barPosition(props.barPosition)
        .barWidth(props.barWidth)
        .mirror(true);

      var rightLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth);

      // Rendering

      selection.selectGroup("leftStack").datum(props.leftAccessor(data)).call(leftStack);

      selection.selectGroup("rightStack").datum(props.rightAccessor(data)).call(rightStack);

      selection
        .selectGroup("leftReference")
        .datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : [])
        .call(leftLine);

      selection
        .selectGroup("rightReference")
        .datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : [])
        .call(rightLine);
    });
}

function stackComponent() {
  return component()
    .prop("stackElement")
    .renderSelection(function (selection) {
      var datum = selection.datum();
      var props = selection.props();

      var stack = selection.selectAll("[data-sszvis-stack]").data(datum);

      var newStack = stack.enter().append("g").attr("data-sszvis-stack", "");

      stack.exit().remove();

      stack = stack.merge(newStack);

      stack.each(function (d) {
        select(this).datum(d).call(props.stackElement);
      });
    });
}

function lineComponent() {
  return component()
    .prop("barPosition")
    .prop("barWidth")
    .prop("mirror")
    .mirror(false)
    .render(function (data) {
      var selection = select(this);
      var props = selection.props();

      var lineGen = d3Line().x(props.barWidth).y(props.barPosition);

      var line = selection.selectAll(".sszvis-path").data(data);

      line.exit().remove();

      var newLine = line
        .enter()
        .append("path")
        .attr("class", "sszvis-path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3 3");

      line = line.merge(newLine);

      line
        .attr("transform", props.mirror ? "scale(-1, 1)" : "")
        .transition(defaultTransition())
        .attr("d", lineGen);
    });
}
