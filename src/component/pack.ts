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
 * @property {string, function} colorScale        The fill color for circles: a constant colour
 *                                                or an accessor taking a node's key
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

import { pack as d3Pack, type HierarchyCircularNode, type HierarchyNode, select } from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { getAccessibleTextColor } from "../color.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import { HIERARCHY_FALLBACK_COLOR, inheritedColorKey, nodeColor } from "../layout/hierarchy.js";
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

// Click handler type definition
export type PackClickHandler<T = unknown> = (event: MouseEvent, node: PackLayout<T>) => void;

type PackProps<T = unknown> = {
  colorScale: (key: string) => string;
  transition?: boolean;
  containerWidth: number;
  containerHeight: number;
  showLabels?: boolean;
  label?: StringAccessor<PackLayout<T>>;
  minRadius?: number;
  circleStroke: string;
  circleStrokeWidth: number;
  radiusScale?: (d: HierarchyCircularNode<NodeDatum<T>>) => number;
  onClick?: PackClickHandler<T>;
};

// Component interface with proper method overloads
interface PackComponent<T = unknown> extends ComponentBuilder<PackComponent<T>> {
  colorScale(): (key: string) => string;
  colorScale(scale: string | ((key: string) => string)): PackComponent<T>;
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
  onClick(): PackClickHandler<T> | undefined;
  onClick(handler: PackClickHandler<T>): PackComponent<T>;
}

/**
 * Main Pack component
 *
 * @template T The type of the original flat data objects
 */
export default function pack<T = unknown>(): PackComponent<T> {
  return component<PackComponent<T>>()
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
    .label((d: PackLayout<T>) => (d.data && "key" in d.data ? d.data.key : ""))
    .prop("minRadius")
    .minRadius(20)
    .prop("circleStroke")
    .circleStroke("#ffffff")
    .prop("circleStrokeWidth")
    .circleStrokeWidth(1)
    .prop("radiusScale", fn.functor)
    .prop("onClick")
    .render(function (this: Element, inputData: HierarchyNode<NodeDatum<T>>) {
      const selection = select<Element, PackLayout<T>>(this);
      const props = selection.props<PackProps<T>>();

      // Apply pack layout to hierarchical data
      const layout = d3Pack<NodeDatum<T>>()
        .size([props.containerWidth, props.containerHeight])
        .padding(4)
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

      // The one expression for what a circle is painted. The label colour is derived from
      // this rather than recomputing nodeColor, so the contrast can never be calculated
      // against a colour other than the one on screen - today the label data is filtered to
      // leaves and the two agree, but a branch label would otherwise come out white on white.
      const circleFillAcc = (d: PackLayout<T>) =>
        // Branch nodes get a light fill so they stay clickable.
        d.children ? "white" : nodeColor(d, props.colorScale);

      const circles = selection
        .selectAll<SVGCircleElement, PackLayout<T>>(".sszvis-pack-circle")
        .data(visibleData)
        .join("circle")
        .classed("sszvis-pack-circle", true)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => d.r)
        .attr("fill", circleFillAcc)
        .attr("stroke", (d: PackLayout<T>) => {
          // Branches carry the category colour; leaves fall back to the configured stroke.
          const inherited = inheritedColorKey(d);
          if (inherited !== undefined) return props.colorScale(inherited);
          if (!d.children) return props.circleStroke;
          return "key" in d.data ? props.colorScale(d.data.key) : HIERARCHY_FALLBACK_COLOR;
        })
        .attr("stroke-width", (d: PackLayout<T>) => {
          // Branch nodes get thicker stroke to make them more visible
          return d.children ? 2 : props.circleStrokeWidth;
        })
        .style("cursor", props.onClick ? "pointer" : "default")
        .on("click", (event: MouseEvent, d) => props.onClick?.(event, d));

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
        const fontSize = 12;

        // Create type-safe label accessor functions
        const labelAcc = (d: PackLayout<T>) =>
          typeof props.label === "function" ? props.label(d) : props.label || "";
        const labelXAcc = (d: PackLayout<T>) => d.x;
        const labelYAcc = (d: PackLayout<T>) => d.y + fontSize / 3;
        const labelFillAcc = (d: PackLayout<T>) => getAccessibleTextColor(circleFillAcc(d));

        // Filter data for labels - only show labels on leaf nodes that are large enough
        const labelData = visibleData
          .filter((d) => !d.children)
          .filter((d) => labelAcc(d).length < d.r / 3);

        const labels = selection
          .selectAll<SVGTextElement, PackLayout<T>>(".sszvis-pack-label")
          .data(labelData)
          .join("text")
          .classed("sszvis-pack-label", true)
          .attr("x", labelXAcc)
          .attr("y", labelYAcc)
          .attr("fill", labelFillAcc)
          .attr("font-size", fontSize)
          .attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif')
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("pointer-events", "none")
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
      // Rebind the group to the filtered node array before rendering the anchors, the way
      // sunburst and pie do. Without it the anchors are joined to whatever datum the caller
      // bound - for a hierarchy that is the root node, which d3 iterates into every
      // descendant, so the root gains an anchor of its own, the anchors come out breadth
      // first while the circles are depth first, and nodes dropped by the minRadius filter
      // get an anchor with no circle under it.
      selection.datum(visibleData).call(ta);
    }) as PackComponent<T>;
}
