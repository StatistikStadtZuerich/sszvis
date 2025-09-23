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
 * This component can accept either:
 * 1. Pre-processed flat sunburst data (backwards compatibility)
 * 2. Raw hierarchical data from prepareHierarchyData() (recommended)
 *
 * When using raw hierarchical data, the component will automatically apply the partition layout
 * and flatten the data internally.
 *
 * @property {Function} angleScale              Scale function for the angle of the segments of the sunburst chart. The domain
 *                                              should usually be [0, 1] and the range [0, 2 * PI]. These are used as defaults.
 * @property {Function} radiusScale             Scale function for the radius of segments. Can be configured using values returned from
 *                                              sszvis.layout.sunburst.computeLayout. See the examples for how the scale setup works.
 * @property {Number} centerRadius              The radius of the center of the chart. Can be configured with sszvis.layout.sunburst.computeLayout.
 * @property {Function} fill                    Function that returns the fill color for the segments in the center of the chart. Note that this will only be
 *                                              called on the centermost segments. The segments which are subcategories of these center segments
 *                                              will have their fill determined recursively, by lightening the color of its parent segment.
 * @property {Color, Function} stroke           The stroke color of the segments. Defaults to white.
 *
 * @return {sszvis.component}
 */

import { arc, hsl, interpolate, partition, scaleLinear, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { component } from "../d3-component.js";
import * as logger from "../logger.js";
import { defaultTransition } from "../transition.js";

const TWO_PI = 2 * Math.PI;

export default function () {
  return component()
    .prop("angleScale")
    .angleScale(scaleLinear().range([0, 2 * Math.PI]))
    .prop("radiusScale")
    .prop("centerRadius")
    .prop("fill")
    .prop("stroke")
    .stroke("white")
    .render(function (inputData) {
      const selection = select(this);
      const props = selection.props();

      // NOTE: Determine if we have raw hierarchical data or pre-computed sunburst data
      // @deprecated in v3.4.0
      let data;

      if (Array.isArray(inputData)) {
        // Already computed sunburst data (backwards compatibility)
        data = inputData;
      } else {
        partition()(inputData);
        function flatten(node) {
          return Array.prototype.concat.apply([node], (node.children || []).map(flatten));
        }
        data = flatten(inputData).filter((d) => d.data._tag !== "root");
      }

      // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
      function getColorRecursive(node) {
        // Center node (if the data were prepared using sszvis.prepareHierarchyData)
        if (node.data._tag === "root") {
          return "transparent";
        } else if (!node.parent) {
          // Accounts for incorrectly formatted data which hasn't gone through sszvis.prepareHierarchyData
          logger.warn(
            "Data passed to sszvis.component.sunburst does not have the expected tree structure. You should prepare it using sszvis.prepareHierarchyData"
          );
          return hsl(props.fill(node.data.key));
        } else if (node.parent.data._tag === "root") {
          // Use the color scale
          return hsl(props.fill(node.data.key));
        } else {
          // Recurse up the tree and adjust the lightness value
          const pColor = getColorRecursive(node.parent);
          pColor.l *= 1.15;
          return pColor;
        }
      }

      const startAngle = function (d) {
        return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x0)));
      };
      const endAngle = function (d) {
        return Math.max(0, Math.min(TWO_PI, props.angleScale(d.x1)));
      };
      const innerRadius = function (d) {
        return props.centerRadius + Math.max(0, props.radiusScale(d.y0));
      };
      const outerRadius = function (d) {
        return props.centerRadius + Math.max(0, props.radiusScale(d.y1));
      };

      const arcGen = arc()
        .startAngle(startAngle)
        .endAngle(endAngle)
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

      for (const d of data) {
        // _x and _dx are the destination values for the transition.
        // We set these to the computed x and dx.
        d._x0 = d.x0;
        d._x1 = d.x1;
      }

      const arcs = selection
        .selectAll(".sszvis-sunburst-arc")
        .each((d, i) => {
          if (data[i]) {
            // x and dx are the current/transitioning values
            // We set these here, in case any datums already exist which have values set
            data[i].x0 = d.x0;
            data[i].x1 = d.x1;
            // The transition tweens from x and dx to _x and _dx
          }
        })
        .data(data)
        .join("path")
        .attr("class", "sszvis-sunburst-arc");

      arcs.attr("stroke", props.stroke).attr("fill", getColorRecursive);

      arcs.transition(defaultTransition()).attrTween("d", (d) => {
        const x0Interp = interpolate(d.x0, d._x0);
        const x1Interp = interpolate(d.x1, d._x1);
        return function (t) {
          d.x0 = x0Interp(t);
          d.x1 = x1Interp(t);
          return arcGen(d);
        };
      });

      // Add tooltip anchors
      const arcTooltipAnchor = tooltipAnchor().position((d) => {
        const startA = startAngle(d);
        const endA = endAngle(d);
        const a = startA + Math.abs(endA - startA) / 2 - Math.PI / 2;
        const r = (innerRadius(d) + outerRadius(d)) / 2;
        return [Math.cos(a) * r, Math.sin(a) * r];
      });

      selection.call(arcTooltipAnchor);
    });
}
