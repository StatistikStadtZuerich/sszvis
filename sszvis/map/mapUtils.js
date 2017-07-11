/*
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */

import {geoMercator, geoPath, geoCentroid} from 'd3';

export var constants = {
  STADT_KREISE_KEY: 'zurichStadtKreise',
  STATISTISCHE_QUARTIERE_KEY: 'zurichStatistischeQuartiere',
  STATISTISCHE_ZONEN_KEY: 'zurichStatistischeZonen',
  WAHL_KREISE_KEY: 'zurichWahlKreise',
  AGGLOMERATION_2012_KEY: 'zurichAgglomeration2012',
  SWITZERLAND_KEY: 'switzerland'
};

// This is for caching feature bounds calculations, which are pretty expensive.
// Given the current architecture, you need to pass a featureBoundsCacheKey in order to
// enable using cached values. If the featureCollection passed to this function changes,
// a different featureBoundsCacheKey must be used.
var featureBoundsCache = {};

/**
 * swissMapProjection
 *
 * A function for creating d3 projection functions, customized for the dimensions of the map you need.
 * Because this projection generator involves calculating the boundary of the features that will be
 * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
 * You don't need to worry about this - mostly it's the map module components which use this function.
 *
 * @param  {Number} width                           The width of the projection destination space.
 * @param  {Number} height                          The height of the projection destination space.
 * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
 * @param  {String} featureBoundsCacheKey           Used internally, this is a key for the cache for the expensive part of this computation.
 * @return {Function}                               The projection function.
 */
export var swissMapProjection = function(width, height, featureCollection, featureBoundsCacheKey) {
  var mercatorProjection = geoMercator()
    // .rotate([-7.439583333333333, -46.95240555555556]); // This rotation was, I think, part of the offset problem

  var bounds;

  if (featureBoundsCacheKey && featureBoundsCache[featureBoundsCacheKey]) {
    // Use cached bounds calculation
    bounds = featureBoundsCache[featureBoundsCacheKey];
  } else {
    // Calculate bounds
    mercatorProjection
      .scale(1)
      .translate([0, 0]);

    var boundsGenerator = geoPath()
      .projection(mercatorProjection);

    bounds = boundsGenerator.bounds(featureCollection);

    // Cache for later
    if (featureBoundsCacheKey) {
      featureBoundsCache[featureBoundsCacheKey] = bounds;
    }
  }

  // calculate the scale and translation values from the bounds, width, and height
  var scale = 1 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height),
      translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

  mercatorProjection
    .scale(scale)
    .translate(translation);

  return mercatorProjection;
};

/**
 * This is a special d3.geoPath generator function tailored for rendering maps of
 * Switzerland. The values are chosen specifically to optimize path generation for
 * Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
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
export var swissMapPath = function(width, height, featureCollection, featureBoundsCacheKey) {
  var mercatorPath = geoPath()
    .projection(swissMapProjection(width, height, featureCollection, featureBoundsCacheKey));

  return mercatorPath;
};

/**
 * Use this function to calcualate the length in pixels of a distance in meters across the surface of the earth
 * The earth's radius is not constant, so this function uses an approximation for calculating the degree angle of
 * a distance in meters.
 *
 * @param {function} projection     You need to provide a projection function for calculating pixel values from decimal degree
 *                                  coordinates. This function should accept values as [lon, lat] array pairs (like d3's projection functions).
 * @param {array} centerPoint       You need to provide a center point. This point is used as the center of a hypothetical square
 *                                  with side lengths equal to the meter distance to be measured. The center point is required
 *                                  because the pixel size of a given degree distance will be different if that square is located
 *                                  at the equator or at one of the poles. This value should be specified as a [lon, lat] array pair.
 * @param {number} meterDistance    The distance (in meters) for which you want the pixel value
 */
export var pixelsFromDistance = function(projection, centerPoint, meterDistance) {
  // This radius (in meters) is halfway between the radius of the earth at the equator (6378200m) and that at its poles (6356750m).
  // I figure it's an appropriate approximation for Switzerland, which is at roughly 45deg latitude.
  var APPROX_EARTH_RADIUS = 6367475;
  var APPROX_EARTH_CIRCUMFERENCE = Math.PI * 2 * APPROX_EARTH_RADIUS;
  // Compute the size of the angle made by the meter distance
  var degrees = meterDistance / APPROX_EARTH_CIRCUMFERENCE * 360;
  // Construct a square, centered at centerPoint, with sides that span that number of degrees
  var halfDegrees = degrees / 2;
  var bounds = [[centerPoint[0] - halfDegrees, centerPoint[1] - halfDegrees], [centerPoint[0] + halfDegrees, centerPoint[1] + halfDegrees]];

  // Project those bounds to pixel coordinates using the provided map projection
  var projBounds = bounds.map(projection);
  // Depending on the rotation of the map, the sides of the box are not always positive quantities
  // For example, on a north-is-up map, the pixel y-scale is inverted, so higher latitude degree
  // values are lower pixel y-values. On a south-is-up map, the opposite is true.
  var projXDist = Math.abs(projBounds[1][0] - projBounds[0][0]);
  var projYDist = Math.abs(projBounds[1][1] - projBounds[0][1]);
  var averageSideSize = (projXDist + projYDist) / 2;

  return averageSideSize;
};

export var GEO_KEY_DEFAULT = 'geoId';

/**
 * prepareMergedData
 *
 * Merges a dataset with a geojson object by matching elements in the dataset to elements in the geojson.
 * it expects a keyname to be given, which is the key in each data object which has the id of the geojson
 * element to which that data object should be matched. Expects an array of data objects, and a geojson object
 * which has a features array. Each feature is mapped to one data object.
 *
 * @param  {Array} dataset           The array of input data to match
 * @param  {Object} geoJson          The geojson object. This function will attempt to match each geojson feature to a data object
 * @param  {String} keyName          The name of the property on each data object which will be matched with each geojson id.
 * @return {Array}                   An array of objects (one for each element of the geojson's features). Each should have a
 *                                   geoJson property which is the feature, and a datum property which is the matched datum.
 */
export var prepareMergedData = function(dataset, geoJson, keyName) {
  keyName || (keyName = GEO_KEY_DEFAULT);

  // group the input data by map entity id
  var groupedInputData = dataset.reduce(function(m, v) {
    m[v[keyName]] = v;
    return m;
  }, {});

  // merge the map features and the input data into new objects that include both
  var mergedData = geoJson.features.map(function(feature) {
    return {
      geoJson: feature,
      datum: groupedInputData[feature.id]
    };
  });

  return mergedData;
};

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
 * @param  {Object} geoJson                 The geoJson object for which you want the center.
 * @return {Array[float, float]}            The geographical coordinates (in the form [lon, lat]) of the centroid
 *                                          (or user-specified center) of the object.
 */
export var getGeoJsonCenter = function(geoJson) {
  if (!geoJson.properties.cachedCenter) {
    var setCenter = geoJson.properties.center;
    if (setCenter) {
      geoJson.properties.cachedCenter = setCenter.split(',').map(parseFloat);
    } else {
      geoJson.properties.cachedCenter = geoCentroid(geoJson);
    }
  }

  return geoJson.properties.cachedCenter;
};

/**
 * widthAdaptiveMapPathStroke
 *
 * A little "magic" function for automatically calculating map stroke sizes based on
 * the width of the container they're in. Used for responsive designs.
 *
 * @param  {number} width    The width of the container holding the map.
 * @return {number}          The stroke width that the map elements should have.
 */
export var widthAdaptiveMapPathStroke = function(width) {
  return Math.min(Math.max(0.8, width / 400), 1.1);
};
