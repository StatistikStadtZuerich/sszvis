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

import { select } from "d3";

import * as fn from "../fn.js";
import translateString from "../svgUtils/translateString.js";
import { component } from "../d3-component.js";

export default function () {
  return component()
    .prop("position")
    .position(fn.functor([0, 0]))
    .prop("debug")
    .render(function (data) {
      var selection = select(this);
      var props = selection.props();

      var anchor = selection.selectAll("[data-tooltip-anchor]").data(data);

      // Enter

      var newAnchor = anchor
        .enter()
        .append("rect")
        .attr("height", 1)
        .attr("width", 1)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("visibility", "none")
        .attr("data-tooltip-anchor", "");

      // Exit

      anchor.exit().remove();
      anchor = anchor.merge(newAnchor);

      // Update

      anchor.attr("transform", fn.compose(vectorToTranslateString, props.position));

      // Visible anchor if debug is true
      if (props.debug) {
        var referencePoint = selection.selectAll("[data-tooltip-anchor-debug]").data(data);

        var newReferencePoint = referencePoint
          .enter()
          .append("circle")
          .attr("data-tooltip-anchor-debug", "");

        referencePoint.exit().remove();
        referencePoint = referencePoint.merge(newReferencePoint);

        referencePoint
          .attr("r", 2)
          .attr("fill", "#fff")
          .attr("stroke", "#f00")
          .attr("stroke-width", 1.5)
          .attr("transform", fn.compose(vectorToTranslateString, props.position));
      }
    });

  /* Helper functions
  ----------------------------------------------- */
  function vectorToTranslateString(vec) {
    return translateString.apply(null, vec);
  }
}
