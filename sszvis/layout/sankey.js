sszvis_namespace('sszvis.layout.sankey', function(module) {
  'use strict';

  module.exports.prepareData = function() {
    var mGetSource = sszvis.fn.identity;
    var mGetTarget = sszvis.fn.identity;
    var mGetValue = sszvis.fn.identity;
    var mColumnIds = [];
    var mYPadding = 10;

    // Helper functions
    var valueAcc = sszvis.fn.prop('value');
    var byAscendingValue = function(a, b) { return d3.ascending(valueAcc(a), valueAcc(b)); };
    var byDescendingValue = function(a, b) { return d3.descending(valueAcc(a), valueAcc(b)); };

    var valueSortFunc = byDescendingValue;

    var main = function(inputData) {
      var columnData = mColumnIds.reduce(function(memo, columnIdsList, columnIdx) {
        var columnNodes = columnIdsList.map(function(id) {
          if (memo.index[id]) {
            sszvis.logger.warn('Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:', id, 'The existing value will be overwritten');
          }

          var item = {
            id: id,
            colNum: columnIdx,
            value: 0,
            linksFrom: [],
            linksTo: [],
            x: columnIdx,
            y: 0
          };
          
          memo.index[id] = item;

          return item;
        });

        memo.nodes = memo.nodes.concat(columnNodes);

        return memo;
      }, {
        nodes: [],
        index: {}
      });

      var linkData = inputData.map(function(datum) {
        var srcId = mGetSource(datum);
        var tgtId = mGetTarget(datum);
        var value = + mGetValue(datum) || 0; // Cast this to number

        var srcNode = columnData.index[srcId];
        var tgtNode = columnData.index[tgtId];

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
          srcy: 0,
          tgt: tgtNode,
          tgty: 0
        };

        srcNode.linksFrom.push(item);
        tgtNode.linksTo.push(item);

        return item;
      });

      columnData.nodes.forEach(function(node) {
        node.linksFrom.sort(valueSortFunc);
        node.linksTo.sort(valueSortFunc);

        node.linksFrom.reduce(function(sumValue, link) {
          link.srcy = sumValue;
          return sumValue + valueAcc(link);
        }, 0);

        node.linksTo.reduce(function(sumValue, link) {
          link.tgty = sumValue;
          return sumValue + valueAcc(link);
        }, 0);

        node.value = Math.max(0, d3.sum(node.linksFrom, valueAcc), d3.sum(node.linksTo, valueAcc));
      });

      columnData.nodes.sort(valueSortFunc);

      var columnTotals = columnData.nodes.reduce(function(columnTotals, node) {
        var accumulatedY = columnTotals[node.x] || 0;
        node.y = accumulatedY;
        columnTotals[node.x] = accumulatedY + node.value + mYPadding;

        return columnTotals;
      }, []);

      var maxTotal = d3.max(columnTotals);
      var columnPaddings = columnTotals.map(function(tot) { return (maxTotal - tot) / 2; });

      columnData.nodes.forEach(function(node) {
        node.y += columnPaddings[node.x];
      });

      return {
        bars: columnData.nodes,
        links: linkData
      };
    };

    main.apply = function(data) { return main(data); };

    main.source = function(func) { mGetSource = func; return main; };

    main.target = function(func) { mGetTarget = func; return main; };

    main.value = function(func) { mGetValue = func; return main; };

    main.yPadding = function(pad) { mYPadding = pad; return main; };

    main.descendingSort = function() { valueSortFunc = byDescendingValue; return main; };

    main.ascendingSort = function() { valueSortFunc = byAscendingValue; return main; };

    main.column = function(columnIdsList) { mColumnIds.push(columnIdsList); return main; };

    return main;
  };

});
