import { geoPath } from "d3";
import type { Feature, FeatureCollection, MultiLineString, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererMesh from "../../../src/map/renderer/mesh.js";

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

/** The kind of object this renderer documents: one polyline carrying every border. */
const mesh = (): Feature<MultiLineString> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiLineString",
    coordinates: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [2, 2],
        [2, 3],
      ],
    ],
  },
});

describe("map/renderer/mesh", () => {
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
      key: key ?? `mesh-${++layerKey}`,
    }).selectGroup("map");

  const collection = (): FeatureCollection<Polygon> => ({
    type: "FeatureCollection",
    features: [square("a"), square("b", 2)],
  });

  const mapPathOf = () =>
    geoPath().projection(swissMapProjection(100, 100, collection(), `mesh-path-${++pathKey}`));

  const borders = (node: Element) => [
    ...node.querySelectorAll<SVGPathElement>("path.sszvis-map__border"),
  ];

  /** Renders the mesh, returning the group node it drew into. */
  const render = (
    configure: (c: ReturnType<typeof mapRendererMesh>) => ReturnType<typeof mapRendererMesh> = (
      c
    ) => c,
    key?: string
  ) => {
    const component = configure(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()));
    return group(key).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("renders the whole mesh as a single classed path", () => {
      const node = render();
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].tagName).toBe("path");
    });

    test("takes the path data from the mapPath generator", () => {
      const meshFeature = mesh();
      const mapPath = mapPathOf();
      const node = group()
        .call(mapRendererMesh().geoJson(meshFeature).mapPath(mapPath))
        .node() as SVGGElement;
      expect(borders(node)[0].getAttribute("d")).toBe(mapPath(meshFeature));
    });

    test("renders one path however many borders the mesh carries", () => {
      const node = render();
      // Both of the mesh's lines are in the one path's data.
      const d = borders(node)[0].getAttribute("d") ?? "";
      expect(d.match(/M/g)).toHaveLength(2);
    });

    test("reuses the same path element across renders", () => {
      const mapPath = mapPathOf();
      const layer = group("mesh-reuse");
      const renderWith = () =>
        layer.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPath)).node() as SVGGElement;
      const first = borders(renderWith())[0];
      expect(borders(renderWith())[0]).toBe(first);
    });

    test("adds no tooltip anchors, event targets or missing-value pattern", () => {
      const node = render();
      const root = node.ownerSVGElement as SVGSVGElement;
      expect(node.querySelectorAll("[data-tooltip-anchor]")).toHaveLength(0);
      expect(node.querySelectorAll("[data-event-target]")).toHaveLength(0);
      expect(root.querySelectorAll("#missing-pattern")).toHaveLength(0);
    });
  });

  describe("borderColor and strokeWidth", () => {
    test("defaults to a white border 1.25 wide", () => {
      const node = render();
      expect(borders(node)[0].style.stroke).toBe("white");
      expect(borders(node)[0].style.strokeWidth).toBe("1.25");
    });

    test("takes a constant border colour and stroke width", () => {
      const node = render((c) => c.borderColor("#7C7C7C").strokeWidth(2));
      expect(borders(node)[0].style.stroke).toBe("rgb(124, 124, 124)");
      expect(borders(node)[0].style.strokeWidth).toBe("2");
    });

    // NOTE: these two props are written as inline styles rather than attributes, unlike the fill
    // and stroke of the base and geojson renderers. sszvis.css does not set stroke or stroke-width
    // for .sszvis-map__border, so nothing is being overridden - the cost runs the other way: a
    // consumer cannot restyle a mesh border from their own stylesheet, because an inline style
    // beats any author rule short of !important.
    test("writes the border colour as an inline style, not an attribute", () => {
      const node = render((c) => c.borderColor("#7C7C7C"));
      expect(borders(node)[0].hasAttribute("stroke")).toBe(false);
      expect(borders(node)[0].getAttribute("style")).toContain("stroke");
    });

    // NOTE: borderColor and strokeWidth are not wrapped in fn.functor, unlike the colour props of
    // the base, geojson and highlight renderers. A function is handed straight to d3, so it is
    // called with the mesh object itself and d3's index - there is no per-border datum, since
    // there is only one path. The lake overlay's lakePathColor has the same shape.
    test("calls a borderColor function with the mesh object and the index", () => {
      const meshFeature = mesh();
      const seen: unknown[] = [];
      const node = group()
        .call(
          mapRendererMesh()
            .geoJson(meshFeature)
            .mapPath(mapPathOf())
            .borderColor((...args: unknown[]) => {
              seen.push(args);
              return "#00ff00";
            })
        )
        .node() as SVGGElement;
      expect(seen).toHaveLength(1);
      expect((seen[0] as unknown[])[0]).toBe(meshFeature);
      expect((seen[0] as unknown[])[1]).toBe(0);
      expect(borders(node)[0].style.stroke).toBe("rgb(0, 255, 0)");
    });

    test("calls a strokeWidth function the same way", () => {
      const meshFeature = mesh();
      const seen: unknown[] = [];
      const node = group()
        .call(
          mapRendererMesh()
            .geoJson(meshFeature)
            .mapPath(mapPathOf())
            .strokeWidth((...args: unknown[]) => {
              seen.push(args);
              return 3;
            })
        )
        .node() as SVGGElement;
      expect((seen[0] as unknown[])[0]).toBe(meshFeature);
      expect(borders(node)[0].style.strokeWidth).toBe("3");
    });
  });

  describe("known quirks", () => {
    // NOTE: strokeWidth is a real property with a default, and choropleth delegates it publicly,
    // but src/maps/choropleth.js does not list it among its own @property lines - so a caller
    // reading choropleth's docs would conclude border thickness is not configurable. Every docs
    // example leaves it at the default, which is consistent with it being undiscoverable.
    test("exposes strokeWidth, which the documentation does not mention", () => {
      expect(mapRendererMesh().strokeWidth()).toBe(1.25);
      expect(mapRendererMesh().borderColor()).toBe("white");
    });

    // BUG: neither required property is validated, and neither omission is reported. The join is
    // `[props.geoJson]`, so exactly one datum is always bound - undefined included - and
    // geoPath(undefined) returns null, which d3 turns into a removed attribute. The result is a
    // classed, styled path with no geometry: an invisible element, no error, and nothing to
    // distinguish "no borders to draw" from "the caller forgot the data".
    test("renders a styled but empty path when geoJson is missing", () => {
      const layer = group("mesh-no-geojson");
      const node = layer.call(mapRendererMesh().mapPath(mapPathOf())).node() as SVGGElement;
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].hasAttribute("d")).toBe(false);
      expect(borders(node)[0].style.stroke).toBe("white");
    });

    // The same root defect as above, by a different d3 mechanism: an attribute set to undefined
    // is removed without anything being called.
    test("renders a styled but empty path when mapPath is missing", () => {
      const node = group().call(mapRendererMesh().geoJson(mesh())).node() as SVGGElement;
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].hasAttribute("d")).toBe(false);
    });

    // BUG: the component sets neither fill nor pointer-events, so both come from sszvis.css. A
    // mesh rendered without that stylesheet is a filled black shape covering the map - SVG's
    // initial fill is black - and it swallows the base layer's hover and click events, because it
    // sits on top of them and only CSS makes it transparent to the pointer.
    test("relies on the stylesheet for fill and pointer-events", () => {
      const node = render();
      const border = borders(node)[0];
      expect(border.hasAttribute("fill")).toBe(false);
      expect(border.style.fill).toBe("");
      expect(border.style.pointerEvents).toBe("");
    });

    // BUG: a borderColor function that returns null or undefined removes the inline stroke, and
    // with no stylesheet stroke the SVG initial value `none` applies - an invisible border, no
    // error. This is a realistic outcome, since the accessor is called with the mesh object
    // rather than a datum, so a caller's (d) => colorScale(d.value) yields undefined.
    test("silently removes the border when borderColor returns undefined", () => {
      // @ts-expect-error - d3 removes a style whose value is undefined, though its types allow
      // only null. Returning undefined is what a real accessor written against a datum produces.
      const node = render((c) => c.borderColor(() => undefined));
      expect(borders(node)[0].style.stroke).toBe("");
      expect(borders(node)[0].getAttribute("style") ?? "").not.toContain("stroke:");
    });

    // NOTE: an invalid stroke-width is dropped by the CSS parser, so the SVG initial width of 1
    // applies - a typo yields a slightly thinner border rather than an error. Zero renders
    // nothing at all.
    test("falls back to the initial width for an invalid strokeWidth", () => {
      expect(
        borders(
          // @ts-expect-error - a string is a caller error; pinned because it fails silently
          render((c) => c.strokeWidth("abc"))
        ).at(0)?.style.strokeWidth
      ).toBe("");
      expect(borders(render((c) => c.strokeWidth(-1))).at(0)?.style.strokeWidth).toBe("");
      expect(borders(render((c) => c.strokeWidth(0))).at(0)?.style.strokeWidth).toBe("0");
    });

    // This renderer is genuinely free of the quirk family its siblings share: there is no
    // transition to interpolate a colour onto itself, no slowTransition no-op, no stale-class
    // repaint and no missing-value pattern. Pinned so the port cannot introduce one.
    test("schedules no transition at all", () => {
      const node = render();
      expect(
        (borders(node)[0] as Element & { __transition?: unknown }).__transition
      ).toBeUndefined();
    });

    // BUG: the border selector is unscoped and unkeyed, so a second mesh rendered into the same
    // group rebinds and restyles the first one's path instead of adding its own. choropleth uses
    // a single mesh, so this is latent - but the renderer is exported publicly.
    test("a second mesh in one group restyles the first instead of adding its own", () => {
      const layer = group("two-meshes");
      layer.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()).borderColor("#ff0000"));
      const first = borders(layer.node() as SVGGElement)[0];
      layer.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()).borderColor("#00ff00"));
      const after = borders(layer.node() as SVGGElement);
      expect(after).toHaveLength(1);
      expect(after[0]).toBe(first);
      expect(after[0].style.stroke).toBe("rgb(0, 255, 0)");
    });

    // The path data is reapplied on every render rather than only on enter, so a geoJson mutated
    // in place still repaints even though the bound datum is identical. The siblings' keyed joins
    // do not give that for free.
    test("repaints a geoJson that was mutated in place", () => {
      const meshFeature = mesh();
      const mapPath = mapPathOf();
      const layer = group("mesh-mutated");
      const renderWith = () =>
        layer.call(mapRendererMesh().geoJson(meshFeature).mapPath(mapPath)).node() as SVGGElement;
      const before = borders(renderWith())[0].getAttribute("d");
      meshFeature.geometry.coordinates = [
        [
          [4, 4],
          [4, 5],
        ],
      ];
      expect(borders(renderWith())[0].getAttribute("d")).not.toBe(before);
    });

    // NOTE: mapPath is handed to d3 as the attribute callback, so it is invoked as
    // mapPath(datum, index, group). d3-geo forwards the extra arguments to its own accessors,
    // which is harmless, but a caller-supplied generator does receive them.
    test("calls mapPath with d3's index and group as extra arguments", () => {
      const meshFeature = mesh();
      const seen: unknown[][] = [];
      const node = group()
        .call(
          mapRendererMesh()
            .geoJson(meshFeature)
            .mapPath((...args: unknown[]) => {
              seen.push(args);
              return "M0,0L1,1";
            })
        )
        .node() as SVGGElement;
      expect(seen[0][0]).toBe(meshFeature);
      expect(seen[0][1]).toBe(0);
      expect(seen[0]).toHaveLength(3);
      expect(borders(node)[0].getAttribute("d")).toBe("M0,0L1,1");
    });

    // NOTE: nothing constrains the geoJson to be a mesh. A feature collection renders as one path
    // containing every feature's outline, drawn as outlines only because the stylesheet sets
    // fill: none - it just cannot be styled per shape.
    test("renders a feature collection as one path too", () => {
      const features = collection();
      const mapPath = mapPathOf();
      const node = group()
        .call(mapRendererMesh().geoJson(features).mapPath(mapPath))
        .node() as SVGGElement;
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].getAttribute("d")).toBe(mapPath(features));
    });
  });
});
