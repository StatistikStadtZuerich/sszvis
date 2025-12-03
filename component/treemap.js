import { select, treemap as treemap$1, treemapSquarify } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { getAccessibleTextColor } from '../color.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { defaultTransition } from '../transition.js';

/**
 * Treemap component
 *
 * This component renders a treemap diagram, which displays hierarchical data as nested rectangles.
 * The size of each rectangle corresponds to a quantitative value, and rectangles are tiled to fill
 * the available space efficiently. This component uses D3's treemap layout with the squarified
 * tiling method for optimal aspect ratios.
 *
 * The component expects data prepared using the prepareData function, which converts flat data
 * into a hierarchical structure and applies the treemap layout.
 *
 * @module sszvis/component/treemap
 * @template T The type of the original flat data objects
 *
 * @property {string, function} colorScale        The fill color accessor for rectangles
 * @property {boolean} transition                 Whether to animate changes (default true)
 * @property {number, function} containerWidth    The container width (default 800)
 * @property {number, function} containerHeight   The container height (default 600)
 * @property {boolean} showLabels                 Whether to display labels on leaf nodes (default false)
 * @property {string, function} label             The label text accessor (default d.data.key)
 * @property {string} labelPosition               Label position: "top-left", "center", "top-right", "bottom-left", "bottom-right" (default "top-left")
 * @property {function} onClick                   Click handler for rectangles (receives node and event)
 *
 * @return {sszvis.component}
 */
/**
 * Main treemap component
 *
 * @template T The type of the original flat data objects
 */
function treemap () {
  return component().prop("colorScale").prop("transition").transition(true).prop("containerWidth").containerWidth(800) // Default width
  .prop("containerHeight").containerHeight(600) // Default height
  .prop("showLabels").showLabels(false) // Default disabled
  .prop("label", functor).label(d => d.data && "key" in d.data ? d.data.key : "").prop("labelPosition").labelPosition("center").prop("onClick").render(function (inputData) {
    const selection = select(this);
    const props = selection.props();
    // Apply treemap layout to hierarchical data
    const layout = treemap$1().tile(treemapSquarify).size([props.containerWidth, props.containerHeight]).round(true).paddingInner(1).paddingOuter(2);
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
    const treemapData = flatten(inputData);
    // Filter out very small rectangles and show only leaf nodes
    const visibleData = treemapData.filter(d => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5).filter(d => !d.children);
    const rectangles = selection.selectAll(".sszvis-treemap-rect").data(visibleData).join("rect").classed("sszvis-treemap-rect", true).attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0).attr("fill", d => {
      if ("rootKey" in d.data && d.data.rootKey) {
        return props.colorScale(d.data.rootKey);
      }
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
    }).attr("stroke", "#ffffff").attr("stroke-width", 1).style("cursor", props.onClick ? "pointer" : "default").on("click", (event, d) => {
      var _props$onClick;
      return (_props$onClick = props.onClick) === null || _props$onClick === void 0 ? void 0 : _props$onClick.call(props, event, d);
    });
    // Apply transitions if enabled
    if (props.transition) {
      rectangles.transition(defaultTransition()).attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0);
    }
    // Render labels if enabled
    if (props.showLabels) {
      const fontSize = 12;
      const calculateLabelPosition = (d, position) => {
        const padding = 8;
        switch (position) {
          case "top-left":
            return {
              x: d.x0 + padding,
              y: d.y0 + fontSize + padding
            };
          case "center":
            return {
              x: d.x0 + (d.x1 - d.x0) / 2,
              y: d.y0 + (d.y1 - d.y0) / 2 + fontSize / 3
            };
          case "top-right":
            return {
              x: d.x1 - padding,
              y: d.y0 + fontSize + padding
            };
          case "bottom-left":
            return {
              x: d.x0 + padding,
              y: d.y1 - padding
            };
          case "bottom-right":
            return {
              x: d.x1 - padding,
              y: d.y1 - padding
            };
          default:
            return {
              x: d.x0 + padding,
              y: d.y0 + fontSize + padding
            };
        }
      };
      // Create type-safe label accessor functions
      const labelAcc = d => typeof props.label === "function" ? props.label(d) : props.label || "";
      const labelXAcc = d => calculateLabelPosition(d, props.labelPosition || "top-left").x;
      const labelYAcc = d => calculateLabelPosition(d, props.labelPosition || "top-left").y;
      const labelFillAcc = d => {
        const bgColor = () => {
          if ("rootKey" in d.data && d.data.rootKey) {
            return props.colorScale(d.data.rootKey);
          }
          const ancestors = d.ancestors();
          const topLevelCategory = ancestors.find((_, i) => {
            var _ancestors2;
            return i < ancestors.length - 1 && ((_ancestors2 = ancestors[i + 1]) === null || _ancestors2 === void 0 ? void 0 : _ancestors2.data._tag) === "root";
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
      const labelData = visibleData.filter(d => !d.children).filter(d => labelAcc(d).length < (d.x1 - d.x0) / 7); // Rough estimate of fitting text
      const labels = selection.selectAll(".sszvis-treemap-label").data(labelData).join("text").classed("sszvis-treemap-label", true).attr("x", labelXAcc).attr("y", labelYAcc).attr("fill", labelFillAcc).attr("font-size", fontSize).attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').style("pointer-events", "none").attr("text-anchor", () => {
        const position = props.labelPosition || "top-left";
        switch (position) {
          case "top-right":
          case "bottom-right":
            return "end";
          case "center":
            return "middle";
          default:
            return "start";
        }
      }).attr("dominant-baseline", () => {
        const position = props.labelPosition || "top-left";
        switch (position) {
          case "center":
            return "middle";
          case "bottom-left":
          case "bottom-right":
            return "alphabetic";
          default:
            return "hanging";
        }
      }).text(labelAcc);
      // Apply transitions to labels if enabled
      if (props.transition) {
        labels.transition(defaultTransition()).attr("x", labelXAcc).attr("y", labelYAcc).attr("font-size", fontSize).text(labelAcc);
      }
    } else {
      // Remove labels if showLabels is false
      selection.selectAll(".sszvis-treemap-label").remove();
    }
    // Add tooltip anchors at the center of each rectangle
    const tooltipPosition = d => [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2];
    const ta = tooltipAnchor().position(tooltipPosition);
    selection.call(ta);
  });
}

export { treemap as default };
//# sourceMappingURL=treemap.js.map
