/**
 * Tooltip annotation
 *
 * Use this component to add a tooltip to the document. The tooltip component should be
 * called on a selection of [data-tooltip-anchor], which contain the information necessary to
 * position the tooltip and provide it with data. The tooltip's visibility should be toggled
 * using the .visible property, passing a predicate function. Tooltips will be displayed
 * when .visible returns true.
 *
 * @module sszvis/annotation/tooltip
 *
 * @template T The type of the data objects used in the tooltip
 * @property {seletion} renderInto      Provide a selection container into which to render the tooltip.
 *                                      Unlike most other components, the tooltip isn't rendered directly into the selection
 *                                      on which it is called. Instead, it's rendered into whichever selection is
 *                                      passed to the renderInto option
 * @property {function} visible         Provide a predicate function which accepts a datum and determines whether the associated
 *                                      tooltip should be visible. (default: false)
 * @property {function} header          A function accepting a datum. The result becomes the header of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 * @property {function} body            A function accepting a datum. The result becomes the body of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 *                                      - an array of arrays, which produces a tabular layout where each
 *                                      sub-array is one row in the table.
 * @property {function} orientation     A string or function returning a string which determines the orientation. This determines
 *                                      which direction the tooltip sits relative to its point.
 *                                      Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right).
 *                                      Default is "bottom".
 * @property {number} dx                A number for the x-offset of the tooltip
 * @property {number} dy                A number for the y-offset of the tooltip
 * @property {function} opacity         A function or number which determines the opacity of the tooltip. Default is 1.
 *
 * @return {sszvis.component}
 *
 */
import { type Component } from "../d3-component";
import type { Accessor, AnySelection, NumberAccessor, StringAccessor } from "../types";
type Datum<T = unknown> = T;
interface TooltipData<T = unknown> {
    datum: Datum<T>;
    x: number;
    y: number;
}
interface TooltipComponent<T = unknown> extends Component {
    renderInto(selection?: AnySelection): TooltipComponent<T>;
    visible(accessor?: Accessor<Datum<T>, boolean>): TooltipComponent<T>;
    header(accessor?: StringAccessor<Datum<T>>): TooltipComponent<T>;
    body(accessor?: StringAccessor<Datum<T>> | ((d: Datum<T>) => string[][])): TooltipComponent<T>;
    orientation(accessor?: StringAccessor<TooltipData<T>>): TooltipComponent<T>;
    dx(accessor?: NumberAccessor<TooltipData<T>>): TooltipComponent<T>;
    dy(accessor?: NumberAccessor<TooltipData<T>>): TooltipComponent<T>;
    opacity(accessor?: NumberAccessor<TooltipData<T>>): TooltipComponent<T>;
}
export default function <T = unknown>(): TooltipComponent<T>;
export {};
//# sourceMappingURL=tooltip.d.ts.map