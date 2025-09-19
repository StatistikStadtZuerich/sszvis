import { select } from 'd3';
import { component } from '../d3-component.js';
import { functor } from '../fn.js';
import { dataAreaPattern } from '../patterns.js';
import ensureDefsElement from '../svgUtils/ensureDefsElement.js';

/**
 * Rectangle annotation
 *
 * A component for creating rectangular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/rectangle
 *
 * @template T The type of the data objects used in the rectangle annotations
 * @param {number, function} x        The x-position of the upper left corner of the data area.
 * @param {number, function} y        The y-position of the upper left corner of the data area.
 * @param {number, function} width    The width of the data area.
 * @param {number, function} height   The height of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area.
 *
 * @returns {sszvis.component} a rectangular data area component
 */
function rectangle () {
  return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("dx", functor).prop("dy", functor).prop("caption", functor).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
    dataAreaPattern(patternSelection);
    const dataArea = selection.selectAll(".sszvis-dataarearectangle").data(data).join("rect").classed("sszvis-dataarearectangle", true);
    dataArea.attr("x", d => Number(props.x(d))).attr("y", d => Number(props.y(d))).attr("width", d => Number(props.width(d))).attr("height", d => Number(props.height(d))).attr("fill", "url(#data-area-pattern)");
    if (props.caption) {
      const dataCaptions = selection.selectAll(".sszvis-dataarearectangle__caption").data(data).join("text").classed("sszvis-dataarearectangle__caption", true);
      dataCaptions.attr("x", d => Number(props.x(d)) + Number(props.width(d)) / 2).attr("y", d => Number(props.y(d)) + Number(props.height(d)) / 2).attr("dx", props.dx ? d => {
        var _props$dx;
        return Number((_props$dx = props.dx) === null || _props$dx === void 0 ? void 0 : _props$dx.call(props, d));
      } : null).attr("dy", props.dy ? d => {
        var _props$dy;
        return Number((_props$dy = props.dy) === null || _props$dy === void 0 ? void 0 : _props$dy.call(props, d));
      } : null).text(d => {
        var _props$caption;
        return ((_props$caption = props.caption) === null || _props$caption === void 0 ? void 0 : _props$caption.call(props, d)) || "";
      });
    }
  });
}

export { rectangle as default };
//# sourceMappingURL=rectangle.js.map
