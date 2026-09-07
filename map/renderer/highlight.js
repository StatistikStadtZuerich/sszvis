import { select } from 'd3';
import { component } from '../../d3-component.js';
import { functor } from '../../fn.js';
import { GEO_KEY_DEFAULT, toLookupKey } from '../mapUtils.js';

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
 *                                                    called with the matched feature, or with undefined where nothing
 *                                                    matched, for which a d3.geoPath returns null.
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 *                                                    A falsy keyName is used as given, unlike prepareMergedGeoData, which
 *                                                    falls back to the default - so an empty keyName reads datum[""],
 *                                                    which is undefined, and matches a keyless feature rather than the
 *                                                    intended entity.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities
 *                                                    are highlighted. Falsy entries are dropped. Default [].
 * @property {String, Function} highlightStroke       A colour, or an accessor called with the highlighted datum only.
 *                                                    Default white. Returning null removes the inline style, leaving SVG's
 *                                                    initial stroke of 'none' - an invisible highlight, with no error.
 * @property {Number, Function} highlightStrokeWidth  A width, or an accessor called with the highlighted datum only.
 *                                                    Default 2. Returning null removes the inline style, leaving SVG's
 *                                                    initial width of 1.
 *
 * Note: an entity id that matches no feature is not reported. The lookup yields undefined, the
 * path generator returns null for it, and d3 removes the attribute - leaving a classed, styled
 * path with no geometry. A caller highlighting a stale or misspelled id sees nothing happen and
 * cannot tell that from the entity being off-screen.
 *
 * Note: the feature lookup keys on feature.id, which GeoJSON does not require, and goes through a
 * plain object literal. So ids are stringified on both sides - a numeric feature id is matched by
 * either a numeric or a string data key, which is load-bearing because SSZ geodata uses numeric
 * ids - every feature without an id collapses onto the key "undefined" and the last of them wins,
 * where a datum with no key finds it because the datum side stringifies the same way, and an id
 * naming an Object.prototype member ("valueOf", "toString", ...) is "found" even though no such
 * feature exists, failing exactly like an unmatched id. A symbol stays a symbol key, so it can
 * never be matched by a string id.
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
 * Note: the border selector is unscoped and the join unkeyed, so a second highlight layer rendered
 * into the same group rebinds the first one's paths instead of drawing its own. One highlight layer
 * per group; choropleth uses exactly one, so the collision is latent, but the renderer is exported
 * publicly. Being an index join, it also re-purposes surviving elements by position rather than by
 * entity when the highlight array shrinks; the rendered result is still right, because "d" and both
 * styles are reapplied on every render rather than only on enter.
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
/**
 * Reads the entity id off a datum. Reflect.get is a property access, so it walks the prototype
 * chain and reads a falsy keyName as given, exactly as the JavaScript's datum[keyName] did. Only
 * truthy data reach this, and Object() boxes a primitive one rather than rejecting it, which is
 * what datum[keyName] did for a datum that is not an object.
 */
function readEntityKey(datum, keyName) {
  return Reflect.get(toObject(datum), keyName);
}
/** Object as a boxing function, named so the boxing is explicit rather than an implicit any. */
const toObject = Object;
/**
 * Normalises a lookup key the way a property access does: a symbol stays a symbol key, everything
 * else stringifies - which is how a missing id becomes the string "undefined". Shared in substance
 * with the geojson renderer's own lookup.
 */
function mapRendererHighlight () {
  return component().prop("keyName").keyName(GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
  .prop("geoJson").prop("mapPath").prop("highlight").highlight([]) // an array of data values to highlight
  .prop("highlightStroke", functor).highlightStroke("white") // a function for highlighted entity stroke colors (default: white)
  .prop("highlightStrokeWidth", functor).highlightStrokeWidth(2).render(function () {
    const selection = select(this);
    const props = selection.props();
    const highlightBorders = selection.selectAll(".sszvis-map__highlight");
    if (props.highlight.length === 0) {
      highlightBorders.remove();
      // The JavaScript returned a decorative `true` here ("no highlight, no worry"); d3's
      // selection.each ignores whatever the render callback returns, so nothing consumed it.
      return;
    }
    const groupedMapData = props.geoJson.features.reduce((m, feature) => {
      m[toLookupKey(feature.id)] = feature;
      return m;
    }, {});
    // merge the highlight data
    const mergedHighlight = props.highlight.reduce((m, v) => {
      if (v) {
        m.push({
          geoJson: groupedMapData[toLookupKey(readEntityKey(v, props.keyName))],
          datum: v
        });
      }
      return m;
    }, []);
    highlightBorders.data(mergedHighlight).join("path").classed("sszvis-map__highlight", true).attr("d", d => props.mapPath(d.geoJson)).style("stroke", d => props.highlightStroke(d.datum)).style("stroke-width", d => props.highlightStrokeWidth(d.datum));
  });
}

export { mapRendererHighlight as default };
//# sourceMappingURL=highlight.js.map
