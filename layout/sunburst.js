import { min, max, partition } from 'd3';
import { prepareHierarchyData } from './hierarchy.js';

/**
 * @module sszvis/layout/sunburst
 *
 * Helper functions for transforming your data to match the format required by the sunburst chart.
 */
/**
 * sszvis.layout.sunburst.prepareData
 *
 * @deprecated since v3.4.0 - use sszvis.layout.hierarchy.prepareHierarchyData instead
 */
const prepareData = () => {
  const hierarchyBuilder = prepareHierarchyData();
  const api = {
    calculate: data => {
      const root = hierarchyBuilder.calculate(data);
      partition()(root);
      function flatten(node) {
        return Array.prototype.concat.apply([node], (node.children || []).map(flatten));
      }
      return flatten(root).filter(d => d.data._tag !== "root");
    },
    layer: keyFunc => {
      hierarchyBuilder.layer(keyFunc);
      return api;
    },
    value: accfn => {
      hierarchyBuilder.value(accfn);
      return api;
    },
    sort: sortFunc => {
      hierarchyBuilder.sort(sortFunc);
      return api;
    }
  };
  return api;
};
const MAX_SUNBURST_RING_WIDTH = 60;
const MAX_RW = MAX_SUNBURST_RING_WIDTH;
const MIN_SUNBURST_RING_WIDTH = 10;
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
const computeLayout = (numLayers, chartWidth) => {
  // Diameter of the center circle is one-third the width
  const halfWidth = chartWidth / 2;
  const centerRadius = halfWidth / 3;
  const ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - centerRadius) / numLayers));
  return {
    centerRadius,
    numLayers,
    ringWidth
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
const getRadiusExtent = formattedData => {
  return [min(formattedData, d => d.y0), max(formattedData, d => d.y1)];
};

export { MAX_SUNBURST_RING_WIDTH, MIN_SUNBURST_RING_WIDTH, computeLayout, getRadiusExtent, prepareData };
//# sourceMappingURL=sunburst.js.map
