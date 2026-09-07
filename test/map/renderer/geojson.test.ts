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

  /**
   * Data whose first element is a decoy matching no feature. The grouping reduce swallows its
   * first element (see the data-matching tests), so a decoy is the only way to give features "a"
   * and "b" data while leaving "c" genuinely without any - which keeps these expectations valid
   * once that bug is fixed.
   */
  const decoyData: Datum[] = [
    { geoId: "decoy", value: 0 },
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
    // BUG: the grouping reduce is called with no initial value, so the FIRST datum becomes the
    // accumulator instead of a fresh object. Its own keys are never entries, so the first datum
    // never matches its feature - that entity always renders as missing - and the remaining data
    // are written onto it as properties, mutating the caller's array element.
    test("never matches the first datum, and mutates it", () => {
      const data: Datum[] = [
        { geoId: "a", value: 1 },
        { geoId: "b", value: 2 },
        { geoId: "c", value: 3 },
      ];
      const node = render(data, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["url(#missing-pattern)", "#ff0000", "#ff0000"]);
      // The caller's first datum has been used as the lookup object.
      expect(data[0]).toHaveProperty("b", data[1]);
      expect(data[0]).toHaveProperty("c", data[2]);
    });

    // BUG: with a single datum the reduce never runs its callback, so nothing is matched at all.
    test("matches nothing at all for a single datum", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.fill("#ff0000").transitionColor(false)
      );
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    // BUG: reduce with no initial value throws on an empty array, so an overlay with no data
    // crashes the render rather than drawing an all-missing map.
    test("throws for an empty dataset", () => {
      expect(() => render([])).toThrow(TypeError);
    });

    // These pin the exact shape of the grouping so a future rewrite of it cannot drift unnoticed:
    // the lookup table IS the caller's first datum, and an empty dataset fails the way a seedless
    // reduce fails.
    test("uses the caller's first datum as the lookup table itself", () => {
      const data: Datum[] = [
        { geoId: "a", value: 1 },
        { geoId: "b", value: 2 },
      ];
      render(data, (c) => c.transitionColor(false));
      expect(Object.hasOwn(data[0], "b")).toBe(true);
      expect(Object.getOwnPropertyDescriptor(data[0], "b")?.value).toBe(data[1]);
      // The single remaining datum was written onto it, not into a fresh object.
      expect(Object.keys(data[0])).toEqual(["geoId", "value", "b"]);
    });

    test("fails an empty dataset the way a seedless reduce does", () => {
      expect(() => render([])).toThrow(
        new TypeError("Reduce of empty array with no initial value")
      );
    });

    // NOTE: a dataset whose first element is undefined does not fail the emptiness check, so it
    // fails later, when the table is written to - the same place the seedless reduce failed.
    test("throws when the first datum is undefined", () => {
      expect(() => render([undefined as unknown as Datum, { geoId: "b", value: 2 }])).toThrow(
        TypeError
      );
    });

    // NOTE: a symbol key stays a symbol key, so it never collides with a string feature id and
    // the datum is simply never matched.
    test("never matches a datum keyed by a symbol", () => {
      const symbolKeyed = { [Symbol("s")]: 1, value: 5 } as unknown as Datum;
      const node = render([{ geoId: "decoy", value: 0 }, symbolKeyed], (c) =>
        c.transitionColor(false).dataKeyName("missing").fill("#ff0000")
      );
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    // NOTE: `properties` absent behaves like `properties: null` - both crash the merge - but the
    // message names the value that was read, as the original property access did.
    test("throws for a feature with no properties at all", () => {
      const collection = geoJson();
      collection.features[1].properties = undefined as unknown as null;
      expect(() =>
        group()
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
          .node()
      ).toThrow(/Cannot read properties of undefined/);
    });

    test("matches data to features by the configured key names", () => {
      // The leading entry is a decoy: the reduce above swallows its first element.
      const collection = geoJson();
      for (const [i, feature] of collection.features.entries()) {
        feature.properties = { mapId: `m${i}` };
      }
      const node = group()
        .datum([
          { code: "unused", value: 0 },
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
    // BUG: `properties: null` is spec-legal GeoJSON, but the key lookup reads straight through it
    // with fn.prop, so a valid feature crashes the merge with a bare TypeError.
    test("throws for a feature with null properties", () => {
      const collection = geoJson();
      collection.features[1].properties = null;
      expect(() =>
        group()
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
          .node()
      ).toThrow(TypeError);
    });

    // NOTE: the anchor's `d.geoJson.properties || (d.geoJson.properties = {})` guard is therefore
    // unreachable - a feature with null properties has already crashed the merge above.
    test("crashes before reaching the anchor's null-properties guard", () => {
      const collection = geoJson();
      collection.features[0].properties = null;
      expect(() =>
        group()
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
          .node()
      ).toThrow(TypeError);
      // Nothing was rendered, so the guard never ran.
      expect(collection.features[0].properties).toBeNull();
    });

    // BUG: a missing key stringifies to "undefined" on both sides of the match, so one datum with
    // no key becomes the datum for every feature that also lacks one.
    test("matches keyless data to keyless features under the string undefined", () => {
      const collection = geoJson();
      collection.features[1].properties = {};
      collection.features[2].properties = {};
      const node = group()
        .datum([{ geoId: "decoy", value: 0 }, { value: 7 } as Datum])
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .transitionColor(false)
            .fill((d: Datum) => `rgb(${d.value},0,0)`)
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill").slice(1)).toEqual(["rgb(7,0,0)", "rgb(7,0,0)"]);
    });

    // BUG: the lookup is a plain object - here, one of the caller's own data objects - so a
    // feature keyed after an Object.prototype member resolves to the inherited function. fn.defined
    // accepts it and the fill accessor is called with a function as its datum.
    test("hands a feature keyed after a prototype member an inherited datum", () => {
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
      expect(seen).toContain("function");
      expect(attrs(node, "fill")[1]).toBe("#ff0000");
    });

    // BUG: the event listeners are bound with a layer-wide selector rather than this component's
    // own class, so an overlay rendered into a group that already holds a base layer rebinds the
    // base layer's areas to its own handlers and its own merged data.
    test("binds its handlers to every event target in the layer, not just its own", () => {
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
      expect(listeners.map((l) => l.type).sort()).toEqual(["click", "mouseout", "mouseover"]);
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
          .datum(decoyData)
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
      const node = render(decoyData, (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", "url(#missing-pattern)"]);
    });

    test("uses the missing pattern where the defined predicate fails", () => {
      const node = render(decoyData, (c) =>
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
      const node = render(decoyData, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")[2]).toBe("url(#missing-pattern)");
    });

    // NOTE: defined goes through fn.functor, so a constant false textures the whole overlay.
    test("textures every element for a constant false defined", () => {
      const node = render(decoyData, (c) =>
        c.fill("#ff0000").transitionColor(false).defined(false)
      );
      expect(attrs(node, "fill")).toEqual([
        "url(#missing-pattern)",
        "url(#missing-pattern)",
        "url(#missing-pattern)",
      ]);
    });

    test("defaults the stroke to black and the stroke width to 1.25", () => {
      const node = render(decoyData, (c) => c.transitionColor(false));
      expect(attrs(node, "stroke")).toEqual(["black", "black", ""]);
      expect(attrs(node, "stroke-width")).toEqual(["1.25", "1.25", "1.25"]);
    });

    // NOTE: an undefined entity is given stroke="", which is not a valid paint value, so the
    // presentation attribute is ignored and the stylesheet's stroke wins. It is not the same as
    // removing the attribute or asking for no stroke.
    test("sets an empty stroke, not no stroke, for an undefined entity", () => {
      const node = render(decoyData, (c) => c.transitionColor(false));
      const undefinedElement = elements(node)[2];
      expect(undefinedElement.getAttribute("stroke")).toBe("");
      expect(undefinedElement.hasAttribute("stroke")).toBe(true);
    });

    test("takes the stroke from an accessor called with the datum", () => {
      const node = render(decoyData, (c) =>
        c.transitionColor(false).stroke((d: Datum) => `rgb(${d.value},0,0)`)
      );
      expect(attrs(node, "stroke").slice(0, 2)).toEqual(["rgb(1,0,0)", "rgb(2,0,0)"]);
    });

    // BUG: strokeWidth is handed straight to d3 as `.attr("stroke-width", props.strokeWidth)`,
    // so its accessor is called with the *merged* datum - { geoJson, datum } - while fill and
    // stroke are called with the datum itself. An accessor written like the documented fill and
    // stroke accessors reads undefined off the wrapper, and d3 then removes the attribute.
    test("calls the strokeWidth accessor with the merged datum, not the datum", () => {
      const seen: string[][] = [];
      const node = render(fullData, (c) =>
        c.transitionColor(false).strokeWidth((d: { datum?: Datum }) => {
          seen.push(Object.keys(d));
          return d.datum?.value ?? 9;
        })
      );
      expect(seen[0]).toEqual(["geoJson", "datum"]);
      // Reading the datum through the wrapper works; reading it directly would not.
      expect(attrs(node, "stroke-width")).toEqual(["9", "2", "3"]);
    });

    test("drops the attribute for an accessor written against the datum", () => {
      const node = render(fullData, (c) =>
        c.transitionColor(false).strokeWidth((d: Datum) => d.value)
      );
      expect(attrs(node, "stroke-width")).toEqual([null, null, null]);
    });
  });

  describe("events", () => {
    test("exposes over, out and click through on()", () => {
      const component = mapRendererGeoJson();
      expect(component.on).toBeTypeOf("function");
      expect(component.on("over", () => undefined)).toBe(component);
    });

    // BUG: the event API is dead. The handlers call `event.over(d.datum)`, but d3's dispatch has
    // exposed only on/call/apply/copy since v4 - there is no per-type `over` method - so every
    // mouseover, mouseout and click handler throws a TypeError before reaching the callback. The
    // listeners are attached, so the component looks wired up; nothing can ever be delivered.
    // (Separately, the handler signature is also stale: d3 v6+ calls listeners with
    // (event, datum), so `d` would be the DOM event even if the dispatch call worked.)
    /** Dispatches `type` on an element and returns the error the listener threw, if any. */
    const errorFrom = (target: Element, type: string) => {
      const errors: string[] = [];
      const onError = (e: ErrorEvent) => {
        errors.push(e.message);
        e.preventDefault();
      };
      window.addEventListener("error", onError);
      target.dispatchEvent(new MouseEvent(type, { bubbles: true }));
      window.removeEventListener("error", onError);
      return errors;
    };

    test("never delivers over, because the handler throws first", () => {
      const over = vi.fn();
      const node = render(fullData, (c) => c.transitionColor(false).on("over", over));
      const errors = errorFrom(elements(node)[1], "mouseover");
      expect(over).not.toHaveBeenCalled();
      expect(errors.join(" ")).toMatch(/is not a function/);
    });

    test("never delivers out or click either", () => {
      const out = vi.fn();
      const click = vi.fn();
      const node = render(fullData, (c) =>
        c.transitionColor(false).on("out", out).on("click", click)
      );
      expect(errorFrom(elements(node)[1], "mouseout").join(" ")).toMatch(/is not a function/);
      expect(errorFrom(elements(node)[1], "click").join(" ")).toMatch(/is not a function/);
      expect(out).not.toHaveBeenCalled();
      expect(click).not.toHaveBeenCalled();
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
