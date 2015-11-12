sszvis_namespace('sszvis.component.sunburst', function(module) {
  'use strict';

  var TWO_PI = 2 * Math.PI;

  module.exports = function() {
    return d3.component()
      .prop('angleScale')
      .prop('radiusScale')
      .prop('centerRadius')
      .prop('fill')
      .prop('stroke').stroke('white')
      .render(function(data) {
        var selection = d3.select(this);
        var props = selection.props();

        // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
        function getColorRecursive(node) {
          // Center node (if the data were prepared using sszvis.layout.sunburst.prepareData)
          if (node.isSunburstRoot) {
            return 'transparent';
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

        var startAngle = function(d) { return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x))); };
        var endAngle = function(d) { return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x + d.dx))); };
        var innerRadius = function(d) { return props.centerRadius + Math.max(0, props.radiusScale(d.y)); };
        var outerRadius = function(d) { return props.centerRadius + Math.max(0, props.radiusScale(d.y + d.dy)); };

        var arcGen = d3.svg.arc()
          .startAngle(startAngle)
          .endAngle(endAngle)
          .innerRadius(innerRadius)
          .outerRadius(outerRadius);

        var arcs = selection.selectAll('.sszvis-sunburst-arc')
          .data(data.filter(function(d) { return !d.isSunburstRoot; }));

        arcs.enter()
          .append('path')
          .attr('class', 'sszvis-sunburst-arc')

        arcs.exit().remove();

        arcs
          .attr('d', arcGen)
          .attr('stroke', props.stroke)
          .attr('fill', getColorRecursive);

        // Add tooltip anchors
        var arcTooltipAnchor = sszvis.annotation.tooltipAnchor()
          .position(function(d) {
            var startA = startAngle(d);
            var endA = endAngle(d);
            var a = startA + (Math.abs(endA - startA) / 2) - Math.PI / 2;
            var r = (innerRadius(d) + outerRadius(d)) / 2;
            return [Math.cos(a) * r, Math.sin(a) * r];
          });

        selection.call(arcTooltipAnchor);
      });
  };

});
