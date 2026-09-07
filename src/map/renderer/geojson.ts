/**
 * geojson renderer component
 *
 * @module sszvis/map/renderer/geojson
 *
 * A component used for rendering overlays of geojson above map layers.
 * It can be used to render any arbitrary GeoJson.
 *
 * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
 *                                          with geographic entities. Default 'geoId'.
 * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
 *                                          with data entities. Default 'id'.
 * @property {GeoJson} geoJson              The GeoJson object which should be rendered. Needs to have a 'features' property.
 * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
 * @property {Function, Boolean} defined    A function which, when given a data value, returns whether or not data in that value is defined.
 * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
 * @property {String} stroke                The stroke color of the entities. Can be a string or a function returning a string. Default black.
 * @property {Number} strokeWidth           The thickness of the strokes of the shapes. Can be a number or a function returning a number. Default 1.25.
 * @property {Boolean} transitionColor      Whether or not to transition the fill color of the geojson when it changes. Default true.
 *
 * @return {sszvis.component}
 */

import {
  dispatch,
  type ExtendedFeature,
  type ExtendedFeatureCollection,
  type GeoPath,
  type GeoProjection,
  geoCentroid,
  select,
} from "d3";
import type { GeoJsonProperties } from "geojson";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { type Component, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapMissingValuePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { slowTransition } from "../../transition.js";
import { GEO_KEY_DEFAULT } from "../mapUtils.js";

/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type GeoJsonValue<T, R> = R | ((datum: T) => R);

/**
 * How a functor-wrapped prop reads back once it is stored: always a function. The parameter is
 * typed as unknown because the data lookup reads through a plain object's prototype chain, so an
 * accessor can be handed something that is not a datum at all.
 */
type StoredGeoJsonValue<R> = (datum: unknown) => R;

/**
 * A feature paired with whatever the data lookup produced for it. `datum` is unknown rather than
 * the caller's datum type because the lookup reads through a plain object's prototype chain.
 */
interface MergedFeature {
  geoJson: ExtendedFeature;
  datum: unknown;
}

/** The properties this renderer reads from, and caches onto, a feature. */
interface GeoJsonFeatureProperties {
  sphericalCentroid?: [number, number];
  [key: string]: unknown;
}

type GeoJsonProps = {
  dataKeyName: string;
  geoJsonKeyName: string;
  geoJson: ExtendedFeatureCollection;
  mapPath: GeoPath;
  defined: StoredGeoJsonValue<boolean>;
  fill: StoredGeoJsonValue<string>;
  stroke: StoredGeoJsonValue<string>;
  strokeWidth: (datum?: MergedFeature) => number;
  transitionColor: boolean;
};

/** A handler as this component's own event API delivers it. */
type GeoJsonEventHandler = (datum: unknown) => void;

export interface MapRendererGeoJsonComponent<T = unknown> extends Component {
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
  /**
   * Note that a strokeWidth accessor is called with the merged { geoJson, datum } wrapper, not
   * with the datum, unlike fill and stroke.
   */
  strokeWidth(): (datum?: MergedFeature) => number;
  strokeWidth<D = MergedFeature>(
    value: number | ((datum: D) => number)
  ): MapRendererGeoJsonComponent<T>;
  on(eventName: string, handler: GeoJsonEventHandler): MapRendererGeoJsonComponent<T>;
  on(eventName: string): GeoJsonEventHandler | undefined;
  transitionColor(): boolean;
  transitionColor(enabled: boolean): MapRendererGeoJsonComponent<T>;
}

/**
 * Reads a key off a feature's properties. The JavaScript used fn.prop, which indexes without a
 * guard, so a feature with spec-legal `properties: null` crashed the merge. The message matches
 * what that read produced.
 */
function readFeatureKey(properties: GeoJsonProperties, key: string): unknown {
  if (properties === null || properties === undefined) {
    throw new TypeError(`Cannot read properties of ${properties} (reading '${key}')`);
  }
  return properties[key];
}

/**
 * Normalises a lookup key exactly as a property access does: a symbol stays a symbol key, so two
 * symbols with the same description remain distinct and can never be matched by a string id.
 * Everything else stringifies, which is how a missing key becomes the string "undefined".
 */
function toLookupKey(value: unknown): string | symbol {
  return typeof value === "symbol" ? value : String(value);
}

/**
 * Reproduces what this component's event handlers have always done. The JavaScript called
 * `event.over(datum)`, but d3's dispatch provides only on, call, apply and copy - there has never
 * been a per-type method - so the call threw before any registered handler was reached. That is
 * why .on("over"|"out"|"click") has never delivered anything. The throw is unconditional because
 * the call could never succeed; the message is the one V8 produced for the original expression.
 * Transcribed rather than corrected so the port does not change behaviour - the fix is to use
 * event.apply(type, this, args), as src/behavior/panning.ts already does.
 */
function emitLegacy(type: "over" | "out" | "click"): never {
  throw new TypeError(`event.${type} is not a function`);
}

export default function <
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

      // render the missing value pattern
      ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

      // getDataKeyName will be called on data values. It should return a map entity id.
      // getMapKeyName will be called on the 'properties' of each map feature. It should
      // return a map entity id. Data values are matched with corresponding map features using
      // these entity ids.
      const getDataKeyName = fn.prop(props.dataKeyName);

      // The JavaScript grouped the data with `data.reduce((m, v) => { m[key(v)] = v; return m; })`
      // and no initial value, so the first datum became the accumulator: it is never an entry of
      // its own table, the rest of the data are written onto it, and an empty array throws.
      // Written as an explicit loop here so the table has a type; the behaviour is unchanged.
      if (data.length === 0) {
        throw new TypeError("Reduce of empty array with no initial value");
      }
      const [firstDatum, ...remainingData] = data;
      const groupedInputData: Record<string | symbol, unknown> = firstDatum;
      for (const datum of remainingData) {
        groupedInputData[toLookupKey(getDataKeyName(datum))] = datum;
      }

      const mergedData: MergedFeature[] = props.geoJson.features.map((feature) => ({
        geoJson: feature,
        datum:
          groupedInputData[toLookupKey(readFeatureKey(feature.properties, props.geoJsonKeyName))],
      }));

      function getMapFill(d: MergedFeature): string {
        return fn.defined(d.datum) && props.defined(d.datum)
          ? props.fill(d.datum)
          : "url(#missing-pattern)";
      }

      function getMapStroke(d: MergedFeature): string {
        return fn.defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
      }

      const geoElements = selection
        .selectAll(".sszvis-map__geojsonelement")
        .data(mergedData)
        .join("path")
        .classed("sszvis-map__geojsonelement", true)
        .attr("data-event-target", "")
        .attr("fill", getMapFill);

      selection
        .selectAll<Element, MergedFeature>(".sszvis-map__geojsonelement--undefined")
        .attr("fill", getMapFill);

      geoElements
        .classed(
          "sszvis-map__geojsonelement--undefined",
          (d) => !fn.defined(d.datum) || !props.defined(d.datum)
        )
        .attr("d", (d) => props.mapPath(d.geoJson));

      if (props.transitionColor) {
        geoElements.transition().call(slowTransition).attr("fill", getMapFill);
      } else {
        geoElements.attr("fill", getMapFill);
      }

      geoElements.attr("stroke", getMapStroke).attr("stroke-width", props.strokeWidth);

      // The JavaScript read `.datum` off each listener's first parameter. d3 v6 and later call a
      // listener with (event, datum), so that read was always of the DOM event and always
      // undefined; the emit below throws before the value is used either way.
      selection
        .selectAll("[data-event-target]")
        .on("mouseover", () => {
          emitLegacy("over");
        })
        .on("mouseout", () => {
          emitLegacy("out");
        })
        .on("click", () => {
          emitLegacy("click");
        });

      // the tooltip anchor generator
      const ta = tooltipAnchor<MergedFeature>().position((d) => {
        const properties: GeoJsonFeatureProperties =
          d.geoJson.properties || (d.geoJson.properties = {});

        let sphericalCentroid = properties.sphericalCentroid;
        if (!sphericalCentroid) {
          properties.sphericalCentroid = sphericalCentroid = geoCentroid(d.geoJson);
        }

        // d3's own typings expect the projection type as a type argument here.
        const point = props.mapPath.projection<GeoProjection>()(sphericalCentroid);
        // Only a hand-written projection can return null: d3's projections clip in the stream,
        // not in the point call, and return a pair - of NaN, for a degenerate centroid.
        return point ?? [Number.NaN, Number.NaN];
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
