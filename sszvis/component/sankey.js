sszvis_namespace('sszvis.component.sankey', function(module) {
  'use strict';

  module.exports = function() {
    return d3.component()
      .prop('numColumns')
      .prop('nodeWidth')
      .prop('columnWidth')
      .prop('linkPadding').linkPadding(1)
      .prop('orientation').orientation('vertical')
      .prop('linkCurvature').linkCurvature(0.5)
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        console.log(data);

        var sizeScale = d3.scale.linear()
          .domain(data.domain)
          .range(data.range);

        var xScale = d3.scale.linear()
          .domain([0, 1])
          .range([0, props.columnWidth]);

        var barBlue = sszvis.color.qual12()(0);
        var linkGrey = sszvis.color.gry()(0);

        var barGen = sszvis.component.bar()
          .x(function(node) { return xScale(node.columnIndex); })
          .y(function(node) { return sizeScale(node.valueOffset); })
          .width(props.nodeWidth)
          .height(function(node) { return Math.max(sizeScale(node.value), 1);  })
          .fill(barBlue);

        var makeLink = function(link) {
          var x0 = xScale(link.src.columnIndex) + props.nodeWidth + props.linkPadding,
              x1 = xScale(link.tgt.columnIndex) - props.linkPadding,
              xi = d3.interpolateNumber(x0, x1),
              x2 = xi(props.linkCurvature),
              x3 = xi(1 - props.linkCurvature),
              y0 = sizeScale(link.src.valueOffset) + sizeScale(link.srcOffset) + (sizeScale(link.value) / 2),
              y1 = sizeScale(link.tgt.valueOffset) + sizeScale(link.tgtOffset) + (sizeScale(link.value) / 2);

          return 'M' + x0 + ',' + y0 +
                 'C' + x2 + ',' + y0 +
                 ' ' + x3 + ',' + y1 +
                 ' ' + x1 + ',' + y1;
        };

        var barsGroup = selection.selectGroup('bars')
          .datum(data.bars)
          .call(barGen);

        var linksGroup = selection.selectGroup('links');

        var linksElems = linksGroup.selectAll('.sszvis-link')
          .data(data.links);

        linksElems.enter()
          .append('path')
          .attr('class', 'sszvis-link');

        linksElems.exit().remove();

        linksElems
          .attr('d', makeLink)
          .attr('fill', 'none')
          .attr('stroke', linkGrey)
          .attr('stroke-width', function(d) {
            return Math.max(sizeScale(d.value), 1);
          });
      });
  };

});
