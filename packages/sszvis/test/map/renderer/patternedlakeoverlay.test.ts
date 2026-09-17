import { geoPath } from "d3";
import type { Feature, FeatureCollection, MultiLineString, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resolvedColor } from "../../support/domValues.js";
import {
  describesKeyScopedElements,
  describesNoScheduledTransition,
} from "../../support/mapRendererConformance.js";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererPatternedLakeOverlay from "../../../src/map/renderer/patternedlakeoverlay.js";

/**
 * A unit square standing in for the lake outline. The ring is wound clockwise because d3-geo
 * interprets rings on the sphere: counter-clockwise would describe the whole globe minus the square.
 */
const lake = (offset = 0): Feature<Polygon> => ({
  type: "Feature",
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

/** The entity borders that lie over the lake, as one polyline - the shape choropleth passes. */
const bounds = (): Feature<MultiLineString> => ({
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
        [1, 1],
        [1, 0],
      ],
    ],
  },
});

describe("map/renderer/patternedlakeoverlay", () => {
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
      key: key ?? `lake-${++layerKey}`,
    }).selectGroup("map");

  const collection = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [lake()],
  });

  const mapPathOf = () =>
    geoPath().projection(swissMapProjection(100, 100, collection(), `lake-path-${++pathKey}`));

  const lakeShape = (node: Element) =>
    node.querySelector<SVGPathElement>("path.sszvis-map__lakezurich");
  const lakeBorder = (node: Element) =>
    node.querySelector<SVGPathElement>("path.sszvis-map__lakepath");
  const defs = (node: Element, selector: string) => [...node.querySelectorAll(selector)];
  /** The id a definition was actually given: the ids are scoped per overlay, not fixed. */
  const idOf = (node: Element, selector: string) =>
    node.querySelector(selector)?.getAttribute("id");

  /** Renders the overlay, returning the group node it drew into. */
  const render = (
    configure: (
      c: ReturnType<typeof mapRendererPatternedLakeOverlay>,
    ) => ReturnType<typeof mapRendererPatternedLakeOverlay> = (c) => c,
    key?: string,
  ) => {
    const component = configure(
      mapRendererPatternedLakeOverlay()
        .mapPath(mapPathOf())
        .lakeFeature(lake())
        .lakeBounds(bounds()),
    );
    return group(key).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("should render one lake shape and one border path when lake data is given", () => {
      const node = render();
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(1);
    });

    test("should take both path data strings from the mapPath generator when rendering", () => {
      const lakeFeature = lake();
      const lakeBounds = bounds();
      const mapPath = mapPathOf();
      const node = group()
        .call(
          mapRendererPatternedLakeOverlay()
            .mapPath(mapPath)
            .lakeFeature(lakeFeature)
            .lakeBounds(lakeBounds),
        )
        .node() as SVGGElement;
      expect(lakeShape(node)?.getAttribute("d")).toBe(mapPath(lakeFeature));
      expect(lakeBorder(node)?.getAttribute("d")).toBe(mapPath(lakeBounds));
    });

    test("should fill the lake shape with the generated lake pattern when rendering", () => {
      const node = render();
      expect(lakeShape(node)?.getAttribute("fill")).toBe(`url(#${idOf(node, "defs > pattern")})`);
    });

    test("should define the lake pattern in a defs element inside the layer when rendering", () => {
      const node = render();
      expect(defs(node, "defs > pattern")).toHaveLength(1);
      // The pattern helper fills it in; the tile is a white rect plus hatch lines.
      expect(defs(node, "defs > pattern > rect")).toHaveLength(1);
      expect(defs(node, "defs > pattern > line")).toHaveLength(2);
    });

    // NOTE: the defs element is created inside the map group rather than at the svg root - so this
    // component shares one defs with the base renderer's #missing-pattern when both draw into the
    // same group.
    test("puts the defs inside the map group, not at the svg root", () => {
      const node = render();
      const defsElement = node.querySelector("defs");
      expect(defsElement?.parentElement).toBe(node);
      expect(node.ownerSVGElement?.querySelectorAll(":scope > defs")).toHaveLength(0);
    });

    test("should reuse the same paths and defs elements when re-rendered into the same group", () => {
      const layer = group("lake-reuse");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      const first = lakeShape(renderWith());
      const firstPattern = defs(renderWith(), "defs > pattern")[0];
      const node = renderWith();
      expect(lakeShape(node)).toBe(first);
      expect(defs(node, "defs > pattern")).toHaveLength(1);
      expect(defs(node, "defs > pattern")[0]).toBe(firstPattern);
    });

    test("should add no tooltip anchors and no event targets when rendering", () => {
      const node = render();
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
      expect(node.querySelectorAll("[data-event-target]")).toHaveLength(0);
    });
  });

  describe("fadeOut", () => {
    test("should default fadeOut to true and mask the lake with the fade gradient", () => {
      expect(mapRendererPatternedLakeOverlay().fadeOut()).toBe(true);
      const node = render();
      expect(defs(node, "defs > linearGradient")).toHaveLength(1);
      expect(defs(node, "defs > mask")).toHaveLength(1);
      expect(lakeShape(node)?.getAttribute("mask")).toBe(`url(#${idOf(node, "defs > mask")})`);
    });

    test("should emit neither the gradient nor the mask when fadeOut is false", () => {
      const node = render((c) => c.fadeOut(false));
      expect(defs(node, "defs > linearGradient")).toHaveLength(0);
      expect(defs(node, "defs > mask")).toHaveLength(0);
      expect(lakeShape(node)?.hasAttribute("mask")).toBe(false);
    });

    test("should remove the fade when fadeOut is turned off after being on", () => {
      const layer = group("lake-toggle-fade");
      const renderWith = (fadeOut: boolean) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .fadeOut(fadeOut),
          )
          .node() as SVGGElement;
      renderWith(true);
      const node = renderWith(false);
      expect(lakeShape(node)?.hasAttribute("mask")).toBe(false);
      expect(defs(node, "defs > mask")).toHaveLength(0);
      expect(defs(node, "defs > linearGradient")).toHaveLength(0);
    });

    test("should re-apply the fade when fadeOut is turned back on", () => {
      const layer = group("lake-retoggle-fade");
      const renderWith = (fadeOut: boolean) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .fadeOut(fadeOut),
          )
          .node() as SVGGElement;
      renderWith(true);
      renderWith(false);
      const node = renderWith(true);
      expect(defs(node, "defs > mask > rect")).toHaveLength(1);
      expect(defs(node, "defs > linearGradient > stop")).toHaveLength(2);
      expect(lakeShape(node)?.getAttribute("mask")).toBe(`url(#${idOf(node, "defs > mask")})`);
    });

    // The mask fills itself with the fade gradient, and both helpers hard-code the old fixed
    // gradient id - so the component must point the mask at whatever id the gradient was given.
    test("should point the mask at the gradient's own generated id when the fade is drawn", () => {
      const node = render();
      const gradientId = idOf(node, "defs > linearGradient");
      expect(gradientId).toBeTruthy();
      expect(defs(node, "defs > mask > rect")[0]?.getAttribute("fill")).toBe(`url(#${gradientId})`);
    });
  });

  describe("lakePathColor", () => {
    test("should leave the border stroke to the stylesheet when no lakePathColor is set", () => {
      const node = render();
      expect(lakeBorder(node)?.hasAttribute("style")).toBe(false);
      expect(lakeBorder(node)?.style.stroke).toBe("");
    });

    test("should set the border stroke inline when lakePathColor is a constant colour", () => {
      const node = render((c) => c.lakePathColor("#7C7C7C"));
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(124, 124, 124)");
    });

    test("should clear the border stroke when lakePathColor is set to a falsy colour", () => {
      const layer = group("lake-falsy-colour");
      const renderWith = (lakePathColor: string) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .lakePathColor(lakePathColor),
          )
          .node() as SVGGElement;
      renderWith("#ff0000");
      const node = renderWith("");
      expect(lakeBorder(node)?.style.stroke).toBe("");
    });

    test("should clear the border stroke when a lakePathColor accessor returns undefined", () => {
      const layer = group("lake-undefined-colour");
      const renderWith = (colour: string | undefined) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .lakePathColor(() => colour ?? null),
          )
          .node() as SVGGElement;
      renderWith("#ff0000");
      const node = renderWith(undefined);
      expect(lakeBorder(node)?.style.stroke).toBe("");
    });

    // NOTE: lakePathColor is not wrapped in fn.functor, like the mesh renderer's borderColor and
    // unlike the colour props of base, geojson and highlight. A function is handed straight to
    // d3, so it is called with the lakeBounds object itself and d3's index - there is no
    // per-border datum, since there is only one path.
    test("calls a colour function with the lakeBounds object and the index", () => {
      const lakeBounds = bounds();
      const seen: unknown[][] = [];
      const node = group()
        .call(
          mapRendererPatternedLakeOverlay()
            .mapPath(mapPathOf())
            .lakeFeature(lake())
            .lakeBounds(lakeBounds)
            .lakePathColor((...args: unknown[]) => {
              seen.push(args);
              return "#00ff00";
            }),
        )
        .node() as SVGGElement;
      expect(seen).toHaveLength(1);
      expect(seen[0][0]).toBe(lakeBounds);
      expect(seen[0][1]).toBe(0);
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(0, 255, 0)");
    });
  });

  describe("scoping", () => {
    test("should give each layer its own definition ids when two overlays render on one page", () => {
      const one = render(undefined, "lake-page-one");
      const two = render(undefined, "lake-page-two");
      const ids = (node: Element) => [
        idOf(node, "defs > pattern"),
        idOf(node, "defs > linearGradient"),
        idOf(node, "defs > mask"),
      ];
      expect(ids(one).every((id) => typeof id === "string" && id.length > 0)).toBe(true);
      expect(ids(one)).not.toEqual(ids(two));
      expect(new Set([...ids(one), ...ids(two)]).size).toBe(6);
    });

    test("should point each layer's lake at its own pattern and mask when two overlays render on one page", () => {
      const one = render(undefined, "lake-refs-one");
      const two = render(undefined, "lake-refs-two");
      for (const node of [one, two]) {
        expect(lakeShape(node)?.getAttribute("fill")).toBe(`url(#${idOf(node, "defs > pattern")})`);
        expect(lakeShape(node)?.getAttribute("mask")).toBe(`url(#${idOf(node, "defs > mask")})`);
      }
    });

    test("should keep one scope per group, adding no definitions when re-rendered", () => {
      const layer = group("lake-scope-stable");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      const firstId = idOf(renderWith(), "defs > pattern");
      const node = renderWith();
      expect(defs(node, "defs > pattern")).toHaveLength(1);
      expect(idOf(node, "defs > pattern")).toBe(firstId);
    });

    // The key decides which paths a second overlay in the same group takes over. The shared
    // cases cover the path identity; the definitions each key owns are this renderer's own
    // concern and stay below.
    describesKeyScopedElements({
      render: ({ group: groupKey, key, variant }) => {
        const component = mapRendererPatternedLakeOverlay()
          .mapPath(mapPathOf())
          .lakeFeature(lake())
          .lakeBounds(bounds())
          .lakePathColor(variant);
        const layer = group(groupKey);
        layer.call(key === undefined ? component : component.key(key));
        return layer.node() as SVGGElement;
      },
      marks: (node) => defs(node, "path.sszvis-map__lakepath"),
      variantOf: (mark) => resolvedColor((mark as SVGPathElement).style.stroke),
      variants: ["#ff0000", "#00ff00"],
    });

    // Unlike the other keyed renderers, each overlay also emits a pattern, gradient and mask of
    // its own, and its lake shape has to reference the ones belonging to its own key (issue #258).
    test("should give each keyed overlay its own definitions when two share a group", () => {
      const layer = group("two-overlays");
      const renderWith = (key: string, lakeFeature: ReturnType<typeof lake>) =>
        layer.call(
          mapRendererPatternedLakeOverlay()
            .key(key)
            .mapPath(mapPathOf())
            .lakeFeature(lakeFeature)
            .lakeBounds(bounds()),
        );
      renderWith("a", lake());
      renderWith("b", lake(2));
      const node = layer.node() as SVGGElement;
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(2);
      expect(defs(node, "defs > pattern")).toHaveLength(2);
      expect(idOf(node, 'defs > pattern[id$="a"]')).toBe("lake-pattern-a");
      expect(
        defs(node, 'path.sszvis-map__lakezurich[data-lake-key="b"]')[0]?.getAttribute("fill"),
      ).toBe("url(#lake-pattern-b)");
    });

    // The path selectors are scoped to the rendering group's own children, so an overlay drawn
    // into a nested group is left alone even when it happens to carry the same key: two groups
    // are two overlays, whatever they are called.
    test("should leave an overlay in a nested group alone when an outer overlay shares its key", () => {
      const outer = group("nested-parent");
      const inner = outer.append("g");
      const renderWith = (target: typeof outer) =>
        target.call(
          mapRendererPatternedLakeOverlay()
            .key("shared")
            .mapPath(mapPathOf())
            .lakeFeature(lake())
            .lakeBounds(bounds()),
        );
      renderWith(inner);
      renderWith(outer);
      const node = outer.node() as SVGGElement;
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(2);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(2);
      expect(defs(node, ":scope > path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(
        defs(inner.node() as SVGGElement, ":scope > path.sszvis-map__lakezurich"),
      ).toHaveLength(1);
    });

    // The pattern helpers data-join their contents, so a map re-rendering on resize updates its
    // definitions in place rather than growing its defs subtree without bound.
    test("should leave the pattern, gradient and mask contents unchanged when re-rendered", () => {
      const layer = group("lake-defs-growth");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      renderWith();
      renderWith();
      const node = renderWith();
      expect(defs(node, "defs > pattern > rect")).toHaveLength(1);
      expect(defs(node, "defs > pattern > line")).toHaveLength(2);
      expect(defs(node, "defs > linearGradient > stop")).toHaveLength(2);
      expect(defs(node, "defs > mask > rect")).toHaveLength(1);
    });
  });

  describe("no lake to draw", () => {
    test("should draw nothing when no lake feature is given", () => {
      const node = group()
        .call(mapRendererPatternedLakeOverlay().mapPath(mapPathOf()))
        .node() as SVGGElement;
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(0);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(0);
      expect(defs(node, "defs > pattern")).toHaveLength(0);
      expect(defs(node, "defs > linearGradient")).toHaveLength(0);
      expect(defs(node, "defs > mask")).toHaveLength(0);
    });

    // The renderer clears its own output, the way the highlight renderer does for an empty
    // highlight, so a caller can ask it for "no lake" instead of wrapping it in a group to empty.
    test("should remove the lake it drew earlier when the lake feature goes away", () => {
      const layer = group("lake-cleared");
      const renderWith = (lakeFeature: ReturnType<typeof lake> | null) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lakeFeature)
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      const drawn = renderWith(lake());
      const patternId = idOf(drawn, "defs > pattern");
      expect(patternId).toBeTruthy();
      const node = renderWith(null);
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(0);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(0);
      expect(node.querySelectorAll(`#${patternId}`)).toHaveLength(0);
    });

    test("should remove the fade definitions along with the lake when the feature goes away", () => {
      const layer = group("lake-cleared-fade");
      const renderWith = (lakeFeature: ReturnType<typeof lake> | null) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lakeFeature)
              .lakeBounds(bounds())
              .fadeOut(true),
          )
          .node() as SVGGElement;
      renderWith(lake());
      const node = renderWith(null);
      expect(defs(node, "defs > linearGradient")).toHaveLength(0);
      expect(defs(node, "defs > mask")).toHaveLength(0);
    });

    // Definitions are owned exactly like paths: an inner overlay keeps the pattern and mask its
    // own paths reference even when an outer overlay renders with the same key and then clears.
    test("should leave a nested overlay's definitions in place when an outer overlay clears", () => {
      const outer = group("nested-clear");
      const inner = outer.append("g");
      const renderWith = (target: typeof outer, lakeFeature: ReturnType<typeof lake> | null) =>
        target.call(
          mapRendererPatternedLakeOverlay()
            .key("shared")
            .mapPath(mapPathOf())
            .lakeFeature(lakeFeature)
            .lakeBounds(bounds())
            .fadeOut(true),
        );
      renderWith(inner, lake());
      renderWith(outer, lake());

      const innerNode = inner.node() as SVGGElement;
      const innerPattern = innerNode.querySelector(":scope > defs > pattern");
      const innerFill = lakeShape(innerNode)?.getAttribute("fill");
      expect(innerPattern).not.toBeNull();
      expect(innerFill).toBe(`url(#${innerPattern?.getAttribute("id")})`);

      renderWith(outer, null);

      expect(defs(innerNode, ":scope > path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(innerNode.querySelector(":scope > defs > pattern")).toBe(innerPattern);
      expect(defs(innerNode, ":scope > defs > mask")).toHaveLength(1);
    });

    // Definitions are created into the group's own defs element and removed from the same place,
    // so the two scopes agree even when an inner overlay rendered first: with a descendant lookup
    // on either side the outer overlay's definitions would be written into - or left behind in -
    // the inner group's defs. Distinct keys are what makes that visible; with one shared key the
    // ids collide and the leak reads as the inner overlay's own definitions.
    test("should remove its own definitions when clearing after an inner overlay rendered first", () => {
      const outer = group("nested-distinct-clear");
      const inner = outer.append("g");
      const renderWith = (
        target: typeof outer,
        key: string,
        lakeFeature: ReturnType<typeof lake> | null,
      ) =>
        target.call(
          mapRendererPatternedLakeOverlay()
            .key(key)
            .mapPath(mapPathOf())
            .lakeFeature(lakeFeature)
            .lakeBounds(bounds())
            .fadeOut(true),
        );
      renderWith(inner, "inner", lake());
      renderWith(outer, "outer", lake());

      const node = outer.node() as SVGGElement;
      const outerIds = ["lake-pattern-outer", "lake-fade-gradient-outer", "lake-fade-mask-outer"];
      // The outer definitions belong to the outer group's own defs, not to the inner group's.
      expect(defs(node, ":scope > defs > [id]").map((n) => n.getAttribute("id"))).toEqual(outerIds);

      renderWith(outer, "outer", null);

      // Nowhere in the subtree, so a leak into the inner defs would be caught too.
      expect(outerIds.filter((id) => defs(node, `[id="${id}"]`).length > 0)).toEqual([]);
      expect(
        defs(inner.node() as SVGGElement, ":scope > defs > [id]").map((n) => n.getAttribute("id")),
      ).toEqual(["lake-pattern-inner", "lake-fade-gradient-inner", "lake-fade-mask-inner"]);
    });

    test("should draw the lake again when the feature comes back", () => {
      const layer = group("lake-restored");
      const renderWith = (lakeFeature: ReturnType<typeof lake> | null) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lakeFeature)
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      renderWith(lake());
      renderWith(null);
      const node = renderWith(lake());
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(1);
      expect(lakeShape(node)?.getAttribute("fill")).toBe(`url(#${idOf(node, "defs > pattern")})`);
    });

    // The removal is scoped by key like the paths: clearing one overlay must not take a sibling
    // overlay's paths or its definitions with it.
    test("should leave a sibling overlay's paths and definitions in place when another overlay clears", () => {
      const layer = group("lake-cleared-sibling");
      const renderWith = (key: string, lakeFeature: ReturnType<typeof lake> | null) =>
        layer.call(
          mapRendererPatternedLakeOverlay()
            .key(key)
            .mapPath(mapPathOf())
            .lakeFeature(lakeFeature)
            .lakeBounds(bounds()),
        );
      renderWith("keeper", lake());
      renderWith("goner", lake(2));
      renderWith("goner", null);
      const node = layer.node() as SVGGElement;
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(lakeShape(node)?.getAttribute("data-lake-key")).toBe("keeper");
      expect(defs(node, "defs > pattern").map((p) => p.getAttribute("id"))).toEqual([
        "lake-pattern-keeper",
      ]);
    });
  });

  describe("known quirks", () => {
    // BUG: lakeBounds is not validated, and its omission is not reported. The join is
    // `[props.lakeBounds]`, so exactly one datum is always bound - undefined included - and
    // geoPath(undefined) returns null, which d3 turns into a removed attribute. The result is a
    // classed border path with no geometry. The same root defect as the mesh renderer's.
    test("renders a styled but empty border path when lakeBounds is missing", () => {
      const node = group()
        .call(mapRendererPatternedLakeOverlay().mapPath(mapPathOf()).lakeFeature(lake()))
        .node() as SVGGElement;
      expect(lakeShape(node)?.hasAttribute("d")).toBe(true);
      expect(lakeBorder(node)?.hasAttribute("d")).toBe(false);
    });

    // The same root defect by a different d3 mechanism: an attribute set to undefined is removed
    // without anything being called.
    test("should render styled but empty paths when mapPath is missing", () => {
      const node = group()
        .call(mapRendererPatternedLakeOverlay().lakeFeature(lake()).lakeBounds(bounds()))
        .node() as SVGGElement;
      expect(lakeShape(node)?.hasAttribute("d")).toBe(false);
      expect(lakeBorder(node)?.hasAttribute("d")).toBe(false);
    });

    // NOTE: the component sets no pointer-events on either path, so both come from sszvis.css.
    // Rendered without that stylesheet the border path is filled black - SVG's initial fill -
    // covering the lake, and both paths swallow the base layer's hover and click events.
    test("relies on the stylesheet for fill and pointer-events", () => {
      const node = render();
      expect(lakeBorder(node)?.hasAttribute("fill")).toBe(false);
      expect(lakeShape(node)?.style.pointerEvents).toBe("");
      expect(lakeBorder(node)?.style.pointerEvents).toBe("");
    });

    // NOTE: the colour is written as an inline style rather than an attribute, as in the mesh
    // renderer. sszvis.css does set a stroke for .sszvis-map__lakepath, so this does override the
    // stylesheet - and a consumer cannot override it back from their own stylesheet, since an
    // inline style beats any author rule short of !important.
    test("writes the border colour as an inline style, not an attribute", () => {
      const node = render((c) => c.lakePathColor("#7C7C7C"));
      expect(lakeBorder(node)?.hasAttribute("stroke")).toBe(false);
      expect(lakeBorder(node)?.getAttribute("style")).toContain("stroke");
    });

    // NOTE: choropleth defaults lakeFadeOut to false, so the branch this component defaults to is
    // the one no in-repo chart takes. The fade is opt-in in practice, which is worth knowing
    // before treating the default as load-bearing.
    test("defaults to the branch choropleth does not use", () => {
      expect(mapRendererPatternedLakeOverlay().fadeOut()).toBe(true);
    });

    // NOTE: two unkeyed overlays in one group still share one scope, so the second rebinds the
    // first one's paths. Distinct keys are what separates them - see "scoping" above.
    // The key is stamped on the paths and also interpolated into the three definition ids, which
    // are matched back by id and referenced as url(#id) - so it is validated at the prop boundary
    // rather than reaching a selector it cannot be spelled in. See #258.
    const renderKeyed = (groupName: string, key: string) => {
      const layer = group(groupName);
      return () =>
        layer.call(
          mapRendererPatternedLakeOverlay()
            .key(key)
            .mapPath(mapPathOf())
            .lakeFeature(lake())
            .lakeBounds(bounds()),
        );
    };

    // A quote cannot be spelled in a url(#...) fragment, so the definitions would be written but
    // never referenced - silent at render time. This names the property and the cause instead.
    test("should throw naming the key property when the key cannot be spelled in an id", () => {
      expect(renderKeyed("quoted-key", 'a"b')).toThrow(
        /\[mapRendererPatternedLakeOverlay\] the key property/,
      );
    });

    // A space was the worse case: "#lake-pattern-a b" is a valid selector that simply matches
    // nothing, so every render appended another definition and the url(#...) reference was inert.
    test("should throw naming the key property when the key contains a space", () => {
      expect(renderKeyed("spaced-key", "a b")).toThrow(
        /\[mapRendererPatternedLakeOverlay\] the key property/,
      );
    });

    // Generated scopes are bare decimals, so requiring a leading letter is what keeps an explicit
    // key from ever landing on the scope an unkeyed overlay would generate.
    test("should throw naming the key property when the key would collide with a generated scope", () => {
      expect(renderKeyed("numeric-key", "1")).toThrow(
        /\[mapRendererPatternedLakeOverlay\] the key property/,
      );
    });

    // The path data is reapplied on every render rather than only on enter, so a lakeFeature
    // mutated in place still repaints even though the bound datum is identical.
    test("should repaint the lake when the lakeFeature was mutated in place", () => {
      const lakeFeature = lake();
      const mapPath = mapPathOf();
      const layer = group("lake-mutated");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPath)
              .lakeFeature(lakeFeature)
              .lakeBounds(bounds()),
          )
          .node() as SVGGElement;
      const before = lakeShape(renderWith())?.getAttribute("d");
      lakeFeature.geometry.coordinates = [
        [
          [4, 4],
          [4, 5],
          [5, 5],
          [4, 4],
        ],
      ];
      expect(lakeShape(renderWith())?.getAttribute("d")).not.toBe(before);
    });

    // NOTE: mapPath is handed to d3 as the attribute callback, so it is invoked as
    // mapPath(datum, index, group). d3-geo forwards the extra arguments to its own accessors,
    // which is harmless, but a caller-supplied generator does receive them.
    test("calls mapPath with d3's index and group as extra arguments", () => {
      const lakeFeature = lake();
      const seen: unknown[][] = [];
      const node = group()
        .call(
          mapRendererPatternedLakeOverlay()
            .mapPath((...args: unknown[]) => {
              seen.push(args);
              return "M0,0L1,1";
            })
            .lakeFeature(lakeFeature)
            .lakeBounds(bounds()),
        )
        .node() as SVGGElement;
      expect(seen[0][0]).toBe(lakeFeature);
      expect(seen[0][1]).toBe(0);
      expect(seen[0]).toHaveLength(3);
      expect(lakeShape(node)?.getAttribute("d")).toBe("M0,0L1,1");
    });

    // Free of the transition quirks its siblings share: no transition is scheduled, so the lake
    // appears instantly. Pinned so the port cannot introduce one.
    describesNoScheduledTransition(() => lakeShape(render()) as Element);
  });
});
