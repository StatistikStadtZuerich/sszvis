sszvis_namespace('sszvis.component.sunburst', function(module) {
  'use strict';

  var TWO_PI = 2 * Math.PI;

  module.exports = function() {
    return d3.component()
      .prop('layout')
      .prop('fill')
      .prop('stroke').stroke('white')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
        function getColorRecursive(node) {
          // Center node (if the data were prepared using sszvis.layout.sunburst.prepareData)
          if (node.isSunburstRoot) {
            return d3.hsl('transparent');
          } else if (!node.parent) {
            // Accounts for incorrectly formatted data which hasn't gone through sszvis.layout.sunburst.prepareData
            sszvis.logger.warn('Data passed to sszvis.component.sunburst does not have the expected tree structure. You should prepare it using sszvis.format.sunburst.prepareData');
            return d3.hsl(props.fill(node.key));
          } else if (node.parent.isSunburstRoot) {
            // Use the color scale
            return d3.hsl(props.fill(node.key));
          } else {
            // Recurse up the tree and adjust the lightness value
            var pColor = getColorRecursive(node.parent);
            pColor.l *= 1.15;
            return pColor;
          }
        }

        // Usually, this should return the very first item in the list of data
        // But using find makes the algorithm data order-agnostic
        var rootDatum = sszvis.fn.find(function(d) { return d.isSunburstRoot; }, data);

        var angleScale = d3.scale.linear().range([0, TWO_PI]);

        var radiusScale = d3.scale.linear()
          .domain([rootDatum.dy, 1])
          .range([0, props.layout.numLayers * props.layout.ringWidth]);

        var arcGen = d3.svg.arc()
          .startAngle(function(d) {
            return Math.max(0, Math.min(TWO_PI, angleScale(d.x)));
          })
          .endAngle(function(d) {
            return Math.max(0, Math.min(TWO_PI, angleScale(d.x + d.dx)));
          })
          .innerRadius(function(d) {
            return props.layout.centerRadius + Math.max(0, radiusScale(d.y));
          })
          .outerRadius(function(d) {
            return props.layout.centerRadius + Math.max(0, radiusScale(d.y + d.dy));
          });

        var arcs = selection.selectAll('.sszvis-sunburst-arc')
          .data(data);

        arcs.enter()
          .append('path')
          .attr('class', 'sszvis-sunburst-arc')

        arcs
          .attr('d', arcGen)
          .attr('stroke', props.stroke)
          .attr('fill', getColorRecursive);
      });
  };

});
