import { selection } from 'd3';

selection.prototype.selectDiv = function (key) {
  return this.selectAll("[data-d3-selectdiv=\"".concat(key, "\"]")).data(d => [d]).join("div").attr("data-d3-selectdiv", key).style("position", "absolute");
};
//# sourceMappingURL=d3-selectdiv.js.map
