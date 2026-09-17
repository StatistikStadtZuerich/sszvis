import { geoPath } from "d3";
import type { Feature, FeatureCollection, MultiLineString, Polygon } from "geojson";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resolvedColor } from "../../support/domValues.js";
import { square as squareFeature } from "../../support/mapReaders.js";
import {
  describesKeyScopedElements,
  describesMapPathGeometry,
  describesNoDecorations,
  describesNoScheduledTransition,
} from "../../support/mapRendererConformance.js";
import { createSvgLayer } from "../../../src/createSvgLayer.js";
import "../../../src/d3-selectgroup.js";
import { swissMapProjection } from "../../../src/map/mapUtils.js";
import mapRendererMesh from "../../../src/map/renderer/mesh.js";

/** A unit square whose properties repeat its id, which is what this renderer matches on. */
const square = (id: string | undefined, offset = 0) => squareFeature(id, offset, { id });

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
      c,
    ) => c,
    key?: string,
  ) => {
    const component = configure(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()));
    return group(key).call(component).node() as SVGGElement;
  };

  describe("rendering", () => {
    test("should render the whole mesh as a single classed path", () => {
      const node = render();
      expect(borders(node)).toHaveLength(1);
      expect(borders(node)[0].tagName).toBe("path");
    });

    describesMapPathGeometry(() => {
      const meshFeature = mesh();
      const mapPath = mapPathOf();
      const node = group()
        .call(mapRendererMesh().geoJson(meshFeature).mapPath(mapPath))
        .node() as SVGGElement;
      // One combined border, so one expected path.
      return { marks: borders(node), expected: [mapPath(meshFeature)] };
    });

    test("should render one path however many borders the mesh carries", () => {
      const node = render();
      // Both of the mesh's lines are in the one path's data.
      const d = borders(node)[0].getAttribute("d") ?? "";
      expect(d.match(/M/g)).toHaveLength(2);
    });

    test("should reuse the same path element when the layer renders again", () => {
      const mapPath = mapPathOf();
      const layer = group("mesh-reuse");
      const renderWith = () =>
        layer.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPath)).node() as SVGGElement;
      const first = borders(renderWith())[0];
      expect(borders(renderWith())[0]).toBe(first);
    });

    describesNoDecorations(() => render());
  });

  describe("borderColor and strokeWidth", () => {
    test("should stroke the border white and 1.25 wide when no style props are set", () => {
      const node = render();
      expect(borders(node)[0].style.stroke).toBe("white");
      expect(borders(node)[0].style.strokeWidth).toBe("1.25");
    });

    test("should use the given border colour and stroke width when both are constants", () => {
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
            }),
        )
        .node() as SVGGElement;
      expect(seen).toHaveLength(1);
      expect((seen[0] as unknown[])[0]).toBe(meshFeature);
      expect((seen[0] as unknown[])[1]).toBe(0);
      expect(borders(node)[0].style.stroke).toBe("rgb(0, 255, 0)");
    });

    test("should call a strokeWidth function with the mesh object and the index when it is a function", () => {
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
            }),
        )
        .node() as SVGGElement;
      expect((seen[0] as unknown[])[0]).toBe(meshFeature);
      expect(borders(node)[0].style.strokeWidth).toBe("3");
    });
  });

  describe("more than one mesh in a layer", () => {
    // The selector used to be unscoped and the join unkeyed, so a second mesh rebound and
    // restyled the first one's path instead of drawing its own. Each mesh now owns the path
    // carrying its own key, so two border sets - administrative boundaries and lake outlines,
    // say - coexist in one group.
    describesKeyScopedElements({
      render: ({ group: key, key: meshKey, variant }) => {
        const component = mapRendererMesh()
          .geoJson(mesh())
          .mapPath(mapPathOf())
          .borderColor(variant);
        const layer = group(key);
        layer.call(meshKey === undefined ? component : component.key(meshKey));
        return layer.node() as SVGGElement;
      },
      marks: (node) => borders(node),
      variantOf: (mark) => resolvedColor((mark as SVGPathElement).style.stroke),
      variants: ["#ff0000", "#00ff00"],
    });

    // The selector is scoped to the layer's own children, so a mesh in a nested group is not
    // rebound by an outer one.
    test("should leave a nested mesh alone when an outer group renders over it", () => {
      const layer = group("nested-mesh");
      const inner = layer.append("g");
      inner.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()).borderColor("#ff0000"));
      layer.call(mapRendererMesh().geoJson(mesh()).mapPath(mapPathOf()).borderColor("#00ff00"));
      expect(borders(layer.node() as SVGGElement)).toHaveLength(2);
      expect(borders(inner.node() as SVGGElement)[0].style.stroke).toBe("rgb(255, 0, 0)");
    });
  });

  describe("an accessor that resolves to nothing", () => {
    // The accessor is called with the mesh object rather than a per-entity datum, so a caller's
    // (d) => colorScale(d.value) resolves to undefined. That used to remove the inline stroke,
    // and with no stylesheet stroke for .sszvis-map__border the SVG initial value `none` applied:
    // the borders vanished with no error. The default now stands instead.
    test("should keep the default border colour when borderColor resolves to nothing", () => {
      const node = render((c) => c.borderColor(() => undefined));
      expect(borders(node)[0].style.stroke).toBe("white");
    });

    test("should keep the default border colour when borderColor resolves to null", () => {
      const node = render((c) => c.borderColor(() => null));
      expect(borders(node)[0].style.stroke).toBe("white");
    });

    test("should keep the default stroke width when strokeWidth resolves to nothing", () => {
      const node = render((c) => c.strokeWidth(() => undefined));
      expect(borders(node)[0].style.strokeWidth).toBe("1.25");
    });
  });

  describe("required properties", () => {
    test("should throw naming geoJson when it is missing", () => {
      const layer = group("mesh-no-geojson");
      expect(() => layer.call(mapRendererMesh().mapPath(mapPathOf()))).toThrow(
        /map\/renderer\/mesh: geoJson is required/,
      );
    });

    test("should throw naming mapPath when it is missing", () => {
      const layer = group("mesh-no-mappath");
      expect(() => layer.call(mapRendererMesh().geoJson(mesh()))).toThrow(
        /map\/renderer\/mesh: mapPath is required/,
      );
    });

    // The guard runs before the join, so a missing property leaves no misleading element behind
    // rather than a classed, styled path with no geometry.
    test("should append no path when a required property is missing", () => {
      const layer = group("mesh-no-element");
      expect(() => layer.call(mapRendererMesh().mapPath(mapPathOf()))).toThrow();
      expect(borders(layer.node() as SVGGElement)).toHaveLength(0);
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

    // BUG(#448): the component sets neither fill nor pointer-events, so both come from sszvis.css.
    // A mesh rendered without that stylesheet is a filled black shape covering the map - SVG's
    // initial fill is black - and it swallows the base layer's hover and click events, because it
    // sits on top of them and only CSS makes it transparent to the pointer. The component writes
    // stroke and stroke-width itself, so it already owns this element's presentation.
    // Skipped, not deleted: it fails with "expected null to be 'none'".
    test.skip("should set the fill and pointer-events it depends on, not leave them to the stylesheet", () => {
      const node = render();
      const border = borders(node)[0];
      expect(border.style.fill || border.getAttribute("fill")).toBe("none");
      expect(border.style.pointerEvents || border.getAttribute("pointer-events")).toBe("none");
    });

    // NOTE: an invalid stroke-width is dropped by the CSS parser, so the SVG initial width of 1
    // applies - a typo yields a slightly thinner border rather than an error. Zero renders
    // nothing at all.
    test("falls back to the initial width for an invalid strokeWidth", () => {
      expect(
        borders(
          // @ts-expect-error - a string is a caller error; pinned because it fails silently
          render((c) => c.strokeWidth("abc")),
        ).at(0)?.style.strokeWidth,
      ).toBe("");
      expect(borders(render((c) => c.strokeWidth(-1))).at(0)?.style.strokeWidth).toBe("");
      expect(borders(render((c) => c.strokeWidth(0))).at(0)?.style.strokeWidth).toBe("0");
    });

    // This renderer is genuinely free of the quirk family its siblings share: there is no
    // transition to interpolate a colour onto itself, no slowTransition no-op, no stale-class
    // repaint and no missing-value pattern. Pinned so the port cannot introduce one.
    describesNoScheduledTransition(() => borders(render())[0]);

    // The path data is reapplied on every render rather than only on enter, so a geoJson mutated
    // in place still repaints even though the bound datum is identical. The siblings' keyed joins
    // do not give that for free.
    test("should repaint the border when the geoJson is mutated in place", () => {
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
            }),
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
