/**
 * @module sszvis/map/anchoredCircles
 *
 * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
 * You will usually want to pass this component, configured, as the .anchoredShape property of a base
 * map component.
 *
 * @property {Object} mergedData                    Used internally by the base map component which renders this. Is a merged dataset used to render the shapes.
 *                                                  Required and unvalidated: omitting it reaches d3's keyed join as
 *                                                  undefined, which throws.
 * @property {Function} mapPath                     Used internally by the base map component which renders this. Is a path generation function which provides projections.
 *                                                  It must be a real d3.geoPath with a projection set, since the anchor
 *                                                  positions call mapPath.projection(); see the note below.
 * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
 *                                                  It has no default and is called unguarded, so omitting it throws -
 *                                                  and so does an accessor that reads through a datum without checking,
 *                                                  since a feature with no data is still given a circle.
 * @property {Color, Function} fill                 The fill color of the circles. Can be a function. No default, and
 *                                                  called unguarded, so omitting it throws too.
 * @property {Color, Function} strokeColor          The stroke color of the circles. Can be a function. Default #ffffff.
 * @property {Number, Function} strokeWidth         The stroke width of the circles. Can be a function. Default 1.
 * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data changes. Default true
 *
 * Note: the over, out and click handlers registered through .on() are called with undefined rather
 * than with the map entity's datum. The listeners are written for d3 v3, where a listener received
 * the datum first; since d3 v6 it receives the event first, so what they read as `d.datum` is a
 * property of a PointerEvent. The dispatch itself works, unlike the geojson renderer's, so a
 * handler does fire - it just learns nothing about which entity was hovered.
 *
 * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
 * top - and they carry neither a data-event-target attribute nor a pointer-events override. As
 * choropleth binds its own handlers to [data-event-target] after calling the anchored shape, the
 * circles are never bound, so a pointer over a bubble reaches neither the base layer's handler nor
 * (usefully) the bubble's own. Hovering the middle of a bubble in either docs example produces no
 * tooltip at all.
 *
 * Note: the radius is written onto the plain selection first and then transitioned to the very same
 * value, so the tween interpolates a radius onto itself and nothing animates - on enter or on
 * update. Unlike the base and geojson renderers, though, the transition really is the intended one:
 * defaultTransition() is passed as `t` to .transition(t) rather than through the no-op
 * `.transition().call(slowTransition)` pattern, so its 300ms and easePolyOut survive.
 *
 * Note: the exit selection is read off the merged selection that join() returned, where it does not
 * exist - so both exit branches are dead code, the shrink-to-zero transition and the plain remove
 * alike. join() has already removed the departing circles synchronously, so a bubble leaving the
 * data disappears instantly rather than shrinking away, whatever `transition` says.
 *
 * Note: the join is keyed on geoJson.id, which GeoJSON does not require. Features without one all
 * key to "undefined", so on every re-render the first node matches and every node past it is exited
 * and replaced by a fresh enter node - the count stays right, but all but one circle is destroyed
 * and recreated each time, losing any transition in flight.
 *
 * Note: the radius accessor is called for every circle twice over - once for the attribute and once
 * for the transition - and again for each comparison the size sort makes, so it runs several times
 * more often than there are data. The class is written with attr rather than classed, so it is replaced wholesale on every
 * render and any class a consumer added to a circle is destroyed. The --entering modifier is added
 * and removed within the same render, so it is never observable from outside and offers no
 * enter-only styling hook, as in the base renderer.
 *
 * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
 * come entirely from the inline styles this component writes - and a consumer cannot restyle them
 * from their own stylesheet, since an inline style beats any author rule short of !important.
 *
 * Note: the anchor positions go through getGeoJsonCenter, which caches a centre onto every feature's
 * properties and never invalidates it, so moving a feature's geometry leaves its bubble behind.
 * Shared with the base renderer. This component adds no tooltip anchors of its own; a bubble map's
 * tooltips are anchored by the base renderer underneath it.
 * See test/map/renderer/bubble.test.ts.
 *
 * @return {sszvis.component}
 */

import type { GeoPath, GeoProjection } from "d3";
import { dispatch, select } from "d3";
import { type Component, component } from "../../d3-component.js";
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

export interface MapRendererBubbleComponent<T = unknown> extends Component {
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
 * The join key, as d3 receives it: the feature id, or the string "undefined" for a feature without
 * one - which is why keyless features all collide. d3 stringifies the key itself with `+ ""`; this
 * states the fallback rather than letting undefined reach a type that excludes it. The one strict
 * divergence is a symbol id, which `+ ""` would have thrown on - GeoJSON does not allow one.
 */
function keyOf<T>(d: MergedGeoDatum<T>): string {
  return String(d.geoJson.id);
}

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
 * Narrows a centre to the pair d3's projections read. getGeoJsonCenter returns number[], since an
 * unvalidated `center` property can parse to any length; a projection reads only the first two
 * entries, so this makes that explicit without changing what is passed. Follows base.ts.
 */
function toGeoPoint(center: number[]): GeoPoint {
  return [center[0], center[1]];
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
    // Only reachable for a real d3.geoPath whose projection was never set. A bare path function
    // throws one line above, from reading .projection, exactly as the JavaScript did.
    throw new TypeError("props.mapPath.projection(...) is not a function");
  }
  const projected = projection(toGeoPoint(getGeoJsonCenter(geoJson)));
  if (projected === null) {
    throw new TypeError("Cannot read properties of null (reading '0')");
  }
  return projected;
}

export default function <T = unknown>(): MapRendererBubbleComponent<T> {
  const event = dispatch("over", "out", "click");

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

      const radiusAcc = (d: MergedGeoDatum<T>) => props.radius(d.datum);

      const anchoredCircles = selection
        .selectGroup("anchoredCircles")
        .selectAll<SVGCircleElement, MergedGeoDatum<T>>(".sszvis-anchored-circle")
        // The key is the feature id, stringified by d3 - which is how every feature without one
        // collides on "undefined". See the module note.
        .data(props.mergedData, keyOf)
        .join("circle")
        .attr("class", "sszvis-anchored-circle sszvis-anchored-circle--entering")
        .attr("r", radiusAcc)
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
        .sort((a, b) => props.radius(b.datum) - props.radius(a.datum));

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
  anchoredCirclesComponent.on = (...args: [string, never]) => {
    const value = event.on.apply(event, args);
    return value === event ? anchoredCirclesComponent : value;
  };

  return anchoredCirclesComponent;
}
