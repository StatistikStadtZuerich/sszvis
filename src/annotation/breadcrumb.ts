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

import type { HierarchyNode } from "d3";
import { type Component, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import type { AnySelection, StringAccessor } from "../types.js";

// ============================================================================
// Type Definitions
// ============================================================================

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
 * Internal props structure for the breadcrumb component
 */
interface BreadcrumbProps<T = unknown> {
  renderInto: AnySelection;
  items: BreadcrumbItem<T>[];
  label: (item: BreadcrumbItem<T>) => string;
  onClick: (item: BreadcrumbItem<T>, index: number) => void;
  rootLabel: string;
  separator: string;
  width: number;
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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper to create breadcrumb items from a hierarchy node.
 * Extracts the ancestor path and converts to breadcrumb items.
 *
 * @example
 * const items = createBreadcrumbItems(focusedNode);
 * // Returns: [{ label: "Category", node: ... }, { label: "Subcategory", node: ... }]
 */
export function createBreadcrumbItems<T>(
  node: HierarchyNode<NodeDatum<T>> | null
): BreadcrumbItem<T>[] {
  if (!node) return [];

  // Get ancestors from root to current node, excluding the synthetic root
  return node
    .ancestors()
    .reverse()
    .slice(1) // Remove synthetic root node
    .map((n) => ({
      label: n.data._tag === "leaf" || n.data._tag === "branch" ? n.data.key : "",
      node: n,
    }));
}

// ============================================================================
// Component Implementation
// ============================================================================

export default function <T = unknown>(): BreadcrumbComponent<T> {
  return component()
    .prop("renderInto")
    .prop("items")
    .items([])
    .prop("label", fn.functor)
    .label((d: BreadcrumbItem<T>) => d.label)
    .prop("onClick")
    .onClick(() => {})
    .prop("rootLabel")
    .rootLabel("Root")
    .prop("separator")
    .separator(" \u203A ")
    .prop("width")
    .width(800)
    .renderSelection((selection: AnySelection) => {
      const props = selection.props<BreadcrumbProps<T>>();

      // Prepend root item to the breadcrumb trail
      const allItems: BreadcrumbItem<T>[] = [
        { label: props.rootLabel, node: null },
        ...props.items,
      ];

      // Create or select breadcrumb container
      const breadcrumbContainer = props.renderInto
        .selectDiv("breadcrumbs")
        .style("position", "absolute")
        .style("top", "-40px")
        .style("left", "0px")
        .style("width", `${props.width}px`)
        .style("height", "30px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "8px")
        .style("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif')
        .style("font-size", "14px");

      // Data join for breadcrumb items
      const crumbs = breadcrumbContainer
        .selectAll<HTMLSpanElement, BreadcrumbItem<T>>("span.sszvis-breadcrumb-item")
        .data(allItems, (d: BreadcrumbItem<T>) => props.label(d));

      // Enter: create new breadcrumb elements
      const crumbsEnter = crumbs.enter().append("span").classed("sszvis-breadcrumb-item", true);

      // Add link element
      crumbsEnter
        .append("a")
        .style("color", "#0073B3")
        .style("cursor", "pointer")
        .style("text-decoration", "none");

      // Add separator
      crumbsEnter
        .append("span")
        .classed("sszvis-breadcrumb-separator", true)
        .style("color", "#666")
        .text(props.separator);

      // Update: merge enter + update selections
      const crumbsMerged = crumbsEnter.merge(crumbs);

      // Update link text and styling
      crumbsMerged
        .select("a")
        .text((d: BreadcrumbItem<T>) => props.label(d))
        .style("font-weight", (_d: BreadcrumbItem<T>, i: number) =>
          i === allItems.length - 1 ? "bold" : "normal"
        )
        .style("color", (_d: BreadcrumbItem<T>, i: number) =>
          i === allItems.length - 1 ? "#333" : "#0073B3"
        )
        .style("cursor", (_d: BreadcrumbItem<T>, i: number) =>
          i === allItems.length - 1 ? "default" : "pointer"
        )
        .on("click", (event: Event, d: BreadcrumbItem<T>) => {
          const index = allItems.indexOf(d);
          // Don't allow clicking on the current (last) breadcrumb
          if (index === allItems.length - 1) return;
          event.preventDefault();
          props.onClick(d, index);
        });

      // Hide separator on last item
      crumbsMerged
        .select(".sszvis-breadcrumb-separator")
        .style("display", (_d: BreadcrumbItem<T>, i: number) =>
          i === allItems.length - 1 ? "none" : "inline"
        );

      // Exit: remove old breadcrumbs
      crumbs.exit().remove();
    }) as BreadcrumbComponent<T>;
}
