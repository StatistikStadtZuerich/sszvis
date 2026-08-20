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
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 *                                              Becomes a functor. Required: see the note on missing properties below.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 *                                              Becomes a functor. Required, like x.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 *                                              Not wrapped in fn.functor, so the getter returns whatever was
 *                                              set rather than a function. When it is left unset no r attribute
 *                                              is written, SVG defaults r to 0, and the dots are invisible -
 *                                              silently, since only x and y are checked. A radius of 0 is also
 *                                              how docs/scatterplot-over-time hides dots outside the selected
 *                                              period.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 *                                              Not wrapped in fn.functor. When unset, no stroke attribute is
 *                                              written and the circles fall back to the SVG and CSS defaults.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *                                              Same as stroke.
 * @property {boolean} transition               Whether or not to transition the visual values of the dot
 *                                              component, when they are changed. Defaults to true.
 *
 * Note: x and y are required, and their absence is not reported as such. The circle attributes
 * survive an unset property, because d3 drops an attribute whose value is undefined, but the
 * tooltip anchor calls the accessor directly and throws a TypeError from d3's internals that
 * names neither the property nor the component. The failure depends on the data, so an empty
 * first render succeeds and the same chart throws as soon as data arrives. It also happens
 * after the circles and the anchor rects have been created, so a caller that catches it is
 * left with a partially updated chart.
 *
 * Note: the transition property does not currently animate anything - the data join writes the
 * geometry to the elements first and the transition then re-applies the same values, so every
 * tween runs from a value to itself and the geometry always jumps. It is not free either: each
 * render schedules three attribute tweens on every circle, and those schedules accumulate until
 * they start, at which point d3 cancels the superseded ones and interrupts any transition
 * already running on those nodes. fill and stroke are applied only on the join and are never
 * transitioned, so color changes jump whatever this property is set to.
 *
 * Note: unlike bar, dot has no missing-value guard. Whatever an accessor returns is written into
 * the attribute verbatim, so a NaN coordinate - the usual result of feeding a scale a value
 * outside its domain - produces an invalid attribute that the browser ignores, leaving the dot
 * at the origin, while a NaN or negative radius makes the circle disappear. Strings, booleans
 * and Infinity are written unchanged too, and all of it fails silently. undefined and null are
 * the exception: d3 removes the attribute for them.
 *
 * Note: the tooltip anchor reads its position as props.x(d) and props.y(d), without d3's index
 * argument, so an accessor that uses the index positions the circles correctly but yields
 * translate(NaN,NaN) for every anchor. The anchor ignores the radius, and is created and
 * positioned even for a dot hidden with radius 0, which leaves a live tooltip target on an
 * invisible dot. x and y are read three times per datum on every render - twice for the circle
 * and once for the anchor - and radius twice, so accessors should be cheap and free of side
 * effects. See test/component/dot.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Normalises a property that was stored without fn.functor into an accessor, so that the
 * renderer has a single shape to hand to d3. An accessor is passed through untouched, so
 * it still receives d3's arguments and node context. The stored value itself is never
 * modified, which is what keeps the getters returning whatever was set.
 */
function toAccessor(value) {
  // An accessor is handed to d3 untouched, so it keeps receiving d3's arguments and node
  // context. Its result is narrowed from `R | null | undefined` to `R | null` only because
  // d3's own attr typings omit undefined; d3 removes the attribute for either one, so the
  // two are interchangeable at this boundary.
  return typeof value === "function" ? value : () => value !== null && value !== void 0 ? value : null;
}
function dot () {
  return component().prop("x", functor).prop("y", functor).prop("radius").prop("stroke").prop("fill").prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const radius = toAccessor(props.radius);
    const stroke = toAccessor(props.stroke);
    const fill = toAccessor(props.fill);
    const dots = selection.selectAll(".sszvis-circle").data(data).join("circle").classed("sszvis-circle", true).attr("cx", props.x).attr("cy", props.y).attr("r", radius).attr("stroke", stroke).attr("fill", fill);
    if (props.transition) {
      dots.transition(defaultTransition()).attr("cx", props.x).attr("cy", props.y).attr("r", radius);
    } else {
      dots.attr("cx", props.x).attr("cy", props.y).attr("r", radius);
    }
    // Tooltip anchors
    const ta = tooltipAnchor().position(d => [props.x(d), props.y(d)]);
    selection.call(ta);
  });
}

export { dot as default };
//# sourceMappingURL=dot.js.map
