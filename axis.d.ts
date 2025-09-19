/**
 * Axis component
 *
 * This component is an extension of d3.axis and provides the same interface
 * with some custom additions. It provides good defaults for sszvis charts
 * and helps with some commonly used functionality.
 *
 * @module sszvis/axis
 *
 * The following properties are directly delegated to the d3.axis component.
 * They are documented in the d3 documentation.
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 *
 * @property {function} scale         Delegates to d3.axis
 * @property {function} orient        Delegates to d3.axis
 * @property {function} ticks         Delegates to d3.axis
 * @property {function} tickValues    Delegates to d3.axis
 * @property {function} tickSize      Delegates to d3.axis
 * @property {function} innerTickSize Delegates to d3.axis
 * @property {function} outerTickSize Delegates to d3.axis
 * @property {function} tickPadding   Delegates to d3.axis
 * @property {function} tickFormat    Delegates to d3.axis
 *
 * The following properties are custom additions.
 *
 * @property {boolean} alignOuterLabels                 Whether or not to align the outer labels to the axis extent so that they do not fall outside the axis space.
 * @property {boolean} contour                          Specify a 'contour' background for the axis labels.
 * @property {number} hideBorderTickThreshold           Specifies the pixel distance threshold for the visible tick correction. Ticks which are closer than
 *                                                      this threshold to the end of the axis (i.e. a tick which is 1 or two pixels from the end) will be
 *                                                      hidden from view. This prevents the display of a tick very close to the ending line.
 * @property {number} hideLabelThreshold                By default, labels are hidden when they are closer than LABEL_PROXIMITY_THRESHOLD to a highlighted label.
 *                                                      If this value is set to 0 or lower, labels won't be hidden, even if they overlap with the highlighted label.
 * @property {function} highlightTick                   Specifies a predicate function to use to determine whether axis ticks should be highlighted.
 *                                                      Any tick value which returns true for this predicate function will be treated specially as a highlighted tick.
 *                                                      Note that this function does NOT have any effect over which ticks are actually included on the axis. To create special
 *                                                      custom ticks, use tickValues.
 * @property {boolean} showZeroY                        Whether the axis should display a label for at y=0.
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 *                                                      Use "horizontal" to reset to a horizontal slant.
 * @property {number} textWrap                          Specify a width at which to wrap the axis label text.
 * @property {number, function} tickLength              specify a number or a function which returns a number for setting the tick length.
 * @property {string} title                             Specify a string to use as the title of this chart. Default title position depends on the chart orientation
 * @property {string} titleAnchor                       specify the title text-anchor. Values are 'start', 'middle', and 'end'. Corresponds to the 'text-anchor' svg styling attribute
 *                                                      the default depends on the axis orient property
 * @property {boolean} titleCenter                      whether or not to center the axis title along the axis. If true, this sets the title anchor point
 *                                                      as the midpoint between axis extremes. Should usually be used with titleAnchor('middle') to ensure exact title centering. (default: false)
 * @property {number} dxTitle                           specify an amount by which to offset the title towards the left. This offsets away from the default position. (default: 0)
 * @property {number} dyTitle                           specify an amount by which to offset the title towards the top. This offsets away from the default position. (default: 0)
 * @property {boolean} titleVertical                    whether or not to rotate the title 90 degrees so that it appears vertical, reading from bottom to top. (default: false)
 * @property {boolean} vertical                         whether the axis is a vertical axis. When true, this property changes certain display properties of the axis according to the style guide.
 *
 * @return {sszvis.component}
 */
import { type AxisDomain, type AxisScale, type NumberValue } from "d3";
import { type Component } from "./d3-component.js";
type AxisOrientation = "top" | "bottom" | "left" | "right";
type SlantDirection = "horizontal" | "vertical" | "diagonal";
type TextAnchor = "start" | "middle" | "end";
interface AxisComponent extends Component {
    scale(scale?: AxisScale<NumberValue>): AxisComponent;
    orient(orientation?: AxisOrientation): AxisComponent;
    ticks(ticks?: number | number[]): AxisComponent;
    tickValues(values?: AxisDomain[]): AxisComponent;
    tickSize(size?: number): AxisComponent;
    tickSizeInner(size?: number): AxisComponent;
    tickSizeOuter(size?: number): AxisComponent;
    tickPadding(padding?: number): AxisComponent;
    tickFormat(format?: (d: AxisDomain) => string | null): AxisComponent;
    alignOuterLabels(align?: boolean): AxisComponent;
    contour(contour?: boolean): AxisComponent;
    hideBorderTickThreshold(threshold?: number): AxisComponent;
    hideLabelThreshold(threshold?: number): AxisComponent;
    highlightTick(predicate?: (d: AxisDomain) => boolean): AxisComponent;
    showZeroY(show?: boolean): AxisComponent;
    slant(direction?: SlantDirection): AxisComponent;
    textWrap(width?: number): AxisComponent;
    tickLength(length?: number): AxisComponent;
    title(title?: string): AxisComponent;
    titleAnchor(anchor?: TextAnchor): AxisComponent;
    titleCenter(center?: boolean): AxisComponent;
    dxTitle(offset?: number): AxisComponent;
    dyTitle(offset?: number): AxisComponent;
    titleVertical(vertical?: boolean): AxisComponent;
    vertical(vertical?: boolean): AxisComponent;
    yOffset(offset?: number): AxisComponent;
}
export declare const axisX: {
    (): AxisComponent;
    time(): AxisComponent;
    ordinal(): any;
    pyramid(): any;
};
export declare const axisY: {
    (): AxisComponent;
    time(): AxisComponent;
    ordinal(): any;
};
export {};
//# sourceMappingURL=axis.d.ts.map