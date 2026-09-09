/**
 * geojson renderer component
 *
 * @module sszvis/map/renderer/geojson
 *
 * @template T The type of the data values merged onto the geojson features
 *
 * A component used for rendering overlays of geojson above map layers.
 * It can be used to render any arbitrary GeoJson.
 *
 * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
 *                                          with geographic entities. Default 'geoId'.
 * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
 *                                          with data entities. Default 'id'.
 * @property {GeoJson} geoJson              The GeoJson object which should be rendered. It is read unguarded, so a value
 *                                          without a 'features' property throws a TypeError.
 * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
 * @property {Function, Boolean} defined    A predicate used to determine whether a datum has a defined value. Entities
 *                                          that fail it, and entities with no datum at all, display the missing value
 *                                          texture. It is wrapped in fn.functor and defaults to the constant true, so a
 *                                          constant false textures the whole overlay and the default never rejects
 *                                          anything.
 * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
 * @property {String, Function} stroke      The stroke color of the entities. Can be a string or a function returning a
 *                                          string, called with the datum. Default black. Undefined entities are not
 *                                          asked for a stroke at all; see the note below.
 * @property {Number, Function} strokeWidth The thickness of the strokes of the shapes. A number, or a function
 *                                          returning a number, called with the datum as the fill and stroke
 *                                          accessors are. Default 1.25. Undefined entities are not asked for a
 *                                          stroke width; they carry no stroke-width attribute.
 * @property {Boolean} transitionColor      Whether to transition the fill color of the geojson entities. Default true.
 *                                          With it set the fill is only applied through the transition, so a color change
 *                                          fades from the previous color; with it unset the fill is written synchronously.
 *                                          An entering entity has no previous color, so it takes the final color at the
 *                                          first tick. Only a color-to-color change is transitioned; an entity entering or
 *                                          leaving the missing value texture takes its fill synchronously either way,
 *                                          since a paint-server reference cannot be interpolated.
 *
 * Note: lookup keys are stringified, so a numeric and a string id that print the same collide. A
 * symbol key stays a symbol and can never be matched by a string id. A feature or datum with no
 * key at all is left unmatched.
 *
 * Note: anchor positions go through getGeoJsonCenter, the same source the base renderer uses, so an
 * authored `center` property is honoured here too and a feature drawn by both renderers anchors in
 * one place. That centre is computed on every render and nothing is written back to the feature,
 * so moving a feature's geometry moves its anchor with it.
 *
 * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
 * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
 * attribute or asking for no stroke.
 *
 * Note: the missing value pattern is written into a defs element inside each layer, under an id of
 * that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: one quirk remains, shared with the base renderer. The data join has no key function, so it
 * is an index join: reordering the features repaints the existing nodes in place instead of moving
 * them.
 *
 * See test/map/renderer/geojson.test.ts.
 *
 * @return {sszvis.component}
 */

import {
  dispatch,
  type ExtendedFeature,
  type ExtendedFeatureCollection,
  type GeoPath,
  type GeoProjection,
  select,
} from "d3";
import type { GeoJsonProperties } from "geojson";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapMissingValuePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { slowTransition } from "../../transition.js";
import {
  GEO_KEY_DEFAULT,
  type GeoPoint,
  getGeoJsonCenter,
  isPaintServer,
  missingPatternId,
  toLookupKey,
} from "../mapUtils.js";

/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type GeoJsonValue<T, R> = R | ((datum: T) => R);

/**
 * How a functor-wrapped prop reads back once it is stored: always a function. The parameter is
 * typed as unknown because the data lookup is keyed at runtime and cannot promise the caller's
 * datum type.
 */
type StoredGeoJsonValue<R> = (datum: unknown) => R;

/**
 * A feature paired with whatever the data lookup produced for it. `datum` is unknown rather than
 * the caller's datum type because the lookup is keyed at runtime; it is undefined where the
 * feature had no matching datum.
 */
interface MergedFeature {
  geoJson: ExtendedFeature;
  datum: unknown;
}

type GeoJsonProps = {
  dataKeyName: string;
  geoJsonKeyName: string;
  geoJson: ExtendedFeatureCollection;
  mapPath: GeoPath;
  defined: StoredGeoJsonValue<boolean>;
  fill: StoredGeoJsonValue<string>;
  stroke: StoredGeoJsonValue<string>;
  strokeWidth: StoredGeoJsonValue<number>;
  transitionColor: boolean;
};

/** A handler as this component's own event API delivers it. */
type GeoJsonEventHandler = (datum: unknown) => void;

export interface MapRendererGeoJsonComponent<T = unknown> extends ComponentBuilder<
  MapRendererGeoJsonComponent<T>
> {
  dataKeyName(): string;
  dataKeyName(value: string): MapRendererGeoJsonComponent<T>;
  geoJsonKeyName(): string;
  geoJsonKeyName(value: string): MapRendererGeoJsonComponent<T>;
  geoJson(): ExtendedFeatureCollection;
  geoJson(value: ExtendedFeatureCollection): MapRendererGeoJsonComponent<T>;
  mapPath(): GeoPath;
  mapPath(value: GeoPath): MapRendererGeoJsonComponent<T>;
  defined(): StoredGeoJsonValue<boolean>;
  defined<U = T>(value: GeoJsonValue<U, boolean>): MapRendererGeoJsonComponent<T>;
  fill(): StoredGeoJsonValue<string>;
  fill<U = T>(value: GeoJsonValue<U, string>): MapRendererGeoJsonComponent<T>;
  stroke(): StoredGeoJsonValue<string>;
  stroke<U = T>(value: GeoJsonValue<U, string>): MapRendererGeoJsonComponent<T>;
  strokeWidth(): StoredGeoJsonValue<number>;
  strokeWidth<U = T>(value: GeoJsonValue<U, number>): MapRendererGeoJsonComponent<T>;
  on(eventName: string, handler: GeoJsonEventHandler): MapRendererGeoJsonComponent<T>;
  on(eventName: string): GeoJsonEventHandler | undefined;
  transitionColor(): boolean;
  transitionColor(enabled: boolean): MapRendererGeoJsonComponent<T>;
}

/**
 * Reads a match key off a feature's properties. RFC 7946 permits a null properties member, and a
 * feature may simply not carry the configured key, so both cases read as undefined - which the
 * merge treats as unmatched rather than as the lookup key "undefined".
 */
function readFeatureKey(properties: GeoJsonProperties, key: string): unknown {
  return properties === null || properties === undefined ? undefined : properties[key];
}

export default function mapRendererGeoJson<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): MapRendererGeoJsonComponent<T> {
  const event = dispatch("over", "out", "click");

  const geojsonComponent = component()
    .prop("dataKeyName")
    .dataKeyName(GEO_KEY_DEFAULT)
    .prop("geoJsonKeyName")
    .geoJsonKeyName("id")
    .prop("geoJson")
    .prop("mapPath")
    .prop("defined", fn.functor)
    .defined(true)
    .prop("fill", fn.functor)
    .fill("black")
    .prop("stroke", fn.functor)
    .stroke("black")
    .prop("strokeWidth", fn.functor)
    .strokeWidth(1.25)
    .prop("transitionColor")
    .transitionColor(true)
    .render(function (this: Element, data: T[]) {
      const selection = select(this);
      const props = selection.props<GeoJsonProps>();

      // render the missing value pattern, under an id of this layer's own
      const patternId = missingPatternId(selection);
      ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);

      // getDataKeyName will be called on data values. It should return a map entity id.
      // getMapKeyName will be called on the 'properties' of each map feature. It should
      // return a map entity id. Data values are matched with corresponding map features using
      // these entity ids.
      const getDataKeyName = fn.prop(props.dataKeyName);

      // A prototype-less table, so a feature keyed after an Object.prototype member - "valueOf",
      // say - cannot resolve to the inherited function, and so that the caller's data are never
      // written to.
      const groupedInputData: Record<string | symbol, unknown> = Object.create(null);
      for (const datum of data) {
        // A datum with no key is skipped rather than filed under the string "undefined", where it
        // would have become the datum for every feature that also lacks a key.
        const key = getDataKeyName(datum);
        if (key === undefined) continue;
        groupedInputData[toLookupKey(key)] = datum;
      }

      const mergedData: MergedFeature[] = props.geoJson.features.map((feature) => {
        const key = readFeatureKey(feature.properties, props.geoJsonKeyName);
        return {
          geoJson: feature,
          datum: key === undefined ? undefined : groupedInputData[toLookupKey(key)],
        };
      });

      function getMapFill(d: MergedFeature): string {
        return fn.defined(d.datum) && props.defined(d.datum)
          ? props.fill(d.datum)
          : `url(#${patternId})`;
      }

      function getMapStroke(d: MergedFeature): string {
        return fn.defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
      }

      // Guarded like fill and stroke: an unmatched feature is not asked for a stroke width, and
      // returning null removes the attribute rather than handing the accessor undefined.
      function getMapStrokeWidth(d: MergedFeature): number | null {
        return fn.defined(d.datum) && props.defined(d.datum) ? props.strokeWidth(d.datum) : null;
      }

      const geoElements = selection
        .selectAll<SVGPathElement, MergedFeature>(".sszvis-map__geojsonelement")
        .data(mergedData)
        .join("path")
        .classed("sszvis-map__geojsonelement", true)
        .attr("data-event-target", "");

      geoElements
        .classed(
          "sszvis-map__geojsonelement--undefined",
          (d) => !fn.defined(d.datum) || !props.defined(d.datum),
        )
        .attr("d", (d) => props.mapPath(d.geoJson));

      // The fill is applied exactly once, so the transition has the previous color to interpolate
      // from, and only a color-to-color change is tweened - a paint-server reference cannot be
      // interpolated. Both rules are the base renderer's; see src/map/renderer/base.ts.
      if (props.transitionColor) {
        const tweenable = function (this: SVGPathElement, d: MergedFeature): boolean {
          return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
        };
        geoElements.filter(tweenable).transition(slowTransition()).attr("fill", getMapFill);
        geoElements
          .filter(function (this: SVGPathElement, d: MergedFeature) {
            return !tweenable.call(this, d);
          })
          .attr("fill", getMapFill);
      } else {
        geoElements.attr("fill", getMapFill);
      }

      geoElements.attr("stroke", getMapStroke).attr("stroke-width", getMapStrokeWidth);

      // d3 v6 and later call a listener with (event, datum), and the datum here is the merged
      // { geoJson, datum } wrapper - the handler is given the entity's own datum.
      geoElements
        .on("mouseover", function (_pointerEvent, d) {
          event.call("over", this, d.datum);
        })
        .on("mouseout", function (_pointerEvent, d) {
          event.call("out", this, d.datum);
        })
        .on("click", function (_pointerEvent, d) {
          event.call("click", this, d.datum);
        });

      // the tooltip anchor generator
      const ta = tooltipAnchor<MergedFeature>().position((d) => {
        // The same centre the base renderer uses, so a feature drawn by both places its tooltip
        // in one spot: an authored `center` property is honoured, and the result is computed per
        // render rather than written back onto the caller's feature. A feature with the
        // spec-legal `properties: null` falls straight through to the computed centroid.
        const center = getGeoJsonCenter(d.geoJson) as GeoPoint;

        // d3's own typings expect the projection type as a type argument here.
        const point = props.mapPath.projection<GeoProjection>()(center);
        // Only a hand-written projection can return null: d3's projections clip in the stream,
        // not in the point call, and return a pair - of NaN, for a degenerate centroid. A null is
        // passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
        // translateString and renders transform="translate(undefined,undefined)". Substituting a
        // NaN pair here would put a different attribute value in the DOM for the same input.
        return point as [number, number];
      });

      const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });

  // The argument tuple is typed as src/behavior/panning.ts types its own on(): d3's dispatch.on
  // derives its callback type from a *literal* event name, so a plain string collapses the
  // callback to never. Narrowing to "over" | "out" | "click" would type the callback properly but
  // would also reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  geojsonComponent.on = function (this: MapRendererGeoJsonComponent<T>, ...args: [string, never]) {
    const value = event.on.apply(event, args);
    return value === event ? geojsonComponent : value;
  };

  return geojsonComponent;
}
