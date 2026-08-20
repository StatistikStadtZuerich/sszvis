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
import { type Component } from "../d3-component.js";
/**
 * Dimension accessors are handed to d3.line, which calls them with a single point, that
 * point's index within the line, and the array of points the line is drawn from.
 */
type PointAccessor<P, R> = (datum: P, index: number, points: P[]) => R;
/**
 * Style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole line and that line's index within the outer array - not with a single point.
 */
type LineAccessor<L, R> = (datum: L, index: number) => R;
/** Either a constant or an accessor; only stroke and strokeWidth accept both. */
type StyleValue<L, R> = R | LineAccessor<L, R>;
/** Pulls the array of points to draw out of one line's datum. */
type ValuesAccessor<L, P> = (datum: L, index: number) => P[];
export interface LineComponent<P = unknown, L = unknown> extends Component {
    x(): number | PointAccessor<P, number> | undefined;
    x<Q = P>(value: number | PointAccessor<Q, number>): LineComponent<P, L>;
    y(): PointAccessor<P, number> | undefined;
    y<Q = P>(accessor: PointAccessor<Q, number>): LineComponent<P, L>;
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
export default function <P = unknown, L = unknown>(): LineComponent<P, L>;
export {};
//# sourceMappingURL=line.d.ts.map