import { select } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { defaultTransition } from '../transition.js';

/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * @module sszvis/component/dot
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *
 * @return {sszvis.component}
 */
function dot () {
  return component().prop("x", functor).prop("y", functor).prop("radius").prop("stroke").prop("fill").prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    let dots = selection.selectAll(".sszvis-circle").data(data).join("circle").classed("sszvis-circle", true).attr("cx", props.x).attr("cy", props.y).attr("r", props.radius).attr("stroke", props.stroke).attr("fill", props.fill);
    if (props.transition) {
      dots = dots.transition(defaultTransition());
    }
    dots.attr("cx", props.x).attr("cy", props.y).attr("r", props.radius);
    // Tooltip anchors
    const ta = tooltipAnchor().position(d => [props.x(d), props.y(d)]);
    selection.call(ta);
  });
}

export { dot as default };
//# sourceMappingURL=dot.js.map
