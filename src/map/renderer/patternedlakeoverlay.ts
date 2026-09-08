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
 * Note: the pattern helpers in src/patterns.ts are idempotent - they data-join their contents - so
 * they can be called on every render, and a redraw updates the definition in place rather than
 * growing it.
 *
 * Note: the mask fades the lake by filling itself with the fade gradient, so the two definitions are
 * only useful together. Both helpers take the gradient id as a trailing argument, so this overlay's
 * scoped id is handed to them directly rather than rewritten afterwards.
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
 * Note: both path selectors are scoped to the rendering group's own children and filtered by the
 * overlay's key, and the joins are keyed by that scope too - so two overlays rendered into one
 * group each draw their own pair of paths as long as they are given distinct keys, and an overlay
 * in a nested group is left alone even if it carries the same key. Two unkeyed overlays in one
 * group still share the scope generated for that group, and so share one pair of paths; that is
 * what makes a re-render from a freshly constructed component reuse its elements.
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
import { select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { mapLakeFadeGradient, mapLakeGradientMask, mapLakePattern } from "../../patterns.js";
import ensureDefsElement from "../../svgUtils/ensureDefsElement.js";

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

/**
 * The props as this component's contract describes them, which is deliberately narrower than what
 * the runtime tolerates: mapPath, lakeFeature and lakeBounds are required here even though none is
 * validated, because omitting one leaves a classed, styled path with no geometry rather than
 * raising. The characterization tests pin that behaviour, which is why the getters report these
 * three as possibly undefined. Following the same split as src/map/renderer/mesh.ts.
 */
type LakeOverlayProps = {
  mapPath: LakePath;
  lakeFeature: GeoPermissibleObjects;
  lakeBounds: GeoPermissibleObjects;
  /** Undefined until set: this prop has no default, and an unset colour writes no inline style. */
  lakePathColor?: LakePathColor;
  fadeOut: boolean;
  /** Undefined until set: the scope then falls back to one generated per group. */
  key?: string;
};

export interface MapRendererPatternedLakeOverlayComponent
  extends ComponentBuilder<MapRendererPatternedLakeOverlayComponent> {
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

/**
 * Marks both the group whose generated scope it records and the paths belonging to a scope,
 * mirroring d3-selectgroup's data-d3-selectgroup. Read back through getAttribute in a filter
 * rather than matched with an attribute selector, so a caller-supplied key needs no CSS
 * escaping - the same idiom as mesh's data-mesh-key and raster's data-raster-key.
 */
const KEY_ATTRIBUTE = "data-lake-key";

let generatedScopes = 0;

/**
 * A caller-supplied key has to be spellable both as an id selector and as a url(#...) fragment,
 * because the scope is interpolated into the three definition ids and matched back by id. Letters,
 * digits, hyphens and underscores qualify; a leading letter is required, which is what keeps
 * caller keys disjoint from the generated scopes below.
 */
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Rejects a key that cannot be spelled in an id. Without this a key such as "a b" builds the valid
 * but unmatchable selector "pattern#lake-pattern-a b", so every render appends another definition
 * and the url(#...) reference is inert, while a quote makes the selector unparseable and throws
 * from inside ensureDefsElement. Both were silent or obscure; this names the property instead.
 */
function requireSpellableKey(key: string): string {
  if (!KEY_PATTERN.test(key)) {
    throw new Error(
      `[mapRendererPatternedLakeOverlay] the key property must start with a letter and use only letters, digits, hyphens and underscores; got "${key}". The key is written into this overlay's definition ids, which a url(#...) reference has to be able to name.`
    );
  }
  return key;
}

/**
 * The scope every definition id and both path selectors are qualified with. A caller-supplied key
 * wins; otherwise a scope is generated once per group and remembered on the group itself, so a
 * re-render - even from a freshly constructed component, which is how the docs examples are written
 * - reuses the same definitions and paths, while a second map on the page gets its own.
 *
 * Generated scopes are bare decimals and caller keys must begin with a letter, so the two can
 * never collide: without that, `.key("1")` on one map and the first unkeyed overlay on another
 * would share the scope "1" and so share document-global definition ids - the very cross-map
 * reference this scoping exists to prevent.
 */
function overlayScope(group: Element, key: string | undefined): string {
  if (key !== undefined) return requireSpellableKey(key);
  const recorded = group.getAttribute(KEY_ATTRIBUTE);
  if (recorded !== null) return recorded;
  const generated = String(++generatedScopes);
  group.setAttribute(KEY_ATTRIBUTE, generated);
  return generated;
}

export default function mapRendererPatternedLakeOverlay(): MapRendererPatternedLakeOverlayComponent {
  return component<MapRendererPatternedLakeOverlayComponent>()
    .prop("mapPath")
    .prop("lakeFeature")
    .prop("lakeBounds")
    .prop("lakePathColor")
    .prop("fadeOut")
    .prop("key")
    .fadeOut(true)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<LakeOverlayProps>();

      const scope = overlayScope(this, props.key);
      const patternId = `lake-pattern-${scope}`;
      const gradientId = `lake-fade-gradient-${scope}`;
      const maskId = `lake-fade-mask-${scope}`;

      // the lake texture. The helpers join their contents, so calling them on every render updates
      // the definition rather than growing it.
      ensureDefsElement(selection, "pattern", patternId).call(mapLakePattern);

      if (props.fadeOut) {
        // the fade gradient, and the mask that fills itself with it - both scoped to this overlay
        // by the id handed to them.
        ensureDefsElement(selection, "linearGradient", gradientId).call(
          mapLakeFadeGradient,
          gradientId
        );
        ensureDefsElement(selection, "mask", maskId).call(mapLakeGradientMask, gradientId);
      } else {
        // Turning the fade off must undo an existing one, not merely skip writing it.
        selection.selectAll(`linearGradient#${gradientId}, mask#${maskId}`).remove();
      }

      /**
       * The paths of one class this overlay owns: scoped to the rendering group's own children, so
       * an overlay in a nested group is never rebound, and filtered by key, which is what lets two
       * overlays share one group. Read back through getAttribute rather than matched with an
       * attribute selector, so a caller-supplied key needs no escaping.
       */
      const ownPaths = (className: string) =>
        selection
          .selectAll<SVGPathElement, GeoPermissibleObjects>(`:scope > path.${className}`)
          .filter(function () {
            return this.getAttribute(KEY_ATTRIBUTE) === scope;
          });

      /** Keyed by the overlay's scope, so a path is only ever rebound by the overlay that drew it. */
      const joinKey = () => scope;

      // generate the Lake Zurich path
      const zurichSee = ownPaths("sszvis-map__lakezurich")
        .data([props.lakeFeature], joinKey)
        .join("path")
        .classed("sszvis-map__lakezurich", true)
        .attr(KEY_ATTRIBUTE, scope)
        .attr("d", props.mapPath)
        .attr("fill", `url(#${patternId})`);

      // this mask applies the fade effect
      zurichSee.attr("mask", props.fadeOut ? `url(#${maskId})` : null);

      // add a path for the boundaries of map entities which extend over the lake.
      // This path is rendered as a dotted line over the lake shape
      const lakePath = ownPaths("sszvis-map__lakepath")
        .data([props.lakeBounds], joinKey)
        .join("path")
        .classed("sszvis-map__lakepath", true)
        .attr(KEY_ATTRIBUTE, scope)
        .attr("d", props.mapPath);

      // An unset colour writes nothing, so the stylesheet's stroke stands; any value that is set -
      // including a falsy one - is written, so it can clear a colour an earlier render left behind.
      if (props.lakePathColor === undefined) {
        lakePath.style("stroke", null);
      } else {
        lakePath.style("stroke", fn.valueFn(props.lakePathColor));
      }
    });
}
