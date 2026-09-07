/**
 * Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is typically one object holding both sides of the
 * pyramid - all the component requires is that the side accessors return arrays. Each
 * series is then rendered by its own bar component, the left one mirrored across the spine,
 * so every bar dimension is read from the same accessors on both sides.
 *
 * The component always creates four sub-groups, in this order: left, right, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint
 * over the bars, and the reference groups are created even when no reference accessor is
 * configured.
 *
 * @module sszvis/component/pyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the datum bound to the chart layer
 * @template D The type of one bar's datum, i.e. the elements of each side's series
 *
 * @property {string, function} [barFill]          The color of a bar. Defaults to #000 and applies to both
 *                                                 sides; a per-datum accessor is the usual way to colour the
 *                                                 two sides differently.
 * @property {number, function} barHeight          The height of a bar, in pixels. Required: an unset
 *                                                 property throws "[pyramid] the barHeight property is
 *                                                 required" before anything is rendered.
 * @property {number, function} barWidth           The width of a bar, in pixels. Required, same error
 *                                                 shape as barHeight. The component computes the left
 *                                                 bar's x itself, as -SPINE_PADDING - barWidth(d, i),
 *                                                 forwarding d3's index so an index-aware accessor
 *                                                 positions the mirrored bars as it sizes them.
 * @property {number, function} barPosition        The vertical position of a bar, i.e. its top edge, in
 *                                                 pixels. Required, same error shape as barHeight.
 * @property {Array<Number>} [tooltipAnchor]       The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars.
 *                                                 The value is handed to both bars unchanged rather than being
 *                                                 mirrored, and bar measures from its own upper left corner, so
 *                                                 any x other than 0.5 lands on visually opposite sides of the
 *                                                 pyramid. An array with fewer than two entries yields a NaN
 *                                                 coordinate, as documented on bar.
 * @property {function}         leftAccessor       Data for the left side. Required, same error shape as
 *                                                 barHeight. An accessor that returns undefined or null
 *                                                 still throws from d3's data join, since a side with no
 *                                                 data is a broken chart rather than an empty one.
 * @property {function}         rightAccessor      Data for the right side. Same requirements as leftAccessor.
 * @property {function}         [leftRefAccessor]  Reference data for the left side, drawn as a single path
 *                                                 outlining the reference series. Optional in both senses:
 *                                                 the accessor may be unset, and an accessor that returns
 *                                                 no data for some state renders no line for that state.
 *                                                 undefined and null are warned about, since they violate
 *                                                 the accessor's contract; an empty array is treated as a
 *                                                 legitimately empty series and passes silently.
 * @property {function}         [rightRefAccessor] Reference data for the right side. Same as leftRefAccessor.
 *
 * Note: a reference point sits at the outer edge of the bar it describes, vertically
 * centred on it: x is SPINE_PADDING + barWidth, matching the bar's own outer edge, and y is
 * barPosition + barHeight / 2, the bar's mid-line. Both sides share the same generator; the
 * left one is mirrored with a scale(-1, 1) transform.
 *
 * Note: an entering reference path gets its d attribute synchronously, so getBBox, snapshots
 * and PNG exports see real geometry on the tick it is rendered. Updates are additionally
 * written through a transition, so a change of data eases into place. The bars underneath
 * animate over the same duration, so the outline and the bars it describes stay together for
 * the length of the transition.
 *
 * Note: a reference series with no points renders no path at all, and a path already in the
 * DOM is removed when its series goes away. Each side is still capped at a single line, since
 * the series is wrapped in a one-element array before the join.
 *
 * Note: the reference line skips points whose barWidth or barPosition is not a finite number,
 * so a gap in the reference series breaks the outline at the gap rather than truncating it,
 * the way bar's own missing-value guard keeps the bars drawable.
 *
 * Note: the reference line's appearance comes entirely from the
 * .sszvis-pyramid__referenceline rule in sszvis.css - the component sets only the class.
 * Without that stylesheet the path renders as a solid black shape, since fill defaults to
 * black. stackedPyramid's otherwise identical line component inlines the same four values
 * instead. See test/component/pyramid.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ComponentBuilder } from "../d3-component.js";
/**
 * The bar dimensions are wrapped by fn.functor on set, so they are always stored as
 * functions by the time the renderer reads them. The parameters are variadic because d3
 * calls them with the datum, the index and the group - except on the left side, where the
 * component calls barWidth itself with the datum alone.
 */
type ValueAccessor<D, R> = (datum: D, index: number) => R;
/**
 * Pulls one side's series out of the chart's datum. Unlike the bar dimensions these are
 * stored exactly as they were set, so they are always functions, and the datum they read
 * is whatever the caller bound to the chart layer.
 */
type SideAccessor<T, D> = (data: T) => D[];
/**
 * How a bar dimension reads back once it is stored. Both parameters are optional because a
 * constant becomes a functor that ignores its arguments, and because the component calls
 * barWidth itself with the datum alone when placing the left bars.
 */
type StoredAccessor<D, R> = (datum?: D, index?: number) => R;
/**
 * A constant or an accessor over one bar's datum; either is accepted for the bar
 * dimensions, since fn.functor normalises both.
 */
type PyramidValue<D, R> = R | ValueAccessor<D, R>;
export interface PyramidComponent<T = unknown, D = unknown> extends ComponentBuilder<PyramidComponent<T, D>> {
    barHeight(): StoredAccessor<D, number>;
    barHeight<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barWidth(): StoredAccessor<D, number>;
    barWidth<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barPosition(): StoredAccessor<D, number>;
    barPosition<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barFill(): StoredAccessor<D, string | undefined>;
    barFill<V = D>(value: PyramidValue<V, string | undefined>): PyramidComponent<T, D>;
    tooltipAnchor(): (number | string)[];
    tooltipAnchor(anchor: (number | string)[]): PyramidComponent<T, D>;
    leftAccessor(): SideAccessor<T, D>;
    leftAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    rightAccessor(): SideAccessor<T, D>;
    rightAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    leftRefAccessor(): SideAccessor<T, D> | undefined;
    leftRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    rightRefAccessor(): SideAccessor<T, D> | undefined;
    rightRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
}
export default function pyramid<T = unknown, D = unknown>(): PyramidComponent<T, D>;
export {};
//# sourceMappingURL=pyramid.d.ts.map