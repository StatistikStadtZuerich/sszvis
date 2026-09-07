/**
 * mesh renderer component
 *
 * @module sszvis/map/renderer/mesh
 *
 * A component used internally for rendering the borders of all map entities as a single mesh.
 * This component expects a GeoJson object which is a single polyline for the entire mesh of all borders.
 * All borders will therefore be rendered as one continuous object, which is faster, more memory-efficient,
 * and prevents overlapping borders from creating strange rendering effects. The downside is that the entire
 * line must have a single set of styles which all borders share. To highlight individual borders, use the highlight renderer.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 * @property {string, function} borderColor           The color of the border path stroke. Default is white
 * @property {number, function} strokeWidth           The width of the border path stroke. Default is 1.25.
 *                                                    An invalid value is dropped by the CSS parser rather than
 *                                                    reported, leaving SVG's initial width of 1.
 *
 * @return {sszvis.component}
 */

import type { BaseType, GeoPermissibleObjects, ValueFn } from "d3";
import { select } from "d3";
import { type Component, component } from "../../d3-component.js";

/**
 * A path generator, as this component uses one. A d3.geoPath satisfies this shape, and so does a
 * bare generator function, which is all the runtime requires. It is handed straight to d3 as the
 * attribute callback, so d3 invokes it with the mesh, its index and the group; d3-geo forwards the
 * extra arguments to its own accessors.
 */
type MeshPath = ValueFn<BaseType, GeoPermissibleObjects, string | null>;

/**
 * A constant or an accessor. Neither of this component's style props is wrapped in fn.functor, so
 * an accessor is called by d3 with the mesh object itself rather than with a per-entity datum -
 * there is only one path, so there is no such datum. An accessor may resolve to null to leave the
 * style off, which is how d3 reads it; at runtime undefined does the same, though d3's own types
 * do not say so.
 */
type MeshValue<R extends string | number> = R | ValueFn<BaseType, GeoPermissibleObjects, R | null>;

/**
 * The props as this component's contract describes them, which is deliberately narrower than what
 * the runtime tolerates. geoJson and mapPath are required here even though neither is validated -
 * omitting either leaves a classed, styled path with no geometry rather than raising, which the
 * characterization tests pin, and which is why the component's getters report them as possibly
 * undefined. Widening these two to optional would force the bound datum to include undefined,
 * which no d3 geoPath can be typed against, so the contract is stated here and the runtime
 * behaviour is left to the tests.
 */
type MeshProps = {
  geoJson: GeoPermissibleObjects;
  mapPath: MeshPath;
  borderColor: MeshValue<string>;
  strokeWidth: MeshValue<number>;
};

export interface MapRendererMeshComponent extends Component {
  geoJson(): GeoPermissibleObjects | undefined;
  geoJson(value: GeoPermissibleObjects): MapRendererMeshComponent;
  mapPath(): MeshPath | undefined;
  mapPath(value: MeshPath): MapRendererMeshComponent;
  borderColor(): MeshValue<string>;
  borderColor(value: MeshValue<string>): MapRendererMeshComponent;
  strokeWidth(): MeshValue<number>;
  strokeWidth(value: MeshValue<number>): MapRendererMeshComponent;
}

/**
 * Normalises a style prop into the single accessor shape d3's overloads can resolve. An accessor
 * is passed through untouched, so it keeps receiving d3's arguments and node context; a constant
 * becomes a function returning it, which d3 applies identically - the constant and function paths
 * both end in the same setProperty call. Follows the idiom of src/component/dot.ts, minus its
 * nullish fallback: both props here have defaults, so a constant is never nullish.
 */
function toStyleValue<R extends string | number>(
  value: MeshValue<R>
): ValueFn<BaseType, GeoPermissibleObjects, R | null> {
  return typeof value === "function" ? value : () => value;
}

export default function (): MapRendererMeshComponent {
  return component()
    .prop("geoJson")
    .prop("mapPath")
    .prop("borderColor")
    .borderColor("white") // A function or string for the color of all borders. Note: all borders have the same color
    .prop("strokeWidth")
    .strokeWidth(1.25)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<MeshProps>();

      // add the map borders. These are rendered as one single path element
      const meshLine = selection
        .selectAll(".sszvis-map__border")
        .data([props.geoJson])
        .join("path")
        .classed("sszvis-map__border", true);

      meshLine
        .attr("d", props.mapPath)
        .style("stroke", toStyleValue(props.borderColor))
        .style("stroke-width", toStyleValue(props.strokeWidth));
    });
}
