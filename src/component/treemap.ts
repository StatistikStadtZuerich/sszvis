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

import { treemap as d3Treemap, type HierarchyNode, select, treemapSquarify } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { getAccessibleTextColor } from "../color.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import { nodeColor } from "../layout/hierarchy.js";
import { defaultTransition } from "../transition.js";
import type { StringAccessor } from "../types.js";

// TreemapNode represents a node in the treemap after D3 layout computation
export type TreemapLayout<T = unknown> = HierarchyNode<NodeDatum<T>> & {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  value: number;
  data?: T;
  depth: number;
  height: number;
};

// Click handler type definition
export type TreemapClickHandler<T = unknown> = (event: MouseEvent, node: TreemapLayout<T>) => void;

// Type definitions for label positioning
type LabelPosition = "top-left" | "center" | "top-right" | "bottom-left" | "bottom-right";

type TreemapProps<T = unknown> = {
  colorScale: (key: string) => string;
  transition?: boolean;
  containerWidth: number;
  containerHeight: number;
  showLabels?: boolean;
  label?: StringAccessor<TreemapLayout<T>>;
  labelPosition?: LabelPosition;
  onClick?: TreemapClickHandler<T>;
};

// Component interface with proper method overloads
interface TreemapComponent<T = unknown> extends ComponentBuilder<TreemapComponent<T>> {
  colorScale(): (key: string) => string;
  colorScale(scale: string | ((key: string) => string)): TreemapComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): TreemapComponent<T>;
  containerWidth(): number;
  containerWidth(width: number): TreemapComponent<T>;
  containerHeight(): number;
  containerHeight(height: number): TreemapComponent<T>;
  showLabels(): boolean;
  showLabels(show: boolean): TreemapComponent<T>;
  label(): StringAccessor<TreemapLayout<T>>;
  label(accessor: StringAccessor<TreemapLayout<T>>): TreemapComponent<T>;
  labelPosition(): LabelPosition;
  labelPosition(position: LabelPosition): TreemapComponent<T>;
  onClick(): TreemapClickHandler<T> | undefined;
  onClick(handler: TreemapClickHandler<T>): TreemapComponent<T>;
}

/**
 * Main treemap component
 *
 * @template T The type of the original flat data objects
 */
export default function treemap<T = unknown>(): TreemapComponent<T> {
  return component<TreemapComponent<T>>()
    .prop("colorScale", fn.functor)
    .prop("transition")
    .transition(true)
    .prop("containerWidth")
    .containerWidth(800) // Default width
    .prop("containerHeight")
    .containerHeight(600) // Default height
    .prop("showLabels")
    .showLabels(false) // Default disabled
    .prop("label", fn.functor)
    .label((d: TreemapLayout<T>) => (d.data && "key" in d.data ? d.data.key : ""))
    .prop("labelPosition")
    .labelPosition("center")
    .prop("onClick")
    .render(function (this: Element, inputData: HierarchyNode<NodeDatum<T>>) {
      const selection = select<Element, TreemapLayout<T>>(this);
      const props = selection.props<TreemapProps<T>>();

      // Apply treemap layout to hierarchical data
      const layout = d3Treemap<NodeDatum<T>>()
        .tile(treemapSquarify)
        .size([props.containerWidth, props.containerHeight])
        .round(true)
        .paddingInner(1)
        .paddingOuter(2);

      layout(inputData);

      // Flatten the hierarchy and filter out root
      function flatten(node: HierarchyNode<NodeDatum<T>>): TreemapLayout<T>[] {
        const result: TreemapLayout<T>[] = [];
        if (node.children) {
          for (const child of node.children) {
            if (child.data._tag !== "root") {
              result.push(child as TreemapLayout<T>);
            }
            result.push(...flatten(child));
          }
        } else if (node.data._tag !== "root") {
          result.push(node as TreemapLayout<T>);
        }
        return result;
      }

      const treemapData = flatten(inputData);

      // Filter out very small rectangles and show only leaf nodes
      const visibleData = treemapData
        .filter((d) => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5)
        .filter((d) => !d.children);

      const rectangles = selection
        .selectAll<SVGRectElement, TreemapLayout<T>>(".sszvis-treemap-rect")
        .data(visibleData)
        .join("rect")
        .classed("sszvis-treemap-rect", true)
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d) => {
          return nodeColor(d, props.colorScale);
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .style("cursor", props.onClick ? "pointer" : "default")
        .on("click", (event: MouseEvent, d) => props.onClick?.(event, d));

      // Apply transitions if enabled
      if (props.transition) {
        rectangles
          .transition(defaultTransition())
          .attr("x", (d) => d.x0)
          .attr("y", (d) => d.y0)
          .attr("width", (d) => d.x1 - d.x0)
          .attr("height", (d) => d.y1 - d.y0);
      }

      // Render labels if enabled
      if (props.showLabels) {
        const fontSize = 12;
        const calculateLabelPosition = (d: TreemapLayout<T>, position: LabelPosition) => {
          const padding = 8;
          switch (position) {
            case "top-left":
              return { x: d.x0 + padding, y: d.y0 + fontSize + padding };
            case "center":
              return {
                x: d.x0 + (d.x1 - d.x0) / 2,
                y: d.y0 + (d.y1 - d.y0) / 2 + fontSize / 3,
              };
            case "top-right":
              return { x: d.x1 - padding, y: d.y0 + fontSize + padding };
            case "bottom-left":
              return { x: d.x0 + padding, y: d.y1 - padding };
            case "bottom-right":
              return { x: d.x1 - padding, y: d.y1 - padding };
            default:
              return { x: d.x0 + padding, y: d.y0 + fontSize + padding };
          }
        };

        // Create type-safe label accessor functions
        const labelAcc = (d: TreemapLayout<T>) =>
          typeof props.label === "function" ? props.label(d) : props.label || "";
        const labelXAcc = (d: TreemapLayout<T>) =>
          calculateLabelPosition(d, props.labelPosition || "top-left").x;
        const labelYAcc = (d: TreemapLayout<T>) =>
          calculateLabelPosition(d, props.labelPosition || "top-left").y;
        const labelFillAcc = (d: TreemapLayout<T>) => {
          return getAccessibleTextColor(nodeColor(d, props.colorScale));
        };

        // Filter data for labels - only show labels on leaf nodes that are large enough
        const labelData = visibleData
          .filter((d) => !d.children)
          .filter((d) => labelAcc(d).length < (d.x1 - d.x0) / 7); // Rough estimate of fitting text

        const labels = selection
          .selectAll<SVGTextElement, TreemapLayout<T>>(".sszvis-treemap-label")
          .data(labelData)
          .join("text")
          .classed("sszvis-treemap-label", true)
          .attr("x", labelXAcc)
          .attr("y", labelYAcc)
          .attr("fill", labelFillAcc)
          .attr("font-size", fontSize)
          .attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif')
          .style("pointer-events", "none")
          .attr("text-anchor", () => {
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
          })
          .attr("dominant-baseline", () => {
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
          })
          .text(labelAcc);

        // Apply transitions to labels if enabled
        if (props.transition) {
          labels
            .transition(defaultTransition())
            .attr("x", labelXAcc)
            .attr("y", labelYAcc)
            .attr("font-size", fontSize)
            .text(labelAcc);
        }
      } else {
        // Remove labels if showLabels is false
        selection.selectAll(".sszvis-treemap-label").remove();
      }

      // Add tooltip anchors at the center of each rectangle
      const tooltipPosition = (d: TreemapLayout<T>): [number, number] => [
        (d.x0 + d.x1) / 2,
        (d.y0 + d.y1) / 2,
      ];

      const ta = tooltipAnchor<TreemapLayout<T>>().position(tooltipPosition);
      // Rebind the group to the drawn node array before rendering the anchors, the way
      // sunburst and pie do. Without it the anchors are joined to whatever datum the caller
      // bound - for a hierarchy that is the root node, which d3 iterates into every
      // descendant, so the root and every undrawn branch gain anchors of their own and the
      // anchors come out breadth first while the rectangles are depth first.
      selection.datum(visibleData).call(ta);
    }) as TreemapComponent<T>;
}
