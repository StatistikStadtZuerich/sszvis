/**
 * Stacked Area Multiples component
 *
 * This component, like stackedArea, requires an array of layer objects, where each layer object is
 * one of the multiples. In addition to stackedArea, this chart's layers can be separated to provide
 * two views on the data: a sum of all elements as well as every element on its own. It renders the
 * output of a d3 stack layout rather than computing one itself, so some of its configuration
 * properties are similar; in the separated view the baseline comes from an ordinal position scale
 * rather than from the stack, but the datum is the same. Each layer object is unwrapped by
 * valuesAccessor, which defaults to treating it as the array of points along that layer's outline.
 * Three independent dimensions are read from each point: x, and the two vertical bounds of the band
 * at that x.
 *
 * @module sszvis/component/stackedAreaMultiples
 *
 * @template P The type of one point along a layer
 * @template L The type of one layer, whatever valuesAccessor unwraps into points
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
 *                                            band collapses onto its own baseline and becomes a
 *                                            zero-height sliver, drawn as a hairline in the default
 *                                            stroke.
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
 *                                            whole layer. Defaults to #ffffff, the hairline that
 *                                            visually separates two touching bands, so the
 *                                            separated and the stacked view of one chart are
 *                                            outlined alike. The default stands in for an unset
 *                                            stroke only: null and "" are passed through as given -
 *                                            null removes the attribute and "" writes an invalid
 *                                            paint, both computing to none - which is how a caller
 *                                            asks for no outline.
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
 *                                            form is skipped and the band breaks around it, and the
 *                                            first such point in a render is logged as a warning.
 *                                            Setting it replaces that guard rather than composing
 *                                            with it, so an explicit predicate must test both
 *                                            bounds itself.
 * @property {function} [key]                 The key function for the data join, called with a
 *                                            layer and its index. The value it returns should be
 *                                            unique among layers. Defaults to the index, which
 *                                            matches layers by position in the array that was
 *                                            passed in, as stackedArea's does.
 *                                            Setting it preserves object constancy across renders,
 *                                            which matters when a chart switches between the
 *                                            stacked and the separated view.
 * @property {function} [valuesAccessor]      Pulls the points to draw out of one layer's datum.
 *                                            Defaults to the identity, which treats the layer
 *                                            object as the array of points itself. Set it when the
 *                                            layer objects are wrappers such as
 *                                            { name: "Name", values: [ ... ] }. It is consulted for
 *                                            the geometry and defined only: fill, stroke,
 *                                            strokeWidth and key still see the layer object, which
 *                                            is what lets the colour be read off the layer's name.
 * @property {boolean} transition             Whether to transition the layers when their values
 *                                            change. Defaults to true. An updating band eases into
 *                                            its new geometry and colours over 300ms; an entering
 *                                            band is painted synchronously (see below).
 *
 * Note: a constant dimension is coerced with unary + once, before the data join, exactly as d3's own
 * constant() would - so a numeric string works, while a value that has no numeric form, such as
 * "abc" or {}, becomes NaN once and every point of every layer is drawn from it, which d3 emits as
 * an invalid path rather than an error. Only a value whose coercion itself throws, such as a Symbol
 * or a BigInt, raises - and it raises before the join rather than once per point.
 *
 * Note: the layers are bound in the order they were given, as stackedArea binds them, so the first
 * layer of the input is the first path in the DOM and the index handed to the style accessors, to
 * key and to valuesAccessor is its position in that array. The component used to reverse the data
 * before the join - a line carrying an unanswered "//sszsch why reverse?" comment since 2017, which
 * nothing explained - which mirrored every index, applied an index-keyed palette back to front, and
 * moved both paths whenever docs/area-chart-stacked/sa-two.js toggled between the two views.
 * .join() orders the merged selection, so the paint order follows the data on every render, even
 * when the nodes are reused.
 *
 * Note: transition applies to updating bands only. An entering band is painted directly, as bar
 * does, so a freshly rendered chart is complete on the same tick rather than leaving an empty path
 * element until the first animation frame, which is what stackedArea does. A band already on screen
 * holds its old geometry and colours and eases into the new ones over 300ms. Between 47f58578
 * ("perf: change .enter() to .join() API", Oct 2024) and this fix the transition was created on its
 * own statement with its return value dropped, so it carried no tweens and every attribute was
 * written to the plain selection: nothing animated, while the schedule still interrupted whatever
 * else was animating those nodes.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke,
 * strokeWidth and valuesAccessor are called by the selection with the datum for a whole layer, that
 * layer's index, and d3's group of path nodes, with the node itself as `this`. The style-related
 * accessors therefore receive the layer object rather than a point, the inverse of what the
 * dimensions receive - the same asymmetry documented on line.
 * That third argument is the group of the half of the join being evaluated, not of the merged
 * selection: entering and updating bands are styled separately so that an entering one can be
 * painted synchronously, and d3 leaves a null hole in each half's group for every node belonging
 * to the other. A render that both reuses and enters bands therefore hands these accessors a
 * sparse ArrayLike, so an accessor that walks it - rather than reading its own datum, as the
 * first two arguments give it - has to skip the holes. key has the same caveat, below.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM.
 *
 * Note: the default defined predicate guards both vertical bounds by hand, as stackedArea and line
 * do. The expression it replaces read `function () { return fn.compose(fn.not(isNaN), props.y0) &&
 * fn.compose(...y1); }` and so returned a function rather than calling either composed accessor -
 * and a function is truthy, which is all d3 tests - so a NaN reached the d attribute verbatim, the
 * browser stopped rendering at the invalid command, and the whole band disappeared rather than only
 * the segment the missing value belonged to. The guard treats null and undefined as missing too,
 * which a plain isNaN test would not: isNaN(null) is false, so a null would coerce to 0 and be
 * plotted at the top of the chart. line, by contrast, still lets null through.
 *
 * Note: forgetting valuesAccessor for a wrapper layer produces an empty chart rather than an error,
 * because d3.area runs its datum through Array.from and that yields [] for a plain object. An
 * accessor that returns nothing instead throws out of d3.area, which names neither the component
 * nor the property.
 *
 * Note: the bands carry a `sszvis-stacked-area-path` class alongside the generic `sszvis-path` one,
 * and the data join matches only the former, so a pie wedge or a pyramid reference path left in the
 * same group is left alone. That class is shared with stackedArea on purpose - the two are the two
 * views of one chart, rendered into one group and toggled between, and the eased switch depends on
 * both joining the same path nodes - and with no other component. The generic class stays in the
 * class attribute purely as a styling hook.
 *
 * Note: nothing constrains the geometry, and nothing reports its own absence. A layer with no points
 * yields a path element with no d attribute, a single point yields a closed shape that encloses no
 * area but still draws a vertical hairline in the default stroke, and a band whose y1 lies below y0 simply
 * winds the other way. See test/component/stackedAreaMultiples.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ValueFn } from "d3";
import { type ComponentBuilder } from "../d3-component.js";
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
type KeyAccessor<L, R> = (this: Element, datum: L, index: number, group: ArrayLike<Element> | ArrayLike<L>) => R;
/** Either a constant or an accessor; the three dimensions accept both. */
type AreaValue<P> = number | PointAccessor<P, number>;
/** Either a constant or an accessor, over one whole layer. */
type StyleValue<L, R> = R | LayerAccessor<L, R>;
export interface StackedAreaMultiplesComponent<P = unknown, L = P[]> extends ComponentBuilder<StackedAreaMultiplesComponent<P, L>> {
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
    defined<Q = P>(predicate: boolean | PointAccessor<Q, boolean>): StackedAreaMultiplesComponent<P, L>;
    key(): KeyAccessor<L, string | number>;
    key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaMultiplesComponent<P, L>;
    valuesAccessor(): ValuesAccessor<L, P>;
    valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor<M, Q>): StackedAreaMultiplesComponent<P, L>;
    transition(): boolean;
    transition(enabled: boolean): StackedAreaMultiplesComponent<P, L>;
}
/**
 * As above, for the style properties. An unset property becomes a function returning null,
 * which d3 removes the attribute for - the same thing it does when handed undefined
 * directly.
 */
export default function stackedAreaMultiples<P = unknown, L = P[]>(): StackedAreaMultiplesComponent<P, L>;
export {};
//# sourceMappingURL=stackedAreaMultiples.d.ts.map