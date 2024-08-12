/**
 * @module sszvis/layout/sankey
 *
 * A module of helper functions for computing the data structure
 * and layout required by the sankey component.
 */

import { ascending, descending, sum, min, max } from "d3";

import * as fn from "../fn.js";
import * as logger from "../logger.js";

var newLinkId = (function () {
  var id = 0;
  return function () {
    return ++id;
  };
})();

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
 */
export var prepareData = function () {
  var mGetSource = fn.identity;
  var mGetTarget = fn.identity;
  var mGetValue = fn.identity;
  var mColumnIds = [];

  // Helper functions
  var valueAcc = fn.prop("value");
  var byAscendingValue = function (a, b) {
    return ascending(valueAcc(a), valueAcc(b));
  };
  var byDescendingValue = function (a, b) {
    return descending(valueAcc(a), valueAcc(b));
  };

  var valueSortFunc = byDescendingValue;

  var main = function (inputData) {
    var columnIndex = mColumnIds.reduce((index, columnIdsList, colIndex) => {
      for (const id of columnIdsList) {
        if (index.has(id)) {
          logger.warn(
            "Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:",
            id,
            "The existing value will be overwritten"
          );
        }

        var item = {
          id: id,
          columnIndex: colIndex, // This is the index of the column containing this node
          nodeIndex: 0, // This will be overwritten at a later stage with the index of this node within its column
          value: 0,
          valueOffset: 0,
          linksFrom: [],
          linksTo: [],
        };

        index.set(id, item);
      }

      return index;
    }, new Map());

    var listOfLinks = inputData.map((datum) => {
      var srcId = mGetSource(datum);
      var tgtId = mGetTarget(datum);
      var value = +mGetValue(datum) || 0; // Cast this to number

      var srcNode = columnIndex.get(srcId);
      var tgtNode = columnIndex.get(tgtId);

      if (!srcNode) {
        logger.warn("Found invalid source column id:", srcId);
        return null;
      }

      if (!tgtNode) {
        logger.warn("Found invalid target column id:", tgtId);
        return null;
      }

      var item = {
        id: newLinkId(),
        value: value,
        src: srcNode,
        srcOffset: 0,
        tgt: tgtNode,
        tgtOffset: 0,
      };

      srcNode.linksFrom.push(item);
      tgtNode.linksTo.push(item);

      return item;
    });

    // Extract the column nodes from the index
    var listOfNodes = [...columnIndex.values()];

    // Calculate an array of total values for each column
    var columnTotals = listOfNodes.reduce(
      (totals, node) => {
        var fromTotal = sum(node.linksFrom, valueAcc);
        var toTotal = sum(node.linksTo, valueAcc);

        // For correct visual display, the node's value is the max of the from and to links
        node.value = Math.max(0, fromTotal, toTotal);

        totals[node.columnIndex] += node.value;

        return totals;
      },
      fn.filledArray(mColumnIds.length, 0)
    );

    // An array with the number of nodes in each column
    var columnLengths = mColumnIds.map((colIds) => colIds.length);

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
    listOfNodes.reduce(
      (columnData, node) => {
        // Assigns valueOffset and nodeIndex
        node.valueOffset = columnData[0][node.columnIndex];
        node.nodeIndex = columnData[1][node.columnIndex];

        columnData[0][node.columnIndex] += node.value;
        columnData[1][node.columnIndex] += 1;

        return columnData;
      },
      [fn.filledArray(mColumnIds.length, 0), fn.filledArray(mColumnIds.length, 0)]
    );

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
      columnTotals: columnTotals,
      columnLengths: columnLengths,
    };
  };

  main.apply = function (data) {
    return main(data);
  };

  main.source = function (func) {
    mGetSource = func;
    return main;
  };

  main.target = function (func) {
    mGetTarget = func;
    return main;
  };

  main.value = function (func) {
    mGetValue = func;
    return main;
  };

  main.descendingSort = function () {
    valueSortFunc = byDescendingValue;
    return main;
  };

  main.ascendingSort = function () {
    valueSortFunc = byAscendingValue;
    return main;
  };

  main.idLists = function (idLists) {
    mColumnIds = idLists;
    return main;
  };

  return main;
};

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
 */
export var computeLayout = function (columnLengths, columnTotals, columnHeight, columnWidth) {
  // Calculate appropriate scale and padding values (in pixels)
  var padSpaceRatio = 0.15;
  var padMin = 12;
  var padMax = 50;
  var minDisplayPixels = 1; // Minimum number of pixels used for display area

  // Compute the padding value (in pixels) for each column, then take the minimum value
  var computedPixPadding = min(
    columnLengths.map((colLength) => {
      // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
      var colPadding = (columnHeight * padSpaceRatio) / (colLength - 1);
      // Limit by minimum and maximum pixel padding values
      return Math.max(padMin, Math.min(padMax, colPadding));
    })
  );

  // Given the computed padding value, compute each column's resulting "pixels per unit"
  // This is the number of remaining pixels available to display the column's total units,
  // after padding pixels have been subtracted. Then take the minimum value of that.
  var pixPerUnit = min(
    columnLengths.map((colLength, colIndex) => {
      // The non-padding pixels must have at least minDisplayPixels
      var nonPaddingPixels = Math.max(
        minDisplayPixels,
        columnHeight - (colLength - 1) * computedPixPadding
      );
      return nonPaddingPixels / columnTotals[colIndex];
    })
  );

  // The padding between bars, in bar value units
  var valuePadding = computedPixPadding / pixPerUnit;
  // The padding between bars, in pixels
  var nodePadding = computedPixPadding;

  // The maximum total value of any column
  var maxTotal = max(columnTotals);

  // Compute y-padding required to vertically center each column (in pixels)
  var paddedHeights = columnLengths.map(
    (colLength, colIndex) => columnTotals[colIndex] * pixPerUnit + (colLength - 1) * nodePadding
  );
  var maxPaddedHeight = max(paddedHeights);
  var columnPaddings = columnLengths.map(
    (colLength, colIndex) => (maxPaddedHeight - paddedHeights[colIndex]) / 2
  );

  // The domain of the size scale
  var valueDomain = [0, maxTotal];
  // The range of the size scale
  var valueRange = [0, maxTotal * pixPerUnit];

  // Calculate column (or row, as the case may be) positioning values
  var nodeThickness = 20;
  var numColumns = columnLengths.length;
  var columnXMultiplier = (columnWidth - nodeThickness) / (numColumns - 1);
  var columnDomain = [0, 1];
  var columnRange = [0, columnXMultiplier];

  return {
    valuePadding: valuePadding,
    nodePadding: nodePadding,
    columnPaddings: columnPaddings,
    valueDomain: valueDomain,
    valueRange: valueRange,
    nodeThickness: nodeThickness,
    columnDomain: columnDomain,
    columnRange: columnRange,
  };
};
