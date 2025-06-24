/**
 * zurichStadtKreise Map Component
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible id values depend on the map type.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
 * The default key which map.js expects is 'geoId', but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
 * @property {Component} anchoredShape                A shape to anchor to the base map elements of this map. For example, anchoredCircles for a bubble map.
 * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {d3.component}
 */
export default function _default(): d3.component;
//# sourceMappingURL=choropleth.d.ts.map