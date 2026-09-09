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
 * @property {function} position Accessor (datum, index) returning the tooltip's
 *                               [x, y] coordinates. The index is d3's element
 *                               index; accessors may take the datum alone.
 * @property {boolean}  debug    Renders a visible tooltip anchor when true
 *
 * @return {sszvis.component}
 */

import { select } from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import translateString from "../svgUtils/translateString.js";

// Type definitions for tooltip anchor annotation component
type Datum<T = unknown> = T;

interface TooltipAnchorProps<T = unknown> {
  position: (d: Datum<T>, i: number) => [number, number];
  debug?: boolean;
}

interface TooltipAnchorComponent<T = unknown> extends ComponentBuilder<TooltipAnchorComponent<T>> {
  position(accessor?: (d: Datum<T>, i: number) => [number, number]): TooltipAnchorComponent<T>;
  debug(value?: boolean): TooltipAnchorComponent<T>;
}

/* Helper functions
  ----------------------------------------------- */
function vectorToTranslateString(vec: [number, number]): string {
  return translateString.apply(null, vec);
}

export default function tooltipAnchor<T = unknown>(): TooltipAnchorComponent<T> {
  return component<TooltipAnchorComponent<T>>()
    .prop("position")
    .position(fn.functor([0, 0]))
    .prop("debug")
    .render(function (this: Element, data: Datum<T>[]) {
      const selection = select<Element, Datum<T>>(this);
      const props = selection.props<TooltipAnchorProps<T>>();

      const anchor = selection
        .selectAll("[data-tooltip-anchor]")
        .data(data)
        .join("rect")
        .attr("height", 1)
        .attr("width", 1)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("data-tooltip-anchor", "");

      // Update

      anchor.attr("transform", fn.compose(vectorToTranslateString, props.position));

      // Visible anchor if debug is true
      if (props.debug) {
        const referencePoint = selection
          .selectAll("[data-tooltip-anchor-debug]")
          .data(data)
          .join("circle")
          .attr("data-tooltip-anchor-debug", "");

        referencePoint
          .attr("r", 2)
          .attr("fill", "#fff")
          .attr("stroke", "#f00")
          .attr("stroke-width", 1.5)
          .attr("transform", fn.compose(vectorToTranslateString, props.position));
      }
    });
}
