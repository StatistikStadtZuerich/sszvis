/**
 * patternedlakeoverlay component
 *
 * @module sszvis/map/renderer/patternedlakeoverlay
 *
 * A component used internally for rendering Lake Zurich, and the borders of map entities which
 * lie above Lake Zurich.
 *
 * @property {d3.geo.path} mapPath      A path-generator function used to create the path data string of the provided GeoJson.
 *                                      It is handed straight to d3 as the attribute callback, so it is called with the
 *                                      geoJson, d3's index and the group; a d3.geoPath returns null for an undefined
 *                                      feature. Never validated; see the note below.
 * @property {GeoJson} lakeFeature      A GeoJson object which provides data for the outline shape of Lake Zurich. This shape will
 *                                      be filled with a special texture fill and masked with an alpha gradient fade.
 *                                      Never validated, which is why the getter reports it as possibly undefined; see
 *                                      the note below.
 * @property {GeoJson} lakeBounds       A GeoJson object which provides data for the shape of map entity borders which lie over the
 *                                      lake. These borders will be drawn over the lake shape, as grey dotted lines.
 *                                      Never validated, like lakeFeature.
 * @property {String, Function} lakePathColor  The stroke colour of those borders. No default: the stylesheet's grey
 *                                      dotted stroke stands unless this is set. A falsy colour - "" - clears the
 *                                      inline stroke again. Not wrapped in fn.functor.
 * @property {Boolean} fadeOut          Whether to fade the lake out towards the bottom of the shape with a gradient mask.
 *                                      Default true - but choropleth defaults its own lakeFadeOut to false, so the
 *                                      default branch is the one no in-repo chart takes. Turning it off removes an
 *                                      existing fade again.
 * @property {String} key               Optional scope for this overlay's definitions and paths, so that two overlays
 *                                      drawn into one group each own their elements. Defaults to one scope per group,
 *                                      generated on first render and remembered on the group as
 *                                      data-lake-key - so re-rendering, even with a freshly constructed
 *                                      component, reuses the same elements, while a second map on the page gets its
 *                                      own. A caller-supplied key must be unique within the document, must start
 *                                      with a letter and may use only letters, digits, hyphens and underscores -
 *                                      it is written into the definition ids, so a url(#...) reference has to be
 *                                      able to name it. Anything else throws. The leading letter also keeps caller
 *                                      keys apart from the generated scopes, which are bare decimals.
 *
 * Note: the definition ids are scoped - "lake-pattern-1", "lake-fade-gradient-1", "lake-fade-mask-1"
 * and so on - so two maps on one page no longer define the same id twice. Consumers must not rely on
 * the previously fixed ids.
 *
 * Note: the pattern helpers in src/patterns.ts append their contents rather than joining them, so
 * this component may only call them on a definition that is still empty; otherwise the tile would
 * gain another rect and two lines, the gradient another two stops and the mask another rect on every
 * redraw. The narrower fix would be to make the helpers idempotent, which would cover the base and
 * geojson renderers' "missing-pattern" too.
 *
 * Note: the mask fades the lake by filling itself with the fade gradient, so the two definitions are
 * only useful together. Both helpers hard-code the old fixed gradient id, so this component rewrites
 * the gradient's id and the mask rect's fill after calling them.
 *
 * Note: the defs element is created inside the map group rather than at the svg root, and
 * ensureDefsElement selects it with an unscoped descendant selector - so this component shares one
 * defs with the base renderer's missing value pattern when both draw into the same group.
 *
 * Note: neither geoJson property is validated. Omitting either leaves a classed, pattern-filled
 * path with no geometry - invisible, silent, and indistinguishable from having no lake to draw. A
 * missing property reaches the path generator as undefined, which returns null; a missing mapPath
 * has d3 remove the attribute without calling anything. The same root defect as the mesh renderer.
 *
 * Note: lakePathColor is not wrapped in fn.functor, unlike the colour properties of the base,
 * geojson and highlight renderers. An accessor is handed straight to d3 and called with the
 * lakeBounds object and d3's index, not with a per-border datum - there is only one path, so there
 * is no such datum. It is written as an inline style, which does override the stylesheet's stroke
 * for .sszvis-map__lakepath - and cannot be overridden back from a consumer's stylesheet, since an
 * inline style beats any author rule short of !important. The mesh's borderColor has the same
 * shape - though where a dropped mesh style leaves the borders invisible, a dropped style here
 * falls back to the stylesheet's grey dotted stroke, so the mistake is even quieter.
 *
 * Note: the colour is written on every render, and only an unset property leaves the stylesheet's
 * stroke alone. A falsy colour - "", or an accessor returning undefined - clears the inline stroke
 * and hands the border back to the stylesheet.
 *
 * Note: the component sets no pointer-events on either path and no fill on the border path, so
 * both come from sszvis.css. Rendered without that stylesheet the border path is a filled black
 * shape covering the lake - SVG's initial fill is black - and both paths swallow the base layer's
 * hover and click events.
 *
 * Note: both path selectors are scoped by the overlay's key, so two overlays rendered into one group
 * each draw their own pair of paths as long as they are given distinct keys.
 *
 * Note: unlike the base and geojson renderers this component schedules no transition, keeps no
 * caches, and does not mutate the geoJson it is handed, so the whole centroid-caching family of
 * quirks does not apply. It emits patterns, but not their missing-value one, and adds no tooltip
 * anchors and no event targets. The path data is reapplied on every render rather than only on
 * enter, so a geoJson mutated in place still repaints.
 * See test/map/renderer/patternedlakeoverlay.test.ts.
 *
 * @return {sszvis.component}
 */
import type { BaseType, GeoPermissibleObjects, ValueFn } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
/**
 * A path generator, as this component uses one. A d3.geoPath satisfies this shape, and so does a
 * bare generator function, which is all the runtime requires. It is handed straight to d3 as the
 * attribute callback, so d3 invokes it with the geoJson, its index and the group; d3-geo forwards
 * the extra arguments to its own accessors.
 */
type LakePath = ValueFn<BaseType, GeoPermissibleObjects, string | null>;
/**
 * A constant or an accessor. lakePathColor is not wrapped in fn.functor, so an accessor is called
 * by d3 with the lakeBounds object itself rather than with a per-border datum - there is only one
 * path, so there is no such datum.
 */
type LakePathColor = string | ValueFn<BaseType, GeoPermissibleObjects, string | null>;
export interface MapRendererPatternedLakeOverlayComponent extends ComponentBuilder<MapRendererPatternedLakeOverlayComponent> {
    mapPath(): LakePath | undefined;
    mapPath(value: LakePath): MapRendererPatternedLakeOverlayComponent;
    lakeFeature(): GeoPermissibleObjects | undefined;
    lakeFeature(value: GeoPermissibleObjects): MapRendererPatternedLakeOverlayComponent;
    lakeBounds(): GeoPermissibleObjects | undefined;
    lakeBounds(value: GeoPermissibleObjects): MapRendererPatternedLakeOverlayComponent;
    lakePathColor(): LakePathColor | undefined;
    lakePathColor(value: LakePathColor): MapRendererPatternedLakeOverlayComponent;
    fadeOut(): boolean;
    fadeOut(value: boolean): MapRendererPatternedLakeOverlayComponent;
    key(): string | undefined;
    key(value: string): MapRendererPatternedLakeOverlayComponent;
}
export default function mapRendererPatternedLakeOverlay(): MapRendererPatternedLakeOverlayComponent;
export {};
//# sourceMappingURL=patternedlakeoverlay.d.ts.map