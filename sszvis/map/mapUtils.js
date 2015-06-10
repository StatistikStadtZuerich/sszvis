/*
 * A collection of utilities used by the map modules
 *
 * @module sszvis/map/utils
 */
sszvis_namespace('sszvis.map.utils', function(module) {
  'use strict';

  // This is for caching feature bounds calculations, which are pretty expensive.
  // Given the current architecture, you need to pass a featureBoundsCacheKey in order to
  // enable using cached values. If the featureCollection passed to this function changes,
  // a different featureBoundsCacheKey must be used.
  var featureBoundsCache = {};

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
    var mercatorProjection = d3.geo.mercator()
      .rotate([-7.439583333333333, -46.95240555555556]);

    mercatorProjection
      .scale(1)
      .translate([0, 0]);

    var mercatorPath = d3.geo.path()
      .projection(mercatorProjection);

    var b = featureBoundsCacheKey && featureBoundsCache[featureBoundsCacheKey] ? featureBoundsCache[featureBoundsCacheKey] : ( featureBoundsCacheKey ? ( featureBoundsCache[featureBoundsCacheKey] = mercatorPath.bounds(featureCollection) ) : mercatorPath.bounds(featureCollection) ),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    mercatorProjection
      .scale(s)
      .translate(t);

    return mercatorPath;
  };

});
