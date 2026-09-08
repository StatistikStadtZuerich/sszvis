import { geoPath } from "d3";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererHighlight, {
  type MapRendererHighlightComponent,
} from "../../../src/map/renderer/highlight.js";

/**
 * A unit square. The ring is wound clockwise because d3-geo interprets rings on the sphere:
 * counter-clockwise would describe the whole globe minus the square.
 */
const square = (id: string | undefined, offset = 0): Feature<Polygon> => ({
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

interface Datum {
  geoId?: unknown;
  id?: unknown;
  value?: number;
}

describe("map/renderer/highlight", () => {
  let container: HTMLDivElement;
  let layerCount = 0;
  let pathKey = 0;
  const warnedSpies: { mockRestore: () => void }[] = [];

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    for (const spy of warnedSpies) spy.mockRestore();
    warnedSpies.length = 0;
  });

  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `highlight-${++layerCount}`,
    }).selectGroup("map");

  const collection = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2)],
  });

  const mapPathOf = () =>
    geoPath().projection(swissMapProjection(100, 100, collection(), `highlight-path-${++pathKey}`));

  const highlights = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__highlight"),
  ];

  /**
   * Captures the warnings a render emits, restoring console.warn afterwards. The renderer warns
   * through sszvis.logger, which delegates to console.warn - spying on the console rather than on
   * the logger keeps this pinned to what a consumer actually sees.
   */
  const captureWarnings = () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
    });
    warnedSpies.push(spy);
    return warnings;
  };

  /**
   * A mapPath that records what it is called with, so a test can tell "matched nothing" from
   * "matched something that happens to produce no geometry".
   */
  const seenFeatures = () => {
    const features: unknown[] = [];
    const path = mapPathOf();
    return {
      features,
      mapPath: (feature: unknown) => {
        features.push(feature);
        return feature === undefined ? null : path(feature as Parameters<typeof path>[0]);
      },
    };
  };

  /** Renders the highlight layer, returning the group node it drew into. */
  const render = (
    configure: (c: MapRendererHighlightComponent<Datum>) => MapRendererHighlightComponent<Datum> = (
      c
    ) => c,
    key?: string
  ) => {
    const component = configure(
      mapRendererHighlight<Datum>().geoJson(collection()).mapPath(mapPathOf())
    );
    return group(key).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("renders one classed path per highlighted datum", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }, { geoId: "b" }]));
      expect(highlights(node)).toHaveLength(2);
      expect(highlights(node)[0].tagName).toBe("path");
    });

    test("takes the path data from the mapPath generator, applied to the matched feature", () => {
      const features = collection();
      const mapPath = mapPathOf();
      const node = group()
        .call(
          mapRendererHighlight<Datum>()
            .geoJson(features)
            .mapPath(mapPath)
            .highlight([{ geoId: "b" }])
        )
        .node() as SVGGElement;
      expect(highlights(node)[0].getAttribute("d")).toBe(mapPath(features.features[1]));
    });

    test("matches a datum to a feature by the feature's id", () => {
      const features = collection();
      const mapPath = mapPathOf();
      const node = group()
        .call(
          mapRendererHighlight<Datum>()
            .geoJson(features)
            .mapPath(mapPath)
            .highlight([{ geoId: "a" }])
        )
        .node() as SVGGElement;
      expect(highlights(node)[0].getAttribute("d")).toBe(mapPath(features.features[0]));
    });

    test("reads the entity id under a custom keyName", () => {
      const node = render((c) => c.keyName("id").highlight([{ id: "a" }]));
      expect(highlights(node)).toHaveLength(1);
      expect(highlights(node)[0].hasAttribute("d")).toBe(true);
    });

    test("defaults keyName to geoId", () => {
      expect(mapRendererHighlight<Datum>().keyName()).toBe("geoId");
    });

    test("reuses the same path elements across renders", () => {
      const layer = group("highlight-reuse");
      const renderWith = () =>
        layer
          .call(
            mapRendererHighlight<Datum>()
              .geoJson(collection())
              .mapPath(mapPathOf())
              .highlight([{ geoId: "a" }])
          )
          .node() as SVGGElement;
      const first = highlights(renderWith())[0];
      expect(highlights(renderWith())[0]).toBe(first);
    });

    test("adds no tooltip anchors, event targets or missing-value pattern", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }]));
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
      expect(node.querySelectorAll("[data-event-target]")).toHaveLength(0);
      expect(root.querySelectorAll("#missing-pattern")).toHaveLength(0);
    });
  });

  describe("empty highlight", () => {
    test("renders nothing when highlight is left at its empty default", () => {
      const node = render();
      expect(highlights(node)).toHaveLength(0);
    });

    test("removes previously rendered highlights when the highlight array empties", () => {
      const layer = group("highlight-clear");
      layer.call(
        mapRendererHighlight<Datum>()
          .geoJson(collection())
          .mapPath(mapPathOf())
          .highlight([{ geoId: "a" }])
      );
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(1);
      layer.call(mapRendererHighlight<Datum>().geoJson(collection()).mapPath(mapPathOf()));
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(0);
    });

    // NOTE: the empty-highlight branch returns early, before geoJson or mapPath is touched, so
    // this is the one configuration in which the renderer tolerates having neither.
    test("needs neither geoJson nor mapPath when there is nothing to highlight", () => {
      expect(() => group().call(mapRendererHighlight<Datum>())).not.toThrow();
    });
  });

  describe("highlightStroke and highlightStrokeWidth", () => {
    test("defaults to a white stroke 2 wide", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }]));
      expect(highlights(node)[0].style.stroke).toBe("white");
      expect(highlights(node)[0].style.strokeWidth).toBe("2");
    });

    test("takes a constant stroke colour and width", () => {
      const node = render((c) =>
        c
          .highlight([{ geoId: "a" }])
          .highlightStroke("#ff0000")
          .highlightStrokeWidth(4)
      );
      expect(highlights(node)[0].style.stroke).toBe("rgb(255, 0, 0)");
      expect(highlights(node)[0].style.strokeWidth).toBe("4");
    });

    test("calls a highlightStroke accessor with the datum, not the feature", () => {
      const datum: Datum = { geoId: "a", value: 1 };
      const seen: unknown[] = [];
      const node = render((c) =>
        c.highlight([datum]).highlightStroke((d: Datum) => {
          seen.push(d);
          return "#00ff00";
        })
      );
      expect(seen).toEqual([datum]);
      expect(highlights(node)[0].style.stroke).toBe("rgb(0, 255, 0)");
    });

    test("calls a highlightStrokeWidth accessor with the datum too", () => {
      const datum: Datum = { geoId: "a", value: 3 };
      const seen: unknown[] = [];
      const node = render((c) =>
        c.highlight([datum]).highlightStrokeWidth((d: Datum) => {
          seen.push(d);
          return 5;
        })
      );
      expect(seen).toEqual([datum]);
      expect(highlights(node)[0].style.strokeWidth).toBe("5");
    });

    test("styles each highlighted entity independently", () => {
      const node = render((c) =>
        c
          .highlight([
            { geoId: "a", value: 1 },
            { geoId: "b", value: 2 },
          ])
          .highlightStroke((d: Datum) => (d.value === 1 ? "#ff0000" : "#0000ff"))
      );
      expect(highlights(node)[0].style.stroke).toBe("rgb(255, 0, 0)");
      expect(highlights(node)[1].style.stroke).toBe("rgb(0, 0, 255)");
    });

    // NOTE: unlike the mesh renderer, which hands its style props straight to d3, both props here
    // are wrapped in fn.functor and called by the component itself - so an accessor receives
    // exactly one argument, the datum, with no index and no node group. An accessor written for
    // d3 and expecting the node as `this` gets the component's internal props object instead,
    // because the call is written as a method access on props.
    test("calls the accessors with the datum only, and props as `this`", () => {
      const seen: unknown[][] = [];
      render((c) =>
        c.highlight([{ geoId: "a" }]).highlightStroke(function (this: unknown, ...args: unknown[]) {
          seen.push([...args, this]);
          return "#ff0000";
        })
      );
      expect(seen[0]).toHaveLength(2);
      expect(seen[0][0]).toEqual({ geoId: "a" });
      expect(seen[0][1]).toHaveProperty("keyName", "geoId");
    });

    // NOTE: an accessor returning null removes the style, so the highlight falls back to the SVG
    // initial stroke of `none` - an invisible highlight, no error. This is a realistic outcome
    // for a colour scale asked about a datum it has no entry for.
    test("silently removes the stroke when highlightStroke returns null", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }]).highlightStroke(() => null));
      expect(highlights(node)[0].style.stroke).toBe("");
      expect(highlights(node)[0].getAttribute("style") ?? "").not.toContain("stroke:");
    });

    // The same for the width: a null removes the style, leaving SVG's initial width of 1.
    test("silently removes the stroke width when highlightStrokeWidth returns null", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }]).highlightStrokeWidth(() => null));
      expect(highlights(node)[0].style.strokeWidth).toBe("");
    });

    // NOTE: both props are written as inline styles rather than attributes, as in the mesh
    // renderer. Nothing in sszvis.css sets stroke or stroke-width for .sszvis-map__highlight, so
    // nothing is being overridden - but a consumer cannot restyle a highlight from their own
    // stylesheet either, since an inline style beats any author rule short of !important.
    test("writes both as inline styles, not attributes", () => {
      const path = highlights(render((c) => c.highlight([{ geoId: "a" }])))[0];
      expect(path.hasAttribute("stroke")).toBe(false);
      expect(path.hasAttribute("stroke-width")).toBe(false);
      expect(path.getAttribute("style")).toContain("stroke");
    });
  });

  describe("entity matching", () => {
    // An id no feature answers to is dropped rather than drawn: it used to leave a classed, fully
    // styled path with no "d" behind, which is invisible and indistinguishable from a legitimately
    // off-screen entity.
    test("appends nothing for an id that matches no feature", () => {
      captureWarnings();
      const node = render((c) => c.highlight([{ geoId: "nope" }]));
      expect(highlights(node)).toHaveLength(0);
    });

    test("reports an unmatched id, naming the id and the keyName", () => {
      const warnings = captureWarnings();
      render((c) => c.highlight([{ geoId: "nope" }]));
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("nope");
      expect(warnings[0]).toContain("geoId");
    });

    // Reported once per render with every unmatched id, not once per entry, so a chart re-rendering
    // on every mouse move does not flood the console per datum.
    test("reports every unmatched id in a single warning per render", () => {
      const warnings = captureWarnings();
      render((c) => c.highlight([{ geoId: "nope" }, { geoId: "a" }, { geoId: "also-nope" }]));
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("nope");
      expect(warnings[0]).toContain("also-nope");
    });

    test("stays silent when every id matches", () => {
      const warnings = captureWarnings();
      render((c) => c.highlight([{ geoId: "a" }, { geoId: "b" }]));
      expect(warnings).toEqual([]);
    });

    // The matched entities still render; an unmatched neighbour does not take them down with it.
    test("still highlights the matched entities alongside an unmatched id", () => {
      captureWarnings();
      const features = collection();
      const mapPath = mapPathOf();
      const node = group()
        .call(
          mapRendererHighlight<Datum>()
            .geoJson(features)
            .mapPath(mapPath)
            .highlight([{ geoId: "nope" }, { geoId: "a" }])
        )
        .node() as SVGGElement;
      expect(highlights(node)).toHaveLength(1);
      expect(highlights(node)[0].getAttribute("d")).toBe(mapPath(features.features[0]));
    });

    // The lookup goes through a Map holding only the ids the geoJson actually supplies, so a
    // feature without an id is not addressable and a datum naming no entity matches nothing.
    // Previously every keyless feature collapsed onto the single key "undefined" and the last of
    // them was handed to a keyless datum.
    test("matches a keyless datum to no feature at all", () => {
      const features: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [square(undefined), square(undefined, 2)],
      };
      captureWarnings();
      const seen = seenFeatures();
      const node = group()
        .call(mapRendererHighlight<Datum>().geoJson(features).mapPath(seen.mapPath).highlight([{}]))
        .node() as SVGGElement;
      expect(highlights(node)).toHaveLength(0);
      expect(seen.features).toEqual([]);
    });

    // A Map holds no inherited keys, so an id naming an Object.prototype member is absent like any
    // other id the geoJson does not supply. A plain object literal handed the inherited function
    // to the path generator instead, which is observable in what mapPath is called with.
    test("treats an id naming an Object.prototype member as unmatched", () => {
      captureWarnings();
      const seen = seenFeatures();
      const node = render((c) => c.mapPath(seen.mapPath).highlight([{ geoId: "valueOf" }]));
      expect(highlights(node)).toHaveLength(0);
      expect(seen.features).toEqual([]);
    });

    // "__proto__" is the sharper case: assigning it on a plain object literal replaces that
    // object's prototype instead of creating an entry, which corrupts every later lookup.
    test("treats an id of __proto__ as unmatched without disturbing other lookups", () => {
      captureWarnings();
      const features = collection();
      const seen = seenFeatures();
      group().call(
        mapRendererHighlight<Datum>()
          .geoJson(features)
          .mapPath(seen.mapPath)
          .highlight([{ geoId: "__proto__" }, { geoId: "a" }, { geoId: "nope" }])
      );
      expect(seen.features).toEqual([features.features[0]]);
    });

    // NOTE: lookup keys are stringified on both sides, so a numeric feature id matches both a
    // numeric and a string datum key. Real SSZ geodata uses numeric ids, so this is load-bearing
    // rather than a curiosity, and must survive the Map-backed lookup.
    test("matches a numeric feature id against either a numeric or a string key", () => {
      const features: FeatureCollection<Polygon> = {
        type: "FeatureCollection",
        features: [{ ...square("1"), id: 1 }],
      };
      const mapPath = mapPathOf();
      const renderWith = (geoId: unknown) =>
        group()
          .call(
            mapRendererHighlight<Datum>().geoJson(features).mapPath(mapPath).highlight([{ geoId }])
          )
          .node() as SVGGElement;
      expect(highlights(renderWith(1))[0].getAttribute("d")).toBe(mapPath(features.features[0]));
      expect(highlights(renderWith("1"))[0].getAttribute("d")).toBe(mapPath(features.features[0]));
    });
  });

  describe("element identity", () => {
    // The join is keyed by map entity, so shrinking the highlight array leaves the surviving
    // entity on its own element instead of re-purposing the first slot by position.
    test("keeps the surviving entity on its own element when the array shrinks", () => {
      const layer = group("highlight-keyed-join");
      const renderWith = (highlight: Datum[]) =>
        layer
          .call(
            mapRendererHighlight<Datum>()
              .geoJson(collection())
              .mapPath(mapPathOf())
              .highlight(highlight)
          )
          .node() as SVGGElement;
      const before = highlights(renderWith([{ geoId: "a" }, { geoId: "b" }]));
      const after = highlights(renderWith([{ geoId: "b" }]));
      expect(after).toHaveLength(1);
      expect(after[0]).toBe(before[1]);
      expect(after[0].getAttribute("d")).toBe(before[1].getAttribute("d"));
    });

    // Reordering moves the existing elements rather than repainting them in place, which is what
    // makes per-entity transitions and enter/exit styling possible.
    test("moves the elements when the highlight array is reordered", () => {
      const layer = group("highlight-reorder");
      const renderWith = (highlight: Datum[]) =>
        layer
          .call(
            mapRendererHighlight<Datum>()
              .geoJson(collection())
              .mapPath(mapPathOf())
              .highlight(highlight)
          )
          .node() as SVGGElement;
      const before = highlights(renderWith([{ geoId: "a" }, { geoId: "b" }]));
      const after = highlights(renderWith([{ geoId: "b" }, { geoId: "a" }]));
      expect(after).toEqual([before[1], before[0]]);
    });

    // The join key carries an occurrence counter, so highlighting one entity twice still draws two
    // stacked paths rather than collapsing them onto one element.
    test("keeps one element per entry when an entity is highlighted twice", () => {
      const layer = group("highlight-duplicate-keyed");
      const renderWith = (highlight: Datum[]) =>
        layer
          .call(
            mapRendererHighlight<Datum>()
              .geoJson(collection())
              .mapPath(mapPathOf())
              .highlight(highlight)
          )
          .node() as SVGGElement;
      expect(highlights(renderWith([{ geoId: "a" }, { geoId: "a" }]))).toHaveLength(2);
      expect(highlights(renderWith([{ geoId: "a" }]))).toHaveLength(1);
    });

    // Each layer selects only the paths carrying its own key, so two highlight layers in one
    // group no longer fight over a single set of elements.
    test("lets two layers with different keys share one group", () => {
      const layer = group("two-highlights");
      layer.call(
        mapRendererHighlight<Datum>()
          .key("first")
          .geoJson(collection())
          .mapPath(mapPathOf())
          .highlight([{ geoId: "a" }])
          .highlightStroke("#ff0000")
      );
      const first = highlights(layer.node() as SVGGElement)[0];
      layer.call(
        mapRendererHighlight<Datum>()
          .key("second")
          .geoJson(collection())
          .mapPath(mapPathOf())
          .highlight([{ geoId: "b" }])
          .highlightStroke("#00ff00")
      );
      const after = highlights(layer.node() as SVGGElement);
      expect(after).toHaveLength(2);
      expect(after).toContain(first);
      expect(first.style.stroke).toBe("rgb(255, 0, 0)");
      expect(after.map((p) => p.style.stroke)).toContain("rgb(0, 255, 0)");
    });

    // An empty highlight clears only this layer's paths, leaving the other layer's alone.
    test("clears only its own layer when its highlight empties", () => {
      const layer = group("two-highlights-clear");
      const renderWith = (key: string, highlight: Datum[]) =>
        layer.call(
          mapRendererHighlight<Datum>()
            .key(key)
            .geoJson(collection())
            .mapPath(mapPathOf())
            .highlight(highlight)
        );
      renderWith("first", [{ geoId: "a" }]);
      renderWith("second", [{ geoId: "b" }]);
      renderWith("second", []);
      const after = highlights(layer.node() as SVGGElement);
      expect(after).toHaveLength(1);
      expect(after[0].getAttribute("data-highlight-key")).toBe("first");
    });

    // NOTE: two layers sharing the default key still share one set of paths - which is the
    // same mechanism that lets a consumer build a fresh component on every render and still get
    // its previous elements back. Scoping is opt-in per layer, not automatic: a second `.call()`
    // on one group is indistinguishable, from inside the render, from a re-render of the same
    // layer, so only an explicit key can tell them apart. See issue #216.
    test("still shares elements between two layers on the same key", () => {
      const layer = group("two-highlights-same-key");
      const renderWith = (geoId: string) =>
        layer.call(
          mapRendererHighlight<Datum>()
            .geoJson(collection())
            .mapPath(mapPathOf())
            .highlight([{ geoId }])
        );
      renderWith("a");
      const first = highlights(layer.node() as SVGGElement)[0];
      renderWith("b");
      const after = highlights(layer.node() as SVGGElement);
      expect(after).toHaveLength(1);
      expect(after[0]).not.toBe(first);
    });

    test("defaults key to highlight", () => {
      expect(mapRendererHighlight<Datum>().key()).toBe("highlight");
    });
  });

  describe("sibling order", () => {
    /** Renders `highlight` into `layer`, returning the layer's node. */
    const renderInto = (
      layer: ReturnType<typeof group>,
      highlight: Datum[],
      key?: string
    ): SVGGElement => {
      let component = mapRendererHighlight<Datum>()
        .geoJson(collection())
        .mapPath(mapPathOf())
        .highlight(highlight);
      if (key !== undefined) component = component.key(key);
      return layer.call(component).node() as SVGGElement;
    };

    /** A sibling drawn into the map group after the highlight, as choropleth's shape group is. */
    const appendSibling = (node: SVGGElement, id: string): Element => {
      const sibling = node.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      ) as Element;
      sibling.setAttribute("data-sibling", id);
      node.appendChild(sibling);
      return sibling;
    };

    const precedes = (first: Element, second: Element) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

    // The reported bug: clearing the highlight and re-hovering used to re-append the paths at the
    // end of the map group, over the anchored shape drawn while they were gone.
    test("keeps refilled paths beneath a sibling appended while they were gone", () => {
      const layer = group("highlight-refill-order");
      const node = renderInto(layer, [{ geoId: "a" }]);
      const sibling = appendSibling(node, "shape");
      renderInto(layer, []);
      renderInto(layer, [{ geoId: "a" }]);
      const after = highlights(node);
      expect(after).toHaveLength(1);
      expect(precedes(after[0], sibling)).toBe(true);
    });

    // The same shape without an empty render in between: a newly highlighted entity enters while
    // paths already exist, and must join them rather than land past the later siblings.
    test("keeps a newly highlighted entity beneath a later sibling", () => {
      const layer = group("highlight-grow-order");
      const node = renderInto(layer, [{ geoId: "a" }]);
      const sibling = appendSibling(node, "shape");
      renderInto(layer, [{ geoId: "a" }, { geoId: "b" }]);
      const after = highlights(node);
      expect(after).toHaveLength(2);
      for (const path of after) expect(precedes(path, sibling)).toBe(true);
    });

    // Each layer holds its own place, so a second keyed layer's paths are not dragged in front of
    // the first's when it refills.
    test("keeps two layers in the order they were first drawn", () => {
      const layer = group("highlight-two-layer-order");
      const node = renderInto(layer, [{ geoId: "a" }], "first");
      renderInto(layer, [{ geoId: "b" }], "second");
      const sibling = appendSibling(node, "shape");
      renderInto(layer, [], "first");
      renderInto(layer, [{ geoId: "a" }], "first");
      const after = highlights(node);
      expect(after.map((p) => p.getAttribute("data-highlight-key"))).toEqual(["first", "second"]);
      expect(precedes(after[1], sibling)).toBe(true);
    });

    // The remembered position is only a hint: if the sibling it pointed at is itself gone, the
    // render falls back to appending rather than failing.
    test("falls back to appending when the remembered sibling is gone", () => {
      const layer = group("highlight-stale-anchor");
      const node = renderInto(layer, [{ geoId: "a" }]);
      const sibling = appendSibling(node, "shape");
      renderInto(layer, []);
      sibling.remove();
      expect(() => renderInto(layer, [{ geoId: "a" }])).not.toThrow();
      expect(highlights(node)).toHaveLength(1);
    });
  });

  describe("known quirks", () => {
    // NOTE: falsy entries are dropped by the merge, so a sparse or partially-cleared highlight
    // array is tolerated. Note the asymmetry with the empty case: dropping every entry still
    // renders the join with zero data rather than taking the early return, which is unobservable
    // here but means geoJson and mapPath are read.
    test("silently drops falsy highlight entries", () => {
      const node = render((c) =>
        // null and undefined entries are a caller error; pinned because the component accepts
        // them rather than reporting them.
        c.highlight([null, { geoId: "a" }, undefined])
      );
      expect(highlights(node)).toHaveLength(1);
    });

    // The second, distinct way the layer clears: an array of only falsy entries merges to nothing
    // and the exit selection removes the paths. Unlike the empty-array early return, this path
    // still reads geoJson - it builds the lookup table before merging - but not mapPath, since the
    // join has no elements for the "d" callback to run on.
    test("clears previously rendered highlights when every entry is falsy", () => {
      const layer = group("highlight-all-falsy");
      const renderWith = (highlight: (Datum | null | undefined)[]) =>
        layer
          .call(
            mapRendererHighlight<Datum>()
              .geoJson(collection())
              .mapPath(mapPathOf())
              .highlight(highlight)
          )
          .node() as SVGGElement;
      expect(highlights(renderWith([{ geoId: "a" }]))).toHaveLength(1);
      expect(highlights(renderWith([null, undefined]))).toHaveLength(0);
    });

    // The boundary the test above cannot reach, because it always supplies mapPath: an all-falsy
    // array needs geoJson but never touches mapPath. Pinned so the documented contract does not
    // drift back to "needs both".
    test("clears an all-falsy highlight without a mapPath at all", () => {
      const layer = group("highlight-all-falsy-no-mappath");
      layer.call(
        mapRendererHighlight<Datum>()
          .geoJson(collection())
          .mapPath(mapPathOf())
          .highlight([{ geoId: "a" }])
      );
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(1);
      expect(() =>
        layer.call(mapRendererHighlight<Datum>().geoJson(collection()).highlight([null, undefined]))
      ).not.toThrow();
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(0);
    });

    // A string has a length, so it reaches the early return when empty and the reduce when not -
    // "" is the one non-array value that does not throw, and it clears the layer.
    test("treats an empty string highlight as nothing to highlight", () => {
      const layer = group("highlight-empty-string");
      layer.call(
        mapRendererHighlight<Datum>()
          .geoJson(collection())
          .mapPath(mapPathOf())
          .highlight([{ geoId: "a" }])
      );
      layer.call(
        mapRendererHighlight<Datum>()
          .geoJson(collection())
          .mapPath(mapPathOf())
          // @ts-expect-error - a string is a caller error; pinned because "" is accepted while
          // every other string throws.
          .highlight("")
      );
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(0);
    });

    // NOTE: nothing deduplicates the highlight array, so the same entity highlighted twice draws
    // two stacked paths. Harmless while the stroke is opaque; visible with a translucent one.
    test("draws one path per entry when an entity is highlighted twice", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }, { geoId: "a" }]));
      expect(highlights(node)).toHaveLength(2);
      expect(highlights(node)[0].getAttribute("d")).toBe(highlights(node)[1].getAttribute("d"));
    });

    // NOTE: the component sets neither fill nor pointer-events, so both come from sszvis.css. A
    // highlight rendered without that stylesheet is a filled black shape covering the entity,
    // and it swallows the base layer's hover and click events - which is worse here than for the
    // mesh, since a highlight is normally driven by exactly that hover.
    test("relies on the stylesheet for fill and pointer-events", () => {
      const path = highlights(render((c) => c.highlight([{ geoId: "a" }])))[0];
      expect(path.hasAttribute("fill")).toBe(false);
      expect(path.style.fill).toBe("");
      expect(path.style.pointerEvents).toBe("");
    });

    // NOTE: no transition is scheduled, so a highlight appears and disappears instantly. Pinned
    // so the port cannot introduce one.
    test("schedules no transition at all", () => {
      const node = render((c) => c.highlight([{ geoId: "a" }]));
      expect(
        (highlights(node)[0] as Element & { __transition?: unknown }).__transition
      ).toBeUndefined();
    });

    // NOTE: neither required property is validated, so omitting either throws a bare TypeError
    // from inside the component once there is something to highlight, rather than reporting
    // which property is missing. Unlike the mesh renderer, which silently draws an empty path,
    // both omissions here at least fail loudly - but they fail at different points, with
    // different debris left behind.
    test("throws when geoJson is missing but something is highlighted", () => {
      expect(() =>
        group().call(
          mapRendererHighlight<Datum>()
            .mapPath(mapPathOf())
            .highlight([{ geoId: "a" }])
        )
      ).toThrow(TypeError);
    });

    // A missing geoJson throws while building the lookup table, before the join runs, so nothing
    // is appended.
    test("appends nothing when geoJson is missing", () => {
      const layer = group("highlight-no-geojson");
      expect(() =>
        layer.call(
          mapRendererHighlight<Datum>()
            .mapPath(mapPathOf())
            .highlight([{ geoId: "a" }])
        )
      ).toThrow(TypeError);
      expect(highlights(layer.node() as SVGGElement)).toHaveLength(0);
    });

    // A missing mapPath throws later, from inside the "d" callback - after the join has already
    // appended the element - so the throw leaves a classed path with no geometry behind. The two
    // .style() calls come after .attr("d") in the chain and are never reached, so the debris has
    // no inline stroke either.
    test("leaves a half-built path behind when mapPath is missing", () => {
      const layer = group("highlight-no-mappath");
      expect(() =>
        layer.call(
          mapRendererHighlight<Datum>()
            .geoJson(collection())
            .highlight([{ geoId: "a" }])
        )
      ).toThrow(TypeError);
      const paths = highlights(layer.node() as SVGGElement);
      expect(paths).toHaveLength(1);
      expect(paths[0].hasAttribute("d")).toBe(false);
      expect(paths[0].style.stroke).toBe("");
      expect(paths[0].style.strokeWidth).toBe("");
    });

    // NOTE: geoJson.features is read unguarded, so a geoJson which is not a feature collection -
    // a bare Feature, or the single-polyline mesh its sibling renderer takes - throws rather than
    // being reported. The two renderers are documented as a pair but do not accept the same shape.
    test("throws for a geoJson that is not a feature collection", () => {
      expect(() =>
        group().call(
          mapRendererHighlight<Datum>()
            // @ts-expect-error - a bare Feature is a caller error; pinned because it throws from
            // inside the component rather than being reported.
            .geoJson(square("a"))
            .mapPath(mapPathOf())
            .highlight([{ geoId: "a" }])
        )
      ).toThrow(TypeError);
    });

    // NOTE: highlight is read as `.length === 0`, so a non-array with no length - a single datum
    // passed by mistake, say - skips the early return and then throws on .reduce. A string,
    // however, has a length and reduces to nothing, so "" clears the layer and "ab" throws.
    test("throws when highlight is not an array", () => {
      // a bare datum is a caller error; pinned because the failure is a bare TypeError from
      // inside the component rather than a reported one.
      // @ts-expect-error - a bare datum is a caller error
      expect(() => render((c) => c.highlight({ geoId: "a" }))).toThrow(TypeError);
      // A non-empty string gets past the length check and then has no .reduce.
      // @ts-expect-error - a string is a caller error
      expect(() => render((c) => c.highlight("ab"))).toThrow(TypeError);
    });

    // NOTE: a falsy keyName is used as given, unlike prepareMergedGeoData in mapUtils, which
    // falls back to GEO_KEY_DEFAULT. Here an empty keyName reads datum[""], which is undefined,
    // so nothing matches - now reported rather than silently drawn as an empty path.
    test("uses an empty keyName as given rather than falling back to geoId", () => {
      const warnings = captureWarnings();
      const node = render((c) => c.keyName("").highlight([{ geoId: "a" }]));
      expect(highlights(node)).toHaveLength(0);
      expect(warnings).toHaveLength(1);
    });

    // NOTE: the render callback returns early with `true` in the empty case and undefined
    // otherwise. Nothing consumes either value - d3's selection.each ignores the return - so the
    // `true` is decorative.
    test("returns nothing observable from the render callback", () => {
      expect(group().call(mapRendererHighlight<Datum>().highlight([]))).toBeDefined();
    });
  });
});
