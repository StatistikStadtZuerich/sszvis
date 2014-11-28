/**
 * Map Component Information (this is legacy documentation from the old sszvis.map)
 *
 * Use this component to make a map, either of the city of Zurich or of Switzerland.
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible values depend on the map type you are using.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. The key for this value is configurable.
 * The default key which map.js expects is geoId, but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @module  sszvis/map
 *
 * @property {String} type                            The type of the chart. This must be one of the following options: "zurich-stadtkreise", "zurich-statistischeQuartiere", "zurich-wahlkreise", "switzerland-cantons"
 * @property {String} keyName                         The map entity key name. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value. Map entities with data values that fail this predicate test will display the missing value texture
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 *
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {d3.component}
 */
namespace('sszvis.map.utils', function(module) {

  // This is a special d3.geo.path generator function tailored for rendering maps of
  // Switzerland. The values are chosen specifically to optimize path generation for
  // Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
  module.exports.swissMapPath = function(width, height, featureCollection) {
    var mercatorProjection = d3.geo.mercator()
      .rotate([-7.439583333333333, -46.95240555555556]);

    mercatorProjection
      .scale(1)
      .translate([0, 0]);

    var mercatorPath = d3.geo.path()
      .projection(mercatorProjection);

    var b = mercatorPath.bounds(featureCollection),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    mercatorProjection
      .scale(s)
      .translate(t);

    return mercatorPath;
  };

});
