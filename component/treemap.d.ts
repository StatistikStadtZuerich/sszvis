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
import { type HierarchyNode } from "d3";
import { type Component } from "../d3-component.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import type { StringAccessor } from "../types.js";
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
type LabelPosition = "top-left" | "center" | "top-right" | "bottom-left" | "bottom-right";
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
/**
 * Main treemap component
 *
 * @template T The type of the original flat data objects
 */
export default function <T = unknown>(): TreemapComponent<T>;
export {};
//# sourceMappingURL=treemap.d.ts.map