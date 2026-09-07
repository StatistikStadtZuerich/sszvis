import { geoCentroid, geoMercator, geoPath } from 'd3';
import { memoize } from '../fn.js';

/**
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */
const STADT_KREISE_KEY = "zurichStadtKreise";
const STATISTISCHE_QUARTIERE_KEY = "zurichStatistischeQuartiere";
const STATISTISCHE_ZONEN_KEY = "zurichStatistischeZonen";
const WAHL_KREISE_KEY = "zurichWahlKreise";
const AGGLOMERATION_2012_KEY = "zurichAgglomeration2012";
const SWITZERLAND_KEY = "switzerland";
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
const swissMapProjection = memoize((width, height, featureCollection,
// Part of the signature only so that the memoize resolver below can read it.
_featureBoundsCacheKey) => geoMercator().fitSize([width, height], featureCollection),
// Memoize resolver
(width, height, _, featureBoundsCacheKey) => "".concat(width, ",").concat(height, ",").concat(featureBoundsCacheKey));
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
function swissMapPath(width, height, featureCollection, featureBoundsCacheKey) {
  return geoPath().projection(swissMapProjection(width, height, featureCollection, featureBoundsCacheKey));
}
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
function pixelsFromGeoDistance(projection, centerPoint, meterDistance) {
  // This radius (in meters) is halfway between the radius of the earth at the equator (6378200m) and that at its poles (6356750m).
  // I figure it's an appropriate approximation for Switzerland, which is at roughly 45deg latitude.
  const APPROX_EARTH_RADIUS = 6367475;
  const APPROX_EARTH_CIRCUMFERENCE = Math.PI * 2 * APPROX_EARTH_RADIUS;
  // Compute the size of the angle made by the meter distance
  const degrees = meterDistance / APPROX_EARTH_CIRCUMFERENCE * 360;
  // Construct a square, centered at centerPoint, with sides that span that number of degrees
  const halfDegrees = degrees / 2;
  const bounds = [[centerPoint[0] - halfDegrees, centerPoint[1] - halfDegrees], [centerPoint[0] + halfDegrees, centerPoint[1] + halfDegrees]];
  // Project those bounds to pixel coordinates using the provided map projection.
  // The projection is wrapped rather than passed to map() point-free, so it is called with the
  // point alone and never with map()'s index and array arguments.
  const [lowerBound, upperBound] = bounds.map(point => projection(point));
  if (lowerBound == null || upperBound == null) {
    throw new TypeError("pixelsFromGeoDistance: the projection clipped away the bounds of the measured square");
  }
  // Depending on the rotation of the map, the sides of the box are not always positive quantities
  // For example, on a north-is-up map, the pixel y-scale is inverted, so higher latitude degree
  // values are lower pixel y-values. On a south-is-up map, the opposite is true.
  const projXDist = Math.abs(upperBound[0] - lowerBound[0]);
  const projYDist = Math.abs(upperBound[1] - lowerBound[1]);
  return (projXDist + projYDist) / 2;
}
const GEO_KEY_DEFAULT = "geoId";
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
function prepareMergedGeoData(dataset, geoJson, keyName) {
  // Any falsy key name, the empty string included, falls back to the default.
  const key = keyName || GEO_KEY_DEFAULT;
  // group the input data by map entity id
  const groupedInputData = Array.isArray(dataset) ? dataset.reduce((m, v) => {
    m[toLookupKey(Reflect.get(v, key))] = v;
    return m;
  }, {}) : {};
  // merge the map features and the input data into new objects that include both
  return geoJson.features.map(feature => ({
    geoJson: feature,
    datum: groupedInputData[toLookupKey(feature.id)]
  }));
}
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
function toLookupKey(value) {
  return typeof value === "symbol" ? value : String(value);
}
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
function getGeoJsonCenter(geoJson) {
  const properties = geoJson.properties;
  if (properties == null) {
    throw new TypeError("getGeoJsonCenter: the feature has no properties object to cache onto");
  }
  if (!properties.cachedCenter) {
    const setCenter = properties.center;
    properties.cachedCenter = setCenter ? setCenter.split(",").map(Number.parseFloat) : geoCentroid(geoJson);
  }
  return properties.cachedCenter;
}
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
function widthAdaptiveMapPathStroke(width) {
  return Math.min(Math.max(0.8, width / 400), 1.1);
}
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
function isPaintServer(fill) {
  var _fill$startsWith;
  return (_fill$startsWith = fill === null || fill === void 0 ? void 0 : fill.startsWith("url(")) !== null && _fill$startsWith !== void 0 ? _fill$startsWith : false;
}
/** Where a layer records the pattern id it was given, so re-renders reuse it. */
const MISSING_PATTERN_ID_ATTR = "data-sszvis-missing-pattern-id";
let missingPatternCount = 0;
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
function missingPatternId(selection) {
  const assigned = selection.attr(MISSING_PATTERN_ID_ATTR);
  if (assigned) return assigned;
  const id = "missing-pattern-".concat(++missingPatternCount);
  selection.attr(MISSING_PATTERN_ID_ATTR, id);
  return id;
}

export { AGGLOMERATION_2012_KEY, GEO_KEY_DEFAULT, STADT_KREISE_KEY, STATISTISCHE_QUARTIERE_KEY, STATISTISCHE_ZONEN_KEY, SWITZERLAND_KEY, WAHL_KREISE_KEY, getGeoJsonCenter, isPaintServer, missingPatternId, pixelsFromGeoDistance, prepareMergedGeoData, swissMapPath, swissMapProjection, toLookupKey, widthAdaptiveMapPathStroke };
//# sourceMappingURL=mapUtils.js.map
