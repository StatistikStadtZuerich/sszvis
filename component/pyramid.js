import { select, line } from 'd3';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { defaultTransition } from '../transition.js';
import bar from './bar.js';

/**
 * Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is typically one object holding both sides of the
 * pyramid - all the component requires is that the side accessors return arrays. Each
 * series is then rendered by its own bar component, the left one mirrored across the spine,
 * so every bar dimension is read from the same accessors on both sides.
 *
 * The component always creates four sub-groups, in this order: left, right, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint
 * over the bars, and the reference groups are created even when no reference accessor is
 * configured.
 *
 * @module sszvis/component/pyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the datum bound to the chart layer
 * @template D The type of one bar's datum, i.e. the elements of each side's series
 *
 * @property {string, function} [barFill]          The color of a bar. Defaults to #000 and applies to both
 *                                                 sides; a per-datum accessor is the usual way to colour the
 *                                                 two sides differently.
 * @property {number, function} barHeight          The height of a bar. Required, but omitting it is not
 *                                                 reported: the value reaches bar's missing-value guard as
 *                                                 undefined and becomes 0, so the chart renders an empty axis
 *                                                 frame with no bars and no warning.
 * @property {number, function} barWidth           The width of a bar. Required, and the only bar dimension
 *                                                 whose absence throws, because the component computes the
 *                                                 left bar's x itself as -SPINE_PADDING - barWidth(d). That
 *                                                 call also passes the datum alone, without d3's index and
 *                                                 group arguments, so an index-aware accessor yields NaN,
 *                                                 which bar's guard turns into 0: the left bars collapse onto
 *                                                 the spine at their full width. For the same reason a missing
 *                                                 value puts a left bar at x=0 rather than at the spine's
 *                                                 -0.5, half a pixel away from where the right side puts it.
 * @property {number, function} barPosition        The vertical position of a bar, i.e. its top edge. Required,
 *                                                 and like barHeight it fails silently: every bar is drawn at
 *                                                 y=0 when it is missing.
 * @property {Array<Number>} [tooltipAnchor]       The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars.
 *                                                 The value is handed to both bars unchanged rather than being
 *                                                 mirrored, and bar measures from its own upper left corner, so
 *                                                 any x other than 0.5 lands on visually opposite sides of the
 *                                                 pyramid. An array with fewer than two entries yields a NaN
 *                                                 coordinate, as documented on bar.
 * @property {function}         leftAccessor       Data for the left side. Required: an unset accessor throws
 *                                                 "props.leftAccessor is not a function" from the renderer,
 *                                                 and an accessor that returns undefined or null throws from
 *                                                 d3's data join instead, with a message that names neither
 *                                                 the property nor the component.
 * @property {function}         rightAccessor      Data for the right side. Same requirements as leftAccessor.
 * @property {function}         [leftRefAccessor]  Reference data for the left side, drawn as a single path
 *                                                 outlining the reference series. Optional, but the guard
 *                                                 tests whether the accessor was set, not what it returns: an
 *                                                 accessor that yields undefined or null for some states
 *                                                 throws instead of hiding the line. Returning an empty array
 *                                                 does hide it, though the classed path element stays in the
 *                                                 DOM with no d attribute, where CSS and hit tests can still
 *                                                 find it.
 * @property {function}         [rightRefAccessor] Reference data for the right side. Same as leftRefAccessor.
 *
 * Note: the reference lines and the bars are drawn in slightly different coordinate
 * systems. The bars are pushed outwards by SPINE_PADDING, a deliberate cosmetic gap at the
 * spine, while the line is drawn straight from barWidth and so agrees with the axis scale.
 * A reference value equal to a bar value therefore lands half a pixel inside that bar's
 * outer edge, symmetrically on both sides. The line also takes its y from barPosition alone
 * and never accounts for barHeight, so the outline runs along the bars' top edges rather
 * than their mid-lines, half a bar height above the values it describes.
 *
 * Note: a reference line's d attribute is only ever written through a transition, so a
 * freshly rendered path carries no geometry until the first animation frame. Entering lines
 * snap into place, because d3 has no previous d to interpolate from; only updates animate.
 * The bars underneath do not animate at all - bar's transition property is inert - so on a
 * state change the outline eases towards its new position while the bars jump, and the two
 * visibly detach for the length of the transition.
 *
 * Note: the reference datum is wrapped in an array, one array of points per path, so each
 * side is capped at a single line. While a reference accessor is set the join therefore
 * always has exactly one element and the exit selection can never fire: once a line has
 * been rendered its path element stays in the DOM even after the reference data goes away,
 * with only its d attribute dropped. Only removing the accessor itself empties the group.
 *
 * Note: bar guards every geometry value against NaN, but the reference line hands barWidth
 * and barPosition straight to d3.line. One missing value poisons the path string, and the
 * browser renders the valid prefix and drops the rest of the outline.
 *
 * Note: the reference line's appearance comes entirely from the
 * .sszvis-pyramid__referenceline rule in sszvis.css - the component sets only the class.
 * Without that stylesheet the path renders as a solid black shape, since fill defaults to
 * black. stackedPyramid's otherwise identical line component inlines the same four values
 * instead. See test/component/pyramid.test.ts.
 *
 * @return {sszvis.component}
 */
/* Constants
----------------------------------------------- */
const SPINE_PADDING = 0.5;
/* Module
----------------------------------------------- */
function pyramid () {
  return component().prop("barHeight", functor).prop("barWidth", functor).prop("barPosition", functor).prop("barFill", functor).barFill("#000").prop("tooltipAnchor").tooltipAnchor([0.5, 0.5]).prop("leftAccessor").prop("rightAccessor").prop("leftRefAccessor").prop("rightRefAccessor").render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // Components
    const leftBar = bar().x(d => -SPINE_PADDING - props.barWidth(d)).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
    const rightBar = bar().x(SPINE_PADDING).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
    const leftLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth).mirror(true);
    const rightLine = lineComponent().barPosition(props.barPosition).barWidth(props.barWidth);
    // Rendering
    selection.selectGroup("left").datum(props.leftAccessor(data)).call(leftBar);
    selection.selectGroup("right").datum(props.rightAccessor(data)).call(rightBar);
    selection.selectGroup("leftReference").datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : []).call(leftLine);
    selection.selectGroup("rightReference").datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : []).call(rightLine);
  });
}
/**
 * Draws one side's reference outline as a single path. The data is one array of points per
 * path, so the datum handed to this component is an array of arrays - in practice always
 * of length one, since each side has at most one reference line.
 */
function lineComponent() {
  return component().prop("barPosition").prop("barWidth").prop("mirror").mirror(false).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const lineGen = line().x(props.barWidth).y(props.barPosition);
    const line$1 = selection.selectAll(".sszvis-pyramid__referenceline").data(data).join("path").attr("class", "sszvis-pyramid__referenceline");
    line$1.attr("transform", props.mirror ? "scale(-1, 1)" : "").transition(defaultTransition()).attr("d", lineGen);
  });
}

export { pyramid as default };
//# sourceMappingURL=pyramid.js.map
