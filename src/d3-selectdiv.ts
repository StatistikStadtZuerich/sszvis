import { selection } from "d3";
import type { AnySelection } from "./types.js";

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
  interface Selection<GElement, Datum, PElement, PDatum> {
    selectDiv(key: string): AnySelection;
  }
}

selection.prototype.selectDiv = function (key: string): AnySelection {
  return this.selectAll(`[data-d3-selectdiv="${key}"]`)
    .data((d: unknown) => [d])
    .join("div")
    .attr("data-d3-selectdiv", key)
    .style("position", "absolute");
};
