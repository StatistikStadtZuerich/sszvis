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
import { type HierarchyCircularNode, type HierarchyNode } from "d3";
import { type Component } from "../d3-component.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import type { StringAccessor } from "../types.js";
export type PackLayout<T = unknown> = HierarchyNode<NodeDatum<T>> & {
    x: number;
    y: number;
    r: number;
    value: number;
    data?: T;
    depth: number;
    height: number;
};
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
export default function <T = unknown>(): PackComponent<T>;
export {};
//# sourceMappingURL=pack.d.ts.map