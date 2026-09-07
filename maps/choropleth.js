import { dispatch, select } from 'd3';
import { component } from '../d3-component.js';
import { GEO_KEY_DEFAULT, swissMapPath, prepareMergedGeoData } from '../map/mapUtils.js';
import mapRendererBase from '../map/renderer/base.js';
import mapRendererHighlight from '../map/renderer/highlight.js';
import mapRendererMesh from '../map/renderer/mesh.js';
import mapRendererPatternedLakeOverlay from '../map/renderer/patternedlakeoverlay.js';

/**
 * choropleth Map Component
 *
 * @module sszvis/maps/choropleth
 *
 * @template T The type of the data values matched onto the map features
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible id values depend on the map type.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
 * The default key is GEO_KEY_DEFAULT from src/map/index.js, which is 'geoId', but by changing the keyName
 * property of the map, you can pass data which use any key. The map component assumes that
 * datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @property {Number} width                           The width of the map. Used to create the map projection function.
 *                                                    No default and unvalidated: leaving it out fits the projection to
 *                                                    undefined, so every area is drawn with NaN coordinates.
 * @property {Number} height                          The height of the map. Used to create the map projection function.
 *                                                    No default, and fails the same way as width.
 * @property {Object} features                        The feature collection of map entities, as a geojson FeatureCollection.
 *                                                    Required and unguarded: its absence throws, as borders' does.
 * @property {Object} borders                         The mesh of entity borders, rendered as one path. No default, and
 *                                                    required in practice: the mesh renderer throws a TypeError naming
 *                                                    its geoJson property if it is left out.
 * @property {Object} lakeFeatures                    The shape of the part of Lake Zurich that lies within the city.
 *                                                    No default; a missing shape renders as an empty path.
 * @property {Object} lakeBorders                     The entity borders which extend over the lake. No default, and it
 *                                                    renders as an empty path too.
 * @property {Boolean} lakeFadeOut                    Whether to fade the lake out towards the outer edge. Default false,
 *                                                    which overrides the lake renderer's own default of true.
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities
 *                                                    are highlighted. Default [], which renders no highlight path.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities. Default white.
 * @property {Number, Function} highlightStrokeWidth  A function for the stroke width of the highlighted entities. Default 2.
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 *                                                    Defaults to a constant true, so nothing is textured unless it is set.
 * @property {String, Function} fill                  A string or function for the fill of the map entities. Default black.
 *                                                    A feature that matched no datum shows the missing value texture, so an
 *                                                    accessor is not called for it. The exception is a map where no feature
 *                                                    matched a datum: that draws geometry rather than values, keeps this
 *                                                    fill, and calls an accessor with undefined. See src/map/renderer/base.ts.
 * @property {String, Function} borderColor           A string, or a function handed to d3 and so called with the border
 *                                                    mesh, for the border color of the map entities. Default white. An
 *                                                    accessor that resolves to nothing keeps that default rather than
 *                                                    clearing the stroke.
 * @property {Number, Function} strokeWidth           The width of the border path stroke, delegated to the mesh
 *                                                    renderer like borderColor. A number, or a function handed to d3
 *                                                    and so called with the border mesh. Default 1.25, with the same
 *                                                    resolves-to-nothing fallback as borderColor.
 * @property {String, Function} lakePathColor         The color of the entity borders which extend over the lake. No
 *                                                    default: left out, the paths take their stroke from the stylesheet.
 * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
 * @property {AnchoredShape} anchoredShape            A shape to anchor to the base map elements of this map - a component
 *                                                    carrying mergedData and mapPath properties, which this component sets
 *                                                    before calling it. For example, mapRendererBubble for a bubble map.
 *                                                    No default; left out, nothing extra is drawn.
 * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *                                                    A handler is called with undefined rather than with the entity's
 *                                                    datum; see the note below.
 *
 * Note: the projection cache key is the literal string "zurichStadtfeatures" for every choropleth
 * on the page, whatever it is a map of - and it names no map id in src/map/mapUtils.ts.
 * swissMapProjection memoizes on width, height and that string alone, so two maps of different
 * areas rendered at the same size share the projection fitted to whichever rendered first, and the
 * second is projected outside its destination box.
 *
 * Note: features and borders are the two properties whose absence throws - features because
 * prepareMergedGeoData reads geoJson.features, borders because the mesh renderer now validates its
 * own geoJson. width and height have no defaults either, but a missing size degrades silently:
 * fitSize gets undefined, the scale is NaN, and every area carries a path of NaN coordinates that
 * the browser drops, leaving a blank map instead of an error.
 *
 * Note: the lake and the anchored shape are not removed once drawn. Turning withLake off, or
 * clearing anchoredShape, only stops the renderer being called; the lake, its border path, the
 * pattern definition and the shape's own elements stay in the DOM from the previous render. The
 * highlight is the exception - the highlight renderer removes its paths for an empty highlight
 * array - which is what makes the other two read as oversights rather than as house style.
 *
 * Note: lakeFadeOut defaults to false and is passed through on every render, overriding the lake
 * renderer's own default of true, so the fade mask and its gradient are not created unless the
 * caller asks for them. Toggling it is safe in both directions: turning lakeFadeOut back off
 * removes the mask attribute and its two definitions again.
 *
 * Note: withLake defaults to true, so a map with no lake data still gets the lake renderer, which
 * emits its lake pattern definition - under an id scoped to the overlay - and two empty paths.
 * Every non-Zurich map - switzerland included - has to set .withLake(false) or it carries them.
 *
 * Note: the event dispatch is created once per choropleth() call and closed over, while the four
 * renderers keep their props on the element they rendered into. So one instance can draw into two
 * layers, each reflecting its own data, but both layers' event targets are bound to the one
 * dispatch and share its handlers. Within a layer the handlers are rebound on each render rather
 * than accumulating, and the binding is selectAll("[data-event-target]") scoped to the rendered
 * group, so an anchored shape's own event targets are bound too, since it renders before the
 * binding.
 *
 * See test/maps/choropleth.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
 * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
 * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
 * change behaviour - the fix is to take the datum from d3's second argument. The same defect as
 * the bubble renderer's own handlers.
 */
function legacyDatum(event) {
  return event.datum;
}
function choropleth () {
  const event = dispatch("over", "out", "click");
  const baseRenderer = mapRendererBase();
  const meshRenderer = mapRendererMesh();
  const lakeRenderer = mapRendererPatternedLakeOverlay();
  const highlightRenderer = mapRendererHighlight();
  const mapComponent = component().prop("width").prop("height").prop("keyName").keyName(GEO_KEY_DEFAULT).prop("withLake").withLake(true).prop("anchoredShape").prop("features").prop("borders").prop("lakeFeatures").prop("lakeBorders").prop("lakeFadeOut").lakeFadeOut(false).delegate("defined", baseRenderer).delegate("fill", baseRenderer).delegate("transitionColor", baseRenderer).delegate("borderColor", meshRenderer).delegate("strokeWidth", meshRenderer).delegate("highlight", highlightRenderer).delegate("highlightStroke", highlightRenderer).delegate("highlightStrokeWidth", highlightRenderer).delegate("lakePathColor", lakeRenderer).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // create a map path generator function
    // Note: the cache key is the same literal string for every choropleth on the page, whatever
    // it is a map of. Transcribed as it stands; see the module note.
    const mapPath = swissMapPath(props.width, props.height, props.features, "zurichStadtfeatures");
    const mergedData = prepareMergedGeoData(data, props.features, props.keyName);
    // Base shape
    baseRenderer.geoJson(props.features).mergedData(mergedData).mapPath(mapPath);
    // Border mesh
    meshRenderer.geoJson(props.borders).mapPath(mapPath);
    // Lake Zurich shape
    lakeRenderer.lakeFeature(props.lakeFeatures).lakeBounds(props.lakeBorders).mapPath(mapPath).fadeOut(props.lakeFadeOut);
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
    selection.selectAll("[data-event-target]").on("mouseover", function (e) {
      event.call("over", this, legacyDatum(e));
    }).on("mouseout", function (e) {
      event.call("out", this, legacyDatum(e));
    }).on("click", function (e) {
      event.call("click", this, legacyDatum(e));
    });
  });
  // The argument tuple is typed as the map renderers type their own on(): d3's dispatch.on derives
  // its callback type from a *literal* event name, so a plain string collapses the callback to
  // never. Narrowing to "over" | "out" | "click" would type the callback properly but would also
  // reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  mapComponent.on = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    const value = event.on.apply(event, args);
    return value === event ? mapComponent : value;
  };
  return mapComponent;
}

export { choropleth as default };
//# sourceMappingURL=choropleth.js.map
