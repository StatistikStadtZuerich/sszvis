sszvis_namespace('sszvis.component.sankey', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('sizeScale')
      .prop('columnPosition')
      .prop('nodeThickness')
      .prop('nodePadding')
      .prop('columnPadding', d3.functor)
      .prop('orientation').orientation('vertical') // Must be 'vertical' or 'horizontal'
      .prop('linkPadding').linkPadding(1)
      .prop('linkCurvature').linkCurvature(0.5)
      .prop('nodeColor', d3.functor)
      .prop('linkColor', d3.functor)
      .prop('nameLabel').nameLabel(sszvis.fn.identity)
      .prop('valueLabel').valueLabel(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // Set up configurable horizontal/vertical display functions
        var isHorizontal = props.orientation === 'horizontal';

        var xPosition, yPosition, xExtent, yExtent, linkPathString, linkBounds;

        function getNodePosition(node) { return Math.floor(props.columnPadding(node.columnIndex) + props.sizeScale(node.valueOffset) + (props.nodePadding * node.nodeIndex)); }

        if (isHorizontal) {
          xPosition = function(node) { return getNodePosition(node); };
          yPosition = function(node) { return props.columnPosition(node.columnIndex); };
          xExtent = function(node) { return Math.ceil(Math.max(props.sizeScale(node.value), 1)); };
          yExtent = function(node) { return Math.max(props.nodeThickness, 1); };
          linkPathString = function(y0, y1, y2, y3, x0, x1) { return 'M' + x0 + ',' + y0 + 'C' + x0 + ',' + y1 + ' ' + x1 + ',' + y2 + ' ' + x1 + ',' + y3; };
          linkBounds = function(y0, y1, x0, x1) { return [x0, x1, y0, y1]; };
        } else {
          xPosition = function(node) { return props.columnPosition(node.columnIndex); };
          yPosition = function(node) { return getNodePosition(node); };
          xExtent = function(node) { return Math.max(props.nodeThickness, 1); };
          yExtent = function(node) { return Math.ceil(Math.max(props.sizeScale(node.value), 1)); };
          linkPathString = function(x0, x1, x2, x3, y0, y1) { return 'M' + x0 + ',' + y0 + 'C' + x1 + ',' + y0 + ' ' + x2 + ',' + y1 + ' ' + x3 + ',' + y1; };
          linkBounds = function(x0, x1, y0, y1) { return [x0, x1, y0, y1]; };
        }

        // Draw the bars
        var barGen = sszvis.component.bar()
          .x(xPosition)
          .y(yPosition)
          .width(xExtent)
          .height(yExtent)
          .fill(props.nodeColor);

        var barGroup = selection.selectGroup('bars')
          .datum(data.bars);

        barGroup.call(barGen);

        var barTooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(node) {
            return [xPosition(node) + xExtent(node) / 2, yPosition(node) + yExtent(node) / 2];
          });

        barGroup.call(barTooltipAnchor);

        // Draw the links
        var linkPoints = function(link) {
          var curveStart = props.columnPosition(link.src.columnIndex) + props.nodeThickness + props.linkPadding,
              curveEnd = props.columnPosition(link.tgt.columnIndex) - props.linkPadding,
              startLevel = getNodePosition(link.src) + props.sizeScale(link.srcOffset) + (props.sizeScale(link.value) / 2),
              endLevel = getNodePosition(link.tgt) + props.sizeScale(link.tgtOffset) + (props.sizeScale(link.value) / 2);

          return [curveStart, curveEnd, startLevel, endLevel];
        };

        var linkPath = function(link) {
          var points = linkPoints(link),
              curveInterp = d3.interpolateNumber(points[0], points[1]),
              curveControlPtA = curveInterp(props.linkCurvature),
              curveControlPtB = curveInterp(1 - props.linkCurvature);

          return linkPathString(points[0], curveControlPtA, curveControlPtB, points[1], points[2], points[3]);
        };

        var linkBoundingBox = function(link) {
          var points = linkPoints(link);

          return linkBounds(points[0], points[1], points[2], points[3]);
        }

        var linkThickness = function(link) { return Math.max(props.sizeScale(link.value), 1); };

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

        var linkTooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(link) {
            var bbox = linkBoundingBox(link);
            return [(bbox[0] + bbox[1]) / 2, (bbox[2] + bbox[3]) / 2];
          });

        linksGroup.call(linkTooltipAnchor);
      });
  };

});
