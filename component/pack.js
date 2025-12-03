import { select, pack as pack$1 } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { getAccessibleTextColor } from '../color.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { defaultTransition } from '../transition.js';

/**
 * Pack component
 *
 * This component renders a Pack (also known as a circle pack diagram), which displays
 * hierarchical data as a collection of nested circles. The size of each circle corresponds to
 * a quantitative value, and circles are positioned using D3's pack layout algorithm to
 * efficiently fill the available space with minimal overlap.
 *
 * The component expects data prepared using the prepareHierarchyData function, which converts
 * flat data into a hierarchical structure suitable for the pack layout.
 *
 * @module sszvis/component/pack
 * @template T The type of the original flat data objects
 *
 * @property {string, function} colorScale        The fill color accessor for circles
 * @property {boolean} transition                 Whether to animate changes (default true)
 * @property {number, function} containerWidth    The container width (default 800)
 * @property {number, function} containerHeight   The container height (default 600)
 * @property {boolean} showLabels                 Whether to display labels on leaf nodes (default false)
 * @property {string, function} label             The label text accessor (default d.data.key)
 * @property {number} minRadius                   Minimum circle radius for visibility (default 1)
 * @property {string} circleStroke                Circle stroke color (default "#ffffff")
 * @property {number} circleStrokeWidth           Circle stroke width (default 1)
 * @property {function} radiusScale               Custom radius scale function for circle sizing (optional)
 * @property {function} onClick                   Click handler for circles (receives node and event)
 *
 * @return {sszvis.component}
 */
/**
 * Main Pack component
 *
 * @template T The type of the original flat data objects
 */
function pack () {
  return component().prop("colorScale").prop("transition").transition(true).prop("containerWidth").containerWidth(800) // Default width
  .prop("containerHeight").containerHeight(600) // Default height
  .prop("showLabels").showLabels(false) // Default disabled
  .prop("label", functor).label(d => d.data && "key" in d.data ? d.data.key : "").prop("minRadius").minRadius(20).prop("circleStroke").circleStroke("#ffffff").prop("circleStrokeWidth").circleStrokeWidth(1).prop("radiusScale", functor).prop("onClick").render(function (inputData) {
    const selection = select(this);
    const props = selection.props();
    // Apply pack layout to hierarchical data
    const layout = pack$1().size([props.containerWidth, props.containerHeight]).padding(4).radius(props.radiusScale || null);
    layout(inputData);
    // Flatten the hierarchy and filter out root
    function flatten(node) {
      const result = [];
      if (node.children) {
        for (const child of node.children) {
          if (child.data._tag !== "root") {
            result.push(child);
          }
          result.push(...flatten(child));
        }
      } else if (node.data._tag !== "root") {
        result.push(node);
      }
      return result;
    }
    const packData = flatten(inputData);
    // Filter out very small circles - include both branches (categories) and leaves
    const visibleData = packData.filter(d => d.r > (props.minRadius || 1));
    const circles = selection.selectAll(".sszvis-pack-circle").data(visibleData).join("circle").classed("sszvis-pack-circle", true).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r).attr("fill", d => {
      if (d.children) {
        // Branch nodes should have a light fill to be able to click them
        return "white";
      }
      // Leaf nodes - use rootKey for consistent color mapping
      if ("rootKey" in d.data && d.data.rootKey) {
        return props.colorScale(d.data.rootKey);
      }
      // Fallback: find top-level category by traversing ancestors
      const ancestors = d.ancestors();
      const topLevelCategory = ancestors.find((_, i) => {
        var _ancestors;
        return i < ancestors.length - 1 && ((_ancestors = ancestors[i + 1]) === null || _ancestors === void 0 ? void 0 : _ancestors.data._tag) === "root";
      });
      if (topLevelCategory && "key" in topLevelCategory.data) {
        return props.colorScale(topLevelCategory.data.key);
      } else if ("key" in d.data) {
        return props.colorScale(d.data.key);
      }
      return "#cccccc"; // Default fill if no key found
    }).attr("stroke", d => {
      // Branch nodes (categories) get color stroke, leaf nodes get white stroke
      // Leaf nodes - use rootKey for consistent color mapping
      if ("rootKey" in d.data && d.data.rootKey) {
        return props.colorScale(d.data.rootKey);
      }
      // Fallback: find top-level category by traversing ancestors
      const ancestors = d.ancestors();
      const topLevelCategory = ancestors.find((_, i) => {
        var _ancestors2;
        return i < ancestors.length - 1 && ((_ancestors2 = ancestors[i + 1]) === null || _ancestors2 === void 0 ? void 0 : _ancestors2.data._tag) === "root";
      });
      if (topLevelCategory && "key" in topLevelCategory.data) {
        return props.colorScale(topLevelCategory.data.key);
      } else if (d.children) {
        if ("key" in d.data) {
          return props.colorScale(d.data.key);
        }
        return "#cccccc"; // Default stroke color for branches
      } else {
        return props.circleStroke;
      }
    }).attr("stroke-width", d => {
      // Branch nodes get thicker stroke to make them more visible
      return d.children ? 2 : props.circleStrokeWidth;
    }).style("cursor", props.onClick ? "pointer" : "default").on("click", (event, d) => {
      var _props$onClick;
      return (_props$onClick = props.onClick) === null || _props$onClick === void 0 ? void 0 : _props$onClick.call(props, event, d);
    });
    // Apply transitions if enabled
    if (props.transition) {
      circles.transition(defaultTransition()).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r);
    }
    // Render labels if enabled
    if (props.showLabels) {
      const fontSize = 12;
      // Create type-safe label accessor functions
      const labelAcc = d => typeof props.label === "function" ? props.label(d) : props.label || "";
      const labelXAcc = d => d.x;
      const labelYAcc = d => d.y + fontSize / 3;
      const labelFillAcc = d => {
        const bgColor = () => {
          // Use rootKey for consistent color mapping (same as fill logic)
          if ("rootKey" in d.data && d.data.rootKey) {
            return props.colorScale(d.data.rootKey);
          }
          // Fallback: find top-level category
          const ancestors = d.ancestors();
          const topLevelCategory = ancestors.find((_, i) => {
            var _ancestors3;
            return i < ancestors.length - 1 && ((_ancestors3 = ancestors[i + 1]) === null || _ancestors3 === void 0 ? void 0 : _ancestors3.data._tag) === "root";
          });
          if (topLevelCategory && "key" in topLevelCategory.data) {
            return props.colorScale(topLevelCategory.data.key);
          } else if ("key" in d.data) {
            return props.colorScale(d.data.key);
          }
          return "#cccccc"; // Default fill if no key found
        };
        return getAccessibleTextColor(bgColor());
      };
      // Filter data for labels - only show labels on leaf nodes that are large enough
      const labelData = visibleData.filter(d => !d.children).filter(d => labelAcc(d).length < d.r / 3);
      const labels = selection.selectAll(".sszvis-pack-label").data(labelData).join("text").classed("sszvis-pack-label", true).attr("x", labelXAcc).attr("y", labelYAcc).attr("fill", labelFillAcc).attr("font-size", fontSize).attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').attr("text-anchor", "middle").attr("dominant-baseline", "middle").style("pointer-events", "none").text(labelAcc);
      // Apply transitions to labels if enabled
      if (props.transition) {
        labels.transition(defaultTransition()).attr("x", labelXAcc).attr("y", labelYAcc).attr("font-size", fontSize).text(labelAcc);
      }
    } else {
      // Remove labels if showLabels is false
      selection.selectAll(".sszvis-pack-label").remove();
    }
    // Add tooltip anchors at the center of each circle
    const tooltipPosition = d => [d.x, d.y];
    const ta = tooltipAnchor().position(tooltipPosition);
    selection.call(ta);
  });
}

export { pack as default };
//# sourceMappingURL=pack.js.map
