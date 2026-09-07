/**
 * choropleth Map Component
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible id values depend on the map type.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
 * The default key which map.js expects is 'geoId', but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @module sszvis/maps/choropleth
 *
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {Object} features                        The feature collection of map entities, as a geojson FeatureCollection.
 * @property {Object} borders                         The mesh of entity borders, rendered as one path.
 * @property {Object} lakeFeatures                    The shape of the part of Lake Zurich that lies within the city.
 * @property {Object} lakeBorders                     The entity borders which extend over the lake.
 * @property {Boolean} lakeFadeOut                    Whether to fade the lake out towards the outer edge. Default false.
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Number, Function} highlightStrokeWidth  A function for the stroke width of the highlighted entities
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 * @property {Number, Function} strokeWidth           The width of the entity borders
 * @property {String, Function} lakePathColor         The color of the entity borders which extend over the lake
 * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
 * @property {Component} anchoredShape                A shape to anchor to the base map elements of this map. For example, anchoredCircles for a bubble map.
 * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {sszvis.component}
 */

import {
  type BaseType,
  dispatch,
  type ExtendedFeatureCollection,
  type GeoPath,
  type GeoPermissibleObjects,
  select,
  type ValueFn,
} from "d3";
import { type Component, component } from "../d3-component.js";
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
export interface AnchoredShape<T> extends Component {
  mergedData(value: MergedGeoDatum<T>[]): AnchoredShape<T>;
  mapPath(value: GeoPath): AnchoredShape<T>;
}

/**
 * The mesh and lake renderers as this component configures them. borders, lakeFeatures and
 * lakeBorders have no defaults, and the JavaScript passed whatever it was given straight through -
 * which is how a choropleth without borders or lake data renders empty paths instead of failing -
 * so the shape these views accept includes the absent case that the renderers' own signatures do
 * not. Everything else about them is unchanged; the delegated properties are reached through
 * component.delegate rather than through these types.
 *
 * Note: the renderers satisfy these views only because method parameters are checked bivariantly,
 * so the compiler is standing in for a cast here rather than proving the widening sound. The
 * honest fix is to make those props optional in the renderers themselves, which already document
 * that they tolerate a missing shape.
 */
interface MeshRendererView extends Component {
  geoJson(value: GeoPermissibleObjects | undefined): MeshRendererView;
  mapPath(value: GeoPath): MeshRendererView;
}

interface LakeRendererView extends Component {
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
 * A handler as this component's event API delivers it - which is to say, with undefined. See the
 * note on legacyDatum below.
 */
export type ChoroplethEventHandler = (datum: undefined) => void;

/**
 * The datum type is constrained to Record<string, unknown> rather than to object because
 * prepareMergedGeoData indexes a datum by the key name, so an interface without an index signature
 * cannot be named as T even though it works at runtime.
 *
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
export interface ChoroplethComponent<T extends Record<string, unknown> = Record<string, unknown>>
  extends Component {
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
  borderColor(): GeoStyleValue<string>;
  borderColor(value: GeoStyleValue<string>): ChoroplethComponent<T>;
  strokeWidth(): GeoStyleValue<number>;
  strokeWidth(value: GeoStyleValue<number>): ChoroplethComponent<T>;
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
   * chained; called with an event name alone it returns that handler. Note that a handler is
   * called with undefined rather than with the map entity's datum; see the module note.
   */
  on(eventName: string, handler: ChoroplethEventHandler | null): ChoroplethComponent<T>;
  on(eventName: string): ChoroplethEventHandler | undefined;
}

/**
 * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
 * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
 * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
 * change behaviour - the fix is to take the datum from d3's second argument. The same defect as
 * the bubble renderer's own handlers.
 */
function legacyDatum(event: Event & { datum?: undefined }): undefined {
  return event.datum;
}

export default function <
  T extends Record<string, unknown> = Record<string, unknown>,
>(): ChoroplethComponent<T> {
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

      // create a map path generator function
      // Note: the cache key is the same literal string for every choropleth on the page, whatever
      // it is a map of. Transcribed as it stands; see the module note.
      const mapPath = swissMapPath(
        props.width,
        props.height,
        props.features,
        "zurichStadtfeatures"
      );

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
        .selectAll<Element, unknown>("[data-event-target]")
        .on("mouseover", function (e: Event & { datum?: undefined }) {
          event.call("over", this, legacyDatum(e));
        })
        .on("mouseout", function (e: Event & { datum?: undefined }) {
          event.call("out", this, legacyDatum(e));
        })
        .on("click", function (e: Event & { datum?: undefined }) {
          event.call("click", this, legacyDatum(e));
        });
    });

  // The argument tuple is typed as the map renderers type their own on(): d3's dispatch.on derives
  // its callback type from a *literal* event name, so a plain string collapses the callback to
  // never. Narrowing to "over" | "out" | "click" would type the callback properly but would also
  // reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  mapComponent.on = (...args: [string, never]) => {
    const value = event.on.apply(event, args);
    return value === event ? mapComponent : value;
  };

  return mapComponent;
}
