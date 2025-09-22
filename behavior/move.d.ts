/**
 * Move behavior
 *
 * The move behavior is used to add a mouseover and touchmove-based interface to a chart.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The move behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
 * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
 * functions. This component extends a d3.dispatch instance.
 *
 * @module sszvis/behavior/move
 *
 * @property {boolean} debug                      Whether or not to render the component in debug mode, which reveals its position in the chart.
 * @property {function} xScale                    The x-scale for the component. The extent of this scale, plus component padding, is the width of the
 *                                                component's active area.
 * @property {function} yScale                    The y-scale for the component. The extent of this scale, plus component padding, is the height of the
 *                                                component's active area.
 * @property {boolean} draggable                  Whether or not this component is draggable. This changes certain display properties of the component.
 * @property {object} padding                     An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
 *                                                The options are { top, right, bottom, left }
 * @property {boolean|function} cancelScrolling   A predicate function, or a constant boolean, that determines whether the browser's default scrolling
 *                                                behavior in response to a touch event should be canceled. In area charts and line charts, for example,
 *                                                you generally don't want to cancel scrolling, as this creates a scroll trap. However, in bar charts
 *                                                which use this behavior, you want to pass a predicate function here which will determine whether the touch
 *                                                event falls within the "profile" of the bar chart, and should therefore cancel scrolling and trigger an event.
 * @property {boolean} fireOnPanOnly              In response to touch events, whether to fire events only while "panning", that is only while performing
 *                                                a touch move where the default scrolling behavior is canceled, and not otherwise. In area and line charts, this
 *                                                should be false, since you want to fire events all the time, even while scrolling. In bar charts, we want to
 *                                                limit the firing of events (and therefore, the showing of tooltips) to only cases where the touch event has its
 *                                                default scrolling prevented, and the user is therefore "panning" across bars. So this should be true for bar charts.
 * @property {string and function} on             The .on() method of this component should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'start' - when the move action starts - mouseover or touchstart
 *                                                'move' - called when a 'moving' action happens - mouseover on the element
 *                                                'drag' - called when a 'dragging' action happens - mouseover with the mouse click down, or touchmove
 *                                                'end' - called when the event ends - mouseout or touchend
 *                                                Event handler functions, excepting end, are passed an x-value and a y-value, which are the data values,
 *                                                computed by inverting the provided xScale and yScale, which correspond to the screen pixel location of the event.
 *
 * @return {sszvis.component}
 */
import { type ScaleBand, type ScaleLinear, type ScalePoint } from "d3";
import { type Component } from "../d3-component";
type MoveScale<T = number | string> = ScaleLinear<number, number> | ScaleBand<T extends string ? T : string> | ScalePoint<T extends string ? T : string>;
type Padding = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
type Domain = number | string;
type EventHandler = (event: Event, x: number | string | null, y: number | string | null) => void;
export interface MoveComponent<XDomain = Domain, YDomain = Domain> extends Component {
    debug(): boolean;
    debug(value: boolean): MoveComponent<XDomain, YDomain>;
    xScale(): MoveScale<XDomain>;
    xScale(scale: MoveScale<XDomain>): MoveComponent<XDomain, YDomain>;
    yScale(): MoveScale<YDomain>;
    yScale(scale: MoveScale<YDomain>): MoveComponent<XDomain, YDomain>;
    draggable(): boolean;
    draggable(value: boolean): MoveComponent<XDomain, YDomain>;
    padding(): Padding;
    padding(value: Partial<Padding>): MoveComponent<XDomain, YDomain>;
    cancelScrolling(): (x?: XDomain | null, y?: YDomain | null) => boolean;
    cancelScrolling(predicate: boolean | ((x: XDomain | null, y: YDomain | null) => boolean)): MoveComponent<XDomain, YDomain>;
    fireOnPanOnly(): () => boolean;
    fireOnPanOnly(predicate: boolean | (() => boolean)): MoveComponent<XDomain, YDomain>;
    on(eventName: "start", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "move", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "drag", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "end", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: string): EventHandler | undefined;
}
export default function <XDomain = number | string, YDomain = number | string>(): MoveComponent<XDomain, YDomain>;
export {};
//# sourceMappingURL=move.d.ts.map