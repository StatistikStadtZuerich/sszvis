/**
 * base renderer component
 *
 * @module sszvis/map/renderer/base
 *
 * @template T The type of the data values merged onto the map features
 *
 * A component used internally for rendering the base layer of maps.
 * These map entities have a color fill, which is possibly a pattern that represents
 * missing values. They are also event targets. If your map has nothing else, it should have a
 * base layer.
 *
 * @property {GeoJson} geoJson                        Declared for compatibility but never read: the render takes every
 *                                                    shape from the geoJson property of each merged datum. Setting it
 *                                                    has no effect, and omitting it renders the map in full.
 * @property {d3.geo.path} mapPath                    A path generator used to create the path data string for each merged
 *                                                    shape. It must be a real d3.geoPath with a projection set, since the
 *                                                    tooltip anchors are positioned by calling mapPath.projection(); see
 *                                                    the note below.
 * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
 *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
 *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
 * @property {Boolean, Function} defined              A predicate used to determine whether a datum has a defined value. Map
 *                                                    entities that fail it display the missing value texture, as do entities
 *                                                    that matched no datum at all - the predicate is only consulted for a
 *                                                    datum that exists. It is wrapped in fn.functor and defaults to the
 *                                                    constant true, so a constant false textures the whole map. The
 *                                                    exception is a layer where no entity has a datum; see the note below.
 * @property {String, Function} fill                  A string or function for the fill of the map entities. An accessor is
 *                                                    called with the entity's datum, and is not called at all for an entity
 *                                                    the dataset does not cover - that one is textured instead. On a layer
 *                                                    where no entity has a datum, though, nothing is textured and the
 *                                                    accessor is called with undefined for every entity; see the note below.
 * @property {Boolean} transitionColor                Whether to transition the fill color of the map entities.
 *                                                    (default: true) With it set, the fill is only applied through the
 *                                                    transition, so a color change fades from the previous color; with it
 *                                                    unset the fill is written synchronously. An entering entity has no
 *                                                    previous color, so it takes the final color at the first tick. Only a
 *                                                    color-to-color change is transitioned; an entity entering or leaving
 *                                                    the missing value texture takes its fill synchronously either way,
 *                                                    since a paint-server reference cannot be interpolated.
 *
 * Note: the scheduled transition keeps d3's defaults of 250ms and easeCubicInOut rather than the
 * intended 500ms easePolyOut. `.transition().call(slowTransition)` returns the original
 * transition, while slowTransition ignores its argument and builds a fresh detached transition
 * that is discarded.
 *
 * Note: "missing" only means something relative to a dataset, so a layer where no entity has a
 * datum is taken to be drawing geometry rather than encoding values - it keeps the caller's fill,
 * is not classed --undefined, and calls the fill accessor with undefined for every entity. One
 * matched datum is enough to make it a data layer, and then the entities the dataset does not
 * cover are textured and the accessor is not called for them. A dataset that is supplied but
 * matches nothing is indistinguishable from no dataset here, since this renderer receives only
 * mergedData; such a map renders with the caller's fill rather than an all-textured map.
 *
 * Note: the missing value pattern is written into a defs element inside each map layer, under an id
 * of that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: rendering mutates the geojson it is handed. Anchor positions go through getGeoJsonCenter,
 * which caches a center onto every feature's properties. A malformed `center` property parses to
 * NaN coordinates and the anchor is emitted with a transform of translate(NaN,NaN) rather than
 * being skipped, so a typo in an authored map file silently detaches that entity's tooltip.
 *
 * Note: a mapPath that is a bare path function renders all of the areas and then throws a
 * TypeError from the anchor positions, which read mapPath.projection(). An empty mergedData never
 * reaches that read, so the failure depends on the data.
 *
 * Note: the data join has no key function, so it is an index join. Reordering mergedData repaints
 * the existing nodes in place instead of moving them. The --entering class is added and removed
 * within the same chain, so it is never observable from outside a render and offers no enter-only
 * styling hook. See test/map/renderer/base.test.ts.
 *
 * @return {sszvis.component}
 */
import type { ExtendedFeatureCollection, GeoPath } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
import { type MergedGeoDatum } from "../mapUtils.js";
/**
 * A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. The
 * accessor parameter includes undefined because MergedGeoDatum.datum is optional, so an accessor
 * written for the wrapper's datum slot type-checks. The render calls these accessors only for a
 * feature whose datum exists, except on a layer where no feature has one - there fill is called
 * with undefined throughout, since the layer is drawing geometry rather than encoding values.
 */
type MapValue<T, R> = R | ((datum: T | undefined) => R);
/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredMapValue<T, R> = (datum?: T) => R;
export interface MapRendererBaseComponent<T = unknown> extends ComponentBuilder<MapRendererBaseComponent<T>> {
    mergedData(): MergedGeoDatum<T>[];
    mergedData(data: MergedGeoDatum<T>[]): MapRendererBaseComponent<T>;
    /** @deprecated Declared and documented, but the render only ever reads mergedData. */
    geoJson(): ExtendedFeatureCollection | undefined;
    /** @deprecated Declared and documented, but the render only ever reads mergedData. */
    geoJson(value: ExtendedFeatureCollection): MapRendererBaseComponent<T>;
    mapPath(): GeoPath;
    mapPath(value: GeoPath): MapRendererBaseComponent<T>;
    defined(): StoredMapValue<T, boolean>;
    defined<U = T>(value: MapValue<U, boolean>): MapRendererBaseComponent<T>;
    fill(): StoredMapValue<T, string>;
    fill<U = T>(value: MapValue<U, string>): MapRendererBaseComponent<T>;
    transitionColor(): boolean;
    transitionColor(enabled: boolean): MapRendererBaseComponent<T>;
}
export default function <T = unknown>(): MapRendererBaseComponent<T>;
export {};
//# sourceMappingURL=base.d.ts.map