import { select, treemap as treemap$1, treemapSquarify } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { getAccessibleTextColor } from '../color.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { nodeColor } from '../layout/hierarchy.js';
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
 * @property {string, function} colorScale        The fill color for rectangles: a constant colour
 *                                                or an accessor taking a node's key
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
function treemap() {
  return component().prop("colorScale", functor).prop("transition").transition(true).prop("containerWidth").containerWidth(800) // Default width
  .prop("containerHeight").containerHeight(600) // Default height
  .prop("showLabels").showLabels(false) // Default disabled
  .prop("label", functor).label(d => d.data && "key" in d.data ? d.data.key : "").prop("labelPosition").labelPosition("center").prop("onClick").render(function (inputData) {
    // The old datum is the render's own input: the component is called through
    // selection.each, so the group's datum is exactly what was handed to the render.
    // Deriving it with typeof rather than restating the type is what keeps the two from
    // drifting apart, the way they did in #303. pack, treemap and sunburst all declare it
    // this way. The anchors at the end of the render bind the flattened node array to the
    // group and then restore this input, so the datum a caller sees is unchanged.
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
      return nodeColor(d, props.colorScale);
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
        return getAccessibleTextColor(nodeColor(d, props.colorScale));
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
    // Rebind the group to the drawn node array before rendering the anchors, the way
    // sunburst and pie do. Without it the anchors are joined to whatever datum the caller
    // bound - for a hierarchy that is the root node, which d3 iterates into every
    // descendant, so the root and every undrawn branch gain anchors of their own and the
    // anchors come out breadth first while the rectangles are depth first.
    selection.datum(visibleData).call(ta);
    // ...and put the hierarchy back, so the render is idempotent. The group's datum is the
    // render's own input, and leaving the flattened array there breaks a caller who holds
    // its own group selection and re-renders without re-binding: the layout above would be
    // handed an array instead of a root. The docs examples never hit it, since they
    // re-datum() on every render and selectGroup re-binds from the parent.
    selection.datum(inputData);
  });
}

export { treemap as default };
//# sourceMappingURL=treemap.js.map
