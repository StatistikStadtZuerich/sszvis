import { selection } from "d3";
/**
 * d3.selection plugin to simplify creating idempotent divs that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param {String} key - the name of the group
 * @return {d3.selection}
 */
selection.prototype.selectDiv = function (key) {
  return this.selectAll('[data-d3-selectdiv="' + key + '"]')
    .data((d) => [d])
    .join("div")
    .attr("data-d3-selectdiv", key)
    .style("position", "absolute");
};
