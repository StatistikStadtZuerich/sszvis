/**
 * Sunburst component
 *
 * This component renders a sunburst diagram, which is kind of like a layered pie chart. There is an
 * inner ring of values, which are total values for some large category. Each of these categories can
 * be broken down into smaller categories, which are shown in another layer around the inner ring. If these
 * categories can in turn be broken down into smaller ones, you can add yet another layer. The result
 * is a hierarchical display with the level of aggregation getting finer and finer as you get further
 * from the center of the chart.
 *
 * This component can accept either:
 * 1. Pre-processed flat sunburst data (backwards compatibility)
 * 2. Raw hierarchical data from prepareHierarchyData() (recommended)
 *
 * When using raw hierarchical data, the component will automatically apply the partition layout
 * and flatten the data internally.
 *
 * @module sszvis/component/sunburst
 * @template T The type of the original flat data objects
 *
 * @property {Function} angleScale              Scale function for the angle of the segments of the
 *                                              sunburst chart. The domain should usually be [0, 1]
 *                                              and the range [0, 2 * PI]. These are used as
 *                                              defaults: the factory installs a fresh
 *                                              scaleLinear().range([0, 2 * Math.PI]) on every call,
 *                                              so the property is optional. It is called with a
 *                                              node's x0 and x1, which are positions in the scale's
 *                                              domain and not radians. Both endpoints are then
 *                                              clamped independently into [0, 2 * PI], so a
 *                                              position outside the domain saturates rather than
 *                                              wrapping, and a node whose x1 is below its x0 sweeps
 *                                              backwards over its neighbours.
 * @property {Function} radiusScale             Scale function for the radius of segments. Can be
 *                                              configured using values returned from
 *                                              sszvis.layout.sunburst.computeLayout. See the
 *                                              examples for how the scale setup works. Required,
 *                                              with no default. It is called with y0 and y1, again
 *                                              positions in its own domain rather than pixels, and
 *                                              a negative result is clamped to 0, which collapses
 *                                              the ring onto the centre circle. The first thing to
 *                                              call it is the tooltip anchor's position accessor,
 *                                              so an unset scale throws "props.radiusScale is not a
 *                                              function" after the arcs and their transition have
 *                                              already been scheduled, and that transition then
 *                                              re-throws on every frame for 300ms.
 * @property {Number} centerRadius              The radius of the center of the chart. Can be
 *                                              configured with
 *                                              sszvis.layout.sunburst.computeLayout. Required, but
 *                                              it is only ever added to a number, so leaving it out
 *                                              fails silently instead of throwing the way an unset
 *                                              radiusScale does: every radius becomes NaN, the arcs
 *                                              degenerate to "M0,0Z" and every tooltip anchor keeps
 *                                              an unparseable transform, which the browser drops,
 *                                              leaving them all at the group's origin.
 * @property {Function} fill                    Function that returns the fill color for the
 *                                              segments in the center of the chart. Note that this
 *                                              will only be called on the centermost segments. The
 *                                              segments which are subcategories of these center
 *                                              segments will have their fill determined
 *                                              recursively, by lightening the color of its parent
 *                                              segment. It is called with a node's key string, not
 *                                              with the node. Required, and it has to be a
 *                                              function: it is neither wrapped in fn.functor nor
 *                                              normalised, so a constant colour throws "props.fill
 *                                              is not a function", and so does leaving it unset.
 *                                              Every ring further out multiplies its parent's
 *                                              lightness by 1.15, which is never clamped, so the
 *                                              colours run towards white from the inside out and
 *                                              saturate. Siblings therefore share a colour, since
 *                                              it depends only on the top-level ancestor's key and
 *                                              on the depth.
 * @property {Color, Function} stroke           The stroke color of the segments. Defaults to white.
 *                                              Takes a constant or an accessor, and an accessor is
 *                                              handed to d3 untouched, so it is called with the
 *                                              element as its receiver and with d3's index and
 *                                              group arguments.
 *
 * Note: the component accepts either a hierarchy or an array of already flattened nodes. A
 * hierarchy is re-partitioned in place on every render, always to the partition layout's default
 * [1, 1] size, so any layout the caller applied is discarded, the radius scale's domain is always
 * expressed in fractions, and the innermost band belongs to the invisible root: with n layers the
 * first visible ring starts at 1/(n+1), not at 0. An array is passed through untouched, so it can
 * be positioned by hand. Both the root filter and the colour lookup key off the `_tag` that
 * prepareHierarchyData writes, so a plain d3.hierarchy keeps its root as a full-circle arc and
 * takes every colour from the root's key; the component warns once per node and renders anyway.
 *
 * Note: only x0 and x1 are interpolated, and the geometry exists only from the first animation
 * frame, since `d` is written by the arc tween alone and there is no transition property to opt out
 * of - a chart serialised on the render tick is blank. The radii and the colours are not
 * interpolated at all and snap to their new values. The angle handover matches the old arcs by
 * index, so an arc that did not exist a render ago starts at its destination, and exits are removed
 * with no transition.
 *
 * Note: the component keeps no state of its own. It writes x0/x1 (the positions currently on
 * screen) and _x0/_x1 (the positions the running transition is heading for) onto every node it
 * renders, so the data has to be mutable - frozen data throws - and re-rendering the same hierarchy
 * object skips the animation, because the re-partition overwrites the positions the tween was
 * starting from.
 *
 * Note: the tooltip anchors are rendered from the datum bound to the group rather than from the
 * flattened array, so a hierarchy gets one anchor per node including the root, which has no arc and
 * no key, and in breadth-first order while the arcs are depth-first. They are positioned from the
 * pre-transition angles and are never repositioned when the transition ends, so after an update
 * they describe the previous layout. See test/component/sunburst.test.ts.
 *
 * @return {sszvis.component}
 */
import { type HierarchyNode, type HierarchyRectangularNode } from "d3";
import { type Component } from "../d3-component.js";
import type { NodeDatum } from "../layout/hierarchy.js";
/**
 * A node of the hierarchy, positioned by d3's partition layout. The component adds _x0 and _x1
 * to it: the destination positions of the running transition, while x0 and x1 hold the ones
 * currently on screen. Both pairs live on the datum rather than on the component, because d3
 * cannot interpolate an arc path directly - the same arrangement pie uses for its a0/a1, except
 * that these are positions in the angle scale's domain rather than radians. They are optional
 * here because the caller's data does not carry them until the first render.
 */
export type SunburstNode<T = unknown> = HierarchyRectangularNode<NodeDatum<T>> & {
    _x0?: number;
    _x1?: number;
};
/** The same node once the render has stamped its destination angles onto it. */
export type PositionedNode<T = unknown> = SunburstNode<T> & {
    _x0: number;
    _x1: number;
};
/**
 * Both scales are only ever called, never inspected, so this is all the component needs. A
 * d3 scale satisfies it - which is what the JSDoc and the examples suggest passing - and so
 * does a bare function.
 */
export type SunburstScale = (value: number) => number;
/**
 * fill is called with a node's key, not with the node, and only for the segments of the
 * innermost ring - every ring further out derives its colour from its parent's. It is not
 * wrapped in fn.functor, so a constant colour is not accepted.
 */
export type FillAccessor = (key: string) => string;
/**
 * stroke accepts a constant or an accessor and is not normalised on set - the accessor is
 * handed to d3 as it stands, so it is called with d3's receiver and arguments. Returning
 * null leaves the attribute off; d3 reads a returned undefined the same way, but the narrower
 * spelling is what its own attr typings accept, and the two are interchangeable here.
 */
export type StrokeAccessor<T = unknown> = (this: SVGPathElement, d: PositionedNode<T>, i: number, group: ArrayLike<SVGPathElement>) => string | null;
export type StrokeValue<T = unknown> = string | StrokeAccessor<T>;
/**
 * The getters return whatever was last set. radiusScale, centerRadius and fill have no
 * defaults and are all required for a render to succeed, so their getters report the
 * undefined the props actually hold.
 */
export interface SunburstComponent<T = unknown> extends Component {
    angleScale(): SunburstScale;
    angleScale(scale: SunburstScale): SunburstComponent<T>;
    radiusScale(): SunburstScale | undefined;
    radiusScale(scale: SunburstScale): SunburstComponent<T>;
    centerRadius(): number | undefined;
    centerRadius(radius: number): SunburstComponent<T>;
    fill(): FillAccessor | undefined;
    fill(fill: FillAccessor): SunburstComponent<T>;
    stroke(): StrokeValue<T>;
    stroke<U = T>(stroke: StrokeValue<U>): SunburstComponent<T>;
}
/**
 * The input the render accepts: a hierarchy, which it partitions itself, or an array that has
 * already been partitioned and flattened - what the deprecated sszvis.layout.sunburst
 * prepareData returns. Of an array's nodes the render only reads data, parent and the four
 * positions, but the type asks for whole nodes, since that is what prepareData hands back.
 */
export type SunburstData<T = unknown> = HierarchyNode<NodeDatum<T>> | SunburstNode<T>[];
export default function <T = unknown>(): SunburstComponent<T>;
//# sourceMappingURL=sunburst.d.ts.map