/*
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */
sszvis_namespace('sszvis.map.utils', function(module) {
  'use strict';

  module.exports.constants = {
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

  module.exports.swissMapProjection = function(width, height, featureCollection, featureBoundsCacheKey) {
    var mercatorProjection = d3.geo.mercator()
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

      var boundsGenerator = d3.geo.path()
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
   * This is a special d3.geo.path generator function tailored for rendering maps of
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
   * @return {d3.geo.path}                      A path generator function. This function takes a geojson datum as argument
   *                                            and returns an svg path string which represents that geojson, projected using
   *                                            a map projection optimal for Swiss areas.
   */
  module.exports.swissMapPath = function(width, height, featureCollection, featureBoundsCacheKey) {
    var mercatorPath = d3.geo.path()
      .projection(sszvis.map.utils.swissMapProjection(width, height, featureCollection, featureBoundsCacheKey));

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
  module.exports.pixelsFromDistance = function(projection, centerPoint, meterDistance) {
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

});
