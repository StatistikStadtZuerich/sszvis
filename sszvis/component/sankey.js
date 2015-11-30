/**
 * Sankey component
 *
 * This component is used for making sankey diagrams, also known as parallel sets diagrams. They
 * depict individual entities as bars, and flows between those entities as thick links connecting
 * those bars. The entities can be many things associated with flows, for example organizations,
 * geographic regions, or websites, while the links between them can represent many kinds of flows,
 * for example payments of money, movements of people, or referral of browsing traffic. In this component,
 * the entities are referred to as 'nodes', and the connections between them are referred to as 'links'.
 *
 * @module sszvis/component/sankey
 *
 * @property {Function} sizeScale                    A scale function for the size of the nodes. The domain and the range should
 *                                                   be configured using values returned by the sszvis.layout.sankey.computeLayout
 *                                                   function.
 * @property {Function} columnPosition               A scale function for the position of the columns of nodes.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number} nodeThickness                  A number for the horizontal thickness of the node bars.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number} nodePadding                    A number for padding between the nodes.
 *                                                   Should be configured using a value returned by the sszvis.layout.sankey.computeLayout function.
 * @property {Number, Function} columnPadding        A number, or function that takes a column index and returns a number,
 *                                                   for padding at the top of each column. Used to vertically center the columns.
 * @property {String, Function} columnLabel          A string, or a function that returns a string, for the label at the top of each column.
 * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default 0.5.
 * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color.
 * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color.
 * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
 *                                                   The default implementation stacks links in decresing order of value, i.e. larger, thicker links
 *                                                   are below smaller, thinner ones.
 * @property {String, Function} labelSide            A function determining the position of labels for the nodes. Should take a column index and
 *                                                   return a side ('left' or 'right'). Default is always 'left'.
 * @property {Number} labelHitBoxSize                A number for the width of 'hit boxes' added underneath the labels. This should basically be
 *                                                   equal to the width of the widest label. For performance reasons, it doesn't make sense to calculate
 *                                                   this value at run time while the component is rendered. Far better is to position the chart so that the
 *                                                   labels are visible, find the value of the widest label, and use that.
 * @property {Function} nameLabel                    A function which takes the id of a node and should return the label for that node. Defaults tousing
 *                                                   the id directly.
 * @property {Array} linkSourceLabels                An array containing the data for links which should have labels on their 'source' end, that is the
 *                                                   end of the link which is connected to the source node. These data values should match the values
 *                                                   returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give the data
 *                                                   values themselves here. See the examples for an implementation of the most straightforward
 *                                                   mechanism for this.
 * @property {Array} linkTargetLabels                An array containing data for links which should have labels on their 'target' end, that is the
 *                                                   end of the link which is connected to the target node. Works the same as linkSourceLabels, but used
 *                                                   for another set of possible link labels.
 * @property {String, Function} linkLabel            A string or function returning a string to use for the label of each link. Function
 *                                                   versions should accept a link datum (like the ones passed into linkSourceLabels or linkTargetLabels)
 *                                                   and return text.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.component.sankey', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('sizeScale')
      .prop('columnPosition')
      .prop('nodeThickness')
      .prop('nodePadding')
      .prop('columnPadding', d3.functor)
      .prop('columnLabel', d3.functor).columnLabel('')
      .prop('linkCurvature').linkCurvature(0.5)
      .prop('nodeColor', d3.functor)
      .prop('linkColor', d3.functor)
      .prop('linkSort', d3.functor).linkSort(function(a, b) { return a.value - b.value; }) // Default sorts in descending order of value
      .prop('labelSide', d3.functor).labelSide('left')
      .prop('labelHitBoxSize').labelHitBoxSize(0)
      .prop('nameLabel').nameLabel(sszvis.fn.identity)
      .prop('linkSourceLabels').linkSourceLabels([])
      .prop('linkTargetLabels').linkTargetLabels([])
      .prop('linkLabel', d3.functor)
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

        // Draw the column labels
        var columnLabelX = function(colIndex) { return props.columnPosition(colIndex) + props.nodeThickness / 2; };
        var columnLabelY = -24;

        var columnLabels = barGroup
          .selectAll('.sszvis-sankey-column-label')
          // One number for each column
          .data(data.columnLengths);

        columnLabels.enter()
          .append('text')
          .attr('class', 'sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-column-label');

        columnLabels.exit().remove();

        columnLabels
          .attr('transform', function(d, i) { return sszvis.svgUtils.translateString(columnLabelX(i), columnLabelY); })
          .text(function(d, i) { return props.columnLabel(i); });

        var columnLabelTicks = barGroup
          .selectAll('.sszvis-sankey-column-label-tick')
          .data(data.columnLengths);

        columnLabelTicks.enter()
          .append('line')
          .attr('class', 'sszvis-sankey-column-label-tick');

        columnLabelTicks.exit().remove();

        columnLabelTicks
          .attr('x1', function(d, i) { return sszvis.svgUtils.crisp.halfPixel(columnLabelX(i)); })
          .attr('x2', function(d, i) { return sszvis.svgUtils.crisp.halfPixel(columnLabelX(i)); })
          .attr('y1', sszvis.svgUtils.crisp.halfPixel(columnLabelY + 8))
          .attr('y2', sszvis.svgUtils.crisp.halfPixel(columnLabelY + 12));

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

        // Render the links
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

        // Render the link labels
        var linkLabelsGroup = selection.selectGroup('linklabels');

        // If no props.linkSourceLabels are provided, most of this rendering is no-op
        var linkSourceLabels = linkLabelsGroup
          .selectAll('.sszvis-sankey-link-source-label')
          .data(props.linkSourceLabels);

        linkSourceLabels.enter()
          .append('text')
          .attr('class', 'sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-source-label');

        linkSourceLabels.exit().remove();

        linkSourceLabels
          .attr('transform', function(link) {
            var bbox = linkBoundingBox(link);
            return sszvis.svgUtils.translateString(bbox[0] + 6, bbox[2]);
          })
          .text(props.linkLabel);

        // If no props.linkTargetLabels are provided, most of this rendering is no-op
        var linkTargetLabels = linkLabelsGroup
          .selectAll('.sszvis-sankey-link-target-label')
          .data(props.linkTargetLabels);

        linkTargetLabels.enter()
          .append('text')
          .attr('class', 'sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-target-label');

        linkTargetLabels.exit().remove();

        linkTargetLabels
          .attr('transform', function(link) {
            var bbox = linkBoundingBox(link);
            return sszvis.svgUtils.translateString(bbox[1] - 6, bbox[3]);
          })
          .text(props.linkLabel);

        // Render the node labels and their hit boxes
        var nodeLabelsGroup = selection.selectGroup('nodelabels');

        var barLabels = nodeLabelsGroup
          .selectAll('.sszvis-sankey-node-label')
          .data(data.nodes);

        barLabels.enter()
          .append('text')
          .attr('class', 'sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-node-label');

        barLabels.exit().remove();

        barLabels
          .text(function(node) { return props.nameLabel(node.id); })
          .attr('text-align', 'middle')
          .attr('text-anchor', function(node) { return props.labelSide(node.columnIndex) === 'left' ? 'end' : 'start'; })
          .attr('x', function(node) { return props.labelSide(node.columnIndex) === 'left' ? xPosition(node) - 6 : xPosition(node) + props.nodeThickness + 6; })
          .attr('y', function(node) { return yPosition(node) + yExtent(node) / 2; });

        var barLabelHitBoxes = nodeLabelsGroup
          .selectAll('.sszvis-sankey-hitbox')
          .data(data.nodes);

        barLabelHitBoxes.enter()
          .append('rect')
          .attr('class', 'sszvis-sankey-hitbox');

        barLabelHitBoxes.exit().remove();

        barLabelHitBoxes
          .attr('fill', 'transparent')
          .attr('x', function(node) { return xPosition(node) + (props.labelSide(node.columnIndex) === 'left' ? -props.labelHitBoxSize : 0); })
          .attr('y', function(node) { return yPosition(node) - (props.nodePadding / 2); })
          .attr('width', props.labelHitBoxSize + props.nodeThickness)
          .attr('height', function(node) { return yExtent(node) + props.nodePadding; });


      });
  };

});
