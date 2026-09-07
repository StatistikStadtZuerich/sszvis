import type { Feature, FeatureCollection, MultiLineString, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { component } from "../../src/d3-component.js";
import "../../src/d3-selectgroup.js";
import { swissMapPath, swissMapProjection } from "../../src/map/mapUtils.js";
import choropleth, { type AnchoredShape } from "../../src/maps/choropleth.js";

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

/** The one polyline carrying every entity border, which is the shape the mesh renderer wants. */
const mesh = (): Feature<MultiLineString> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiLineString",
    coordinates: [
      [
        [0, 0],
        [0, 1],
      ],
      [
        [2, 2],
        [2, 3],
      ],
    ],
  },
});

/** The lake outline, and the entity borders that run over it. */
const lakeFeature = (): Feature<Polygon> => square("lake", 1);
const lakeBorders = (): Feature<MultiLineString> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiLineString",
    coordinates: [
      [
        [1, 1],
        [1, 2],
      ],
    ],
  },
});

const fullData: Datum[] = [
  { geoId: "a", value: 1 },
  { geoId: "b", value: 2 },
  { geoId: "c", value: 3 },
];

describe("maps/choropleth", () => {
  let container: HTMLDivElement;
  let layerKey = 0;
  let size = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    document.body.appendChild(container);
    // Cleared so that the keys the tests fit their own expectations under - choropleth itself
    // passes none - cannot leak between tests.
    swissMapProjection.cache.clear();
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const layer = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `choropleth-${++layerKey}`,
    });

  /** A fresh geojson each time, since getGeoJsonCenter caches a centre onto every feature. */
  const geoJson = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2), square("c", 4)],
  });

  /** A distinct size per render, so no two renders are compared at the same dimensions. */
  const nextSize = () => 100 + ++size;

  type Choropleth<T extends object> = ReturnType<typeof choropleth<T>>;
  type Configure = (c: Choropleth<Datum>) => Choropleth<Datum>;

  /** Renders a choropleth over `data`, returning the layer group it drew into. */
  const render = (
    data: Datum[],
    configure: Configure = (c) => c,
    options: { key?: string; collection?: FeatureCollection<Polygon>; size?: number } = {}
  ) => {
    const collection = options.collection ?? geoJson();
    const side = options.size ?? nextSize();
    const map = configure(
      choropleth<Datum>()
        .features(collection)
        .borders(mesh())
        .lakeFeatures(lakeFeature())
        .lakeBorders(lakeBorders())
        .width(side)
        .height(side)
    );
    return layer(options.key).datum(data).call(map).node() as SVGGElement;
  };

  const areas = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__area"),
  ];
  const attrs = (node: Element, attr: string) => areas(node).map((a) => a.getAttribute(attr));
  /**
   * The base renderer names its missing-value pattern per layer, so a test can only assert the
   * shape of the reference: the counter is global and drifts with the rest of the suite.
   */
  const missingPattern = /^url\(#missing-pattern-\d+\)$/;
  const borders = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__border"),
  ];
  const lake = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__lakezurich"),
  ];
  const lakePaths = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__lakepath"),
  ];
  /**
   * The scope the lake overlay generated for this group, which qualifies its three definition ids.
   * Read back rather than hardcoded, since the generated scope is a global counter.
   */
  const lakeScope = (node: Element) =>
    node.querySelector('[data-d3-selectgroup="lake"]')?.getAttribute("data-lake-key") ?? null;
  const highlights = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__highlight"),
  ];

  /**
   * The distinct data an accessor was called with, in the order they first appeared. The base
   * renderer calls its fill accessor twice for every area - once for the attribute and once for
   * the transition that follows it - so the raw call log has each datum in it twice.
   */
  const distinct = (seen: unknown[]) => {
    const out: unknown[] = [];
    for (const value of seen) if (!out.some((v) => Object.is(v, value))) out.push(value);
    return out;
  };

  describe("rendering", () => {
    test("renders one area per map feature", () => {
      const node = render(fullData);
      expect(areas(node)).toHaveLength(3);
    });

    test("renders an area for a feature with no data too", () => {
      const node = render([{ geoId: "a", value: 1 }]);
      expect(areas(node)).toHaveLength(3);
    });

    test("renders the border mesh as a single path", () => {
      const node = render(fullData);
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].getAttribute("d")).toMatch(/^M/);
    });

    // The mesh renderer now names the missing property instead of leaving a geometry-less path
    // behind, so a choropleth without borders fails loudly rather than drawing a blank border
    // layer.
    test("throws when borders are missing, naming the mesh renderer's property", () => {
      const collection = geoJson();
      expect(() =>
        layer().call(choropleth().features(collection).width(160).height(160).withLake(false))
      ).toThrow(/geoJson is required/);
    });

    test("projects the areas with a path fitted to the features at the given size", () => {
      const collection = geoJson();
      const node = render(fullData, (c) => c, { collection, size: 300 });
      // Fitted here under a key of our own, so this is an independent projection rather than a
      // read-back of the one the component cached under its hardcoded key.
      const expected = swissMapPath(300, 300, collection, "fitted-independently");
      expect(attrs(node, "d")).toEqual(collection.features.map((f) => expected(f)));
    });

    test("marks every area as an event target", () => {
      const node = render(fullData);
      expect(attrs(node, "data-event-target")).toEqual(["", "", ""]);
    });

    test("draws the base areas before the borders, so the borders paint on top", () => {
      const node = render(fullData);
      const paths = [...node.querySelectorAll("path")];
      expect(paths.indexOf(areas(node)[0])).toBeLessThan(paths.indexOf(borders(node)[0]));
    });
  });

  describe("the projection", () => {
    test("projects two different maps rendered at the same size independently", () => {
      const near: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [square("a")],
      };
      const far: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [square("a", 40)],
      };
      const first = render(fullData, (c) => c.withLake(false), {
        collection: near,
        size: 200,
        key: "cache-first",
      });
      const second = render(fullData, (c) => c.withLake(false), {
        collection: far,
        size: 200,
        key: "cache-second",
      });
      // Each map is fitted to the features it was given, so each fills its own destination box.
      expect(areas(first)).toHaveLength(1);
      expect(attrs(first, "d")).toEqual([
        swissMapPath(200, 200, near, "near-alone")(near.features[0]),
      ]);
      expect(attrs(second, "d")).toEqual([
        swissMapPath(200, 200, far, "far-alone")(far.features[0]),
      ]);
      const coordinates = (attrs(second, "d")[0] as string)
        .split(/[ML,Z]/)
        .filter(Boolean)
        .map(Number);
      expect(coordinates.every((v) => v >= 0 && v <= 200)).toBe(true);
    });

    // The component passes no cache key at all, so swissMapProjection's bounds cache is bypassed
    // and nothing of a choropleth's is retained between renders.
    test("leaves no entry in the projection bounds cache", () => {
      render(fullData, (c) => c, { size: 210 });
      expect(swissMapProjection.cache.size).toBe(0);
    });
  });

  describe("data matching", () => {
    test("matches data to features on geoId by default", () => {
      const seen: unknown[] = [];
      render(fullData, (c) =>
        c.fill((d?: Datum) => {
          seen.push(d);
          return "#ff0000";
        })
      );
      expect(distinct(seen)).toEqual(fullData);
    });

    test("matches on a custom keyName", () => {
      const collection = geoJson();
      const seen: unknown[] = [];
      const map = choropleth<{ kreis: string }>()
        .features(collection)
        .borders(mesh())
        .width(120)
        .height(120)
        .keyName("kreis")
        .withLake(false)
        .fill((d?: { kreis: string }) => {
          seen.push(d);
          return "#ff0000";
        });
      layer()
        .datum([{ kreis: "a" }, { kreis: "b" }, { kreis: "c" }])
        .call(map);
      expect(distinct(seen)).toEqual([{ kreis: "a" }, { kreis: "b" }, { kreis: "c" }]);
    });

    // A layer where no entity has a datum encodes no data, so it is drawing geometry rather than
    // values and keeps the caller's fill instead of texturing everything as missing.
    // docs/map-extended/rastermap-bins.js relies on this: it draws the choropleth as a
    // transparent outline over a raster image, with fill("none") and no data at all.
    test("keeps the caller's fill for a map with no data at all", () => {
      const collection = geoJson();
      const seen: unknown[] = [];
      const node = layer()
        .call(
          choropleth<Datum>()
            .features(collection)
            .borders(mesh())
            .width(130)
            .height(130)
            .withLake(false)
            .transitionColor(false)
            .fill((d?: Datum) => {
              seen.push(d);
              return "#ff0000";
            })
        )
        .node() as SVGGElement;
      expect(areas(node)).toHaveLength(3);
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
      // Nothing is classed --undefined either, so the fill and the class still agree.
      expect(node.querySelectorAll(".sszvis-map__area--undefined")).toHaveLength(0);
    });

    // A feature that matched no datum is textured as missing rather than painted with the ordinary
    // fill, so the accessor is never handed undefined - a caller whose accessor dereferences its
    // datum no longer crashes.
    test("textures a feature with no datum instead of calling the fill accessor", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.transitionColor(false).fill((d?: Datum) => {
          seen.push(d);
          return "#ff0000";
        })
      );
      expect(distinct(seen)).toEqual([{ geoId: "a", value: 1 }]);
      expect(attrs(node, "fill")[1]).toMatch(missingPattern);
      expect(attrs(node, "fill")[2]).toMatch(missingPattern);
    });

    // An interface has no implicit index signature, so it does not satisfy Record<string,
    // unknown>. The component is constrained to `object`, matching prepareMergedGeoData, so an
    // ordinary consumer model can be named as its datum type.
    test("accepts an interface-shaped datum", () => {
      interface Kreis {
        geoId: string;
        value: number;
      }
      const collection = geoJson();
      const seen: (Kreis | undefined)[] = [];
      const node = layer()
        .datum<Kreis[]>([{ geoId: "b", value: 7 }])
        .call(
          choropleth<Kreis>()
            .features(collection)
            .borders(mesh())
            .width(135)
            .height(135)
            .withLake(false)
            .transitionColor(false)
            .highlight([{ geoId: "b", value: 7 }])
            .fill((d?: Kreis) => {
              seen.push(d);
              return d ? "#ff0000" : "#0000ff";
            })
        )
        .node() as SVGGElement;
      expect(attrs(node, "fill")[1]).toBe("#ff0000");
      expect(attrs(node, "fill")[0]).toMatch(missingPattern);
      expect(attrs(node, "fill")[2]).toMatch(missingPattern);
      expect(distinct(seen)).toEqual([{ geoId: "b", value: 7 }]);
      expect(highlights(node)).toHaveLength(1);
    });
  });

  describe("the lake overlay", () => {
    test("renders the lake and its border path by default", () => {
      const node = render(fullData);
      expect(lake(node)).toHaveLength(1);
      expect(lakePaths(node)).toHaveLength(1);
    });

    test("omits the lake entirely when withLake is false", () => {
      const node = render(fullData, (c) => c.withLake(false));
      expect(lake(node)).toHaveLength(0);
      expect(lakePaths(node)).toHaveLength(0);
    });

    // choropleth passes lakeFadeOut, defaulting to false, over the lake renderer's own default of
    // true - so the fade mask and its gradient are not created unless the caller asks for them.
    test("does not fade the lake out by default", () => {
      const node = render(fullData);
      expect(lake(node)[0].getAttribute("mask")).toBeNull();
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(root.querySelectorAll(`#lake-fade-gradient-${lakeScope(node)}`)).toHaveLength(0);
    });

    // The lake definitions are scoped per overlay, so the mask id is read back from the scope the
    // renderer recorded on the group rather than hardcoded.
    test("fades the lake out when lakeFadeOut is set", () => {
      const node = render(fullData, (c) => c.lakeFadeOut(true));
      expect(lake(node)[0].getAttribute("mask")).toBe(`url(#lake-fade-mask-${lakeScope(node)})`);
    });

    // Turning the fade back off removes it: the renderer drops the mask attribute and both of its
    // definitions rather than only skipping the write, so a chart driving lakeFadeOut from a
    // control can unfade.
    test("removes the fade when lakeFadeOut is turned back off", () => {
      const collection = geoJson();
      const target = layer("fade-toggle");
      const map = choropleth()
        .features(collection)
        .borders(mesh())
        .lakeFeatures(lakeFeature())
        .lakeBorders(lakeBorders())
        .width(240)
        .height(240);
      target.call(map.lakeFadeOut(true));
      const node = target.call(map.lakeFadeOut(false)).node() as SVGGElement;
      expect(lake(node)[0].getAttribute("mask")).toBeNull();
      const scope = lakeScope(node);
      expect(node.querySelectorAll(`#lake-fade-mask-${scope}`)).toHaveLength(0);
      expect(node.querySelectorAll(`#lake-fade-gradient-${scope}`)).toHaveLength(0);
    });

    test("delegates lakePathColor to the lake renderer", () => {
      const node = render(fullData, (c) => c.lakePathColor("#00ff00"));
      expect(lakePaths(node)[0].style.stroke).toBe("rgb(0, 255, 0)");
    });
  });

  // The lake is drawn into a group of the component's own, so turning it off removes everything
  // the renderer drew - both paths and the definitions it emitted - rather than leaving the
  // texture over the map. docs/map-standard/statistische-zonen.js documents withLake(false) as
  // the way to reveal the lake zones underneath.
  test("removes a previously rendered lake when withLake is turned off", () => {
    const collection = geoJson();
    const target = layer("lake-toggle");
    const map = choropleth()
      .features(collection)
      .borders(mesh())
      .lakeFeatures(lakeFeature())
      .lakeBorders(lakeBorders())
      .width(180)
      .height(180);
    const drawn = target.call(map.withLake(true)).node() as SVGGElement;
    const scope = lakeScope(drawn);
    const root = drawn.ownerSVGElement as SVGSVGElement;
    expect(root.querySelectorAll(`#lake-pattern-${scope}`)).toHaveLength(1);
    const node = target.call(map.withLake(false)).node() as SVGGElement;
    expect(lake(node)).toHaveLength(0);
    expect(lakePaths(node)).toHaveLength(0);
    expect(root.querySelectorAll(`#lake-pattern-${scope}`)).toHaveLength(0);
  });

  test("draws the lake again when withLake is turned back on", () => {
    const collection = geoJson();
    const target = layer("lake-retoggle");
    const map = choropleth()
      .features(collection)
      .borders(mesh())
      .lakeFeatures(lakeFeature())
      .lakeBorders(lakeBorders())
      .width(185)
      .height(185);
    target.call(map.withLake(true));
    target.call(map.withLake(false));
    const node = target.call(map.withLake(true)).node() as SVGGElement;
    expect(lake(node)).toHaveLength(1);
    expect(lakePaths(node)).toHaveLength(1);
  });

  describe("highlight", () => {
    test("renders no highlight path by default", () => {
      const node = render(fullData);
      expect(highlights(node)).toHaveLength(0);
    });

    test("renders a highlight path per highlighted datum", () => {
      const node = render(fullData, (c) => c.highlight([fullData[1]]));
      expect(highlights(node)).toHaveLength(1);
    });

    test("delegates the highlight stroke and its width", () => {
      const node = render(fullData, (c) =>
        c.highlight([fullData[1]]).highlightStroke("#ff0000").highlightStrokeWidth(5)
      );
      expect(highlights(node)[0].style.stroke).toBe("rgb(255, 0, 0)");
      expect(highlights(node)[0].style.strokeWidth).toBe("5");
    });

    test("matches the highlight data with the map's keyName", () => {
      const collection = geoJson();
      const map = choropleth<{ kreis: string }>()
        .features(collection)
        .borders(mesh())
        .width(140)
        .height(140)
        .withLake(false)
        .keyName("kreis")
        .highlight([{ kreis: "b" }]);
      const node = layer().call(map).node() as SVGGElement;
      expect(highlights(node)).toHaveLength(1);
      expect(highlights(node)[0].getAttribute("d")).toMatch(/^M/);
    });

    test("draws the highlight after the lake, so it is not covered by the lake texture", () => {
      const node = render(fullData, (c) => c.highlight([fullData[1]]));
      const paths = [...node.querySelectorAll("path")];
      expect(paths.indexOf(highlights(node)[0])).toBeGreaterThan(paths.indexOf(lake(node)[0]));
    });
  });

  describe("delegated base and mesh properties", () => {
    test("delegates fill to the base renderer", () => {
      const node = render(fullData, (c) => c.fill("#ff0000").transitionColor(false));
      expect(attrs(node, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
    });

    test("delegates defined to the base renderer", () => {
      const node = render(fullData, (c) =>
        c
          .fill("#ff0000")
          .transitionColor(false)
          .defined((d?: Datum) => d?.value !== 2)
      );
      const fills = attrs(node, "fill");
      expect([fills[0], fills[2]]).toEqual(["#ff0000", "#ff0000"]);
      expect(fills[1]).toMatch(missingPattern);
    });

    test("delegates borderColor and strokeWidth to the mesh renderer", () => {
      const node = render(fullData, (c) => c.borderColor("#0000ff").strokeWidth(3));
      expect(borders(node)[0].style.stroke).toBe("rgb(0, 0, 255)");
      expect(borders(node)[0].style.strokeWidth).toBe("3");
    });

    test("reads a delegated property back from its renderer", () => {
      const map = choropleth<Datum>().borderColor("#0000ff");
      expect(map.borderColor()).toBe("#0000ff");
      expect(map.strokeWidth()).toBe(1.25);
      expect(map.highlightStroke()(fullData[0])).toBe("white");
    });

    test("returns the component from a delegated setter, so it can be chained", () => {
      const map = choropleth();
      expect(map.fill("#ff0000")).toBe(map);
      expect(map.withLake(false)).toBe(map);
    });

    test("defaults keyName to geoId and withLake to true", () => {
      const map = choropleth();
      expect(map.keyName()).toBe("geoId");
      expect(map.withLake()).toBe(true);
      expect(map.lakeFadeOut()).toBe(false);
    });
  });

  describe("anchoredShape", () => {
    /** A stand-in for anchoredCircles: records what choropleth hands it, and draws one marker. */
    const recordingShape = () => {
      const calls: { mergedData: unknown; mapPath: unknown }[] = [];
      // Configured statement by statement rather than in one chain: prop() and render() mutate
      // and return the same object, but their declared return type is the base component, which
      // would lose the anchored-shape properties choropleth requires of it.
      const shape = component<AnchoredShape<Datum>>();
      shape.prop("mergedData").prop("mapPath");
      shape.render(function (this: Element) {
        const props = (this as Element & { __props__: Record<string, unknown> }).__props__;
        calls.push({ mergedData: props.mergedData, mapPath: props.mapPath });
        this.appendChild(
          document.createElementNS("http://www.w3.org/2000/svg", "circle")
        ).classList.add("anchored-marker");
      });
      return { shape, calls };
    };

    test("renders the anchored shape and hands it the merged data and the map path", () => {
      const { shape, calls } = recordingShape();
      const node = render(fullData, (c) => c.anchoredShape(shape));
      expect(node.querySelectorAll("circle.anchored-marker")).toHaveLength(1);
      expect(calls).toHaveLength(1);
      expect(calls[0].mergedData).toHaveLength(3);
      expect(typeof calls[0].mapPath).toBe("function");
      expect((calls[0].mergedData as { datum: Datum | undefined }[]).map((d) => d.datum)).toEqual(
        fullData
      );
    });

    // The shape is drawn into a group of the component's own, so clearing the property removes
    // whatever it drew - which is the only way to clear markup this component knows nothing about.
    test("removes a previously rendered anchored shape when it is cleared", () => {
      const collection = geoJson();
      const target = layer("shape-toggle");
      const shape = component<AnchoredShape<Datum>>();
      shape.prop("mergedData").prop("mapPath");
      shape.render(function (this: Element) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add("anchored-marker");
        this.appendChild(circle);
      });
      const map = choropleth()
        .features(collection)
        .borders(mesh())
        .withLake(false)
        .width(190)
        .height(190);
      target.call(map.anchoredShape(shape));
      const node = target.call(map.anchoredShape(null)).node() as SVGGElement;
      expect(node.querySelectorAll("circle.anchored-marker")).toHaveLength(0);
    });

    test("renders nothing extra when no anchored shape is set", () => {
      const node = render(fullData);
      expect(node.querySelectorAll("circle.anchored-marker")).toHaveLength(0);
    });

    test("hands the anchored shape the same merged data the base layer drew", () => {
      const { shape, calls } = recordingShape();
      render([{ geoId: "a", value: 1 }], (c) => c.anchoredShape(shape));
      expect((calls[0].mergedData as { datum: Datum | undefined }[]).map((d) => d.datum)).toEqual([
        { geoId: "a", value: 1 },
        undefined,
        undefined,
      ]);
    });
  });

  describe("events", () => {
    const dispatchOn = (node: Element, type: string) =>
      node.dispatchEvent(new MouseEvent(type, { bubbles: true }));

    // The handlers are what the docs examples drive their tooltips from -
    // docs/map-standard/cml-quartier-years.js, docs/map-extended/quartiere-neubau.js and
    // docs/map-extended/topolayer-statquart-neubau.js all pass this argument to selectHovered.
    test("delivers the hovered entity's datum to an over handler", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) => c.on("over", (d: unknown) => seen.push(d)));
      dispatchOn(areas(node)[0], "mouseover");
      expect(seen).toEqual([fullData[0]]);
    });

    test("delivers the datum to out and click handlers too", () => {
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.on("out", (d: unknown) => seen.push(d)).on("click", (d: unknown) => seen.push(d))
      );
      dispatchOn(areas(node)[1], "mouseout");
      dispatchOn(areas(node)[1], "click");
      expect(seen).toEqual([fullData[1], fullData[1]]);
    });

    // An entity that matched no datum has none to deliver, so its handler is called with
    // undefined rather than with a stand-in.
    test("delivers undefined for an entity that matched no datum", () => {
      const seen: unknown[] = [];
      const node = render([{ geoId: "a", value: 1 }], (c) =>
        c.on("over", (d: unknown) => seen.push(d))
      );
      dispatchOn(areas(node)[1], "mouseover");
      expect(seen).toEqual([undefined]);
    });

    test("fires the handler once per event target hovered", () => {
      let overs = 0;
      const node = render(fullData, (c) => c.on("over", () => overs++));
      for (const area of areas(node)) dispatchOn(area, "mouseover");
      expect(overs).toBe(3);
    });

    test("returns the component from on() when registering, and the handler when reading", () => {
      const map = choropleth();
      const handler = () => undefined;
      expect(map.on("over", handler)).toBe(map);
      expect(map.on("over")).toBe(handler);
    });

    test("throws for an unknown event name, as d3's dispatch does", () => {
      expect(() => choropleth().on("hover", () => undefined)).toThrow();
    });

    // NOTE: an event target an anchored shape contributed carries no merged entry, so a handler
    // bound through this component is called with undefined for it. The shape's own dispatch is
    // where its data live.
    test("binds an anchored shape's own event targets, since it renders before the binding", () => {
      const marked = component<AnchoredShape<Datum>>();
      marked.prop("mergedData").prop("mapPath");
      marked.render(function (this: Element) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("data-event-target", "");
        circle.classList.add("shape-target");
        this.appendChild(circle);
      });
      const seen: unknown[] = [];
      const node = render(fullData, (c) =>
        c.anchoredShape(marked).on("click", (d: unknown) => seen.push(d))
      );
      dispatchOn(node.querySelector("circle.shape-target") as Element, "click");
      expect(seen).toEqual([undefined]);
    });
  });

  describe("known quirks", () => {
    // BUG: width and height have no defaults and are not validated. fitSize([undefined, undefined])
    // produces a projection whose scale is NaN, so every area is drawn with a path of NaN
    // coordinates - which the browser drops, leaving a blank map - rather than the component
    // reporting that it was not given a size.
    test("draws NaN paths when width and height are left out", () => {
      const collection = geoJson();
      const map = choropleth().features(collection).borders(mesh()).withLake(false);
      const node = layer().call(map).node() as SVGGElement;
      expect(areas(node)).toHaveLength(3);
      for (const d of attrs(node, "d")) expect(d).toContain("NaN");
    });

    // features is required and unguarded: prepareMergedGeoData reads geoJson.features.
    test("throws when features are missing", () => {
      expect(() => layer().call(choropleth().width(100).height(100))).toThrow();
    });

    // NOTE: withLake defaults to true, so a map with no lake data still gets the lake renderer,
    // which emits the pattern definition and two empty paths. Every non-Zurich map - switzerland
    // included - has to remember .withLake(false) or it carries them.
    test("renders empty lake paths when withLake is on but no lake data is given", () => {
      const collection = geoJson();
      const node = layer()
        .call(choropleth().features(collection).borders(mesh()).width(170).height(170))
        .node() as SVGGElement;
      expect(lake(node)[0].getAttribute("d")).toBeNull();
      expect(lakePaths(node)[0].getAttribute("d")).toBeNull();
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(root.querySelectorAll(`#lake-pattern-${lakeScope(node)}`)).toHaveLength(1);
    });

    // NOTE: the handlers are bound with selectAll("[data-event-target]"), which is scoped to the
    // rendered group but is otherwise indiscriminate: any descendant carrying the attribute is
    // bound, and the previous render's listeners are replaced rather than added to.
    test("rebinds the handlers on every render rather than accumulating them", () => {
      const collection = geoJson();
      const target = layer("rebind");
      let first = 0;
      let second = 0;
      const map = choropleth()
        .features(collection)
        .borders(mesh())
        .withLake(false)
        .width(220)
        .height(220);
      target.call(map.on("click", () => first++));
      const node = target.call(map.on("click", () => second++)).node() as SVGGElement;
      areas(node)[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(first).toBe(0);
      expect(second).toBe(1);
    });

    // Pins the component's full property surface, so the JSDoc header can be checked against it.
    // features is the one property whose absence throws; width and height have no default either,
    // but degrade to NaN paths rather than reporting anything.
    test("exposes every documented property", () => {
      const map = choropleth();
      for (const prop of [
        "width",
        "height",
        "keyName",
        "withLake",
        "anchoredShape",
        "features",
        "borders",
        "lakeFeatures",
        "lakeBorders",
        "lakeFadeOut",
        "defined",
        "fill",
        "transitionColor",
        "borderColor",
        "strokeWidth",
        "highlight",
        "highlightStroke",
        "highlightStrokeWidth",
        "lakePathColor",
        "on",
      ]) {
        expect(typeof Reflect.get(map, prop)).toBe("function");
      }
    });

    // NOTE: the lake renderer's own fadeOut property is not delegated - choropleth exposes it as
    // lakeFadeOut instead - so there is no `fadeOut` accessor on the map component.
    test("does not expose the lake renderer's fadeOut under its own name", () => {
      expect(Reflect.get(choropleth(), "fadeOut")).toBeUndefined();
    });

    // NOTE: the four renderers keep no state of their own - their props live on the element they
    // rendered into - so one component instance can draw into two layers. The event dispatch is
    // the exception: it is created once per choropleth() call and closed over, so both layers
    // share one set of handlers, which is what the rebinding test above shows.
    test("draws two layers from one component instance, but shares their handlers", () => {
      const collection = geoJson();
      const map = choropleth<Datum>()
        .features(collection)
        .borders(mesh())
        .withLake(false)
        .width(230)
        .height(230)
        .transitionColor(false)
        .fill((d?: Datum) => (d ? "#ff0000" : "#0000ff"));
      let clicks = 0;
      const one = layer("two-layers-one")
        .datum(fullData)
        .call(map.on("click", () => clicks++))
        .node() as SVGGElement;
      const two = layer("two-layers-two")
        .datum([{ geoId: "a", value: 1 }])
        .call(map)
        .node() as SVGGElement;
      // Each layer reflects its own data, and each textures its unmatched features under a
      // pattern id of its own.
      expect(attrs(one, "fill")).toEqual(["#ff0000", "#ff0000", "#ff0000"]);
      expect(attrs(two, "fill")[0]).toBe("#ff0000");
      expect(attrs(two, "fill")[1]).toMatch(missingPattern);
      expect(attrs(two, "fill")[2]).toMatch(missingPattern);
      // But both layers' areas are bound to the one dispatch.
      areas(one)[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      areas(two)[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(clicks).toBe(2);
    });

    // NOTE: every layer that can be switched off clears itself - the highlight through its own
    // renderer, the lake and the anchored shape through the groups the component draws them into.
    test("clears the highlight when it is emptied, as the lake and the anchored shape are", () => {
      const collection = geoJson();
      const target = layer("highlight-toggle");
      const map = choropleth()
        .features(collection)
        .borders(mesh())
        .withLake(false)
        .width(250)
        .height(250);
      target.datum(fullData).call(map.highlight([fullData[1]]));
      const node = target.datum(fullData).call(map.highlight([])).node() as SVGGElement;
      expect(highlights(node)).toHaveLength(0);
    });

    // The tooltip anchors the base renderer adds are, with the events broken, the only working way
    // to attach a tooltip to a choropleth entity - so they are worth pinning here as well as in
    // the base renderer's own tests.
    test("carries one tooltip anchor per feature", () => {
      const node = render(fullData);
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(3);
    });
  });
});
