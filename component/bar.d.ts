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
 * @property {boolean} transition             Whether or not to transition the visual values of the bar component, when they
 *                                            are changed.
 *
 * Note: the transition property does not currently animate anything - the geometry is
 * re-applied to the plain selection immediately after the transition is created, so the
 * values always jump. It is not free either: the discarded transition still attaches d3
 * transition state to every bar, which interrupts any transition already running on them.
 * See test/component/bar.test.ts.
 *
 * @return {sszvis.component}
 */
import { type Component } from "../d3-component.js";
/**
 * Every visual property is wrapped by fn.functor on set, so it is always stored as a
 * function by the time the renderer reads it. The result stays `unknown` because the
 * missing-value guard passes anything that coerces to a number straight through, a numeric
 * string or a boolean included.
 */
type ValueAccessor<T> = (datum?: T, index?: number) => unknown;
/**
 * fill and stroke resolve to a colour, or to nothing when the property was never set -
 * fn.functor then yields undefined, which d3 treats exactly like null and removes the
 * attribute for.
 */
type ColorAccessor<T> = (datum?: T, index?: number) => string | null;
/**
 * A constant or an accessor over the component's datum type; either is accepted, since
 * fn.functor normalises both. d3 hands an accessor the datum and its index, and declaring
 * fewer parameters is fine.
 */
type BarValue<T, R> = R | ((datum: T, index: number) => R);
export interface BarComponent<T = unknown> extends Component {
    x(): ValueAccessor<T>;
    x<U = T>(value: BarValue<U, number>): BarComponent<T>;
    y(): ValueAccessor<T>;
    y<U = T>(value: BarValue<U, number>): BarComponent<T>;
    width(): ValueAccessor<T>;
    width<U = T>(value: BarValue<U, number>): BarComponent<T>;
    height(): ValueAccessor<T>;
    height<U = T>(value: BarValue<U, number>): BarComponent<T>;
    fill(): ColorAccessor<T>;
    fill<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
    stroke(): ColorAccessor<T>;
    stroke<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
    centerTooltip(): boolean | undefined;
    centerTooltip(center: boolean): BarComponent<T>;
    tooltipAnchor(): (number | string)[] | undefined;
    tooltipAnchor(anchor: (number | string)[]): BarComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): BarComponent<T>;
}
export default function <T = unknown>(): BarComponent<T>;
export {};
//# sourceMappingURL=bar.d.ts.map