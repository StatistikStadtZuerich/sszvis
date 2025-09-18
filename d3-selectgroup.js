import { selection } from 'd3';

selection.prototype.selectGroup = function (key) {
  return this.selectAll("[data-d3-selectgroup=\"".concat(key, "\"]")).data(d => [d]).join("g").attr("data-d3-selectgroup", key);
};
//# sourceMappingURL=d3-selectgroup.js.map
