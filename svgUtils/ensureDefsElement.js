/**
 * Ensure Defs Element
 *
 * This method ensures that the provided selection contains a 'defs' object,
 * and furthermore, that the defs object contains an instance of the provided
 * element type, with the provided ID.
 *
 * @module sszvis/svgUtils/ensureDefsElement
 *
 * @param selection  The selection to ensure the defs element within
 * @param type       Element to create, as an SVG tag name
 * @param elementId  The ID to assign to the created element
 *
 * The element type is derived from the tag name, so callers get a precisely typed selection
 * without naming it twice:
 *
 *     ensureDefsElement(sel, "pattern", id)  // Selection<SVGPatternElement, ...>
 *
 * The selection parameters are generic because d3's Selection is invariant in its element
 * parameters - no single non-generic type accepts every selection.
 */
function ensureDefsElement(selection, type, elementId) {
  return ensureDefsSelection(selection).selectAll("".concat(type, "#").concat(elementId)).data([0])
  // join() reports the union of the elements it entered and those selectAll found.
  // Naming the entered element here makes both sides the same tag, so the union
  // collapses on its own and no assertion is needed.
  .join(type).attr("id", elementId);
}
/* Helper functions
----------------------------------------------- */
/**
 * This method ensures that the provided selection contains a 'defs' object,
 * which is required for rendering patterns. SVG elements rendered into a defs
 * container will not be displayed, but can be referenced by ID in the fill property
 * of other, visible, elements.
 */
function ensureDefsSelection(selection) {
  return selection.selectAll("defs").data([0]).join("defs");
}

export { ensureDefsElement as default };
//# sourceMappingURL=ensureDefsElement.js.map
