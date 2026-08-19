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
 * @param paddingRightLeft integer - Padding right and left between the wrapped text and the 'invisible bax' of 'width' width
 * @param paddingTopBottom integer - Padding top and bottom between the wrapped text and the 'invisible bax' of 'width' width
 * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
 */

import { select } from "d3";
import type { AnySelection } from "../types.js";

export default function textWrap(
  selection: AnySelection,
  width: number,
  paddingRightLeft?: number,
  paddingTopBottom?: number
): number[] {
  const padRightLeft = paddingRightLeft || 5; //Default padding (5px)
  const padTopBottom = (paddingTopBottom || 5) - 2; //Default padding (5px), remove 2 pixels because of the borders
  const maxWidth = width; //I store the tooltip max width
  const innerWidth = width - padRightLeft * 2; //Take the padding into account

  const arrLineCreatedCount: number[] = [];
  selection.each(function (this: SVGTextElement) {
    const text = select(this);
    const words = text
      .text()
      .split(/[\t\n\v\f\r ]+/)
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
    const wrapTickLabels = select(this.parentElement).classed("tick"); //Don't wrap the 'normal untranslated' <text> element and the translated <g class='tick'><text></text></g> elements the same way..
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
