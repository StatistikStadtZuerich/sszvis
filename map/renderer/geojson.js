import { dispatch, select } from 'd3';
import tooltipAnchor from '../../annotation/tooltipAnchor.js';
import { component } from '../../d3-component.js';
import { functor, prop, defined } from '../../fn.js';
import { mapMissingValuePattern } from '../../patterns.js';
import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { slowTransition } from '../../transition.js';
import { GEO_KEY_DEFAULT, missingPatternId, toLookupKey, getGeoJsonCenter, isPaintServer } from '../mapUtils.js';

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
 *                                          the note below on the cached centre.
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
 *                                          returning a number, called with the datum as the fill and stroke
 *                                          accessors are. Default 1.25. Undefined entities are not asked for a
 *                                          stroke width; they carry no stroke-width attribute.
 * @property {Boolean} transitionColor      Whether to transition the fill color of the geojson entities. Default true.
 *                                          With it set the fill is only applied through the transition, so a color change
 *                                          fades from the previous color; with it unset the fill is written synchronously.
 *                                          An entering entity has no previous color, so it takes the final color at the
 *                                          first tick. Only a color-to-color change is transitioned; an entity entering or
 *                                          leaving the missing value texture takes its fill synchronously either way,
 *                                          since a paint-server reference cannot be interpolated.
 *
 * Note: lookup keys are stringified, so a numeric and a string id that print the same collide. A
 * symbol key stays a symbol and can never be matched by a string id. A feature or datum with no
 * key at all is left unmatched.
 *
 * Note: anchor positions go through getGeoJsonCenter, the same source the base renderer uses, so an
 * authored `center` property is honoured here too and a feature drawn by both renderers anchors in
 * one place. That centre is cached as `cachedCenter` on the feature's properties and never
 * invalidated, so moving a feature's geometry leaves its anchor behind.
 *
 * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
 * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
 * attribute or asking for no stroke.
 *
 * Note: the missing value pattern is written into a defs element inside each layer, under an id of
 * that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
 *
 * Note: one quirk remains, shared with the base renderer. The data join has no key function, so it
 * is an index join: reordering the features repaints the existing nodes in place instead of moving
 * them.
 *
 * See test/map/renderer/geojson.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Reads a match key off a feature's properties. RFC 7946 permits a null properties member, and a
 * feature may simply not carry the configured key, so both cases read as undefined - which the
 * merge treats as unmatched rather than as the lookup key "undefined".
 */
function readFeatureKey(properties, key) {
  return properties === null || properties === undefined ? undefined : properties[key];
}
function mapRendererGeoJson() {
  const event = dispatch("over", "out", "click");
  const geojsonComponent = component().prop("dataKeyName").dataKeyName(GEO_KEY_DEFAULT).prop("geoJsonKeyName").geoJsonKeyName("id").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true).prop("fill", functor).fill("black").prop("stroke", functor).stroke("black").prop("strokeWidth", functor).strokeWidth(1.25).prop("transitionColor").transitionColor(true).render(function (data) {
    const selection = select(this);
    const props = selection.props();
    // render the missing value pattern, under an id of this layer's own
    const patternId = missingPatternId(selection);
    ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);
    // getDataKeyName will be called on data values. It should return a map entity id.
    // getMapKeyName will be called on the 'properties' of each map feature. It should
    // return a map entity id. Data values are matched with corresponding map features using
    // these entity ids.
    const getDataKeyName = prop(props.dataKeyName);
    // A prototype-less table, so a feature keyed after an Object.prototype member - "valueOf",
    // say - cannot resolve to the inherited function, and so that the caller's data are never
    // written to.
    const groupedInputData = Object.create(null);
    for (const datum of data) {
      // A datum with no key is skipped rather than filed under the string "undefined", where it
      // would have become the datum for every feature that also lacks a key.
      const key = getDataKeyName(datum);
      if (key === undefined) continue;
      groupedInputData[toLookupKey(key)] = datum;
    }
    const mergedData = props.geoJson.features.map(feature => {
      const key = readFeatureKey(feature.properties, props.geoJsonKeyName);
      return {
        geoJson: feature,
        datum: key === undefined ? undefined : groupedInputData[toLookupKey(key)]
      };
    });
    function getMapFill(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : "url(#".concat(patternId, ")");
    }
    function getMapStroke(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
    }
    // Guarded like fill and stroke: an unmatched feature is not asked for a stroke width, and
    // returning null removes the attribute rather than handing the accessor undefined.
    function getMapStrokeWidth(d) {
      return defined(d.datum) && props.defined(d.datum) ? props.strokeWidth(d.datum) : null;
    }
    const geoElements = selection.selectAll(".sszvis-map__geojsonelement").data(mergedData).join("path").classed("sszvis-map__geojsonelement", true).attr("data-event-target", "");
    geoElements.classed("sszvis-map__geojsonelement--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
    // The fill is applied exactly once, so the transition has the previous color to interpolate
    // from, and only a color-to-color change is tweened - a paint-server reference cannot be
    // interpolated. Both rules are the base renderer's; see src/map/renderer/base.ts.
    if (props.transitionColor) {
      const tweenable = function (d) {
        return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
      };
      geoElements.filter(tweenable).transition(slowTransition()).attr("fill", getMapFill);
      geoElements.filter(function (d) {
        return !tweenable.call(this, d);
      }).attr("fill", getMapFill);
    } else {
      geoElements.attr("fill", getMapFill);
    }
    geoElements.attr("stroke", getMapStroke).attr("stroke-width", getMapStrokeWidth);
    // d3 v6 and later call a listener with (event, datum), and the datum here is the merged
    // { geoJson, datum } wrapper - the handler is given the entity's own datum.
    geoElements.on("mouseover", function (_pointerEvent, d) {
      event.call("over", this, d.datum);
    }).on("mouseout", function (_pointerEvent, d) {
      event.call("out", this, d.datum);
    }).on("click", function (_pointerEvent, d) {
      event.call("click", this, d.datum);
    });
    // the tooltip anchor generator
    const ta = tooltipAnchor().position(d => {
      // A feature with the spec-legal `properties: null` reaches here now that the merge no
      // longer crashes on one, and the centre cache needs somewhere to live. Without this
      // getGeoJsonCenter would throw on it.
      if (!d.geoJson.properties) d.geoJson.properties = {};
      // The same centre the base renderer uses, so a feature drawn by both places its tooltip
      // in one spot: an authored `center` property is honoured, and the result is memoized as
      // `cachedCenter` on the feature.
      const center = getGeoJsonCenter(d.geoJson);
      // d3's own typings expect the projection type as a type argument here.
      const point = props.mapPath.projection()(center);
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

export { mapRendererGeoJson as default };
//# sourceMappingURL=geojson.js.map
