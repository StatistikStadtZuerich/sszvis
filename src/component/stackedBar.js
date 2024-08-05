/**
 * Stacked Bar component
 *
 * This component includes both the vertical and horizontal stacked bar chart components.
 * Both are variations on the same concept, and they both use the same abstract intermediate
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

import { select } from "d3-selection";
import { stack as d3Stack, stackOrderNone, stackOrderReverse } from "d3-shape";
import { max } from "d3-array";

import * as fn from "../fn.js";
import { cascade } from "../cascade.js";
import bar from "./bar.js";
import { component } from "../d3-component.js";

var stackAcc = fn.prop("stack");

// Accessors for the first and second element of a tuple (2-element array).
var fst = fn.prop("0");
var snd = fn.prop("1");

function stackedBarData(order) {
  return function (_stackAcc, seriesAcc, valueAcc) {
    return function (data) {
      var rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);

      // Collect all keys ()
      var keys = rows.reduce(function (a, row) {
        return fn.set(a.concat(Object.keys(row)));
      }, []);

      var stacks = d3Stack()
        .keys(keys)
        .value(function (x, key) {
          return valueAcc(x[key][0]);
        })
        .order(order)(rows);

      // Simplify the 'data' property.
      stacks.forEach(function (stack) {
        stack.forEach(function (d) {
          d.series = stack.key;
          d.data = d.data[stack.key][0];
          d.stack = _stackAcc(d.data);
        });
      });

      stacks.keys = keys;

      stacks.maxValue = max(stacks, function (stack) {
        return max(stack, function (d) {
          return d[1];
        });
      });

      return stacks;
    };
  };
}

export var stackedBarHorizontalData = stackedBarData(stackOrderNone);
export var stackedBarVerticalData = stackedBarData(stackOrderReverse);

function stackedBar(config) {
  return component()
    .prop("xScale", fn.functor)
    .prop("width", fn.functor)
    .prop("yScale", fn.functor)
    .prop("height", fn.functor)
    .prop("fill")
    .prop("stroke")
    .render(function (data) {
      var selection = select(this);
      var props = selection.props();

      var barGen = bar()
        .x(config.x(props))
        .y(config.y(props))
        .width(config.width(props))
        .height(config.height(props))
        .fill(props.fill)
        .stroke(props.stroke || "#FFFFFF");

      var groups = selection.selectAll(".sszvis-stack").data(data);

      var newGroups = groups.enter().append("g").classed("sszvis-stack", true);

      groups.exit().remove();

      groups = groups.merge(newGroups);

      groups.call(barGen);
    });
}

var horizontalStackedBarConfig = {
  x: function (props) {
    return fn.compose(props.xScale, fst);
  },
  y: function (props) {
    return fn.compose(props.yScale, stackAcc);
  },
  width: function (props) {
    return function (d) {
      return props.xScale(d[1]) - props.xScale(d[0]);
    };
  },
  height: function (props) {
    return props.height;
  },
};
export var stackedBarHorizontal = function () {
  return stackedBar(horizontalStackedBarConfig);
};

var verticalStackedBarConfig = {
  x: function (props) {
    return fn.compose(props.xScale, stackAcc);
  },
  y: function (props) {
    return fn.compose(props.yScale, snd);
  },
  width: function (props) {
    return props.width;
  },
  height: function (props) {
    return function (d) {
      return props.yScale(d[0]) - props.yScale(d[1]);
    };
  },
};
export var stackedBarVertical = function () {
  return stackedBar(verticalStackedBarConfig);
};
