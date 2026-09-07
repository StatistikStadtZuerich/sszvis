import { dispatch, select } from 'd3';
import { component } from '../../d3-component.js';
import { functor, compose, prop } from '../../fn.js';
import translateString from '../../svgUtils/translateString.js';
import { defaultTransition } from '../../transition.js';
import { getGeoJsonCenter } from '../mapUtils.js';

/**
 * bubble renderer component
 *
 * @module sszvis/map/renderer/bubble
 *
 * @template T The type of the data values merged onto the map features
 *
 * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
 * You will usually want to pass this component, configured, as the .anchoredShape property of a base
 * map component.
 *
 * @property {Array<Object>} mergedData             An array of merged data objects, each with a datum property (the datum
 *                                                  for the map entity) and a geoJson property (its shape). Produced by
 *                                                  the base map component which renders this. Required and unvalidated:
 *                                                  omitting it reaches d3's keyed join as undefined, which throws. Every
 *                                                  feature is present, including those with no matching datum, whose
 *                                                  datum is undefined.
 * @property {d3.geo.path} mapPath                  A path generator supplying the projection, passed in by the base map
 *                                                  component which renders this. Required: omitting it throws, and it
 *                                                  must be a real d3.geoPath with a projection set, since the anchor
 *                                                  positions call mapPath.projection(); see the note below.
 * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
 *                                                  It has no default and is called unguarded, so omitting it throws -
 *                                                  and so does an accessor that reads through a datum without checking,
 *                                                  since a feature with no data is still given a circle.
 * @property {String, Function} fill                The fill color of the circles. Can be a function. No default, and
 *                                                  called unguarded, so omitting it throws too.
 * @property {String, Function} strokeColor         The stroke color of the circles. Can be a function. Default #ffffff.
 * @property {Number, Function} strokeWidth         The stroke width of the circles. Can be a function. Default 1.
 *                                                  Documented nowhere else: docs/map-signature/README.md omits it.
 * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data
 *                                                  changes. Default true - but it never actually animates a radius, and
 *                                                  never affects a departing circle; see the notes below.
 *
 * Note: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill are all
 * required in practice, and each fails differently when left out.
 *
 * Note: the over, out and click handlers registered through .on() are called with undefined rather
 * than with the map entity's datum. The listeners are written for d3 v3, where a listener received
 * the datum first; since d3 v6 it receives the event first, so what they read as `d.datum` is a
 * property of a PointerEvent. The dispatch itself works, unlike the geojson renderer's, so a
 * handler does fire - it just learns nothing about which entity was hovered.
 *
 * Note: on() forwards straight to a d3 dispatch, so it inherits its semantics: it returns the
 * component for chaining and the handler when called with a name alone, an unknown event name
 * throws, a namespaced name such as "over.tooltip" is accepted, and null removes a handler.
 *
 * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
 * top - and they carry neither a data-event-target attribute nor a pointer-events override. As
 * choropleth binds its own handlers to [data-event-target] after calling the anchored shape, the
 * circles are never bound, so a pointer over a bubble reaches neither the base layer's handler nor,
 * usefully, the bubble's own.
 *
 * Note: the circles are sorted by radius descending, so the largest paint first and smaller ones sit
 * on top of them. That is a DOM reordering, so the rendered order does not follow mergedData.
 *
 * Note: the exit selection is read off the merged selection that join() returned, where it does not
 * exist - so both exit branches are dead code, the shrink-to-zero transition and the plain remove
 * alike. join() has already removed the departing circles synchronously, so a bubble leaving the
 * data disappears instantly rather than shrinking away, whatever `transition` says.
 *
 * Note: the join is keyed on geoJson.id, which GeoJSON does not require. Features that have one keep
 * their circles across a data change; features without one all key to "undefined", so on every
 * re-render the first node matches and every node past it is exited and replaced by a fresh enter
 * node - the count stays right, but all but one circle is destroyed and recreated each time, losing
 * any transition in flight.
 *
 * Note: the radius accessor is called for every circle twice over - once for the attribute and once
 * for the transition - and again for each comparison the size sort makes, so it runs several times
 * more often than there are data.
 *
 * Note: the class is written with attr rather than classed, so it is replaced wholesale on every
 * render and any class a consumer added to a circle is destroyed.
 *
 * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
 * come entirely from the inline styles this component writes - and a consumer cannot restyle them
 * from their own stylesheet, since an inline style beats any author rule short of !important.
 *
 * Note: this renderer shares four quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the radius transition interpolates a value onto itself, so nothing
 * animates on enter or on update; the --entering modifier is added and removed within the same
 * render, so it is never observable and offers no enter-only styling hook; the anchor positions go
 * through getGeoJsonCenter, which caches a centre onto every feature's properties and never
 * invalidates it, so moving a feature's geometry leaves its bubble behind; and mapPath must be a
 * real d3.geoPath, since the positions read mapPath.projection(). Unlike base, though, the
 * transition itself is the intended one - defaultTransition() is passed as `t` to .transition(t)
 * rather than through the no-op `.transition().call(slowTransition)` pattern - so its 300ms and
 * easePolyOut survive.
 *
 * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
 * the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * The join key, as d3 receives it: the feature id, or the string "undefined" for a feature without
 * one - which is why keyless features all collide. d3 appends "" to whatever this returns, so a
 * plain d.geoJson.id would already be stringified; String() only makes the "undefined" fallback
 * explicit for the type. The one divergence is a symbol id, on which d3's `+ ""` would have thrown
 * and String() does not - GeoJSON does not allow one, and no test covers it.
 */
function keyOf(d) {
  return String(d.geoJson.id);
}
/** Reads the datum off a merged entry, as the JavaScript's module-level accessor did. */
const datumAcc = prop("datum");
/**
 * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
 * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
 * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
 * change behaviour - the fix is to take the datum from d3's second argument.
 */
function legacyDatum(event) {
  return event.datum;
}
/**
 * Reads the anchor position for a feature, as the JavaScript did: through mapPath.projection(),
 * which is why a bare path function throws here rather than being reported. The projection's own
 * result is indexed unguarded too, so a clipped point throws from that index.
 */
function anchorPosition(mapPath, geoJson) {
  // The type argument is unchecked, as in base.ts: GeoPath types projection() as a union that
  // includes shapes with no call signature, and only the caller knows which one was set.
  const projection = mapPath.projection();
  if (projection === null || typeof projection !== "function") {
    // Reachable only for a real d3.geoPath whose projection was never set, where the JavaScript
    // threw "projection is not a function" from the call below. A bare path function throws one
    // line above instead, from reading .projection, as it did in the JavaScript. Not covered by
    // the suite: the message is reconstructed rather than observed.
    throw new TypeError("projection is not a function");
  }
  // The centre is handed over whole rather than narrowed to a pair, as the JavaScript did: an
  // unvalidated `center` property can parse to any length, and truncating here would change what a
  // non-d3 projection function that reads past index 1 receives. Follows base.ts.
  const projected = projection(getGeoJsonCenter(geoJson));
  if (projected === null) {
    // The JavaScript indexed this result directly, so a projection that cannot place the point
    // threw from that index; the message is V8's for it.
    throw new TypeError("Cannot read properties of null (reading '0')");
  }
  return projected;
}
function bubble () {
  const event = dispatch("over", "out", "click");
  const anchoredCirclesComponent = component().prop("mergedData").prop("mapPath").prop("radius", functor).prop("fill", functor).prop("strokeColor", functor).strokeColor("#ffffff").prop("strokeWidth", functor).strokeWidth(1).prop("transition").transition(true).render(function () {
    const selection = select(this);
    const props = selection.props();
    // Composed rather than written as an arrow: fn.compose invokes each stage with .call(this),
    // so a radius accessor written as a function receives d3's circle node as `this`, exactly as
    // the JavaScript did. An arrow here would call it with `this === undefined`.
    const radiusAcc = compose(props.radius, datumAcc);
    const anchoredCircles = selection.selectGroup("anchoredCircles").selectAll(".sszvis-anchored-circle")
    // The key is the feature id, stringified by d3 - which is how every feature without one
    // collides on "undefined". See the module note.
    .data(props.mergedData, keyOf).join("circle").attr("class", "sszvis-anchored-circle sszvis-anchored-circle--entering").attr("r", radiusAcc).on("mouseover", function (e) {
      event.call("over", this, legacyDatum(e));
    }).on("mouseout", function (e) {
      event.call("out", this, legacyDatum(e));
    }).on("click", function (e) {
      event.call("click", this, legacyDatum(e));
    }).attr("transform", d => {
      const position = anchorPosition(props.mapPath, d.geoJson);
      return translateString(position[0], position[1]);
    }).style("fill", d => props.fill(d.datum)).style("stroke", d => props.strokeColor(d.datum)).style("stroke-width", d => props.strokeWidth(d.datum)).sort((a, b) => props.radius(b.datum) - props.radius(a.datum));
    // Remove the --entering modifier from the updating circles
    anchoredCircles.classed("sszvis-anchored-circle--entering", false);
    if (props.transition) {
      const t = defaultTransition();
      // Note: join() has already removed the exiting nodes and returns the merged selection, so
      // this exit selection is empty and the shrink-away transition never runs. Kept as the
      // JavaScript had it; see the module note.
      anchoredCircles.exit().transition(t).attr("r", 0).remove();
      anchoredCircles.transition(t).attr("r", radiusAcc);
    } else {
      anchoredCircles.exit().remove();
      anchoredCircles.attr("r", radiusAcc);
    }
  });
  // The argument tuple is typed as geojson.ts and src/behavior/panning.ts type their own on():
  // d3's dispatch.on derives its callback type from a *literal* event name, so a plain string
  // collapses the callback to never. Narrowing to "over" | "out" | "click" would type the callback
  // properly but would also reject the namespaced typenames d3 accepts at runtime, such as
  // "over.tooltip".
  anchoredCirclesComponent.on = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    const value = event.on.apply(event, args);
    return value === event ? anchoredCirclesComponent : value;
  };
  return anchoredCirclesComponent;
}

export { bubble as default };
//# sourceMappingURL=bubble.js.map
