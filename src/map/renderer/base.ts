/**
 * base renderer component
 *
 * @module sszvis/map/renderer/base
 *
 * @template T The type of the data values merged onto the map features
 *
 * A component used internally for rendering the base layer of maps.
 * These map entities have a color fill, which is possibly a pattern that represents
 * missing values. They are also event targets. If your map has nothing else, it should have a
 * base layer.
 *
 * @property {GeoJson} geoJson                        Declared for compatibility but never read: the render takes every
 *                                                    shape from the geoJson property of each merged datum. Setting it
 *                                                    has no effect, and omitting it renders the map in full.
 * @property {d3.geo.path} mapPath                    A path generator used to create the path data string for each merged
 *                                                    shape. It must be a real d3.geoPath with a projection set, since the
 *                                                    tooltip anchors are positioned by calling mapPath.projection(); see
 *                                                    the note below.
 * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
 *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
 *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
 * @property {Boolean, Function} defined              A predicate used to determine whether a datum has a defined value. Map
 *                                                    entities that fail it display the missing value texture, as do entities
 *                                                    that matched no datum at all - the predicate is only consulted for a
 *                                                    datum that exists. It is wrapped in fn.functor and defaults to the
 *                                                    constant true, so a constant false textures the whole map. The
 *                                                    exception is a layer where no entity has a datum; see the note below.
 * @property {String, Function} fill                  A string or function for the fill of the map entities. An accessor is
 *                                                    called with the entity's datum, and is not called at all for an entity
 *                                                    the dataset does not cover - that one is textured instead. On a layer
 *                                                    where no entity has a datum, though, nothing is textured and the
 *                                                    accessor is called with undefined for every entity; see the note below.
 * @property {Boolean} transitionColor                Whether to transition the fill color of the map entities.
 *                                                    (default: true) With it set, the fill is only applied through the
 *                                                    transition, so a color change fades from the previous color; with it
 *                                                    unset the fill is written synchronously. An entering entity has no
 *                                                    previous color, so it takes the final color at the first tick.
 *
 * Note: the scheduled transition keeps d3's defaults of 250ms and easeCubicInOut rather than the
 * intended 500ms easePolyOut. `.transition().call(slowTransition)` returns the original
 * transition, while slowTransition ignores its argument and builds a fresh detached transition
 * that is discarded.
 *
 * Note: "missing" only means something relative to a dataset, so a layer where no entity has a
 * datum is taken to be drawing geometry rather than encoding values - it keeps the caller's fill,
 * is not classed --undefined, and calls the fill accessor with undefined for every entity. One
 * matched datum is enough to make it a data layer, and then the entities the dataset does not
 * cover are textured and the accessor is not called for them. A dataset that is supplied but
 * matches nothing is indistinguishable from no dataset here, since this renderer receives only
 * mergedData; such a map renders with the caller's fill rather than an all-textured map.
 *
 * Note: the missing value pattern is written into a defs element inside each map layer, under an id
 * of that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: rendering mutates the geojson it is handed. Anchor positions go through getGeoJsonCenter,
 * which caches a center onto every feature's properties. A malformed `center` property parses to
 * NaN coordinates and the anchor is emitted with a transform of translate(NaN,NaN) rather than
 * being skipped, so a typo in an authored map file silently detaches that entity's tooltip.
 *
 * Note: a mapPath that is a bare path function renders all of the areas and then throws a
 * TypeError from the anchor positions, which read mapPath.projection(). An empty mergedData never
 * reaches that read, so the failure depends on the data.
 *
 * Note: the data join has no key function, so it is an index join. Reordering mergedData repaints
 * the existing nodes in place instead of moving them. The --entering class is added and removed
 * within the same chain, so it is never observable from outside a render and offers no enter-only
 * styling hook. See test/map/renderer/base.test.ts.
 *
 * @return {sszvis.component}
 */

import type { BaseType, ExtendedFeatureCollection, GeoPath, GeoProjection, Selection } from "d3";
import { select } from "d3";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapMissingValuePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { slowTransition } from "../../transition.js";
import { type GeoPoint, getGeoJsonCenter, type MergedGeoDatum } from "../mapUtils.js";

/**
 * A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. The
 * accessor parameter includes undefined because MergedGeoDatum.datum is optional, so an accessor
 * written for the wrapper's datum slot type-checks. The render calls these accessors only for a
 * feature whose datum exists, except on a layer where no feature has one - there fill is called
 * with undefined throughout, since the layer is drawing geometry rather than encoding values.
 */
type MapValue<T, R> = R | ((datum: T | undefined) => R);

/** Where a layer records the pattern id it was given, so re-renders reuse it. */
const MISSING_PATTERN_ID_ATTR = "data-sszvis-missing-pattern-id";

let missingPatternCount = 0;

/**
 * The id of this layer's missing-value pattern, assigning one the first time the layer is
 * rendered.
 *
 * Ids are document-global while the pattern definition lives inside each layer's own group, so a
 * fixed id would have two map layers on one page define it twice and every url(#...) reference in
 * the document resolve to whichever definition came first. The assigned id is cached on the layer
 * element rather than counted per render, so re-rendering a layer keeps its own definition.
 *
 * The selection parameters are generic because d3's Selection is invariant in its element
 * parameters - no single non-generic type accepts every selection.
 */
function missingPatternId<G extends BaseType, D, P extends BaseType, PD>(
  selection: Selection<G, D, P, PD>
): string {
  const assigned = selection.attr(MISSING_PATTERN_ID_ATTR);
  if (assigned) return assigned;
  const id = `missing-pattern-${++missingPatternCount}`;
  selection.attr(MISSING_PATTERN_ID_ATTR, id);
  return id;
}

/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredMapValue<T, R> = (datum?: T) => R;

type BaseProps<T> = {
  mergedData: MergedGeoDatum<T>[];
  geoJson?: ExtendedFeatureCollection;
  mapPath: GeoPath;
  defined: StoredMapValue<T, boolean>;
  fill: StoredMapValue<T, string>;
  transitionColor: boolean;
};

export interface MapRendererBaseComponent<T = unknown>
  extends ComponentBuilder<MapRendererBaseComponent<T>> {
  mergedData(): MergedGeoDatum<T>[];
  mergedData(data: MergedGeoDatum<T>[]): MapRendererBaseComponent<T>;
  /** @deprecated Declared and documented, but the render only ever reads mergedData. */
  geoJson(): ExtendedFeatureCollection | undefined;
  /** @deprecated Declared and documented, but the render only ever reads mergedData. */
  geoJson(value: ExtendedFeatureCollection): MapRendererBaseComponent<T>;
  mapPath(): GeoPath;
  mapPath(value: GeoPath): MapRendererBaseComponent<T>;
  defined(): StoredMapValue<T, boolean>;
  defined<U = T>(value: MapValue<U, boolean>): MapRendererBaseComponent<T>;
  fill(): StoredMapValue<T, string>;
  fill<U = T>(value: MapValue<U, string>): MapRendererBaseComponent<T>;
  transitionColor(): boolean;
  transitionColor(enabled: boolean): MapRendererBaseComponent<T>;
}

export default function <T = unknown>(): MapRendererBaseComponent<T> {
  return component<MapRendererBaseComponent<T>>()
    .prop("mergedData")
    .prop("geoJson")
    .prop("mapPath")
    .prop("defined", fn.functor)
    .defined(true) // a predicate function to determine whether a datum has a defined value
    .prop("fill", fn.functor)
    .fill(() => "black") // a function for the entity fill color. default is black
    .prop("transitionColor")
    .transitionColor(true)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<BaseProps<T>>();

      // render the missing value pattern, under an id of this layer's own
      const patternId = missingPatternId(selection);
      ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);

      // "Missing" only means something relative to a dataset. A layer where no entity has a datum
      // is being used for its geometry rather than to encode data - rastermap-bins.js draws the
      // choropleth as a transparent outline over a raster, with fill("none") and no data at all -
      // so texturing every entity there would paint over what the layer is meant to reveal. Such a
      // layer keeps the caller's fill and is not classed --undefined.
      const encodesData = props.mergedData.some((d) => fn.defined(d.datum));

      // Where a dataset is present, one notion of a missing value is shared by the fill and the
      // --undefined class: an entity the dataset does not cover is as missing as one the predicate
      // rejects. Short-circuiting also keeps both accessors from being called with undefined.
      function hasValue(d: MergedGeoDatum<T>): boolean {
        return !encodesData || (fn.defined(d.datum) && props.defined(d.datum));
      }

      // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
      function getMapFill(d: MergedGeoDatum<T>): string {
        return hasValue(d) ? props.fill(d.datum) : `url(#${patternId})`;
      }

      const mapAreas = selection
        .selectAll(".sszvis-map__area")
        .data(props.mergedData)
        .join("path")
        .classed("sszvis-map__area", true)
        .classed("sszvis-map__area--entering", true)
        .attr("data-event-target", "")
        .classed("sszvis-map__area--entering", false);

      mapAreas
        .classed("sszvis-map__area--undefined", (d) => !hasValue(d))
        .attr("d", (d) => props.mapPath(d.geoJson));

      // The fill is applied exactly once, so the transition has the previous colour to interpolate
      // from. Writing it to the plain selection first would put the final colour in the DOM before
      // the tween started, and the tween would then interpolate that colour onto itself.
      if (props.transitionColor) {
        mapAreas.transition().call(slowTransition).attr("fill", getMapFill);
      } else {
        mapAreas.attr("fill", getMapFill);
      }

      // the tooltip anchor generator
      const ta = tooltipAnchor<MergedGeoDatum<T>>().position((d) => {
        // Read inside the callback, as the JavaScript did: a mapPath without a projection is only
        // an error once there is an anchor to place, so an empty mergedData still renders.
        // d3's own typings expect the projection type as a type argument here. The runtime guard
        // below still covers a GeoPath whose projection was never set, and a mapPath that is a
        // bare path function with no projection method at all - which the JSDoc's {d3.geo.path}
        // contract permits but this component has never supported.
        const projection = props.mapPath.projection<GeoProjection>();
        if (typeof projection !== "function") {
          throw new TypeError(
            "map/renderer/base: mapPath must be a d3.geoPath with a projection, since the tooltip anchors are positioned with it"
          );
        }
        // The centre is handed over whole rather than narrowed to a pair. getGeoJsonCenter returns
        // number[] because an unvalidated `center` property can parse to any length, and the
        // JavaScript passed whatever it produced straight to the projection; truncating here would
        // change what a non-d3 projection function that reads past index 1 receives.
        const point = projection(getGeoJsonCenter(d.geoJson) as GeoPoint);
        // Only a hand-written projection can return null here: d3's own projections clip in the
        // stream, not in the point call, and return a pair - of NaN, for a malformed centre. A null
        // is passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
        // translateString and renders transform="translate(undefined,undefined)". Substituting a
        // NaN pair here would put a different attribute value in the DOM for the same input.
        return point as [number, number];
      });

      const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });
}
