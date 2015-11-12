sszvis_namespace('sszvis.component.sankey', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('sizeScale')
      .prop('columnPosition')
      .prop('nodeThickness')
      .prop('nodePadding')
      .prop('columnPadding', d3.functor)
      .prop('linkCurvature').linkCurvature(0.5)
      .prop('nodeColor', d3.functor)
      .prop('linkColor', d3.functor)
      .prop('linkSort', d3.functor).linkSort(function(a, b) { return a.value - b.value; }) // Default sorts in descending order of value
      .prop('labelSide', d3.functor).labelSide('left')
      .prop('labelHitBoxSize').labelHitBoxSize(0)
      .prop('nameLabel').nameLabel(sszvis.fn.identity)
      .prop('valueLabel').valueLabel(sszvis.fn.identity)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        var idAcc = sszvis.fn.prop('id');

        var getNodePosition = function(node) { return Math.floor(props.columnPadding(node.columnIndex) + props.sizeScale(node.valueOffset) + (props.nodePadding * node.nodeIndex)); };
        var xPosition = function(node) { return props.columnPosition(node.columnIndex); };
        var yPosition = function(node) { return getNodePosition(node); };
        var xExtent = function(node) { return Math.max(props.nodeThickness, 1); };
        var yExtent = function(node) { return Math.ceil(Math.max(props.sizeScale(node.value), 1)); };
        var linkPathString = function(x0, x1, x2, x3, y0, y1) { return 'M' + x0 + ',' + y0 + 'C' + x1 + ',' + y0 + ' ' + x2 + ',' + y1 + ' ' + x3 + ',' + y1; };
        var linkBounds = function(x0, x1, y0, y1) { return [x0, x1, y0, y1]; };
        var linkPadding = 1; // Default value for padding between nodes and links - cannot be changed

        // Draw the nodes
        var barGen = sszvis.component.bar()
          .x(xPosition)
          .y(yPosition)
          .width(xExtent)
          .height(yExtent)
          .fill(props.nodeColor);

        var barGroup = selection.selectGroup('nodes')
          .datum(data.nodes);

        barGroup.call(barGen);

        var barTooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(node) {
            return [xPosition(node) + xExtent(node) / 2, yPosition(node) + yExtent(node) / 2];
          });

        barGroup.call(barTooltipAnchor);

        // Draw the links
        var linkPoints = function(link) {
          var curveStart = props.columnPosition(link.src.columnIndex) + props.nodeThickness + linkPadding,
              curveEnd = props.columnPosition(link.tgt.columnIndex) - linkPadding,
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
        };

        var linkThickness = function(link) { return Math.max(props.sizeScale(link.value), 1); };

        var linksGroup = selection.selectGroup('links');

        var linksElems = linksGroup.selectAll('.sszvis-link')
          .data(data.links, idAcc);

        linksElems.enter()
          .append('path')
          .attr('class', 'sszvis-link');

        linksElems.exit().remove();

        linksElems
          .attr('fill', 'none')
          .attr('d', linkPath)
          .attr('stroke-width', linkThickness)
          .attr('stroke', props.linkColor)
          .sort(props.linkSort);

        linksGroup.datum(data.links);

        var linkTooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(link) {
            var bbox = linkBoundingBox(link);
            return [(bbox[0] + bbox[1]) / 2, (bbox[2] + bbox[3]) / 2];
          });

        linksGroup.call(linkTooltipAnchor);

        var barLabels = selection.selectGroup('nodelabels')
          .selectAll('.sszvis-sankey-label')
          .data(data.nodes);

        barLabels.enter()
          .append('text')
          .attr('class', 'sszvis-sankey-label');

        barLabels.exit().remove();

        barLabels
          .text(function(node) { return props.nameLabel(node.id); })
          .attr('text-align', 'middle')
          .attr('text-anchor', function(node) { return props.labelSide(node.columnIndex) === 'left' ? 'end' : 'start'; })
          .attr('x', function(node) { return props.labelSide(node.columnIndex) === 'left' ? xPosition(node) - 6 : xPosition(node) + props.nodeThickness + 6; })
          .attr('y', function(node) { return yPosition(node) + yExtent(node) / 2; });

        var barLabelHitBoxes = selection.selectGroup('nodelabels')
          .selectAll('.sszvis-sankey-hitbox')
          .data(data.nodes);

        barLabelHitBoxes.enter()
          .append('rect')
          .attr('class', 'sszvis-sankey-hitbox');

        barLabelHitBoxes.exit().remove();

        barLabelHitBoxes
          .attr('fill', 'transparent')
          .attr('x', function(node) { return xPosition(node) + (props.labelSide(node.columnIndex) === 'left' ? -props.labelHitBoxSize : props.nodeThickness); })
          .attr('y', function(node) { return yPosition(node) - (props.nodePadding / 2); })
          .attr('width', props.labelHitBoxSize)
          .attr('height', function(node) { return yExtent(node) + props.nodePadding; });


      });
  };

});
