/**
 * @module sszvis/layout/sankey
 *
 * A module of helper functions for computing the data structure
 * and layout required by the sankey component.
 *
 * Behaviour notes:
 * - prepareData's source, target and value accessors are required; a builder missing one throws
 *   when it is applied.
 * - a link with an unknown source or target id is warned about and dropped, so the returned
 *   links array holds only links.
 * - computeLayout's per-column padding and pixels-per-unit are each reduced to a minimum across
 *   all columns, but a degenerate column contributes the largest candidate in both cases, so it
 *   is discarded by the minimum rather than distorting the others.
 * - computeLayout returns a zeroed layout for a diagram with no columns, no room, or no
 *   values at all.
 */
import type { SankeyLink, SankeyNode } from "../component/sankey.js";
/** A node as this module builds it: every link list is present, unlike the component's view. */
type PreparedNode = SankeyNode & {
    linksFrom: SankeyLink[];
    linksTo: SankeyLink[];
};
/** What prepareData returns. */
export type SankeyPreparedData = {
    nodes: PreparedNode[];
    /** One entry per valid input row; rows with an unknown source or target are dropped. */
    links: SankeyLink[];
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
    /** The size of the flow. A string is coerced with Number(); an unparseable or negative
     * value is warned about and the row is dropped. */
    value(func: (d: T) => number | string): SankeyDataPreparation<T>;
    descendingSort(): SankeyDataPreparation<T>;
    ascendingSort(): SankeyDataPreparation<T>;
    idLists(idLists: string[][]): SankeyDataPreparation<T>;
}
export type SankeyComputedLayout = {
    valuePadding: number;
    nodePadding: number;
    columnPaddings: number[];
    valueDomain: [number, number];
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
 * - source, target and value are required accessors; a builder missing one throws when it is
 *   applied, rather than looking the raw row up as a node id.
 * - a link whose source or target id is not in idLists is warned about and dropped from the
 *   returned links array.
 * - a link's id is the index of the row it came from, so re-preparing the same data gives the
 *   same links the same ids and the component's data join can match them up.
 * - a duplicate id warns and keeps only the last column.
 * - a row whose value is not a number of zero or more is warned about and dropped.
 * - a link whose two ends are in the same column is warned about and dropped: a sankey link
 *   runs between columns.
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
 *   minimum across the columns is used for all of them. A single-node column draws no gaps, so
 *   it has no padding to contribute and is left out of that minimum; a diagram whose columns
 *   all hold one node has no padding at all.
 * - pixels-per-unit is the minimum across the columns of the non-padding pixels divided by the
 *   column total. A column total of 0 contributes Infinity, which the minimum discards unless
 *   every total is 0; a diagram whose columns are all empty is zeroed instead.
 * - columnRange is the per-step offset, computed as (columnWidth - nodeThickness) /
 *   (numColumns - 1). Fewer than two columns have no step at all and report an offset of 0.
 * - nodeThickness is always 20.
 * - A diagram with no columns, no room or no values at all comes back zeroed; a negative
 *   height or width, or a negative or fractional column length, throws.
 */
export declare const computeLayout: (columnLengths: number[], columnTotals: number[], columnHeight: number, columnWidth: number) => SankeyComputedLayout;
export {};
//# sourceMappingURL=sankey.d.ts.map