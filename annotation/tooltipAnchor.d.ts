/**
 * Tooltip anchor annotation
 *
 * Tooltip anchors are invisible SVG <rect>s that each component needs to
 * provide. Because they are real elements we can know their exact position
 * on the page without any calculations and even if the parent element has
 * been transformed. These elements need to be <rect>s because some browsers
 * don't calculate positon information for the better suited <g> elements.
 *
 * Tooltips can be bound to by selecting for the tooltip data attribute.
 *
 * @module sszvis/annotation/tooltipAnchor
 * @template T The type of the data objects used with the tooltip anchor
 *
 * @example
 * var tooltip = sszvis.tooltip();
 * bars.selectAll('[data-tooltip-anchor]').call(tooltip);
 *
 * Tooltips use HTML5 data attributes to clarify their intent, which is not
 * to style an element but to provide an anchor that can be selected using
 * Javascript.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
 *
 * To add a tooltip anchor to an element, create a new tooltip anchor function
 * and call it on a selection. This is usually the same selection that you have
 * added the visible elements of your chart to, e.g. the selection that you
 * render bar <rect>s into.
 *
 * @example
 * var tooltipAnchor = sszvis.tooltipAnchor()
 *   .position(function(d) {
 *     return [xScale(d), yScale(d)];
 *   });
 * selection.call(tooltipAnchor);
 *
 * @property {function} position A vector of the tooltip's [x, y] coordinates
 * @property {boolean}  debug    Renders a visible tooltip anchor when true
 *
 * @return {sszvis.component}
 */
import { type Component } from "../d3-component";
type Datum<T = unknown> = T;
interface TooltipAnchorComponent<T = unknown> extends Component {
    position(accessor?: (d: Datum<T>) => [number, number]): TooltipAnchorComponent<T>;
    debug(value?: boolean): TooltipAnchorComponent<T>;
}
export default function <T = unknown>(): TooltipAnchorComponent<T>;
export {};
//# sourceMappingURL=tooltipAnchor.d.ts.map