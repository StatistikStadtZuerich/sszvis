/**
 * Slider control
 *
 * Control for use in filtering. Works very much like an interactive axis.
 * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
 * select values on that scale. Ticks created using an sszvis.axis show the user where
 * data values lie.
 *
 * @module  sszvis/control/slider
 *
 * @property {function} scale                 A scale function which this slider represents. The values in the scale's domain
 *                                            are used as the possible values of the slider.
 * @property {array} minorTicks               An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis
 * @property {array} majorTicks               An array of ticks which become major (larger and labeled) ticks on the slider's axis
 * @property {function} tickLabels            A function to use to format the major tick labels.
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 *                                                      Use "horizontal" to reset to a horizontal slant.
 * @property {number|Date} value             The current value of the slider. Should be set whenever slider interaction causes the state to change.
 *                                            Required: rendering without it throws before any element is created. Values outside the
 *                                            scale's domain are clamped to it.
 * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
 * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
 *                                            Note that this component will not change its own state. The callback function must affect some state change
 *                                            in order for this component's display to be updated.
 *
 * Note: the handle, the track fill, the axis and the interaction layer all work through one copy
 * of the scale whose range is inset by half the handle width at each end, so that the handle stays
 * inside the track and pointing at the pixel where a value's handle is drawn reports that value.
 * That copy is clamped, so a `value` outside the domain pins the handle to the end of the track
 * rather than drawing it past the end. The inset is applied to each end of the configured range in
 * turn, so a descending range keeps its direction.
 *
 * Note: ticks are drawn in track order, not in the order they were configured, so the outermost
 * major labels are anchored inwards whatever order `majorTicks` is given in.
 *
 * Note: the move behaviour's y-scale is given a range but no domain, so the second argument passed
 * to `onchange` is a meaningless fraction and should be ignored.
 *
 * See test/control/slider.test.ts.
 *
 * @returns {sszvis.component}
 */
import { type AxisDomain, type ScaleContinuousNumeric, type ScaleTime } from "d3";
import { type SlantDirection } from "../axis.js";
import { type ComponentBuilder } from "../d3-component.js";
import type { StringAccessor } from "../types.js";
/** The scales a slider can represent: a continuous numeric or time scale. */
export type SliderScale = ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
export type SliderValue = number | Date;
/**
 * Note: `x` is a Date for a time slider - the move behaviour inverts through the slider's
 * own scale. `y` is the meaningless fraction described in the module docs; ignore it.
 * Widening `x` here does not fix the underlying move handler type, which is #222.
 */
export type SliderChangeHandler = (event: Event, x: number | string | Date | null, y: number | string | null) => void;
export interface SliderComponent extends ComponentBuilder<SliderComponent> {
    scale(): SliderScale;
    scale(scale: SliderScale): SliderComponent;
    value(): SliderValue;
    value(value: SliderValue): SliderComponent;
    onchange(): SliderChangeHandler | undefined;
    onchange(handler: SliderChangeHandler): SliderComponent;
    minorTicks(): AxisDomain[];
    minorTicks(ticks: AxisDomain[]): SliderComponent;
    majorTicks(): AxisDomain[];
    majorTicks(ticks: AxisDomain[]): SliderComponent;
    tickLabels(): (d: AxisDomain) => string;
    tickLabels(labels: StringAccessor<AxisDomain>): SliderComponent;
    slant(): SlantDirection | undefined;
    slant(direction: SlantDirection): SliderComponent;
    label(): (d: SliderValue) => string;
    label(label: StringAccessor<SliderValue>): SliderComponent;
}
export default function slider(): SliderComponent;
//# sourceMappingURL=slider.d.ts.map