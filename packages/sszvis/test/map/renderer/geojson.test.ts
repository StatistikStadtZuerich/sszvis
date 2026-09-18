import { type GeoProjection, geoCentroid, geoPath } from "d3";
import type { FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { resolvedColor } from "../../support/domValues.js";
import { missingFill, missingId, square as squareFeature } from "../../support/mapReaders.js";
import { describesMapPathGeometry } from "../../support/mapRendererConformance.js";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererGeoJson from "../../../src/map/renderer/geojson.js";

type Datum = { geoId: string; value: number };

/** A unit square whose properties repeat its id, which is what this renderer matches on. */
const square = (id: string | undefined, offset = 0) => squareFeature(id, offset, { id });

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

  /** A fresh geojson each time, so no test can see another's mutations of the features. */
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
      c: ReturnType<typeof mapRendererGeoJson>,
    ) => ReturnType<typeof mapRendererGeoJson> = (c) => c,
    key?: string,
  ) => {
    const collection = geoJson();
    const component = configure(
      mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)),
    );
    return group(key).datum(data).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("should render one classed path per geojson feature", () => {
      const node = render(fullData);
      expect(elements(node)).toHaveLength(3);
      for (const el of elements(node)) expect(el.tagName).toBe("path");
    });

    describesMapPathGeometry(() => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
        .node() as SVGGElement;
      // Every feature is drawn, so every feature is checked.
      return { marks: elements(node), expected: collection.features.map((f) => mapPath(f)) };
    });

    test("should mark every element as an event target", () => {
      const node = render(fullData);
      expect(attrs(node, "data-event-target")).toEqual(["", "", ""]);
    });

    test("should add the missing value pattern to the layer's defs", () => {
      const node = render(fullData);
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(root.querySelectorAll("defs > pattern")).toHaveLength(1);
      expect(root.querySelectorAll(`#${missingId(node)}`)).toHaveLength(1);
    });
  });

  describe("data matching", () => {
    test("should fill every element and leave the caller's data untouched when every datum matches a feature", () => {
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

    test("should fill only the matching feature when a single datum is given", () => {
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.fill("#ff0000").transitionColor(false),
      );
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), missingFill(node)]);
    });

    test("should texture every element when the dataset is empty", () => {
      const node = render([], (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    // NOTE: an undefined datum still throws, because the key accessor indexes it directly.
    test("throws when a datum is undefined", () => {
      expect(() => render([undefined as unknown as Datum, { geoId: "b", value: 2 }])).toThrow(
        TypeError,
      );
    });

    // NOTE: a symbol key stays a symbol key, so it never collides with a string feature id and
    // the datum is simply never matched.
    test("never matches a datum keyed by a symbol", () => {
      const symbolKeyed = { [Symbol("s")]: 1, value: 5 } as unknown as Datum;
      const node = render([symbolKeyed], (c) =>
        c.transitionColor(false).dataKeyName("missing").fill("#ff0000"),
      );
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    test("should leave a feature unmatched when it has no properties at all", () => {
      const collection = geoJson();
      collection.features[1].properties = undefined as unknown as null;
      const node = group()
        .datum(fullData)
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .fill("#ff0000")
            .transitionColor(false),
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), "#ff0000"]);
    });

    test("should match data to features when the key names are configured", () => {
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
            .transitionColor(false),
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual([missingFill(node), "#ff0000", "#ff0000"]);
    });

    test("should default the key names to geoId and id", () => {
      const component = mapRendererGeoJson();
      expect(component.dataKeyName()).toBe("geoId");
      expect(component.geoJsonKeyName()).toBe("id");
    });
  });

  describe("known quirks", () => {
    // `properties: null` is spec-legal GeoJSON (RFC 7946 3.2): the feature is unmatched rather
    // than crashing the overlay.
    test("should leave a feature unmatched when its properties are null", () => {
      const collection = geoJson();
      collection.features[1].properties = null;
      const node = group()
        .datum(fullData)
        .call(
          mapRendererGeoJson()
            .geoJson(collection)
            .mapPath(mapPathOf(collection))
            .fill("#ff0000")
            .transitionColor(false),
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), "#ff0000"]);
    });

    test("anchors a feature with null properties", () => {
      const collection = geoJson();
      collection.features[0].properties = null;
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPathOf(collection)))
        .node() as SVGGElement;
      expect(anchors(node)).toHaveLength(3);
      // NOTE: the renderer still substitutes an object for null properties of its own accord.
      // getGeoJsonCenter no longer needs it to - it reads through and caches nothing.
      const properties = collection.features.at(0)?.properties;
      expect(properties?.cachedCenter).toBeUndefined();
    });

    // A datum with no key is skipped rather than filed under the string "undefined", so it does
    // not become the datum for every keyless feature.
    test("should leave a feature unmatched when neither the data nor the features carry a key", () => {
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
            .fill((d: Datum) => `rgb(${d.value},0,0)`),
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
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
            }),
        )
        .node() as SVGGElement;
      expect(seen).not.toContain("function");
      expect(attrs(node, "fill")[1]).toBe(missingFill(node));
    });

    // The listeners are bound to this component's own elements, so a base layer's areas in the
    // same group keep whatever was attached to them.
    test("should bind its handlers only to its own elements", () => {
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

    test("should throw when the geojson has no features", () => {
      expect(() =>
        group()
          .datum(fullData)
          // @ts-expect-error - geoJson is required, and unguarded
          .call(mapRendererGeoJson().geoJson(undefined).mapPath(mapPathOf(geoJson())))
          .node(),
      ).toThrow(TypeError);
    });

    // The unconditional fill application covers an element whose defined-ness changed, so the
    // dead stale-class repaint that used to sit here was removed rather than replaced.
    test("should repaint an element when it was undefined on the previous render", () => {
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
              .fill(fill),
          )
          .node() as SVGGElement;
      renderWith("#ff0000");
      expect(attrs(renderWith("#00ff00"), "fill").slice(0, 2)).toEqual(["#00ff00", "#00ff00"]);
    });

    // Both renderers go through getGeoJsonCenter, so an overlay and a base layer over the same
    // features place the same entity's tooltip in one place - now by both computing it rather than
    // by sharing a cache written onto the feature.
    test("should anchor the same centre as the base renderer for the same feature", async () => {
      const mapRendererBase = (await import("../../../src/map/renderer/base.js")).default;
      const collection = geoJson();
      collection.features[0].properties = { id: "a", center: "0.9,0.9" };
      const mapPath = mapPathOf(collection);
      const merged = collection.features.map((f) => ({ geoJson: f, datum: { value: 1 } }));

      const baseNode = group("cross-base")
        .call(mapRendererBase().mergedData(merged).mapPath(mapPath))
        .node() as SVGGElement;
      const geojsonNode = group("cross-geojson")
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
        .node() as SVGGElement;

      // The authored center is what both must honour, and both must land on the same pixel.
      const projected = mapPath.projection<GeoProjection>()([0.9, 0.9]);
      if (!projected) throw new Error("the authored center has no projected position");
      const expected = `translate(${projected.join(",")})`;
      expect(anchors(geojsonNode)[0].getAttribute("transform")).toBe(expected);
      expect(anchors(baseNode)[0].getAttribute("transform")).toBe(expected);

      // Neither renderer leaves bookkeeping of its own behind on the caller's feature.
      const properties = collection.features[0].properties as Record<string, unknown>;
      expect(Object.keys(properties)).toEqual(["id", "center"]);
    });
  });

  describe("fill and stroke", () => {
    test("should fill every matched element black when no fill is configured", () => {
      const node = render(partialData, (c) => c.transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["black", "black", missingFill(node)]);
    });

    test("should texture an element with the missing pattern when the defined predicate fails", () => {
      const node = render(partialData, (c) =>
        c
          .fill("#ff0000")
          .transitionColor(false)
          .defined((d: Datum) => d.value !== 2),
      );
      expect(attrs(node, "fill")).toEqual(["#ff0000", missingFill(node), missingFill(node)]);
    });

    // Unlike the base renderer, the fill here consults fn.defined as well as props.defined, so a
    // feature with no datum does get the missing-value pattern rather than the ordinary fill.
    test("should texture an element with the missing pattern when its feature has no datum", () => {
      const node = render(partialData, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")[2]).toBe(missingFill(node));
    });

    // NOTE: defined goes through fn.functor, so a constant false textures the whole overlay.
    test("textures every element for a constant false defined", () => {
      const node = render(partialData, (c) =>
        c.fill("#ff0000").transitionColor(false).defined(false),
      );
      expect(attrs(node, "fill")).toEqual([
        missingFill(node),
        missingFill(node),
        missingFill(node),
      ]);
    });

    test("should stroke every matched element black at 1.25 when no stroke is configured", () => {
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

    test("should take the stroke from the accessor when it is called with the datum", () => {
      const node = render(partialData, (c) =>
        c.transitionColor(false).stroke((d: Datum) => `rgb(${d.value},0,0)`),
      );
      expect(attrs(node, "stroke").slice(0, 2)).toEqual(["rgb(1,0,0)", "rgb(2,0,0)"]);
    });

    test("should take the stroke width from the accessor when it is called with the datum", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.transitionColor(false).strokeWidth((d: Datum) => {
          seen.push(d);
          return d.value;
        }),
      );
      expect(seen[0]).toEqual({ geoId: "a", value: 1 });
      expect(attrs(node, "stroke-width")).toEqual(["1", "2", "3"]);
    });

    test("should never ask a feature for a stroke width when it is unmatched", () => {
      const seen: unknown[] = [];
      const node = render(partialData, (c) =>
        c.transitionColor(false).strokeWidth((d: Datum) => {
          seen.push(d);
          return d.value;
        }),
      );
      expect(seen).toEqual([
        { geoId: "a", value: 1 },
        { geoId: "b", value: 2 },
      ]);
      expect(elements(node)[2].hasAttribute("stroke-width")).toBe(false);
      expect(attrs(node, "stroke-width").slice(0, 2)).toEqual(["1", "2"]);
    });

    test("should drop an element's stroke width when the defined predicate rejects it", () => {
      const node = render(fullData, (c) =>
        c
          .transitionColor(false)
          .defined((d: Datum) => d.geoId !== "b")
          .strokeWidth((d: Datum) => d.value),
      );
      expect(elements(node)[1].hasAttribute("stroke-width")).toBe(false);
    });
  });

  describe("events", () => {
    test("should leave the shapes inert when no handler is registered", () => {
      // The elements are marked data-event-target and the component binds mouseover, mouseout and
      // click to them, but sszvis.css gave the class pointer-events: none, so none of it could
      // ever fire. It is written inline now and made conditional, as bubble's circles are: with
      // nothing listening the shapes stay decoration and the pointer falls through to the layer
      // beneath, which is what every consumer has had until now.
      const node = render(fullData, (c) => c.transitionColor(false));
      expect((elements(node)[0] as SVGPathElement).style.pointerEvents).toBe("none");
    });

    test("should make the shapes a hit area when a handler is registered", () => {
      const node = render(fullData, (c) => c.transitionColor(false).on("over", () => undefined));
      // SAFETY: an empty string would mean the property was removed, which lets the stylesheet's
      // pointer-events: none win again for any consumer still shipping an older sszvis.css.
      expect((elements(node)[0] as SVGPathElement).style.pointerEvents).toBe("auto");
    });

    test("should go back to inert when the only handler is removed", () => {
      const node = render(fullData, (c) =>
        c
          .transitionColor(false)
          .on("over", () => undefined)
          // null removes a handler; the typing describes the setter's happy path only.
          .on("over", null as never),
      );
      expect((elements(node)[0] as SVGPathElement).style.pointerEvents).toBe("none");
    });

    test("should count a namespaced handler as a listener", () => {
      // d3's dispatch cannot be asked what it holds - on("over") returns undefined for a handler
      // registered as "over.tooltip" - which is why the registry tallies typenames itself.
      const node = render(fullData, (c) =>
        c.transitionColor(false).on("over.tooltip", () => undefined),
      );
      expect((elements(node)[0] as SVGPathElement).style.pointerEvents).toBe("auto");
    });

    test("should put the shape under the pointer when a handler is registered", () => {
      // The reachability of the handlers, pinned with elementFromPoint rather than a synthetic
      // dispatch: a dispatched event reaches its listener whatever the pointer policy is, so it
      // proves nothing about whether a reader could trigger one. This is the assertion the old
      // suite was missing while the stylesheet made every handler dead. Mirrors bubble's.
      const node = render(fullData, (c) => c.transitionColor(false).on("over", () => undefined));
      const shape = elements(node)[0] as SVGPathElement;
      const box = shape.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit).toBe(shape);
    });

    test("should let the pointer through when no handler is registered", () => {
      const node = render(fullData, (c) => c.transitionColor(false));
      const shape = elements(node)[0] as SVGPathElement;
      const box = shape.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit).not.toBe(shape);
    });

    // The events below are dispatched on an element directly, which keeps them independent of the
    // pointer policy - and is why the contradiction above went unnoticed: a dispatched event
    // reaches its listener whatever pointer-events says.
    test("should expose over, out and click through on()", () => {
      const component = mapRendererGeoJson();
      expect(component.on).toBeTypeOf("function");
      expect(component.on("over", () => undefined)).toBe(component);
    });

    test("should deliver the hovered entity's datum when an over handler is registered", () => {
      const over = vi.fn();
      const node = render(fullData, (c) => c.transitionColor(false).on("over", over));
      elements(node)[1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(over).toHaveBeenCalledTimes(1);
      expect(over).toHaveBeenCalledWith({ geoId: "b", value: 2 });
    });

    test("should deliver the datum when out and click handlers are registered", () => {
      const out = vi.fn();
      const click = vi.fn();
      const node = render(fullData, (c) =>
        c.transitionColor(false).on("out", out).on("click", click),
      );
      elements(node)[1].dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      elements(node)[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(out).toHaveBeenCalledWith({ geoId: "b", value: 2 });
      expect(click).toHaveBeenCalledWith({ geoId: "b", value: 2 });
    });

    // An unmatched feature has no datum, so the handler is called with undefined.
    test("should deliver undefined when the hovered entity has no datum", () => {
      const over = vi.fn();
      const node = render(partialData, (c) => c.transitionColor(false).on("over", over));
      elements(node)[2].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(over).toHaveBeenCalledWith(undefined);
    });

    test("should read a listener back through on()", () => {
      const over = () => undefined;
      const component = mapRendererGeoJson().on("over", over);
      expect(component.on("over")).toBe(over);
    });
  });

  describe("transitionColor", () => {
    test("should schedule a fill transition when nothing is configured", () => {
      const node = render(fullData);
      const schedules = (elements(node)[0] as Element & { __transition?: unknown }).__transition;
      expect(schedules).toBeDefined();
    });

    test("should apply the fill without a transition when it is disabled", () => {
      const node = render(fullData, (c) => c.transitionColor(false).fill("#ff0000"));
      expect(
        (elements(node)[0] as Element & { __transition?: unknown }).__transition,
      ).toBeUndefined();
    });

    /**
     * The fill is applied exactly once, through the transition, so the tween has the previous
     * colour to start from rather than the value it is about to write - which is why nothing is
     * in the DOM on the render tick. That it then arrives is the observable half; how long the
     * trip takes belongs to src/transition.ts and its own tests.
     */
    test("should leave the fill out of the DOM on the render tick and paint it once the tween runs", async () => {
      const node = render(fullData, (c) => c.fill("#ff0000"));
      expect(attrs(node, "fill")).toEqual([null, null, null]);

      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(attrs(node, "fill").map(resolvedColor)).toEqual([
        resolvedColor("#ff0000"),
        resolvedColor("#ff0000"),
        resolvedColor("#ff0000"),
      ]);
    });

    // d3 has no interpolator for a paint-server reference, so a colour-to-texture tween would
    // interpolate the numbers embedded in the two strings and spend its run pointing at patterns
    // that do not exist - "url(#missing-pattern255)" - painting nothing at all. Such a change is
    // applied synchronously instead.
    test("should apply the fill synchronously without a tween when the colour changes to the missing texture", async () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("geojson-defined-to-missing");
      const renderWith = (definedValue: boolean, transition: boolean) =>
        layer
          .datum(fullData)
          .call(
            mapRendererGeoJson()
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

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(attrs(node, "fill")).toEqual([textured, textured, textured]);
    });

    // The reverse direction is the same: leaving the texture cannot be interpolated either.
    test("should apply the fill synchronously when the colour changes away from the missing texture", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("geojson-missing-to-defined");
      const renderWith = (definedValue: boolean, transition: boolean) =>
        layer
          .datum(fullData)
          .call(
            mapRendererGeoJson()
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
  });

  describe("missing value pattern", () => {
    // Ids are document-global, so each layer defines its pattern under an id of its own and
    // references that id in the fill rather than a fixed one.
    test("should give every overlay its own missing-pattern id when several are on the page", () => {
      const one = render(fullData, (c) => c, "geojson-layer-one");
      const two = render(fullData, (c) => c, "geojson-layer-two");
      const ids = [one, two].map(missingId);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) {
        expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
      }
    });

    test("should keep a layer's pattern id when it re-renders", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("geojson-pattern-id-reuse");
      const renderWith = () =>
        layer
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
          .node() as SVGGElement;

      const first = missingId(renderWith());
      expect(missingId(renderWith())).toBe(first);
      expect(document.querySelectorAll("defs > pattern")).toHaveLength(1);
    });

    // The base renderer names its pattern from the same counter, so an overlay drawn over a base
    // layer references its own definition rather than whichever came first in the document.
    test("should not collide with a base layer's pattern id when both draw into the same document", async () => {
      const mapRendererBase = (await import("../../../src/map/renderer/base.js")).default;
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const merged = collection.features.map((f) => ({ geoJson: f, datum: undefined }));

      const baseNode = group("collide-base")
        .call(mapRendererBase().mergedData(merged).mapPath(mapPath))
        .node() as SVGGElement;
      const overlayNode = render(fullData, (c) => c, "collide-overlay");
      expect(missingId(baseNode)).not.toBe(missingId(overlayNode));
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per feature at the projected spherical centroid", () => {
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

    test("should leave the features untouched and follow a geometry that moves", () => {
      const collection = geoJson();

      const mapPath = mapPathOf(collection);
      const layer = group("centroid-cache");
      const renderInto = () =>
        layer
          .datum(fullData)
          .call(mapRendererGeoJson().geoJson(collection).mapPath(mapPath))
          .node() as SVGGElement;

      renderInto();
      for (const feature of collection.features) {
        expect(feature.properties?.cachedCenter).toBeUndefined();
      }

      // Move the first feature somewhere else entirely and re-render: the anchor follows, because
      // the centroid is recomputed from the geometry the feature currently has.
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
      expect(anchors(renderInto())[0].getAttribute("transform")).not.toBe(before);
    });

    // An authored `center` is the documented way to nudge a tooltip off a concave shape's true
    // centroid; it is honoured here exactly as it is by the base renderer.
    test("should honour an authored center property when placing an anchor", () => {
      const collection = geoJson();
      collection.features[0].properties = { id: "a", center: "8.5,47.4" };
      const projection = swissMapProjection(100, 100, collection, "geojson-center");
      const node = group()
        .datum(fullData)
        .call(mapRendererGeoJson().geoJson(collection).mapPath(geoPath().projection(projection)))
        .node() as SVGGElement;
      const [x, y] = projection([8.5, 47.4]) as [number, number];
      expect(anchors(node)[0].getAttribute("transform")).toBe(`translate(${x},${y})`);
      expect(anchors(node)[0].getAttribute("transform")).not.toBe(
        `translate(${(projection(geoCentroid(square("a"))) as [number, number]).join(",")})`,
      );
    });
  });
});
