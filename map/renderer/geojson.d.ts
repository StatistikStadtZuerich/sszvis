/**
 * geojson renderer component
 *
 * @module sszvis/map/renderer/geojson
 *
 * @template T The type of the data values merged onto the geojson features
 *
 * A component used for rendering overlays of geojson above map layers.
 * It can be used to render any arbitrary GeoJson.
 *
 * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
 *                                          with geographic entities. Default 'geoId'.
 * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
 *                                          with data entities. Default 'id'.
 * @property {GeoJson} geoJson              The GeoJson object which should be rendered. It is read unguarded, so a value
 *                                          without a 'features' property throws a TypeError. Rendering mutates it; see
 *                                          the note below on the cached centroid.
 * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
 * @property {Function, Boolean} defined    A predicate used to determine whether a datum has a defined value. Entities
 *                                          that fail it, and entities with no datum at all, display the missing value
 *                                          texture. It is wrapped in fn.functor and defaults to the constant true, so a
 *                                          constant false textures the whole overlay and the default never rejects
 *                                          anything.
 * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
 * @property {String, Function} stroke      The stroke color of the entities. Can be a string or a function returning a
 *                                          string, called with the datum. Default black. Undefined entities are not
 *                                          asked for a stroke at all; see the note below.
 * @property {Number, Function} strokeWidth The thickness of the strokes of the shapes. A number, or a function
 *                                          returning a number - but see the note below: unlike fill and stroke, a
 *                                          strokeWidth accessor is handed the merged { geoJson, datum } wrapper
 *                                          rather than the datum. Default 1.25.
 * @property {Boolean} transitionColor      Whether to schedule a transition on the fill color of the geojson entities.
 *                                          Default true. The transition does not currently animate anything; see the
 *                                          note below.
 *
 * Note: the data are grouped with a reduce that has no initial value, so the first datum becomes
 * the lookup table rather than an entry in it. That datum's feature never receives its data and
 * always renders as missing, the remaining data are written as properties onto the caller's first
 * array element, a single-datum dataset matches nothing at all, and an empty dataset throws.
 *
 * Note: the on("over"|"out"|"click") API has never delivered anything. The listeners call
 * event.over(datum) and friends, but d3's dispatch exposes only on, call, apply and copy, so each
 * listener throws a TypeError before any registered handler runs. Both maps in docs/map-extended
 * register these handlers and receive nothing.
 *
 * Note: a strokeWidth accessor is called with the merged { geoJson, datum } wrapper, not with the
 * datum, unlike the fill and stroke accessors. An accessor written against the datum reads
 * undefined and d3 removes the attribute entirely.
 *
 * Note: the key lookup reads a feature's properties without a guard, so a feature with the
 * spec-legal `properties: null`, or with no properties at all, crashes the merge with a bare
 * TypeError. That also makes the anchor's own `properties || (properties = {})` guard unreachable.
 *
 * Note: lookup keys are stringified, so a missing key on either side becomes the string
 * "undefined" and one keyless datum becomes the datum for every keyless feature. A symbol key stays
 * a symbol and can never be matched by a string id. The lookup table is a plain object, so a
 * feature keyed after an Object.prototype member - "valueOf", say - is handed the inherited
 * function as its datum, which fn.defined accepts and passes to the fill accessor.
 *
 * Note: the mouse listeners are bound layer-wide via the [data-event-target] attribute rather than
 * scoped to this component's own class. An overlay drawn into a group that already holds a base
 * layer rebinds that layer's areas to this component's handlers and merged data.
 *
 * Note: rendering caches a sphericalCentroid onto every feature's properties and never invalidates
 * it, so moving a feature's geometry leaves its anchor behind. Unlike the base renderer it ignores
 * an authored `center` property and caches under a different key, so the two renderers disagree
 * about where the same entity's tooltip belongs.
 *
 * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
 * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
 * attribute or asking for no stroke.
 *
 * Note: this renderer shares four quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the fill transition interpolates a colour onto itself, the
 * slowTransition call is a no-op that leaves d3's 250ms easeCubicInOut defaults in place of the
 * intended 500ms easePolyOut, the stale-class fill repaint is dead, and the data join is an index
 * join with no key function. The missing value pattern is likewise emitted per layer under the
 * fixed id "missing-pattern", so two map layers on one page define that id twice.
 * See test/map/renderer/geojson.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ExtendedFeature, type ExtendedFeatureCollection, type GeoPath } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type GeoJsonValue<T, R> = R | ((datum: T) => R);
/**
 * How a functor-wrapped prop reads back once it is stored: always a function. The parameter is
 * typed as unknown because the data lookup reads through a plain object's prototype chain, so an
 * accessor can be handed something that is not a datum at all.
 */
type StoredGeoJsonValue<R> = (datum: unknown) => R;
/**
 * A feature paired with whatever the data lookup produced for it. `datum` is unknown rather than
 * the caller's datum type because the lookup reads through a plain object's prototype chain.
 */
interface MergedFeature {
    geoJson: ExtendedFeature;
    datum: unknown;
}
/** A handler as this component's own event API delivers it. */
type GeoJsonEventHandler = (datum: unknown) => void;
export interface MapRendererGeoJsonComponent<T = unknown> extends ComponentBuilder<MapRendererGeoJsonComponent<T>> {
    dataKeyName(): string;
    dataKeyName(value: string): MapRendererGeoJsonComponent<T>;
    geoJsonKeyName(): string;
    geoJsonKeyName(value: string): MapRendererGeoJsonComponent<T>;
    geoJson(): ExtendedFeatureCollection;
    geoJson(value: ExtendedFeatureCollection): MapRendererGeoJsonComponent<T>;
    mapPath(): GeoPath;
    mapPath(value: GeoPath): MapRendererGeoJsonComponent<T>;
    defined(): StoredGeoJsonValue<boolean>;
    defined<U = T>(value: GeoJsonValue<U, boolean>): MapRendererGeoJsonComponent<T>;
    fill(): StoredGeoJsonValue<string>;
    fill<U = T>(value: GeoJsonValue<U, string>): MapRendererGeoJsonComponent<T>;
    stroke(): StoredGeoJsonValue<string>;
    stroke<U = T>(value: GeoJsonValue<U, string>): MapRendererGeoJsonComponent<T>;
    /**
     * Note that a strokeWidth accessor is called with the merged { geoJson, datum } wrapper, not
     * with the datum, unlike fill and stroke.
     */
    strokeWidth(): (datum?: MergedFeature) => number;
    strokeWidth<D = MergedFeature>(value: number | ((datum: D) => number)): MapRendererGeoJsonComponent<T>;
    on(eventName: string, handler: GeoJsonEventHandler): MapRendererGeoJsonComponent<T>;
    on(eventName: string): GeoJsonEventHandler | undefined;
    transitionColor(): boolean;
    transitionColor(enabled: boolean): MapRendererGeoJsonComponent<T>;
}
export default function <T extends Record<string, unknown> = Record<string, unknown>>(): MapRendererGeoJsonComponent<T>;
export {};
//# sourceMappingURL=geojson.d.ts.map