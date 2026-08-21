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
 *                                            Should return a value in screen pixels. Required, and
 *                                            its absence is not reported: an unset dimension
 *                                            resolves to a constant NaN, so every coordinate is
 *                                            written as NaN, the browser rejects the path, and the
 *                                            chart is simply empty.
 * @property {number, function} y0            An accessor for the lower bound of the band at a
 *                                            point, i.e. the baseline, or a constant. In screen
 *                                            pixels. Required. When it is missing the top line is
 *                                            still written and the baseline arrives as NaN.
 * @property {number, function} y1            An accessor for the upper bound of the band at a
 *                                            point, or a constant. In screen pixels. Required, and
 *                                            the most damaging of the three to omit because it
 *                                            renders successfully: d3 reads a null-ish upper bound
 *                                            as no upper bound and falls back to y0, so each band
 *                                            collapses onto its own baseline and becomes a
 *                                            zero-height sliver - and with no default stroke to
 *                                            draw it, there is nothing on screen. The code tests
 *                                            `props.y1 == null`, as d3 does, so an explicit null is
 *                                            read as unset too.
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
 *                                            touching bands run together, and null and "" are
 *                                            passed through as given: null removes the attribute
 *                                            and "" writes an invalid paint, both computing to
 *                                            none, which is what an unset stroke does too.
 *                                            Harmless in the separated view, where
 *                                            stackedAreaMultiplesLayout spaces the bands so they
 *                                            never touch - but since the docs example sets no
 *                                            stroke on either component, the stacked view of a
 *                                            chart gets stackedArea's white hairline while the
 *                                            separated view gets none.
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
 *                                            degenerate top-and-bottom pair. Defaults to
 *                                            `() => true`, spelled out in place of the dead
 *                                            predicate it replaces (see below), so it accepts every
 *                                            point whatever its value: this is the only
 *                                            missing-value guard available, and it has to test both
 *                                            bounds by hand because it replaces the default rather
 *                                            than composing with it.
 * @property {function} [key]                 The key function for the data join, called with a
 *                                            layer and its index. The value it returns should be
 *                                            unique among layers. Defaults to the index - which,
 *                                            because the layers are reversed first, counts from the
 *                                            end of the array that was passed in, so dropping the
 *                                            *last* layer of the input reuses the first path node
 *                                            and rebinds it to a different layer, where
 *                                            stackedArea's default key drops the last node instead.
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
 *                                            change. Defaults to true, and animates nothing (see
 *                                            below).
 *
 * Note: a constant dimension is coerced with unary + once, before the data join, exactly as d3's own
 * constant() would - so a numeric string works, while a value that has no numeric form, such as
 * "abc" or {}, becomes NaN once and every point of every layer is drawn from it, which d3 emits as
 * an invalid path rather than an error. Only a value whose coercion itself throws, such as a Symbol
 * or a BigInt, raises - and it raises before the join rather than once per point.
 *
 * Note: the layers are reversed before the data join, so the first layer of the array that was
 * passed in is the last path in the DOM and paints over the others. The line has carried an
 * unanswered "//sszsch why reverse?" comment since 2017, and nothing - not the header this replaces,
 * not docs/area-chart-stacked/README.md, not stackedAreaMultiplesLayout, which lays the bands out -
 * says why. stackedArea does not reverse, so the same datum comes out of the two components in
 * opposite order, and the toggle in docs/area-chart-stacked/sa-two.js moves every path on the
 * switch. The reversal also renumbers the layers, so the index handed to the style accessors, to
 * key and to valuesAccessor is the position in the reversed array: an index-keyed palette is
 * applied back to front here and front to back in stackedArea. The array itself is copied rather
 * than reversed in place, so a caller holding on to it - as sa-two.js does, rendering both views
 * from one datum - sees it unchanged. .join() orders the merged selection, so the paint order
 * follows the reversed data on every render, even when the nodes are reused.
 *
 * Note: transition animates nothing. The transition is created on its own statement and its return
 * value is dropped, so every attribute is written to the plain selection instead. It did animate
 * until 47f58578 ("perf: change .enter() to .join() API", Oct 2024), which dropped the `paths =`
 * the transition used to be assigned back to. As far as output goes the property is inert - the two
 * settings are indistinguishable in the DOM, before and after the 300ms the transition would have
 * taken - but it is not harmless: the transition is still scheduled, and a d3 transition interrupts
 * any unnamed transition already running on the same node when it starts, so a render freezes
 * another component's animation on a shared or adopted path mid-flight. bar carries the same
 * discarded-transition shape, though it writes its attributes before creating the transition, so its
 * elements are never blank. One visible consequence is that the switch into the separated view snaps
 * while the switch back, drawn by stackedArea, eases - the chart animates in one direction only, and
 * it is that switch the key property exists for. The one upside is that a freshly rendered chart is
 * complete on the same tick, with nothing to disable in order to measure it synchronously, where
 * stackedArea leaves an empty path element until the first animation frame.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke,
 * strokeWidth and valuesAccessor are called by the selection with the datum for a whole layer, that
 * layer's index, and d3's group of path nodes, with the node itself as `this`. The style-related
 * accessors therefore receive the layer object rather than a point, the inverse of what the
 * dimensions receive - the same asymmetry documented on line.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM. That node
 * group is in the reversed order the previous render left it in, so the two halves of the join agree
 * only because the reversal is applied on every render.
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
 * NaN", a guard that has never run, and the header this replaces did not mention defined at all.
 *
 * Note: forgetting valuesAccessor for a wrapper layer produces an empty chart rather than an error,
 * because d3.area runs its datum through Array.from and that yields [] for a plain object. An
 * accessor that returns nothing instead throws out of d3.area, which names neither the component
 * nor the property.
 *
 * Note: the data join matches on the generic .sszvis-path class, which pie, stackedArea and
 * stackedPyramid also use. A path another component left in the same group is bound to a layer and
 * repainted as an area rather than being left alone, and since every attribute here is written
 * unconditionally - an unset fill or stroke is written as null, which d3 reads as a removal - the
 * foreign path loses the colours it came with. Harmless while each component owns its own
 * selectGroup, which is how every example is written. The same collision corrupts pie's own
 * geometry when it is read from the other side.
 *
 * Note: nothing constrains the geometry, and nothing reports its own absence. A layer with no points
 * yields a path element with no d attribute, a single point yields a closed shape that encloses no
 * area and, with no default stroke, draws nothing at all, and a band whose y1 lies below y0 simply
 * winds the other way. With no props set at all the render still reports success - one correctly
 * classed path per layer, with neither fill nor stroke written and every coordinate NaN - so the DOM
 * looks healthy for a chart that is entirely empty. Binding a datum that is not iterable throws
 * "data is not iterable" out of the reversal, before the join. See
 * test/component/stackedAreaMultiples.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ValueFn } from "d3";
import { type Component } from "../d3-component.js";
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
    defined<Q = P>(predicate: boolean | PointAccessor<Q, boolean>): StackedAreaMultiplesComponent<P, L>;
    key(): KeyAccessor<L, string | number>;
    key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaMultiplesComponent<P, L>;
    valuesAccessor(): ValuesAccessor<L, P>;
    valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor<M, Q>): StackedAreaMultiplesComponent<P, L>;
    transition(): boolean;
    transition(enabled: boolean): StackedAreaMultiplesComponent<P, L>;
}
export default function <P = unknown, L = P[]>(): StackedAreaMultiplesComponent<P, L>;
export {};
//# sourceMappingURL=stackedAreaMultiples.d.ts.map