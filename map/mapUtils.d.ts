/**
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */
import { type ExtendedFeature, type ExtendedFeatureCollection, type ExtendedGeometryCollection, type GeoGeometryObjects, type GeoPath, type GeoProjection } from "d3";
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
/**
 * swissMapProjection
 *
 * A function for creating d3 projection functions, customized for the dimensions of the map you need.
 * Because this projection generator involves calculating the boundary of the features that will be
 * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
 *
 * Note: the cache key is width, height and featureBoundsCacheKey only. Reusing a key for a
 * different feature collection returns the projection fitted to the first collection, which places
 * the second collection outside the destination box.
 *
 * Note: featureBoundsCacheKey is optional, and every call that omits it shares the single key
 * "<width>,<height>,undefined". Two different maps rendered at the same size collide silently.
 *
 * Note: the memo cache is a module-level Map with no eviction, so one entry is retained per
 * distinct width/height/key triple for the lifetime of the page - a chart that reprojects on resize
 * accumulates an entry per resize tick. Clearing swissMapProjection.cache is the only way to
 * release them.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {Number} width                           The width of the projection destination space.
 * @param  {Number} height                          The height of the projection destination space.
 * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
 * @param  {String} [featureBoundsCacheKey]         The cache key for the expensive bounds calculation.
 *                                                  Must identify the feature collection: the collection
 *                                                  itself is not part of the key.
 * @return {Function}                               The projection function.
 */
export declare const swissMapProjection: ((width: number, height: number, featureCollection: MapGeoObject, _featureBoundsCacheKey?: string) => GeoProjection) & {
    cache: Map<unknown, GeoProjection>;
};
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
 * Note: matching goes through a plain object literal, so ids are stringified - a numeric data key
 * matches a string feature id - and a feature whose id names an Object.prototype member
 * ("constructor", "toString", ...) is handed the inherited property as its datum even though no
 * such datum was supplied.
 *
 * Note: a datum keyed "__proto__" replaces the lookup object's prototype instead of creating an
 * entry. That datum still reads back correctly, but every unmatched feature afterwards is handed a
 * field of it rather than undefined. Do not feed untrusted ids to this function.
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
 * Normalises a lookup key exactly as a property access does: a symbol stays a symbol key, so two
 * symbols with the same description remain distinct and can never be matched by a string or numeric
 * feature id. Everything else stringifies, which is how a missing key becomes the string
 * "undefined". Shared in substance with the geojson and highlight renderers' own lookups.
 */
/**
 * The key a feature id or datum value is looked up under. Symbols pass through; everything
 * else is stringified, so numeric and string ids that print the same collide deliberately.
 */
export declare function toLookupKey(value: unknown): string | symbol;
/** The properties these utilities read from and write back to a map feature. */
export interface MapFeatureProperties {
    /** An authored centre, as the string "longitude,latitude". */
    center?: string;
    /** Where the computed centre is memoized, on the feature itself. */
    cachedCenter?: number[];
    [key: string]: unknown;
}
/** A map feature whose properties this module is allowed to read and cache onto. */
export type MapFeature = ExtendedFeature<GeoGeometryObjects | null, MapFeatureProperties | null>;
/**
 * getGeoJsonCenter
 *
 * Gets the geographic centroid of a geojson feature object. Caches the result of the calculation
 * on the object as an optimization (note that this is a coordinate position and is independent
 * of the map projection). If the geoJson object's properties contain a 'center' property, that
 * is expected to be a string of the form "longitude,latitude" which will be parsed into a [lon, lat]
 * pair expected by d3's projection functions. These strings can be added to the properties array
 * using the topojson command line tool's -e option (see the Makefile rule for the zurich statistical
 * quarters map for an example of this use).
 *
 * Note: the cache is written onto the feature's own properties object, so this function mutates its
 * argument, and the cache is never invalidated - changing `center` after the first call has no
 * effect for the lifetime of the feature object.
 *
 * Note: the `center` string is split on "," and mapped through parseFloat with no validation. A
 * value that does not parse becomes NaN coordinates, and a wrong number of components becomes a
 * wrongly sized array; both reach the projection silently.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {Object} geoJson                 The geoJson object for which you want the center.
 * @return {number[]}                       The geographical coordinates (in the form [lon, lat]) of the centroid
 *                                          (or user-specified center) of the object. Typed as number[] rather
 *                                          than a [lon, lat] tuple because a malformed `center` property is
 *                                          parsed without validation and can yield a shorter or longer array.
 * @throws {TypeError}                      If the feature's properties are null, which is spec-legal GeoJSON
 *                                          but has never been supported here, since the cache is written to
 *                                          the properties object.
 */
export declare function getGeoJsonCenter(geoJson: MapFeature): number[];
/**
 * widthAdaptiveMapPathStroke
 *
 * A little "magic" function for automatically calculating map stroke sizes based on
 * the width of the container they're in. Used for responsive designs.
 *
 * Note: the clamp does not rescue NaN - Math.max(0.8, NaN) is NaN - so an unmeasured container
 * width produces a NaN stroke width that reaches the DOM.
 *
 * See test/map/mapUtils.test.ts.
 *
 * @param  {number} width    The width of the container holding the map.
 * @return {number}          The stroke width that the map elements should have, clamped to [0.8, 1.1].
 */
export declare function widthAdaptiveMapPathStroke(width: number): number;
//# sourceMappingURL=mapUtils.d.ts.map