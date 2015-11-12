sszvis_namespace('sszvis.layout.sankey', function(module) {
  'use strict';

  var newLinkId = (function() {
    var id = 0;
    return function() { return ++id; };
  })();

  module.exports.prepareData = function() {
    var mGetSource = sszvis.fn.identity;
    var mGetTarget = sszvis.fn.identity;
    var mGetValue = sszvis.fn.identity;
    var mColumnIds = [];

    // Helper functions
    var valueAcc = sszvis.fn.prop('value');
    var byAscendingValue = function(a, b) { return d3.ascending(valueAcc(a), valueAcc(b)); };
    var byDescendingValue = function(a, b) { return d3.descending(valueAcc(a), valueAcc(b)); };

    var valueSortFunc = byDescendingValue;

    var main = function(inputData) {
      var columnIndex = mColumnIds.reduce(function(index, columnIdsList, columnIndex) {
        columnIdsList.forEach(function(id) {
          if (index.has(id)) {
            sszvis.logger.warn('Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:', id, 'The existing value will be overwritten');
          }

          var item = {
            id: id,
            columnIndex: columnIndex, // This is the index of the column containing this node
            nodeIndex: 0, // This will be overwritten at a later stage with the index of this node within its column
            value: 0,
            valueOffset: 0,
            linksFrom: [],
            linksTo: []
          };
          
          index.set(id, item);
        });

        return index;
      }, d3.map());

      var listOfLinks = inputData.map(function(datum) {
        var srcId = mGetSource(datum);
        var tgtId = mGetTarget(datum);
        var value = + mGetValue(datum) || 0; // Cast this to number

        var srcNode = columnIndex.get(srcId);
        var tgtNode = columnIndex.get(tgtId);

        if (!srcNode) {
          sszvis.logger.warn('Found invalid source column id:', srcId);
          return null;
        }

        if (!tgtNode) {
          sszvis.logger.warn('Found invalid target column id:', tgtId);
          return null;
        }

        var item = {
          id: newLinkId(),
          value: value,
          src: srcNode,
          srcOffset: 0,
          tgt: tgtNode,
          tgtOffset: 0
        };

        srcNode.linksFrom.push(item);
        tgtNode.linksTo.push(item);

        return item;
      });

      // Extract the column nodes from the index
      var listOfNodes = columnIndex.values();

      // Calculate an array of total values for each column
      var columnTotals = listOfNodes.reduce(function(totals, node) {
        var fromTotal = d3.sum(node.linksFrom, valueAcc);
        var toTotal = d3.sum(node.linksTo, valueAcc);

        // For correct visual display, the node's value is the max of the from and to links
        node.value = Math.max(0, fromTotal, toTotal);

        totals[node.columnIndex] += node.value;

        return totals;
      }, sszvis.fn.filledArray(mColumnIds.length, 0));

      // An array with the number of nodes in each column
      var columnLengths = mColumnIds.map(function(colIds) { return colIds.length; });

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
      listOfNodes.reduce(function(columnData, node) {
        // Assigns valueOffset and nodeIndex
        node.valueOffset = columnData[0][node.columnIndex];
        node.nodeIndex = columnData[1][node.columnIndex];

        columnData[0][node.columnIndex] += node.value;
        columnData[1][node.columnIndex] += 1;

        return columnData;
      }, [
        sszvis.fn.filledArray(mColumnIds.length, 0),
        sszvis.fn.filledArray(mColumnIds.length, 0)
      ]);

      // Once the order of nodes is calculated, we need to sort the links going into the
      // nodes and the links coming out of the nodes according to the ordering of the nodes
      // they come from or go to. This creates a visually appealing layout which minimizes
      // the number of link crossings
      listOfNodes.forEach(function(node) {
        node.linksFrom.sort(function(linkA, linkB) {
          return linkA.tgt.nodeIndex - linkB.tgt.nodeIndex;
        });

        node.linksTo.sort(function(linkA, linkB) {
          return linkA.src.nodeIndex - linkB.src.nodeIndex;
        });

        // Stack the links vertically within the node according to their order
        node.linksFrom.reduce(function(sumValue, link) {
          link.srcOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);

        node.linksTo.reduce(function(sumValue, link) {
          link.tgtOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);
      });

      return {
        nodes: listOfNodes,
        links: listOfLinks,
        columnTotals: columnTotals,
        columnLengths: columnLengths
      };
    };

    main.apply = function(data) { return main(data); };

    main.source = function(func) { mGetSource = func; return main; };

    main.target = function(func) { mGetTarget = func; return main; };

    main.value = function(func) { mGetValue = func; return main; };

    main.descendingSort = function() { valueSortFunc = byDescendingValue; return main; };

    main.ascendingSort = function() { valueSortFunc = byAscendingValue; return main; };

    main.idLists = function(idLists) { mColumnIds = idLists; return main; };

    return main;
  };

  module.exports.computeLayout = function(columnLengths, columnTotals, columnPixels, spreadPixels) {
    // Calculate appropriate scale and padding values (in pixels)
    var padSpaceRatio = 0.15;
    var padMin = 12;
    var padMax = 50;
    var minDisplayPixels = 1; // Minimum number of pixels used for display area

    // Compute the padding value (in pixels) for each column, then take the minimum value
    var computedPixPadding = d3.min(
      columnLengths.map(function(colLength) {
        // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
        var colPadding = (columnPixels * padSpaceRatio) / (colLength - 1);
        // Limit by minimum and maximum pixel padding values
        return Math.max(padMin, Math.min(padMax, colPadding));
      })
    );

    // Given the computed padding value, compute each column's resulting "pixels per unit"
    // This is the number of remaining pixels available to display the column's total units,
    // after padding pixels have been subtracted. Then take the minimum value of that.
    var pixPerUnit = d3.min(
      columnLengths.map(function(colLength, colIndex) {
        // The non-padding pixels must have at least minDisplayPixels
        var nonPaddingPixels = Math.max(minDisplayPixels, columnPixels - ((colLength - 1) * computedPixPadding));
        return nonPaddingPixels / columnTotals[colIndex];
      })
    );

    // The padding between bars, in bar value units
    var valuePadding = computedPixPadding / pixPerUnit;
    // The padding between bars, in pixels
    var nodePadding = computedPixPadding;

    // The maximum total value of any column
    var maxTotal = d3.max(columnTotals);

    // Compute y-padding required to vertically center each column (in pixels)
    var paddedHeights = columnLengths.map(function(colLength, colIndex) { return columnTotals[colIndex] * pixPerUnit + (colLength - 1) * nodePadding; });
    var maxPaddedHeight = d3.max(paddedHeights);
    var columnPaddings = columnLengths.map(function(colLength, colIndex) { return (maxPaddedHeight - paddedHeights[colIndex]) / 2; });

    // The domain of the size scale
    var valueDomain = [0, maxTotal];
    // The range of the size scale
    var valueRange = [0, maxTotal * pixPerUnit];

    // Calculate column (or row, as the case may be) positioning values
    var nodeThickness = 20;
    var numColumns = columnLengths.length;
    var columnXMultiplier = (spreadPixels - nodeThickness) / (numColumns - 1);
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
      columnRange: columnRange
    };
  };

});
