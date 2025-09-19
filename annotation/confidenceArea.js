import { select, area } from 'd3';
import { component } from '../d3-component.js';
import { functor, identity } from '../fn.js';
import { dataAreaPattern } from '../patterns.js';
import ensureDefsElement from '../svgUtils/ensureDefsElement.js';
import { defaultTransition } from '../transition.js';

/**
 * @function sszvis.annotationConfidenceArea
 *
 * A component for creating confidence areas. The component should be passed
 * an array of data values, each of which will be used to render a confidence area
 * by passing it through the accessor functions. You can specify the x, y0, and y1
 * properties to define the area. The component also supports stroke, strokeWidth,
 * and fill properties for styling.
 *
 * @module sszvis/annotation/confidenceArea
 *
 * @param {function} x             The x-accessor function.
 * @param {function} y0            The y0-accessor function.
 * @param {function} y1            The y1-accessor function.
 * @param {string} [stroke]        The stroke color of the area.
 * @param {number} [strokeWidth]   The stroke width of the area.
 * @param {string} [fill]          The fill color of the area.
 * @param {function} [key]         The key function for data binding.
 * @param {function} [valuesAccessor] The accessor function for the data values.
 * @param {boolean} [transition]   Whether to apply a transition to the area.
 *
 * @returns {sszvis.component} a confidence area component
 */
function confidenceArea () {
  return component().prop("x", functor).prop("y0", functor).prop("y1", functor).prop("stroke").prop("strokeWidth").prop("fill").prop("key").key((_, i) => i).prop("valuesAccessor").valuesAccessor(identity).prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
    dataAreaPattern(patternSelection);
    // Layouts
    const area$1 = area().x(d => Number(props.x(d))).y0(d => Number(props.y0(d))).y1(d => Number(props.y1(d)));
    // Rendering
    const path = selection.selectAll(".sszvis-area").data(data).join("path").classed("sszvis-area", true);
    if (props.stroke) {
      path.style("stroke", props.stroke);
    }
    path.attr("fill", "url(#data-area-pattern)").order();
    const finalPath = props.transition ? path.transition().call(defaultTransition) : path;
    finalPath.attr("d", d => area$1(props.valuesAccessor(d)));
    if (props.stroke) {
      finalPath.style("stroke", props.stroke);
    }
    if (props.strokeWidth) {
      finalPath.style("stroke-width", props.strokeWidth);
    }
    finalPath.attr("fill", "url(#data-area-pattern)");
  });
}

export { confidenceArea as default };
//# sourceMappingURL=confidenceArea.js.map
