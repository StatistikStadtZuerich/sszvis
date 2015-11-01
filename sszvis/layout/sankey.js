sszvis_namespace('sszvis.layout.sankey', function(module) {
  'use strict';

  module.exports.prepareData = function() {
    var mGetSource = sszvis.fn.identity;
    var mGetTarget = sszvis.fn.identity;
    var mGetValue = sszvis.fn.identity;
    var mColumnIds = [];

    var mNumCols = 0;
    var mColumns = {

    };

    var main = function(inputData) {
      var columnData = mColumnIds.reduce(function(memo, colIds, columnNumber) {
        var columnNodes = colIds.map(function(id) {
          if (memo.index[id]) {
            sszvis.logger.warn('Duplicate column member id passed to sszvis.layout.sankey.prepareData.column');
          }

          var item = {
            id: id,
            colNum: columnNumber,
            value: 0,
            linksFrom: [],
            linksTo: []
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
        var value = mGetValue(datum) || 0;

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
          tgt: tgtNode
        };

        srcNode.value += value;
        srcNode.linksFrom.push(item);

        tgtNode.value += value;
        tgtNode.linksTo.push(item);

        return item;
      });

      return {
        bars: columnData.nodes.slice(),
        links: linkData
      };
    };

    main.apply = function(data) { return main(data); };

    main.source = function(func) { mGetSource = func; return main; };

    main.target = function(func) { mGetTarget = func; return main; };

    main.value = function(func) { mGetValue = func; return main; };

    main.column = function(colIds) { mColumnIds.push(colIds); return main; };

    return main;
  };

});
