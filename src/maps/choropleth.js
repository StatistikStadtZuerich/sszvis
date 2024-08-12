import { select, dispatch } from "d3";
import { component } from "../d3-component.js";
import {
  GEO_KEY_DEFAULT,
  mapRendererBase,
  mapRendererHighlight,
  mapRendererMesh,
  mapRendererPatternedLakeOverlay,
  prepareMergedGeoData,
  swissMapPath,
} from "../map/index.js";

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

export default function () {
  const event = dispatch("over", "out", "click");

  const baseRenderer = mapRendererBase();
  const meshRenderer = mapRendererMesh();
  const lakeRenderer = mapRendererPatternedLakeOverlay();
  const highlightRenderer = mapRendererHighlight();

  const mapComponent = component()
    .prop("width")
    .prop("height")
    .prop("keyName")
    .keyName(GEO_KEY_DEFAULT)
    .prop("withLake")
    .withLake(true)
    .prop("anchoredShape")
    .prop("features")
    .prop("borders")
    .prop("lakeFeatures")
    .prop("lakeBorders")
    .prop("lakeFadeOut")
    .lakeFadeOut(false)
    .delegate("defined", baseRenderer)
    .delegate("fill", baseRenderer)
    .delegate("transitionColor", baseRenderer)
    .delegate("borderColor", meshRenderer)
    .delegate("strokeWidth", meshRenderer)
    .delegate("highlight", highlightRenderer)
    .delegate("highlightStroke", highlightRenderer)
    .delegate("highlightStrokeWidth", highlightRenderer)
    .delegate("lakePathColor", lakeRenderer)
    .render(function (data) {
      const selection = select(this);
      const props = selection.props();

      // create a map path generator function
      const mapPath = swissMapPath(props.width, props.height, props.features, "zurichStadtfeatures");

      const mergedData = prepareMergedGeoData(data, props.features, props.keyName);

      // Base shape
      baseRenderer.geoJson(props.features).mergedData(mergedData).mapPath(mapPath);

      // Border mesh
      meshRenderer.geoJson(props.borders).mapPath(mapPath);

      // Lake Zurich shape
      lakeRenderer
        .lakeFeature(props.lakeFeatures)
        .lakeBounds(props.lakeBorders)
        .mapPath(mapPath)
        .fadeOut(props.lakeFadeOut);

      // Highlight mesh
      highlightRenderer.geoJson(props.features).keyName(props.keyName).mapPath(mapPath);

      // Rendering

      selection.call(baseRenderer).call(meshRenderer);

      if (props.withLake) {
        selection.call(lakeRenderer);
      }

      selection.call(highlightRenderer);

      if (props.anchoredShape) {
        props.anchoredShape.mergedData(mergedData).mapPath(mapPath);

        selection.call(props.anchoredShape);
      }

      // Event Binding

      selection
        .selectAll("[data-event-target]")
        .on("mouseover", function (d) {
          event.call("over", this, d.datum);
        })
        .on("mouseout", function (d) {
          event.call("out", this, d.datum);
        })
        .on("click", function (d) {
          event.call("click", this, d.datum);
        });
    });

  mapComponent.on = function () {
    const value = event.on.apply(event, arguments);
    return value === event ? mapComponent : value;
  };

  return mapComponent;
}
