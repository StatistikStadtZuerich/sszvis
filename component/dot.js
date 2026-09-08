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
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single circle. The x-position, y-position and radius are extracted from the
 * data objects using accessor functions, as are the fill and stroke colors. Every property may also
 * be specified as a constant. One tooltip anchor is rendered per datum, as an invisible 1x1 rect at
 * the center of the circle.
 *
 * @module sszvis/component/dot
 *
 * @template T The type of the data values bound to the dots
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots,
 *                                              in pixels. Becomes a functor. Required: leaving it unset throws
 *                                              before anything is rendered.
 * @property {number, function} y               An accessor function or number for the y-position of the dots,
 *                                              in pixels. Becomes a functor. Required, like x.
 * @property {number, function} radius          An accessor function or number for the radius of the dots, in
 *                                              pixels. Becomes a functor. Required, like x and y - an unwritten
 *                                              r attribute would default to 0 and render a full set of
 *                                              invisible dots. A radius of 0 is still explicitly allowed, and
 *                                              is how docs/scatterplot-over-time hides dots outside the
 *                                              selected period.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 *                                              Becomes a functor. When unset, no stroke attribute is written
 *                                              and the circles fall back to the SVG and CSS defaults.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *                                              Same as stroke.
 * @property {boolean} transition               Whether or not to transition the geometry of the dot component
 *                                              when it changes. Defaults to true, and eases over 300ms.
 *
 * Note: the geometry accessors are guarded, in the same spirit as bar's guard: cx, cy and r must be
 * finite numbers, so NaN - the usual result of feeding a scale a value outside its domain - along
 * with Infinity, undefined, null and anything that does not coerce to a finite number all become 0.
 * A negative radius is clamped to 0, since a negative r is an SVG error and would drop the circle
 * altogether. The guard means a bad value parks one dot at the origin rather than removing it
 * silently. fill and stroke are not guarded; an accessor may return null or undefined there to leave
 * the attribute off.
 *
 * Note: entering dots receive their geometry on the join, before the transition starts, so they
 * appear in place rather than animating in from nothing. Only updates animate. fill and stroke are
 * deliberately not transitioned - a colour change jumps - because the colour scales these charts
 * use are categorical and interpolating between two category colours reads as a third category.
 *
 * Note: x, y and radius are read twice per datum on every render - once for the circle and once for
 * the tooltip anchor - plus a third time when transitioning, so accessors should be cheap and free
 * of side effects. The anchor ignores the radius, and is created and positioned even for a dot
 * hidden with radius 0, which leaves a live tooltip target on an invisible dot. See
 * test/component/dot.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Reports a required property the caller left unset, naming both the component and the
 * property. Called before the data join, so a failed configuration leaves no half-rendered
 * circles or anchors behind, and fails on the first render rather than on the first render
 * that happens to have data.
 */
function required(value, name) {
  if (value === undefined) {
    throw new Error("[dot] the ".concat(name, " property is required"));
  }
  return value;
}
/**
 * Coerces a geometry value to a finite number, substituting 0 for anything else.
 *
 * Coercion first, so a numeric string still works; the finiteness check then catches NaN
 * and Infinity as well as the values that do not coerce at all. Shared in substance with
 * bar's guard - the two components are expected to agree, and there is no home for the
 * helper short of a new module.
 */
function toFinite(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
function dot() {
  return component().prop("x", functor).prop("y", functor).prop("radius", functor).prop("stroke", functor).prop("fill", functor).prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const xProp = required(props.x, "x");
    const yProp = required(props.y, "y");
    const radiusProp = required(props.radius, "radius");
    const xAt = (datum, index) => toFinite(xProp(datum, index));
    const yAt = (datum, index) => toFinite(yProp(datum, index));
    // A negative r is invalid per the SVG spec and drops the circle, so it is clamped
    // rather than passed on.
    const rAt = (datum, index) => Math.max(0, toFinite(radiusProp(datum, index)));
    const strokeAt = (datum, index) => {
      var _props$stroke, _props$stroke2;
      return (_props$stroke = (_props$stroke2 = props.stroke) === null || _props$stroke2 === void 0 ? void 0 : _props$stroke2.call(props, datum, index)) !== null && _props$stroke !== void 0 ? _props$stroke : null;
    };
    const fillAt = (datum, index) => {
      var _props$fill, _props$fill2;
      return (_props$fill = (_props$fill2 = props.fill) === null || _props$fill2 === void 0 ? void 0 : _props$fill2.call(props, datum, index)) !== null && _props$fill !== void 0 ? _props$fill : null;
    };
    // Entering circles are given their geometry on the join, so they are in place before
    // any transition starts. The geometry is then applied exactly once more - to the
    // transition when there is one, and to the plain selection otherwise - so an update
    // tweens from its previous value instead of from the value it already holds.
    const dots = selection.selectAll(".sszvis-circle").data(data).join(enter => enter.append("circle").classed("sszvis-circle", true).attr("cx", xAt).attr("cy", yAt).attr("r", rAt)).attr("stroke", strokeAt).attr("fill", fillAt);
    if (props.transition) {
      dots.transition(defaultTransition()).attr("cx", xAt).attr("cy", yAt).attr("r", rAt);
    } else {
      dots.attr("cx", xAt).attr("cy", yAt).attr("r", rAt);
    }
    // Tooltip anchors
    const anchorPosition = (datum, index) => [xAt(datum, index), yAt(datum, index)];
    const ta = tooltipAnchor().position(anchorPosition);
    selection.call(ta);
  });
}

export { dot as default };
//# sourceMappingURL=dot.js.map
