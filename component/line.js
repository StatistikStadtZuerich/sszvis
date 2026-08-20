import { select, line as line$1 } from 'd3';
import { component } from '../d3-component.js';
import { identity } from '../fn.js';
import { defaultTransition } from '../transition.js';

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
 * @property {number, function} x       An accessor function for getting the x-value of the line, or a
 *                                       constant. Required: omitting it draws nothing at all, with no
 *                                       warning, because every point then reads as missing.
 * @property {function} y                An accessor function for getting the y-value of the line. Required,
 *                                       and unlike x it must be a function, because the default defined
 *                                       predicate calls it. Omitting it throws a TypeError rather than a
 *                                       named missing-property error.
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
/**
 * d3 takes either a constant or a value function, but not a union of the two, so a style
 * property is narrowed once before it reaches the selection. An unset property becomes a
 * function returning null, which d3 removes the style for - the same thing it does when
 * handed undefined directly.
 */
const styleValue = value => typeof value === "function" ? value : () => value !== null && value !== void 0 ? value : null;
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
const isMissingVal = value => Number.isNaN(Number(value));
function line () {
  return component().prop("x").prop("y").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((_datum, index) => index).prop("valuesAccessor").valuesAccessor(identity).prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // Layouts
    // d3 has separate overloads for a constant and an accessor, so a constant x is
    // normalised here. d3 would wrap it in exactly the same way.
    const xProp = props.x;
    const x = typeof xProp === "function" ? xProp : () => xProp;
    // Both dimensions are guarded. Checking only y would let a missing x reach the d
    // attribute verbatim, and the browser then drops that segment along with every
    // segment after it, silently truncating the series.
    const defined = props.defined === undefined ? (datum, index, points) => !isMissingVal(x(datum, index, points)) && !isMissingVal(props.y(datum, index, points)) : props.defined;
    const line = line$1().defined(defined).x(x).y(props.y);
    // Rendering
    // Declared with `function` so that `this` is still forwarded to valuesAccessor, as
    // it was when this was built with fn.compose.
    const pathData = function (datum, index) {
      return line(props.valuesAccessor.call(this, datum, index));
    };
    const stroke = styleValue(props.stroke);
    const strokeWidth = styleValue(props.strokeWidth);
    const path = selection.selectAll(".sszvis-line").data(data, props.key).join("path").classed("sszvis-line", true).style("stroke", stroke);
    path.order();
    // The visual properties are applied to the transition when there is one, so the two
    // branches are spelled out rather than sharing a variable - a d3 transition and a
    // d3 selection have separate types.
    if (props.transition) {
      path.transition(defaultTransition()).attr("d", pathData).style("stroke", stroke).style("stroke-width", strokeWidth);
    } else {
      path.attr("d", pathData).style("stroke", stroke).style("stroke-width", strokeWidth);
    }
  });
}

export { line as default };
//# sourceMappingURL=line.js.map
