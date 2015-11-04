sszvis_namespace('sszvis.component.sankey', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('numColumns')
      .prop('columnExtent')
      .prop('nodeExtent')
      .prop('linkPadding').linkPadding(1)
      .prop('orientation').orientation('vertical') // Must be 'vertical' or 'horizontal'
      .prop('linkCurvature').linkCurvature(0.5)
      .prop('nodeColor', d3.functor)
      .prop('linkColor', d3.functor)
      .prop('nameLabel').nameLabel(sszvis.fn.identity)
      .prop('valueLabel').valueLabel(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // Set up scales based on required input
        var valueScale = d3.scale.linear()
          .domain(data.domain)
          .range(data.range);

        var columnPosition = d3.scale.linear()
          .domain([0, 1])
          .range([0, props.columnExtent]);

        // Set up configurable horizontal/vertical display functions
        var isHorizontal = props.orientation === 'horizontal';

        var xPosition, yPosition, xExtent, yExtent, linkPathString;

        if (isHorizontal) {
          xPosition = function(node) { return valueScale(node.valueOffset); };
          yPosition = function(node) { return columnPosition(node.columnIndex); };
          xExtent = function(node) { return Math.max(valueScale(node.value), 1); };
          yExtent = function(node) { return Math.max(props.nodeExtent, 1); };
          linkPathString = function(y0, y1, y2, y3, x0, x1) { return 'M' + x0 + ',' + y0 + 'C' + x0 + ',' + y1 + ' ' + x1 + ',' + y2 + ' ' + x1 + ',' + y3; };
        } else {
          xPosition = function(node) { return columnPosition(node.columnIndex); };
          yPosition = function(node) { return valueScale(node.valueOffset); };
          xExtent = function(node) { return Math.max(props.nodeExtent, 1); };
          yExtent = function(node) { return Math.max(valueScale(node.value), 1); };
          linkPathString = function(x0, x1, x2, x3, y0, y1) { return 'M' + x0 + ',' + y0 + 'C' + x1 + ',' + y0 + ' ' + x2 + ',' + y1 + ' ' + x3 + ',' + y1; };
        }

        // Draw the bars
        var barGen = sszvis.component.bar()
          .x(xPosition)
          .y(yPosition)
          .width(xExtent)
          .height(yExtent)
          .fill(props.nodeColor);

        var renderedBars = selection.selectGroup('bars')
          .datum(data.bars)
          .call(barGen);

        // Draw the links
        var linkPath = function(link) {
          var curveStart = columnPosition(link.src.columnIndex) + props.nodeExtent + props.linkPadding,
              curveEnd = columnPosition(link.tgt.columnIndex) - props.linkPadding,
              curveInterp = d3.interpolateNumber(curveStart, curveEnd),
              curveControlPtA = curveInterp(props.linkCurvature),
              curveControlPtB = curveInterp(1 - props.linkCurvature),
              startLevel = valueScale(link.src.valueOffset + link.srcOffset) + (valueScale(link.value) / 2),
              endLevel = valueScale(link.tgt.valueOffset + link.tgtOffset) + (valueScale(link.value) / 2);

          return linkPathString(curveStart, curveControlPtA, curveControlPtB, curveEnd, startLevel, endLevel);
        };

        var linkThickness = function(link) { return Math.max(valueScale(link.value), 1); };

        var linksGroup = selection.selectGroup('links')
          .datum(data.links);

        var linksElems = linksGroup.selectAll('.sszvis-link')
          .data(data.links);

        linksElems.enter()
          .append('path')
          .attr('class', 'sszvis-link');

        linksElems.exit().remove();

        linksElems
          .attr('fill', 'none')
          .attr('d', linkPath)
          .attr('stroke-width', linkThickness)
          .attr('stroke', props.linkColor);

          });
      });
  };

});
