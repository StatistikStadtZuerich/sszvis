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
 * functions apply properties to the entire line, when called, they are given the datum for the
 * whole line, plus the index of that line within the outer array of lines. Note that this
 * differs slightly from the usual case in that dimension-related accessor functions are given different
 * data than style-related accessor functions. When valuesAccessor is set, the style accessors
 * receive the wrapper object rather than the array of points - valuesAccessor is applied only on
 * the way into d3.line.
 *
 * @module sszvis/component/line
 *
 * @template P The type of one point along a line
 * @template L The type of the datum for a whole line
 *
 * @property {number, function} x       An accessor function for getting the x-value of the line, in
 *                                       pixels, or a constant. Becomes a functor. Required: leaving it
 *                                       unset throws before anything is rendered.
 * @property {number, function} y        An accessor function for getting the y-value of the line, in
 *                                       pixels, or a constant. Becomes a functor. Required, like x.
 * @property {function} [defined]        A per-point predicate handed to d3.line, deciding whether a point is
 *                                       drawn. Defaults to skipping points whose x or y is missing. It
 *                                       replaces that default rather than composing with it, so setting it
 *                                       gives up the missing-value guard.
 * @property {function} [key]            The key function to be used for the data join. Defaults to the index,
 *                                       which matches lines by position.
 * @property {function} [valuesAccessor] An accessor function for getting the data points array of the line
 * @property {string, function} [stroke] Either a string specifying the stroke color of the line or lines,
 *                                       or a function which, when passed the datum for the line,
 *                                       returns a value for the stroke. If left undefined no stroke is set at
 *                                       all, and since the SVG initial value is none the line renders
 *                                       invisibly - every chart is expected to set this.
 * @property {number, function} [strokeWidth] Either a number specifying the stroke-width of the lines,
 *                                       or a function which, when passed the datum for the line,
 *                                       returns a value for the stroke-width. If left undefined the component
 *                                       sets nothing, and the 1.1 in the .sszvis-line rule of sszvis.css
 *                                       applies.
 * @property {boolean} transition        Whether to transition the line when its values change. Defaults to
 *                                       true.
 *
 * Note: stroke and strokeWidth are written as inline styles, where bar and dot write their colours as
 * attributes. An inline style outranks a stylesheet rule, so a theme can restyle a bar but never a line.
 *
 * Note: with transition enabled, the d attribute and stroke-width are only written through the
 * transition, so a freshly rendered line has an empty path element until the first animation frame
 * runs. Anything measuring the path synchronously - getTotalLength, a bounding box, a screenshot -
 * sees nothing. Entering lines also snap rather than animate, because d3 has no previous d value to
 * interpolate from; only updates animate. See test/component/line.test.ts.
 *
 * Note: the default missing-value guard inspects both dimensions, but only catches values that fail
 * to coerce to a number. Infinity, which a scale over a zero-width domain produces, still reaches the
 * d attribute verbatim; the browser then renders up to that segment and silently drops the rest of
 * the series. A null likewise coerces to 0 and is plotted as data rather than breaking the line.
 *
 * @return {sszvis.component}
 */

import { line as d3Line, select, type ValueFn } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition, OWN_TRANSITION } from "../transition.js";

/**
 * Dimension accessors are handed to d3.line, which calls them with a single point, that
 * point's index within the line, and the array of points the line is drawn from.
 */
type PointAccessor<P, R> = (datum: P, index: number, points: P[]) => R;

/**
 * How x and y read back once they are stored. Every parameter is optional because a constant
 * handed to either of them becomes a functor that ignores its arguments; one of these is
 * still assignable to a setter, so a value read from a getter can be handed straight back.
 */
type StoredPointAccessor<P, R> = (datum?: P, index?: number, points?: P[]) => R;

/**
 * Style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole line and that line's index within the outer array - not with a single point.
 */
type LineAccessor<L, R> = (datum: L, index: number) => R;

/** Either a constant or an accessor; only stroke and strokeWidth accept both. */
type StyleValue<L, R> = R | LineAccessor<L, R>;

/** Pulls the array of points to draw out of one line's datum. */
type ValuesAccessor<L, P> = (datum: L, index: number) => P[];

type LineProps<P, L> = {
  x: StoredPointAccessor<P, number> | undefined;
  y: StoredPointAccessor<P, number> | undefined;
  defined?: PointAccessor<P, boolean>;
  key: LineAccessor<L, string | number>;
  valuesAccessor: ValuesAccessor<L, P>;
  stroke?: StyleValue<L, string>;
  strokeWidth?: StyleValue<L, number>;
  transition: boolean;
};

export interface LineComponent<P = unknown, L = unknown>
  extends ComponentBuilder<LineComponent<P, L>> {
  // x and y have no default: required() runs at render time, so the getter is undefined
  // until the caller sets one. The type says so rather than letting an unset property be
  // called without narrowing.
  x(): StoredPointAccessor<P, number> | undefined;
  x<Q = P>(value: number | PointAccessor<Q, number>): LineComponent<P, L>;
  y(): StoredPointAccessor<P, number> | undefined;
  y<Q = P>(value: number | PointAccessor<Q, number>): LineComponent<P, L>;
  defined(): PointAccessor<P, boolean> | undefined;
  defined<Q = P>(predicate: PointAccessor<Q, boolean>): LineComponent<P, L>;
  key(): LineAccessor<L, string | number>;
  key<M = L>(accessor: LineAccessor<M, string | number>): LineComponent<P, L>;
  valuesAccessor(): ValuesAccessor<L, P>;
  valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor<M, Q>): LineComponent<P, L>;
  stroke(): StyleValue<L, string> | undefined;
  stroke<M = L>(value: StyleValue<M, string>): LineComponent<P, L>;
  strokeWidth(): StyleValue<L, number> | undefined;
  strokeWidth<M = L>(value: StyleValue<M, number>): LineComponent<P, L>;
  transition(): boolean;
  transition(enabled: boolean): LineComponent<P, L>;
}

/**
 * d3 takes either a constant or a value function, but not a union of the two, so a style
 * property is narrowed once before it reaches the selection. An unset property becomes a
 * function returning null, which d3 removes the style for - the same thing it does when
 * handed undefined directly.
 */
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

/**
 * Reports a required property the caller left unset, naming both the component and the
 * property. Called before the data join, so a missing accessor is reported by name instead of
 * arriving as a TypeError from d3's internals (a missing y) or as an empty path (a missing x).
 */
function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`[line] the ${name} property is required`);
  }
  return value;
}

export default function line<P = unknown, L = unknown>(): LineComponent<P, L> {
  return (
    component<LineComponent<P, L>>()
      .prop("x", fn.functor)
      .prop("y", fn.functor)
      .prop("stroke")
      .prop("strokeWidth")
      .prop("defined")
      .prop("key")
      .key((_datum: unknown, index: number) => index)
      .prop("valuesAccessor")
      // The default layer type L is P[], so the values ARE the layer and identity is correct.
      // A caller who sets a different L must supply a matching accessor; the constraint
      // cannot express "identity is valid only for the default instantiation".
      .valuesAccessor(fn.identity as ValuesAccessor<L, P>)
      .prop("transition")
      .transition(true)
      .render(function (this: Element, data: L[]) {
        const selection = select(this);
        const props = selection.props<LineProps<P, L>>();

        // Layouts

        // Both properties are wrapped by fn.functor on set, so a constant reads back as a
        // function and needs no normalising here - but an unset property is still undefined,
        // and is reported by name before anything is rendered.
        const x = required(props.x, "x");
        const y = required(props.y, "y");

        // Both dimensions are guarded. Checking only y would let a missing x reach the d
        // attribute verbatim, and the browser then drops that segment along with every
        // segment after it, silently truncating the series. An explicitly set predicate
        // replaces this one rather than composing with it.
        const defined: PointAccessor<P, boolean> =
          props.defined === undefined
            ? (datum, index, points) =>
                !isMissingVal(x(datum, index, points)) && !isMissingVal(y(datum, index, points))
            : props.defined;

        const line = d3Line<P>().defined(defined).x(x).y(y);

        // Rendering

        // Declared with `function` so that `this` is still forwarded to valuesAccessor, as
        // it was when this was built with fn.compose.
        const pathData: ValueFn<SVGPathElement, L, string | null> = function (datum, index) {
          return line(props.valuesAccessor.call(this, datum, index));
        };
        const stroke = fn.valueFn(props.stroke ?? null);
        const strokeWidth = fn.valueFn(props.strokeWidth ?? null);

        const path = selection
          .selectAll<SVGPathElement, L>(".sszvis-line")
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
            .transition(defaultTransition(OWN_TRANSITION))
            .attr("d", pathData)
            .style("stroke", stroke)
            .style("stroke-width", strokeWidth);
        } else {
          // An in-flight tween from an earlier render would overwrite what is written here, so
          // it is interrupted first - by name, so a transition the consumer scheduled on this
          // path keeps running.
          path
            .interrupt(OWN_TRANSITION)
            .attr("d", pathData)
            .style("stroke", stroke)
            .style("stroke-width", strokeWidth);
        }
      })
  );
}
