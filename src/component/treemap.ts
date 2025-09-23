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
import type { NodeDatum } from "../layout/hierarchy.js";
import { defaultTransition } from "../transition.js";
import type { NumberAccessor, StringAccessor } from "../types.js";

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
  labelFontSize?: NumberAccessor<TreemapLayout<T>>;
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
  label(): StringAccessor<TreemapLayout<T>>;
  label(accessor: StringAccessor<TreemapLayout<T>>): TreemapComponent<T>;
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
    .prop("colorScale")
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
    .labelPosition("top-left")
    .render(function (this: Element, inputData: HierarchyNode<NodeDatum<T>>) {
      const selection = select<Element, TreemapLayout<T>>(this);
      const props = selection.props<TreemapProps<T>>();

      // Apply treemap layout to hierarchical data
      const layout = d3Treemap<NodeDatum<T>>()
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

      // Filter out very small rectangles
      const visibleData = treemapData
        .filter((d: TreemapLayout<T>) => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5)
        // TODO: design decision - only show leaf nodes by default?
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
        .attr("fill", (d: TreemapLayout<T>) => {
          if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
            return props.colorScale(d.parent.data.key);
          } else if ("key" in d.data) {
            return props.colorScale(d.data.key);
          }
          return "#cccccc"; // Default fill if no key found
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

        const calculateLabelPosition = (d: TreemapLayout<T>, position: LabelPosition) => {
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
          const bgColor = () => {
            if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
              return props.colorScale(d.parent.data.key);
            } else if ("key" in d.data) {
              return props.colorScale(d.data.key);
            }
            return "#cccccc"; // Default fill if no key found
          };
          return getAccessibleTextColor(bgColor());
        };

        // Filter data for labels - only show labels on leaf nodes (smallest layer) that are large enough
        const labelData = visibleData.filter((d: TreemapLayout<T>) => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          // Only show labels on leaf nodes (no children) and rectangles larger than 50x20 pixels
          return !d.children && w >= 50 && h >= 20;
        });

        const labels = selection
          .selectAll<SVGTextElement, TreemapLayout<T>>(".sszvis-treemap-label")
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
      const tooltipPosition = (d: TreemapLayout<T>): [number, number] => [
        (d.x0 + d.x1) / 2,
        (d.y0 + d.y1) / 2,
      ];

      const ta = tooltipAnchor<TreemapLayout<T>>().position(tooltipPosition);
      selection.call(ta);
    }) as TreemapComponent<T>;
}
