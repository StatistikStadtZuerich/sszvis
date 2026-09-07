import { select } from 'd3';
import { isString, isSelection } from './fn.js';

/**
 * A collection of utilities to measure elements
 *
 * @module sszvis/measure
 */
/**
 * measureDimensions
 *
 * Calculates the width of the first DOM element defined by a CSS selector string,
 * a DOM element reference, or a d3 selection. If the DOM element can't be
 * measured `undefined` is returned for the width. Returns also measurements of
 * the screen, which are used by some responsive components.
 *
 * @param  {string|Element|d3.selection} arg The element to measure
 *
 * @return {DimensionMeasurement} The measurement of the width of the element, plus dimensions of the screen
 *                  The returned object contains:
 *                      width: {number|undefined} The width of the element
 *                      screenWidth: {number} The innerWidth of the screen
 *                      screenHeight: {number} The innerHeight of the screen
 */
const measureDimensions = arg => {
  const node = measurableNode(arg);
  return {
    width: node ? node.getBoundingClientRect().width : undefined,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  };
};
/**
 * The element a MeasurableElement refers to, or null when there is nothing to measure.
 *
 * Takes `unknown` rather than the generic parameter type: the three cases are told apart at
 * runtime, and callers do pass null - the width is reported as undefined for it, which
 * test/measure.test.ts pins.
 */
function measurableNode(arg) {
  if (isString(arg)) return select(arg).node();
  if (isSelection(arg)) {
    // A selection's node may be any BaseType, but only an Element can be measured.
    const selected = arg.node();
    return selected instanceof Element ? selected : null;
  }
  return arg instanceof Element ? arg : null;
}
/**
 * measureText
 *
 * Calculates the width of a string given a font size and a font face. It might
 * be more convenient to use a preset based on this function that has the font
 * size and family already set.
 *
 * @param {number} fontSize The font size in pixels
 * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const helloWidth = sszvis.measureText(14, "Arial, sans-serif")("Hello!")
 **/
const measureText = (() => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("[measureText] Could not acquire a 2d canvas context");
  const cache = {};
  return (fontSize, fontFace, text) => {
    const key = [fontSize, fontFace, text].join("-");
    context.font = "".concat(fontSize, "px ").concat(fontFace);
    return cache[key] || context.measureText(text).width;
  };
})();
/**
 * measureAxisLabel
 *
 * A preset to measure the widths of axis labels.
 *
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const labelWidth = sszvis.measureAxisLabel("Hello!")
 */
const measureAxisLabel = text => measureText(10, "Arial, sans-serif", text);
/**
 * measureLegendLabel
 *
 * A preset to measure the widths of legend labels.
 *
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const labelWidth = sszvis.measureLegendLabel("Hello!")
 */
const measureLegendLabel = text => measureText(12, "Arial, sans-serif", text);

export { measureAxisLabel, measureDimensions, measureLegendLabel, measureText };
//# sourceMappingURL=measure.js.map
