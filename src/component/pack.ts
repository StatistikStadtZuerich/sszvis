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
 *
 * @return {sszvis.component}
 */

import { pack as d3Pack, type HierarchyCircularNode, type HierarchyNode, rgb, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import { defaultTransition } from "../transition.js";
import type { StringAccessor } from "../types.js";

// PackLayout represents a node in the pack layout after D3 layout computation
export type PackLayout<T = unknown> = HierarchyNode<NodeDatum<T>> & {
  x: number;
  y: number;
  r: number;
  value: number;
  data?: T;
  depth: number;
  height: number;
};

type PackProps<T = unknown> = {
  colorScale: (key: string) => string;
  transition?: boolean;
  containerWidth: number;
  containerHeight: number;

  showLabels?: boolean;
  label?: StringAccessor<PackLayout<T>>;
  // TODO: design decision - minimum radius for visibility
  minRadius?: number;
  // TODO: design decision - circle stroke properties
  circleStroke: string;
  circleStrokeWidth: number;
  // Radius scale function for custom circle sizing
  radiusScale?: (d: HierarchyCircularNode<NodeDatum<T>>) => number;
};

// Component interface with proper method overloads
interface PackComponent<T = unknown> extends Component {
  colorScale(): (key: string) => string;
  colorScale(scale: (key: string) => string): PackComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): PackComponent<T>;
  containerWidth(): number;
  containerWidth(width: number): PackComponent<T>;
  containerHeight(): number;
  containerHeight(height: number): PackComponent<T>;
  showLabels(): boolean;
  showLabels(show: boolean): PackComponent<T>;
  label(): StringAccessor<PackLayout<T>>;
  label(accessor: StringAccessor<PackLayout<T>>): PackComponent<T>;
  minRadius(): number;
  minRadius(radius: number): PackComponent<T>;
  circleStroke(): string;
  circleStroke(stroke: string): PackComponent<T>;
  circleStrokeWidth(): number;
  circleStrokeWidth(width: number): PackComponent<T>;
  radiusScale(): (d: HierarchyCircularNode<NodeDatum<T>>) => number;
  radiusScale(scale: (d: HierarchyCircularNode<NodeDatum<T>>) => number): PackComponent<T>;
}

/**
 * Main Pack component
 *
 * @template T The type of the original flat data objects
 */
export default function <T = unknown>(): PackComponent<T> {
  return (
    component()
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
      .label((d: PackLayout<T>) => (d.data && "key" in d.data ? d.data.key : ""))
      .prop("labelPosition")
      .labelPosition("center")
      .prop("minRadius")
      // TODO: design decision - default minimum radius
      .minRadius(1)
      .prop("circleStroke")
      // TODO: design decision - default stroke color
      .circleStroke("#ffffff")
      .prop("circleStrokeWidth")
      // TODO: design decision - default stroke width
      .circleStrokeWidth(1)
      .prop("rScale", fn.functor)
      .render(function (this: Element, inputData: HierarchyNode<NodeDatum<T>>) {
        const selection = select<Element, PackLayout<T>>(this);
        const props = selection.props<PackProps<T>>();

        // Apply pack layout to hierarchical data
        const layout = d3Pack<NodeDatum<T>>()
          .size([props.containerWidth, props.containerHeight])
          // TODO: design decision: padding between circles
          .padding(5)
          .radius(props.radiusScale || null);

        layout(inputData);

        // Flatten the hierarchy and filter out root
        function flatten(node: HierarchyNode<NodeDatum<T>>): PackLayout<T>[] {
          const result: PackLayout<T>[] = [];
          if (node.children) {
            for (const child of node.children) {
              if (child.data._tag !== "root") {
                result.push(child as PackLayout<T>);
              }
              result.push(...flatten(child));
            }
          } else if (node.data._tag !== "root") {
            result.push(node as PackLayout<T>);
          }
          return result;
        }

        const packData = flatten(inputData);

        // Filter out very small circles - include both branches (categories) and leaves
        const visibleData = packData.filter((d: PackLayout<T>) => d.r > (props.minRadius || 1));

        const circles = selection
          .selectAll<SVGCircleElement, PackLayout<T>>(".sszvis-pack-circle")
          .data(visibleData)
          .join("circle")
          .classed("sszvis-pack-circle", true)
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", (d) => d.r)
          .attr("fill", (d: PackLayout<T>) => {
            // Branch nodes (categories) should have no fill, only stroke
            if (d.children) {
              return "none";
            }

            // Leaf nodes should be filled with color
            if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
              return props.colorScale(d.parent.data.key);
            } else if ("key" in d.data) {
              return props.colorScale(d.data.key);
            }
            return "#cccccc"; // Default fill if no key found
          })
          .attr("stroke", (d: PackLayout<T>) => {
            // Branch nodes (categories) get color stroke, leaf nodes get white stroke
            if (d.children) {
              if ("key" in d.data) {
                return props.colorScale(d.data.key);
              }
              return "#cccccc"; // Default stroke color for branches
            } else {
              return props.circleStroke;
            }
          })
          .attr("stroke-width", (d: PackLayout<T>) => {
            // Branch nodes get thicker stroke to make them more visible
            // TODO: design decision - stroke width for branches vs leaves?
            return d.children ? 2 : props.circleStrokeWidth;
          });

        // Apply transitions if enabled
        if (props.transition) {
          circles
            .transition(defaultTransition())
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => d.r);
        }

        // Render labels if enabled
        if (props.showLabels) {
          // TODO: design decision - font size prop?
          const fontSize = 11;
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

          // Create type-safe label accessor functions
          const labelAcc = (d: PackLayout<T>) =>
            typeof props.label === "function" ? props.label(d) : props.label || "";
          const labelXAcc = (d: PackLayout<T>) => d.x;
          const labelYAcc = (d: PackLayout<T>) => d.y + fontSize / 3;
          const labelFillAcc = (d: PackLayout<T>) => {
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

          // Filter data for labels - only show labels on leaf nodes that are large enough
          // TODO: design decision - minimum radius for label visibility?
          const labelData = visibleData.filter((d: PackLayout<T>) => {
            // Only show labels on leaf nodes (no children) and circles with minimum radius
            return !d.children && d.r >= 15; // TODO: design decision - min radius for labels
          });

          const labels = selection
            .selectAll<SVGTextElement, PackLayout<T>>(".sszvis-pack-label")
            .data(labelData)
            .join("text")
            .classed("sszvis-pack-label", true)
            .attr("x", labelXAcc)
            .attr("y", labelYAcc)
            // TODO: design decision - accessible label color based on background?
            .attr("fill", labelFillAcc)
            .attr("font-size", fontSize)
            // TODO: design decision - font family?
            .attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif')
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
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
          selection.selectAll(".sszvis-pack-label").remove();
        }

        // Add tooltip anchors at the center of each circle
        const tooltipPosition = (d: PackLayout<T>): [number, number] => [d.x, d.y];

        const ta = tooltipAnchor<PackLayout<T>>().position(tooltipPosition);
        selection.call(ta);
      }) as PackComponent<T>
  );
}
