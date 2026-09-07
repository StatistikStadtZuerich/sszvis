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
 * Note: the join is keyed on geoJson.id, falling back to the feature's position in the merged data
 * for a feature without one, so a keyless collection keeps its circles across renders too.
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
 * getGeoJsonCenter, which caches a centre onto every feature's properties and never invalidates it,
 * so moving a feature's geometry leaves its bubble behind; and mapPath must be a real d3.geoPath,
 * since the positions read mapPath.projection(). The transition is the intended one:
 * defaultTransition() is passed straight to .transition(t), so its 300ms and easePolyOut survive.
 *
 * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
 * the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */

import type { GeoPath, GeoProjection } from "d3";
import { dispatch, select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import translateString from "../../svgUtils/translateString.js";
import { defaultTransition } from "../../transition.js";
import { type GeoPoint, getGeoJsonCenter, type MergedGeoDatum } from "../mapUtils.js";

/** A constant or an accessor; both are accepted, since these props are wrapped by fn.functor. */
type BubbleValue<T, R> = R | ((datum: T) => R);

/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredBubbleValue<T, R> = (datum?: T) => R;

/** A handler as this component's own event API delivers it - which is to say, with undefined. */
type BubbleEventHandler = (datum: undefined) => void;

type BubbleProps<T> = {
  mergedData: MergedGeoDatum<T>[];
  mapPath: GeoPath;
  radius: StoredBubbleValue<T, number>;
  fill: StoredBubbleValue<T, string>;
  strokeColor: StoredBubbleValue<T, string>;
  strokeWidth: StoredBubbleValue<T, number>;
  transition: boolean;
};

export interface MapRendererBubbleComponent<T = unknown>
  extends ComponentBuilder<MapRendererBubbleComponent<T>> {
  mergedData(): MergedGeoDatum<T>[] | undefined;
  mergedData(value: MergedGeoDatum<T>[]): MapRendererBubbleComponent<T>;
  mapPath(): GeoPath | undefined;
  mapPath(value: GeoPath): MapRendererBubbleComponent<T>;
  radius(): StoredBubbleValue<T, number> | undefined;
  radius<U = T>(value: BubbleValue<U, number>): MapRendererBubbleComponent<T>;
  fill(): StoredBubbleValue<T, string> | undefined;
  fill<U = T>(value: BubbleValue<U, string>): MapRendererBubbleComponent<T>;
  strokeColor(): StoredBubbleValue<T, string>;
  strokeColor<U = T>(value: BubbleValue<U, string>): MapRendererBubbleComponent<T>;
  strokeWidth(): StoredBubbleValue<T, number>;
  strokeWidth<U = T>(value: BubbleValue<U, number>): MapRendererBubbleComponent<T>;
  transition(): boolean;
  transition(enabled: boolean): MapRendererBubbleComponent<T>;
  /**
   * Registers a handler for "over", "out" or "click", returning the component so it can be
   * chained; called with an event name alone it returns that handler. Note that a handler is
   * called with undefined rather than with the hovered entity's datum; see the module note.
   */
  on(eventName: string, handler: BubbleEventHandler | null): MapRendererBubbleComponent<T>;
  on(eventName: string): BubbleEventHandler | undefined;
}

/**
 * A stable identity for a feature carrying no id. It cannot be the feature's position: d3 computes
 * an existing node's key from the selection that node is in, and this component sorts that
 * selection by radius, so a positional key means something different on the next render. Two
 * keyless features would then keep their elements but exchange which feature each one stands for.
 *
 * Held against the feature object, which is the same object from one render to the next for a
 * given collection, and weakly so a discarded collection is still collectable.
 */
/** The events this component dispatches, and the ones its hit testing depends on. */
const BUBBLE_EVENTS = ["over", "out", "click"] as const;

const anonymousKeys = new WeakMap<object, string>();
let anonymousCount = 0;

function anonymousKey(feature: object): string {
  const existing = anonymousKeys.get(feature);
  if (existing !== undefined) return existing;
  const key = `anonymous:${++anonymousCount}`;
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
function keyOf<T>(d: MergedGeoDatum<T>): string {
  return d.geoJson.id == null ? anonymousKey(d.geoJson) : `id:${String(d.geoJson.id)}`;
}

/** Reads the datum off a merged entry, as the JavaScript's module-level accessor did. */
const datumAcc = fn.prop("datum");

/**
 * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
 * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
 * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
 * change behaviour - the fix is to take the datum from d3's second argument.
 */
function legacyDatum(event: Event & { datum?: undefined }): undefined {
  return event.datum;
}

/**
 * Reads the anchor position for a feature, as the JavaScript did: through mapPath.projection(),
 * which is why a bare path function throws here rather than being reported. The projection's own
 * result is indexed unguarded too, so a clipped point throws from that index.
 */
function anchorPosition(
  mapPath: GeoPath,
  geoJson: MergedGeoDatum<never>["geoJson"]
): [number, number] {
  // The type argument is unchecked, as in base.ts: GeoPath types projection() as a union that
  // includes shapes with no call signature, and only the caller knows which one was set.
  const projection = mapPath.projection<GeoProjection>();
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
  const projected = projection(getGeoJsonCenter(geoJson) as GeoPoint);
  if (projected === null) {
    // The JavaScript indexed this result directly, so a projection that cannot place the point
    // threw from that index; the message is V8's for it.
    throw new TypeError("Cannot read properties of null (reading '0')");
  }
  return projected;
}

export default function mapRendererBubble<T = unknown>(): MapRendererBubbleComponent<T> {
  const event = dispatch("over", "out", "click");

  /** Whether a consumer registered any of this component's three handlers. */
  const hasListeners = () =>
    BUBBLE_EVENTS.some((name) => event.on(name) !== undefined && event.on(name) !== null);

  const anchoredCirclesComponent = component<MapRendererBubbleComponent<T>>()
    .prop("mergedData")
    .prop("mapPath")
    .prop("radius", fn.functor)
    .prop("fill", fn.functor)
    .prop("strokeColor", fn.functor)
    .strokeColor("#ffffff")
    .prop("strokeWidth", fn.functor)
    .strokeWidth(1)
    .prop("transition")
    .transition(true)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<BubbleProps<T>>();

      // Composed rather than written as an arrow: fn.compose invokes each stage with .call(this),
      // so a radius accessor written as a function receives d3's circle node as `this`, exactly as
      // the JavaScript did. An arrow here would call it with `this === undefined`.
      const radiusAcc = fn.compose(props.radius, datumAcc) as (d: MergedGeoDatum<T>) => number;

      const anchoredCircles = selection
        .selectGroup("anchoredCircles")
        .selectAll<SVGCircleElement, MergedGeoDatum<T>>(".sszvis-anchored-circle")
        .data(props.mergedData, keyOf)
        .join(
          (enter) =>
            enter
              .append("circle")
              // classed, not attr: the component owns these two class names and leaves whatever
              // else is on the element alone.
              .classed("sszvis-anchored-circle sszvis-anchored-circle--entering", true)
              // Entering circles start at zero so the radius transition has somewhere to come
              // from; without a starting value the tween would interpolate from null.
              .attr("r", 0),
          (update) => update,
          // The exit selection has to be handled here: join() removes the departing nodes itself
          // and returns only the merged enter+update selection, so an .exit() read off its result
          // is always empty.
          (exit) =>
            props.transition
              ? exit.transition(defaultTransition()).attr("r", 0).remove()
              : exit.remove()
        )
        .on("mouseover", function (e: Event & { datum?: undefined }) {
          event.call("over", this, legacyDatum(e));
        })
        .on("mouseout", function (e: Event & { datum?: undefined }) {
          event.call("out", this, legacyDatum(e));
        })
        .on("click", function (e: Event & { datum?: undefined }) {
          event.call("click", this, legacyDatum(e));
        })
        .attr("transform", (d) => {
          const position = anchorPosition(props.mapPath, d.geoJson);
          return translateString(position[0], position[1]);
        })
        .style("fill", (d) => props.fill(d.datum))
        .style("stroke", (d) => props.strokeColor(d.datum))
        .style("stroke-width", (d) => props.strokeWidth(d.datum))
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
        .style("pointer-events", () => (hasListeners() ? null : "none"))
        .sort((a, b) => props.radius(b.datum) - props.radius(a.datum));

      // Remove the --entering modifier from the updating circles
      anchoredCircles.classed("sszvis-anchored-circle--entering", false);

      // The radius is written exactly once, so the transition has the previous value - zero for an
      // entering circle - to interpolate from. Writing it to the plain selection first would put
      // the final radius in the DOM before the tween started, and the tween would then interpolate
      // that radius onto itself.
      if (props.transition) {
        anchoredCircles.transition(defaultTransition()).attr("r", radiusAcc);
      } else {
        anchoredCircles.attr("r", radiusAcc);
      }
    });

  // The argument tuple is typed as geojson.ts and src/behavior/panning.ts type their own on():
  // d3's dispatch.on derives its callback type from a *literal* event name, so a plain string
  // collapses the callback to never. Narrowing to "over" | "out" | "click" would type the callback
  // properly but would also reject the namespaced typenames d3 accepts at runtime, such as
  // "over.tooltip".
  anchoredCirclesComponent.on = ((...args: [string, never]) => {
    const value = event.on.apply(event, args);
    return value === event ? anchoredCirclesComponent : value;
  }) as MapRendererBubbleComponent<T>["on"];

  return anchoredCirclesComponent;
}
