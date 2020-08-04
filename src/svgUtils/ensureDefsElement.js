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

export default function (selection, type, elementId) {
  var element = ensureDefsSelection(selection)
    .selectAll(type + "#" + elementId)
    .data([0]);

  var newElement = element.enter().append(type).attr("id", elementId);

  return element.merge(newElement);
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
  var defs = selection.selectAll("defs").data([0]);

  var newDefs = defs.enter().append("defs");

  return defs.merge(newDefs);
}
