import { geoPath } from "d3";
import type { Feature, FeatureCollection, MultiLineString, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
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

  /** Renders the overlay, returning the group node it drew into. */
  const render = (
    configure: (
      c: ReturnType<typeof mapRendererPatternedLakeOverlay>
    ) => ReturnType<typeof mapRendererPatternedLakeOverlay> = (c) => c,
    key?: string
  ) => {
    const component = configure(
      mapRendererPatternedLakeOverlay()
        .mapPath(mapPathOf())
        .lakeFeature(lake())
        .lakeBounds(bounds())
    );
    return group(key).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("renders the lake shape and the border path, each once", () => {
      const node = render();
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(defs(node, "path.sszvis-map__lakepath")).toHaveLength(1);
    });

    test("takes both path data strings from the mapPath generator", () => {
      const lakeFeature = lake();
      const lakeBounds = bounds();
      const mapPath = mapPathOf();
      const node = group()
        .call(
          mapRendererPatternedLakeOverlay()
            .mapPath(mapPath)
            .lakeFeature(lakeFeature)
            .lakeBounds(lakeBounds)
        )
        .node() as SVGGElement;
      expect(lakeShape(node)?.getAttribute("d")).toBe(mapPath(lakeFeature));
      expect(lakeBorder(node)?.getAttribute("d")).toBe(mapPath(lakeBounds));
    });

    test("fills the lake shape with the lake pattern", () => {
      const node = render();
      expect(lakeShape(node)?.getAttribute("fill")).toBe("url(#lake-pattern)");
    });

    test("defines the lake pattern in a defs element inside the layer", () => {
      const node = render();
      expect(defs(node, "defs > pattern#lake-pattern")).toHaveLength(1);
      // The pattern helper fills it in; the tile is a white rect plus hatch lines.
      expect(defs(node, "pattern#lake-pattern > rect")).toHaveLength(1);
    });

    // NOTE: the defs element is created inside the map group rather than at the svg root, and
    // ensureDefsElement selects it with an unscoped descendant selector - so this component shares
    // one defs with the base renderer's #missing-pattern when both draw into the same group.
    test("puts the defs inside the map group, not at the svg root", () => {
      const node = render();
      const defsElement = node.querySelector("defs");
      expect(defsElement?.parentElement).toBe(node);
      expect(node.ownerSVGElement?.querySelectorAll(":scope > defs")).toHaveLength(0);
    });

    test("reuses the same paths and defs elements across renders", () => {
      const layer = group("lake-reuse");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
          )
          .node() as SVGGElement;
      const first = lakeShape(renderWith());
      const firstPattern = defs(renderWith(), "pattern#lake-pattern")[0];
      const node = renderWith();
      expect(lakeShape(node)).toBe(first);
      expect(defs(node, "pattern#lake-pattern")).toHaveLength(1);
      expect(defs(node, "pattern#lake-pattern")[0]).toBe(firstPattern);
    });

    test("adds no tooltip anchors and no event targets", () => {
      const node = render();
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
      expect(node.querySelectorAll("[data-event-target]")).toHaveLength(0);
    });
  });

  describe("fadeOut", () => {
    test("defaults to true, masking the lake with the fade gradient", () => {
      expect(mapRendererPatternedLakeOverlay().fadeOut()).toBe(true);
      const node = render();
      expect(defs(node, "defs > linearGradient#lake-fade-gradient")).toHaveLength(1);
      expect(defs(node, "defs > mask#lake-fade-mask")).toHaveLength(1);
      expect(lakeShape(node)?.getAttribute("mask")).toBe("url(#lake-fade-mask)");
    });

    test("emits neither the gradient nor the mask when disabled", () => {
      const node = render((c) => c.fadeOut(false));
      expect(defs(node, "linearGradient#lake-fade-gradient")).toHaveLength(0);
      expect(defs(node, "mask#lake-fade-mask")).toHaveLength(0);
      expect(lakeShape(node)?.hasAttribute("mask")).toBe(false);
    });

    test("removes the fade when fadeOut is turned off after being on", () => {
      const layer = group("lake-toggle-fade");
      const renderWith = (fadeOut: boolean) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .fadeOut(fadeOut)
          )
          .node() as SVGGElement;
      renderWith(true);
      const node = renderWith(false);
      expect(lakeShape(node)?.hasAttribute("mask")).toBe(false);
      expect(defs(node, "mask#lake-fade-mask")).toHaveLength(0);
      expect(defs(node, "linearGradient#lake-fade-gradient")).toHaveLength(0);
    });

    test("re-applies the fade when it is turned back on", () => {
      const layer = group("lake-retoggle-fade");
      const renderWith = (fadeOut: boolean) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .fadeOut(fadeOut)
          )
          .node() as SVGGElement;
      renderWith(true);
      renderWith(false);
      const node = renderWith(true);
      expect(defs(node, "mask#lake-fade-mask > rect")).toHaveLength(1);
      expect(defs(node, "linearGradient#lake-fade-gradient > stop")).toHaveLength(2);
      expect(lakeShape(node)?.getAttribute("mask")).toBe("url(#lake-fade-mask)");
    });

    // NOTE: the mask references the gradient by id, and the gradient helper sets that id a second
    // time on the element ensureDefsElement already identified - a harmless redundancy, pinned
    // because it is the only place two code paths write the same id.
    test("wires the mask to the gradient by id", () => {
      const node = render();
      expect(defs(node, "mask#lake-fade-mask > rect")[0]?.getAttribute("fill")).toBe(
        "url(#lake-fade-gradient)"
      );
      expect(defs(node, "linearGradient#lake-fade-gradient")[0]?.getAttribute("id")).toBe(
        "lake-fade-gradient"
      );
    });
  });

  describe("lakePathColor", () => {
    test("leaves the border stroke to the stylesheet by default", () => {
      const node = render();
      expect(lakeBorder(node)?.hasAttribute("style")).toBe(false);
      expect(lakeBorder(node)?.style.stroke).toBe("");
    });

    test("takes a constant colour as an inline style", () => {
      const node = render((c) => c.lakePathColor("#7C7C7C"));
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(124, 124, 124)");
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
            })
        )
        .node() as SVGGElement;
      expect(seen).toHaveLength(1);
      expect(seen[0][0]).toBe(lakeBounds);
      expect(seen[0][1]).toBe(0);
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(0, 255, 0)");
    });
  });

  describe("known quirks", () => {
    // The pattern helpers append their contents rather than joining them, so the component only
    // calls them on a definition that is still empty - otherwise a map re-rendering on resize would
    // grow its defs subtree without bound.
    test("leaves the pattern, gradient and mask contents untouched on re-render", () => {
      const layer = group("lake-defs-growth");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
          )
          .node() as SVGGElement;
      renderWith();
      renderWith();
      const node = renderWith();
      expect(defs(node, "pattern#lake-pattern > rect")).toHaveLength(1);
      expect(defs(node, "pattern#lake-pattern > line")).toHaveLength(2);
      expect(defs(node, "linearGradient#lake-fade-gradient > stop")).toHaveLength(2);
      expect(defs(node, "mask#lake-fade-mask > rect")).toHaveLength(1);
    });

    // BUG: the colour is applied only when the property is truthy, so there is no way to clear a
    // previously set colour by passing "" - and a falsy colour is silently ignored rather than
    // reported. The guard exists because the property has no default.
    test("ignores a falsy lakePathColor instead of clearing the stroke", () => {
      const layer = group("lake-falsy-colour");
      const renderWith = (lakePathColor: string) =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPathOf())
              .lakeFeature(lake())
              .lakeBounds(bounds())
              .lakePathColor(lakePathColor)
          )
          .node() as SVGGElement;
      renderWith("#ff0000");
      const node = renderWith("");
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(255, 0, 0)");
    });

    // BUG: all three definitions use fixed ids, so two maps on one page define #lake-pattern,
    // #lake-fade-gradient and #lake-fade-mask twice, and every url(#...) reference in the
    // document resolves to whichever comes first. The same defect as the base and geojson
    // renderers' "missing-pattern".
    test("emits the same fixed ids for every layer on the page", () => {
      render(undefined, "lake-page-one");
      render(undefined, "lake-page-two");
      expect(document.querySelectorAll("pattern#lake-pattern")).toHaveLength(2);
      expect(document.querySelectorAll("linearGradient#lake-fade-gradient")).toHaveLength(2);
      expect(document.querySelectorAll("mask#lake-fade-mask")).toHaveLength(2);
    });

    // BUG: neither geoJson property is validated, and neither omission is reported. The join is
    // `[props.lakeFeature]`, so exactly one datum is always bound - undefined included - and
    // geoPath(undefined) returns null, which d3 turns into a removed attribute. The result is a
    // classed, pattern-filled path with no geometry. The same root defect as the mesh renderer's.
    test("renders styled but empty paths when the geoJson properties are missing", () => {
      const node = group()
        .call(mapRendererPatternedLakeOverlay().mapPath(mapPathOf()))
        .node() as SVGGElement;
      expect(lakeShape(node)?.hasAttribute("d")).toBe(false);
      expect(lakeShape(node)?.getAttribute("fill")).toBe("url(#lake-pattern)");
      expect(lakeBorder(node)?.hasAttribute("d")).toBe(false);
    });

    // The same root defect by a different d3 mechanism: an attribute set to undefined is removed
    // without anything being called.
    test("renders styled but empty paths when mapPath is missing", () => {
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

    // BUG: both selectors are unscoped and both joins unkeyed, so a second overlay rendered into
    // the same group rebinds the first one's paths instead of adding its own. choropleth uses a
    // single overlay, so this is latent - but the renderer is exported publicly.
    test("a second overlay in one group rebinds the first instead of adding its own", () => {
      const layer = group("two-overlays");
      layer.call(
        mapRendererPatternedLakeOverlay()
          .mapPath(mapPathOf())
          .lakeFeature(lake())
          .lakeBounds(bounds())
          .lakePathColor("#ff0000")
      );
      const first = lakeShape(layer.node() as SVGGElement);
      layer.call(
        mapRendererPatternedLakeOverlay()
          .mapPath(mapPathOf())
          .lakeFeature(lake(2))
          .lakeBounds(bounds())
          .lakePathColor("#00ff00")
      );
      const node = layer.node() as SVGGElement;
      expect(defs(node, "path.sszvis-map__lakezurich")).toHaveLength(1);
      expect(lakeShape(node)).toBe(first);
      expect(lakeBorder(node)?.style.stroke).toBe("rgb(0, 255, 0)");
    });

    // The path data is reapplied on every render rather than only on enter, so a lakeFeature
    // mutated in place still repaints even though the bound datum is identical.
    test("repaints a lakeFeature that was mutated in place", () => {
      const lakeFeature = lake();
      const mapPath = mapPathOf();
      const layer = group("lake-mutated");
      const renderWith = () =>
        layer
          .call(
            mapRendererPatternedLakeOverlay()
              .mapPath(mapPath)
              .lakeFeature(lakeFeature)
              .lakeBounds(bounds())
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
            .lakeBounds(bounds())
        )
        .node() as SVGGElement;
      expect(seen[0][0]).toBe(lakeFeature);
      expect(seen[0][1]).toBe(0);
      expect(seen[0]).toHaveLength(3);
      expect(lakeShape(node)?.getAttribute("d")).toBe("M0,0L1,1");
    });

    // Free of the transition quirks its siblings share: no transition is scheduled, so the lake
    // appears instantly. Pinned so the port cannot introduce one.
    test("schedules no transition at all", () => {
      const node = render();
      const shape = lakeShape(node) as Element & { __transition?: unknown };
      expect(shape.__transition).toBeUndefined();
    });
  });
});
