import { easePolyOut, geoCentroid, select } from "d3";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import {
  prepareMergedGeoData,
  swissMapPath,
  swissMapProjection,
} from "../../../src/map/mapUtils.js";
import mapRendererBubble from "../../../src/map/renderer/bubble.js";

type Datum = { geoId: string; value: number };

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

describe("map/renderer/bubble", () => {
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
      key: key ?? `bubble-${++layerKey}`,
    }).selectGroup("map");

  /** A fresh geojson each time, since getGeoJsonCenter caches onto the features. */
  const geoJson = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2), square("c", 4)],
  });

  const mapPathOf = (collection: FeatureCollection<Polygon>) =>
    swissMapPath(100, 100, collection, `bubble-path-${++pathKey}`);

  const circles = (node: Element) => [
    ...node.querySelectorAll<SVGCircleElement>("circle.sszvis-anchored-circle"),
  ];

  /** The names of the tweens d3 scheduled on a node, e.g. ["attr.r"]. */
  const tweenNames = (node: Element) => {
    const schedules = (node as Element & { __transition?: Record<string, unknown> }).__transition;
    if (!schedules) return null;
    return Object.values(schedules)
      .filter((s): s is { tween: { name: string }[] } => typeof s === "object" && s !== null)
      .flatMap((s) => s.tween.map((t) => t.name));
  };

  /** Waits out a default transition (300ms) so its final values are in the DOM. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 450));

  /** The merged datum a circle is bound to, which identifies the feature it stands for. */
  const datumOf = (circle: Element) =>
    select(circle).datum() as { geoJson: Feature<Polygon>; datum: Datum };

  /** Renders the bubbles over `data`, returning the group node they drew into. */
  const render = (
    data: Datum[],
    configure: (c: ReturnType<typeof mapRendererBubble>) => ReturnType<typeof mapRendererBubble> = (
      c
    ) => c,
    key?: string
  ) => {
    const collection = geoJson();
    const component = configure(
      mapRendererBubble()
        .mergedData(prepareMergedGeoData(data, collection))
        .mapPath(mapPathOf(collection))
        .radius(5)
        // fill has no default and is called unguarded, so every render needs one.
        .fill("#ff0000")
    );
    return group(key).call(component).node() as SVGGElement;
  };

  const fullData: Datum[] = [
    { geoId: "a", value: 1 },
    { geoId: "b", value: 2 },
    { geoId: "c", value: 3 },
  ];

  describe("rendering", () => {
    test("renders one classed circle per merged datum", () => {
      const node = render(fullData);
      expect(circles(node)).toHaveLength(3);
      expect(circles(node)[0].tagName).toBe("circle");
    });

    test("draws the circles into an anchoredCircles group", () => {
      const node = render(fullData);
      const inner = node.querySelector("[data-d3-selectgroup='anchoredCircles']");
      expect(inner).not.toBeNull();
      expect(circles(node)[0].parentElement).toBe(inner);
    });

    test("takes the radius from the radius accessor, called with the datum", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c
          .radius((d: Datum) => {
            seen.push(d);
            return d.value * 2;
          })
          // The final radius is written by the transition when one is scheduled, so read it back
          // without one; the animation itself is pinned under "transition".
          .transition(false)
      );
      expect(seen).toEqual(expect.arrayContaining(fullData));
      expect(
        circles(node)
          .map((circle) => circle.getAttribute("r"))
          .sort()
      ).toEqual(["2", "4", "6"]);
    });

    test("takes a constant radius", () => {
      const node = render(fullData, (c) => c.radius(7).transition(false));
      expect(circles(node).map((circle) => circle.getAttribute("r"))).toEqual(["7", "7", "7"]);
    });

    test("anchors each circle at its feature's projected centre", () => {
      const collection = geoJson();
      // The same cache key gives back the same projection the path generator uses.
      const key = `bubble-anchor-${++pathKey}`;
      const projection = swissMapProjection(100, 100, collection, key);
      const node = group()
        .call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(swissMapPath(100, 100, collection, key))
            .radius(5)
            .fill("#ff0000")
        )
        .node() as SVGGElement;
      // Every radius is equal here, so the size sort leaves the features in their own order.
      const expected = collection.features.map((feature) => {
        const point = projection(geoCentroid(feature)) as [number, number];
        return `translate(${point[0]},${point[1]})`;
      });
      expect(circles(node).map((circle) => circle.getAttribute("transform"))).toEqual(expected);
    });

    test("fills and strokes from the accessors, called with the datum", () => {
      const node = render(fullData, (c) =>
        c
          .fill((d: Datum) => (d.value === 1 ? "#ff0000" : "#00ff00"))
          .strokeColor("#0000ff")
          .strokeWidth((d: Datum) => d.value)
      );
      const byRadius = circles(node);
      expect(byRadius.map((circle) => circle.style.stroke)).toEqual([
        "rgb(0, 0, 255)",
        "rgb(0, 0, 255)",
        "rgb(0, 0, 255)",
      ]);
      expect(byRadius.map((circle) => circle.style.fill)).toContain("rgb(255, 0, 0)");
      expect(byRadius.map((circle) => circle.style.strokeWidth).sort()).toEqual(["1", "2", "3"]);
    });

    test("defaults to a white stroke one pixel wide", () => {
      const node = render(fullData);
      expect(circles(node)[0].style.stroke).toBe("rgb(255, 255, 255)");
      expect(circles(node)[0].style.strokeWidth).toBe("1");
    });

    test("orders the circles largest first, so smaller ones draw on top", () => {
      const node = render(fullData, (c) => c.radius((d: Datum) => d.value).transition(false));
      expect(circles(node).map((circle) => circle.getAttribute("r"))).toEqual(["3", "2", "1"]);
    });

    test("keys the join on the feature id, so a circle survives a data change", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-keyed");
      const renderWith = (data: Datum[]) =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(prepareMergedGeoData(data, collection))
              .mapPath(mapPath)
              .radius((d: Datum | undefined) => d?.value ?? 0)
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;
      renderWith(fullData);
      const first = circles(renderWith(fullData))[0];
      const after = circles(renderWith([{ geoId: "a", value: 9 }]));
      // Only "a" has a datum now, but every feature is still in the merged data.
      expect(after).toHaveLength(3);
      expect(circles(layer.node() as SVGGElement)).toContain(first);
    });

    // The circles paint over the base layer's areas, which carry the map's event targets, so they
    // let the pointer through to the area beneath rather than becoming a dead zone in the middle of
    // every bubble.
    test("lets the pointer through to the base layer's event targets", async () => {
      const { default: mapRendererBase } = await import("../../../src/map/renderer/base.js");
      const collection = geoJson();
      const key = `bubble-over-base-${++pathKey}`;
      const merged = prepareMergedGeoData(fullData, collection);
      const layer = group("bubble-over-base");
      layer.call(
        mapRendererBase()
          .mergedData(merged)
          .mapPath(swissMapPath(100, 100, collection, key))
          .fill("#cccccc")
      );
      layer.call(
        mapRendererBubble()
          .mergedData(merged)
          .mapPath(swissMapPath(100, 100, collection, key))
          .radius(5)
          .fill("#ff0000")
      );
      const node = layer.node() as SVGGElement;
      const children = [...node.children].map((child) => child.getAttribute("data-d3-selectgroup"));
      // The circles' group is last, so it paints over the base areas.
      expect(children.at(-1)).toBe("anchoredCircles");
      // The circles are decoration, not a hit area: the areas below stay the event targets.
      expect(circles(node)[0].hasAttribute("data-event-target")).toBe(false);
      expect(circles(node)[0].style.pointerEvents).toBe("none");
      expect(node.querySelectorAll("path[data-event-target]")).toHaveLength(3);
      // A point in the middle of a bubble hits the area underneath it, not the circle.
      const circle = circles(node)[0];
      const box = circle.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2
      ) as Element;
      expect(hit).not.toBe(circle);
      expect(hit.closest("[data-event-target]")).not.toBeNull();
    });

    // The join falls back to an identity held against the feature when it has no id, so keyless
    // features keep their own elements across renders instead of all colliding on the key
    // "undefined".
    test("keeps every circle across renders when the features have no ids", () => {
      const collection: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [
          { ...square("a"), id: undefined },
          { ...square("b", 2), id: undefined },
        ],
      };
      const layer = group("bubble-keyless");
      const renderWith = () =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(
                collection.features.map((feature) => ({
                  geoJson: feature,
                  datum: { geoId: "x", value: 1 },
                }))
              )
              .mapPath(mapPathOf(collection))
              .radius(5)
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;
      const [firstBefore, secondBefore] = circles(renderWith());
      const after = circles(renderWith());
      expect(after).toHaveLength(2);
      expect(after).toContain(firstBefore);
      expect(after).toContain(secondBefore);
    });

    // The fallback key cannot be the feature's position. d3 keys existing nodes by walking the
    // selection they are in, and this component sorts that selection by radius, so a positional
    // fallback describes a different feature on the next render: the elements survive, but the two
    // keyless features swap which one each stands for. Radii differ here, and are swapped between
    // renders, so a positional key would produce exactly that exchange.
    test("keeps each keyless circle bound to its own feature when the sort order changes", () => {
      const first = { ...square("a"), id: undefined };
      const second = { ...square("b", 2), id: undefined };
      const collection: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [first, second],
      };
      const layer = group("bubble-keyless-identity");
      const renderWith = (radii: Map<Feature<Polygon>, number>) =>
        layer
          .call(
            mapRendererBubble<Datum>()
              .mergedData(
                collection.features.map((feature) => ({
                  geoJson: feature,
                  datum: { geoId: String(radii.get(feature)), value: 1 },
                }))
              )
              .mapPath(mapPathOf(collection))
              .radius((d: Datum) => Number(d.geoId))
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;

      renderWith(
        new Map([
          [first, 4],
          [second, 8],
        ])
      );
      const elementOf = (node: SVGGElement, feature: Feature<Polygon>) =>
        circles(node).find((circle) => datumOf(circle).geoJson === feature);
      const before = layer.node() as SVGGElement;
      const firstElement = elementOf(before, first);
      const secondElement = elementOf(before, second);
      expect(firstElement).toBeDefined();
      expect(secondElement).toBeDefined();
      expect(firstElement).not.toBe(secondElement);

      // Swapping the radii reverses the sorted DOM order.
      const node = renderWith(
        new Map([
          [first, 8],
          [second, 4],
        ])
      );
      expect(circles(node)).toHaveLength(2);
      expect(elementOf(node, first)).toBe(firstElement);
      expect(elementOf(node, second)).toBe(secondElement);
    });

    // The circles stay out of the pointer's way only while nothing is listening to them. A consumer
    // who registered the component's own handlers is asking for the circles to be a hit area, and
    // the public on() API keeps working for them.
    test("restores hit testing on the circles when a listener is registered", () => {
      const collection = geoJson();
      const layer = group("bubble-listener-hit");
      const node = layer
        .call(
          mapRendererBubble<Datum>()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPathOf(collection))
            .radius(5)
            .fill("#ff0000")
            .on("click", () => undefined)
        )
        .node() as SVGGElement;
      expect(circles(node)[0].style.pointerEvents).toBe("");
    });

    // A namespaced registration is a registration: d3's dispatch cannot be asked what it holds, so
    // the component tallies them itself rather than probing the bare event names.
    test("restores hit testing for a namespaced listener, and withdraws it again on removal", () => {
      const collection = geoJson();
      const layer = group("bubble-listener-namespaced");
      const component = mapRendererBubble<Datum>()
        .mergedData(prepareMergedGeoData(fullData, collection))
        .mapPath(mapPathOf(collection))
        .radius(5)
        .fill("#ff0000");

      const withListener = layer
        .call(component.on("over.tooltip", () => undefined))
        .node() as SVGGElement;
      expect(circles(withListener)[0].style.pointerEvents).toBe("");

      const withoutListener = layer.call(component.on("over.tooltip", null)).node() as SVGGElement;
      expect(circles(withoutListener)[0].style.pointerEvents).toBe("none");
    });

    // d3 reads a typename with no type as "this name, on every event type", so on(".tooltip", null)
    // removes over.tooltip along with the rest. The tally has to follow that, or the circles would
    // go on intercepting the pointer for a listener that is no longer registered.
    test("withdraws hit testing when a namespace is removed across every event type", () => {
      const collection = geoJson();
      const layer = group("bubble-listener-namespace-wide");
      const component = mapRendererBubble<Datum>()
        .mergedData(prepareMergedGeoData(fullData, collection))
        .mapPath(mapPathOf(collection))
        .radius(5)
        .fill("#ff0000");

      component.on("over.tooltip", () => undefined).on("out.tooltip", () => undefined);
      expect(circles(layer.call(component).node() as SVGGElement)[0].style.pointerEvents).toBe("");

      component.on(".tooltip", null);
      expect(circles(layer.call(component).node() as SVGGElement)[0].style.pointerEvents).toBe(
        "none"
      );
    });

    // Two more of d3's typename rules, verified against d3 itself rather than assumed: "over." is
    // the same registration as "over", and an empty or whitespace-only typename list does nothing.
    test.each([
      ["a dotted form of the same typename", "over.", "none", "dotted"],
      ["an empty typename list", "", "", "empty"],
      ["a whitespace-only typename list", "   ", "", "blank"],
    ])("follows d3 when a handler is removed with %s", (_label, removeWith, expected, key) => {
      const collection = geoJson();
      const layer = group(`bubble-typename-${key}`);
      const component = mapRendererBubble<Datum>()
        .mergedData(prepareMergedGeoData(fullData, collection))
        .mapPath(mapPathOf(collection))
        .radius(5)
        .fill("#ff0000");

      component.on("over", () => undefined);
      expect(circles(layer.call(component).node() as SVGGElement)[0].style.pointerEvents).toBe("");

      component.on(removeWith, null);
      expect(circles(layer.call(component).node() as SVGGElement)[0].style.pointerEvents).toBe(
        expected
      );
    });

    // The classes are written with classed rather than attr, and only when the circle enters, so
    // the component never touches a class a consumer added to it.
    test("keeps a class a consumer put on a circle", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-class-clobber");
      const renderWith = () =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .mapPath(mapPath)
              .radius(5)
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;
      const circle = circles(renderWith())[0];
      circle.classList.add("consumer-added");
      expect(circles(renderWith())[0].classList.contains("consumer-added")).toBe(true);
    });
  });

  describe("transition", () => {
    test("defaults to transitioning the radius", () => {
      expect(mapRendererBubble().transition()).toBe(true);
      const node = render(fullData);
      expect(tweenNames(circles(node)[0])).toContain("attr.r");
    });

    test("schedules no transition when disabled", () => {
      const node = render(fullData, (c) => c.transition(false));
      expect(tweenNames(circles(node)[0])).toBeNull();
    });

    // The radius is written exactly once, through the transition, so the tween has the previous
    // radius - zero for an entering circle - to interpolate from rather than the final value.
    test("grows an entering circle from zero to its radius", async () => {
      const node = render(fullData, (c) => c.radius(9));
      expect(circles(node)[0].getAttribute("r")).toBe("0");
      expect(tweenNames(circles(node)[0])).toContain("attr.r");
      await settle();
      expect(circles(node)[0].getAttribute("r")).toBe("9");
    });

    test("interpolates an updating circle from its previous radius", async () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-update-tween");
      const renderWith = (radius: number) =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(prepareMergedGeoData(fullData, collection))
              .mapPath(mapPath)
              .radius(radius)
              .fill("#ff0000")
          )
          .node() as SVGGElement;
      renderWith(4);
      await settle();
      const node = renderWith(20);
      // The old radius is still in the DOM when the tween starts.
      expect(circles(node)[0].getAttribute("r")).toBe("4");
      await settle();
      expect(circles(node)[0].getAttribute("r")).toBe("20");
    });

    // defaultTransition() is passed as `t` straight to .transition(t), so its 300ms and
    // easePolyOut reach the schedule.
    test("uses the default transition's 300ms and polynomial ease", () => {
      const node = render(fullData);
      const schedules = (circles(node)[0] as Element & { __transition?: Record<string, unknown> })
        .__transition;
      const scheduled = Object.values(schedules ?? {}).filter(
        (v): v is { duration: number; ease: (t: number) => number } =>
          typeof v === "object" && v !== null && "duration" in v
      );
      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].duration).toBe(300);
      expect(scheduled[0].ease).toBe(easePolyOut);
    });

    test("shrinks a departing circle away before removing it", async () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-exit");
      const renderWith = (features: Feature<Polygon>[]) =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(
                features.map((feature) => ({ geoJson: feature, datum: { geoId: "x", value: 1 } }))
              )
              .mapPath(mapPath)
              .radius(5)
              .fill("#ff0000")
          )
          .node() as SVGGElement;
      renderWith(collection.features);
      expect(circles(renderWith(collection.features))).toHaveLength(3);
      await settle();
      const node = renderWith([collection.features[0]]);
      // The two departing circles are still in the DOM, shrinking towards zero. They have to be
      // picked out by the feature they are bound to: they outlive the render that removed them, so
      // reading circles(node)[0] would inspect the retained circle and pass on its update tween
      // even if the exit transition were dropped.
      const departing = circles(node).filter(
        (circle) => datumOf(circle).geoJson !== collection.features[0]
      );
      expect(circles(node)).toHaveLength(3);
      expect(departing).toHaveLength(2);
      for (const circle of departing) expect(tweenNames(circle)).toContain("attr.r");
      await settle();
      expect(circles(node)).toHaveLength(1);
    });

    test("removes a departing circle at once when the transition is disabled", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-exit-instant");
      const renderWith = (features: Feature<Polygon>[]) =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(
                features.map((feature) => ({ geoJson: feature, datum: { geoId: "x", value: 1 } }))
              )
              .mapPath(mapPath)
              .radius(5)
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;
      renderWith(collection.features);
      expect(circles(renderWith([collection.features[0]]))).toHaveLength(1);
    });
  });

  describe("events", () => {
    // The reachability of these handlers, pinned with elementFromPoint rather than with a
    // synthetic dispatch: a dispatched event reaches a listener whatever the pointer policy is, so
    // it says nothing about whether a reader could ever trigger one. Registering a handler is what
    // makes the circle a hit area - without one it carries pointer-events: none and the pointer
    // falls through to the base layer, which is pinned in "lets the pointer through to the base
    // layer's event targets" above.
    test("puts the circle under the pointer once a handler is registered", async () => {
      const { default: mapRendererBase } = await import("../../../src/map/renderer/base.js");
      const collection = geoJson();
      const key = `bubble-reachable-${++pathKey}`;
      const merged = prepareMergedGeoData(fullData, collection);
      const layer = group("bubble-reachable");
      layer.call(
        mapRendererBase()
          .mergedData(merged)
          .mapPath(swissMapPath(100, 100, collection, key))
          .fill("#cccccc")
      );
      layer.call(
        mapRendererBubble<Datum>()
          .mergedData(merged)
          .mapPath(swissMapPath(100, 100, collection, key))
          .radius(5)
          .fill("#ff0000")
          .transition(false)
          .on("over", () => undefined)
      );
      const node = layer.node() as SVGGElement;
      const circle = circles(node)[0];
      expect(circle.style.pointerEvents).toBe("");
      const box = circle.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit).toBe(circle);
    });

    // The events below are dispatched on a circle directly, which keeps them independent of the
    // pointer policy; the test above is what pins that a real pointer can reach them at all.
    test("delivers the hovered entity's datum to an over handler", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) => c.on("over", (datum: unknown) => seen.push(datum)));
      circles(node)[0].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(seen).toEqual([{ geoId: "a", value: 1 }]);
    });

    test("delivers the datum to out and click handlers too", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.on("out", (d: unknown) => seen.push(d)).on("click", (d: unknown) => seen.push(d))
      );
      circles(node)[0].dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      circles(node)[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(seen).toEqual([
        { geoId: "a", value: 1 },
        { geoId: "a", value: 1 },
      ]);
    });

    // prepareMergedGeoData pairs every feature with undefined where nothing matched, so a circle
    // for a feature with no data hands its handler undefined.
    test("delivers undefined for a circle whose feature matched no datum", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.on("over", (d: unknown) => seen.push(d))
      );
      circles(node)[1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(seen).toEqual([undefined]);
    });
  });

  describe("known quirks", () => {
    test("returns the component from on() so it can be chained", () => {
      const component = mapRendererBubble();
      expect(component.on("over", () => undefined)).toBe(component);
      expect(typeof component.on("over")).toBe("function");
    });

    // BUG: the --entering modifier is added and removed within the same render, so it is never
    // observable from outside and offers no enter-only styling hook. The same dead affordance as
    // the base renderer's --entering class.
    test("never leaves the entering modifier on a circle", () => {
      const node = render(fullData);
      expect(circles(node)[0].getAttribute("class")).toBe("sszvis-anchored-circle");
      expect(node.querySelectorAll(".sszvis-anchored-circle--entering")).toHaveLength(0);
    });

    // NOTE: nothing in sszvis.css styles .sszvis-anchored-circle, so fill, stroke and stroke-width
    // come entirely from the inline styles this component writes - and a consumer cannot restyle
    // them from their own stylesheet, since an inline style beats any author rule short of
    // !important.
    test("writes the colours as inline styles, with no stylesheet behind them", () => {
      const node = render(fullData, (c) => c.fill("#123456"));
      expect(circles(node)[0].hasAttribute("fill")).toBe(false);
      expect(circles(node)[0].style.fill).toBe("rgb(18, 52, 86)");
    });

    // NOTE: the radius accessor is called for every circle twice over on the initial render - once
    // for the attribute and once for the transition - and again for each comparison the sort
    // makes: three data produce ten calls. A radius function doing real work is called far more
    // often than there are data.
    test("calls the radius accessor many more times than there are data", () => {
      let calls = 0;
      render(fullData, (c) =>
        c.radius(() => {
          calls += 1;
          return 5;
        })
      );
      expect(calls).toBeGreaterThan(fullData.length);
    });

    // BUG: mergedData is not validated. Omitting it reaches d3's data join as undefined, which
    // throws a bare TypeError rather than rendering nothing - and the group has already been
    // created by then.
    test("throws when mergedData is missing", () => {
      const collection = geoJson();
      expect(() =>
        group().call(mapRendererBubble().mapPath(mapPathOf(collection)).radius(5).fill("#ff0000"))
      ).toThrow(TypeError);
    });

    // BUG: mapPath is read as a d3.geoPath - the anchor positions call mapPath.projection() - so a
    // bare path function throws a TypeError from inside the transform callback, after the circles
    // have been created and sized. The same requirement, and the same failure, as the base
    // renderer's anchors.
    test("throws when mapPath is a bare path function", () => {
      const collection = geoJson();
      const layer = group("bubble-bare-path");
      expect(() =>
        layer.call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            // @ts-expect-error - a bare path function is a caller error; pinned because the
            // failure comes from inside the transform callback, after the circles exist.
            .mapPath(() => "M0,0")
            .radius(5)
            .fill("#ff0000")
        )
      ).toThrow(TypeError);
      expect(circles(layer.node() as SVGGElement)).toHaveLength(3);
    });

    test("throws when mapPath is missing entirely", () => {
      const collection = geoJson();
      expect(() =>
        group().call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .radius(5)
            .fill("#ff0000")
        )
      ).toThrow(TypeError);
    });

    // BUG: neither radius nor fill has a default, and both are called unguarded - so a bubble map
    // configured without one throws a bare TypeError naming neither property. Four of the
    // component's six properties are effectively required, and only strokeColor and strokeWidth
    // have defaults.
    test("throws when radius is missing", () => {
      const collection = geoJson();
      expect(() =>
        group().call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPathOf(collection))
            .fill("#ff0000")
        )
      ).toThrow(TypeError);
    });

    test("throws when fill is missing", () => {
      const collection = geoJson();
      expect(() =>
        group().call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPathOf(collection))
            .radius(5)
        )
      ).toThrow(TypeError);
    });

    // NOTE: a feature with no datum is still given a circle - prepareMergedGeoData pairs every
    // feature with undefined where nothing matched - so the accessors are called with undefined.
    // That is why the docs examples guard their radius functions with sszvis.defined at all: an
    // unguarded one throws, as the next test shows.
    // NOTE: the radius accessor is composed with fn.compose, which invokes each stage with
    // .call(this), so a radius accessor written as a function sees d3's circle node as `this`.
    // Pinned because writing the composition as an arrow would silently call it with undefined.
    test("calls a function radius accessor with d3's circle node as this", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.radius(function (this: unknown) {
          seen.push(this);
          return 5;
        })
      );
      // The accessor is also reached through the sort comparator and the transition, which call it
      // directly rather than through d3, so `this` is undefined for those. What matters is that
      // every circle appears: an arrow-composed accessor would never see a node at all.
      expect(seen).toEqual(expect.arrayContaining(circles(node)));
    });

    test("draws a circle for a feature with no datum, calling the accessors with undefined", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.radius((d: Datum | undefined) => {
          seen.push(d);
          return d ? 5 : 0;
        })
      );
      expect(circles(node)).toHaveLength(3);
      expect(seen).toContain(undefined);
    });

    // NOTE: the anchor positions go through getGeoJsonCenter, which caches a centre onto every
    // feature's properties and never invalidates it - so moving a feature's geometry leaves its
    // bubble behind. Shared with the base renderer, and documented in mapUtils.
    test("keeps a bubble at the cached centre after the geometry moves", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      const layer = group("bubble-cached-centre");
      const renderWith = () =>
        layer
          .call(
            mapRendererBubble()
              .mergedData(
                collection.features.map((feature) => ({
                  geoJson: feature,
                  datum: { geoId: "x", value: 1 },
                }))
              )
              .mapPath(mapPath)
              .radius(5)
              .fill("#ff0000")
              .transition(false)
          )
          .node() as SVGGElement;
      const before = circles(renderWith())[0].getAttribute("transform");
      collection.features[0].geometry.coordinates = [
        [
          [8, 8],
          [8, 9],
          [9, 9],
          [8, 8],
        ],
      ];
      expect(circles(renderWith())[0].getAttribute("transform")).toBe(before);
    });

    // The other half of the "no datum" note above: an accessor that reads through the datum
    // without guarding throws, taking the whole render with it - one unmatched feature is enough.
    test("throws when an unguarded radius accessor meets a feature with no datum", () => {
      expect(() =>
        render([{ geoId: "a", value: 1 }], (c) => c.radius((d: Datum) => d.value))
      ).toThrow(TypeError);
    });

    // NOTE: on() forwards to a d3 dispatch, so it inherits its semantics: an unknown event name
    // throws rather than being ignored, a namespaced name is accepted, and null removes a handler.
    test("inherits d3 dispatch semantics from on()", () => {
      const component = mapRendererBubble();
      expect(() => component.on("bogus", () => undefined)).toThrow(/unknown type/);
      expect(component.on("over.scoped", () => undefined)).toBe(component);
      expect(component.on("over.scoped", null)).toBe(component);
      expect(component.on("over.scoped")).toBeUndefined();
    });

    // NOTE: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill
    // are all required in practice, and each of them fails differently when left out.
    test("defaults only the two stroke properties", () => {
      const component = mapRendererBubble();
      expect(component.strokeColor()("x")).toBe("#ffffff");
      expect(component.strokeWidth()("x")).toBe(1);
      expect(component.radius()).toBeUndefined();
      expect(component.fill()).toBeUndefined();
      expect(component.mergedData()).toBeUndefined();
      expect(component.mapPath()).toBeUndefined();
    });

    // NOTE: the projection's result is indexed without a guard, so a projection that answers null
    // for a point it cannot place throws rather than reporting that the entity is off the
    // projection. d3's own projections return a point for every input when called directly, so
    // this needs a caller-supplied one - but choropleth builds the path generator itself, which is
    // what keeps it out of reach in practice.
    test("throws when the projection cannot place a feature's centre", () => {
      const collection = geoJson();
      const mapPath = mapPathOf(collection);
      // @ts-expect-error - a bare function is all the renderer calls, though d3 types the setter
      // as taking a full projection.
      mapPath.projection(() => null);
      expect(() =>
        group().call(
          mapRendererBubble()
            .mergedData(prepareMergedGeoData(fullData, collection))
            .mapPath(mapPath)
            .radius(5)
            .fill("#ff0000")
        )
      ).toThrow(TypeError);
    });

    // NOTE: this component adds no tooltip anchors of its own. A bubble map's tooltips are
    // anchored by the base renderer underneath it, which is why the docs examples read the datum
    // through a merged wrapper.
    test("adds no tooltip anchors", () => {
      const node = render(fullData);
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
    });
  });
});
