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
 *                                                    Required: omitting it throws a TypeError, which is why the
 *                                                    getter reports it as possibly undefined.
 * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
 *                                                    Required: omitting it throws a TypeError too.
 * @property {string} key                             Identifies this mesh within its layer. Default "border". Two
 *                                                    meshes in one group need distinct keys to coexist; two sharing a
 *                                                    key share one path, the last render winning.
 * @property {string, function} borderColor           The color of the border path stroke. Default is white
 * @property {number, function} strokeWidth           The width of the border path stroke. Default is 1.25.
 *                                                    An invalid value is dropped by the CSS parser rather than
 *                                                    reported, leaving SVG's initial width of 1.
 *
 * Note: both geoJson and mapPath are required, and omitting either throws a TypeError naming it.
 * The guard runs before the join, so nothing is appended. This replaces the earlier behaviour, in
 * which either omission left a classed, styled path with no geometry - invisible, silent, and
 * indistinguishable from having had no borders to draw.
 *
 * Note: an accessor passed for borderColor or strokeWidth is called with the mesh object and d3's
 * index, not with a per-entity datum - there is only one path, so there is no such datum. An
 * accessor written against a datum, the way every other map renderer's colour accessor is written,
 * therefore resolves to undefined. A null or undefined result is read as "keep the default" rather
 * than passed to d3, which would have removed the style and left the borders invisible with no
 * error. The lake overlay's lakePathColor still has the unguarded shape.
 *
 * Note: both properties are written as inline styles rather than attributes. Nothing in sszvis.css
 * sets stroke or stroke-width for .sszvis-map__border, so nothing is being overridden - but a
 * consumer cannot restyle a mesh border from their own stylesheet either, since an inline style
 * beats any author rule short of !important.
 *
 * Note: the component sets neither fill nor pointer-events; both come from sszvis.css. Rendered
 * without that stylesheet, the mesh is a filled black shape covering the map, and it swallows the
 * base layer's hover and click events rather than letting them through.
 *
 * Note: the border path is scoped to the rendering group's own children and identified by the key
 * property, so a mesh only ever rebinds the path it drew itself. Two meshes in one group therefore
 * coexist as long as they have distinct keys - administrative boundaries and lake outlines, say.
 * Two meshes sharing a key are still one path, which is what makes a re-render reuse its element,
 * so the constraint is one mesh per key per layer rather than one mesh per layer.
 *
 * Note: unlike the base and geojson renderers this component schedules no transition, keeps no
 * caches, emits no missing-value pattern, and adds no tooltip anchors or event targets - so none
 * of that family of quirks applies here. The path data is reapplied on every render rather than
 * only on enter, so a geoJson mutated in place still repaints.
 * See test/map/renderer/mesh.test.ts.
 *
 * @return {sszvis.component}
 */

import type { BaseType, GeoPermissibleObjects, ValueFn } from "d3";
import { select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";

/**
 * A path generator, as this component uses one. A d3.geoPath satisfies this shape, and so does a
 * bare generator function, which is all the runtime requires. It is handed straight to d3 as the
 * attribute callback, so d3 invokes it with the mesh, its index and the group; d3-geo forwards the
 * extra arguments to its own accessors.
 */
type MeshPath = ValueFn<BaseType, GeoPermissibleObjects, string | null>;

/**
 * A constant or an accessor. An accessor is called by d3 with the mesh object itself rather than
 * with a per-entity datum - there is only one path, so there is no such datum. It may resolve to
 * null or undefined, which is read as "keep the default" rather than as "remove the style", so a
 * border cannot silently vanish.
 */
type MeshValue<R extends string | number> =
  | R
  | ValueFn<BaseType, GeoPermissibleObjects, R | null | undefined>;

/**
 * Marks the path a mesh owns, so a second mesh in the same group draws its own rather than
 * rebinding this one. Read back through d3's filter rather than an attribute selector, which
 * would have to escape an arbitrary caller-supplied key.
 */
const KEY_ATTRIBUTE = "data-mesh-key";

/** The defaults, named here because they are also the fallback for an accessor that resolves to nothing. */
const DEFAULT_KEY = "border";
const DEFAULT_BORDER_COLOR = "white";
const DEFAULT_STROKE_WIDTH = 1.25;

/**
 * Resolves a style prop, substituting the component's default for a null or undefined result. d3
 * would remove the style for either, and since sszvis.css sets no stroke for .sszvis-map__border,
 * SVG's initial value `none` would then apply - invisible borders, with no error. That is the
 * outcome of an accessor written against a datum, the way every other map renderer's colour
 * accessor is written, so the default stands instead.
 */
function withDefault<R extends string | number>(
  value: MeshValue<R>,
  fallback: R,
): ValueFn<BaseType, GeoPermissibleObjects, R> {
  return function (this: BaseType, datum, index, groups) {
    const resolved = fn
      .valueFn<BaseType, GeoPermissibleObjects, R | null | undefined>(value)
      .call(this, datum, index, groups);
    return resolved ?? fallback;
  };
}

/**
 * The props as they arrive at render time. geoJson and mapPath are required by the component's
 * contract but optional here, because a caller can omit either: the render guard reports the
 * omission and narrows both before the join, which is why the getters report them as possibly
 * undefined.
 */
type MeshProps = {
  geoJson?: GeoPermissibleObjects;
  mapPath?: MeshPath;
  key: string;
  borderColor: MeshValue<string>;
  strokeWidth: MeshValue<number>;
};

export interface MapRendererMeshComponent extends ComponentBuilder<MapRendererMeshComponent> {
  geoJson(): GeoPermissibleObjects | undefined;
  geoJson(value: GeoPermissibleObjects): MapRendererMeshComponent;
  mapPath(): MeshPath | undefined;
  mapPath(value: MeshPath): MapRendererMeshComponent;
  key(): string;
  key(value: string): MapRendererMeshComponent;
  borderColor(): MeshValue<string>;
  borderColor(value: MeshValue<string>): MapRendererMeshComponent;
  strokeWidth(): MeshValue<number>;
  strokeWidth(value: MeshValue<number>): MapRendererMeshComponent;
}

export default function mapRendererMesh(): MapRendererMeshComponent {
  return component<MapRendererMeshComponent>()
    .prop("geoJson")
    .prop("mapPath")
    .prop("key")
    .key(DEFAULT_KEY)
    .prop("borderColor")
    .borderColor(DEFAULT_BORDER_COLOR) // A function or string for the color of all borders. Note: all borders have the same color
    .prop("strokeWidth")
    .strokeWidth(DEFAULT_STROKE_WIDTH)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<MeshProps>();

      // Validate before the join, so a missing property is reported rather than leaving a
      // classed, styled path with no geometry behind - invisible, and indistinguishable from
      // having had no borders to draw.
      const { geoJson, mapPath } = props;
      if (geoJson === undefined) {
        throw new TypeError(
          "map/renderer/mesh: geoJson is required, since it carries the border geometry to render",
        );
      }
      if (mapPath === undefined) {
        throw new TypeError(
          "map/renderer/mesh: mapPath is required, since it turns the geoJson into path data",
        );
      }

      // add the map borders. These are rendered as one single path element, the one carrying this
      // mesh's key: the selector is scoped to this group's own children so a nested mesh is left
      // alone, and the key filter is what lets two meshes share a group.
      const meshLine = selection
        .selectAll<SVGPathElement, GeoPermissibleObjects>(":scope > path.sszvis-map__border")
        .filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE) === props.key;
        })
        .data([geoJson])
        .join("path")
        .classed("sszvis-map__border", true)
        .attr(KEY_ATTRIBUTE, props.key);

      meshLine
        .attr("d", mapPath)
        .style("stroke", withDefault(props.borderColor, DEFAULT_BORDER_COLOR))
        .style("stroke-width", withDefault(props.strokeWidth, DEFAULT_STROKE_WIDTH));
    });
}
