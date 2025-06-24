import { selection } from 'd3';

/**
 * d3.selection plugin to simplify creating idempotent groups that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param  {String} key The name of the group
 * @return {d3.selection}
 */
selection.prototype.selectGroup = function (key) {
  return this.selectAll('[data-d3-selectgroup="' + key + '"]').data(d => [d]).join("g").attr("data-d3-selectgroup", key);
};
//# sourceMappingURL=d3-selectgroup.js.map
