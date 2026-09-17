import { geoCentroid, geoPath } from "d3";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resolvedColor } from "../../support/domValues.js";
import { describesMapPathGeometry } from "../../support/mapRendererConformance.js";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import {
  prepareMergedGeoData,
  swissMapPath,
  swissMapProjection,
} from "../../../src/map/mapUtils.js";
import mapRendererBase from "../../../src/map/renderer/base.js";

type Datum = { geoId: string; value: number | null };

/**
 * A unit square. The ring is wound clockwise because d3-geo interprets rings on the sphere:
 * counter-clockwise would describe the whole globe minus the square.
 */
const square = (id: string, offset = 0): Feature<Polygon> => ({
  type: "Feature",
  id,
  properties: {},
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

describe("map/renderer/base", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `base-${++layerKey}`,
    }).selectGroup("map");

  /** A fresh geojson each time, since getGeoJsonCenter caches onto the features. */
  const geoJson = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2), square("c", 4)],
  });

  let pathKey = 0;
  /** A path generator fitted to the collection, with a cache key unique to each call. */
  const mapPathOf = (collection: FeatureCollection<Polygon>) =>
    swissMapPath(100, 100, collection, `base-path-${++pathKey}`);

  const areas = (node: Element) => [...node.querySelectorAll("path.sszvis-map__area")];
  const attrs = (node: Element, attr: string) => areas(node).map((a) => a.getAttribute(attr));
  const anchors = (node: Element) => [...node.querySelectorAll("[data-tooltip-anchor]")];
  /** The id the layer generated for its own missing-value pattern. */
  const missingId = (node: Element) => node.querySelector("defs > pattern")?.getAttribute("id");
  /** That pattern as a fill reference, which is what the areas carry. */
  const missingFill = (node: Element) => `url(#${missingId(node)})`;

  /** The names of the tweens d3 scheduled on a node, e.g. ["attr.fill"]. */
  const tweenNames = (node: Element) => {
    const schedules = (node as Element & { __transition?: Record<string, unknown> }).__transition;
    if (!schedules) return null;
    return Object.values(schedules)
      .filter((s): s is { tween: { name: string }[] } => typeof s === "object" && s !== null)
      .flatMap((s) => s.tween.map((t) => t.name));
  };

  /** Renders the base layer over `data`, returning the group node it drew into. */
  const render = (
    data: Datum[],
    configure: (c: ReturnType<typeof mapRendererBase>) => ReturnType<typeof mapRendererBase> = (
      c,
    ) => c,
    key?: string,
  ) => {
    const collection = geoJson();
    const merged = prepareMergedGeoData(data, collection);
    const component = configure(
      mapRendererBase().mergedData(merged).geoJson(collection).mapPath(mapPathOf(collection)),
    );
    return group(key).call(component).node() as SVGGElement;
  };

  const fullData: Datum[] = [
    { geoId: "a", value: 1 },
    { geoId: "b", value: 2 },
    { geoId: "c", value: 3 },
  ];

  describe("rendering", () => {
    test("should render one classed path per merged datum", () => {
      const node = render(fullData);
      expect(areas(node)).toHaveLength(3);
      for (const area of areas(node)) expect(area.tagName).toBe("path");
    });

    test("should render a path for every feature when only some features have data", () => {
      const node = render([{ geoId: "a", value: 1 }]);
      expect(areas(node)).toHaveLength(3);
    });

    describesMapPathGeometry(() => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPath),
        )
        .node() as SVGGElement;
      // Every feature is drawn, so every feature is checked.
      return { marks: areas(node), expected: collection.features.map((f) => mapPath(f)) };
    });

    test("should mark every area as an event target", () => {
      const node = render(fullData);
      expect(attrs(node, "data-event-target")).toEqual(["", "", ""]);
    });

    test("should add the missing value pattern to the layer's defs exactly once", () => {
      const node = render(fullData);
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(root.querySelectorAll("defs > pattern")).toHaveLength(1);
      expect(root.querySelectorAll(`#${missingId(node)}`)).toHaveLength(1);
    });

    // NOTE: the entering class is added and removed in the same chain, so it is never observable
    // from outside a render - there is no enter-only styling hook despite the class existing.
    test("never leaves the entering class on an area", () => {
      const node = render(fullData);
      expect(node.querySelectorAll(".sszvis-map__area--entering")).toHaveLength(0);
    });
  });

  // The fill is only applied through the transition when transitionColor is on, so these tests
  // read the attribute synchronously with the transition disabled. The transition itself is
  // covered by the transitionColor block below.
  describe("fill", () => {
    test("should fill every area black when no fill is configured", () => {
      const node = render(fullData, (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", "black"]);
    });

    test("should fill each area from the fill accessor when it is called with the datum", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.transitionColor(false).fill((d: Datum | undefined) => {
          seen.push(d);
          return `rgb(${d?.value}, 0, 0)`;
        }),
      );
      expect(attrs(node, "fill")).toEqual(["rgb(1, 0, 0)", "rgb(2, 0, 0)", "rgb(3, 0, 0)"]);
      expect(seen).toContainEqual({ geoId: "a", value: 1 });
    });

    test("should fill every area the same colour when the fill is a constant", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
    });

    test("should texture an area with the missing value pattern when the defined predicate fails", () => {
      const node = render(fullData, (c) =>
        c
          .transitionColor(false)
          .fill("#ff0000")
          .defined((d: Datum | undefined) => d?.value !== 2),
      );
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), "#ff0000"]);
    });

    test("should texture a feature instead of calling the fill accessor when it has no data", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.transitionColor(false).fill((d?: Datum) => {
          seen.push(d);
          return d ? "#00ff00" : "#0000ff";
        }),
      );
      expect(seen).not.toContain(undefined);
      expect(attrs(node, "fill")).toEqual(["#00ff00", missingFill(node), missingFill(node)]);
    });

    // "Missing" is relative to a dataset, and a layer drawing geometry rather than values says so
    // with encodesData. docs/map-extended/rastermap-bins.js depends on this, drawing the map as a
    // transparent outline over a raster with fill("none") and no data at all - texturing those
    // entities would paint over the raster the outline exists to frame.
    test("should keep the caller's fill when the layer declares that it encodes no data", () => {
      const node = render([], (c) => c.transitionColor(false).encodesData(false).fill("none"));
      expect(attrs(node, "fill")).toEqual(["none", "none", "none"]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // Undeclared, a layer whose fill is a constant is inferred to be drawing geometry, so an
    // outline over a raster keeps its fill without having to say anything. This is what keeps the
    // change from retexturing every such map already in production.
    test("should keep the caller's fill when the fill is a constant and nothing is declared", () => {
      const node = render([], (c) => c.transitionColor(false).fill("none"));
      expect(attrs(node, "fill")).toEqual(["none", "none", "none"]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // The default fill has to be a constant for the same reason. Set as an accessor it would carry
    // needsDatum, and every layer that never touches `fill` would be inferred to encode data and
    // texture its whole map before any data arrived.
    test("should leave every area untextured when the layer is left at its defaults and no data is bound", () => {
      const node = render([], (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", "black"]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // A constant fill with an accessor `defined` is still a data layer: the predicate needs a
    // datum, so the inference has to consider both accessors, not only the fill.
    test("should texture every area when a defined accessor is given even though the fill is a constant", () => {
      const node = render([], (c) =>
        c
          .transitionColor(false)
          .defined((d?: Datum) => d?.value !== undefined)
          .fill("none"),
      );
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    // The corollary of the rule above: with nothing textured, every entity goes through the fill
    // accessor, and there is no datum to hand it. An accessor that dereferences its argument has
    // to tolerate undefined on a geometry-only layer - the docs on `fill` say so.
    test("should call the fill accessor with undefined when the layer encodes no data", () => {
      const seen: unknown[] = [];
      const node = render([], (c) =>
        c
          .transitionColor(false)
          .encodesData(false)
          .fill((d?: Datum) => {
            seen.push(d);
            return "none";
          }),
      );
      expect(seen).toEqual([undefined, undefined, undefined]);
      expect(attrs(node, "fill")).toEqual(["none", "none", "none"]);
    });

    // The discriminating case for the prop: with data present, the inference would call this a
    // data layer and texture the entities it does not cover. Declaring encodesData(false) has to
    // override that, or the prop is only ever agreeing with what would have happened anyway.
    test("should leave every area untextured when encodesData is false and data is present", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c
          .transitionColor(false)
          .encodesData(false)
          .fill((d?: Datum) => {
            seen.push(d);
            return "#123456";
          }),
      );
      expect(seen).toEqual([{ geoId: "a", value: 1 }, undefined, undefined]);
      expect(attrs(node, "fill")).toEqual(["#123456", "#123456", "#123456"]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // The other half of the override: a layer built from constants alone is inferred to be drawing
    // geometry, and encodesData(true) says otherwise, texturing it before its data arrives.
    test("should texture every area when encodesData is true and the layer is built from constants alone", () => {
      const node = render([], (c) => c.transitionColor(false).encodesData(true).fill("none"));
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    // The inference: an accessor fill is a promise that the entity has a datum to read, so the
    // layer encodes values whether or not its data has arrived. This is the crash #351 closed.
    test("should texture every area without calling the fill accessor when an accessor fill has no data yet", () => {
      const seen: unknown[] = [];
      const node = render([], (c) =>
        c.transitionColor(false).fill((d?: Datum) => {
          seen.push(d);
          return String(d?.value);
        }),
      );
      expect(seen).toEqual([]);
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(3);
    });

    // One matched datum is enough to make the layer a data layer, and then the entities it does
    // not cover are textured as missing again.
    test("should texture the uncovered areas when at least one datum matches", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) => c.transitionColor(false).fill("none"));
      expect(attrs(node, "fill")).toEqual(["none", missingFill(node), missingFill(node)]);
    });
  });

  describe("the undefined class", () => {
    test("should mark an area undefined when its datum is missing", () => {
      const node = render([{ geoId: "a", value: 1 }]);
      expect(areas(node).map((a) => a.classList.contains("sszvis-map__area--undefined"))).toEqual([
        false,
        true,
        true,
      ]);
    });

    test("should mark an area undefined when it fails the defined predicate", () => {
      const node = render(fullData, (c) => c.defined((d: Datum | undefined) => d?.value !== 2));
      expect(areas(node).map((a) => a.classList.contains("sszvis-map__area--undefined"))).toEqual([
        false,
        true,
        false,
      ]);
    });

    test("should clear the undefined class when the datum arrives on a later render", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("undefined-clearing");
      const renderWith = (data: Datum[]) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(data, collection))
              .geoJson(collection)
              .mapPath(mapPath),
          )
          .node() as SVGGElement;

      renderWith([{ geoId: "a", value: 1 }]);
      const node = renderWith(fullData);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });
  });

  describe("transitionColor", () => {
    test("should schedule a fill transition when nothing is configured", () => {
      const node = render(fullData);
      expect(tweenNames(areas(node)[0])).toContain("attr.fill");
    });

    test("should apply the fill synchronously when the colour transition is disabled", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(tweenNames(areas(node)[0])).toBeNull();
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
    });

    test("should leave the final fill out of the DOM when a fill transition is scheduled", () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual([null, null, null]);
      expect(tweenNames(areas(node)[0])).toContain("attr.fill");
    });

    // An entering area has no previous fill to interpolate from, and d3's rgb interpolator treats
    // an unparseable start as a constant, so the first tick writes the final colour outright
    // rather than fading in from the SVG default. The attribute is only absent for the frame
    // between the render and that first tick.
    test("should paint an entering area its final fill when the transition's first tick runs", async () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(attrs(node, "fill")).toEqual(["rgb(255, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 0, 0)"]);
    });

    test("should keep the previous colour in the DOM when a fill transition starts", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("colour-transition");
      const renderWith = (fill: string, transition: boolean) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(transition)
              .fill(fill),
          )
          .node() as SVGGElement;

      renderWith("#ff0000", false);
      const node = renderWith("#00ff00", true);
      // The old colour is still in the DOM, so the tween interpolates red to green.
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
      expect(tweenNames(areas(node)[0])).toContain("attr.fill");
    });

    // d3 has no interpolator for a paint-server reference, so a colour-to-texture tween would
    // interpolate the numbers embedded in the two strings and spend its run pointing at patterns
    // that do not exist - "url(#missing-pattern255)" - painting nothing at all. Such a change is
    // applied synchronously instead, so the texture is in the DOM at once and no tween is
    // scheduled for it.
    test("should apply the fill synchronously without a tween when the colour changes to the missing texture", async () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("defined-to-missing");
      const renderWith = (definedValue: boolean, transition: boolean) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(transition)
              .defined(definedValue)
              .fill("#ff0000"),
          )
          .node() as SVGGElement;

      renderWith(true, false);
      const node = renderWith(false, true);
      const textured = missingFill(node);
      expect(attrs(node, "fill")).toEqual([textured, textured, textured]);
      expect(tweenNames(areas(node)[0]) ?? []).not.toContain("attr.fill");

      // And it stays put rather than being walked back by a tween that started anyway.
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(attrs(node, "fill")).toEqual([textured, textured, textured]);
    });

    // The reverse direction is the same: leaving the texture cannot be interpolated either.
    test("should apply the fill synchronously when the colour changes away from the missing texture", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("missing-to-defined");
      const renderWith = (definedValue: boolean, transition: boolean) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(transition)
              .defined(definedValue)
              .fill("#00ff00"),
          )
          .node() as SVGGElement;

      renderWith(false, false);
      const node = renderWith(true, true);
      expect(attrs(node, "fill")).toEqual(["#00ff00", "#00ff00", "#00ff00"]);
    });

    /**
     * What a consumer can see of the transition is that the colour travels: it is still between
     * the two colours partway through and has arrived once it is over. The duration and easing
     * themselves belong to src/transition.ts, which has its own tests - reading them back off
     * d3's private `__transition` only restated that module through a private field.
     */
    test("should move the fill through intermediate colours before settling when a colour transition runs", async () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("colour-transition-observable");
      const renderWith = (fill: string, transition: boolean) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(transition)
              .fill(fill),
          )
          .node() as SVGGElement;

      renderWith("#ff0000", false);
      const node = renderWith("#00ff00", true);

      await new Promise((resolve) => setTimeout(resolve, 80));
      const partway = attrs(node, "fill")[0];
      // Neither where it started nor where it is going: a transition that landed immediately, or
      // one that never ran, would fail here.
      expect(resolvedColor(partway)).not.toBe(resolvedColor("#ff0000"));
      expect(resolvedColor(partway)).not.toBe(resolvedColor("#00ff00"));

      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(resolvedColor(attrs(node, "fill")[0])).toBe(resolvedColor("#00ff00"));
    });
  });

  describe("known quirks", () => {
    // The unconditional fill application covers an area whose defined-ness changed: nothing has to
    // repaint last render's --undefined set separately.
    test("should repaint an area when it was undefined on the previous render", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("stale-fill");
      const renderWith = (data: Datum[], fill: string) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(data, collection))
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(false)
              .fill(fill),
          )
          .node() as SVGGElement;

      renderWith([{ geoId: "a", value: 1 }], "#ff0000");
      const node = renderWith(fullData, "#00ff00");
      expect(attrs(node, "fill")).toEqual(["#00ff00", "#00ff00", "#00ff00"]);
    });

    // The fill and the class agree: whatever is classed --undefined also carries the texture.
    test("should both class and texture a feature when it has no datum", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.transitionColor(false).fill("#ff0000"),
      );
      const [, second] = areas(node);
      expect(second.classList.contains("sszvis-map__area--undefined")).toBe(true);
      expect(second.getAttribute("fill")).toBe(missingFill(node));
    });

    // NOTE: `defined` goes through fn.functor, so a constant false paints every area with the
    // missing-value pattern regardless of the data.
    test("paints every area with the pattern for a constant false defined", () => {
      const node = render(fullData, (c) => c.transitionColor(false).defined(false).fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    // BUG: an unparseable `center` property (see the getGeoJsonCenter validation issue) reaches
    // the anchor as NaN coordinates, the projection maps those to [null, null], and the transform
    // is built from them unguarded, giving a transform of "translate(NaN,NaN)" rather than the
    // anchor being skipped. A typo in an authored map file silently detaches that entity's
    // tooltip instead of reporting anything.
    /** A mapPath whose projection reports what it was handed, and where it sent it. */
    const spyPath = (project: (point: number[]) => [number, number] | null, seen: unknown[]) =>
      Object.assign(() => "M0,0Z", {
        projection: () => (point: number[]) => {
          seen.push(point);
          return project(point);
        },
      }) as unknown as ReturnType<typeof mapPathOf>;

    // NOTE: a projection returning null is only reachable with a hand-written one - d3's own clip
    // in the stream and return a NaN pair - and the null is passed straight to tooltipAnchor,
    // which spreads it into translateString. Pinned because substituting a NaN pair here would
    // change the attribute this writes.
    test("emits an undefined transform for an anchor whose projection returns null", () => {
      const collection = geoJson();
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(spyPath(() => null, [])),
        )
        .node() as SVGGElement;
      expect(anchors(node).map((a) => a.getAttribute("transform"))).toEqual([
        "translate(undefined,undefined)",
        "translate(undefined,undefined)",
        "translate(undefined,undefined)",
      ]);
    });

    // Ids are document-global, so each layer defines its pattern under an id of its own and
    // references that id in the fill rather than a fixed one.
    test("should give every map layer its own missing-pattern id when several are on the page", () => {
      const one = render(fullData, (c) => c, "layer-one");
      const two = render(fullData, (c) => c, "layer-two");
      const ids = [one, two].map(missingId);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) {
        expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
      }
    });

    test("should keep a layer's pattern id when it re-renders", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("pattern-id-reuse");
      const renderWith = () =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath),
          )
          .node() as SVGGElement;

      const first = missingId(renderWith());
      expect(missingId(renderWith())).toBe(first);
      expect(document.querySelectorAll("defs > pattern")).toHaveLength(1);
    });

    // NOTE: the data join has no key function, so it is an index join - reordering mergedData
    // repaints the existing nodes in place rather than moving them.
    test("repaints existing nodes in place when the merged data is reordered", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("reorder");
      const renderWith = (features: typeof collection.features) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(
                features.map((f) => ({ geoJson: f, datum: { geoId: String(f.id), value: 1 } })),
              )
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(false),
          )
          .node() as SVGGElement;

      const node = renderWith(collection.features);
      const before = areas(node);
      const firstD = before[0].getAttribute("d");
      const reordered = renderWith([...collection.features].reverse());
      expect(areas(reordered)[0]).toBe(before[0]);
      expect(areas(reordered)[0].getAttribute("d")).not.toBe(firstD);
    });

    test("should throw when mergedData is missing", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(mapRendererBase().geoJson(collection).mapPath(mapPathOf(collection)))
          .node(),
      ).toThrow();
    });

    test("should throw when mapPath is missing", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection),
          )
          .node(),
      ).toThrow();
    });

    // The anchor position calls props.mapPath.projection(), so a bare path-generating function -
    // which is all the documented `{d3.geo.path}` type requires - renders the areas and then
    // throws on the anchors.
    test("should throw when mapPath is a plain function without a projection", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              // @ts-expect-error - a bare path function is what the JSDoc's {d3.geo.path} allows
              .mapPath(() => "M0,0Z"),
          )
          .node(),
      ).toThrow();
    });

    // geoJson is declared as a property and documented as the layer's shapes, but the render only
    // ever reads mergedData - the property is dead weight on this component.
    test("should render every area when the geoJson property is not set", () => {
      const collection = geoJson();
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPathOf(collection)),
        )
        .node() as SVGGElement;
      expect(areas(node)).toHaveLength(3);
    });
  });

  describe("tooltip anchors", () => {
    /** A mapPath whose projection reports every point it was handed. */
    const reportingPath = (seen: unknown[]) =>
      Object.assign(() => "M0,0Z", {
        projection: () => (point: number[]) => {
          seen.push(point);
          return [0, 0] as [number, number];
        },
      }) as unknown as ReturnType<typeof mapPathOf>;

    // getGeoJsonCenter validates an authored `center` before using it, so a malformed one falls
    // back to the computed centroid instead of reaching the projection as NaN.
    test.each([
      ["unparseable", "not,coordinates"],
      ["too short", "8.54"],
      ["too long", "1,2,3"],
    ])(
      "should position an anchor from the computed centroid when the center property is %s",
      (_label, center) => {
        const collection = geoJson();
        collection.features[1].properties = { center };
        const node = group()
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPathOf(collection)),
          )
          .node() as SVGGElement;
        for (const transform of anchors(node).map((a) => a.getAttribute("transform"))) {
          expect(transform).not.toContain("NaN");
        }
      },
    );

    test("should hand the projection a two-component centre when the center property has three", () => {
      const collection = geoJson();
      collection.features[1].properties = { center: "1,2,3" };
      const seen: unknown[] = [];
      group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(reportingPath(seen)),
        )
        .node();
      expect(seen).not.toContainEqual([1, 2, 3]);
      for (const point of seen) expect(point).toHaveLength(2);
    });

    test("should render one anchor per merged datum", () => {
      const node = render(fullData);
      expect(anchors(node)).toHaveLength(3);
    });

    test("should position each anchor at the projected centre of its feature", () => {
      const collection = geoJson();
      const mapPath = geoPath().projection(
        swissMapProjection(100, 100, collection, "anchor-position"),
      );
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPath),
        )
        .node() as SVGGElement;
      const projection = swissMapProjection(100, 100, collection, "anchor-position");
      // Computed independently of the component.
      const expected = geoJson().features.map((f) => {
        const [x, y] = projection(geoCentroid(f)) as [number, number];
        return `translate(${x},${y})`;
      });
      expect(anchors(node).map((a) => a.getAttribute("transform"))).toEqual(expected);
    });

    // getGeoJsonCenter computes the centre per render and caches nothing, so rendering a map
    // leaves the geojson it was handed untouched.
    test("should leave the features untouched when it renders them", () => {
      const collection = geoJson();
      group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPathOf(collection)),
        )
        .node();
      for (const feature of collection.features) {
        expect(feature.properties?.cachedCenter).toBeUndefined();
      }
    });
  });
});
