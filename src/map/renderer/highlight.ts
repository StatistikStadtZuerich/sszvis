/**
 * highlight renderer component
 *
 * @module sszvis/map/renderer/highlight
 *
 * @template T The type of the data values in the highlight array
 *
 * A component used internally for rendering the highlight layer of maps.
 * The highlight layer accepts an array of data values to highlight, and renders
 * The map entities associated with those data values using a special stroke. It is the per-entity
 * counterpart to the mesh renderer, which draws every border as one path with one shared style.
 *
 * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer. It must be a
 *                                                    feature collection: `features` is read unguarded, so a bare Feature
 *                                                    throws. Required only when the highlight array is non-empty, and
 *                                                    never validated, which is why the getter reports it as possibly
 *                                                    undefined.
 * @property {d3.geo.path} mapPath                    A path-generator used to create the path data string for each matched
 *                                                    feature. A d3.geoPath or a bare generator function is accepted; it is
 *                                                    called only with features that were actually matched.
 * @property {String} key                             Identifies this highlight layer within the group it renders into,
 *                                                    so several highlight layers can share one group. Default
 *                                                    'highlight'. Two layers in one group need distinct keys; two
 *                                                    renders of the same layer must share one, which is what makes the
 *                                                    render idempotent. Named to match the mesh and raster renderers'
 *                                                    key.
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 *                                                    A falsy keyName is used as given, unlike prepareMergedGeoData, which
 *                                                    falls back to the default - so an empty keyName reads datum[""],
 *                                                    which is undefined, and therefore matches nothing.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities
 *                                                    are highlighted. Falsy entries are dropped. Default [].
 * @property {String, Function} highlightStroke       A colour, or an accessor called with the highlighted datum only.
 *                                                    Default white. Returning null removes the inline style, leaving SVG's
 *                                                    initial stroke of 'none' - an invisible highlight, with no error.
 * @property {Number, Function} highlightStrokeWidth  A width, or an accessor called with the highlighted datum only.
 *                                                    Default 2. Returning null removes the inline style, leaving SVG's
 *                                                    initial width of 1.
 *
 * Note: an entity id that matches no feature is dropped from the join and reported with a single
 * console warning per render, naming every unmatched id. It is a warning rather than a throw
 * because a highlight normally tracks a transient hover or selection, and an id can legitimately
 * go stale between two renders - crashing a chart mid-interaction would be worse than the missing
 * highlight. Nothing is appended for an unmatched id, so the renderer no longer leaves a classed,
 * fully styled path with no geometry behind.
 *
 * Note: the feature lookup keys on feature.id, which GeoJSON does not require, and goes through a
 * Map. Ids are still stringified on both sides - a numeric feature id is matched by either a
 * numeric or a string data key, which is load-bearing because SSZ geodata uses numeric ids - but
 * only keys actually put into the Map can be found: a feature without an id is left out of the
 * lookup, a datum with no entity id matches nothing, and an id naming an Object.prototype member
 * ("valueOf", "toString", "__proto__", ...) is unmatched like any other absent id. A symbol stays a
 * symbol key, so it can never be matched by a string id.
 *
 * Note: neither geoJson nor mapPath is validated, and once there is something to highlight both
 * are required. A missing geoJson throws while the lookup table is built, before the join runs, so
 * nothing is appended; a missing mapPath throws from inside the "d" callback, after the join has
 * appended the element, so it leaves a classed path behind - with no geometry, and no inline stroke
 * styles either, since the throw happens in the "d" callback before either .style() call is
 * reached. The empty
 * highlight case returns early before either is touched, and is the one configuration that
 * tolerates having neither.
 *
 * Note: highlight is tested as `.length === 0`, so a non-array without a length - a single datum
 * passed by mistake - skips the early return and then throws a bare TypeError from .reduce. A
 * string has a length, so "" clears the layer while any other string throws. An array of only falsy entries is the second,
 * distinct way to clear the layer: it merges to nothing and the exit selection removes the paths,
 * but unlike the early return it still reads geoJson, to build the lookup table. mapPath is not
 * read: the join has no elements, so d3 never invokes the "d" callback.
 *
 * Note: nothing deduplicates the highlight array, so highlighting one entity twice draws two
 * stacked paths - harmless while the stroke is opaque, visible with a translucent one.
 *
 * Note: both style properties are wrapped in fn.functor and called by the component itself rather
 * than handed to d3, unlike the mesh renderer's. An accessor therefore receives exactly one
 * argument, the datum, with no index and no node group - and, because the call is written as a
 * method access on props, an accessor expecting d3's node as `this` gets the component's internal
 * props object instead. An accessor returning null removes the style, so a null colour leaves the
 * highlight with SVG's initial stroke of `none` - invisible, with no error - and a null width
 * leaves it at the initial width of 1.
 *
 * Note: both properties are written as inline styles rather than attributes. Nothing in sszvis.css
 * sets stroke or stroke-width for .sszvis-map__highlight, so nothing is being overridden - but a
 * consumer cannot restyle a highlight from their own stylesheet either, since an inline style
 * beats any author rule short of !important.
 *
 * Note: the component sets neither fill nor pointer-events; both come from sszvis.css. Rendered
 * without that stylesheet, a highlight is a filled black shape covering the entity, and it
 * swallows the base layer's hover and click events - which matters more here than for the mesh,
 * since a highlight is normally driven by exactly that hover.
 *
 * Note: the paths are scoped by key and the join is keyed by map entity. Each layer selects
 * only paths carrying its own data-highlight-key, so two highlight layers rendered into one group
 * coexist as long as they are given different keys - sharing the default key still means
 * sharing one set of paths, which is what makes an ordinary layer idempotent across renders even
 * though consumers build a fresh component every time. The keyed join means an element stays with
 * its entity when the array shrinks or is reordered, so per-entity transitions and enter/exit
 * styling are now possible. One entity highlighted twice still draws two paths: the join key
 * carries an occurrence counter.
 *
 * Note: the empty-highlight branch used to return a decorative `true`. Nothing consumed it -
 * d3's selection.each ignores the render callback's return value - so the port returns nothing.
 *
 * Note: no transition is scheduled, so a highlight appears and disappears instantly. Unlike the
 * base and geojson renderers this component keeps no caches, emits no missing-value pattern, and
 * adds no tooltip anchors or event targets, so none of that family of quirks applies here.
 * See test/map/renderer/highlight.test.ts.
 *
 * @return {sszvis.component}
 */

import type { ExtendedFeature, ExtendedFeatureCollection, GeoPath } from "d3";
import { select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import { GEO_KEY_DEFAULT, toLookupKey } from "../mapUtils.js";

/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type HighlightValue<T, R> = R | ((datum: T) => R);

/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredHighlightValue<T, R> = (datum: T) => R;

/**
 * The path generator as this component calls it: with a matched feature only, since unmatched ids
 * are dropped before the join. A d3.geoPath satisfies this at runtime but not by its types, so the
 * setter accepts either shape and HighlightProps states how the component actually calls it.
 */
export type HighlightPath = (feature: unknown) => string | null;

/** A highlighted datum paired with the feature the lookup matched it to. */
interface HighlightedFeature<T> {
  geoJson: ExtendedFeature;
  datum: T;
  /**
   * The join key: the entity's lookup key, plus an occurrence counter so that highlighting one
   * entity twice still draws two paths rather than collapsing them.
   */
  joinKey: string;
}

/** The default key, so that a lone highlight layer needs no configuration. */
const DEFAULT_KEY = "highlight";

/**
 * Marks the paths a highlight layer owns, so a second layer in the same group draws its own rather
 * than rebinding these. Read back through d3's filter rather than an attribute selector, which
 * would have to escape an arbitrary caller-supplied key. The same convention as the mesh
 * renderer's data-mesh-key and the raster renderer's data-raster-key.
 */
const KEY_ATTRIBUTE = "data-highlight-key";

/**
 * The lookup table the merge goes through. A Map holds only the keys actually put into it, so no id
 * can resolve through Object.prototype and no datum can be matched by a feature that was never
 * given an id.
 */
type FeatureLookup = Map<string | symbol, ExtendedFeature>;

type HighlightProps<T> = {
  keyName: string;
  key: string;
  geoJson: ExtendedFeatureCollection;
  mapPath: HighlightPath;
  highlight: (T | null | undefined)[];
  highlightStroke: StoredHighlightValue<T, string | null>;
  highlightStrokeWidth: StoredHighlightValue<T, number | null>;
};

export interface MapRendererHighlightComponent<T = unknown>
  extends ComponentBuilder<MapRendererHighlightComponent<T>> {
  keyName(): string;
  keyName(value: string): MapRendererHighlightComponent<T>;
  key(): string;
  key(value: string): MapRendererHighlightComponent<T>;
  geoJson(): ExtendedFeatureCollection | undefined;
  geoJson(value: ExtendedFeatureCollection): MapRendererHighlightComponent<T>;
  mapPath(): GeoPath | HighlightPath | undefined;
  mapPath(value: GeoPath | HighlightPath): MapRendererHighlightComponent<T>;
  highlight(): (T | null | undefined)[];
  highlight(value: (T | null | undefined)[]): MapRendererHighlightComponent<T>;
  highlightStroke(): StoredHighlightValue<T, string | null>;
  highlightStroke<U = T>(value: HighlightValue<U, string | null>): MapRendererHighlightComponent<T>;
  highlightStrokeWidth(): StoredHighlightValue<T, number | null>;
  highlightStrokeWidth<U = T>(
    value: HighlightValue<U, number | null>
  ): MapRendererHighlightComponent<T>;
}

/**
 * Reads the entity id off a datum. Reflect.get is a property access, so it walks the prototype
 * chain and reads a falsy keyName as given, exactly as the JavaScript's datum[keyName] did. Only
 * truthy data reach this, and Object() boxes a primitive one rather than rejecting it, which is
 * what datum[keyName] did for a datum that is not an object.
 */
function readEntityKey(datum: unknown, keyName: string): unknown {
  return Reflect.get(toObject(datum), keyName);
}

/** Object as a boxing function, named so the boxing is explicit rather than an implicit any. */
const toObject: (value: unknown) => object = Object;

/**
 * Reports the highlight ids no map entity answers to: once per render, with every unmatched id,
 * rather than once per entry. A warning rather than a throw, because a highlight normally tracks a
 * transient hover or selection - throwing would take a whole chart down mid-interaction over an id
 * that may simply have gone stale between two renders.
 */
function warnUnmatched(unmatchedIds: unknown[], keyName: string): void {
  if (unmatchedIds.length === 0) return;
  const ids = unmatchedIds.map((id) => String(id)).join(", ");
  console.warn(
    `sszvis.mapRendererHighlight: no map entity has the ${keyName} ${ids}; nothing was highlighted for it. Check that the highlight ids match the geoJson feature ids, including their format ("01" and "1" are different entities).`
  );
}

/**
 * Normalises a lookup key the way a property access does: a symbol stays a symbol key, everything
 * else stringifies - which is how a missing id becomes the string "undefined". Shared in substance
 * with the geojson renderer's own lookup.
 */
export default function <T = unknown>(): MapRendererHighlightComponent<T> {
  return component<MapRendererHighlightComponent<T>>()
    .prop("keyName")
    .keyName(GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
    .prop("key")
    .key(DEFAULT_KEY) // scopes this layer's paths, so several can share one group
    .prop("geoJson")
    .prop("mapPath")
    .prop("highlight")
    .highlight([]) // an array of data values to highlight
    .prop("highlightStroke", fn.functor)
    .highlightStroke("white") // a function for highlighted entity stroke colors (default: white)
    .prop("highlightStrokeWidth", fn.functor)
    .highlightStrokeWidth(2)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<HighlightProps<T>>();

      // Scoped to this layer, so a second highlight layer in the same group draws its own paths
      // instead of rebinding these.
      const highlightBorders = selection
        .selectAll<Element, HighlightedFeature<T>>(".sszvis-map__highlight")
        .filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE) === props.key;
        });

      if (props.highlight.length === 0) {
        highlightBorders.remove();
        // The JavaScript returned a decorative `true` here ("no highlight, no worry"); d3's
        // selection.each ignores whatever the render callback returns, so nothing consumed it.
        return;
      }

      const groupedMapData = props.geoJson.features.reduce<FeatureLookup>((m, feature) => {
        // A feature without an id names no entity, so it is not addressable: keying it would
        // collapse every such feature onto the single key "undefined" and let a datum with no
        // entity id match the last of them.
        if (feature.id != null) {
          m.set(toLookupKey(feature.id), feature);
        }
        return m;
      }, new Map());

      // merge the highlight data, collecting the ids no map entity answers to
      const unmatchedIds: unknown[] = [];
      const occurrences = new Map<string, number>();
      const mergedHighlight = props.highlight.reduce<HighlightedFeature<T>[]>((m, v) => {
        if (v) {
          const entityId = readEntityKey(v, props.keyName);
          const feature = entityId == null ? undefined : groupedMapData.get(toLookupKey(entityId));
          if (feature === undefined) {
            unmatchedIds.push(entityId);
          } else {
            const entityKey = String(toLookupKey(entityId));
            const occurrence = occurrences.get(entityKey) ?? 0;
            occurrences.set(entityKey, occurrence + 1);
            m.push({ geoJson: feature, datum: v, joinKey: `${entityKey}#${occurrence}` });
          }
        }
        return m;
      }, []);

      warnUnmatched(unmatchedIds, props.keyName);

      highlightBorders
        // Keyed by map entity, so an element stays with its entity when the highlight array
        // shrinks or is reordered rather than being re-purposed by position.
        .data(mergedHighlight, (d) => d.joinKey)
        .join("path")
        .classed("sszvis-map__highlight", true)
        .attr(KEY_ATTRIBUTE, props.key)
        .attr("d", (d) => props.mapPath(d.geoJson))
        .style("stroke", (d) => props.highlightStroke(d.datum))
        .style("stroke-width", (d) => props.highlightStrokeWidth(d.datum));
    });
}
