import { select } from 'd3';
import tooltipAnchor from '../../annotation/tooltipAnchor.js';
import { component } from '../../d3-component.js';
import { functor, defined } from '../../fn.js';
import { mapMissingValuePattern } from '../../patterns.js';
import ensureDefsElement from '../../svgUtils/ensureDefsElement.js';
import { slowTransition } from '../../transition.js';
import { missingPatternId, getGeoJsonCenter, isPaintServer } from '../mapUtils.js';

/**
 * base renderer component
 *
 * @module sszvis/map/renderer/base
 *
 * @template T The type of the data values merged onto the map features
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
 *                                                    entities that fail it display the missing value texture, as do entities
 *                                                    that matched no datum at all - the predicate is only consulted for a
 *                                                    datum that exists. It is wrapped in fn.functor and defaults to the
 *                                                    constant true, so a constant false textures the whole map. The
 *                                                    exception is a layer where no entity has a datum; see the note below.
 * @property {String, Function} fill                  A string or function for the fill of the map entities. An accessor is
 *                                                    called with the entity's datum, and is not called at all for an entity
 *                                                    the dataset does not cover - that one is textured instead. On a layer
 *                                                    where no entity has a datum, though, nothing is textured and the
 *                                                    accessor is called with undefined for every entity; see the note below.
 * @property {Boolean} transitionColor                Whether to transition the fill color of the map entities.
 *                                                    (default: true) With it set, the fill is only applied through the
 *                                                    transition, so a color change fades from the previous color; with it
 *                                                    unset the fill is written synchronously. An entering entity has no
 *                                                    previous color, so it takes the final color at the first tick. Only a
 *                                                    color-to-color change is transitioned; an entity entering or leaving
 *                                                    the missing value texture takes its fill synchronously either way,
 *                                                    since a paint-server reference cannot be interpolated.
 *
 * Note: the scheduled transition keeps d3's defaults of 250ms and easeCubicInOut rather than the
 * intended 500ms easePolyOut. `.transition().call(slowTransition)` returns the original
 * transition, while slowTransition ignores its argument and builds a fresh detached transition
 * that is discarded.
 *
 * Note: "missing" only means something relative to a dataset, so a layer where no entity has a
 * datum is taken to be drawing geometry rather than encoding values - it keeps the caller's fill,
 * is not classed --undefined, and calls the fill accessor with undefined for every entity. One
 * matched datum is enough to make it a data layer, and then the entities the dataset does not
 * cover are textured and the accessor is not called for them. A dataset that is supplied but
 * matches nothing is indistinguishable from no dataset here, since this renderer receives only
 * mergedData; such a map renders with the caller's fill rather than an all-textured map.
 *
 * Note: the missing value pattern is written into a defs element inside each map layer, under an id
 * of that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
 * element so re-renders reuse it. The id is not part of the public API; do not select on it.
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
function mapRendererBase () {
  return component().prop("mergedData").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true) // a predicate function to determine whether a datum has a defined value
  .prop("fill", functor).fill(() => "black") // a function for the entity fill color. default is black
  .prop("transitionColor").transitionColor(true).render(function () {
    const selection = select(this);
    const props = selection.props();
    // render the missing value pattern, under an id of this layer's own
    const patternId = missingPatternId(selection);
    ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);
    // "Missing" only means something relative to a dataset. A layer where no entity has a datum
    // is being used for its geometry rather than to encode data - rastermap-bins.js draws the
    // choropleth as a transparent outline over a raster, with fill("none") and no data at all -
    // so texturing every entity there would paint over what the layer is meant to reveal. Such a
    // layer keeps the caller's fill and is not classed --undefined.
    const encodesData = props.mergedData.some(d => defined(d.datum));
    // Where a dataset is present, one notion of a missing value is shared by the fill and the
    // --undefined class: an entity the dataset does not cover is as missing as one the predicate
    // rejects. Short-circuiting also keeps both accessors from being called with undefined.
    function hasValue(d) {
      return !encodesData || defined(d.datum) && props.defined(d.datum);
    }
    // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
    function getMapFill(d) {
      return hasValue(d) ? props.fill(d.datum) : "url(#".concat(patternId, ")");
    }
    const mapAreas = selection
    // Typed to the element the join creates, so the fill filters below can read the fill
    // currently in the DOM without narrowing d3's nullable BaseType at every call.
    .selectAll(".sszvis-map__area").data(props.mergedData).join("path").classed("sszvis-map__area", true).classed("sszvis-map__area--entering", true).attr("data-event-target", "").classed("sszvis-map__area--entering", false);
    mapAreas.classed("sszvis-map__area--undefined", d => !hasValue(d)).attr("d", d => props.mapPath(d.geoJson));
    // The fill is applied exactly once, so the transition has the previous colour to interpolate
    // from. Writing it to the plain selection first would put the final colour in the DOM before
    // the tween started, and the tween would then interpolate that colour onto itself.
    //
    // Only a colour-to-colour change can be tweened. d3 has no interpolator for a paint-server
    // reference, so it falls back to interpolating the numbers embedded in the two strings: the
    // "-1" of "url(#missing-pattern-1)" pairs with a colour's channels and the tween spends its
    // whole run pointing at patterns that do not exist - "url(#missing-pattern255)" - which paint
    // nothing, so the area vanishes until the transition lands. An area entering or leaving the
    // missing-value texture therefore takes its fill synchronously.
    if (props.transitionColor) {
      const tweenable = function (d) {
        return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
      };
      mapAreas.filter(tweenable).transition().call(slowTransition).attr("fill", getMapFill);
      mapAreas.filter(function (d) {
        return !tweenable.call(this, d);
      }).attr("fill", getMapFill);
    } else {
      mapAreas.attr("fill", getMapFill);
    }
    // the tooltip anchor generator
    const ta = tooltipAnchor().position(d => {
      // Read inside the callback, as the JavaScript did: a mapPath without a projection is only
      // an error once there is an anchor to place, so an empty mergedData still renders.
      // d3's own typings expect the projection type as a type argument here. The runtime guard
      // below still covers a GeoPath whose projection was never set, and a mapPath that is a
      // bare path function with no projection method at all - which the JSDoc's {d3.geo.path}
      // contract permits but this component has never supported.
      const projection = props.mapPath.projection();
      if (typeof projection !== "function") {
        throw new TypeError("map/renderer/base: mapPath must be a d3.geoPath with a projection, since the tooltip anchors are positioned with it");
      }
      // The centre is handed over whole rather than narrowed to a pair. getGeoJsonCenter returns
      // number[] because an unvalidated `center` property can parse to any length, and the
      // JavaScript passed whatever it produced straight to the projection; truncating here would
      // change what a non-d3 projection function that reads past index 1 receives.
      const point = projection(getGeoJsonCenter(d.geoJson));
      // Only a hand-written projection can return null here: d3's own projections clip in the
      // stream, not in the point call, and return a pair - of NaN, for a malformed centre. A null
      // is passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
      // translateString and renders transform="translate(undefined,undefined)". Substituting a
      // NaN pair here would put a different attribute value in the DOM for the same input.
      return point;
    });
    const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);
    // attach tooltip anchors
    tooltipGroup.call(ta);
  });
}

export { mapRendererBase as default };
//# sourceMappingURL=base.js.map
