/**
 * @module sszvis/layout/sunburst
 *
 * Helper functions for transforming your data to match the format required by the sunburst chart.
 *
 * Behaviour notes:
 * - computeLayout does not validate its inputs and can silently produce a layout that
 *   overflows or under-fills the chart; see the notes on computeLayout below.
 * - prepareData is deprecated but is still the only builder that produces the partition
 *   positions (x0/x1/y0/y1) that getRadiusExtent reads. The sunburst component accepts either:
 *   handed a plain hierarchy it runs d3.partition itself.
 */
import { type HierarchyNode, type HierarchyRectangularNode } from "d3";
import { type NodeDatum } from "./hierarchy.js";
/**
 * A node of the prepared hierarchy after d3.partition has written its positions onto it.
 * d3's own rectangular-node type is used so that parent, children and descendants() carry the
 * coordinates too, which partition() places on every node of the tree.
 */
export type SunburstNode<T = unknown> = HierarchyRectangularNode<NodeDatum<T>>;
/** The chained builder returned by the deprecated prepareData. */
export type SunburstDataBuilder<T = unknown> = {
    calculate: (data: T[]) => SunburstNode<T>[];
    layer: (keyFunc: (d: T) => string | null | undefined) => SunburstDataBuilder<T>;
    value: (accfn: (d: T) => number) => SunburstDataBuilder<T>;
    sort: (sortFunc: (a: HierarchyNode<NodeDatum<T>>, b: HierarchyNode<NodeDatum<T>>) => number) => SunburstDataBuilder<T>;
};
export type SunburstLayout = {
    centerRadius: number;
    numLayers: number;
    ringWidth: number;
};
/**
 * sszvis.layout.sunburst.prepareData
 *
 * @deprecated since v3.4.0 - use sszvis.layout.hierarchy.prepareHierarchyData instead
 *
 * Behaviour notes:
 * - Deprecated in favour of prepareHierarchyData, but prepareHierarchyData alone does not run
 *   d3.partition, so its nodes have no x0/x1/y0/y1 and cannot be passed to getRadiusExtent. The
 *   sunburst component itself takes either form, partitioning a plain hierarchy on the fly.
 * - The root node is dropped from the returned flat array.
 */
export declare const prepareData: <T = unknown>() => SunburstDataBuilder<T>;
export declare const MAX_SUNBURST_RING_WIDTH = 60;
export declare const MIN_SUNBURST_RING_WIDTH = 10;
/**
 * sszvis.layout.sunburst.computeLayout
 *
 * Computes layout parameters for good visual display of the sunburst chart.
 *
 * @param  {Number} numLayers          The number of layers in the sunburst chart.
 * @param  {Number} chartWidth         The total width available for displaying the sunburst chart.
 * @return {Object}                    Some parameters for the sunburst chart:
 *       @property {Number} centerRadius      The central radius of the chart (used by the sunburst component)
 *       @property {Number} numLayers         The number of layers in the chart (used by the sunburst component)
 *       @property {Number} ringWidth         The width of a single ring in the chart (used by the sunburst component)
 *
 * Behaviour notes:
 * - centerRadius is always chartWidth / 6.
 * - ringWidth is the remaining radius divided by numLayers, clamped to [10, 60].
 * - Because the clamp does not feed back into centerRadius, a deep hierarchy in a narrow
 *   chart overflows (centerRadius + ringWidth * numLayers can exceed chartWidth / 2, which
 *   is exactly the outer radius the sunburst component draws, per docs/sunburst/basic.js),
 *   and a shallow one leaves empty space.
 * - numLayers === 0 divides by zero and the resulting Infinity is masked by the 60px cap.
 * - A negative numLayers or a zero/negative chartWidth is not validated (the 10px floor
 *   hides the negative ring width).
 */
export declare const computeLayout: (numLayers: number, chartWidth: number) => SunburstLayout;
/**
 * sszvis.layout.sunburst.getRadiusExtent
 * @param  {Array} formattedData      An array of data to inspect for the extent of the radius scale
 *
 * @return {Array}                    The minimum and maximum radius values (in d3's partition layout's terms). Use this as
 *                                    The domain of the radius scale you use to configure the sunburst chart. This is a convenience
 *                                    function which abstracts away the way d3 stores positions within the partition layout used
 *                                    by the sunburst chart.
 *
 * Behaviour notes:
 * - Returns [min y0, max y1] taken independently of each other.
 * - d3.min/max skip undefined and NaN nodes.
 * - An empty array gives [undefined, undefined], which produces a NaN radius when used as
 *   a scale domain.
 */
export declare const getRadiusExtent: (formattedData: Array<{
    y0?: number;
    y1?: number;
}>) => [number | undefined, number | undefined];
//# sourceMappingURL=sunburst.d.ts.map