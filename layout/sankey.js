import { max, min, sum, descending, ascending } from 'd3';
import { prop, filledArray } from '../fn.js';
import { warn } from '../logger.js';
import { requireSize, requireCount } from './validate.js';

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
const prepareData = () => {
  let mGetSource;
  let mGetTarget;
  let mGetValue;
  let mColumnIds = [];
  // Helper functions
  const valueAcc = prop("value");
  const byAscendingValue = (a, b) => ascending(valueAcc(a), valueAcc(b));
  const byDescendingValue = (a, b) => descending(valueAcc(a), valueAcc(b));
  let valueSortFunc = byDescendingValue;
  const main = inputData => {
    const getSource = mGetSource;
    const getTarget = mGetTarget;
    const getValue = mGetValue;
    if (!getSource || !getTarget || !getValue) {
      const missing = [getSource ? undefined : "source", getTarget ? undefined : "target", getValue ? undefined : "value"].filter(Boolean);
      throw new TypeError("sankeyPrepareData: the ".concat(missing.join(", "), " accessor").concat(missing.length > 1 ? "s are" : " is", " required"));
    }
    const columnIndex = mColumnIds.reduce((index, columnIdsList, colIndex) => {
      for (const id of columnIdsList) {
        if (index.has(id)) {
          warn("Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:", id, "The existing value will be overwritten");
        }
        const item = {
          id,
          columnIndex: colIndex,
          // This is the index of the column containing this node
          nodeIndex: 0,
          // This will be overwritten at a later stage with the index of this node within its column
          value: 0,
          valueOffset: 0,
          linksFrom: [],
          linksTo: []
        };
        index.set(id, item);
      }
      return index;
    }, new Map());
    const listOfLinks = inputData.flatMap((datum, rowIndex) => {
      const srcId = getSource(datum);
      const tgtId = getTarget(datum);
      const rawValue = getValue(datum);
      const value = Number(rawValue);
      const srcNode = columnIndex.get(srcId);
      const tgtNode = columnIndex.get(tgtId);
      if (!srcNode) {
        warn("Found invalid source column id:", srcId);
        return [];
      }
      if (!tgtNode) {
        warn("Found invalid target column id:", tgtId);
        return [];
      }
      if (srcNode.columnIndex === tgtNode.columnIndex) {
        warn("Found a link whose source and target are in the same column, and dropped it:", srcId, tgtId);
        return [];
      }
      if (!Number.isFinite(value) || value < 0) {
        warn("Found a link value that is not a number of zero or more, and dropped the link:", rawValue, srcId, tgtId);
        return [];
      }
      const item = {
        // the row's own index: an id that identifies a link rather than a call
        id: rowIndex,
        value,
        src: srcNode,
        srcOffset: 0,
        tgt: tgtNode,
        tgtOffset: 0
      };
      srcNode.linksFrom.push(item);
      tgtNode.linksTo.push(item);
      return [item];
    });
    // Extract the column nodes from the index
    const listOfNodes = [...columnIndex.values()];
    // Calculate an array of total values for each column
    const columnTotals = listOfNodes.reduce((totals, node) => {
      const fromTotal = sum(node.linksFrom, valueAcc);
      const toTotal = sum(node.linksTo, valueAcc);
      // For correct visual display, the node's value is the max of the from and to links
      node.value = Math.max(fromTotal, toTotal);
      totals[node.columnIndex] += node.value;
      return totals;
    }, filledArray(mColumnIds.length, 0));
    // An array with the number of nodes in each column
    const columnLengths = mColumnIds.map(colIds => colIds.length);
    // Sort the column nodes
    // (note, this sorts all nodes for all columns in the same array)
    listOfNodes.sort(valueSortFunc);
    // Sort the links in descending order of value. This means smaller links will render
    // on top of larger links.
    // (note, this sorts all links for all columns in the same array)
    listOfLinks.sort(byDescendingValue);
    // Assign the valueOffset and nodeIndex properties
    // Here, columnData[0] is an array adding up value totals
    // and columnData[1] is an array adding up the number of nodes in each column
    // Both are used to assign cumulative properties to the nodes of each column
    listOfNodes.reduce((columnData, node) => {
      // Assigns valueOffset and nodeIndex
      node.valueOffset = columnData[0][node.columnIndex];
      node.nodeIndex = columnData[1][node.columnIndex];
      columnData[0][node.columnIndex] += node.value;
      columnData[1][node.columnIndex] += 1;
      return columnData;
    }, [filledArray(mColumnIds.length, 0), filledArray(mColumnIds.length, 0)]);
    // Once the order of nodes is calculated, we need to sort the links going into the
    // nodes and the links coming out of the nodes according to the ordering of the nodes
    // they come from or go to. This creates a visually appealing layout which minimizes
    // the number of link crossings
    for (const node of listOfNodes) {
      node.linksFrom.sort((linkA, linkB) => linkA.tgt.nodeIndex - linkB.tgt.nodeIndex);
      node.linksTo.sort((linkA, linkB) => linkA.src.nodeIndex - linkB.src.nodeIndex);
      // Stack the links vertically within the node according to their order
      node.linksFrom.reduce((sumValue, link) => {
        link.srcOffset = sumValue;
        return sumValue + valueAcc(link);
      }, 0);
      node.linksTo.reduce((sumValue, link) => {
        link.tgtOffset = sumValue;
        return sumValue + valueAcc(link);
      }, 0);
    }
    return {
      nodes: listOfNodes,
      links: listOfLinks,
      columnTotals,
      columnLengths
    };
  };
  const api = Object.assign(main, {
    apply(data) {
      return main(data);
    },
    source(func) {
      mGetSource = func;
      return api;
    },
    target(func) {
      mGetTarget = func;
      return api;
    },
    value(func) {
      mGetValue = func;
      return api;
    },
    descendingSort() {
      valueSortFunc = byDescendingValue;
      return api;
    },
    ascendingSort() {
      valueSortFunc = byAscendingValue;
      return api;
    },
    idLists(idLists) {
      mColumnIds = idLists;
      return api;
    }
  });
  return api;
};
/** Matches JavaScript's implicit undefined -> NaN coercion in arithmetic. */
const num = value => value === undefined ? Number.NaN : value;
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
const computeLayout = (columnLengths, columnTotals, columnHeight, columnWidth) => {
  var _max, _min;
  requireSize("sankeyLayout", "columnHeight", columnHeight);
  requireSize("sankeyLayout", "columnWidth", columnWidth);
  for (const colLength of columnLengths) {
    requireCount("sankeyLayout", "columnLengths", colLength);
  }
  if (columnTotals.length !== columnLengths.length) {
    throw new RangeError("sankeyLayout: columnTotals must hold one total per column, got ".concat(columnTotals.length, " for ").concat(columnLengths.length, " columns"));
  }
  // The maximum total value of any column
  const maxTotal = (_max = max(columnTotals)) !== null && _max !== void 0 ? _max : 0;
  const nodeThickness = 20;
  const numColumns = columnLengths.length;
  // With one column there are no steps to space out, so the offset is zero rather than a
  // division by zero (issue #120).
  const columnXMultiplier = numColumns > 1 ? (columnWidth - nodeThickness) / (numColumns - 1) : 0;
  const columnDomain = [0, 1];
  const columnRange = [0, columnXMultiplier];
  // Nothing to scale: no columns, no room for them, or no values in any of them
  if (numColumns === 0 || columnHeight === 0 || columnWidth === 0 || maxTotal === 0) {
    return {
      valuePadding: 0,
      nodePadding: 0,
      columnPaddings: columnLengths.map(() => 0),
      valueDomain: [0, maxTotal],
      valueRange: [0, 0],
      nodeThickness,
      columnDomain,
      // Zeroed with the rest of the layout. Computed from columnWidth, the multiplier is
      // negative once columnWidth falls below nodeThickness, which would place the columns
      // outside a container that has no room for them at all.
      columnRange: [0, 0]
    };
  }
  // Calculate appropriate scale and padding values (in pixels)
  const padSpaceRatio = 0.15;
  const padMin = 12;
  const padMax = 50;
  const minDisplayPixels = 1; // Minimum number of pixels used for display area
  // Compute the padding value (in pixels) for each column, then take the minimum value.
  // A column of one node draws no gaps, so it has no padding of its own to contribute, and
  // charging its (divide-by-zero, then clamped) candidate to the other columns would shrink
  // columns that do draw gaps.
  const computedPixPadding = (_min = min(columnLengths.filter(colLength => colLength > 1).map(colLength => {
    // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
    const colPadding = columnHeight * padSpaceRatio / (colLength - 1);
    // Limit by minimum and maximum pixel padding values
    return Math.max(padMin, Math.min(padMax, colPadding));
  }))) !== null && _min !== void 0 ? _min : 0;
  // Given the computed padding value, compute each column's resulting "pixels per unit"
  // This is the number of remaining pixels available to display the column's total units,
  // after padding pixels have been subtracted. Then take the minimum value of that.
  const pixPerUnit = min(columnLengths.map((colLength, colIndex) => {
    // The non-padding pixels must have at least minDisplayPixels
    const nonPaddingPixels = Math.max(minDisplayPixels, columnHeight - (colLength - 1) * computedPixPadding);
    return nonPaddingPixels / num(columnTotals[colIndex]);
  }));
  // The padding between bars, in bar value units
  const valuePadding = computedPixPadding / num(pixPerUnit);
  // The padding between bars, in pixels
  const nodePadding = computedPixPadding;
  // Compute y-padding required to vertically center each column (in pixels)
  const paddedHeights = columnLengths.map((colLength, colIndex) => num(columnTotals[colIndex]) * num(pixPerUnit) + (colLength - 1) * nodePadding);
  const maxPaddedHeight = max(paddedHeights);
  const columnPaddings = columnLengths.map((_colLength, colIndex) => (num(maxPaddedHeight) - num(paddedHeights[colIndex])) / 2);
  // The domain of the size scale
  const valueDomain = [0, maxTotal];
  // The range of the size scale
  const valueRange = [0, maxTotal * num(pixPerUnit)];
  return {
    valuePadding,
    nodePadding,
    columnPaddings,
    valueDomain,
    valueRange,
    nodeThickness,
    columnDomain,
    columnRange
  };
};

export { computeLayout, prepareData };
//# sourceMappingURL=sankey.js.map
