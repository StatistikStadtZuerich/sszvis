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
  const div = this.selectAll('[data-d3-selectdiv="' + key + '"]').data((d) => [d]);

  const newDiv = div
    .enter()
    .append("div")
    .attr("data-d3-selectdiv", key)
    .style("position", "absolute");

  return div.merge(newDiv);
};
