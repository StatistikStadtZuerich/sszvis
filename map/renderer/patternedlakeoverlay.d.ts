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
 *                                      dotted stroke stands unless this is set, and it is applied only when truthy; see
 *                                      the note below. Not wrapped in fn.functor.
 * @property {Boolean} fadeOut          Whether to fade the lake out towards the bottom of the shape with a gradient mask.
 *                                      Default true - but choropleth defaults its own lakeFadeOut to false, so the
 *                                      default branch is the one no in-repo chart takes. Turning it off does not undo
 *                                      an existing fade; see the note below.
 *
 * Note: every render calls the pattern helpers again on the same defs elements - the fade pair only
 * while fadeOut is on - and each helper appends its contents unconditionally rather than joining
 * them, so the tile gains another rect and another two lines, the fade gradient another two stops,
 * and the mask another rect on every redraw. A map that re-renders on resize or on a control change
 * grows these definitions without bound. The elements themselves are reused - ensureDefsElement
 * joins, and both path joins are unkeyed - so it is only their contents that accumulate. The base
 * and geojson renderers call their own pattern helper the same way.
 *
 * Note: disabling fadeOut after a render with it enabled leaves both the mask attribute on the
 * lake shape and the gradient and mask definitions in the defs, because the disabled branch only
 * skips writing them. choropleth re-applies fadeOut on every render, so a chart that toggles its
 * lakeFadeOut stays faded after the toggle.
 *
 * Note: the mask fades the lake by filling itself with url(#lake-fade-gradient), so the two
 * definitions are only useful together. The gradient helper writes that id a second time onto the
 * element ensureDefsElement had already identified - a harmless redundancy, and the only place two
 * code paths write the same id.
 *
 * Note: all three definitions use fixed ids - "lake-pattern", "lake-fade-gradient" and
 * "lake-fade-mask" - so two maps on one page define each of them twice, and every url(#...)
 * reference in the document resolves to whichever comes first. The same defect as the base and
 * geojson renderers' "missing-pattern".
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
 * Note: the colour is applied only when the property is truthy, because it has no default and the
 * guard is what leaves the stylesheet's stroke alone. So a falsy colour is silently ignored rather
 * than reported, and there is no way to clear a colour already set: re-rendering with "" leaves the
 * previous stroke in place, since the guard only skips writing a new one.
 *
 * Note: the component sets no pointer-events on either path and no fill on the border path, so
 * both come from sszvis.css. Rendered without that stylesheet the border path is a filled black
 * shape covering the lake - SVG's initial fill is black - and both paths swallow the base layer's
 * hover and click events.
 *
 * Note: both selectors are unscoped and both joins unkeyed, so a second overlay rendered into the
 * same group rebinds and restyles the first one's paths instead of drawing its own. One overlay per
 * layer; choropleth uses exactly one, so the collision is latent, but the renderer is exported
 * publicly.
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
}
export default function (): MapRendererPatternedLakeOverlayComponent;
export {};
//# sourceMappingURL=patternedlakeoverlay.d.ts.map