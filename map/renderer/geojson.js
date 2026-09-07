import { dispatch, select, geoCentroid } from 'd3';
import tooltipAnchor from '../../annotation/tooltipAnchor.js';
import { component } from '../../d3-component.js';
import { functor, prop, defined } from '../../fn.js';
import { mapMissingValuePattern } from '../../patterns.js';
import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { slowTransition } from '../../transition.js';
import { GEO_KEY_DEFAULT } from '../mapUtils.js';

/**
 * geojson renderer component
 *
 * @module sszvis/map/renderer/geojson
 *
 * @template T The type of the data values merged onto the geojson features
 *
 * A component used for rendering overlays of geojson above map layers.
 * It can be used to render any arbitrary GeoJson.
 *
 * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
 *                                          with geographic entities. Default 'geoId'.
 * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
 *                                          with data entities. Default 'id'.
 * @property {GeoJson} geoJson              The GeoJson object which should be rendered. It is read unguarded, so a value
 *                                          without a 'features' property throws a TypeError. Rendering mutates it; see
 *                                          the note below on the cached centroid.
 * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
 * @property {Function, Boolean} defined    A predicate used to determine whether a datum has a defined value. Entities
 *                                          that fail it, and entities with no datum at all, display the missing value
 *                                          texture. It is wrapped in fn.functor and defaults to the constant true, so a
 *                                          constant false textures the whole overlay and the default never rejects
 *                                          anything.
 * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
 * @property {String, Function} stroke      The stroke color of the entities. Can be a string or a function returning a
 *                                          string, called with the datum. Default black. Undefined entities are not
 *                                          asked for a stroke at all; see the note below.
 * @property {Number, Function} strokeWidth The thickness of the strokes of the shapes. A number, or a function
 *                                          returning a number - but see the note below: unlike fill and stroke, a
 *                                          strokeWidth accessor is handed the merged { geoJson, datum } wrapper
 *                                          rather than the datum. Default 1.25.
 * @property {Boolean} transitionColor      Whether to schedule a transition on the fill color of the geojson entities.
 *                                          Default true. The transition does not currently animate anything; see the
 *                                          note below.
 *
 * Note: the data are grouped with a reduce that has no initial value, so the first datum becomes
 * the lookup table rather than an entry in it. That datum's feature never receives its data and
 * always renders as missing, the remaining data are written as properties onto the caller's first
 * array element, a single-datum dataset matches nothing at all, and an empty dataset throws.
 *
 * Note: the on("over"|"out"|"click") API has never delivered anything. The listeners call
 * event.over(datum) and friends, but d3's dispatch exposes only on, call, apply and copy, so each
 * listener throws a TypeError before any registered handler runs. Both maps in docs/map-extended
 * register these handlers and receive nothing.
 *
 * Note: a strokeWidth accessor is called with the merged { geoJson, datum } wrapper, not with the
 * datum, unlike the fill and stroke accessors. An accessor written against the datum reads
 * undefined and d3 removes the attribute entirely.
 *
 * Note: the key lookup reads a feature's properties without a guard, so a feature with the
 * spec-legal `properties: null`, or with no properties at all, crashes the merge with a bare
 * TypeError. That also makes the anchor's own `properties || (properties = {})` guard unreachable.
 *
 * Note: lookup keys are stringified, so a missing key on either side becomes the string
 * "undefined" and one keyless datum becomes the datum for every keyless feature. A symbol key stays
 * a symbol and can never be matched by a string id. The lookup table is a plain object, so a
 * feature keyed after an Object.prototype member - "valueOf", say - is handed the inherited
 * function as its datum, which fn.defined accepts and passes to the fill accessor.
 *
 * Note: the mouse listeners are bound layer-wide via the [data-event-target] attribute rather than
 * scoped to this component's own class. An overlay drawn into a group that already holds a base
 * layer rebinds that layer's areas to this component's handlers and merged data.
 *
 * Note: rendering caches a sphericalCentroid onto every feature's properties and never invalidates
 * it, so moving a feature's geometry leaves its anchor behind. Unlike the base renderer it ignores
 * an authored `center` property and caches under a different key, so the two renderers disagree
 * about where the same entity's tooltip belongs.
 *
 * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
 * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
 * attribute or asking for no stroke.
 *
 * Note: this renderer shares four quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the fill transition interpolates a colour onto itself, the
 * slowTransition call is a no-op that leaves d3's 250ms easeCubicInOut defaults in place of the
 * intended 500ms easePolyOut, the stale-class fill repaint is dead, and the data join is an index
 * join with no key function. The missing value pattern is likewise emitted per layer under the
 * fixed id "missing-pattern", so two map layers on one page define that id twice.
 * See test/map/renderer/geojson.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Reads a key off a feature's properties. The JavaScript used fn.prop, which indexes without a
 * guard, so a feature with spec-legal `properties: null` crashed the merge. The message matches
 * what that read produced.
 */
function readFeatureKey(properties, key) {
  if (properties === null || properties === undefined) {
    throw new TypeError("Cannot read properties of ".concat(properties, " (reading '").concat(key, "')"));
  }
  return properties[key];
}
/**
 * Normalises a lookup key exactly as a property access does: a symbol stays a symbol key, so two
 * symbols with the same description remain distinct and can never be matched by a string id.
 * Everything else stringifies, which is how a missing key becomes the string "undefined".
 */
function toLookupKey(value) {
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
function emitLegacy(type) {
  throw new TypeError("event.".concat(type, " is not a function"));
}
function geojson () {
  const event = dispatch("over", "out", "click");
  const geojsonComponent = component().prop("dataKeyName").dataKeyName(GEO_KEY_DEFAULT).prop("geoJsonKeyName").geoJsonKeyName("id").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true).prop("fill", functor).fill("black").prop("stroke", functor).stroke("black").prop("strokeWidth", functor).strokeWidth(1.25).prop("transitionColor").transitionColor(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // render the missing value pattern
    ensureDefsElement(selection, "pattern", "missing-pattern").call(mapMissingValuePattern);
    // getDataKeyName will be called on data values. It should return a map entity id.
    // getMapKeyName will be called on the 'properties' of each map feature. It should
    // return a map entity id. Data values are matched with corresponding map features using
    // these entity ids.
    const getDataKeyName = prop(props.dataKeyName);
    // The JavaScript grouped the data with `data.reduce((m, v) => { m[key(v)] = v; return m; })`
    // and no initial value, so the first datum became the accumulator: it is never an entry of
    // its own table, the rest of the data are written onto it, and an empty array throws.
    // Written as an explicit loop here so the table has a type; the behaviour is unchanged.
    if (data.length === 0) {
      throw new TypeError("Reduce of empty array with no initial value");
    }
    const [firstDatum, ...remainingData] = data;
    const groupedInputData = firstDatum;
    for (const datum of remainingData) {
      groupedInputData[toLookupKey(getDataKeyName(datum))] = datum;
    }
    const mergedData = props.geoJson.features.map(feature => ({
      geoJson: feature,
      datum: groupedInputData[toLookupKey(readFeatureKey(feature.properties, props.geoJsonKeyName))]
    }));
    function getMapFill(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : "url(#missing-pattern)";
    }
    function getMapStroke(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
    }
    const geoElements = selection.selectAll(".sszvis-map__geojsonelement").data(mergedData).join("path").classed("sszvis-map__geojsonelement", true).attr("data-event-target", "").attr("fill", getMapFill);
    selection.selectAll(".sszvis-map__geojsonelement--undefined").attr("fill", getMapFill);
    geoElements.classed("sszvis-map__geojsonelement--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
    if (props.transitionColor) {
      geoElements.transition().call(slowTransition).attr("fill", getMapFill);
    } else {
      geoElements.attr("fill", getMapFill);
    }
    geoElements.attr("stroke", getMapStroke).attr("stroke-width", props.strokeWidth);
    // The JavaScript read `.datum` off each listener's first parameter. d3 v6 and later call a
    // listener with (event, datum), so that read was always of the DOM event and always
    // undefined; the emit below throws before the value is used either way.
    selection.selectAll("[data-event-target]").on("mouseover", () => {
      emitLegacy("over");
    }).on("mouseout", () => {
      emitLegacy("out");
    }).on("click", () => {
      emitLegacy("click");
    });
    // the tooltip anchor generator
    const ta = tooltipAnchor().position(d => {
      const properties = d.geoJson.properties || (d.geoJson.properties = {});
      let sphericalCentroid = properties.sphericalCentroid;
      if (!sphericalCentroid) {
        properties.sphericalCentroid = sphericalCentroid = geoCentroid(d.geoJson);
      }
      // d3's own typings expect the projection type as a type argument here.
      const point = props.mapPath.projection()(sphericalCentroid);
      // Only a hand-written projection can return null: d3's projections clip in the stream,
      // not in the point call, and return a pair - of NaN, for a degenerate centroid. A null is
      // passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
      // translateString and renders transform="translate(undefined,undefined)". Substituting a
      // NaN pair here would put a different attribute value in the DOM for the same input.
      return point;
    });
    const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(mergedData);
    // attach tooltip anchors
    tooltipGroup.call(ta);
  });
  // The argument tuple is typed as src/behavior/panning.ts types its own on(): d3's dispatch.on
  // derives its callback type from a *literal* event name, so a plain string collapses the
  // callback to never. Narrowing to "over" | "out" | "click" would type the callback properly but
  // would also reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
  geojsonComponent.on = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    const value = event.on.apply(event, args);
    return value === event ? geojsonComponent : value;
  };
  return geojsonComponent;
}

export { geojson as default };
//# sourceMappingURL=geojson.js.map
