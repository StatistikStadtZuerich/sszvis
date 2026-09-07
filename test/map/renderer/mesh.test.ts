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

  const borders = (node: Element) => [...node.querySelectorAll("path.sszvis-map__border")];

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

    // NOTE: these two props are written as inline styles rather than attributes, so they override
    // any stylesheet rule for .sszvis-map__border - unlike the fill and stroke of the base and
    // geojson renderers, which are attributes and lose to CSS.
    test("writes the border colour as an inline style, not an attribute", () => {
      const node = render((c) => c.borderColor("#7C7C7C"));
      expect(borders(node)[0].hasAttribute("stroke")).toBe(false);
      expect(borders(node)[0].getAttribute("style")).toContain("stroke");
    });

    // NOTE: unlike every other map renderer's colour props, borderColor and strokeWidth are not
    // wrapped in fn.functor. A function is handed straight to d3, so it is called with the mesh
    // object itself and d3's index - there is no per-border datum, since there is only one path.
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
    // NOTE: strokeWidth is a real property with a default, but it is absent from the module's
    // @property documentation, so the only way to discover it is to read the source.
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

    // BUG: a missing mapPath is equally silent. d3 removes an attribute set to undefined without
    // ever calling anything, so the path is created and left geometry-less.
    test("renders a styled but empty path when mapPath is missing", () => {
      const node = group().call(mapRendererMesh().geoJson(mesh())).node() as SVGGElement;
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].hasAttribute("d")).toBe(false);
    });

    // NOTE: nothing constrains the geoJson to be a mesh. A feature collection renders as one path
    // containing every feature's outline, which is the documented mesh behaviour applied to
    // filled shapes - it just cannot be styled per shape.
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
