/**
 * Sunburst component
 *
 * This component renders a sunburst diagram, which is kind of like a layered pie chart. There is an
 * inner ring of values, which are total values for some large category. Each of these categories can
 * be broken down into smaller categories, which are shown in another layer around the inner ring. If these
 * categories can in turn be broken down into smaller ones, you can add yet another layer. The result
 * is a hierarchical display with the level of aggregation getting finer and finer as you get further
 * from the center of the chart.
 *
 * This component uses the data structure returned by the sszvis.layout.sunbust.prepareData function, and
 * can be configured using the sszvis.layout.sunburst.computeLayout function. Under the hood, the prepareData
 * function uses d3's nest data transformer (d3.nest) to construct a nested data structure from the input
 * array, and d3's partition layout (d3.layout.partition), and the resulting data structure will be
 * familiar to those familiar with the partition layout.
 *
 * @property {Function} angleScale              Scale function for the angle of the segments of the sunburst chart. If using the
 *                                              sszvis.layout.sunburst.prepareData function, the domain will be [0, 1]. The range
 *                                              should usually be [0, 2 * PI]. That domain and range are used as default for this property.
 * @property {Function} radiusScale             Scale function for the radius of segments. Can be configured using values returned from
 *                                              sszvis.layout.sunburst.computeLayout. See the examples for how the scale setup works.
 * @property {Number} centerRadius              The radius of the center of the chart. Can be configured with sszvis.layout.sunburst.computeLayout.
 * @property {Function} fill                    Function that returns the fill color for the segments in the center of the chart. Note that this will only be
 *                                              called on the centermost segments. The segments which are subcategories of these center segments
 *                                              will have their fill determined recursively, by lightening the color of its parent segment.
 * @property {Color, Function} stroke           The stroke color of the segments. Defaults to white.
 *
 * @return {d3.component}
 */
sszvis_namespace('sszvis.component.sunburst', function(module) {
  'use strict';

  var TWO_PI = 2 * Math.PI;

  module.exports = function() {
    return d3.component()
      .prop('angleScale').angleScale(d3.scale.linear().range([0, 2 * Math.PI]))
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

        data.forEach(function(d) {
          // _x and _dx are the destination values for the transition.
          // We set these to the computed x and dx.
          d._x = d.x;
          d._dx = d.dx;
        });

        var arcs = selection.selectAll('.sszvis-sunburst-arc')
          .each(function(d, i) {
            if (data[i]) {
              // x and dx are the current/transitioning values
              // We set these here, in case any datums already exist which have values set
              data[i].x = d.x;
              data[i].dx = d.dx;
              // The transition tweens from x and dx to _x and _dx
            }
          })
          .data(data);

        arcs.enter()
          .append('path')
          .attr('class', 'sszvis-sunburst-arc')

        arcs.exit().remove();

        arcs
          .attr('stroke', props.stroke)
          .attr('fill', getColorRecursive);

        arcs.transition()
          .call(sszvis.transition)
          .attrTween('d', function(d) {
            var xInterp = d3.interpolate(d.x, d._x);
            var dxInterp = d3.interpolate(d.dx, d._dx);
            return function(t) {
              d.x = xInterp(t);
              d.dx = dxInterp(t);
              return arcGen(d);
            }
          });

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
