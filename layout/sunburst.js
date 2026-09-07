import { min, max, partition } from 'd3';
import { warn } from '../logger.js';
import { prepareHierarchyData } from './hierarchy.js';
import { requireCount, requireSize } from './validate.js';

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
const prepareData = () => {
  const hierarchyBuilder = prepareHierarchyData();
  const api = {
    calculate: data => {
      const root = hierarchyBuilder.calculate(data);
      partition()(root);
      function flatten(node) {
        return Array.prototype.concat.apply([node], (node.children || []).map(child => flatten(child)));
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
 *
 * Behaviour notes:
 * - centerRadius is chartWidth / 6, shrunk when the rings would not otherwise fit.
 * - ringWidth is the remaining radius divided by numLayers, clamped to [10, 60].
 * - The 10px floor is reconciled with the centre: a deep hierarchy in a narrow chart gives
 *   its rings the room by shrinking centerRadius, so that
 *   centerRadius + ringWidth * numLayers stays within chartWidth / 2 - the outer radius the
 *   sunburst component draws, per docs/sunburst/basic.js. A hierarchy so deep that even a
 *   centre of nothing cannot hold it warns and overflows. The 60px cap is not compensated
 *   for in the other direction: a shallow hierarchy simply leaves empty space.
 * - A zero chartWidth or a hierarchy with no layers is a chart with nothing to draw, and
 *   every dimension comes back 0.
 * - A negative chartWidth, or a negative or fractional layer count, throws.
 */
const computeLayout = (numLayers, chartWidth) => {
  requireCount("sunburstLayout", "numLayers", numLayers);
  requireSize("sunburstLayout", "chartWidth", chartWidth);
  if (numLayers === 0 || chartWidth === 0) {
    return {
      centerRadius: 0,
      numLayers,
      ringWidth: 0
    };
  }
  // Diameter of the center circle is one-third the width
  const halfWidth = chartWidth / 2;
  const targetCenterRadius = halfWidth / 3;
  const ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - targetCenterRadius) / numLayers));
  // Once the ring width is floored, the rings may need more room than the target centre
  // leaves them. Give it to them, down to a centre of nothing.
  const centerRadius = Math.max(0, Math.min(targetCenterRadius, halfWidth - ringWidth * numLayers));
  if (ringWidth * numLayers > halfWidth) {
    warn("sunburstLayout: ".concat(numLayers, " rings of the minimum ").concat(MIN_RW, "px do not fit a chart ").concat(chartWidth, "px wide, and will be drawn outside it"));
  }
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
 *
 * Behaviour notes:
 * - Returns [min y0, max y1] taken independently of each other.
 * - d3.min/max skip undefined and NaN nodes.
 * - An empty array gives [0, 0], which is a usable, if empty, scale domain.
 */
const getRadiusExtent = formattedData => {
  var _min, _max;
  return [(_min = min(formattedData, d => d.y0)) !== null && _min !== void 0 ? _min : 0, (_max = max(formattedData, d => d.y1)) !== null && _max !== void 0 ? _max : 0];
};

export { MAX_SUNBURST_RING_WIDTH, MIN_SUNBURST_RING_WIDTH, computeLayout, getRadiusExtent, prepareData };
//# sourceMappingURL=sunburst.js.map
