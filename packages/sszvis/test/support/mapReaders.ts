import type { Feature, GeoJsonProperties, Polygon } from "geojson";
import { vi } from "vitest";

/**
 * Readers and fixtures the map suites had copied between them, with no assertion of their own.
 *
 * This is the counterpart to `mapRendererConformance.ts`: that module owns shared *contracts* -
 * tests every adopting renderer runs - while this one owns the plumbing those tests and the
 * per-renderer tests read the DOM through. Nothing here registers a test, so importing it changes
 * no suite's shape.
 */

/**
 * A unit square. The ring is wound clockwise because d3-geo interprets rings on the sphere:
 * counter-clockwise would describe the whole globe minus the square.
 *
 * `properties` is passed rather than derived from `id`: the renderer suites match on the feature's
 * own `id` and carry `{ id }` in properties as well, while the mapUtils and choropleth suites
 * deliberately leave properties empty so that a keyName lookup has nothing there to find. `id` is
 * optional because the highlight suite builds id-less features on purpose.
 */
export const square = (
  id: string | undefined,
  offset = 0,
  properties: GeoJsonProperties = {},
): Feature<Polygon> => ({
  type: "Feature",
  id,
  properties,
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [offset, offset],
        [offset, offset + 1],
        [offset + 1, offset + 1],
        [offset + 1, offset],
        [offset, offset],
      ],
    ],
  },
});

/**
 * The names of the tweens d3 scheduled on a node, e.g. ["attr.fill"], or null when nothing is
 * scheduled.
 *
 * This reads d3's private `__transition`, the same field `describesNoScheduledTransition` argues
 * about: the absence of a transition has no positive observable form, and neither has "the
 * transition that ran was a colour tween rather than a geometry one". Where a suite can instead
 * watch a rendered attribute move over time, it does that; this is for the cases where it cannot.
 */
export const tweenNames = (node: Element) => {
  // d3 stores one schedule per transition id, alongside a plain `count` of the live ones - which
  // is why the values are filtered to the objects before their tweens are read.
  interface Schedule {
    tween: { name: string }[];
  }
  // SAFETY: `__transition` is d3's own private bookkeeping, absent from lib.dom's Element.
  // Widening the type only lets us read it; the null check below is what handles it being unset.
  const schedules = (node as Element & { __transition?: Record<string, Schedule | number> })
    .__transition;
  if (!schedules) return null;
  return Object.values(schedules)
    .filter((schedule): schedule is Schedule => schedule instanceof Object)
    .flatMap((schedule) => schedule.tween.map((t) => t.name));
};

/**
 * Captures the warnings a render emits, into an array the caller reads after rendering.
 *
 * The renderers warn through sszvis.logger, which delegates to console.warn - spying on the
 * console rather than on the logger keeps this pinned to what a consumer actually sees.
 *
 * The spy is pushed onto `spies`, which the calling suite drains in its own `afterEach`. The
 * registry is the caller's rather than this module's because a support module that registered its
 * own hook would install it in every file that imports anything from here.
 */
export const captureWarnings = (spies: { mockRestore: () => void }[]) => {
  const warnings: string[] = [];
  // The parameter type is left to console.warn's own signature rather than restated, since a
  // warning's arguments are whatever the caller logged.
  const spy = vi.spyOn(console, "warn").mockImplementation((...args) => {
    warnings.push(args.map(String).join(" "));
  });
  spies.push(spy);
  return warnings;
};

/**
 * The id the layer generated for its own missing-value pattern.
 *
 * Only usable where the layer's defs hold that pattern alone. A composed map cannot use it: the
 * lake overlay writes its own pattern into the same defs element (see the comment at
 * src/map/renderer/patternedlakeoverlay.ts:51), so `defs > pattern` there is ambiguous and
 * choropleth matches the id's shape instead.
 */
export const missingId = (node: Element) =>
  node.querySelector("defs > pattern")?.getAttribute("id");

/** That pattern as a fill reference, which is what the rendered marks carry. */
export const missingFill = (node: Element) => `url(#${missingId(node)})`;
