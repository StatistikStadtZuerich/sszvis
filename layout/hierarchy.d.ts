import { type HierarchyNode } from "d3";
export type NodeDatum<T> = {
    _tag: "root";
    children: NodeDatum<T>[];
} | {
    _tag: "branch";
    key: string;
    rootKey: string;
    children: NodeDatum<T>[];
} | {
    _tag: "leaf";
    key: string;
    rootKey: string;
    data: T;
};
/**
 * sszvis.prepareHierarchyData
 *
 * Creates a data preparation layout, with an API that works similarly to d3's configurable layouts.
 * Can be used in two ways:
 * 1. Chained API (like sunburst): prepareData().layer().value().size().calculate(data)
 * 2. Options API (backward compatibility): prepareData(data, options)
 *
 * @property {Array} calculate      Accepts an array of data, and applies this layout to that data. Returns the formatted dataset,
 *                                  ready to be used as data for the treemap component.
 * @property {Function} layer       Accepts a function, which should be a key function, used to create a layer for the data.
 *                                  The key function is applied to each datum, and the return value groups that datum within a
 *                                  layer of the treemap chart. The exact behavior depends on the order in which layers are specified.
 *                                  The first specified layer will be the outermost one of the treemap, with subsequent layers adding
 *                                  further subdivision. Data are grouped according to the first layer, then the second layer, then the third, etc.
 *                                  This uses d3.rollup under the hood, and applies the key function to group the data hierarchically.
 * @property {Function} value       The function which retrieves the value of each datum. This is required in order to calculate the size of
 *                                  the rectangle for each datum.
 * @property {Array} size           Set the size [width, height] of the treemap layout.
 * @property {Function} sort        Provide a sorting function for sibling nodes of the treemap.
 *                                  It receives two node values (which are created by d3), which should have at least a "key" property
 *                                  (corresponding to the layer key), and a "value" property (corresponding to the value amount of the rectangle).
 *                                  Otherwise, it behaves like a normal javascript array sorting function. The default value attempts to preserve the
 *                                  existing sort order of the data.
 *
 * @return {Function}               The layout function. Can be called directly or you can use '.calculate(dataset)'.
 */
export type HierarchyComponent<T = unknown> = {
    calculate: (data: T[]) => HierarchyNode<NodeDatum<T>>;
    layer: (accessor: (d: T) => string | null | undefined) => HierarchyComponent<T>;
    value: (accessor: (d: T) => number) => HierarchyComponent<T>;
    sort: (sortFunc: (a: HierarchyNode<NodeDatum<T>>, b: HierarchyNode<NodeDatum<T>>) => number) => HierarchyComponent<T>;
};
export declare function prepareHierarchyData<T = unknown>(): HierarchyComponent<T>;
export declare function prepareHierarchyData<T = unknown>(data: T[], options: {
    layers: Array<(d: T) => string | null | undefined>;
    valueAccessor: (d: T) => number;
}): HierarchyNode<NodeDatum<T>>;
/**
 * Helper function to safely unwrap nested rollup data.
 * Handles uneven tree structures where some branches terminate earlier than others.
 * When a layer accessor returns null, the node will use its parent's key as a fallback
 * to ensure labels remain functional.
 *
 * @param roll - The nested Map structure from d3.rollup()
 * @param parentKey - The key of the parent node (used as fallback for null keys)
 * @param rootKey - The top-level category key (used for color mapping)
 * @returns Array of NodeDatum objects representing the hierarchy
 */
export declare function unwrapNested<T>(roll: Map<string, unknown> | unknown, parentKey?: string | null, rootKey?: string | null): NodeDatum<T>[];
//# sourceMappingURL=hierarchy.d.ts.map