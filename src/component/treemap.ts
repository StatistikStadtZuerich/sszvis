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
  type HierarchyNode,
  NumberValue,
  treemap as d3Treemap,
  hierarchy,
  rollup,
  select,
  treemapSquarify,
  rgb,
} from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import { defaultTransition } from "../transition.js";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import type { NumberAccessor, StringAccessor } from "../types.js";

// Type definitions for label positioning
type LabelPosition = "top-left" | "center" | "top-right" | "bottom-left" | "bottom-right";

// Type definitions for hierarchical data structure
interface NestedData {
  key: string;
  values?: NestedData[];
  value?: unknown;
}

interface TreemapRootData {
  isRoot: true;
  values: NestedData[];
}

type HierarchicalData = NestedData | TreemapRootData;

// TreemapNode represents a node in the treemap after D3 layout computation
export type TreemapNode<T = unknown> = HierarchyNode<HierarchicalData> & {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  value: number;
  data?: T;
  depth: number;
  height: number;
};

// Properties interface for the treemap component
interface TreemapProps<T = unknown> {
  colorScale: (key: string) => string;
  transition?: boolean;
  // New properties for container dimensions
  containerWidth: number;
  containerHeight: number;
  // Label properties
  showLabels?: boolean;
  label?: StringAccessor<TreemapNode<T>>;
  labelPosition?: LabelPosition;
  labelFontSize?: NumberAccessor<TreemapNode<T>>;
}

// Component interface with proper method overloads
interface TreemapComponent<T = unknown> extends Component {
  colorScale(): (key: string) => string;
  colorScale(scale: (key: string) => string): TreemapComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): TreemapComponent<T>;
  // New container dimension properties
  containerWidth(): number;
  containerWidth(width: number): TreemapComponent<T>;
  containerHeight(): number;
  containerHeight(height: number): TreemapComponent<T>;
  // Label properties
  showLabels(): boolean;
  showLabels(show: boolean): TreemapComponent<T>;
  label(): StringAccessor<TreemapNode<T>>;
  label(accessor: StringAccessor<TreemapNode<T>>): TreemapComponent<T>;
  labelPosition(): LabelPosition;
  labelPosition(position: LabelPosition): TreemapComponent<T>;
}

// Helper function to safely unwrap nested rollup data
function unwrapNested(roll: any): NestedData[] {
  return Array.from(roll, ([key, values]: [string, any]) => ({
    key,
    values: values && values.size > 0 ? unwrapNested(values) : undefined,
    value: values && values.size > 0 ? undefined : values,
  }));
}

// Helper function to handle missing/invalid numeric values
function handleMissingVal(v: NumberValue): number {
  const num = Number(v);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * sszvis.layout.treemap.prepareData
 *
 * Creates a data preparation layout, with an API that works similarly to d3's configurable layouts.
 * Can be used in two ways:
 * 1. Chained API (like sunburst): prepareData().layer().value().size().calculate(data)
 * 2. Options API (backward compatibility): prepareData(data, options)
 *
 * @property {Array} calculate      Accepts an array of data, and applies this layout to that data. Returns the formatted dataset,
 *                                  ready to be used as data for the treemap component.
 * @property {Function} layer       Accepts a function, which should be a key function, used to create a layer for the data.
 *                                  The key function is applied to each datum, and the return value groups that datum within a
 *                                  layer of the treemap chart. The exact behavior depends on the order in which layers are specified.
 *                                  The first specified layer will be the outermost one of the treemap, with subsequent layers adding
 *                                  further subdivision. Data are grouped according to the first layer, then the second layer, then the third, etc.
 *                                  This uses d3.rollup under the hood, and applies the key function to group the data hierarchically.
 * @property {Function} value       The function which retrieves the value of each datum. This is required in order to calculate the size of
 *                                  the rectangle for each datum.
 * @property {Array} size           Set the size [width, height] of the treemap layout.
 * @property {Function} sort        Provide a sorting function for sibling nodes of the treemap.
 *                                  It receives two node values (which are created by d3), which should have at least a "key" property
 *                                  (corresponding to the layer key), and a "value" property (corresponding to the value amount of the rectangle).
 *                                  Otherwise, it behaves like a normal javascript array sorting function. The default value attempts to preserve the
 *                                  existing sort order of the data.
 *
 * @return {Function}               The layout function. Can be called directly or you can use '.calculate(dataset)'.
 */

// Raw hierarchical data type that doesn't have layout coordinates yet
export type TreemapRawData<T = unknown> = HierarchyNode<HierarchicalData> & {
  value: number;
  originalData?: T;
  depth: number;
  height: number;
};

// Function overloads for better TypeScript support
export function prepareData<T = unknown>(): {
  calculate: (data: T[]) => TreemapRawData<T> | TreemapNode<T>[];
  layer: (keyFunc: (d: T) => string) => any;
  value: (accfn: (d: T) => number) => any;
  sort: (
    sortFunc: (a: HierarchyNode<HierarchicalData>, b: HierarchyNode<HierarchicalData>) => number
  ) => any;
};

export function prepareData<T = unknown>(
  data: T[],
  options: {
    layers: Array<(d: T) => string>;
    valueAccessor: (d: T) => number;
    size?: [number, number];
  }
): TreemapNode<T>[];

// Implementation
export function prepareData<T = unknown>(
  data?: T[],
  options?: {
    layers: Array<(d: T) => string>;
    valueAccessor: (d: T) => number;
    size?: [number, number]; // Size is now optional since layout is handled by component
  }
): any {
  // If called with data and options, use the old API
  if (data !== undefined && options !== undefined) {
    const layout = createTreemapLayout<T>();

    options.layers.forEach((layer) => {
      layout.layer(layer);
    });
    layout.value(options.valueAccessor);

    return layout.calculate(data);
  }

  // Otherwise, return the chained API
  return createTreemapLayout<T>();
}

function createTreemapLayout<T = unknown>() {
  const layers: Array<(d: T) => string> = [];
  let valueAcc: (d: T) => number = fn.identity as any;
  let sortFn: (a: HierarchyNode<HierarchicalData>, b: HierarchyNode<HierarchicalData>) => number = (
    _a,
    _b
  ) => 0;
  function main(data: T[]): TreemapRawData<T> | TreemapNode<T>[] {
    if (layers.length === 0) {
      throw new Error("At least one layer must be specified before calculating treemap data");
    }

    const nested = unwrapNested(rollup(data, fn.first, ...layers));

    const root = hierarchy<HierarchicalData>(
      { isRoot: true, values: nested },
      (d: HierarchicalData) => d.values
    )
      .sort(sortFn)
      .sum((x: HierarchicalData) => {
        if ("value" in x && x.value !== undefined) {
          return valueAcc(x.value as T);
        }
        return 0;
      });

    // Return the root hierarchy without layout coordinates for the new API
    return root as TreemapRawData<T>;
  }

  main.calculate = (data: T[]) => main(data);

  main.layer = (keyFunc: (d: T) => string) => {
    layers.push(keyFunc);
    return main;
  };

  main.value = (accfn: (d: T) => number) => {
    valueAcc = accfn;
    return main;
  };

  main.sort = (sortFunc: (a: any, b: any) => number) => {
    sortFn = sortFunc;
    return main;
  };

  return main;
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
    .label((d: TreemapNode<T>) => (d.data && "key" in d.data ? (d.data as NestedData).key : ""))
    .prop("labelPosition")
    .labelPosition("top-left")
    .prop("labelFontSize", fn.functor)
    .labelFontSize(11)
    .render(function (this: Element, inputData: TreemapRawData<T> | TreemapNode<T>[]) {
      const selection = select<Element, TreemapNode<T>>(this);
      const props = selection.props<TreemapProps<T>>();

      // Determine if we have raw hierarchical data or pre-computed treemap data
      let treemapData: TreemapNode<T>[];

      if (Array.isArray(inputData)) {
        // Already computed treemap data (backwards compatibility)
        treemapData = inputData;
      } else {
        // Raw hierarchical data - apply treemap layout here
        const layout = d3Treemap<HierarchicalData>()
          .size([props.containerWidth, props.containerHeight])
          .tile(treemapSquarify)
          .padding(1)
          .round(true);

        layout(inputData);

        // Flatten the hierarchy and filter out root
        function flatten(node: HierarchyNode<HierarchicalData>): TreemapNode<T>[] {
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
      const visibleData = treemapData.filter(
        (d: TreemapNode<T>) => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5
      );

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
          // If a color scale is provided, use it to color by top-level category
          if (props.colorScale) {
            // Get the top-level category key - safely access the key property
            let categoryKey = "default";

            if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
              categoryKey = (d.parent.data as NestedData).key;
            } else if ("key" in d.data) {
              categoryKey = (d.data as NestedData).key;
            }

            return props.colorScale(categoryKey);
          }

          // Default color
          return "#steelblue";
        })
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
        // Helper function to determine accessible text color based on background
        const getAccessibleTextColor = (backgroundColor?: string): string => {
          if (!backgroundColor) {
            return "#545454"; // Default to SSZVIS gray if no background color
          }
          const bgColor = rgb(backgroundColor);
          console.log({ bgColor });
          // Calculate relative luminance using WCAG 2.1 formula with gamma correction
          const gammaCorrect = (c: number): number => {
            const normalized = c / 255;
            return normalized <= 0.03928
              ? normalized / 12.92
              : Math.pow((normalized + 0.055) / 1.055, 2.4);
          };

          const rLum = gammaCorrect(bgColor.r);
          const gLum = gammaCorrect(bgColor.g);
          const bLum = gammaCorrect(bgColor.b);

          // WCAG relative luminance formula
          const luminance = 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;

          // Return dark color for light backgrounds, light color for dark backgrounds
          // Using 0.179 as threshold provides better contrast (roughly equivalent to #777)
          return luminance > 0.179 ? "#545454" : "#ffffff"; // Use SSZVIS gray or white
        };

        // Function to calculate label position based on labelPosition prop
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
            let categoryKey = "default";
            if (d.ancestors().length > 1 && d.parent && "key" in d.parent.data) {
              categoryKey = (d.parent.data as NestedData).key;
            } else if ("key" in d.data) {
              categoryKey = (d.data as NestedData).key;
            }
            return props.colorScale(categoryKey);
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
          .attr("fill", labelFillAcc)
          .attr("font-size", 11)
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
