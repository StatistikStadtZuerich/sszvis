/**
 * @module sszvis/layout/sankey
 *
 * A module of helper functions for computing the data structure
 * and layout required by the sankey component.
 *
 * Behaviour notes:
 * - prepareData's source/target/value accessors default to fn.identity, which only matches when
 *   the rows are themselves the id strings; for the object rows this layout is built around, no
 *   link ever matches a node id.
 * - a link with an unknown source or target id becomes a null entry left in the returned links
 *   array. Any such null throws a TypeError from the value sort as soon as a second link exists,
 *   valid or not; a sole invalid row survives only because sort skips a one-element array.
 * - link ids come from a module-level counter shared across every builder instance, so they
 *   are unique but not stable between renders.
 * - a negative link value clamps away at the node (node.value is Math.max(0, ...)) but stays
 *   on the link, so the link stack runs outside its node.
 * - computeLayout's per-column padding and pixels-per-unit are each reduced to a minimum across
 *   all columns, but a degenerate column contributes the largest candidate in both cases, so it
 *   is discarded by the minimum rather than distorting the others.
 * - a single-column diagram gives computeLayout's columnRange an Infinity step (issue #120);
 *   an empty column list gives a negative step and NaN/undefined elsewhere.
 */
import type { SankeyLink, SankeyNode } from "../component/sankey.js";
/** A node as this module builds it: every link list is present, unlike the component's view. */
type PreparedNode = SankeyNode & {
    linksFrom: SankeyLink[];
    linksTo: SankeyLink[];
};
/** What prepareData returns. Links can contain nulls; see the module's behaviour notes. */
export type SankeyPreparedData = {
    nodes: PreparedNode[];
    /** One entry per input row. An invalid row leaves a null behind - see the behaviour notes. */
    links: (SankeyLink | null)[];
    columnTotals: number[];
    columnLengths: number[];
};
/**
 * The data preparation builder. It is callable, and also exposes `apply` as an alias, which
 * shadows Function.prototype.apply - see the behaviour notes.
 */
export interface SankeyDataPreparation<T = unknown> {
    (inputData: T[]): SankeyPreparedData;
    apply(data: T[]): SankeyPreparedData;
    /** The id of the link's source node. Must be one of the ids passed to idLists. */
    source(func: (d: T) => string): SankeyDataPreparation<T>;
    /** The id of the link's target node. Must be one of the ids passed to idLists. */
    target(func: (d: T) => string): SankeyDataPreparation<T>;
    /** The size of the flow. A string is coerced with Number(); anything unparseable becomes 0. */
    value(func: (d: T) => number | string): SankeyDataPreparation<T>;
    descendingSort(): SankeyDataPreparation<T>;
    ascendingSort(): SankeyDataPreparation<T>;
    idLists(idLists: string[][]): SankeyDataPreparation<T>;
}
export type SankeyComputedLayout = {
    valuePadding: number;
    /** undefined when there are no columns at all - see the behaviour notes. */
    nodePadding: number | undefined;
    columnPaddings: number[];
    /** The upper bound is undefined when there are no columns at all. */
    valueDomain: [number, number | undefined];
    valueRange: [number, number];
    nodeThickness: number;
    columnDomain: [number, number];
    columnRange: [number, number];
};
/**
 * sszvis.layout.sankey.prepareData
 *
 * Returns a data preparation component for the sankey data.
 *
 * Throughout the code, the rectangles representing entities are referred to as 'nodes', while
 * the chords connection them which represent flows among those entities are referred to as 'links'.
 *
 * @property {Array} apply                    Applies the preparation to a dataset of links. Expects a list of links, where the (unique) id
 *                                            of the source node can be accessed with the source function, and the (unique) id of the target
 *                                            can be accessed with the target function. Note that no source can have the same id as a target and
 *                                            vice versa. The nodes are defined implicitly by the fact that they have a link going to them or
 *                                            from them.
 * @property {Function} source                An accessor function for getting the source of a link
 * @property {Function} target                An accessor function for getting the target of a link
 * @property {Function} value                 An accessor function for getting the value of a link. Must be a number. The total value of a node
 *                                            is the greater of the sum of the values of its sourced links and its targeting links.
 * @property {} descendingSort                Toggles the use of a descending value sort for the nodes
 * @property {} ascendingSort                 Toggles the use of an ascending value sort for the nodes
 * @property {Array(Array)} idLists           An array of arrays of id values. For each array of ids, the sankey diagram will create a column
 *                                            of nodes. Each node should have links going to it or coming from it. All ids should be unique.
 *
 * @return {Function}                         The data preparation function. Can be called directly, or applied using the '.apply' function.
 *         When called, returns an object with data to be used in constructing the chart.
 *               @property {Array} nodes             An array of node data. Each one will become a rectangle in the sankey
 *               @property {Array} links             An array of link data. Each one will become a path in the sankey
 *               @property {Array} columnTotals      An array of column totals. Needed by the computeLayout function (and internally by the sankey component)
 *               @property {Array} columnLengths     An array of column lengths (number of nodes). Needed by the computeLayout function.
 *
 * Behaviour notes:
 * - source/target/value default to fn.identity, which only matches when a row is itself the id
 *   string; omitting them makes every link invalid for the usual object rows.
 * - a link whose source or target id is not in idLists is warned about and replaced by null, and
 *   the null stays in the returned links array. Any null throws a TypeError from the value sort
 *   once a second link exists, valid or not; a sole invalid row survives only because sort skips
 *   a one-element array.
 * - link ids come from a module-level counter shared by every builder instance, so they are
 *   unique but not stable across renders.
 * - a duplicate id warns and keeps only the last column.
 * - a non-numeric value silently becomes 0; a negative value is kept on the link but clamped
 *   away at the node (node.value is Math.max(0, from, to)), so the link stack runs outside
 *   its node.
 * - nothing checks that the two ends of a link are in different columns.
 * - the builder's `apply` shadows Function.prototype.apply; call it as builder.apply(data)
 *   or builder(data).
 * - nodes are sorted across all columns at once (descending by default), then offsets are
 *   assigned per column.
 */
export declare const prepareData: <T = unknown>() => SankeyDataPreparation<T>;
/**
 * sszvis.layout.sankey.computeLayout
 *
 * Automatically computes visual display properties needed by the sankey component,
 * including padding between each node, paddings for the tops of columns to vertically center
 * them, the domain and range of values in the nodes (used for scaling the node rectangles),
 * the node thickness, and the domain and range of the column positioning scale.
 *
 * @param  {Array} columnLengths      An array of lengths (number of nodes) of each column in the diagram.
 *                                    Used to compute optimal padding between nodes. Provided by the layout.sankey.prepareData function
 * @param  {Array} columnTotals       An array of column totals (total of all values of all ndoes). Provided by the
 * @param  {Number} columnHeight      The vertical height available for the columns. The tallest column will be this height. (Usually bounds.innerHeight)
 * @param  {Number} columnWidth       The width of all columns. The sankey chart will be this width. (Usually bounds.innerWidth)
 * @return {Object}                   An object of configuration parameters to be passed to the sankey component
 *         @property {Number} nodePadding         The amount of padding to add between nodes. pass to component.sankey.nodePadding
 *         @property {Array} columnPaddings       An array of padding values for each column. Index into this with the columnIndex and return to component.sankey.columnPadding
 *         @property {Array} valueDomain          The domain for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
 *         @property {Array} valueRange           The range for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
 *         @property {Number} nodeThickness       The thickness of nodes. Pass to component.sankey.nodeThickness
 *         @property {Array} columnDomain         The domain for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
 *         @property {Array} columnRange          The range for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
 *
 * Behaviour notes:
 * - padding is (columnHeight * 0.15) / (nodes - 1) per column, clamped to [12, 50], and the
 *   minimum across the columns is used for all of them. A single-node column divides by zero and
 *   contributes a phantom 50px candidate, but 50 is the cap, so that candidate only wins when
 *   every column is at 50 anyway - it never shrinks another column.
 * - pixels-per-unit is the minimum across the columns of the non-padding pixels divided by the
 *   column total. A column total of 0 contributes Infinity, which the minimum discards unless
 *   every total is 0; in that case the value range comes back [0, NaN].
 * - columnRange is the per-step offset, computed as (columnWidth - nodeThickness) /
 *   (numColumns - 1); a single column gives Infinity (issue #120) and an empty column list
 *   gives a negative step, an undefined nodePadding and NaN elsewhere.
 * - nodeThickness is always 20.
 */
export declare const computeLayout: (columnLengths: number[], columnTotals: number[], columnHeight: number, columnWidth: number) => SankeyComputedLayout;
export {};
//# sourceMappingURL=sankey.d.ts.map