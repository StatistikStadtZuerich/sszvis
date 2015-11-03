sszvis_namespace('sszvis.layout.sankey', function(module) {
  'use strict';

  function computeSankeyDimensions(columnLengths, columnTotals, pixelExtent) {
    // Calculate appropriate scale and padding values (in pixels)
    var padSpaceRatio = 0.15;
    var padMin = 12;
    var padMax = 50;
    var minDisplayPixels = 1; // Minimum number of pixels used for display area

    // Compute the padding value (in pixels) for each column, then take the minimum value
    var computedPixPadding = d3.min(
      columnLengths.map(function(colLength) {
        // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
        var colPadding = (pixelExtent * padSpaceRatio) / (colLength - 1);
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
        var nonPaddingPixels = Math.max(minDisplayPixels, pixelExtent - ((colLength - 1) * computedPixPadding));
        return nonPaddingPixels / columnTotals[colIndex];
      })
    );

    var maxTotal = d3.max(columnTotals);

    // The padding between bars, in bar value units
    var valuePadding = computedPixPadding / pixPerUnit;
    // The padding between bars, in pixels
    var pixelPadding = computedPixPadding;
    // The domain of the visual scale
    var valueDomain = [0, maxTotal];
    // The range of the visual scale
    var pixelRange = [0, maxTotal * pixPerUnit];

    return {
      valuePadding: valuePadding,
      pixelPadding: pixelPadding,
      valueDomain: valueDomain,
      pixelRange: pixelRange
    };
  }

  module.exports.prepareData = function() {
    var mGetSource = sszvis.fn.identity;
    var mGetTarget = sszvis.fn.identity;
    var mGetValue = sszvis.fn.identity;
    var mColumnIds = [];
    var mPixExtent = 0;

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

      var listofLinks = inputData.map(function(datum) {
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
      var columnValueTotals = listOfNodes.reduce(function(totals, node) {
        // Organize the node's links - sorted according to the sort function
        node.linksFrom.sort(valueSortFunc);
        node.linksTo.sort(valueSortFunc);

        // and stacked vertically within the node according to that order
        var fromTotal = node.linksFrom.reduce(function(sumValue, link) {
          link.srcOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);

        var toTotal = node.linksTo.reduce(function(sumValue, link) {
          link.tgtOffset = sumValue;
          return sumValue + valueAcc(link);
        }, 0);

        // For correct visual display, the node's value is the max of the from and to links
        node.value = Math.max(0, fromTotal, toTotal);

        totals[node.columnIndex] += node.value;

        return totals;
      }, sszvis.fn.filledArray(mColumnIds.length, 0));

      if (mPixExtent === 0) {
        sszvis.logger.warn('No extent specified for the sankey layout. The computed offsets won\'t make any sense');
      }

      var columnLengths = mColumnIds.map(function(colIds) { return colIds.length; });

      // Compute visual display dimensions of the sankey diagram, like the visible pixels per unit,
      // and the domain and range of the linear scale which displays the sankey nodes as bars and links as arcs.
      var dimensionInfo = computeSankeyDimensions(columnLengths, columnValueTotals, mPixExtent);

      // Sort the column nodes themselves
      // (note, this sorts all nodes for all columns in the same array)
      listOfNodes.sort(valueSortFunc);

      // Assign the 
      // Here, columnData[0] is an array adding up value totals
      // and columnData[1] is an array adding up the number of nodes in each column
      // Both are used to assign cumulative properties to the nodes of each column
      var columnData = listOfNodes.reduce(function(columnData, node) {
        // Assigns valueOffset and nodeIndex
        node.valueOffset = columnData[0][node.columnIndex];
        node.nodeIndex = columnData[1][node.columnIndex];

        columnData[0][node.columnIndex] += node.value + dimensionInfo.valuePadding;
        columnData[1][node.columnIndex] += 1;

        return columnData;
      }, [
        sszvis.fn.filledArray(mColumnIds.length, 0),
        sszvis.fn.filledArray(mColumnIds.length, 0)
      ]);

      // Add y-padding to vertically center all columns.
      // Need to account for the fact that valuePadding is extra at the end of each columnTotal
      var maxTotal = d3.max(columnData[0]) - dimensionInfo.valuePadding;

      var columnPaddings = columnData[0].map(function(total) { return (maxTotal - (total - dimensionInfo.valuePadding)) / 2; });

      listOfNodes.forEach(function(node) { node.valueOffset += columnPaddings[node.columnIndex]; });

      return {
        bars: listOfNodes,
        links: listofLinks,
        colLengths: columnLengths,
        colTotals: columnValueTotals,
        domain: dimensionInfo.valueDomain,
        range: dimensionInfo.pixelRange
      };
    };

    main.apply = function(data) { return main(data); };

    main.source = function(func) { mGetSource = func; return main; };

    main.target = function(func) { mGetTarget = func; return main; };

    main.value = function(func) { mGetValue = func; return main; };

    main.pixelExtent = function(pixels) { mPixExtent = pixels; return main; };

    main.descendingSort = function() { valueSortFunc = byDescendingValue; return main; };

    main.ascendingSort = function() { valueSortFunc = byAscendingValue; return main; };

    main.column = function(columnIdsList) { mColumnIds.push(columnIdsList); return main; };

    return main;
  };

});
