/**
 * @module sszvis/layout/sunburst
 *
 * Helper functions for transforming your data to match the format required by the sunburst chart.
 */

import { type HierarchyNode, max, min, partition } from "d3";
import { type NodeDatum, prepareHierarchyData } from "./hierarchy.js";

/** A node of the prepared hierarchy after d3.partition has written its positions onto it. */
export type SunburstNode<T = unknown> = HierarchyNode<NodeDatum<T>> & {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

/** The chained builder returned by the deprecated prepareData. */
export type SunburstDataBuilder<T = unknown> = {
  calculate: (data: T[]) => SunburstNode<T>[];
  layer: (keyFunc: (d: T) => string | null | undefined) => SunburstDataBuilder<T>;
  value: (accfn: (d: T) => number) => SunburstDataBuilder<T>;
  sort: (
    sortFunc: (a: HierarchyNode<NodeDatum<T>>, b: HierarchyNode<NodeDatum<T>>) => number
  ) => SunburstDataBuilder<T>;
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
 */
export const prepareData = <T = unknown>(): SunburstDataBuilder<T> => {
  const hierarchyBuilder = prepareHierarchyData<T>();
  const api: SunburstDataBuilder<T> = {
    calculate: (data) => {
      const root = hierarchyBuilder.calculate(data);
      partition<NodeDatum<T>>()(root);
      function flatten(node: HierarchyNode<NodeDatum<T>>): SunburstNode<T>[] {
        return Array.prototype.concat.apply(
          [node],
          (node.children || []).map((child) => flatten(child))
        );
      }
      return flatten(root).filter((d) => d.data._tag !== "root");
    },
    layer: (keyFunc) => {
      hierarchyBuilder.layer(keyFunc);
      return api;
    },
    value: (accfn) => {
      hierarchyBuilder.value(accfn);
      return api;
    },
    sort: (sortFunc) => {
      hierarchyBuilder.sort(sortFunc);
      return api;
    },
  };
  return api;
};

export const MAX_SUNBURST_RING_WIDTH = 60;
const MAX_RW = MAX_SUNBURST_RING_WIDTH;

export const MIN_SUNBURST_RING_WIDTH = 10;
const MIN_RW = MIN_SUNBURST_RING_WIDTH;

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
 */
export const computeLayout = (numLayers: number, chartWidth: number): SunburstLayout => {
  // Diameter of the center circle is one-third the width
  const halfWidth = chartWidth / 2;
  const centerRadius = halfWidth / 3;
  const ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - centerRadius) / numLayers));

  return {
    centerRadius,
    numLayers,
    ringWidth,
  };
};

/**
 * sszvis.layout.sunburst.getRadiusExtent
 * @param  {Array} formattedData      An array of data to inspect for the extent of the radius scale
 *
 * @return {Array}                    The minimum and maximum radius values (in d3's partition layout's terms). Use this as
 *                                    The domain of the radius scale you use to configure the sunburst chart. This is a convenience
 *                                    function which abstracts away the way d3 stores positions within the partition layout used
 *                                    by the sunburst chart.
 */
export const getRadiusExtent = (
  formattedData: Array<{ y0?: number; y1?: number }>
): [number | undefined, number | undefined] => [
  min(formattedData, (d) => d.y0),
  max(formattedData, (d) => d.y1),
];
