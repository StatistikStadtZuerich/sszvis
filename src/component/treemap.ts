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
 * @property {number, function} x           The x-position accessor for rectangles (typically d => d.x0)
 * @property {number, function} y           The y-position accessor for rectangles (typically d => d.y0)
 * @property {number, function} width       The width accessor for rectangles (typically d => d.x1 - d.x0)
 * @property {number, function} height      The height accessor for rectangles (typically d => d.y1 - d.y0)
 * @property {string, function} fill        The fill color accessor for rectangles
 * @property {string, function} stroke      The stroke color for rectangles (default white)
 * @property {number} strokeWidth           The stroke width for rectangles (default 1)
 * @property {boolean} transition           Whether to animate changes (default true)
 * @property {boolean} showLabels           Whether to display labels on leaf nodes (default false)
 * @property {string, function} label       The label text accessor (default d.data.key)
 * @property {string} labelPosition         Label position: "top-left", "center", "top-right", "bottom-left", "bottom-right" (default "top-left")
 * @property {string, function} labelFill   Label text color accessor (default: accessible color based on background)
 * @property {number, function} labelFontSize Label font size accessor (default 11)
 *
 * @return {sszvis.component}
 */

import {
  treemap as d3Treemap,
  type HierarchyNode,
  type NumberValue,
  rgb,
  select,
  treemapSquarify,
} from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { HierarchicalData, TreemapNode } from "../layout/hierarchy.js";
import { defaultTransition } from "../transition.js";
import type { NumberAccessor, StringAccessor } from "../types.js";

// Type definitions for label positioning
type LabelPosition = "top-left" | "center" | "top-right" | "bottom-left" | "bottom-right";

type TreemapProps<T = unknown> = {
  colorScale: (key: string) => string;
  transition?: boolean;
  containerWidth: number;
  containerHeight: number;

  showLabels?: boolean;
  label?: StringAccessor<TreemapNode<T>>;
  labelPosition?: LabelPosition;
  labelFontSize?: NumberAccessor<TreemapNode<T>>;
};

// Component interface with proper method overloads
interface TreemapComponent<T = unknown> extends Component {
  colorScale(): (key: string) => string;
  colorScale(scale: (key: string) => string): TreemapComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): TreemapComponent<T>;
  containerWidth(): number;
  containerWidth(width: number): TreemapComponent<T>;
  containerHeight(): number;
  containerHeight(height: number): TreemapComponent<T>;
  showLabels(): boolean;
  showLabels(show: boolean): TreemapComponent<T>;
  label(): StringAccessor<TreemapNode<T>>;
  label(accessor: StringAccessor<TreemapNode<T>>): TreemapComponent<T>;
  labelPosition(): LabelPosition;
  labelPosition(position: LabelPosition): TreemapComponent<T>;
}

// Helper function to handle missing/invalid numeric values
function handleMissingVal(v: NumberValue): number {
  const num = Number(v);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Main treemap component
 *
 * @template T The type of the original flat data objects
 */
export default function <T = unknown>(): TreemapComponent<T> {
  return component()
    .prop("fill", fn.functor)
    .prop("colorScale")
    .prop("stroke", fn.functor)
    .stroke("#ffffff")
    .prop("strokeWidth", fn.functor)
    .strokeWidth(1)
    .prop("transition")
    .transition(true)
    .prop("containerWidth")
    .containerWidth(800) // Default width
    .prop("containerHeight")
    .containerHeight(600) // Default height
    .prop("showLabels")
    .showLabels(false) // Default disabled
    .prop("label", fn.functor)
    .label((d: TreemapNode<T>) => (d.data && "key" in d.data ? d.data.key : ""))
    .prop("labelPosition")
    .labelPosition("top-left")
    .prop("labelFontSize", fn.functor)
    .labelFontSize(11)
    .render(function (
      this: Element,
      inputData: HierarchyNode<HierarchicalData<T>> | TreemapNode<T>[]
    ) {
      const selection = select<Element, TreemapNode<T>>(this);
      const props = selection.props<TreemapProps<T>>();

      // Determine if we have raw hierarchical data or pre-computed treemap data
      let treemapData: TreemapNode<T>[];

      if (Array.isArray(inputData)) {
        // Already computed treemap data (backwards compatibility)
        treemapData = inputData;
      } else {
        // Raw hierarchical data - apply treemap layout here
        const layout = d3Treemap<HierarchicalData<T>>()
          .tile(treemapSquarify)
          .size([props.containerWidth, props.containerHeight])
          .round(true)
          // TODO: design decision: padding props?
          .padding(2);
        //   .paddingInner(1)
        //   .paddingOuter(1);
        //   .paddingTop(0)
        //   .paddingRight(0)
        //   .paddingBottom(0)
        //   .paddingLeft(0);

        layout(inputData);

        // Flatten the hierarchy and filter out root
        function flatten(node: HierarchyNode<HierarchicalData<T>>): TreemapNode<T>[] {
          const result: TreemapNode<T>[] = [];
          if (node.children) {
            for (const child of node.children) {
              if (!("isRoot" in child.data)) {
                result.push(child as TreemapNode<T>);
              }
              result.push(...flatten(child));
            }
          } else if (!("isRoot" in node.data)) {
            result.push(node as TreemapNode<T>);
          }
          return result;
        }

        treemapData = flatten(inputData);
      }

      // Filter out very small rectangles
      const visibleData = treemapData
        .filter((d: TreemapNode<T>) => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5)
        // TODO: design decision - only show leaf nodes by default?
        .filter((d) => !d.children);

      const rectangles = selection
        .selectAll<SVGRectElement, TreemapNode<T>>(".sszvis-treemap-rect")
        .data(visibleData)
        .join("rect")
        .classed("sszvis-treemap-rect", true)
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", (d: TreemapNode<T>) => {
          if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
            return props.colorScale(d.parent.data.key);
          } else if ("key" in d.data) {
            return props.colorScale(d.data.key);
          }
          return null;
        })
        // TODO: design decision - border on rect?
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

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
        const getAccessibleTextColor = (backgroundColor: string | null): string => {
          if (!backgroundColor) {
            return "#545454"; // Default to SSZVIS gray if no background color
          }
          const bgColor = rgb(backgroundColor);
          const gammaCorrect = (c: number): number => {
            const normalized = c / 255;
            return normalized <= 0.03928
              ? normalized / 12.92
              : ((normalized + 0.055) / 1.055) ** 2.4;
          };

          const rLum = gammaCorrect(bgColor.r);
          const gLum = gammaCorrect(bgColor.g);
          const bLum = gammaCorrect(bgColor.b);

          // WCAG relative luminance formula
          const luminance = 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;

          return luminance > 0.179 ? "#545454" : "#ffffff"; // Use SSZVIS gray or white
        };

        const calculateLabelPosition = (d: TreemapNode<T>, position: LabelPosition) => {
          const padding = 8;
          const fontSize = handleMissingVal(
            (typeof props.labelFontSize === "function"
              ? props.labelFontSize(d)
              : props.labelFontSize) ?? 11
          );

          switch (position) {
            case "top-left":
              return { x: d.x0 + padding, y: d.y0 + fontSize + padding };
            case "center":
              return { x: d.x0 + (d.x1 - d.x0) / 2, y: d.y0 + (d.y1 - d.y0) / 2 + fontSize / 3 };
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
        const labelAcc = (d: TreemapNode<T>) =>
          typeof props.label === "function" ? props.label(d) : props.label || "";
        const labelXAcc = (d: TreemapNode<T>) =>
          calculateLabelPosition(d, props.labelPosition || "top-left").x;
        const labelYAcc = (d: TreemapNode<T>) =>
          calculateLabelPosition(d, props.labelPosition || "top-left").y;
        const labelFillAcc = (d: TreemapNode<T>) => {
          console.log(d);
          const bgColor = () => {
            if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
              return props.colorScale(d.parent.data.key);
            } else if ("key" in d.data) {
              return props.colorScale(d.data.key);
            }
            return null;
          };
          return getAccessibleTextColor(bgColor());
        };

        // Filter data for labels - only show labels on leaf nodes (smallest layer) that are large enough
        const labelData = visibleData.filter((d: TreemapNode<T>) => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          // Only show labels on leaf nodes (no children) and rectangles larger than 50x20 pixels
          return !d.children && w >= 50 && h >= 20;
        });

        const labels = selection
          .selectAll<SVGTextElement, TreemapNode<T>>(".sszvis-treemap-label")
          .data(labelData)
          .join("text")
          .classed("sszvis-treemap-label", true)
          .attr("x", labelXAcc)
          .attr("y", labelYAcc)
          // TODO: design decision - accessible label color based on background?
          .attr("fill", labelFillAcc)
          // TODO: design decision - font size prop?
          .attr("font-size", 11)
          // TODO: design decision - font family?
          .attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif')
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
            .attr("font-size", 11)
            .text(labelAcc);
        }
      } else {
        // Remove labels if showLabels is false
        selection.selectAll(".sszvis-treemap-label").remove();
      }

      // Add tooltip anchors at the center of each rectangle
      const tooltipPosition = (d: TreemapNode<T>): [number, number] => [
        (d.x0 + d.x1) / 2,
        (d.y0 + d.y1) / 2,
      ];

      const ta = tooltipAnchor<TreemapNode<T>>().position(tooltipPosition);
      selection.call(ta);
    }) as TreemapComponent<T>;
}
