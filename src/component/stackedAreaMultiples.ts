/**
 * Stacked Area Multiples component
 *
 * This component, like stackedArea, requires an array of layer objects, where each layer object is
 * one of the multiples. In addition to stackedArea, this chart's layers can be separated to provide
 * two views on the data: a sum of all elements as well as every element on its own. The layer object
 * is unwrapped by valuesAccessor, which defaults to treating it as the array of points along that
 * layer's outline. Three independent dimensions are read from each point: x, and the two vertical
 * bounds of the band at that x.
 *
 * @module sszvis/component/stackedAreaMultiples
 *
 * @template P The type of one point along a layer
 * @template L The type of one layer, whatever valuesAccessor unwraps into points
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
 *                                            as no upper bound and falls back to y0, so each band
 *                                            collapses onto its own baseline. With no default
 *                                            stroke to draw it, the chart is then blank rather than
 *                                            merely wrong. null and undefined are treated
 *                                            identically here.
 * @property {string, function} [fill]        The area fill, as a colour or an accessor over a whole
 *                                            layer. It has no default, and unlike .sszvis-line
 *                                            there is no .sszvis-path rule in the stylesheet to
 *                                            fall back on - the class is only a hook - so an area
 *                                            with no fill renders as a black slab, the SVG initial
 *                                            value. An accessor returning undefined removes the
 *                                            attribute rather than warning, so a colour scale
 *                                            configured with .unknown(undefined) is black too.
 *                                            Every chart in docs/area-chart-stacked sets a fill.
 * @property {string, function} [stroke]      The area stroke, as a colour or an accessor over a
 *                                            whole layer. Unlike stackedArea, which defaults it to
 *                                            the #ffffff hairline that separates two touching
 *                                            layers, this component has no default at all, so
 *                                            touching bands run together and null and "" are
 *                                            passed through as given. Harmless in the separated
 *                                            view, where stackedAreaMultiplesLayout spaces the
 *                                            bands so they never touch.
 * @property {number, function} [strokeWidth] The stroke-width, as a number or an accessor over a
 *                                            whole layer. Defaults to 1, applied with an explicit
 *                                            undefined check, so 0 survives where a falsy fallback
 *                                            would have replaced it. null is passed through to d3,
 *                                            which reads a null-ish value as a removal: unset means
 *                                            1, null means no attribute at all. Since there is no
 *                                            default stroke, the width is inert until a stroke is
 *                                            set, and setting only strokeWidth draws nothing.
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
 *                                            unique among layers. Defaults to the index - which,
 *                                            because the layers are reversed first, counts from the
 *                                            end of the array that was passed in. Setting it
 *                                            preserves object constancy across renders, which
 *                                            matters when a chart switches between the stacked and
 *                                            the separated view.
 * @property {function} [valuesAccessor]      Pulls the points to draw out of one layer's datum.
 *                                            Defaults to the identity, which treats the layer
 *                                            object as the array of points itself. Set it when the
 *                                            layer objects are wrappers such as
 *                                            { name: "Name", values: [ ... ] }. It is consulted for
 *                                            the geometry only: fill, stroke, strokeWidth and key
 *                                            still see the layer object, which is what lets the
 *                                            colour be read off the layer's name.
 * @property {boolean} transition             Whether to transition the layers when their values
 *                                            change. Defaults to true, and does nothing (see
 *                                            below).
 *
 * Note: the layers are reversed before the data join, so the first layer of the array that was
 * passed in is the last path in the DOM and paints over the others. The line has carried an
 * unanswered "//sszsch why reverse?" comment since 2017, and nothing - not this header, not
 * docs/area-chart-stacked/README.md, not stackedAreaMultiplesLayout, which lays the bands out -
 * says why. stackedArea does not reverse, so the same datum comes out of the two components in
 * opposite order, and the toggle in docs/area-chart-stacked/sa-two.js moves every path on the
 * switch. The reversal also renumbers the layers, so the index handed to the style accessors, to
 * key and to valuesAccessor is the position in the reversed array: an index-keyed palette is
 * applied back to front here and front to back in stackedArea. The array itself is copied rather
 * than reversed in place, so a caller holding on to it - as sa-two.js does, rendering both views
 * from one datum - sees it unchanged.
 *
 * Note: transition animates nothing. The transition is created on its own statement and its return
 * value is dropped, so every attribute is written to the plain selection instead. It did animate
 * until 47f58578 ("perf: change .enter() to .join() API", Oct 2024), which dropped the `paths =`
 * the transition used to be assigned back to. The property is not inert, though: the transition is
 * still scheduled, and a d3 transition interrupts any unnamed transition already running on the
 * same node when it starts, so a render freezes another component's animation on a shared or
 * adopted path mid-flight. bar carries the same discarded-transition shape. One visible consequence
 * is that the switch into the separated view snaps while the switch back, drawn by stackedArea,
 * eases - the chart animates in one direction only, and it is that switch the key property exists
 * for.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke,
 * strokeWidth and valuesAccessor are called by the selection with the datum for a whole layer, that
 * layer's index, and d3's group of path nodes, with the node itself as `this`. The style-related
 * accessors therefore receive the layer object rather than a point, the inverse of what the
 * dimensions receive - the same asymmetry documented on line.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM.
 *
 * Note: the default defined predicate never rejects anything. It reproduces the one it replaced,
 * which read `function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }` and
 * so returned a function rather than calling either composed accessor, and a function is truthy,
 * which is all d3 tests. A NaN therefore reaches the d attribute verbatim, the browser stops
 * rendering at the invalid command, and the whole band disappears rather than only the segment the
 * missing value belongs to. undefined goes the same way, since d3.area applies unary + to it, and
 * null is not caught by an isNaN guard at all: it coerces to 0 and is plotted as data, pinning that
 * point to the top of the chart. Nothing is reported in any of these cases. stackedArea behaves
 * identically; line guards both of its dimensions by hand and works.
 * docs/area-chart-stacked/README.md describes the default of both components as "y0 and y1 are not
 * NaN", a guard that has never run, and this header did not mention defined at all.
 *
 * Note: forgetting valuesAccessor for a wrapper layer produces an empty chart rather than an error,
 * because d3.area runs its datum through Array.from and that yields [] for a plain object. An
 * accessor that returns nothing instead throws out of d3.area, which names neither the component
 * nor the property.
 *
 * Note: the data join matches on the generic .sszvis-path class, which pie, stackedArea and
 * stackedPyramid also use. A path another component left in the same group is bound to a layer and
 * repainted as an area rather than being left alone, and since every attribute here is written
 * unconditionally - an unset fill or stroke is written as undefined, which d3 reads as a removal -
 * the foreign path loses the colours it came with. Harmless while each component owns its own
 * selectGroup, which is how every example is written. The same collision corrupts pie's own
 * geometry when it is read from the other side.
 *
 * Note: nothing constrains the geometry. A layer with no points yields a path element with no d
 * attribute, a single point yields a closed shape that encloses no area, and a band whose y1 lies
 * below y0 simply winds the other way. Binding a datum that is not iterable throws "data is not
 * iterable" out of the reversal, before the join. See test/component/stackedAreaMultiples.test.ts.
 *
 * @return {sszvis.component}
 */

import { area as d3Area, select, type ValueFn } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
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
 * Pulls the points to draw out of one layer's datum. It is composed into the d attribute
 * callback, so it is called exactly like a style accessor - hence the same type.
 */
type ValuesAccessor<L, P> = LayerAccessor<L, Iterable<P>>;

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

type StackedAreaMultiplesProps<P, L> = {
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
  /**
   * Defaults to the identity, which only yields points when the layer object is itself the
   * array of them - the shape L falls back to. A layer of any other shape needs its own
   * accessor, and gets an empty path until it has one.
   */
  valuesAccessor: ValuesAccessor<L, P>;
  transition: boolean;
};

export interface StackedAreaMultiplesComponent<P = unknown, L = P[]> extends Component {
  x(): AreaValue<P> | undefined;
  x<Q = P>(value: AreaValue<Q>): StackedAreaMultiplesComponent<P, L>;
  y0(): AreaValue<P> | undefined;
  y0<Q = P>(value: AreaValue<Q>): StackedAreaMultiplesComponent<P, L>;
  y1(): AreaValue<P> | null | undefined;
  y1<Q = P>(value: AreaValue<Q> | null): StackedAreaMultiplesComponent<P, L>;
  fill(): StyleValue<L, string> | null | undefined;
  fill<M = L>(value: StyleValue<M, string> | null): StackedAreaMultiplesComponent<P, L>;
  stroke(): StyleValue<L, string> | null | undefined;
  stroke<M = L>(value: StyleValue<M, string> | null): StackedAreaMultiplesComponent<P, L>;
  strokeWidth(): StyleValue<L, number> | null | undefined;
  strokeWidth<M = L>(value: StyleValue<M, number> | null): StackedAreaMultiplesComponent<P, L>;
  defined(): boolean | PointAccessor<P, boolean> | undefined;
  defined<Q = P>(
    predicate: boolean | PointAccessor<Q, boolean>
  ): StackedAreaMultiplesComponent<P, L>;
  key(): KeyAccessor<L, string | number>;
  key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaMultiplesComponent<P, L>;
  valuesAccessor(): ValuesAccessor<L, P>;
  valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor<M, Q>): StackedAreaMultiplesComponent<P, L>;
  transition(): boolean;
  transition(enabled: boolean): StackedAreaMultiplesComponent<P, L>;
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

export default function <P = unknown, L = P[]>(): StackedAreaMultiplesComponent<P, L> {
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
    .prop("valuesAccessor")
    .valuesAccessor(fn.identity)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: L[]) {
      const selection = select(this);
      const props = selection.props<StackedAreaMultiplesProps<P, L>>();

      // Layouts

      // Reversed for no stated reason - the line has carried an unanswered "//sszsch why
      // reverse?" comment since 2017 - which puts the first layer of the input last in the
      // DOM and mirrors the index every layer accessor is given. Taken on a copy, so the
      // array the caller passed in is left alone. See
      // test/component/stackedAreaMultiples.test.ts.
      const layers = [...data].reverse();

      // The default predicate accepts every point, whatever its value. It reproduces the
      // one it replaced, which read
      //   function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }
      // and so returned a function rather than calling either of them - and a function is
      // truthy, which is all d3 tests. The missing-value guard this was meant to be has
      // therefore never run.
      const defined: PointAccessor<P, boolean> =
        props.defined === undefined
          ? () => true
          : typeof props.defined === "function"
            ? props.defined
            : () => Boolean(props.defined);

      const areaGen = d3Area<P>().defined(defined).x(dimension(props.x)).y0(dimension(props.y0));

      // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
      // why an unset y1 collapses every band onto its own baseline. Its typings admit only
      // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
      // two identically.
      if (props.y1 == null) {
        areaGen.y1(null);
      } else {
        areaGen.y1(dimension(props.y1));
      }

      // Rendering

      // Declared with `function` so that `this` and the node group are still forwarded to
      // valuesAccessor, as they were when this was built with fn.compose.
      const pathData: ValueFn<SVGPathElement, L, string | null> = function (datum, index, group) {
        return areaGen(props.valuesAccessor.call(this, datum, index, group));
      };
      const fill = styleValue(props.fill);
      // No default, where stackedArea falls back to a #ffffff hairline.
      const stroke = styleValue(props.stroke);
      const strokeWidth = styleValue(props.strokeWidth === undefined ? 1 : props.strokeWidth);

      const paths = selection
        .selectAll<SVGPathElement, L>("path.sszvis-path")
        .data(layers, props.key)
        .join("path")
        .classed("sszvis-path", true);

      // The transition is created and its return value dropped, so it carries no tweens and
      // every attribute below is written to the plain selection: nothing animates, while the
      // schedule still interrupts whatever else was animating these nodes.
      if (props.transition) {
        paths.transition(defaultTransition());
      }

      paths
        .attr("d", pathData)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth);
    });
}
