/**
 * Breadcrumb navigation component
 *
 * Use this component to add a breadcrumb navigation trail for hierarchical visualizations
 * like treemaps and pack charts. The breadcrumb shows the current path through the hierarchy
 * and allows users to navigate back to parent nodes by clicking on previous items.
 *
 * @module sszvis/annotation/breadcrumb
 *
 * @template T The type of the underlying data in hierarchy nodes
 *
 * @property {selection} renderInto   Container selection to render breadcrumbs into (required)
 * @property {Array} items            Array of BreadcrumbItem objects representing the trail
 * @property {function} label         Accessor to get label text from an item (default: d => d.label)
 * @property {function} onClick       Callback when a breadcrumb is clicked (receives item and index)
 * @property {string} rootLabel       Label for the root breadcrumb (default: "Root")
 * @property {string} separator       Separator text between breadcrumbs (default: " > ")
 * @property {number} width           Width of the breadcrumb container in pixels
 *
 * @return {sszvis.component}
 */
import { type HierarchyNode } from "d3";
import { type Component } from "../d3-component.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import type { AnySelection, StringAccessor } from "../types.js";
/**
 * Represents a single breadcrumb item in the navigation trail.
 * Generic over T to support different underlying data types.
 */
export interface BreadcrumbItem<T = unknown> {
    /** Display label for this breadcrumb */
    label: string;
    /** The hierarchy node this breadcrumb represents (null for root) */
    node: HierarchyNode<NodeDatum<T>> | null;
}
/**
 * Component interface with method chaining support.
 * Each method returns the component for chaining (setter) or the value (getter).
 */
export interface BreadcrumbComponent<T = unknown> extends Component {
    /** Set the container to render breadcrumbs into */
    renderInto(): AnySelection;
    renderInto(selection: AnySelection): BreadcrumbComponent<T>;
    /** Set the array of breadcrumb items */
    items(): BreadcrumbItem<T>[];
    items(items: BreadcrumbItem<T>[]): BreadcrumbComponent<T>;
    /** Set the label accessor function */
    label(): (item: BreadcrumbItem<T>) => string;
    label(accessor: StringAccessor<BreadcrumbItem<T>>): BreadcrumbComponent<T>;
    /** Set the click handler (receives item and index) */
    onClick(): (item: BreadcrumbItem<T>, index: number) => void;
    onClick(handler: (item: BreadcrumbItem<T>, index: number) => void): BreadcrumbComponent<T>;
    /** Set the root label text */
    rootLabel(): string;
    rootLabel(label: string): BreadcrumbComponent<T>;
    /** Set the separator text */
    separator(): string;
    separator(sep: string): BreadcrumbComponent<T>;
    /** Set the width of the breadcrumb container */
    width(): number;
    width(w: number): BreadcrumbComponent<T>;
}
/**
 * Helper to create breadcrumb items from a hierarchy node.
 * Extracts the ancestor path and converts to breadcrumb items.
 *
 * @example
 * const items = createBreadcrumbItems(focusedNode);
 * // Returns: [{ label: "Category", node: ... }, { label: "Subcategory", node: ... }]
 */
export declare function createBreadcrumbItems<T>(node: HierarchyNode<NodeDatum<T>> | null): BreadcrumbItem<T>[];
export default function <T = unknown>(): BreadcrumbComponent<T>;
//# sourceMappingURL=breadcrumb.d.ts.map