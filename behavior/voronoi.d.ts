/**
 * Voronoi behavior
 *
 * The voronoi behavior adds an invisible layer of voronoi cells to a chart. The voronoi cells are calculated
 * based on the positions of the data objects which should be bound to the interaction layer before this behavior
 * is called on it. Each voronoi cell is associated with one data object, and this data object is passed to the event
 * callback functions.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The voronoi behavior expects to find an array of data already bound to the interaction layer. Each datum should
 * represent a point, and these points are used as the focal points of the construction of voronoi cells. These data
 * are also associated with the voronoi cells, so that when a user interacts with them, the datum and its index within the
 * bound data are passed to the callback functions. This component extends a d3.dispatch instance.
 *
 * The event handler functions are only called when the event happens within a certain distance
 * (see MAX_INTERACTION_RADIUS_SQUARED in this file) from the voronoi area's center.
 *
 * @module sszvis/behavior/voronoi
 *
 * @property {function} x                         Specify an accessor function for the x-position of the voronoi point
 * @property {function} y                         Specify an accessor function for the y-position of the voronoi point
 * @property {array[array, array]} bounds         Specify the bounds of the voronoi area. This is essential to the construction of voronoi cells
 *                                                using the d3.vornoi geom object. The bounds should determine the chart area over which you would like
 *                                                voronoi cells to be active. Note that if not specified, the voronoi cells will be very large.
 * @property {boolean} debug                      Whether the component is in debug mode. Being in debug mode renders the voroni cells obviously
 * @property {string and function} on             The .on() method should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'over' - when the user interacts with a voronoi area, either with a mouseover or touchstart
 *                                                'out' - when the user ceases to interact with a voronoi area, either with a mouseout or touchend
 *                                                All event handler functions are passed the datum which is the center of the voronoi area.
 *                                                Note: previously, event handlers were also passed the index of the datum within the dataset.
 *                                                However, this is no longer the case, due to the difficulty of inferring that information when hit
 *                                                testing a touch interaction on arbitrary rendered elements in the scene. In addition, the 'out' event
 *                                                used to be passed the datum itself, but this is no longer the case, also having to do with the impossibility
 *                                                of guaranteeing that there is a datum at the position of a touch, while "panning".
 *
 */
import { type Component } from "../d3-component";
export type VoronoiBounds = [number, number, number, number];
type Accessor<T, R> = (datum: T) => R;
type NumberAccessor<T = unknown> = Accessor<T, number>;
type VoronoiEventHandler<T = unknown> = (event: Event, datum?: T) => void;
interface VoronoiComponent<T = unknown> extends Component {
    x(): NumberAccessor<T>;
    x(accessor: NumberAccessor<T>): VoronoiComponent<T>;
    y(): NumberAccessor<T>;
    y(accessor: NumberAccessor<T>): VoronoiComponent<T>;
    bounds(): VoronoiBounds;
    bounds(bounds: VoronoiBounds): VoronoiComponent<T>;
    debug(): boolean;
    debug(value: boolean): VoronoiComponent<T>;
    on(eventName: "over", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
    on(eventName: "out", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
    on(eventName: string): VoronoiEventHandler<T> | undefined;
}
export default function <T = unknown>(): VoronoiComponent<T>;
export {};
//# sourceMappingURL=voronoi.d.ts.map