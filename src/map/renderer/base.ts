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
 *                                                    entities that fail it display the missing value texture. It is wrapped
 *                                                    in fn.functor and defaults to the constant true, so a constant false
 *                                                    textures the whole map and the default never rejects anything; see the
 *                                                    note below on features with no datum.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {Boolean} transitionColor                Whether to schedule a transition on the fill color of the map entities.
 *                                                    (default: true) The transition does not currently animate anything; see
 *                                                    the note below.
 *
 * Note: the fill is written to the plain selection during the data join and the transition then
 * re-applies the same value, so the color tween interpolates a color onto itself and the final
 * color is already in the DOM before the transition starts. transitionColor changes whether a
 * tween is scheduled, not whether anything animates.
 *
 * Note: the scheduled transition keeps d3's defaults of 250ms and easeCubicInOut rather than the
 * intended 500ms easePolyOut. `.transition().call(slowTransition)` returns the original
 * transition, while slowTransition ignores its argument and builds a fresh detached transition
 * that is discarded.
 *
 * Note: the fill and the --undefined class use different notions of a missing value. The fill
 * consults props.defined alone, which defaults to a constant true, while the class also consults
 * fn.defined(d.datum). A feature with no datum is therefore classed --undefined but painted with
 * the ordinary fill, and the fill accessor is called with undefined for it.
 *
 * Note: the missing value pattern is written into a defs element inside each map layer with the
 * fixed id "missing-pattern". Two map layers on one page emit two definitions of that id, and
 * every url(#missing-pattern) reference in the document resolves to whichever comes first.
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
