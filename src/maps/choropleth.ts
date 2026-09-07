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

import {
  type BaseType,
  dispatch,
  type ExtendedFeatureCollection,
  type GeoPath,
  type GeoPermissibleObjects,
  type Selection,
  select,
  type ValueFn,
} from "d3";
import { type ComponentBuilder, component } from "../d3-component.js";
import "../d3-selectgroup.js";
import {
  GEO_KEY_DEFAULT,
  type MergedGeoDatum,
  mapRendererBase,
  mapRendererHighlight,
  mapRendererMesh,
  mapRendererPatternedLakeOverlay,
  prepareMergedGeoData,
  swissMapPath,
} from "../map/index.js";

/**
 * What the render needs of an anchored shape: the two properties it configures before calling it.
 * mapRendererBubble satisfies this, which is the documented use, and so does any other component
 * that carries the pair.
 */
export interface AnchoredShape<T> extends ComponentBuilder<AnchoredShape<T>> {
  mergedData(value: MergedGeoDatum<T>[]): AnchoredShape<T>;
  mapPath(value: GeoPath): AnchoredShape<T>;
}

/**
 * The mesh and lake renderers as this component configures them. borders, lakeFeatures and
 * lakeBorders have no defaults, and the JavaScript passed whatever it was given straight through,
 * so the shape these views accept includes the absent case that the renderers' own signatures do
 * not. The absent case no longer means the same thing for both: a missing lakeFeature or lakeBounds
 * still renders an empty path, while a missing borders now reaches the mesh renderer's guard and
 * throws a TypeError naming geoJson. The view keeps the widened parameter so the call site
 * type-checks; what it no longer promises is that the render survives. Everything else about them
 * is unchanged; the delegated properties are reached through component.delegate rather than through
 * these types.
 *
 * Note: the renderers satisfy these views only because method parameters are checked bivariantly,
 * so the compiler is standing in for a cast here rather than proving the widening sound. The
 * honest fix is to make those props optional in the renderers themselves, which already document
 * that they tolerate a missing shape.
 */
interface MeshRendererView extends ComponentBuilder<MeshRendererView> {
  geoJson(value: GeoPermissibleObjects | undefined): MeshRendererView;
  mapPath(value: GeoPath): MeshRendererView;
}

interface LakeRendererView extends ComponentBuilder<LakeRendererView> {
  lakeFeature(value: GeoPermissibleObjects | undefined): LakeRendererView;
  lakeBounds(value: GeoPermissibleObjects | undefined): LakeRendererView;
  mapPath(value: GeoPath): LakeRendererView;
  fadeOut(value: boolean): LakeRendererView;
}

/**
 * The three shapes the delegated properties take, mirroring the renderers they are delegated to:
 * the base renderer's props accept a constant or an accessor called with a possibly-missing datum,
 * the highlight renderer's are only ever called with a highlighted datum, and the mesh and lake
 * renderers' are handed to d3 as they stand, so an accessor there receives d3's own arguments.
 */
type BaseValue<T, R> = R | ((datum: T | undefined) => R);
type HighlightValue<T, R> = R | ((datum: T) => R);
type GeoStyleValue<R extends string | number> =
  | R
  | ValueFn<BaseType, GeoPermissibleObjects, R | null>;

/**
 * The mesh renderer's own shape, which differs from GeoStyleValue in one way: an accessor there may
 * resolve to undefined as well as null, because the mesh reads either as "keep the default" rather
 * than passing it to d3. The lake overlay has no such guard, so lakePathColor keeps GeoStyleValue.
 */
type MeshStyleValue<R extends string | number> =
  | R
  | ValueFn<BaseType, GeoPermissibleObjects, R | null | undefined>;

/**
 * A handler as this component's event API delivers it: with the datum of the map entity the event
 * happened on, which is undefined for an entity that matched no data - and for an event target
 * bound to anything other than one of this render's merged entries, an anchored shape's own markup
 * included, unless that shape bound those entries itself.
 */
export type ChoroplethEventHandler<T = object> = (datum: T | undefined) => void;

/**
 * The props as the render reads them. features is typed as present because a render only succeeds
 * with it; width and height are too, since the projection is built from them unguarded - a caller
 * who leaves any of the three out gets the failure pinned in test/maps/choropleth.test.ts rather
 * than a type error.
 */
type ChoroplethProps<T> = {
  width: number;
  height: number;
  features: ExtendedFeatureCollection;
  borders?: GeoPermissibleObjects;
  lakeFeatures?: GeoPermissibleObjects;
  lakeBorders?: GeoPermissibleObjects;
  lakeFadeOut: boolean;
  keyName: string;
  withLake: boolean;
  anchoredShape?: AnchoredShape<T> | null;
};

/**
 * The getters return whatever was last set, which is why width, height, features, borders, the two
 * lake shapes and anchoredShape report undefined: none of them has a default. The delegated
 * properties are declared by the renderer they belong to, so their types are that renderer's; they
 * are spelled out here rather than inherited because a delegate returns this component for
 * chaining, not the renderer.
 */
export interface ChoroplethComponent<T extends object = object>
  extends ComponentBuilder<ChoroplethComponent<T>> {
  width(): number | undefined;
  width(value: number): ChoroplethComponent<T>;
  height(): number | undefined;
  height(value: number): ChoroplethComponent<T>;
  features(): ExtendedFeatureCollection | undefined;
  features(value: ExtendedFeatureCollection): ChoroplethComponent<T>;
  borders(): GeoPermissibleObjects | undefined;
  borders(value: GeoPermissibleObjects): ChoroplethComponent<T>;
  lakeFeatures(): GeoPermissibleObjects | undefined;
  lakeFeatures(value: GeoPermissibleObjects): ChoroplethComponent<T>;
  lakeBorders(): GeoPermissibleObjects | undefined;
  lakeBorders(value: GeoPermissibleObjects): ChoroplethComponent<T>;
  lakeFadeOut(): boolean;
  lakeFadeOut(value: boolean): ChoroplethComponent<T>;
  keyName(): string;
  keyName(value: string): ChoroplethComponent<T>;
  withLake(): boolean;
  withLake(value: boolean): ChoroplethComponent<T>;
  anchoredShape(): AnchoredShape<T> | null | undefined;
  anchoredShape(value: AnchoredShape<T> | null): ChoroplethComponent<T>;
  /** Delegated to the base renderer. */
  defined(): (datum?: T) => boolean;
  defined(value: BaseValue<T, boolean>): ChoroplethComponent<T>;
  fill(): (datum?: T) => string;
  fill(value: BaseValue<T, string>): ChoroplethComponent<T>;
  transitionColor(): boolean;
  transitionColor(value: boolean): ChoroplethComponent<T>;
  /** Delegated to the mesh renderer. */
  borderColor(): MeshStyleValue<string>;
  borderColor(value: MeshStyleValue<string>): ChoroplethComponent<T>;
  strokeWidth(): MeshStyleValue<number>;
  strokeWidth(value: MeshStyleValue<number>): ChoroplethComponent<T>;
  /** Delegated to the highlight renderer. */
  highlight(): (T | null | undefined)[];
  highlight(value: (T | null | undefined)[]): ChoroplethComponent<T>;
  highlightStroke(): (datum: T) => string | null;
  highlightStroke(value: HighlightValue<T, string | null>): ChoroplethComponent<T>;
  highlightStrokeWidth(): (datum: T) => number | null;
  highlightStrokeWidth(value: HighlightValue<T, number | null>): ChoroplethComponent<T>;
  /** Delegated to the lake overlay renderer. */
  lakePathColor(): GeoStyleValue<string> | undefined;
  lakePathColor(value: GeoStyleValue<string>): ChoroplethComponent<T>;
  /**
   * Registers a handler for "over", "out" or "click", returning the component so it can be
   * chained; called with an event name alone it returns that handler. A handler is called with
   * the datum of the entity the event happened on; see the module note.
   */
  on(eventName: string, handler: ChoroplethEventHandler<T> | null): ChoroplethComponent<T>;
  on(eventName: string): ChoroplethEventHandler<T> | undefined;
}

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
function entityDatum<T extends object>(
  bound: unknown,
  entities: ReadonlySet<unknown>
): T | undefined {
  if (!entities.has(bound)) return undefined;
  return (bound as { datum?: T }).datum;
}

/**
 * Reads a required dimension, reporting a missing or nonsensical one rather than fitting the
 * projection to undefined - which gives it a NaN scale and draws every entity with a path of NaN
 * coordinates that the browser silently drops, leaving a blank map and nothing in the console.
 * Thrown before anything is rendered, so a misconfigured map draws nothing at all. The message
 * follows the raster renderer's.
 */
function dimension(value: number | undefined, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `[choropleth] the ${name} property is required, and must be a finite, non-negative number`
    );
  }
  return value;
}

/**
 * Reads the required feature collection. Without it prepareMergedGeoData already threw, on
 * geoJson.features - a bare TypeError naming neither the component nor the property - so this only
 * changes what the failure says, and says it in the same shape as the missing-dimension one.
 */
function requireFeatures(value: ExtendedFeatureCollection | undefined): ExtendedFeatureCollection {
  if (
    value === undefined ||
    value === null ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features)
  ) {
    throw new Error(
      "[choropleth] the features property is required, and must be a GeoJSON feature collection"
    );
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
function ownGroup<G extends BaseType, D, P extends BaseType, PD>(
  selection: Selection<G, D, P, PD>,
  key: string
): Selection<SVGGElement, D, G, D> {
  return selection
    .selectAll<SVGGElement, D>(`:scope > [data-d3-selectgroup="${key}"]`)
    .data((d) => [d])
    .join("g")
    .attr("data-d3-selectgroup", key);
}

export default function choropleth<T extends object = object>(): ChoroplethComponent<T> {
  const event = dispatch("over", "out", "click");

  const baseRenderer = mapRendererBase<T>();
  const meshRenderer: MeshRendererView = mapRendererMesh();
  const lakeRenderer: LakeRendererView = mapRendererPatternedLakeOverlay();
  const highlightRenderer = mapRendererHighlight<T>();

  const mapComponent = component<ChoroplethComponent<T>>()
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
    .render(function (this: Element, data: readonly T[] | null | undefined) {
      const selection = select(this);
      const props = selection.props<ChoroplethProps<T>>();

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
      lakeRenderer
        .lakeFeature(props.lakeFeatures)
        .lakeBounds(props.lakeBorders)
        .mapPath(mapPath)
        .fadeOut(props.lakeFadeOut);

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
      const entities: ReadonlySet<unknown> = new Set<unknown>(mergedData);

      selection
        .selectAll<Element, unknown>("[data-event-target]")
        // d3 calls a listener with the event first and the bound datum second.
        .on("mouseover", function (_event: Event, d: unknown) {
          event.call("over", this, entityDatum<T>(d, entities));
        })
        .on("mouseout", function (_event: Event, d: unknown) {
          event.call("out", this, entityDatum<T>(d, entities));
        })
        .on("click", function (_event: Event, d: unknown) {
          event.call("click", this, entityDatum<T>(d, entities));
        });
    });

  // The argument tuple is typed as the map renderers type their own on(): d3's dispatch.on derives
  // its callback type from a *literal* event name, so a plain string collapses the callback to
  // never. Narrowing to "over" | "out" | "click" would type the callback properly but would also
  // reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  mapComponent.on = ((...args: [string, never]) => {
    const value = event.on.apply(event, args);
    return value === event ? mapComponent : value;
  }) as ChoroplethComponent<T>["on"];

  return mapComponent;
}
