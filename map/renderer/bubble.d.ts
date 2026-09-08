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
 *                                                  changes. Default true. An entering circle grows from zero, an
 *                                                  updating one interpolates to its new radius, and a departing one
 *                                                  shrinks to zero before it is removed.
 *
 * Note: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill are all
 * required in practice, and each fails differently when left out.
 *
 * Note: the over, out and click handlers registered through .on() are called with the hovered map
 * entity's datum - undefined for a feature that matched no data. The circles carry
 * pointer-events: none (see below), so these handlers are only reachable by dispatching an event
 * on a circle directly; a real pointer reaches the base layer underneath instead.
 *
 * Note: on() forwards straight to a d3 dispatch, so it inherits its semantics: it returns the
 * component for chaining and the handler when called with a name alone, an unknown event name
 * throws, a namespaced name such as "over.tooltip" is accepted, and null removes a handler.
 *
 * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
 * top of them. Where no handler is registered on this component they are decoration rather than a
 * hit area, so they carry pointer-events: none and let the pointer through to the area beneath -
 * which is what keeps the base layer's handlers, and so choropleth's tooltips, working over the
 * middle of a bubble. Registering over, out or click restores hit testing on the circles, since a
 * consumer who wants those handlers is asking for the bubbles to be the target; the base layer's
 * handlers are then shadowed over each bubble, as they were before this note was written.
 *
 * Note: the circles are sorted by radius descending, so the largest paint first and smaller ones sit
 * on top of them. That is a DOM reordering, so the rendered order does not follow mergedData.
 *
 * Note: the exit selection is handled inside join()'s third argument, since join() removes the
 * departing nodes itself and returns only the merged enter+update selection.
 *
 * Note: the join is keyed on geoJson.id. A feature without one is given an identity of its own,
 * held against the feature object, so a keyless collection keeps its circles across renders too.
 * The identity is the object, not its contents: a caller who rebuilds equivalent feature objects
 * between renders gets fresh circles rather than the previous ones, and should author ids if it
 * needs the circles to persist.
 *
 * Note: the radius accessor is called once per circle for the radius itself and again for each
 * comparison the size sort makes, so it runs several times more often than there are data.
 *
 * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
 * come entirely from the inline styles this component writes - and a consumer cannot restyle them
 * from their own stylesheet, since an inline style beats any author rule short of !important.
 *
 * Note: this renderer shares three quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the --entering modifier is added and removed within the same render, so
 * it is never observable and offers no enter-only styling hook; the anchor positions go through
 * getGeoJsonCenter, which caches a centre onto every feature's properties and never invalidates it,
 * so moving a feature's geometry leaves its bubble behind; and mapPath must be a real d3.geoPath,
 * since the positions read mapPath.projection(). The transition is the intended one:
 * defaultTransition() is passed straight to .transition(t), so its 300ms and easePolyOut survive.
 *
 * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
 * the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */
import type { GeoPath } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
import { type MergedGeoDatum } from "../mapUtils.js";
/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type BubbleValue<T, R> = R | ((datum: T) => R);
/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredBubbleValue<T, R> = (datum?: T) => R;
/**
 * A handler as this component's own event API delivers it: with the hovered entity's datum, which
 * is undefined for a feature that matched no data.
 */
type BubbleEventHandler<T = unknown> = (datum: T | undefined) => void;
export interface MapRendererBubbleComponent<T = unknown> extends ComponentBuilder<MapRendererBubbleComponent<T>> {
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
     * chained; called with an event name alone it returns that handler. A handler is called with
     * the hovered entity's datum, which is undefined for a feature that matched no data.
     */
    on(eventName: string, handler: BubbleEventHandler<T> | null): MapRendererBubbleComponent<T>;
    on(eventName: string): BubbleEventHandler<T> | undefined;
}
export default function mapRendererBubble<T = unknown>(): MapRendererBubbleComponent<T>;
export {};
//# sourceMappingURL=bubble.d.ts.map