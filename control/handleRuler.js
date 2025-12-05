import { select } from 'd3';
import { component } from '../d3-component.js';
import { functor, compose } from '../fn.js';
import { halfPixel } from '../svgUtils/crisp.js';
import translateString from '../svgUtils/translateString.js';

/**
 * Ruler with a handle control
 *
 * The handle ruler component is very similar to the ruler component, except that it is rendered
 * with a 24-pixel tall handle at the top. It is moved and repositioned in the same manner as a ruler,
 * so the actual interaction with the handle is up to the developer to specify. This component also
 * creates dots for each data point it finds bound to its layer.
 *
 * @module sszvis/control/handleRuler
 *
 * @property {function} x                   A function or number which determines the x-position of the ruler
 * @property {function} y                   A function which determines the y-position of the ruler dots. Passed data values.
 * @property {number} top                   A number for the y-position of the top of the ruler.
 * @property {number} bottom                A number for the y-position of the bottom of the ruler.
 * @property {string, function} label       A string or string function for the labels of the ruler dots.
 * @property {string, function} color       A string or color for the fill color of the ruler dots.
 * @property {boolean, function} flip       A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)
 *
 * @returns {sszvis.component}
 */
function handleRuler () {
  return component().prop("x", functor).prop("y", functor).prop("top").prop("bottom").prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // Elements need to be placed on half-pixels in order to be rendered
    // crisply across browsers. That's why we create this position accessor
    // here that takes a datum as input, reads out its value (props.x) and
    // then rounds this pixel value to half pixels (1px -> 1.5px, 1.2px -> 1.5px)
    const crispX = compose(halfPixel, props.x);
    const crispY = compose(halfPixel, props.y);
    const bottom = props.bottom - 4;
    const handleWidth = 10;
    const handleHeight = 24;
    const handleTop = props.top - handleHeight;
    const group = selection.selectAll(".sszvis-handleRuler__group").data([0]).join("g").classed("sszvis-handleRuler__group", true);
    group.append("line").classed("sszvis-ruler__rule", true);
    group.append("rect").classed("sszvis-handleRuler__handle", true);
    group.append("line").classed("sszvis-handleRuler__handle-mark", true);
    group.selectAll(".sszvis-ruler__rule").attr("x1", crispX).attr("y1", halfPixel(props.top)).attr("x2", crispX).attr("y2", halfPixel(bottom));
    group.selectAll(".sszvis-handleRuler__handle").attr("x", d => crispX(d) - handleWidth / 2).attr("y", halfPixel(handleTop)).attr("width", handleWidth).attr("height", handleHeight).attr("rx", 2).attr("ry", 2);
    group.selectAll(".sszvis-handleRuler__handle-mark").attr("x1", crispX).attr("y1", halfPixel(handleTop + handleHeight * 0.15)).attr("x2", crispX).attr("y2", halfPixel(handleTop + handleHeight * 0.85));
    const dots = group.selectAll(".sszvis-ruler__dot").data(data).join("circle").classed("sszvis-ruler__dot", true);
    dots.attr("cx", crispX).attr("cy", crispY).attr("r", 3.5).attr("fill", props.color);
    selection.selectAll(".sszvis-ruler__label-outline").data(data).join("text").classed("sszvis-ruler__label-outline", true);
    selection.selectAll(".sszvis-ruler__label").data(data).join("text").classed("sszvis-ruler__label", true);
    // Update both labelOutline and labelOutline selections
    selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
      const x = compose(halfPixel, props.x)(d);
      const y = compose(halfPixel, props.y)(d);
      const dx = props.flip(d) ? -10 : 10;
      const dy = y < props.top ? 2 * y : y > props.bottom ? 0 : 5;
      return translateString(x + dx, y + dy);
    }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(props.label);
  });
}

export { handleRuler as default };
//# sourceMappingURL=handleRuler.js.map
