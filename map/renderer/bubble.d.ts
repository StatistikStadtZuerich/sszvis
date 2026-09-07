/**
 * bubble renderer component
 *
 * @module sszvis/map/renderer/bubble
 *
 * @template T The type of the data values merged onto the map features
 *
 * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
 * You will usually want to pass this component, configured, as the .anchoredShape property of a base
 * map component.
 *
 * @property {Array<Object>} mergedData             An array of merged data objects, each with a datum property (the datum
 *                                                  for the map entity) and a geoJson property (its shape). Produced by
 *                                                  the base map component which renders this. Required and unvalidated:
 *                                                  omitting it reaches d3's keyed join as undefined, which throws. Every
 *                                                  feature is present, including those with no matching datum, whose
 *                                                  datum is undefined.
 * @property {d3.geo.path} mapPath                  A path generator supplying the projection, passed in by the base map
 *                                                  component which renders this. Required: omitting it throws, and it
 *                                                  must be a real d3.geoPath with a projection set, since the anchor
 *                                                  positions call mapPath.projection(); see the note below.
 * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
 *                                                  It has no default and is called unguarded, so omitting it throws -
 *                                                  and so does an accessor that reads through a datum without checking,
 *                                                  since a feature with no data is still given a circle.
 * @property {String, Function} fill                The fill color of the circles. Can be a function. No default, and
 *                                                  called unguarded, so omitting it throws too.
 * @property {String, Function} strokeColor         The stroke color of the circles. Can be a function. Default #ffffff.
 * @property {Number, Function} strokeWidth         The stroke width of the circles. Can be a function. Default 1.
 *                                                  Documented nowhere else: docs/map-signature/README.md omits it.
 * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data
 *                                                  changes. Default true - but it never actually animates a radius, and
 *                                                  never affects a departing circle; see the notes below.
 *
 * Note: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill are all
 * required in practice, and each fails differently when left out.
 *
 * Note: the over, out and click handlers registered through .on() are called with undefined rather
 * than with the map entity's datum. The listeners are written for d3 v3, where a listener received
 * the datum first; since d3 v6 it receives the event first, so what they read as `d.datum` is a
 * property of a PointerEvent. The dispatch itself works, unlike the geojson renderer's, so a
 * handler does fire - it just learns nothing about which entity was hovered.
 *
 * Note: on() forwards straight to a d3 dispatch, so it inherits its semantics: it returns the
 * component for chaining and the handler when called with a name alone, an unknown event name
 * throws, a namespaced name such as "over.tooltip" is accepted, and null removes a handler.
 *
 * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
 * top - and they carry neither a data-event-target attribute nor a pointer-events override. As
 * choropleth binds its own handlers to [data-event-target] after calling the anchored shape, the
 * circles are never bound, so a pointer over a bubble reaches neither the base layer's handler nor,
 * usefully, the bubble's own.
 *
 * Note: the circles are sorted by radius descending, so the largest paint first and smaller ones sit
 * on top of them. That is a DOM reordering, so the rendered order does not follow mergedData.
 *
 * Note: the exit selection is read off the merged selection that join() returned, where it does not
 * exist - so both exit branches are dead code, the shrink-to-zero transition and the plain remove
 * alike. join() has already removed the departing circles synchronously, so a bubble leaving the
 * data disappears instantly rather than shrinking away, whatever `transition` says.
 *
 * Note: the join is keyed on geoJson.id, which GeoJSON does not require. Features that have one keep
 * their circles across a data change; features without one all key to "undefined", so on every
 * re-render the first node matches and every node past it is exited and replaced by a fresh enter
 * node - the count stays right, but all but one circle is destroyed and recreated each time, losing
 * any transition in flight.
 *
 * Note: the radius accessor is called for every circle twice over - once for the attribute and once
 * for the transition - and again for each comparison the size sort makes, so it runs several times
 * more often than there are data.
 *
 * Note: the class is written with attr rather than classed, so it is replaced wholesale on every
 * render and any class a consumer added to a circle is destroyed.
 *
 * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
 * come entirely from the inline styles this component writes - and a consumer cannot restyle them
 * from their own stylesheet, since an inline style beats any author rule short of !important.
 *
 * Note: this renderer shares four quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the radius transition interpolates a value onto itself, so nothing
 * animates on enter or on update; the --entering modifier is added and removed within the same
 * render, so it is never observable and offers no enter-only styling hook; the anchor positions go
 * through getGeoJsonCenter, which caches a centre onto every feature's properties and never
 * invalidates it, so moving a feature's geometry leaves its bubble behind; and mapPath must be a
 * real d3.geoPath, since the positions read mapPath.projection(). Unlike base, though, the
 * transition itself is the intended one - defaultTransition() is passed as `t` to .transition(t)
 * rather than through the no-op `.transition().call(slowTransition)` pattern - so its 300ms and
 * easePolyOut survive.
 *
 * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
 * the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */
import type { GeoPath } from "d3";
import { type Component } from "../../d3-component.js";
import { type MergedGeoDatum } from "../mapUtils.js";
/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type BubbleValue<T, R> = R | ((datum: T) => R);
/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredBubbleValue<T, R> = (datum?: T) => R;
/** A handler as this component's own event API delivers it - which is to say, with undefined. */
type BubbleEventHandler = (datum: undefined) => void;
export interface MapRendererBubbleComponent<T = unknown> extends Component {
    mergedData(): MergedGeoDatum<T>[] | undefined;
    mergedData(value: MergedGeoDatum<T>[]): MapRendererBubbleComponent<T>;
    mapPath(): GeoPath | undefined;
    mapPath(value: GeoPath): MapRendererBubbleComponent<T>;
    radius(): StoredBubbleValue<T, number> | undefined;
    radius<U = T>(value: BubbleValue<U, number>): MapRendererBubbleComponent<T>;
    fill(): StoredBubbleValue<T, string> | undefined;
    fill<U = T>(value: BubbleValue<U, string>): MapRendererBubbleComponent<T>;
    strokeColor(): StoredBubbleValue<T, string>;
    strokeColor<U = T>(value: BubbleValue<U, string>): MapRendererBubbleComponent<T>;
    strokeWidth(): StoredBubbleValue<T, number>;
    strokeWidth<U = T>(value: BubbleValue<U, number>): MapRendererBubbleComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): MapRendererBubbleComponent<T>;
    /**
     * Registers a handler for "over", "out" or "click", returning the component so it can be
     * chained; called with an event name alone it returns that handler. Note that a handler is
     * called with undefined rather than with the hovered entity's datum; see the module note.
     */
    on(eventName: string, handler: BubbleEventHandler | null): MapRendererBubbleComponent<T>;
    on(eventName: string): BubbleEventHandler | undefined;
}
export default function <T = unknown>(): MapRendererBubbleComponent<T>;
export {};
//# sourceMappingURL=bubble.d.ts.map