import { hierarchy, rollup, type HierarchyNode } from "d3";
import * as fn from "../fn";

// Type definitions for hierarchical data structure
export interface NestedData<T> {
  key: string;
  values?: NestedData<T>[];
  value?: T;
}
interface TreemapRootData<T> {
  isRoot: true;
  values: NestedData<T>[];
}
export type HierarchicalData<T> = NestedData<T> | TreemapRootData<T>; // TreemapNode represents a node in the treemap after D3 layout computation

export type TreemapNode<T = unknown> = HierarchyNode<HierarchicalData<T>> & {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  value: number;
  data?: T;
  depth: number;
  height: number;
}; /**
 * sszvis.layout.treemap.prepareData
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
// Interface for the chained prepareData constructor

export interface HierarchyComponent<T = unknown> {
  calculate: (data: T[]) => HierarchyNode<HierarchicalData<T>>;
  layer: (accessor: (d: T) => string) => HierarchyComponent<T>;
  value: (accessor: (d: T) => number) => HierarchyComponent<T>;
  sort: (
    sortFunc: (
      a: HierarchyNode<HierarchicalData<T>>,
      b: HierarchyNode<HierarchicalData<T>>
    ) => number
  ) => HierarchyComponent<T>;
}
// Function overloads for better TypeScript support

export function prepareHierarchyData<T = unknown>(): HierarchyComponent<T>;
export function prepareHierarchyData<T = unknown>(
  data: T[],
  options: {
    layers: Array<(d: T) => string>;
    valueAccessor: (d: T) => number;
  }
): HierarchyNode<HierarchicalData<T>>;

export function prepareHierarchyData<T = unknown>(
  data?: T[],
  options?: {
    layers: Array<(d: T) => string>;
    valueAccessor: (d: T) => number;
  }
) {
  if (data !== undefined && options !== undefined) {
    const layout = createHierarchyLayout<T>();

    options.layers.forEach((layer) => {
      layout.layer(layer);
    });
    layout.value(options.valueAccessor);

    return layout.calculate(data);
  }

  // Otherwise, return the chained API
  return createHierarchyLayout<T>();
}
function createHierarchyLayout<T = unknown>(): HierarchyComponent<T> {
  const layers: Array<(d: T) => string> = [];
  let valueAcc: (d: T) => number = fn.identity as (d: T) => number;
  let sortFn: (
    a: HierarchyNode<HierarchicalData<T>>,
    b: HierarchyNode<HierarchicalData<T>>
  ) => number = (_a, _b) => 0;

  const api: HierarchyComponent<T> = {
    calculate: (data) => {
      if (layers.length === 0) {
        throw new Error("At least one layer must be specified before calculating treemap data");
      }

      const nested = unwrapNested<T>(rollup(data, fn.first, ...layers));

      return hierarchy<HierarchicalData<T>>({ isRoot: true, values: nested }, (d) => d.values)
        .sort(sortFn)
        .sum((x: HierarchicalData<T>) => {
          if ("value" in x && x.value !== undefined) {
            return valueAcc(x.value);
          }
          return 0;
        });
    },

    layer: (keyFunc) => {
      layers.push(keyFunc);
      return api;
    },

    value: (accfn) => {
      valueAcc = accfn;
      return api;
    },

    sort: (sortFunc) => {
      sortFn = sortFunc;
      return api;
    },
  };

  return api;
} // Helper function to safely unwrap nested rollup data

export function unwrapNested<T>(roll: Map<string, unknown> | unknown): NestedData<T>[] {
  const rollupMap = roll as Map<string, unknown>;
  return Array.from(rollupMap, ([key, values]: [string, unknown]) => ({
    key,
    values: values instanceof Map && values.size > 0 ? unwrapNested<T>(values) : undefined,
    value: values instanceof Map && values.size > 0 ? undefined : (values as T),
  }));
}
