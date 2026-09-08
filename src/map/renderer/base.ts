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
 *                                                    datum that exists. It is stored through storeMapValue, which records whether the
 *                                                    caller passed an accessor or a constant, and defaults to the
 *                                                    constant true, so a constant false textures the whole map. It is not
 *                                                    consulted at all on a geometry-only layer; see encodesData.
 * @property {Boolean} encodesData                    Whether this layer paints values or plain geometry. No default: left
 *                                                    unset it is inferred, per the note below. Set true to texture every
 *                                                    entity the dataset does not cover; set false to draw shapes rather
 *                                                    than values, where nothing is textured, nothing is classed
 *                                                    --undefined, and the fill accessor is called with undefined
 *                                                    throughout.
 * @property {String, Function} fill                  A string or function for the fill of the map entities. Defaults to the
 *                                                    constant black - a constant, so that the default layer draws geometry
 *                                                    until a datum matches rather than encoding data from the start. An accessor is
 *                                                    called with the entity's datum, and is not called at all for an entity
 *                                                    the dataset does not cover - that one is textured instead. On a layer
 *                                                    that draws geometry, though, nothing is textured and the accessor is
 *                                                    called with undefined for every entity.
 * @property {Boolean} transitionColor                Whether to transition the fill color of the map entities.
 *                                                    (default: true) With it set, the fill is only applied through the
 *                                                    transition, so a color change fades from the previous color; with it
 *                                                    unset the fill is written synchronously. An entering entity has no
 *                                                    previous color, so it takes the final color at the first tick. Only a
 *                                                    color-to-color change is transitioned; an entity entering or leaving
 *                                                    the missing value texture takes its fill synchronously either way,
 *                                                    since a paint-server reference cannot be interpolated.
 *
 * Note: the fill transition runs for 500ms with easePolyOut, the slow transition's timing.
 *
 * Note: "missing" only means something relative to a dataset, so a layer drawing geometry rather
 * than values has nothing to be missing from. Which one a layer is can be declared outright with
 * encodesData; left unset, it is inferred from what the layer's own accessors need. A fill or
 * defined supplied as a function has to be handed a datum, so the layer encodes values even before
 * its data arrives - the case that used to call that accessor with undefined and crash. Supplied
 * as constants they need nothing, so the layer draws geometry until a datum actually matches, and
 * an outline over a raster keeps its fill as it always has. rastermap-bins.js is the canonical
 * geometry-only layer and says so with encodesData(false) rather than relying on the inference.
 *
 * Note: the missing value pattern is written into a defs element inside each map layer, under an id
 * of that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: rendering does not mutate the geojson it is handed. Anchor positions go through
 * getGeoJsonCenter, which computes the centre on every call and writes nothing back, so a feature
 * whose geometry or `center` changes between renders gets an anchor that follows it. A malformed
 * `center` property is warned about and ignored in favour of the computed centroid, so a typo in
 * an authored map file is visible in the console rather than detaching that entity's tooltip.
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

import type { ExtendedFeatureCollection, GeoPath, GeoProjection } from "d3";
import { select } from "d3";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapMissingValuePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { slowTransition } from "../../transition.js";
import {
  type GeoPoint,
  getGeoJsonCenter,
  isPaintServer,
  type MergedGeoDatum,
  missingPatternId,
} from "../mapUtils.js";

/**
 * A constant or an accessor; both are accepted, since these props are stored through
 * `storeMapValue`, which wraps either the way `fn.functor` would while recording which it was. The
 * accessor parameter includes undefined because MergedGeoDatum.datum is optional, so an accessor
 * written for the wrapper's datum slot type-checks. The render calls these accessors only for a
 * feature whose datum exists, except on a layer where no feature has one - there fill is called
 * with undefined throughout, since the layer is drawing geometry rather than encoding values.
 */
type MapValue<T, R> = R | ((datum: T | undefined) => R);

/**
 * How a functor-wrapped prop reads back once it is stored: always a function, carrying whether
 * the caller supplied an accessor rather than a constant. `fn.functor` erases that distinction,
 * and the render needs it: an accessor is a promise that the entity has a datum to read, which is
 * what separates a layer drawing values from one drawing geometry. See `encodesData`.
 */
interface StoredMapValue<T, R> {
  (datum?: T): R;
  needsDatum: boolean;
}

/**
 * Wraps a constant or an accessor the way fn.functor does, recording which it was. Written out
 * rather than delegating to fn.functor, whose accessor is nullary while these take the datum.
 */
function storeMapValue<T, R>(value: MapValue<T, R>): StoredMapValue<T, R> {
  const needsDatum = typeof value === "function";
  const accessor = value as (datum?: T) => R;
  const stored = (needsDatum ? (datum?: T) => accessor(datum) : () => value as R) as StoredMapValue<
    T,
    R
  >;
  stored.needsDatum = needsDatum;
  return stored;
}

type BaseProps<T> = {
  mergedData: MergedGeoDatum<T>[];
  geoJson?: ExtendedFeatureCollection;
  mapPath: GeoPath;
  defined: StoredMapValue<T, boolean>;
  encodesData?: boolean;
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
  encodesData(): boolean | undefined;
  encodesData(value: boolean): MapRendererBaseComponent<T>;
  fill(): StoredMapValue<T, string>;
  fill<U = T>(value: MapValue<U, string>): MapRendererBaseComponent<T>;
  transitionColor(): boolean;
  transitionColor(enabled: boolean): MapRendererBaseComponent<T>;
}

export default function mapRendererBase<T = unknown>(): MapRendererBaseComponent<T> {
  return component<MapRendererBaseComponent<T>>()
    .prop("mergedData")
    .prop("geoJson")
    .prop("mapPath")
    .prop("defined", storeMapValue)
    .defined(true) // a predicate function to determine whether a datum has a defined value
    .prop("encodesData")
    .prop("fill", storeMapValue)
    .fill("black") // a constant: an accessor would make every default layer encode data
    .prop("transitionColor")
    .transitionColor(true)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<BaseProps<T>>();

      // render the missing value pattern, under an id of this layer's own
      const patternId = missingPatternId(selection);
      ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);

      // Whether this layer paints values or plain geometry. The caller can say so outright; left
      // unset it is inferred, and the inference asks what the layer's own accessors need rather
      // than what its data happens to contain. An accessor for the fill or the predicate has to be
      // handed a datum, so the layer is encoding values whether or not its data has arrived yet -
      // which is the case that used to crash. Constants need nothing, so a layer built from them
      // is drawing geometry until a datum actually matches.
      const encodesData =
        props.encodesData ??
        (props.fill.needsDatum ||
          props.defined.needsDatum ||
          props.mergedData.some((d) => fn.defined(d.datum)));

      // On a data layer, one notion of a missing value is shared by the fill and the --undefined
      // class: an entity the dataset does not cover is as missing as one the predicate rejects.
      // Short-circuiting also keeps both accessors from being called with undefined. A layer
      // drawing geometry has nothing to be missing from, so it skips both.
      function hasValue(d: MergedGeoDatum<T>): boolean {
        return !encodesData || (fn.defined(d.datum) && props.defined(d.datum));
      }

      // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
      function getMapFill(d: MergedGeoDatum<T>): string {
        return hasValue(d) ? props.fill(d.datum) : `url(#${patternId})`;
      }

      const mapAreas = selection
        // Typed to the element the join creates, so the fill filters below can read the fill
        // currently in the DOM without narrowing d3's nullable BaseType at every call.
        .selectAll<SVGPathElement, MergedGeoDatum<T>>(".sszvis-map__area")
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
      //
      // Only a colour-to-colour change can be tweened. d3 has no interpolator for a paint-server
      // reference, so it falls back to interpolating the numbers embedded in the two strings: the
      // "-1" of "url(#missing-pattern-1)" pairs with a colour's channels and the tween spends its
      // whole run pointing at patterns that do not exist - "url(#missing-pattern255)" - which paint
      // nothing, so the area vanishes until the transition lands. An area entering or leaving the
      // missing-value texture therefore takes its fill synchronously.
      if (props.transitionColor) {
        const tweenable = function (this: SVGPathElement, d: MergedGeoDatum<T>): boolean {
          return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
        };
        mapAreas.filter(tweenable).transition(slowTransition()).attr("fill", getMapFill);
        mapAreas
          .filter(function (this: SVGPathElement, d: MergedGeoDatum<T>) {
            return !tweenable.call(this, d);
          })
          .attr("fill", getMapFill);
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
