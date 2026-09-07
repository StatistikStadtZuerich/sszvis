import { easePolyOut, geoCentroid, geoPath } from "d3";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
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
      c
    ) => c,
    key?: string
  ) => {
    const collection = geoJson();
    const merged = prepareMergedGeoData(data, collection);
    const component = configure(
      mapRendererBase().mergedData(merged).geoJson(collection).mapPath(mapPathOf(collection))
    );
    return group(key).call(component).node() as SVGGElement;
  };

  const fullData: Datum[] = [
    { geoId: "a", value: 1 },
    { geoId: "b", value: 2 },
    { geoId: "c", value: 3 },
  ];

  describe("rendering", () => {
    test("renders one classed path per merged datum", () => {
      const node = render(fullData);
      expect(areas(node)).toHaveLength(3);
      for (const area of areas(node)) expect(area.tagName).toBe("path");
    });

    test("renders a path for every feature, including those with no data", () => {
      const node = render([{ geoId: "a", value: 1 }]);
      expect(areas(node)).toHaveLength(3);
    });

    test("takes the path data from the mapPath generator", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPath)
        )
        .node() as SVGGElement;
      expect(attrs(node, "d")).toEqual(collection.features.map((f) => mapPath(f)));
    });

    test("marks every area as an event target", () => {
      const node = render(fullData);
      expect(attrs(node, "data-event-target")).toEqual(["", "", ""]);
    });

    test("adds the missing value pattern to the layer's defs once", () => {
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
    test("defaults to black", () => {
      const node = render(fullData, (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", "black"]);
    });

    test("takes the fill from the accessor, called with the datum", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.transitionColor(false).fill((d: Datum | undefined) => {
          seen.push(d);
          return `rgb(${d?.value}, 0, 0)`;
        })
      );
      expect(attrs(node, "fill")).toEqual(["rgb(1, 0, 0)", "rgb(2, 0, 0)", "rgb(3, 0, 0)"]);
      expect(seen).toContainEqual({ geoId: "a", value: 1 });
    });

    test("accepts a constant fill", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
    });

    test("uses the missing value pattern where the defined predicate fails", () => {
      const node = render(fullData, (c) =>
        c
          .transitionColor(false)
          .fill("#ff0000")
          .defined((d: Datum | undefined) => d?.value !== 2)
      );
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), "#ff0000"]);
    });

    test("textures a feature with no data instead of calling the fill accessor", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.transitionColor(false).fill((d?: Datum) => {
          seen.push(d);
          return d ? "#00ff00" : "#0000ff";
        })
      );
      expect(seen).not.toContain(undefined);
      expect(attrs(node, "fill")).toEqual(["#00ff00", missingFill(node), missingFill(node)]);
    });

    // "Missing" is relative to a dataset: a layer where nothing has a datum encodes no data, so it
    // is drawing geometry rather than values. docs/map-extended/rastermap-bins.js depends on this,
    // drawing the map as a transparent outline over a raster with fill("none") and no data at all -
    // texturing those entities would paint over the raster the outline exists to frame.
    test("keeps the caller's fill when no entity has a datum", () => {
      const node = render([], (c) => c.transitionColor(false).fill("none"));
      expect(attrs(node, "fill")).toEqual(["none", "none", "none"]);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // The corollary of the rule above: with nothing textured, every entity goes through the fill
    // accessor, and there is no datum to hand it. An accessor that dereferences its argument has
    // to tolerate undefined on a geometry-only layer - the docs on `fill` say so.
    test("calls the fill accessor with undefined when no entity has a datum", () => {
      const seen: unknown[] = [];
      const node = render([], (c) =>
        c.transitionColor(false).fill((d?: Datum) => {
          seen.push(d);
          return "none";
        })
      );
      expect(seen).toEqual([undefined, undefined, undefined]);
      expect(attrs(node, "fill")).toEqual(["none", "none", "none"]);
    });

    // One matched datum is enough to make the layer a data layer, and then the entities it does
    // not cover are textured as missing again.
    test("textures the uncovered entities as soon as one datum matches", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) => c.transitionColor(false).fill("none"));
      expect(attrs(node, "fill")).toEqual(["none", missingFill(node), missingFill(node)]);
    });
  });

  describe("the undefined class", () => {
    test("marks areas whose datum is missing", () => {
      const node = render([{ geoId: "a", value: 1 }]);
      expect(areas(node).map((a) => a.classList.contains("sszvis-map__area--undefined"))).toEqual([
        false,
        true,
        true,
      ]);
    });

    test("marks areas that fail the defined predicate", () => {
      const node = render(fullData, (c) => c.defined((d: Datum | undefined) => d?.value !== 2));
      expect(areas(node).map((a) => a.classList.contains("sszvis-map__area--undefined"))).toEqual([
        false,
        true,
        false,
      ]);
    });

    test("clears the class when the datum arrives on a later render", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("undefined-clearing");
      const renderWith = (data: Datum[]) =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(data, collection))
              .geoJson(collection)
              .mapPath(mapPath)
          )
          .node() as SVGGElement;

      renderWith([{ geoId: "a", value: 1 }]);
      const node = renderWith(fullData);
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });
  });

  describe("transitionColor", () => {
    test("schedules a fill transition by default", () => {
      const node = render(fullData);
      expect(tweenNames(areas(node)[0])).toContain("attr.fill");
    });

    test("applies the fill without a transition when disabled", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(tweenNames(areas(node)[0])).toBeNull();
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
    });

    test("leaves the final fill out of the DOM, so the tween has somewhere to start", () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual([null, null, null]);
      expect(tweenNames(areas(node)[0])).toContain("attr.fill");
    });

    // An entering area has no previous fill to interpolate from, and d3's rgb interpolator treats
    // an unparseable start as a constant, so the first tick writes the final colour outright
    // rather than fading in from the SVG default. The attribute is only absent for the frame
    // between the render and that first tick.
    test("puts the final fill on an entering area at the first tick", async () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(attrs(node, "fill")).toEqual(["rgb(255, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 0, 0)"]);
    });

    test("animates from the previous colour rather than onto the new one", () => {
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
              .fill(fill)
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
    test("applies a change to the missing texture synchronously, without a tween", async () => {
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
              .fill("#ff0000")
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
    test("applies a change away from the missing texture synchronously", () => {
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
              .fill("#00ff00")
          )
          .node() as SVGGElement;

      renderWith(false, false);
      const node = renderWith(true, true);
      expect(attrs(node, "fill")).toEqual(["#00ff00", "#00ff00", "#00ff00"]);
    });

    test("schedules the slow transition's duration and easing", () => {
      const node = render(fullData);
      const schedules = (areas(node)[0] as Element & { __transition?: Record<string, unknown> })
        .__transition;
      const scheduled = Object.values(schedules ?? {}).filter(
        (v): v is { duration: number; ease: (t: number) => number } =>
          typeof v === "object" && v !== null && "duration" in v
      );
      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].duration).toBe(500);
      expect(scheduled[0].ease).toBe(easePolyOut);
    });
  });

  describe("known quirks", () => {
    // The unconditional fill application covers an area whose defined-ness changed: nothing has to
    // repaint last render's --undefined set separately.
    test("repaints an area that was undefined on the previous render", () => {
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
              .fill(fill)
          )
          .node() as SVGGElement;

      renderWith([{ geoId: "a", value: 1 }], "#ff0000");
      const node = renderWith(fullData, "#00ff00");
      expect(attrs(node, "fill")).toEqual(["#00ff00", "#00ff00", "#00ff00"]);
    });

    // The fill and the class agree: whatever is classed --undefined also carries the texture.
    test("both classes and textures a no-datum feature", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.transitionColor(false).fill("#ff0000")
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
            .mapPath(spyPath(() => null, []))
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
    test("gives every map layer on the page its own missing-pattern id", () => {
      const one = render(fullData, (c) => c, "layer-one");
      const two = render(fullData, (c) => c, "layer-two");
      const ids = [one, two].map(missingId);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) {
        expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
      }
    });

    test("keeps a layer's pattern id across re-renders", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("pattern-id-reuse");
      const renderWith = () =>
        layer
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              .mapPath(mapPath)
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
                features.map((f) => ({ geoJson: f, datum: { geoId: String(f.id), value: 1 } }))
              )
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(false)
          )
          .node() as SVGGElement;

      const node = renderWith(collection.features);
      const before = areas(node);
      const firstD = before[0].getAttribute("d");
      const reordered = renderWith([...collection.features].reverse());
      expect(areas(reordered)[0]).toBe(before[0]);
      expect(areas(reordered)[0].getAttribute("d")).not.toBe(firstD);
    });

    test("requires mergedData: rendering without it throws", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(mapRendererBase().geoJson(collection).mapPath(mapPathOf(collection)))
          .node()
      ).toThrow();
    });

    test("requires mapPath: rendering without it throws", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
          )
          .node()
      ).toThrow();
    });

    // The anchor position calls props.mapPath.projection(), so a bare path-generating function -
    // which is all the documented `{d3.geo.path}` type requires - renders the areas and then
    // throws on the anchors.
    test("throws for a mapPath that is a plain function without a projection", () => {
      const collection = geoJson();
      expect(() =>
        group()
          .call(
            mapRendererBase()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .geoJson(collection)
              // @ts-expect-error - a bare path function is what the JSDoc's {d3.geo.path} allows
              .mapPath(() => "M0,0Z")
          )
          .node()
      ).toThrow();
    });

    // geoJson is declared as a property and documented as the layer's shapes, but the render only
    // ever reads mergedData - the property is dead weight on this component.
    test("ignores the geoJson property entirely", () => {
      const collection = geoJson();
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPathOf(collection))
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
    ])("positions an anchor from the centroid for a %s center property", (_label, center) => {
      const collection = geoJson();
      collection.features[1].properties = { center };
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
        )
        .node() as SVGGElement;
      for (const transform of anchors(node).map((a) => a.getAttribute("transform"))) {
        expect(transform).not.toContain("NaN");
      }
    });

    test("hands the projection a two-component centre", () => {
      const collection = geoJson();
      collection.features[1].properties = { center: "1,2,3" };
      const seen: unknown[] = [];
      group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(reportingPath(seen))
        )
        .node();
      expect(seen).not.toContainEqual([1, 2, 3]);
      for (const point of seen) expect(point).toHaveLength(2);
    });

    test("renders one anchor per merged datum", () => {
      const node = render(fullData);
      expect(anchors(node)).toHaveLength(3);
    });

    test("positions each anchor at the projected centre of its feature", () => {
      const collection = geoJson();
      const mapPath = geoPath().projection(
        swissMapProjection(100, 100, collection, "anchor-position")
      );
      const node = group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPath)
        )
        .node() as SVGGElement;
      const projection = swissMapProjection(100, 100, collection, "anchor-position");
      // Computed independently of the component, which writes its own cachedCenter.
      const expected = geoJson().features.map((f) => {
        const [x, y] = projection(geoCentroid(f)) as [number, number];
        return `translate(${x},${y})`;
      });
      expect(anchors(node).map((a) => a.getAttribute("transform"))).toEqual(expected);
    });

    // NOTE: positioning goes through getGeoJsonCenter, which caches onto the feature - rendering a
    // map mutates the geojson it was handed.
    test("caches a centre onto every feature it renders", () => {
      const collection = geoJson();
      expect(collection.features[0].properties?.cachedCenter).toBeUndefined();
      group()
        .call(
          mapRendererBase()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
        )
        .node();
      for (const feature of collection.features) {
        expect(feature.properties?.cachedCenter).toBeDefined();
      }
    });
  });
});
