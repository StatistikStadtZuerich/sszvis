import { type BaseType, type Selection, selection } from "d3";

/**
 * d3.selection plugin to simplify creating idempotent divs that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param {String} key - the name of the group
 * @return {d3.selection}
 */

// Augment the D3 Selection interface to include our custom method
declare module "d3" {
  // biome-ignore lint/correctness/noUnusedVariables: the type parameters must mirror d3's Selection signature for declaration merging to apply
  interface Selection<GElement, Datum, PElement, PDatum> {
    /** The div's parent is the element this selection holds. */
    selectDiv(key: string): Selection<HTMLDivElement, Datum, GElement, Datum>;
  }
}

selection.prototype.selectDiv = function <G extends BaseType, D, P extends BaseType, PD>(
  this: Selection<G, D, P, PD>,
  key: string,
) {
  return this.selectAll(`[data-d3-selectdiv="${key}"]`)
    .data((d: unknown) => [d])
    .join<HTMLDivElement>("div")
    .attr("data-d3-selectdiv", key)
    .style("position", "absolute");
};
