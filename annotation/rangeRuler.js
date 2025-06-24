import { select } from 'd3';
import { functor, compose, last } from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import { formatNumber } from '../format.js';
import { component } from '../d3-component.js';

/**
 * RangeRuler annotation
 *
 * The range ruler is similar to the handle ruler and the ruler, except for each data
 * point which it finds bound to its layer, it generates two small dots, and a label which
 * states the value of the data point. For an example, see the interactive stacked area charts.
 * Note that the interactive stacked area charts also include the rangeFlag component for highlighting
 * certain specific dots. This is a sepearate component.
 *
 * @module sszvis/annotation/rangeRuler
 *
 * @property {number functor} x            A function for the x-position of the ruler.
 * @property {number functor} y0           A function for the y-position of the lower dot. Called for each datum.
 * @property {number functor} y1           A function for the y-position of the upper dot. Called for each datum.
 * @property {number} top                  A number for the y-position of the top of the ruler
 * @property {number} bottom               A number for the y-position of the bottom of the ruler
 * @property {string functor} label        A function which generates labels for each range.
 * @property {number} total                A number to display as the total of the range ruler (at the top)
 * @property {boolean functor} flip        Determines whether the rangeRuler labels should be flipped (they default to the right side)
 *
 * @return {sszvis.component}
 */

function rangeRuler () {
  return component().prop("x", functor).prop("y0", functor).prop("y1", functor).prop("top").prop("bottom").prop("label").prop("removeStroke").label(functor("")).prop("total").prop("flip", functor).flip(false).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const crispX = compose(halfPixel, props.x);
    const crispY0 = compose(halfPixel, props.y0);
    const crispY1 = compose(halfPixel, props.y1);
    const middleY = function (d) {
      return halfPixel((props.y0(d) + props.y1(d)) / 2);
    };
    const dotRadius = 1.5;
    const line = selection.selectAll(".sszvis-rangeRuler__rule").data([0]).join("line").classed("sszvis-rangeRuler__rule", true);
    line.attr("x1", crispX).attr("y1", props.top).attr("x2", crispX).attr("y2", props.bottom);
    const marks = selection.selectAll(".sszvis-rangeRuler--mark").data(data).join("g").classed("sszvis-rangeRuler--mark", true);
    marks.append("circle").classed("sszvis-rangeRuler__p1", true);
    marks.append("circle").classed("sszvis-rangeRuler__p2", true);
    marks.append("text").classed("sszvis-rangeRuler__label-contour", true);
    marks.append("text").classed("sszvis-rangeRuler__label", true);
    marks.selectAll(".sszvis-rangeRuler__p1").data(d => [d]).attr("cx", crispX).attr("cy", crispY0).attr("r", dotRadius);
    marks.selectAll(".sszvis-rangeRuler__p2").data(d => [d]).attr("cx", crispX).attr("cy", crispY1).attr("r", dotRadius);
    marks.selectAll(".sszvis-rangeRuler__label").data(d => [d]).attr("x", d => {
      const offset = props.flip(d) ? -10 : 10;
      return crispX(d) + offset;
    }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
    .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));

    //make the contour behind the the label update with the label
    marks.selectAll(".sszvis-rangeRuler__label-contour").data(d => [d]).attr("x", d => {
      const offset = props.flip(d) ? -10 : 10;
      return crispX(d) + offset;
    }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
    .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));
    selection.selectAll("g.sszvis-rangeRuler--mark").each(function () {
      const g = select(this);
      const textNode = g.select("text").node();
      let textContour = g.select(".sszvis-rangeRuler__label-contour");
      if (textContour.empty()) {
        textContour = select(textNode.cloneNode()).classed("sszvis-rangeRuler__label-contour", true).classed("sszvis-rangeRuler__label", false);
        this.insertBefore(textContour.node(), textNode);
      } else {
        textContour.attr("x", d => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
        .style("text-anchor", d => props.flip(d) ? "end" : "start");
      }
      textContour.text(textNode.textContent);
    });
    if (!props.removeStroke) {
      marks.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
    }
    const total = selection.selectAll(".sszvis-rangeRuler__total").data([last(data)]).join("text").classed("sszvis-rangeRuler__total", true);
    total.attr("x", d => {
      const offset = props.flip(d) ? -10 : 10;
      return crispX(d) + offset;
    }).attr("y", props.top - 10).style("text-anchor", d => props.flip(d) ? "end" : "start").text("Total " + formatNumber(props.total));
    const totalNode = total.node();
    let totalContour = selection.select(".sszvis-rangeRuler__total-contour");
    if (totalContour.empty()) {
      totalContour = select(totalNode.cloneNode()).classed("sszvis-rangeRuler__total-contour", true).classed("sszvis-rangeRuler__total", false);
      this.insertBefore(totalContour.node(), totalNode);
    } else {
      totalContour.attr("x", d => {
        const offset = props.flip(d) ? -10 : 10;
        return crispX(d) + offset;
      }).attr("y", props.top - 10).style("text-anchor", d => props.flip(d) ? "end" : "start");
    }
    totalContour.text(totalNode.textContent);
    if (!props.removeStroke) {
      total.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
    }
  });
}

export { rangeRuler as default };
//# sourceMappingURL=rangeRuler.js.map
