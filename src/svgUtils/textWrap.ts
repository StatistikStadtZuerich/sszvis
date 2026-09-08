/**
 * Text wrap
 *
 * Function allowing to 'wrap' the text from an SVG <text> element with <tspan>.
 *
 * @module sszvis/svgUtils/textWrap
 *
 * Based on https://github.com/mbostock/d3/issues/1642
 * @example svg.append("g")
 *      .attr("class", "x axis")
 *      .attr("transform", "translate(0," + height + ")")
 *      .call(xAxis)
 *      .selectAll(".tick text")
 *          .call(d3TextWrap, x.rangeBand());
 *
 * @param selection d3 selection for one or more <text> object
 * @param width number - global width in which the text will be word-wrapped.
 * @param paddingRightLeft integer - Padding right and left between the wrapped text and the
 *        'invisible box' of 'width' width. It always narrows the width the text is measured
 *        against, but only reaches the rendered 'x' on untranslated <text>, and only for
 *        text-anchor 'start' (x = padding) and 'end' (x = width - padding); 'middle' is
 *        centred on the full width instead. On a tick label (<text> inside a translated
 *        <g class="tick">) 'x' is derived from the narrowed width alone, as -width/2, 0 or
 *        width/2 by anchor. Defaults to 5 when omitted or when the value is not a finite
 *        number, which logs a warning; an explicit 0 and a negative padding are honoured.
 * @param paddingTopBottom integer - Padding top and bottom between the wrapped text and the
 *        'invisible box' of 'width' width. Two pixels are subtracted from it to account for
 *        the borders, so the rendered 'y' is padding - 2: the default of 5 yields y="3" and
 *        an explicit 0 yields y="-2". It is used only when the <text> element carries no 'y'
 *        attribute of its own; otherwise that attribute wins and this argument is ignored.
 *        Defaults to 5 when omitted or when the value is not a finite number, which logs a
 *        warning; an explicit 0 and a negative padding are honoured.
 * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
 */

import type { BaseType, Selection } from "d3";
import { select } from "d3";

const DEFAULT_PADDING = 5;

/**
 * Reads a padding argument, falling back to the default unless it is a usable number.
 *
 * Both padding arguments get the same guard: either can be computed upstream, and either
 * poisons the render when it is not finite - a non-finite paddingRightLeft makes the
 * available width non-finite, which compares every measured line against NaN and disables
 * wrapping entirely, and both are written straight into an `x`/`y` attribute, where "NaN"
 * or "Infinity" is invalid SVG. `Number.isFinite` does not coerce, so an explicit 0 and a
 * negative padding are honoured, while undefined, NaN, +/-Infinity and the ""/false that
 * only untyped JS callers can pass all take the default - matching what these inputs did
 * before an explicit 0 became meaningful. A supplied-but-unusable padding is a caller bug
 * that used to render silently, so it warns rather than throws: wrapping still produces a
 * readable label, and throwing would take down a chart that previously drew fine.
 */
function resolvePadding(padding: number | undefined, name: string): number {
  if (padding === undefined) return DEFAULT_PADDING;
  if (Number.isFinite(padding)) return padding;
  console.warn(`sszvis.svgUtils.textWrap: ignoring a non-finite ${name}, using ${DEFAULT_PADDING}`);
  return DEFAULT_PADDING;
}

export default function textWrap<D, P extends BaseType, PD>(
  // Wrapping reads and rewrites the <text> nodes themselves, so the element parameter is
  // fixed; the rest stay generic so any text selection can be passed.
  selection: Selection<SVGTextElement, D, P, PD>,
  width: number,
  paddingRightLeft?: number,
  paddingTopBottom?: number
): number[] {
  const padRightLeft = resolvePadding(paddingRightLeft, "paddingRightLeft");
  //Remove 2 pixels because of the borders
  const padTopBottom = resolvePadding(paddingTopBottom, "paddingTopBottom") - 2;
  const maxWidth = width; //I store the tooltip max width
  const innerWidth = width - padRightLeft * 2; //Take the padding into account

  const arrLineCreatedCount: number[] = [];
  selection.each(function (this: SVGTextElement) {
    const text = select(this);
    const words = text
      .text()
      .split(/[\t\n\v\f\r ]+/)
      // Splitting text with leading or trailing whitespace yields empty tokens, which
      // would be rejoined as spaces and padded into the rendered line and its measured
      // width. Only these tokens are dropped; the words themselves are untouched.
      .filter((word) => word !== "")
      .reverse(); //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1; //Em
    let createdLineCount = 1; //Total line created count
    const textAlign = text.style("text-anchor") || "start"; //'start' by default (start, middle, end, inherit)

    //Clean the data in case <text> does not define those values
    const parsedDy = Number.parseFloat(text.attr("dy") ?? "");
    const dy = Number.isNaN(parsedDy) ? 0 : parsedDy; //Default padding (0em) : the 'dy' attribute on the first <tspan> _must_ be identical to the 'dy' specified on the <text> element, or start at '0em' if undefined

    //Offset the text position based on the text-anchor
    // Don't wrap the 'normal untranslated' <text> element and the translated
    // <g class='tick'><text></text></g> elements the same way. A detached <text> has no
    // parent to read the class off, and cannot be a tick label, so answer false.
    const wrapTickLabels = this.parentElement ? select(this.parentElement).classed("tick") : false;
    // An unrecognised text-anchor yields undefined, which d3 treats as "remove the
    // attribute" - the same outcome as the original switch statements' empty default case.
    const xByAnchor: Record<string, number> = wrapTickLabels
      ? { start: -innerWidth / 2, middle: 0, end: innerWidth / 2 }
      : {
          //untranslated <text> elements
          start: padRightLeft,
          middle: maxWidth / 2,
          end: maxWidth - padRightLeft,
        };
    const x = xByAnchor[textAlign];

    const yAttr = text.attr("y");
    const y = +(yAttr === null ? padTopBottom : yAttr);

    let tspan = text
      .text(null)
      .append<SVGTSpanElement>("tspan")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", `${dy}em`);

    while (words.length > 0) {
      const word = words.pop() ?? ""; // the loop guard guarantees a value
      line.push(word);
      tspan.text(line.join(" "));
      const tspanNode = tspan.node();
      if (tspanNode && tspanNode.getComputedTextLength() > innerWidth && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append<SVGTSpanElement>("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", `${++lineNumber * lineHeight + dy}em`)
          .text(word);
        ++createdLineCount;
      }
    }

    arrLineCreatedCount.push(createdLineCount); //Store the line count in the array
  });
  return arrLineCreatedCount;
}
