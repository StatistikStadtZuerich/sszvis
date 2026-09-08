import { dispatch, select } from 'd3';
import { component } from '../d3-component.js';
import '../d3-selectgroup.js';
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
 *                                                    Required: no default, and a missing or non-finite width throws
 *                                                    before anything is drawn.
 * @property {Number} height                          The height of the map. Same as width, and validated the same way.
 * @property {Object} features                        The feature collection of map entities, as a geojson FeatureCollection.
 *                                                    Required: its absence throws, as width's and borders' do.
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
 *                                                    A handler is called with the datum of the entity the event happened
 *                                                    on; see the note below.
 *
 * Note: no projection cache key is passed, so swissMapProjection skips its bounds cache and fits
 * the projection to the features this map was given. Two maps of different areas rendered at the
 * same size are therefore projected independently. The cost is that the bounds calculation is
 * redone on every render; sharing a key would trade that for the wrong fit.
 *
 * Note: width, height, features and borders are all required and all now fail loudly. This
 * component validates the first three itself, before it renders anything, and the mesh renderer
 * validates its own geoJson for the fourth. A missing size used to degrade silently - fitSize got
 * undefined, the scale was NaN, and every area carried a path of NaN coordinates that the browser
 * dropped, leaving a blank map with nothing in the console.
 *
 * Note: the lake and the anchored shape are each drawn into a group of this component's own, so
 * that turning withLake off, or clearing anchoredShape, removes what the previous render drew
 * rather than merely skipping the renderer. Every layer that can be switched off therefore clears
 * itself: the highlight through its own renderer, these two through their groups.
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
 * Note: a handler receives the datum of the map entity the event fired on, which this component
 * recognises by identity: the value bound to the event target has to be one of the merged entries
 * it produced for this render. The base layer's areas carry exactly those, so a handler gets the
 * entity's own datum, undefined where the entity matched no data. An event target an anchored
 * shape contributed yields undefined unless that shape bound one of the same merged entries to it,
 * in which case it names an entity like any other target and the handler gets its datum.
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
 * The entity datum behind an event target, read off the value d3 has bound to it. The base renderer
 * binds a merged entry to every area, so the entity's own datum is its `datum` property - undefined
 * where nothing matched.
 *
 * An event target contributed by an anchored shape carries whatever that shape bound, which may
 * well be an application object with a `datum` property of its own, or one inherited from an
 * ancestor. Recognising a merged entry by its shape would hand such a value to the handler as
 * though it were an entity's datum, so membership is tested by identity against the entries this
 * render actually produced; anything else is reported as undefined.
 */
function entityDatum(bound, entities) {
  if (!entities.has(bound)) return undefined;
  return bound.datum;
}
/**
 * Reads a required dimension, reporting a missing or nonsensical one rather than fitting the
 * projection to undefined - which gives it a NaN scale and draws every entity with a path of NaN
 * coordinates that the browser silently drops, leaving a blank map and nothing in the console.
 * Thrown before anything is rendered, so a misconfigured map draws nothing at all. The message
 * follows the raster renderer's.
 */
function dimension(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("[choropleth] the ".concat(name, " property is required, and must be a finite, non-negative number"));
  }
  return value;
}
/**
 * Reads the required feature collection. Without it prepareMergedGeoData already threw, on
 * geoJson.features - a bare TypeError naming neither the component nor the property - so this only
 * changes what the failure says, and says it in the same shape as the missing-dimension one.
 */
function requireFeatures(value) {
  if (value === undefined || value === null || value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    throw new Error("[choropleth] the features property is required, and must be a GeoJSON feature collection");
  }
  return value;
}
/**
 * The group keys the two removable layers are drawn under. A group carries everything its renderer
 * produced - the lake's two paths and its pattern, gradient and mask definitions among them - so
 * emptying it removes the layer whole.
 */
const LAKE_GROUP = "lake";
const SHAPE_GROUP = "anchoredShape";
/**
 * The wrapper this component owns for one of those layers, joined against the direct children of
 * the map group rather than searched for with selectGroup, which matches any descendant: an
 * anchored shape is arbitrary caller markup and may well contain a group of its own under the same
 * key.
 *
 * The wrapper is created whether or not its layer is drawn, and a disabled layer empties it rather
 * than removing it. Removing it would give up its place among its siblings - selectGroup and this
 * helper both append on a miss - so re-enabling the lake would insert it after the highlight mesh
 * drawn later in the same render, and the lake would then paint over the highlight.
 */
function ownGroup(selection, key) {
  return selection.selectAll(":scope > [data-d3-selectgroup=\"".concat(key, "\"]")).data(d => [d]).join("g").attr("data-d3-selectgroup", key);
}
function choropleth() {
  const event = dispatch("over", "out", "click");
  const baseRenderer = mapRendererBase();
  const meshRenderer = mapRendererMesh();
  const lakeRenderer = mapRendererPatternedLakeOverlay();
  const highlightRenderer = mapRendererHighlight();
  const mapComponent = component().prop("width").prop("height").prop("keyName").keyName(GEO_KEY_DEFAULT).prop("withLake").withLake(true).prop("anchoredShape").prop("features").prop("borders").prop("lakeFeatures").prop("lakeBorders").prop("lakeFadeOut").lakeFadeOut(false).delegate("defined", baseRenderer).delegate("fill", baseRenderer).delegate("transitionColor", baseRenderer).delegate("borderColor", meshRenderer).delegate("strokeWidth", meshRenderer).delegate("highlight", highlightRenderer).delegate("highlightStroke", highlightRenderer).delegate("highlightStrokeWidth", highlightRenderer).delegate("lakePathColor", lakeRenderer).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // create a map path generator function.
    // No cache key: the bounds cache is keyed on width, height and the key alone, so any key
    // this component could invent would be shared by every choropleth of that size, whatever it
    // is a map of. Without one the projection is fitted to the features actually given.
    // Validated before anything is drawn: a map with no size, or none to draw, can never render
    // correctly, and both used to fail silently or namelessly.
    const width = dimension(props.width, "width");
    const height = dimension(props.height, "height");
    const features = requireFeatures(props.features);
    const mapPath = swissMapPath(width, height, features);
    const mergedData = prepareMergedGeoData(data, features, props.keyName);
    // Base shape
    baseRenderer.geoJson(features).mergedData(mergedData).mapPath(mapPath);
    // Border mesh
    meshRenderer.geoJson(props.borders).mapPath(mapPath);
    // Lake Zurich shape
    lakeRenderer.lakeFeature(props.lakeFeatures).lakeBounds(props.lakeBorders).mapPath(mapPath).fadeOut(props.lakeFadeOut);
    // Highlight mesh
    highlightRenderer.geoJson(features).keyName(props.keyName).mapPath(mapPath);
    // Rendering
    selection.call(baseRenderer).call(meshRenderer);
    // The lake and the anchored shape are both optional, and a render that switches one off must
    // undo what an earlier render drew, the way the highlight renderer clears its paths for an
    // empty highlight. Each is drawn into a group of this component's own, so switching it off is
    // emptying that group - which works for an anchored shape whose markup this component knows
    // nothing about. The group itself stays, to hold its place among its siblings; see ownGroup.
    const lakeGroup = ownGroup(selection, LAKE_GROUP);
    if (props.withLake) {
      lakeGroup.call(lakeRenderer);
    } else {
      lakeGroup.selectAll("*").remove();
    }
    selection.call(highlightRenderer);
    const shapeGroup = ownGroup(selection, SHAPE_GROUP);
    if (props.anchoredShape) {
      props.anchoredShape.mergedData(mergedData).mapPath(mapPath);
      shapeGroup.call(props.anchoredShape);
    } else {
      shapeGroup.selectAll("*").remove();
    }
    // Event Binding
    // The entries this render bound to the areas, held by identity so an anchored shape's own
    // event targets cannot be mistaken for them.
    const entities = new Set(mergedData);
    selection.selectAll("[data-event-target]")
    // d3 calls a listener with the event first and the bound datum second.
    .on("mouseover", function (_event, d) {
      event.call("over", this, entityDatum(d, entities));
    }).on("mouseout", function (_event, d) {
      event.call("out", this, entityDatum(d, entities));
    }).on("click", function (_event, d) {
      event.call("click", this, entityDatum(d, entities));
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
