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
 * @param paddingRightLeft number - Padding right and left between the wrapped text and the
 *        'invisible box' of 'width' width. It always narrows the width the text is measured
 *        against, but only reaches the rendered 'x' on untranslated <text>, and only for
 *        text-anchor 'start' (x = padding) and 'end' (x = width - padding); 'middle' is
 *        centred on the full width instead. On a tick label (<text> inside a translated
 *        <g class="tick">) 'x' is derived from the narrowed width alone, as -width/2, 0 or
 *        width/2 by anchor. Defaults to 5 when omitted or when the value is not a finite
 *        number, which logs a warning on each such call; an explicit 0 and a negative
 *        padding are honoured.
 * @param paddingTopBottom number - Padding top and bottom between the wrapped text and the
 *        'invisible box' of 'width' width. Two pixels are subtracted from it to account for
 *        the borders, so the rendered 'y' is padding - 2: the default of 5 yields y="3" and
 *        an explicit 0 yields y="-2". It is used only when the <text> element carries no 'y'
 *        attribute of its own; otherwise that attribute wins and this argument is ignored.
 *        Defaults to 5 when omitted or when the value is not a finite number, which logs a
 *        warning on each such call; an explicit 0 and a negative padding are honoured.
 * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
 */
import type { BaseType, Selection } from "d3";
export default function textWrap<D, P extends BaseType, PD>(selection: Selection<SVGTextElement, D, P, PD>, width: number, paddingRightLeft?: number, paddingTopBottom?: number): number[];
//# sourceMappingURL=textWrap.d.ts.map