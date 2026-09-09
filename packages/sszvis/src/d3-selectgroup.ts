import { type BaseType, type Selection, selection } from "d3";

/**
 * d3.selection plugin to simplify creating idempotent groups that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param  {String} key The name of the group
 * @return {d3.selection}
 */

// Augment the D3 Selection interface to include our custom method
declare module "d3" {
  // biome-ignore lint/correctness/noUnusedVariables: the type parameters must mirror d3's Selection signature for declaration merging to apply
  interface Selection<GElement, Datum, PElement, PDatum> {
    /** The group is a <g> whose parent is the element this selection holds. */
    selectGroup(key: string): Selection<SVGGElement, Datum, GElement, Datum>;
  }
}

selection.prototype.selectGroup = function <G extends BaseType, D, P extends BaseType, PD>(
  this: Selection<G, D, P, PD>,
  key: string
) {
  return this.selectAll(`[data-d3-selectgroup="${key}"]`)
    .data((d: unknown) => [d])
    .join<SVGGElement>("g")
    .attr("data-d3-selectgroup", key);
};
