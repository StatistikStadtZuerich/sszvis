import { component } from '../d3-component.js';
import { functor } from '../fn.js';

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
function createBreadcrumbItems(node) {
  if (!node) return [];
  // Get ancestors from root to current node, excluding the synthetic root
  return node.ancestors().reverse().slice(1) // Remove synthetic root node
  .map(n => ({
    label: n.data._tag === "leaf" || n.data._tag === "branch" ? n.data.key : "",
    node: n
  }));
}
// ============================================================================
// Component Implementation
// ============================================================================
function breadcrumb () {
  return component().prop("renderInto").prop("items").items([]).prop("label", functor).label(d => d.label).prop("onClick").onClick(() => {}).prop("rootLabel").rootLabel("Root").prop("separator").separator(" \u203A ").prop("width").width(800).renderSelection(selection => {
    const props = selection.props();
    // Prepend root item to the breadcrumb trail
    const allItems = [{
      label: props.rootLabel,
      node: null
    }, ...props.items];
    // Create or select breadcrumb container
    const breadcrumbContainer = props.renderInto.selectDiv("breadcrumbs").style("position", "absolute").style("top", "-40px").style("left", "0px").style("width", "".concat(props.width, "px")).style("height", "30px").style("display", "flex").style("align-items", "center").style("gap", "8px").style("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').style("font-size", "14px");
    // Data join for breadcrumb items
    const crumbs = breadcrumbContainer.selectAll("span.sszvis-breadcrumb-item").data(allItems, d => props.label(d));
    // Enter: create new breadcrumb elements
    const crumbsEnter = crumbs.enter().append("span").classed("sszvis-breadcrumb-item", true);
    // Add link element
    crumbsEnter.append("a").style("color", "#0073B3").style("cursor", "pointer").style("text-decoration", "none");
    // Add separator
    crumbsEnter.append("span").classed("sszvis-breadcrumb-separator", true).style("color", "#666").text(props.separator);
    // Update: merge enter + update selections
    const crumbsMerged = crumbsEnter.merge(crumbs);
    // Update link text and styling
    crumbsMerged.select("a").text(d => props.label(d)).style("font-weight", (_d, i) => i === allItems.length - 1 ? "bold" : "normal").style("color", (_d, i) => i === allItems.length - 1 ? "#333" : "#0073B3").style("cursor", (_d, i) => i === allItems.length - 1 ? "default" : "pointer").on("click", (event, d) => {
      const index = allItems.indexOf(d);
      // Don't allow clicking on the current (last) breadcrumb
      if (index === allItems.length - 1) return;
      event.preventDefault();
      props.onClick(d, index);
    });
    // Hide separator on last item
    crumbsMerged.select(".sszvis-breadcrumb-separator").style("display", (_d, i) => i === allItems.length - 1 ? "none" : "inline");
    // Exit: remove old breadcrumbs
    crumbs.exit().remove();
  });
}

export { createBreadcrumbItems, breadcrumb as default };
//# sourceMappingURL=breadcrumb.js.map
