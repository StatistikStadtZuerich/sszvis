import { geoCentroid, geoPath } from "d3";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererGeoJson from "../../../src/map/renderer/geojson.js";

type Datum = { geoId: string; value: number };

/**
 * A unit square. The ring is wound clockwise because d3-geo interprets rings on the sphere:
 * counter-clockwise would describe the whole globe minus the square.
 */
const square = (id: string, offset = 0): Feature<Polygon> => ({
  type: "Feature",
  id,
  properties: { id },
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

describe("map/renderer/geojson", () => {
  let container: HTMLDivElement;
  let layerKey = 0;
  let pathKey = 0;

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
      key: key ?? `geojson-${++layerKey}`,
    }).selectGroup("map");

  /** A fresh geojson each time, since the renderer caches a centroid onto the features. */
  const geoJson = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2), square("c", 4)],
  });

  const mapPathOf = (collection: FeatureCollection<Polygon>) =>
    geoPath().projection(swissMapProjection(100, 100, collection, `geojson-path-${++pathKey}`));

  const elements = (node: Element) => [...node.querySelectorAll("path.sszvis-map__geojsonelement")];
  const attrs = (node: Element, attr: string) => elements(node).map((e) => e.getAttribute(attr));
  const anchors = (node: Element) => [...node.querySelectorAll("[data-tooltip-anchor]")];

  const fullData: Datum[] = [
    { geoId: "a", value: 1 },
    { geoId: "b", value: 2 },
    { geoId: "c", value: 3 },
  ];

  /** Data for features "a" and "b" only, leaving "c" genuinely without any datum. */
  const partialData: Datum[] = [
    { geoId: "a", value: 1 },
    { geoId: "b", value: 2 },
  ];

  /** Renders the overlay over `data`, returning the group node it drew into. */
  const render = (
    data: Datum[],
    configure: (
      c: ReturnType<typeof mapRendererGeoJson>
    ) => ReturnType<typeof mapRendererGeoJson> = (c) => c,
    key?: string
  ) => {
    const collection = geoJson();
    const component = configure(
      mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection))
    );
    return group(key).datum(data).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("renders one classed path per geojson feature", () => {
      const node = render(fullData);
      expect(elements(node)).toHaveLength(3);
      for (const el of elements(node)) expect(el.tagName).toBe("path");
    });

    test("takes the path data from the mapPath generator", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
        .node() as SVGGElement;
      expect(attrs(node, "d")).toEqual(collection.features.map((f) => mapPath(f)));
    });

    test("marks every element as an event target", () => {
      const node = render(fullData);
      expect(attrs(node, "data-event-target")).toEqual(["", "", ""]);
    });

    test("adds the missing value pattern to the layer's defs", () => {
      const node = render(fullData);
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(root.querySelectorAll("defs #missing-pattern")).toHaveLength(1);
    });
  });

  describe("data matching", () => {
    test("matches every datum to its feature, and does not mutate the data", () => {
      const data: Datum[] = [
        { geoId: "a", value: 1 },
        { geoId: "b", value: 2 },
        { geoId: "c", value: 3 },
      ];
      const node = render(data, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
      // The caller's data are untouched: no lookup keys were written onto the first datum.
      expect(Object.keys(data[0])).toEqual(["geoId", "value"]);
    });

    test("matches a single datum to its feature", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.fill("#ff0000").transitionColor(false)
      );
      expect(attrs(node, "fill")).toEqual([
        "#ff0000",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    test("draws an all-missing overlay for an empty dataset", () => {
      const node = render([], (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    // NOTE: an undefined datum still throws, because the key accessor indexes it directly.
    test("throws when a datum is undefined", () => {
      expect(() => render([undefined as unknown as Datum, { geoId: "b", value: 2 }])).toThrow(
        TypeError
      );
    });

    // NOTE: a symbol key stays a symbol key, so it never collides with a string feature id and
    // the datum is simply never matched.
    test("never matches a datum keyed by a symbol", () => {
      const symbolKeyed = { [Symbol("s")]: 1, value: 5 } as unknown as Datum;
      const node = render([symbolKeyed], (c) =>
        c.transitionColor(false).dataKeyName("missing").fill("#ff0000")
      );
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    test("leaves a feature with no properties at all unmatched", () => {
      const collection = geoJson();
      collection.features[1].properties = undefined as unknown as null;
      const node = group()
        .datum(fullData)
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .fill("#ff0000")
            .transitionColor(false)
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#ff0000", "url(#missing-pattern)", "#ff0000"]);
    });

    test("matches data to features by the configured key names", () => {
      const collection = geoJson();
      for (const [i, feature] of collection.features.entries()) {
        feature.properties = { mapId: `m${i}` };
      }
      const node = group()
        .datum([
          { code: "m1", value: 2 },
          { code: "m2", value: 3 },
        ])
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .dataKeyName("code")
            .geoJsonKeyName("mapId")
            .fill("#ff0000")
            .transitionColor(false)
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["url(#missing-pattern)", "#ff0000", "#ff0000"]);
    });

    test("defaults the key names to geoId and id", () => {
      const component = mapRendererGeoJson();
      expect(component.dataKeyName()).toBe("geoId");
      expect(component.geoJsonKeyName()).toBe("id");
    });
  });

  describe("known quirks", () => {
    // `properties: null` is spec-legal GeoJSON (RFC 7946 3.2): the feature is unmatched rather
    // than crashing the overlay.
    test("leaves a feature with null properties unmatched", () => {
      const collection = geoJson();
      collection.features[1].properties = null;
      const node = group()
        .datum(fullData)
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .fill("#ff0000")
            .transitionColor(false)
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#ff0000", "url(#missing-pattern)", "#ff0000"]);
    });

    // The anchor's `properties || (properties = {})` guard is reachable now that a feature with
    // null properties renders, and it gives the centroid cache somewhere to live.
    test("anchors a feature with null properties through the anchor's own guard", () => {
      const collection = geoJson();
      collection.features[0].properties = null;
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
        .node() as SVGGElement;
      expect(anchors(node)).toHaveLength(3);
      // Read back through `at`, so the assignment above does not narrow the type to null.
      const properties = collection.features.at(0)?.properties;
      expect(properties).not.toBeNull();
      expect(properties?.sphericalCentroid).toBeDefined();
    });

    // A datum with no key is skipped rather than filed under the string "undefined", so it does
    // not become the datum for every keyless feature.
    test("leaves keyless data and keyless features unmatched", () => {
      const collection = geoJson();
      collection.features[1].properties = {};
      collection.features[2].properties = {};
      const node = group()
        .datum([{ value: 7 } as Datum])
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .transitionColor(false)
            .fill((d: Datum) => `rgb(${d.value},0,0)`)
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    // NOTE: the lookup table is prototype-less, so a feature keyed after an Object.prototype
    // member does not resolve to the inherited function - it is simply unmatched.
    test("does not hand a feature keyed after a prototype member an inherited datum", () => {
      const collection = geoJson();
      collection.features[1].properties = { id: "valueOf" };
      const seen: unknown[] = [];
      const node = group()
        .datum(fullData)
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .transitionColor(false)
            .fill((d: unknown) => {
              seen.push(typeof d);
              return "#ff0000";
            })
        )
        .node() as SVGGElement;
      expect(seen).not.toContain("function");
      expect(attrs(node, "fill")[1]).toBe("url(#missing-pattern)");
    });

    // The listeners are bound to this component's own elements, so a base layer's areas in the
    // same group keep whatever was attached to them.
    test("binds its handlers only to its own elements", () => {
      const collection = geoJson();
      const layer = group("shared-targets");
      const foreign = layer
        .append("path")
        .attr("class", "sszvis-map__area")
        .attr("data-event-target", "")
        .node() as SVGPathElement;

      layer
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
        .node();

      const listeners = (foreign as Element & { __on?: { type: string }[] }).__on ?? [];
      expect(listeners).toEqual([]);
    });

    test("throws for a geojson with no features", () => {
      expect(() =>
        group()
          .datum(fullData)
          // @ts-expect-error - geoJson is required, and unguarded
          .call(mapRendererGeoJson().geoJson(undefined).mapPath(mapPathOf(geoJson())))
          .node()
      ).toThrow(TypeError);
    });

    // NOTE: the stale-class fill repaint is dead here for the same reasons as in the base
    // renderer - it reads the previous render's classes, and every node it could touch is
    // repainted anyway. See test/map/renderer/base.test.ts.
    test("repaints nothing observable through the stale-class selector", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("stale-fill");
      const renderWith = (fill: string) =>
        layer
          .datum(partialData)
          .call(
            mapRendererGeoJson()
              .geoJson(collection)
              .mapPath(mapPath)
              .transitionColor(false)
              .fill(fill)
          )
          .node() as SVGGElement;
      renderWith("#ff0000");
      expect(attrs(renderWith("#00ff00"), "fill").slice(0, 2)).toEqual(["#00ff00", "#00ff00"]);
    });

    // BUG: an overlay and a base layer over the same features cache their centres under different
    // keys and from different sources - base honours an authored `center`, this renderer always
    // computes the spherical centroid - so the same entity's tooltip sits in two places.
    test("caches a different centre than the base renderer for the same feature", async () => {
      const mapRendererBase = (await import("../../../src/map/renderer/base.js")).default;
      const collection = geoJson();
      collection.features[0].properties = { id: "a", center: "0.9,0.9" };
      const mapPath = mapPathOf(collection);
      const merged = collection.features.map((f) => ({ geoJson: f, datum: { value: 1 } }));

      group("cross-base").call(mapRendererBase().mergedData(merged).mapPath(mapPath)).node();
      group("cross-geojson")
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
        .node();

      const properties = collection.features[0].properties as Record<string, unknown>;
      expect(properties.cachedCenter).toEqual([0.9, 0.9]);
      expect(properties.sphericalCentroid).not.toEqual([0.9, 0.9]);
    });
  });

  describe("fill and stroke", () => {
    test("defaults the fill to black", () => {
      const node = render(partialData, (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", "url(#missing-pattern)"]);
    });

    test("uses the missing pattern where the defined predicate fails", () => {
      const node = render(partialData, (c) =>
        c
          .fill("#ff0000")
          .transitionColor(false)
          .defined((d: Datum) => d.value !== 2)
      );
      expect(attrs(node, "fill")).toEqual([
        "#ff0000",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    // Unlike the base renderer, the fill here consults fn.defined as well as props.defined, so a
    // feature with no datum does get the missing-value pattern rather than the ordinary fill.
    test("uses the missing pattern for a feature with no datum", () => {
      const node = render(partialData, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")[2]).toBe("url(#missing-pattern)");
    });

    // NOTE: defined goes through fn.functor, so a constant false textures the whole overlay.
    test("textures every element for a constant false defined", () => {
      const node = render(partialData, (c) =>
        c.fill("#ff0000").transitionColor(false).defined(false)
      );
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    test("defaults the stroke to black and the stroke width to 1.25", () => {
      const node = render(partialData, (c) => c.transitionColor(false));
      expect(attrs(node, "stroke")).toEqual(["black", "black", ""]);
      // The unmatched entity is not asked for a stroke width at all, so it carries no
      // stroke-width attribute; its stroke is "" and paints nothing either way.
      expect(attrs(node, "stroke-width")).toEqual(["1.25", "1.25", null]);
    });

    // NOTE: an undefined entity is given stroke="", which is not a valid paint value, so the
    // presentation attribute is ignored and the stylesheet's stroke wins. It is not the same as
    // removing the attribute or asking for no stroke.
    test("sets an empty stroke, not no stroke, for an undefined entity", () => {
      const node = render(partialData, (c) => c.transitionColor(false));
      const undefinedElement = elements(node)[2];
      expect(undefinedElement.getAttribute("stroke")).toBe("");
      expect(undefinedElement.hasAttribute("stroke")).toBe(true);
    });

    test("takes the stroke from an accessor called with the datum", () => {
      const node = render(partialData, (c) =>
        c.transitionColor(false).stroke((d: Datum) => `rgb(${d.value},0,0)`)
      );
      expect(attrs(node, "stroke").slice(0, 2)).toEqual(["rgb(1,0,0)", "rgb(2,0,0)"]);
    });

    test("takes the stroke width from an accessor called with the datum", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.transitionColor(false).strokeWidth((d: Datum) => {
          seen.push(d);
          return d.value;
        })
      );
      expect(seen[0]).toEqual({ geoId: "a", value: 1 });
      expect(attrs(node, "stroke-width")).toEqual(["1", "2", "3"]);
    });

    test("never asks an unmatched feature for a stroke width", () => {
      const seen: unknown[] = [];
      const node = render(partialData, (c) =>
        c.transitionColor(false).strokeWidth((d: Datum) => {
          seen.push(d);
          return d.value;
        })
      );
      expect(seen).toEqual([
        { geoId: "a", value: 1 },
        { geoId: "b", value: 2 },
      ]);
      expect(elements(node)[2].hasAttribute("stroke-width")).toBe(false);
      expect(attrs(node, "stroke-width").slice(0, 2)).toEqual(["1", "2"]);
    });

    test("drops the stroke width of an entity the defined predicate rejects", () => {
      const node = render(fullData, (c) =>
        c
          .transitionColor(false)
          .defined((d: Datum) => d.geoId !== "b")
          .strokeWidth((d: Datum) => d.value)
      );
      expect(elements(node)[1].hasAttribute("stroke-width")).toBe(false);
    });
  });

  describe("events", () => {
    test("exposes over, out and click through on()", () => {
      const component = mapRendererGeoJson();
      expect(component.on).toBeTypeOf("function");
      expect(component.on("over", () => undefined)).toBe(component);
    });

    test("delivers the hovered entity's datum to an over handler", () => {
      const over = vi.fn();
      const node = render(fullData, (c) => c.transitionColor(false).on("over", over));
      elements(node)[1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(over).toHaveBeenCalledTimes(1);
      expect(over).toHaveBeenCalledWith({ geoId: "b", value: 2 });
    });

    test("delivers out and click as well", () => {
      const out = vi.fn();
      const click = vi.fn();
      const node = render(fullData, (c) =>
        c.transitionColor(false).on("out", out).on("click", click)
      );
      elements(node)[1].dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      elements(node)[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(out).toHaveBeenCalledWith({ geoId: "b", value: 2 });
      expect(click).toHaveBeenCalledWith({ geoId: "b", value: 2 });
    });

    // An unmatched feature has no datum, so the handler is called with undefined.
    test("delivers undefined for an entity with no datum", () => {
      const over = vi.fn();
      const node = render(partialData, (c) => c.transitionColor(false).on("over", over));
      elements(node)[2].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(over).toHaveBeenCalledWith(undefined);
    });

    test("reads a listener back through on()", () => {
      const over = () => undefined;
      const component = mapRendererGeoJson().on("over", over);
      expect(component.on("over")).toBe(over);
    });

    test("attaches all three listeners to every element", () => {
      const node = render(fullData, (c) => c.transitionColor(false));
      const listeners = (elements(node)[0] as Element & { __on?: { type: string }[] }).__on ?? [];
      expect(listeners.map((l) => l.type).sort()).toEqual(["click", "mouseout", "mouseover"]);
    });
  });

  describe("transitionColor", () => {
    test("schedules a fill transition by default", () => {
      const node = render(fullData);
      const schedules = (elements(node)[0] as Element & { __transition?: unknown }).__transition;
      expect(schedules).toBeDefined();
    });

    test("applies the fill without a transition when disabled", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(
        (elements(node)[0] as Element & { __transition?: unknown }).__transition
      ).toBeUndefined();
    });

    // BUG: as in the base renderer, the fill is written to the plain selection first and then
    // transitioned to the same value, so the colour tween interpolates a colour onto itself and
    // nothing ever animates. The transition also keeps d3's defaults - 250ms, easeCubicInOut -
    // because `.call(slowTransition)` discards the transition slowTransition builds.
    test("writes the final fill immediately and schedules d3's default transition", () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      expect(attrs(node, "fill").slice(1)).toEqual(["#ff0000", "#ff0000"]);
      const schedules = (elements(node)[0] as Element & { __transition?: Record<string, unknown> })
        .__transition;
      const scheduled = Object.values(schedules ?? {}).filter(
        (v): v is { duration: number; ease: (t: number) => number } =>
          typeof v === "object" && v !== null && "duration" in v
      );
      expect(scheduled[0].duration).toBe(250);
      expect(scheduled[0].ease.name).toBe("cubicInOut");
    });
  });

  describe("tooltip anchors", () => {
    test("renders one anchor per feature, at the projected spherical centroid", () => {
      const collection = geoJson();
      const projection = swissMapProjection(100, 100, collection, "geojson-anchors");
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(geoPath().projection(projection)))
        .node() as SVGGElement;
      const expected = geoJson().features.map((f) => {
        const [x, y] = projection(geoCentroid(f)) as [number, number];
        return `translate(${x},${y})`;
      });
      expect(anchors(node).map((a) => a.getAttribute("transform"))).toEqual(expected);
    });

    // NOTE: a projection returning null is only reachable with a hand-written one - d3's own clip
    // in the stream and return a NaN pair - and the null is passed straight to tooltipAnchor,
    // which spreads it into translateString. Pinned because substituting a NaN pair here would
    // change the attribute this writes. Matches the base renderer.
    test("emits an undefined transform for an anchor whose projection returns null", () => {
      const collection = geoJson();
      const nullProjecting = Object.assign(() => "M0,0Z", {
        projection: () => () => null,
      }) as unknown as ReturnType<typeof mapPathOf>;
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(nullProjecting))
        .node() as SVGGElement;
      expect(anchors(node).map((a) => a.getAttribute("transform"))).toEqual([
        "translate(undefined,undefined)",
        "translate(undefined,undefined)",
        "translate(undefined,undefined)",
      ]);
    });

    // NOTE: the centroid is cached onto each feature's properties, so rendering mutates the
    // geojson it was handed - and under a different key than the base renderer's cachedCenter.
    test("caches a sphericalCentroid onto every feature, and never invalidates it", () => {
      const collection = geoJson();
      expect(collection.features[0].properties?.sphericalCentroid).toBeUndefined();

      const mapPath = mapPathOf(collection);
      const layer = group("centroid-cache");
      const renderInto = () =>
        layer
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
          .node() as SVGGElement;

      renderInto();
      for (const feature of collection.features) {
        expect(feature.properties?.sphericalCentroid).toBeDefined();
      }

      // Move the first feature somewhere else entirely and re-render: the anchor does not follow,
      // because the cached centroid is never recomputed.
      const before = anchors(renderInto())[0].getAttribute("transform");
      collection.features[0].geometry.coordinates = [
        [
          [50, 50],
          [50, 51],
          [51, 51],
          [51, 50],
          [50, 50],
        ],
      ];
      expect(anchors(renderInto())[0].getAttribute("transform")).toBe(before);
    });

    // NOTE: unlike the base renderer, this component ignores an authored `center` property and
    // always uses the computed spherical centroid, so the two renderers can disagree about where
    // the same entity's tooltip belongs.
    test("ignores an authored center property", () => {
      const collection = geoJson();
      collection.features[0].properties = { id: "a", center: "8.5,47.4" };
      const projection = swissMapProjection(100, 100, collection, "geojson-center");
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(geoPath().projection(projection)))
        .node() as SVGGElement;
      const [x, y] = projection(geoCentroid(square("a"))) as [number, number];
      expect(anchors(node)[0].getAttribute("transform")).toBe(`translate(${x},${y})`);
    });
  });
});
