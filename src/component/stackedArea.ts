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
 *                                            Should return a value in screen pixels. Required, and
 *                                            its absence is not reported: an unset dimension
 *                                            resolves to a constant NaN, so every coordinate is
 *                                            written as NaN, the browser rejects the path, and the
 *                                            chart is simply empty.
 * @property {number, function} y0            An accessor for the lower bound of the band at a
 *                                            point, i.e. the baseline, or a constant. In screen
 *                                            pixels. Required. When it is missing the top line is
 *                                            still written and the browser drops the shape at the
 *                                            first NaN.
 * @property {number, function} y1            An accessor for the upper bound of the band at a
 *                                            point, or a constant. In screen pixels. Required, and
 *                                            the most damaging of the three to omit because it
 *                                            renders successfully: d3 reads a null-ish upper bound
 *                                            as no upper bound and falls back to y0, so each layer
 *                                            collapses onto its own baseline and becomes a
 *                                            zero-height sliver. With the default white stroke the
 *                                            chart looks like a set of line charts. null and
 *                                            undefined are treated identically here.
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
 *                                            visually separates two touching layers. The default is
 *                                            applied as `props.stroke || "#ffffff"`, which tests
 *                                            for truthiness rather than for having been set, so
 *                                            both null and "" - the two ways a caller would ask for
 *                                            no stroke - come back white. Only an accessor gets
 *                                            through, because a function is always truthy: `() =>
 *                                            null` removes the attribute and `() => ""` writes an
 *                                            invalid paint, and both compute to none.
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
 *                                            degenerate top-and-bottom pair. The default accepts
 *                                            every point whatever its value (see below), so this is
 *                                            the only missing-value guard available, and it has to
 *                                            test both bounds by hand because it replaces the
 *                                            default rather than composing with it.
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
 *
 * Note: the default defined predicate never rejects anything. It reproduces the one it replaced,
 * which read `function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }` and
 * so returned a function rather than calling either composed accessor, and a function is truthy,
 * which is all d3 tests. A NaN therefore reaches the d attribute verbatim, the browser stops
 * rendering at the invalid command, and the whole layer disappears rather than only the segment the
 * missing value belongs to. undefined goes the same way, since d3.area applies unary + to it, and
 * null is not caught by an isNaN guard at all: it coerces to 0 and is plotted as data, pinning that
 * point to the top of the chart. Nothing is reported in any of these cases. line writes its
 * two-dimension guard by hand for this reason.
 *
 * Note: with transition enabled the selection is replaced by the transition before any attribute is
 * written, so d, fill, stroke and stroke-width are all deferred and the class is the only thing
 * applied synchronously. A freshly rendered chart is an empty path element until the first
 * animation frame runs, and anything measuring it synchronously - getTotalLength, a bounding box, a
 * screenshot - sees nothing. line defers d and stroke-width the same way but still writes its
 * stroke synchronously, and bar and dot write their geometry synchronously, so this is the widest
 * version of the hole.
 *
 * Note: the deferred attributes do not enter uniformly. d and the two colours jump to their target
 * on the first frame, because d3 interpolates from the element's current value and there is none to
 * pair with, while stroke-width animates up from 0, because a numeric interpolation coerces the
 * missing start value and +null is 0. The layers appear at full size with a hairline that thickens
 * over the transition. Routing the colours through the transition also rewrites them as rgb(), so a
 * stylesheet or a test matching the hex string that was passed in will not find it.
 *
 * Note: the header this replaces documented a valuesAccessor property, saying the default treats
 * the layer object as an array of values. The component never declared it, so the setter does not
 * exist and calling it throws a TypeError, and a wrapper object cannot be unwrapped: d3.area runs
 * the datum through Array.from, which yields [] for a plain object, so a layer that is not an array
 * is silently skipped as an empty path. stackedAreaMultiples, a near-copy of this component, does
 * declare valuesAccessor.
 *
 * Note: the data join matches on the generic .sszvis-path class, which pie, stackedAreaMultiples
 * and stackedPyramid also use. A path another component left in the same group is bound to layer
 * zero and repainted as an area rather than being left alone. Harmless while each component owns
 * its own selectGroup, which is how every example is written, and benign here because this
 * component rewrites every attribute it uses - the cost falls on whichever component owned the
 * path. The same collision corrupts pie's own geometry when it is read from the other side.
 *
 * Note: nothing constrains the geometry. A layer with no points yields a path element with no d
 * attribute, a single point yields a closed shape that encloses no area but still draws a vertical
 * hairline in the default stroke, and a band whose y1 lies below y0 simply winds the other way. See
 * test/component/stackedArea.test.ts.
 *
 * @return {sszvis.component}
 */

import { area as d3Area, select, type ValueFn } from "d3";
import { type Component, component } from "../d3-component.js";
import { defaultTransition } from "../transition.js";

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
  group: ArrayLike<Element> | ArrayLike<L>
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
  fill?: StyleValue<L, string> | null;
  stroke?: StyleValue<L, string> | null;
  strokeWidth?: StyleValue<L, number> | null;
  defined?: boolean | PointAccessor<P, boolean>;
  key: KeyAccessor<L, string | number>;
  transition: boolean;
};

export interface StackedAreaComponent<P = unknown, L extends Iterable<P> = P[]> extends Component {
  x(): AreaValue<P> | undefined;
  x<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y0(): AreaValue<P> | undefined;
  y0<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y1(): AreaValue<P> | null | undefined;
  y1<Q = P>(value: AreaValue<Q> | null): StackedAreaComponent<P, L>;
  fill(): StyleValue<L, string> | null | undefined;
  fill<M = L>(value: StyleValue<M, string> | null): StackedAreaComponent<P, L>;
  stroke(): StyleValue<L, string> | null | undefined;
  stroke<M = L>(value: StyleValue<M, string> | null): StackedAreaComponent<P, L>;
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
 * As above, for the style properties. An unset property becomes a function returning null,
 * which d3 removes the attribute for - the same thing it does when handed undefined
 * directly.
 */
const styleValue = <L, R extends string | number>(
  value: StyleValue<L, R> | null | undefined
): ValueFn<SVGPathElement, L, R | null> =>
  typeof value === "function" ? value : () => value ?? null;

export default function <P = unknown, L extends Iterable<P> = P[]>(): StackedAreaComponent<P, L> {
  return component()
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

      // Layouts

      // The default predicate accepts every point, whatever its value. It reproduces the
      // one it replaced, which read
      //   function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }
      // and so returned a function rather than calling either of them - and a function is
      // truthy, which is all d3 tests. The missing-value guard this was meant to be has
      // therefore never run. See test/component/stackedArea.test.ts.
      const defined: PointAccessor<P, boolean> =
        props.defined === undefined
          ? () => true
          : typeof props.defined === "function"
            ? props.defined
            : () => Boolean(props.defined);

      const areaGen = d3Area<P>().defined(defined).x(dimension(props.x)).y0(dimension(props.y0));

      // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
      // why an unset y1 collapses every layer onto its own baseline. Its typings admit only
      // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
      // two identically.
      if (props.y1 == null) {
        areaGen.y1(null);
      } else {
        areaGen.y1(dimension(props.y1));
      }

      // Rendering

      const pathData: ValueFn<SVGPathElement, L, string | null> = (datum) => areaGen(datum);
      const fill = styleValue(props.fill);
      // The white hairline separating two touching layers. Applied with a truthiness check
      // rather than an undefined one, so a null or empty stroke is replaced by it too.
      const stroke = styleValue(props.stroke || "#ffffff");
      const strokeWidth = styleValue(props.strokeWidth === undefined ? 1 : props.strokeWidth);

      const paths = selection
        .selectAll<SVGPathElement, L>("path.sszvis-path")
        .data(data, props.key)
        .join("path")
        .classed("sszvis-path", true);

      // Every visual property is applied to the transition when there is one, so the two
      // branches are spelled out rather than sharing a variable - a d3 transition and a d3
      // selection have separate types.
      if (props.transition) {
        paths
          .transition(defaultTransition())
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      } else {
        paths
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      }
    });
}
