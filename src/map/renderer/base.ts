/**
 * base renderer component
 *
 * @module sszvis/map/renderer/base
 *
 * A component used internally for rendering the base layer of maps.
 * These map entities have a color fill, which is possibly a pattern that represents
 * missing values. They are also event targets. If your map has nothing else, it should have a
 * base layer.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
 *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
 *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {Boolean} transitionColor                Whether or not to transition the fill color of the map entities. (default: true)
 *
 * @return {sszvis.component}
 */

import type { ExtendedFeatureCollection, GeoPath, GeoProjection } from "d3";
import { select } from "d3";
import tooltipAnchor from "../../annotation/tooltipAnchor.js";
import { type Component, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapMissingValuePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";
import { slowTransition } from "../../transition.js";
import { type GeoPoint, getGeoJsonCenter, type MergedGeoDatum } from "../mapUtils.js";

/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type MapValue<T, R> = R | ((datum: T) => R);

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

export interface MapRendererBaseComponent<T = unknown> extends Component {
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

/**
 * Narrows a centre to the pair d3's projections read. getGeoJsonCenter returns number[], since an
 * unvalidated `center` property can parse to any length; a projection reads only the first two
 * entries, so this makes that explicit without changing what is passed. Components past the second
 * are dropped, which only matters for a non-d3 projection function that reads past index 1.
 */
function toGeoPoint(center: number[]): GeoPoint {
  return [center[0], center[1]];
}

export default function <T = unknown>(): MapRendererBaseComponent<T> {
  return component()
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

      // render the missing value pattern
      ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);

      // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
      function getMapFill(d: MergedGeoDatum<T>): string {
        return props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
      }

      const mapAreas = selection
        .selectAll(".sszvis-map__area")
        .data(props.mergedData)
        .join("path")
        .classed("sszvis-map__area", true)
        .classed("sszvis-map__area--entering", true)
        .attr("data-event-target", "")
        .attr("fill", getMapFill)
        .classed("sszvis-map__area--entering", false);

      selection
        .selectAll<Element, MergedGeoDatum<T>>(".sszvis-map__area--undefined")
        .attr("fill", getMapFill);

      // change the fill if necessary
      mapAreas
        .classed(
          "sszvis-map__area--undefined",
          (d) => !fn.defined(d.datum) || !props.defined(d.datum)
        )
        .attr("d", (d) => props.mapPath(d.geoJson));

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
        const point = projection(toGeoPoint(getGeoJsonCenter(d.geoJson)));
        // Only a hand-written projection can return null here: d3's own projections clip in the
        // stream, not in the point call, and return a pair - of NaN, for a malformed centre. The
        // NaN pair keeps such a point on the same transform path the malformed-centre case takes.
        return point ?? [Number.NaN, Number.NaN];
      });

      const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);

      // attach tooltip anchors
      tooltipGroup.call(ta);
    });
}
