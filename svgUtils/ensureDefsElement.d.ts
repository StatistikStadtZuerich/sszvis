/**
 * Ensure Defs Element
 *
 * This method ensures that the provided selection contains a 'defs' object,
 * and furthermore, that the defs object contains an instance of the provided
 * element type, with the provided ID.
 *
 * @module sszvis/svgUtils/ensureDefsElement
 *
 * @param {d3.selection} selection
 * @param {string}       type       Element to create
 * @param {string}       elementId  The ID to assign to the created element
 */
import type { AnySelection } from "../types";
export default function ensureDefsElement(selection: AnySelection, type: string, elementId: string): AnySelection;
//# sourceMappingURL=ensureDefsElement.d.ts.map