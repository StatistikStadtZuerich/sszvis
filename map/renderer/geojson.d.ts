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
 *                                          the note below on the cached centre.
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
 *                                          returning a number, called with the datum as the fill and stroke
 *                                          accessors are. Default 1.25. Undefined entities are not asked for a
 *                                          stroke width; they carry no stroke-width attribute.
 * @property {Boolean} transitionColor      Whether to transition the fill color of the geojson entities. Default true.
 *                                          With it set the fill is only applied through the transition, so a color change
 *                                          fades from the previous color; with it unset the fill is written synchronously.
 *                                          An entering entity has no previous color, so it takes the final color at the
 *                                          first tick. Only a color-to-color change is transitioned; an entity entering or
 *                                          leaving the missing value texture takes its fill synchronously either way,
 *                                          since a paint-server reference cannot be interpolated.
 *
 * Note: lookup keys are stringified, so a numeric and a string id that print the same collide. A
 * symbol key stays a symbol and can never be matched by a string id. A feature or datum with no
 * key at all is left unmatched.
 *
 * Note: anchor positions go through getGeoJsonCenter, the same source the base renderer uses, so an
 * authored `center` property is honoured here too and a feature drawn by both renderers anchors in
 * one place. That centre is cached as `cachedCenter` on the feature's properties and never
 * invalidated, so moving a feature's geometry leaves its anchor behind.
 *
 * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
 * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
 * attribute or asking for no stroke.
 *
 * Note: the missing value pattern is written into a defs element inside each layer, under an id of
 * that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: one quirk remains, shared with the base renderer. The data join has no key function, so it
 * is an index join: reordering the features repaints the existing nodes in place instead of moving
 * them.
 *
 * See test/map/renderer/geojson.test.ts.
 *
 * @return {sszvis.component}
 */
import { type ExtendedFeatureCollection, type GeoPath } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type GeoJsonValue<T, R> = R | ((datum: T) => R);
/**
 * How a functor-wrapped prop reads back once it is stored: always a function. The parameter is
 * typed as unknown because the data lookup is keyed at runtime and cannot promise the caller's
 * datum type.
 */
type StoredGeoJsonValue<R> = (datum: unknown) => R;
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
    strokeWidth(): StoredGeoJsonValue<number>;
    strokeWidth<U = T>(value: GeoJsonValue<U, number>): MapRendererGeoJsonComponent<T>;
    on(eventName: string, handler: GeoJsonEventHandler): MapRendererGeoJsonComponent<T>;
    on(eventName: string): GeoJsonEventHandler | undefined;
    transitionColor(): boolean;
    transitionColor(enabled: boolean): MapRendererGeoJsonComponent<T>;
}
export default function mapRendererGeoJson<T extends Record<string, unknown> = Record<string, unknown>>(): MapRendererGeoJsonComponent<T>;
export {};
//# sourceMappingURL=geojson.d.ts.map