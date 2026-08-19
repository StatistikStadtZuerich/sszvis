/**
 * Line component
 *
 * The line component is a general-purpose component used to render lines.
 *
 * The input data should be an array of arrays, where each inner array
 * contains the data points necessary to render a line. The line is then
 * composed of x- and y- values extracted from these data objects
 * using the x and y accessor functions.
 *
 * Each data object in a line's array is passed to the x- and y- accessors, along with
 * that data object's index in the array. For more information, see the documentation for
 * d3.line.
 *
 * In addition, the user can specify stroke and strokeWidth accessor functions. Because these
 * functions apply properties to the entire line, when called, they are give the entire array of line data
 * as an argument, plus the index of that array of line data within the outer array of lines. Note that this
 * differs slightly from the usual case in that dimension-related accessor functions are given different
 * data than style-related accessor functions.
 *
 * @module sszvis/component/line
 *
 * @property {function} x                An accessor function for getting the x-value of the line
 * @property {function} y                An accessor function for getting the y-value of the line
 * @property {function} [defined]        The key function to be used for the data join
 * @property {function} [key]            The key function to be used for the data join
 * @property {function} [valuesAccessor] An accessor function for getting the data points array of the line
 * @property {string, function} [stroke] Either a string specifying the stroke color of the line or lines,
 *                                       or a function which, when passed the entire array representing the line,
 *                                       returns a value for the stroke. If left undefined, the stroke is black.
 * @property {string, function} [strokeWidth] Either a number specifying the stroke-width of the lines,
 *                                       or a function which, when passed the entire array representing the line,
 *                                       returns a value for the stroke-width. The default value is 1.
 *
 * @return {sszvis.component}
 */

import { line as d3Line, select, type ValueFn } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";

/**
 * Dimension accessors are handed to d3.line, which calls them with a single point, that
 * point's index within the line, and the array of points the line is drawn from.
 */
type PointAccessor<R> = (datum: unknown, index: number, points: unknown[]) => R;

/**
 * Style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole line and that line's index within the outer array - not with a single point.
 */
type LineAccessor<R> = (datum: unknown, index: number) => R;

/** Either a constant or an accessor; only stroke and strokeWidth accept both. */
type StyleValue<R> = R | LineAccessor<R>;

type LineProps = {
  x: number | PointAccessor<number>;
  y: PointAccessor<number>;
  defined?: PointAccessor<boolean>;
  key: LineAccessor<string | number>;
  valuesAccessor: (datum: unknown, index: number) => unknown[];
  stroke?: StyleValue<string>;
  strokeWidth?: StyleValue<number>;
  transition: boolean;
};

/**
 * A value passed to a setter. The parameters are `never[]` so that an accessor with any
 * signature is assignable - `unknown[]` would reject a typed accessor like
 * (d: Datum) => number.
 */
type LineValue<R> = (...args: never[]) => R;

export interface LineComponent extends Component {
  x(): number | PointAccessor<number> | undefined;
  x(value: number | LineValue<number>): LineComponent;
  y(): PointAccessor<number> | undefined;
  y(accessor: LineValue<number>): LineComponent;
  defined(): PointAccessor<boolean> | undefined;
  defined(predicate: LineValue<boolean>): LineComponent;
  key(): LineAccessor<string | number>;
  key(accessor: LineValue<string | number>): LineComponent;
  valuesAccessor(): (datum: unknown, index: number) => unknown[];
  valuesAccessor(accessor: LineValue<unknown[]>): LineComponent;
  stroke(): StyleValue<string> | undefined;
  stroke(value: string | LineValue<string>): LineComponent;
  strokeWidth(): StyleValue<number> | undefined;
  strokeWidth(value: number | LineValue<number>): LineComponent;
  transition(): boolean;
  transition(enabled: boolean): LineComponent;
}

/**
 * d3 takes either a constant or a value function, but not a union of the two, so a style
 * property is narrowed once before it reaches the selection. An unset property becomes a
 * function returning null, which d3 removes the style for - the same thing it does when
 * handed undefined directly.
 */
const styleValue = <R extends string | number>(
  value: StyleValue<R> | undefined
): ValueFn<SVGPathElement, unknown, R | null> =>
  typeof value === "function" ? value : () => value ?? null;

/**
 * Whether a value counts as missing, and so breaks the line at that point.
 *
 * Matches the global isNaN this replaced, which coerces its argument first. The coercion
 * is load-bearing: a bare Number.isNaN would let a non-numeric y through into the path.
 * Note that it only catches values that fail to coerce - null, Infinity, booleans and
 * numeric strings all become numbers and are plotted as data. See
 * test/component/line.test.ts.
 *
 * The one input where this differs from the global isNaN is a BigInt, which isNaN throws
 * on and this returns false for. It is not observable through the component: d3.line
 * immediately applies unary + to the value, which throws the identical TypeError.
 */
const isMissingVal = (value: unknown): boolean => Number.isNaN(Number(value));

export default function (): LineComponent {
  return component()
    .prop("x")
    .prop("y")
    .prop("stroke")
    .prop("strokeWidth")
    .prop("defined")
    .prop("key")
    .key((_datum: unknown, index: number) => index)
    .prop("valuesAccessor")
    .valuesAccessor(fn.identity)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: unknown[]) {
      const selection = select(this);
      const props = selection.props<LineProps>();

      // Layouts

      const defined: PointAccessor<boolean> =
        props.defined === undefined
          ? (datum, index, points) => !isMissingVal(props.y(datum, index, points))
          : props.defined;

      // d3 has separate overloads for a constant and an accessor, so a constant x is
      // normalised here. d3 would wrap it in exactly the same way.
      const xProp = props.x;
      const x: PointAccessor<number> = typeof xProp === "function" ? xProp : () => xProp;

      const line = d3Line<unknown>().defined(defined).x(x).y(props.y);

      // Rendering

      // Declared with `function` so that `this` is still forwarded to valuesAccessor, as
      // it was when this was built with fn.compose.
      const pathData: ValueFn<SVGPathElement, unknown, string | null> = function (datum, index) {
        return line(props.valuesAccessor.call(this, datum, index));
      };
      const stroke = styleValue(props.stroke);
      const strokeWidth = styleValue(props.strokeWidth);

      const path = selection
        .selectAll<SVGPathElement, unknown>(".sszvis-line")
        .data(data, props.key)
        .join("path")
        .classed("sszvis-line", true)
        .style("stroke", stroke);

      path.order();

      // The visual properties are applied to the transition when there is one, so the two
      // branches are spelled out rather than sharing a variable - a d3 transition and a
      // d3 selection have separate types.
      if (props.transition) {
        path
          .transition(defaultTransition())
          .attr("d", pathData)
          .style("stroke", stroke)
          .style("stroke-width", strokeWidth);
      } else {
        path.attr("d", pathData).style("stroke", stroke).style("stroke-width", strokeWidth);
      }
    });
}
