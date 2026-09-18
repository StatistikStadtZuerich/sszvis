/**
 * Stacked Area component
 *
 * Stacked area charts are useful for showing how component parts contribute to a total quantity
 *
 * The component renders the output of a d3 stack layout rather than computing one itself, so some
 * of its configuration properties are similar. It requires an array of layer objects, where each
 * layer object represents a layer in the stack and is itself the array of points along that layer's
 * outline. Three independent dimensions are read from each point: x, and the two vertical bounds of
 * the band at that x.
 *
 * @module sszvis/component/stackedArea
 *
 * @template P The type of one point along a layer
 * @template L The type of one layer, an Iterable of P
 *
 * @property {number, function} x             An accessor for the x-value of a point, or a constant.
 *                                            Should return a value in screen pixels. Required:
 *                                            leaving it unset throws before anything is appended.
 * @property {number, function} y0            An accessor for the lower bound of the band at a
 *                                            point, i.e. the baseline, or a constant. In screen
 *                                            pixels. Required, on the same terms as x.
 * @property {number, function} y1            An accessor for the upper bound of the band at a
 *                                            point, or a constant. In screen pixels. Required, on
 *                                            the same terms as x - but only an unset property is
 *                                            caught. An explicit null keeps its d3 meaning, which
 *                                            is "no upper bound": d3 then falls back to y0, so each
 *                                            layer collapses onto its own baseline and becomes a
 *                                            zero-height sliver.
 * @property {string, function} [fill]        The area fill, as a colour or an accessor over a whole
 *                                            layer. It has no default, and unlike .sszvis-line
 *                                            there is no .sszvis-path rule in sszvis.css to fall
 *                                            back on - the class is only a hook - so an area with
 *                                            no fill renders as a black slab, the SVG initial
 *                                            value. An accessor returning undefined removes the
 *                                            attribute rather than warning, so a colour scale
 *                                            configured with .unknown(undefined) is black too.
 *                                            Every chart in docs/area-chart-stacked sets a fill.
 * @property {string, function} [stroke]      The area stroke, as a colour or an accessor over a
 *                                            whole layer. Defaults to #ffffff, the hairline that
 *                                            visually separates two touching layers. The default
 *                                            stands in for an unset stroke only - it is applied
 *                                            with an explicit undefined check, as strokeWidth's
 *                                            is - so null and "" are
 *                                            passed through as given - null removes the attribute
 *                                            and "" writes an invalid paint, both computing to
 *                                            none - which is how a caller asks for no outline.
 * @property {number, function} [strokeWidth] The stroke-width, as a number or an accessor over a
 *                                            whole layer. Defaults to 1, applied with an explicit
 *                                            undefined check, so 0 survives where a falsy fallback
 *                                            would have replaced it. null is passed through to d3,
 *                                            which reads a null-ish value as a removal: unset means
 *                                            1, null means no attribute at all.
 * @property {boolean, function} [defined]    A per-point predicate handed to d3.area, deciding
 *                                            whether a point is drawn; a constant is coerced to a
 *                                            boolean. Each surviving run of points becomes its own
 *                                            subpath, and a run of one point is emitted as a
 *                                            degenerate top-and-bottom pair. Defaults to a
 *                                            missing-value guard over both vertical bounds: a point
 *                                            whose y0 or y1 is null, undefined or has no numeric
 *                                            form is skipped and the area breaks around it, and the
 *                                            first such point in a render is logged as a warning.
 *                                            Setting it replaces that guard rather than composing
 *                                            with it, so an explicit predicate must test both
 *                                            bounds itself.
 * @property {function} [key]                 The key function for the data join, called with a
 *                                            layer and its index. The value it returns should be
 *                                            unique among layers. Defaults to the
 *                                            index, which matches layers by position; setting it
 *                                            preserves object constancy across renders, which
 *                                            matters when a chart transitions between stacked and
 *                                            separated views.
 * @property {boolean} transition             Whether to transition the layers when their values
 *                                            change. Defaults to true.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke and
 * strokeWidth are called by the selection with the datum for a whole layer, that layer's index, and
 * d3's group of path nodes. The style-related accessors therefore receive the array of points
 * rather than a point, the inverse of what the dimensions receive - the same asymmetry documented
 * on line.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM.
 * With a transition, the style accessors are additionally invoked once on the enter selection,
 * whose group array has a hole at every updating position - so an accessor that walks its third
 * argument sees a sparse group on that pass, the same shape stackedAreaMultiples documents. The
 * value that reaches the DOM is the one from the merged pass, which is never sparse.
 *
 * Note: the default defined predicate guards both vertical bounds by hand, as line does. The
 * expression it replaces read `function () { return fn.compose(fn.not(isNaN), props.y0) &&
 * fn.compose(...y1); }` and so returned a function rather than calling either composed accessor -
 * and a function is truthy, which is all d3 tests - so a NaN reached the d attribute verbatim, the
 * browser stopped rendering at the invalid command, and the whole layer disappeared rather than
 * only the segment the missing value belonged to. The guard treats null and undefined as missing
 * too, which a plain isNaN test would not: isNaN(null) is false, so a null would coerce to 0 and be
 * plotted at the top of the chart. line, by contrast, still lets null through.
 *
 * Note: with transition enabled every visual attribute also goes through the transition, so an
 * entering area is given d, fill, stroke and stroke-width at the join as well. Without that an
 * entering path carries only its classes until the first animation frame, and anything measuring
 * the chart synchronously - getTotalLength, a bounding box, a screenshot - sees nothing. It also
 * settles what an enter looks like: the transition then interpolates from the destination to
 * itself, so the layers appear complete instead of at full size with a hairline thickening up from
 * 0, and d3 skips a constant tween whose start equals its end, so the colours stay as they were
 * given rather than being rewritten as rgb(). Only an update animates.
 *
 * Note: the header this replaces documented a valuesAccessor property, saying the default treats
 * the layer object as an array of values. The component never declared it, so the setter does not
 * exist and calling it throws a TypeError, and a wrapper object cannot be unwrapped: d3.area runs
 * the datum through Array.from, which yields [] for a plain object, so a layer that is not an array
 * is silently skipped as an empty path. stackedAreaMultiples, a near-copy of this component, does
 * declare valuesAccessor.
 *
 * Note: the areas carry a `sszvis-stacked-area-path` class alongside the generic `sszvis-path` one,
 * and the data join matches only the former, so a pie wedge or a pyramid reference path left in the
 * same group is left alone. That class is shared with stackedAreaMultiples on purpose - the two are
 * the two views of one chart, rendered into one group and toggled between, and the eased switch
 * depends on both joining the same path nodes - and with no other component. The generic class
 * stays in the class attribute purely as a styling hook.
 *
 * Note: nothing constrains the geometry. A layer with no points yields a path element with no d
 * attribute, a single point yields a closed shape that encloses no area but still draws a vertical
 * hairline in the default stroke, and a band whose y1 lies below y0 simply winds the other way. See
 * test/component/stackedArea.test.ts.
 *
 * @return {sszvis.component}
 */

import { area as d3Area, select, type ValueFn } from "d3";
import { colorToString } from "../color.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import * as logger from "../logger.js";
import { defaultTransition, OWN_TRANSITION } from "../transition.js";
import type { ColorValue } from "../types.js";

/**
 * The dimension accessors are handed to d3.area, which calls them with a single point, that
 * point's index within the layer, and the array of points the layer is drawn from.
 */
type PointAccessor<P, R> = (datum: P, index: number, points: P[]) => R;

/**
 * The style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole layer and that layer's index within the outer array - not with a single point -
 * followed by d3's group of path nodes, with the node itself as `this`. That is exactly
 * d3's own ValueFn, so declaring fewer parameters stays fine while a callback that needs
 * the group can still be written.
 */
type LayerAccessor<L, R> = ValueFn<SVGPathElement, L, R>;

/**
 * The key is handed to selection.data, which calls it once for each half of the keyed join:
 * over the nodes already in the DOM, with the node as `this` and the node group as the third
 * argument, and over the incoming layers, with the parent as `this` and the array of layers
 * instead. Both `this` and the group therefore differ between the two halves, which is why
 * this is not a ValueFn.
 */
type KeyAccessor<L, R> = (
  this: Element,
  datum: L,
  index: number,
  group: ArrayLike<Element> | ArrayLike<L>,
) => R;

/** Either a constant or an accessor; the three dimensions accept both. */
type AreaValue<P> = number | PointAccessor<P, number>;

/** Either a constant or an accessor, over one whole layer. */
type StyleValue<L, R> = R | LayerAccessor<L, R>;

type StackedAreaProps<P, L> = {
  x?: AreaValue<P>;
  y0?: AreaValue<P>;
  /**
   * Read with a null-ish check rather than a strict one, because d3 makes no distinction
   * between an unset upper bound and one set to null.
   */
  y1?: AreaValue<P> | null;
  fill?: StyleValue<L, ColorValue> | null;
  stroke?: StyleValue<L, ColorValue> | null;
  strokeWidth?: StyleValue<L, number> | null;
  defined?: boolean | PointAccessor<P, boolean>;
  key: KeyAccessor<L, string | number>;
  transition: boolean;
};

export interface StackedAreaComponent<
  P = unknown,
  L extends Iterable<P> = P[],
> extends ComponentBuilder<StackedAreaComponent<P, L>> {
  x(): AreaValue<P> | undefined;
  x<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y0(): AreaValue<P> | undefined;
  y0<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y1(): AreaValue<P> | null | undefined;
  y1<Q = P>(value: AreaValue<Q> | null): StackedAreaComponent<P, L>;
  fill(): StyleValue<L, ColorValue> | null | undefined;
  fill<M = L>(value: StyleValue<M, ColorValue> | null): StackedAreaComponent<P, L>;
  stroke(): StyleValue<L, ColorValue> | null | undefined;
  stroke<M = L>(value: StyleValue<M, ColorValue> | null): StackedAreaComponent<P, L>;
  strokeWidth(): StyleValue<L, number> | null | undefined;
  strokeWidth<M = L>(value: StyleValue<M, number> | null): StackedAreaComponent<P, L>;
  defined(): boolean | PointAccessor<P, boolean> | undefined;
  defined<Q = P>(predicate: boolean | PointAccessor<Q, boolean>): StackedAreaComponent<P, L>;
  key(): KeyAccessor<L, string | number>;
  key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaComponent<P, L>;
  transition(): boolean;
  transition(enabled: boolean): StackedAreaComponent<P, L>;
}

/**
 * d3 takes either a constant or a value function, but not a union of the two, so a
 * dimension is narrowed once before it reaches the generator. Only the constant branch
 * needs wrapping, and it is wrapped exactly as d3's own constant(+value) was: the value is
 * coerced once, here, rather than once per point inside the attr callback. An unset
 * dimension therefore still resolves to NaN, and a value that cannot be coerced still
 * throws before the data join rather than after it.
 */
const dimension = <P>(value: AreaValue<P> | undefined): PointAccessor<P, number> => {
  if (typeof value === "function") return value;
  // An unset dimension is spelled out because TypeScript will not coerce undefined, and
  // +undefined is NaN.
  const constant = value === undefined ? Number.NaN : +value;
  return () => constant;
};

/**
 * Whether a bound counts as missing, and so breaks the area at that point.
 *
 * A value is missing when it is null-ish or when it has no numeric form. The null-ish half
 * goes beyond the isNaN guard this default was always meant to be - isNaN(null) is false,
 * so a null would coerce to 0 and be plotted at the top of the chart - and beyond
 * src/component/line.ts, whose guard is documented as letting null through. A null
 * measurement is missing data, not a zero, and there is no way to say "plot this at zero"
 * with null that saying 0 does not say better.
 */
const isMissingVal = (value: unknown): boolean => value == null || Number.isNaN(Number(value));

/**
 * As above, for the style properties. An unset property becomes a function returning null,
 * which d3 removes the attribute for - the same thing it does when handed undefined
 * directly.
 */
/**
 * Resolves a colour prop - a constant or a per-layer accessor - to the string d3 writes into
 * an attribute. Nullish stays nullish, which removes the attribute.
 */
function colorFn<L>(
  value: StyleValue<L, ColorValue> | null,
): ValueFn<SVGPathElement, L, string | null> {
  const resolve = fn.valueFn<SVGPathElement, L, ColorValue | null>(value);
  return function (datum, index, groups) {
    return colorToString(resolve.call(this, datum, index, groups));
  };
}

export default function stackedArea<
  P = unknown,
  L extends Iterable<P> = P[],
>(): StackedAreaComponent<P, L> {
  return component<StackedAreaComponent<P, L>>()
    .prop("x")
    .prop("y0")
    .prop("y1")
    .prop("fill")
    .prop("stroke")
    .prop("strokeWidth")
    .prop("defined")
    .prop("key")
    .key((_datum: unknown, index: number) => index)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: L[]) {
      const selection = select(this);
      const props = selection.props<StackedAreaProps<P, L>>();

      // x, y0 and y1 are all required, and each used to fail differently and silently: an
      // unset dimension reached d3 as undefined and resolved to a constant NaN, while an
      // unset y1 was read by d3 as "no upper bound" and fell back to y0, collapsing every
      // band onto its own baseline - a chart that renders and is wrong. A missing dimension
      // is a misconfiguration that can never render, so it throws, and it throws before the
      // data join, so nothing is appended. An explicit .y1(null) keeps its d3 meaning and is
      // deliberately not caught: only an unset property is.
      for (const required of ["x", "y0", "y1"] as const) {
        if (props[required] === undefined) {
          throw new Error(`[stackedArea] the ${required} property is required`);
        }
      }

      // Layouts

      const y0 = dimension(props.y0);
      const y1Given = props.y1 == null ? undefined : dimension(props.y1);

      // The default guards both vertical bounds, the way src/component/line.ts guards both
      // of its dimensions by hand. It is deliberately not composed: the expression this
      // replaces - `fn.compose(fn.not(isNaN), props.y0) && fn.compose(..., props.y1)` -
      // returned a function rather than calling either of them, and a function is truthy,
      // so the guard never ran. A dropped point is reported once per render, because a gap
      // in the data is transient and recoverable: the area simply breaks around it.
      let reported = false;
      const guardMissing: PointAccessor<P, boolean> = (datum, index, points) => {
        const missing =
          isMissingVal(y0(datum, index, points)) ||
          (y1Given !== undefined && isMissingVal(y1Given(datum, index, points)));
        if (missing && !reported) {
          reported = true;
          logger.warn(
            "[stackedArea] a point has a missing y0 or y1 value and was skipped; the area breaks around it.",
          );
        }
        return !missing;
      };

      const defined: PointAccessor<P, boolean> =
        props.defined === undefined
          ? guardMissing
          : typeof props.defined === "function"
            ? props.defined
            : () => Boolean(props.defined);

      const areaGen = d3Area<P>().defined(defined).x(dimension(props.x)).y0(y0);

      // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
      // why an unset y1 collapses every layer onto its own baseline. Its typings admit only
      // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
      // two identically.
      if (y1Given === undefined) {
        areaGen.y1(null);
      } else {
        areaGen.y1(y1Given);
      }

      // Rendering

      const pathData: ValueFn<SVGPathElement, L, string | null> = (datum) => areaGen(datum);
      // The colour props may hold one of the library's colour objects, so each is resolved
      // first and then rendered as the string d3 writes - the same conversion d3 would do.
      const fill = colorFn<L>(props.fill ?? null);
      // The white hairline separating two touching layers. Applied with an explicit undefined
      // check, as strokeWidth is, so it stands in for an unset stroke only: null and "" are
      // supplied values and reach d3 as given. A ?? would have swallowed the null.
      const stroke = colorFn<L>(props.stroke === undefined ? "#ffffff" : props.stroke);
      const strokeWidth = fn.valueFn(props.strokeWidth === undefined ? 1 : props.strokeWidth);

      // Matching on the stacked-area class rather than the generic .sszvis-path one, which pie
      // and stackedPyramid also write, keeps a foreign path in the same group out of the join.
      // The class is deliberately shared with stackedAreaMultiples and with no other component:
      // docs/area-chart-stacked/sa-two.js renders the two into one group and toggles between
      // them, and the eased switch between the stacked and the separated view depends on both
      // components joining the same path nodes. The generic class stays on the node, so no CSS
      // selector changes meaning, and both are added with classed rather than written as a
      // class attribute, so a class a caller put on the node survives every rerender.
      const paths = selection
        .selectAll<SVGPathElement, L>("path.sszvis-stacked-area-path")
        .data(data, props.key)
        .join((enter) => {
          const entered = enter.append("path");
          // Only the transition branch defers these, and only for an entering area: an
          // update already has last render's values in the DOM to interpolate from, and the
          // branch below writes all four on the selection when transitions are off. Writing
          // them here keeps a fresh area out of the attribute-less state a consumer that
          // measures on the render tick - getTotalLength, a bounding box, a synchronous
          // screenshot - would otherwise see. The transition then interpolates from the
          // destination to itself, so the hairline no longer grows up from 0. Guarded rather
          // than written unconditionally, so the no-transition path still evaluates each
          // accessor exactly once per render - which the accessor tests pin.
          if (props.transition) {
            entered
              .attr("d", pathData)
              .attr("fill", fill)
              .attr("stroke", stroke)
              .attr("stroke-width", strokeWidth);
          }
          return entered;
        })
        .classed("sszvis-path", true)
        .classed("sszvis-stacked-area-path", true);

      // Every visual property is applied to the transition when there is one, so the two
      // branches are spelled out rather than sharing a variable - a d3 transition and a d3
      // selection have separate types.
      if (props.transition) {
        paths
          .transition(defaultTransition(OWN_TRANSITION))
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      } else {
        // An in-flight tween from an earlier render would overwrite these, so it is
        // interrupted first - by name, so a consumer's own transition keeps running.
        paths
          .interrupt(OWN_TRANSITION)
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      }
    });
}
