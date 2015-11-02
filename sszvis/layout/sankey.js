sszvis_namespace('sszvis.layout.sankey', function(module) {
  'use strict';

  module.exports.prepareData = function() {
    var mGetSource = sszvis.fn.identity;
    var mGetTarget = sszvis.fn.identity;
    var mGetValue = sszvis.fn.identity;
    var mColumnIds = [];
    var mValuePadding = 0;

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
            columnIndex: columnIndex,
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
      var listOfColumns = columnIndex.values();

      listOfColumns.forEach(function(node) {
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
      });

      // Sort the column nodes themselves
      // (note, this sorts all nodes for all columns in the same array, but that should be fine)
      listOfColumns.sort(valueSortFunc);

      var columnTotals = listOfColumns.reduce(function(columnTotals, node) {
        node.valueOffset = columnTotals[node.columnIndex];
        columnTotals[node.columnIndex] += node.value + mValuePadding;
        return columnTotals;
      }, sszvis.fn.filledArray(mColumnIds.length, 0));

      // Add y-padding to vertically center all columns.
      // Need to account for the fact that mValuePadding is extra at the end of each columnTotal
      var maxTotal = d3.max(columnTotals) - mValuePadding;
      var columnPaddings = columnTotals.map(function(tot) { return (maxTotal - (tot - mValuePadding)) / 2; });

      listOfColumns.forEach(function(node) { node.valueOffset += columnPaddings[node.columnIndex]; });

      return {
        bars: listOfColumns,
        links: listofLinks
      };
    };

    main.apply = function(data) { return main(data); };

    main.source = function(func) { mGetSource = func; return main; };

    main.target = function(func) { mGetTarget = func; return main; };

    main.value = function(func) { mGetValue = func; return main; };

    main.valPadding = function(pad) { mValuePadding = pad; return main; };

    main.descendingSort = function() { valueSortFunc = byDescendingValue; return main; };

    main.ascendingSort = function() { valueSortFunc = byAscendingValue; return main; };

    main.column = function(columnIdsList) { mColumnIds.push(columnIdsList); return main; };

    return main;
  };

});
