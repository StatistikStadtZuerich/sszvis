/**
 * Stacked Bar component
 *
 * This component includes both the vertical and horizontal stacked bar chart components.
 * Both are constiations on the same concept, and they both use the same abstract intermediate
 * representation for the stack, but are rendered using different dimensions. Note that using
 * this component will add the properties 'y0' and 'y' to any passed-in data objects, as part of
 * computing the stack intermediate representation. Existing properties with these names will be
 * overwritten.
 *
 * @module sszvis/component/stackedBar/horizontal
 * @module sszvis/component/stackedBar/vertical
 *
 * @property {function} xAccessor           Specifies an x-accessor for the stack layout. The result of this function
 *                                          is used to compute the horizontal extent of each element in the stack.
 *                                          The return value must be a number.
 * @property {function} xScale              Specifies an x-scale for the stack layout. This scale is used to position
 *                                          the elements of each stack, both the left offset value and the width of each stack segment.
 * @property {number, function} width       Specifies a width for the bars in the stack layout. This value is not used in the
 *                                          horizontal orientation. (xScale is used instead).
 * @property {function} yAccessor           The y-accessor. The return values of this function are used to group elements together as stacks.
 * @property {function} yScale              A y-scale. After the stack is computed, the y-scale is used to position each stack.
 * @property {number, function} height      Specify the height of each rectangle. This value determines the height of each element in the stacks.
 * @property {string, function} fill        Specify a fill value for the rectangles (default black).
 * @property {string, function} stroke      Specify a stroke value for the stack rectangles (default none).
 * @property {string} orientation           Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart.
 *                                          Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.
 *
 * @return {sszvis.component}
 */

import { select, stack as d3Stack, stackOrderNone, stackOrderReverse, max } from "d3";

import * as fn from "../fn.js";
import { cascade } from "../cascade.js";
import bar from "./bar.js";
import { component } from "../d3-component.js";

const stackAcc = fn.prop("stack");

// Accessors for the first and second element of a tuple (2-element array).
const fst = fn.prop("0");
const snd = fn.prop("1");

function stackedBarData(order) {
  return function (_stackAcc, seriesAcc, valueAcc) {
    return function (data) {
      const rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);

      // Collect all keys ()
      const keys = rows.reduce((a, row) => fn.set([...a, ...Object.keys(row)]), []);

      const stacks = d3Stack()
        .keys(keys)
        .value((x, key) => valueAcc(x[key][0]))
        .order(order)(rows);

      // Simplify the 'data' property.
      for (const stack of stacks) {
        for (const d of stack) {
          d.series = stack.key;
          d.data = d.data[stack.key][0];
          d.stack = _stackAcc(d.data);
        }
      }

      stacks.keys = keys;

      stacks.maxValue = max(stacks, (stack) => max(stack, (d) => d[1]));

      return stacks;
    };
  };
}

export const stackedBarHorizontalData = stackedBarData(stackOrderNone);
export const stackedBarVerticalData = stackedBarData(stackOrderReverse);

function stackedBar(config) {
  return component()
    .prop("xScale", fn.functor)
    .prop("width", fn.functor)
    .prop("yScale", fn.functor)
    .prop("height", fn.functor)
    .prop("fill")
    .prop("stroke")
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      const barGen = bar()
        .x(config.x(props))
        .y(config.y(props))
        .width(config.width(props))
        .height(config.height(props))
        .fill(props.fill)
        .stroke(props.stroke || "#FFFFFF");

      const groups = selection
        .selectAll(".sszvis-stack")
        .data(data)
        .join("g")
        .classed("sszvis-stack", true);

      groups.call(barGen);
    });
}

const horizontalStackedBarConfig = {
  x(props) {
    return fn.compose(props.xScale, fst);
  },
  y(props) {
    return fn.compose(props.yScale, stackAcc);
  },
  width(props) {
    return function (d) {
      return props.xScale(d[1]) - props.xScale(d[0]);
    };
  },
  height(props) {
    return props.height;
  },
};
export const stackedBarHorizontal = function () {
  return stackedBar(horizontalStackedBarConfig);
};

const verticalStackedBarConfig = {
  x(props) {
    return fn.compose(props.xScale, stackAcc);
  },
  y(props) {
    return fn.compose(props.yScale, snd);
  },
  width(props) {
    return props.width;
  },
  height(props) {
    return function (d) {
      return props.yScale(d[0]) - props.yScale(d[1]);
    };
  },
};
export const stackedBarVertical = function () {
  return stackedBar(verticalStackedBarConfig);
};
