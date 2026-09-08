import { dispatch, select } from 'd3';
import { component } from '../../d3-component.js';
import { functor, compose, prop } from '../../fn.js';
import translateString from '../../svgUtils/translateString.js';
import { defaultTransition, OWN_TRANSITION } from '../../transition.js';
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
 *                                                  changes. Default true. An entering circle grows from zero, an
 *                                                  updating one interpolates to its new radius, and a departing one
 *                                                  shrinks to zero before it is removed.
 *
 * Note: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill are all
 * required in practice, and each fails differently when left out.
 *
 * Note: the over, out and click handlers registered through .on() are called with the hovered map
 * entity's datum - undefined for a feature that matched no data. Registering one of them is also
 * what makes the circles a hit area: with no handler registered they carry pointer-events: none
 * and the pointer falls through to the base layer beneath, so a bubble map's interaction then
 * comes entirely from the enclosing choropleth's own dispatch (see below).
 *
 * Note: on() forwards straight to a d3 dispatch, so it inherits its semantics: it returns the
 * component for chaining and the handler when called with a name alone, an unknown event name
 * throws, a namespaced name such as "over.tooltip" is accepted, and null removes a handler.
 *
 * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
 * top of them. Where no handler is registered on this component they are decoration rather than a
 * hit area, so they carry pointer-events: none and let the pointer through to the area beneath -
 * which is what keeps the base layer's handlers, and so choropleth's tooltips, working over the
 * middle of a bubble. Registering over, out or click restores hit testing on the circles, since a
 * consumer who wants those handlers is asking for the bubbles to be the target; the base layer's
 * handlers are then shadowed over each bubble, as they were before this note was written.
 *
 * Note: the circles are sorted by radius descending, so the largest paint first and smaller ones sit
 * on top of them. That is a DOM reordering, so the rendered order does not follow mergedData.
 *
 * Note: the exit selection is handled inside join()'s third argument, since join() removes the
 * departing nodes itself and returns only the merged enter+update selection.
 *
 * Note: the join is keyed on geoJson.id. A feature without one is given an identity of its own,
 * held against the feature object, so a keyless collection keeps its circles across renders too.
 * The identity is the object, not its contents: a caller who rebuilds equivalent feature objects
 * between renders gets fresh circles rather than the previous ones, and should author ids if it
 * needs the circles to persist.
 *
 * Note: the radius accessor is called once per circle for the radius itself and again for each
 * comparison the size sort makes, so it runs several times more often than there are data.
 *
 * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
 * come entirely from the inline styles this component writes - and a consumer cannot restyle them
 * from their own stylesheet, since an inline style beats any author rule short of !important.
 *
 * Note: this renderer shares three quirks with the base renderer, documented at length in
 * src/map/renderer/base.ts: the --entering modifier is added and removed within the same render, so
 * it is never observable and offers no enter-only styling hook; the anchor positions go through
 * getGeoJsonCenter, which computes the centre on every call and caches nothing, and the transform
 * is rewritten on the merged enter+update selection, so moving a feature's geometry moves its
 * bubble on the next render; and mapPath must be a real d3.geoPath,
 * since the positions read mapPath.projection(). The transition is the intended one:
 * defaultTransition() is passed straight to .transition(t), so its 300ms and easePolyOut survive.
 *
 * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
 * the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */
function parseTypename(typename) {
  const dot = typename.indexOf(".");
  const type = dot < 0 ? typename : typename.slice(0, dot);
  const name = dot < 0 ? "" : typename.slice(dot + 1);
  return {
    type,
    name,
    key: "".concat(type, ".").concat(name)
  };
}
/** The name half of a canonical key, which is everything after its single separating dot. */
function nameOfKey(key) {
  return key.slice(key.indexOf(".") + 1);
}
const anonymousKeys = new WeakMap();
let anonymousCount = 0;
function anonymousKey(feature) {
  const existing = anonymousKeys.get(feature);
  if (existing !== undefined) return existing;
  const key = "anonymous:".concat(++anonymousCount);
  anonymousKeys.set(feature, key);
  return key;
}
/**
 * The join key: the feature id, which GeoJSON does not require. A feature without one falls back to
 * an identity of its own, so a keyless collection still keeps each circle across renders instead of
 * collapsing every feature onto the key "undefined". The two namespaces are disjoint, so no real id
 * - not even the string "anonymous:1" - can be read as a fallback key. d3 appends "" to whatever
 * this returns, so an id is stringified either way; String() only makes that explicit for the type.
 */
function keyOf(d) {
  return d.geoJson.id == null ? anonymousKey(d.geoJson) : "id:".concat(String(d.geoJson.id));
}
/** Reads the datum off a merged entry, as the JavaScript's module-level accessor did. */
const datumAcc = prop("datum");
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
function mapRendererBubble() {
  const event = dispatch("over", "out", "click");
  /**
   * The typenames a consumer registered, tallied in on() below because d3's dispatch cannot be
   * asked what it holds: dispatch.on("over") reports only the handler registered under the bare
   * name, and returns undefined for one registered as "over.tooltip".
   */
  const registered = new Set();
  /** Whether any of this component's handlers is registered, under any namespace. */
  const hasListeners = () => registered.size > 0;
  const anchoredCirclesComponent = component().prop("mergedData").prop("mapPath").prop("radius", functor).prop("fill", functor).prop("strokeColor", functor).strokeColor("#ffffff").prop("strokeWidth", functor).strokeWidth(1).prop("transition").transition(true).render(function () {
    const selection = select(this);
    const props = selection.props();
    // Composed rather than written as an arrow: fn.compose invokes each stage with .call(this),
    // so a radius accessor written as a function receives d3's circle node as `this`, exactly as
    // the JavaScript did. An arrow here would call it with `this === undefined`.
    const radiusAcc = compose(props.radius, datumAcc);
    const anchoredCircles = selection.selectGroup("anchoredCircles").selectAll(".sszvis-anchored-circle").data(props.mergedData, keyOf).join(enter => enter.append("circle")
    // classed, not attr: the component owns these two class names and leaves whatever
    // else is on the element alone.
    .classed("sszvis-anchored-circle sszvis-anchored-circle--entering", true)
    // Entering circles start at zero so the radius transition has somewhere to come
    // from; without a starting value the tween would interpolate from null.
    .attr("r", 0), update => update,
    // The exit selection has to be handled here: join() removes the departing nodes itself
    // and returns only the merged enter+update selection, so an .exit() read off its result
    // is always empty.
    exit => props.transition ? exit.transition(defaultTransition()).attr("r", 0).remove() : exit.remove())
    // d3 calls a listener with the event first and the bound datum second; the datum here is
    // the merged entry, so the handler is handed the map entity's own datum off it.
    .on("mouseover", function (_event, d) {
      event.call("over", this, d.datum);
    }).on("mouseout", function (_event, d) {
      event.call("out", this, d.datum);
    }).on("click", function (_event, d) {
      event.call("click", this, d.datum);
    }).attr("transform", d => {
      const position = anchorPosition(props.mapPath, d.geoJson);
      return translateString(position[0], position[1]);
    }).style("fill", d => props.fill(d.datum)).style("stroke", d => props.strokeColor(d.datum)).style("stroke-width", d => props.strokeWidth(d.datum))
    // The circles paint over the base layer's areas, which carry the map's event targets. Where
    // this component has no listeners of its own they are decoration, not a hit area, so they
    // let the pointer through to the area beneath - the same way the mesh and lake overlay
    // layers stay out of the way. Without that the middle of every bubble is a dead zone:
    // choropleth binds its handlers to [data-event-target], which a circle is not.
    //
    // A consumer who registered over/out/click on the bubbles themselves is asking for exactly
    // that hit area, though, so it is left in place for them rather than silently withdrawing
    // the public on() API. Removing the property restores the inherited default.
    // Written through a value function because d3 types style() as accepting either a value or
    // null, never a union of the two.
    .style("pointer-events", () => hasListeners() ? null : "none").sort((a, b) => props.radius(b.datum) - props.radius(a.datum));
    // Remove the --entering modifier from the updating circles
    anchoredCircles.classed("sszvis-anchored-circle--entering", false);
    // The radius is written exactly once, so the transition has the previous value - zero for an
    // entering circle - to interpolate from. Writing it to the plain selection first would put
    // the final radius in the DOM before the tween started, and the tween would then interpolate
    // that radius onto itself.
    if (props.transition) {
      anchoredCircles.transition(defaultTransition(OWN_TRANSITION)).attr("r", radiusAcc);
    } else {
      // An in-flight tween from an earlier render would overwrite the radius written here,
      // so it is interrupted first - by name, so a transition the consumer scheduled on
      // these circles keeps running. The exit transition above is deliberately left
      // unnamed: it is on departing nodes, and giving it this name would let an interrupt
      // cancel a pending .remove() and leave them behind.
      anchoredCircles.interrupt(OWN_TRANSITION).attr("r", radiusAcc);
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
    if (value !== event) return value;
    // A setter call, and d3 validated the typenames by returning the dispatch. It accepts a
    // space-separated list of them, and a null handler removes rather than registers. The rest are
    // d3's own rules, checked against it rather than read off its source: an empty or
    // whitespace-only list does nothing at all, and for a typename carrying a name but no type a
    // null handler removes that name from every event type while a non-null one is ignored.
    const [typenames, handler] = args;
    const list = String(typenames).trim();
    if (list === "") return anchoredCirclesComponent;
    for (const typename of list.split(/\s+/)) {
      const {
        type,
        name,
        key
      } = parseTypename(typename);
      if (handler == null) {
        if (type === "") {
          for (const held of [...registered]) if (nameOfKey(held) === name) registered.delete(held);
        } else {
          registered.delete(key);
        }
      } else if (type !== "") {
        registered.add(key);
      }
    }
    return anchoredCirclesComponent;
  };
  return anchoredCirclesComponent;
}

export { mapRendererBubble as default };
//# sourceMappingURL=bubble.js.map
