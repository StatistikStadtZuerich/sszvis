/**
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */
import { type BaseType, type ExtendedFeature, type ExtendedFeatureCollection, type ExtendedGeometryCollection, type GeoGeometryObjects, type GeoPath, type GeoProjection, type Selection } from "d3";
export declare const STADT_KREISE_KEY = "zurichStadtKreise";
export declare const STATISTISCHE_QUARTIERE_KEY = "zurichStatistischeQuartiere";
export declare const STATISTISCHE_ZONEN_KEY = "zurichStatistischeZonen";
export declare const WAHL_KREISE_KEY = "zurichWahlKreise";
export declare const AGGLOMERATION_2012_KEY = "zurichAgglomeration2012";
export declare const SWITZERLAND_KEY = "switzerland";
/** The id of one of the maps shipped with sszvis. */
export type MapId = typeof STADT_KREISE_KEY | typeof STATISTISCHE_QUARTIERE_KEY | typeof STATISTISCHE_ZONEN_KEY | typeof WAHL_KREISE_KEY | typeof AGGLOMERATION_2012_KEY | typeof SWITZERLAND_KEY;
/**
 * Anything d3-geo is able to measure the bounds of, and therefore anything these utilities can
 * fit a projection to.
 */
export type MapGeoObject = ExtendedFeature | ExtendedFeatureCollection | ExtendedGeometryCollection | GeoGeometryObjects;
/** A geographical coordinate pair, in the [longitude, latitude] order d3 projections expect. */
export type GeoPoint = [number, number];
/**
 * A projection as these utilities consume it: called with a [lon, lat] pair, returning pixel
 * coordinates, or null where the point is clipped away.
 */
export type PointProjection = (point: GeoPoint) => [number, number] | null;
export declare function swissMapProjection(width: number, height: number, featureCollection: MapGeoObject, featureBoundsCacheKey?: string): GeoProjection;
export declare namespace swissMapProjection {
    var cache: Map<unknown, GeoProjection>;
}
/**
 * This is a special d3.geoPath generator function tailored for rendering maps of
 * Switzerland. The values are chosen specifically to optimize path generation for
 * Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
 *
 * Note: the projection is the memoized one from swissMapProjection, shared with every other caller
 * holding the same width, height and cache key, along with that function's cache-key collision
 * behaviour. The path generator itself is new on every call.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {number} width                     The width of the available map space
 * @param  {number} height                    The height of the available map space
 * @param  {GeoJson} featureCollection        The collection of features to be displayed in the map space
 * @param  {string} [featureBoundsCacheKey]   A string key to use to cache the result of the bounds calculation, which is expensive.
 *                                            This key should be the same every time the same featureCollection object
 *                                            is passed to this function. If the featureCollection is different, use a different
 *                                            cache key. If provided, this can enable large performance improvements in map rendering.
 * @return {d3.geoPath}                       A path generator function. This function takes a geojson datum as argument
 *                                            and returns an svg path string which represents that geojson, projected using
 *                                            a map projection optimal for Swiss areas.
 */
export declare function swissMapPath(width: number, height: number, featureCollection: MapGeoObject, featureBoundsCacheKey?: string): GeoPath;
/**
 * Use this function to calcualate the length in pixels of a distance in meters across the surface of the earth
 * The earth's radius is not constant, so this function uses an approximation for calculating the degree angle of
 * a distance in meters.
 *
 * Note: the x and y spans of the projected square are averaged, so an anisotropic projection yields
 * the mean of the two axes rather than either one.
 *
 * Note: both spans are taken as absolute values, so a negative meterDistance returns the same
 * positive size as its positive counterpart rather than raising.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param {function} projection     You need to provide a projection function for calculating pixel values from decimal degree
 *                                  coordinates. This function should accept values as [lon, lat] array pairs (like d3's projection functions).
 * @param {array} centerPoint       You need to provide a center point. This point is used as the center of a hypothetical square
 *                                  with side lengths equal to the meter distance to be measured. The center point is required
 *                                  because the pixel size of a given degree distance will be different if that square is located
 *                                  at the equator or at one of the poles. This value should be specified as a [lon, lat] array pair.
 * @param {number} meterDistance    The distance (in meters) for which you want the pixel value
 * @throws {TypeError}              If the projection clips away either corner of the measured square.
 */
export declare function pixelsFromGeoDistance(projection: PointProjection, centerPoint: GeoPoint, meterDistance: number): number;
export declare const GEO_KEY_DEFAULT = "geoId";
/** A feature paired with the datum that was matched to it, or undefined if nothing matched. */
export interface MergedGeoDatum<Datum> {
    geoJson: ExtendedFeature;
    datum: Datum | undefined;
}
/**
 * prepareMergedData
 *
 * Merges a dataset with a geojson object by matching elements in the dataset to elements in the geojson.
 * it expects a keyname to be given, which is the key in each data object which has the id of the geojson
 * element to which that data object should be matched. Expects an array of data objects, and a geojson object
 * which has a features array. Each feature is mapped to one data object, or to undefined where no
 * data object matched.
 *
 * Note: matching goes through a Map keyed by the stringified id, so a numeric data key still
 * matches a string feature id, but only data that was actually passed in can ever be matched -
 * ids such as "constructor" or "__proto__" are ordinary keys here.
 *
 * Note: a datum whose key property is missing is not filed under any entry, and a feature with no
 * id is not looked up, so the two never meet under a shared "undefined" key.
 *
 * Note: a symbol data key stays a symbol property, so it can never be matched by a feature id,
 * which GeoJSON allows only as a string or a number. Two symbols with the same description stay
 * distinct for the same reason.
 *
 * Note: several data sharing a key are not reported; the last one wins.
 *
 * Note: a falsy keyName, the empty string included, falls back to GEO_KEY_DEFAULT rather than being
 * used as given.
 *
 * Note: dataset is guarded but geoJson is not, so a missing map throws where missing data returns
 * an entry per feature with no datum.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {Array} [dataset]         The array of input data to match. Anything that is not an array is
 *                                   treated as no data at all.
 * @param  {Object} geoJson          The geojson object. This function will attempt to match each geojson feature to a data object
 * @param  {String} keyName          The name of the property on each data object which will be matched with each geojson id.
 * @return {Array}                   An array of objects (one for each element of the geojson's features). Each should have a
 *                                   geoJson property which is the feature, and a datum property which is the matched datum.
 */
export declare function prepareMergedGeoData<Datum extends object>(dataset: readonly Datum[] | null | undefined, geoJson: ExtendedFeatureCollection, keyName?: string): MergedGeoDatum<Datum>[];
/**
 * The key a feature id or datum value is looked up under. Symbols pass through; everything
 * else is stringified, so numeric and string ids that print the same collide deliberately.
 */
export declare function toLookupKey(value: unknown): string | symbol;
/** The properties these utilities read from a map feature. */
export interface MapFeatureProperties {
    /** An authored centre, as the string "longitude,latitude". */
    center?: string;
    [key: string]: unknown;
}
/** A map feature whose properties this module reads. */
export type MapFeature = ExtendedFeature<GeoGeometryObjects | null, MapFeatureProperties | null>;
/**
 * getGeoJsonCenter
 *
 * Gets the geographic centroid of a geojson feature object (note that this is a coordinate
 * position and is independent of the map projection). If the geoJson object's properties contain
 * a 'center' property, that is expected to be a string of the form "longitude,latitude" which will
 * be parsed into a [lon, lat] pair expected by d3's projection functions. These strings can be
 * added to the properties array using the topojson command line tool's -e option (see the Makefile
 * rule for the zurich statistical quarters map for an example of this use).
 *
 * The centre is computed on every call and nothing is written back to the feature, so a feature
 * whose geometry or `center` changes between renders gets an anchor that follows it. This
 * deliberately replaced a cache kept on the caller's own `properties.cachedCenter`, which nothing
 * invalidated. geoCentroid over the largest map shipped here (432 features) measures around 35% of
 * the cost of the path generation the same render already does - and that map re-renders only on
 * resize, while the maps that re-render per pointer move are an order of magnitude smaller.
 *
 * Note: a `center` that is not exactly two finite numbers is reported with logger.warn and ignored
 * in favour of the computed centroid, so a typo in the topojson -e output is visible rather than
 * silently placing marks at NaN. A warning rather than a throw: the value is authored map data that
 * the rest of the feature can still render without. Since the value is re-read on every call, a
 * malformed one now warns once per call rather than once per feature.
 *
 * Note: `properties: null` is spec-legal GeoJSON and is accepted - there is no longer anywhere the
 * centre needs to be stored, so such a feature falls straight through to the computed centroid.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {Object} geoJson                 The geoJson object for which you want the center.
 * @return {GeoPoint}                       The geographical coordinates (in the form [lon, lat]) of the centroid
 *                                          (or user-specified center) of the object.
 */
export declare function getGeoJsonCenter(geoJson: MapFeature): GeoPoint;
/**
 * widthAdaptiveMapPathStroke
 *
 * A little "magic" function for automatically calculating map stroke sizes based on
 * the width of the container they're in. Used for responsive designs.
 *
 * Note: a width that is not a finite number - an unmeasured container - yields the 0.8 minimum
 * rather than NaN, so the result is always within the documented range.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {number} width    The width of the container holding the map.
 * @return {number}          The stroke width that the map elements should have, clamped to [0.8, 1.1].
 */
export declare function widthAdaptiveMapPathStroke(width: number): number;
/**
 * Whether a fill value references a paint server rather than naming a color. An absent attribute
 * counts as neither: an entering element has no previous fill, and d3's rgb interpolator treats an
 * unparseable start as a constant, so it still reaches its color on the first tick.
 *
 * The map renderers use this to keep a paint-server reference out of a color tween. d3 has no
 * interpolator for one, so it falls back to interpolating the numbers embedded in the two strings:
 * the "-1" of "url(#missing-pattern-1)" pairs with a color's channels and the tween spends its run
 * pointing at patterns that do not exist, which paint nothing.
 *
 * See test/map/mapUtils.test.ts.
 */
export declare function isPaintServer(fill: string | null): boolean;
/**
 * The id of this layer's missing-value pattern, assigning one the first time the layer is
 * rendered.
 *
 * Ids are document-global while the pattern definition lives inside each layer's own group, so a
 * fixed id would have two map layers on one page define it twice and every url(#...) reference in
 * the document resolve to whichever definition came first. The assigned id is cached on the layer
 * element rather than counted per render, so re-rendering a layer keeps its own definition.
 *
 * The selection parameters are generic because d3's Selection is invariant in its element
 * parameters - no single non-generic type accepts every selection.
 *
 * See test/map/mapUtils.test.ts.
 */
export declare function missingPatternId<G extends BaseType, D, P extends BaseType, PD>(selection: Selection<G, D, P, PD>): string;
//# sourceMappingURL=mapUtils.d.ts.map