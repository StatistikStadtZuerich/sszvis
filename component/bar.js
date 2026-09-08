import { select } from 'd3';
import tooltipAnchor from '../annotation/tooltipAnchor.js';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { toFinite } from '../svgUtils/toFinite.js';
import { defaultTransition, OWN_TRANSITION } from '../transition.js';

/**
 * Bar component
 *
 * The bar component is a general-purpose component used to render rectangles, including
 * bars for horizontal and vertical standard and stacked bar charts, bars in the population
 * pyramids, and the boxes of the heat table.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single rectangle. The x-position, y-position, width, and height of each rectangle
 * are then extracted from the data objects using accessor functions.
 *
 * In addition, the user can specify fill and stroke accessor functions. When called, these functions
 * are given each rectangle's data object, and should return a valid fill or stroke color to be applied
 * to the rectangle.
 *
 * The x, y, width, height, fill, and stroke properties may also be specified as constants.
 *
 * @module sszvis/component/bar
 *
 * @template T The type of the data values bound to the bars
 *
 * @property {number, function} x             the x-value of the rectangles. Becomes a functor.
 * @property {number, function} y             the y-value of the rectangles. Becomes a functor.
 * @property {number, function} width         the width-value of the rectangles. Becomes a functor.
 * @property {number, function} height        the height-value of the rectangles. Becomes a functor.
 * @property {string, function} fill          the fill-value of the rectangles. Becomes a functor.
 * @property {string, function} stroke        the stroke-value of the rectangles. Becomes a functor.
 * @property {boolean} centerTooltip          Whether or not to center the tooltip anchor within the bar.
 *                                            The default tooltip anchor position is at the top of the bar,
 *                                            centered in the width dimension. When this property is true,
 *                                            the tooltip anchor will also be centered in the height dimension.
 * @property {Array<Number>} tooltipAnchor    Where, relative to the box formed by the bar, to position the tooltip
 *                                            anchor. This property is overriden if centerTooltip is true. The
 *                                            value should be a two-element array, [x, y], where x is the position (in 0 - 1)
 *                                            of the tooltip in the width dimension, and y is the position (also range 0 - 1)
 *                                            in the height dimension. For example, the upper left corner would be [0, 0],
 *                                            the center of the bar would be [0.5, 0.5], the middle of the right side
 *                                            would be [1, 0.5], and the lower right corner [1, 1]. Used by, for example,
 *                                            the pyramid chart. Entries beyond the first two are ignored, and an array
 *                                            with fewer than two entries produces a NaN coordinate rather than a warning.
 * @property {boolean} transition             Whether or not to transition the geometry of the bar component when it
 *                                            changes. Defaults to true, and eases over 300ms.
 *
 * Note: entering bars receive their geometry on the join, before the transition starts, so they
 * appear in place rather than animating up from nothing. Only updates animate. fill and stroke are
 * deliberately not transitioned - a colour change jumps - because the colour scales these charts
 * use are categorical and interpolating between two category colours reads as a third category.
 *
 * Note: the geometry accessors are guarded: x, y, width and height must be finite numbers, so NaN,
 * Infinity, undefined, null and anything that does not coerce to a finite number all become 0. A
 * value that does coerce is normalised to its number, so a numeric string is written as a number.
 * See test/component/bar.test.ts.
 *
 * @return {sszvis.component}
 */
function bar() {
  return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("fill", functor).prop("stroke", functor).prop("centerTooltip").prop("tooltipAnchor").prop("transition").transition(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const xAt = (datum, index) => toFinite(props.x(datum, index));
    const yAt = (datum, index) => toFinite(props.y(datum, index));
    const wAt = (datum, index) => toFinite(props.width(datum, index));
    const hAt = (datum, index) => toFinite(props.height(datum, index));
    const fillAt = (datum, index) => {
      var _props$fill, _props$fill2;
      return (_props$fill = (_props$fill2 = props.fill) === null || _props$fill2 === void 0 ? void 0 : _props$fill2.call(props, datum, index)) !== null && _props$fill !== void 0 ? _props$fill : null;
    };
    const strokeAt = (datum, index) => {
      var _props$stroke, _props$stroke2;
      return (_props$stroke = (_props$stroke2 = props.stroke) === null || _props$stroke2 === void 0 ? void 0 : _props$stroke2.call(props, datum, index)) !== null && _props$stroke !== void 0 ? _props$stroke : null;
    };
    // Entering bars are given their geometry on the join, so they are in place before any
    // transition starts. The geometry is then applied exactly once more - to the transition
    // when there is one, and to the plain selection otherwise - so an update tweens from its
    // previous value instead of from the value it already holds.
    //
    // Matching on the component's own class rather than the generic .sszvis-bar one keeps a
    // foreign rect out of the join - groupedBars draws rects under the generic class, and the
    // join has no key function, so an unscoped descendant selector would adopt one of those,
    // or one left over from an earlier chart, as bar zero and shift the whole series by one.
    // The generic class stays on the node, so no CSS selector changes meaning.
    const bars = selection.selectAll("rect.sszvis-bar-rect").data(data).join(enter => enter.append("rect").attr("class", "sszvis-bar sszvis-bar-rect").attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt)).attr("fill", fillAt).attr("stroke", strokeAt);
    if (props.transition) {
      bars.transition(defaultTransition(OWN_TRANSITION)).attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt);
    } else {
      // A transition scheduled by an earlier render would keep ticking and overwrite the
      // geometry written here, so `transition(false)` is only deterministic once any
      // in-flight tween is interrupted. This matters on a resize or an event that lands
      // mid-animation. groupedBars and pie both do this.
      //
      // Only the interrupt is needed here, because every geometry attribute is recomputed
      // from the data, which makes this write authoritative once the stale tween is
      // stopped; see pie.ts for the attrTween case, which additionally has to resume from
      // the in-flight value. The transition branch needs nothing: d3 replaces a transition
      // of the same name on the same element, so scheduling supersedes the previous one.
      //
      // Interrupted by name, so a transition the consumer scheduled on these rects - which
      // is unnamed, as a bare selection.transition() is - keeps running. Only the geometry
      // this component owns is stopped.
      bars.interrupt(OWN_TRANSITION).attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt);
    }
    // Tooltip anchors
    let tooltipPosition;
    if (props.centerTooltip) {
      tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i) + hAt(d, i) / 2];
    } else if (props.tooltipAnchor) {
      const uv = props.tooltipAnchor.map(value => Number.parseFloat(String(value)));
      tooltipPosition = (d, i) => [xAt(d, i) + uv[0] * wAt(d, i), yAt(d, i) + uv[1] * hAt(d, i)];
    } else {
      tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i)];
    }
    const ta = tooltipAnchor().position(tooltipPosition);
    selection.call(ta);
  });
}

export { bar as default };
//# sourceMappingURL=bar.js.map
