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
import type { BaseType, Selection } from "d3";
export default function ensureDefsElement<K extends keyof SVGElementTagNameMap, G extends BaseType, D, P extends BaseType, PD>(selection: Selection<G, D, P, PD>, type: K, elementId: string): Selection<SVGElementTagNameMap[K], number, SVGDefsElement, number>;
//# sourceMappingURL=ensureDefsElement.d.ts.map