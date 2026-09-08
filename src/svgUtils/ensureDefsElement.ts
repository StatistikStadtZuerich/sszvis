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
 * The id is matched by reading the attribute back rather than by building an id selector,
 * so any string a caller can put in an id attribute can also be looked up again - the same
 * idiom the map renderers use for their key attributes. An id selector cannot do that: an id
 * holding a CSS-significant character either throws (`pattern#a"b` is not a valid selector,
 * and neither is the `pattern#` an empty id builds) or, worse, parses as something else -
 * `pattern#a b` is a valid descendant selector that matches nothing, so a fresh definition is
 * appended on every render.
 *
 * Both lookups are scoped to their parent's own children. The defs element belongs to the
 * selection itself, not to a group nested inside it: with a descendant lookup an outer
 * selection reuses a nested group's defs, so two overlays end up sharing - and clearing -
 * each other's definitions.
 *
 * The element type is derived from the tag name, so callers get a precisely typed selection
 * without naming it twice:
 *
 *     ensureDefsElement(sel, "pattern", id)  // Selection<SVGPatternElement, ...>
 *
 * The selection parameters are generic because d3's Selection is invariant in its element
 * parameters - no single non-generic type accepts every selection.
 */

import type { BaseType, Selection } from "d3";

export default function ensureDefsElement<
  K extends keyof SVGElementTagNameMap,
  G extends BaseType,
  D,
  P extends BaseType,
  PD,
>(
  selection: Selection<G, D, P, PD>,
  type: K,
  elementId: string
): Selection<SVGElementTagNameMap[K], number, SVGDefsElement, number> {
  return (
    ensureDefsSelection(selection)
      .selectAll<SVGElementTagNameMap[K], number>(`:scope > ${type}`)
      .filter(function () {
        return this.getAttribute("id") === elementId;
      })
      .data([0])
      // join() reports the union of the elements it entered and those selectAll found.
      // Naming the entered element here makes both sides the same tag, so the union
      // collapses on its own and no assertion is needed.
      .join<SVGElementTagNameMap[K]>(type)
      .attr("id", elementId)
  );
}

/* Helper functions
----------------------------------------------- */

/**
 * This method ensures that the provided selection contains a 'defs' object,
 * which is required for rendering patterns. SVG elements rendered into a defs
 * container will not be displayed, but can be referenced by ID in the fill property
 * of other, visible, elements.
 */
function ensureDefsSelection<G extends BaseType, D, P extends BaseType, PD>(
  selection: Selection<G, D, P, PD>
): Selection<SVGDefsElement, number, G, D> {
  return selection.selectAll<SVGDefsElement, number>(":scope > defs").data([0]).join("defs");
}
