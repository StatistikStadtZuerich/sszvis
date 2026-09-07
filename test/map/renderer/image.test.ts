import { geoMercator, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { bounds as boundsOf } from "../../../src/bounds.js";
import { createHtmlLayer } from "../../../src/createHtmlLayer.js";
import mapRendererImage from "../../../src/map/renderer/image.js";

/** The corner coordinates the docs examples pass: [[nw-lon, nw-lat], [se-lon, se-lat]]. */
const GEO_BOUNDS: [[number, number], [number, number]] = [
  [8.431_443, 47.448_978],
  [8.647_471, 47.309_726],
];

/** A 1x1 transparent gif, so nothing is fetched. */
const SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

describe("map/renderer/image", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const layer = (key?: string) =>
    createHtmlLayer("#chart-container", undefined, { key: key ?? `image-${++layerKey}` });

  const projectionOf = () => geoMercator().scale(1000).translate([100, 100]);

  const image = (node: Element) => node.querySelector<HTMLImageElement>("img.sszvis-map__image");

  /** Renders the image layer, returning the layer node it drew into. */
  const render = (
    configure: (c: ReturnType<typeof mapRendererImage>) => ReturnType<typeof mapRendererImage> = (
      c
    ) => c,
    key?: string
  ) => {
    const component = configure(
      mapRendererImage().projection(projectionOf()).src(SRC).geoBounds(GEO_BOUNDS)
    );
    return layer(key).call(component).node() as HTMLElement;
  };

  describe("rendering", () => {
    test("renders one classed img element", () => {
      const node = render();
      expect(node.querySelectorAll("img.sszvis-map__image")).toHaveLength(1);
      expect(image(node)?.tagName).toBe("IMG");
    });

    test("takes the src as given", () => {
      const node = render();
      expect(image(node)?.getAttribute("src")).toBe(SRC);
    });

    test("positions the image from the projected north-west corner", () => {
      const projection = projectionOf();
      const node = layer()
        .call(mapRendererImage().projection(projection).src(SRC).geoBounds(GEO_BOUNDS))
        .node() as HTMLElement;
      const topLeft = projection(GEO_BOUNDS[0]) as [number, number];
      expect(image(node)?.style.left).toBe(`${Math.round(topLeft[0])}px`);
      expect(image(node)?.style.top).toBe(`${Math.round(topLeft[1])}px`);
    });

    test("sizes the image from the distance between the rounded corners", () => {
      const projection = projectionOf();
      const node = layer()
        .call(mapRendererImage().projection(projection).src(SRC).geoBounds(GEO_BOUNDS))
        .node() as HTMLElement;
      const topLeft = projection(GEO_BOUNDS[0]) as [number, number];
      const bottomRight = projection(GEO_BOUNDS[1]) as [number, number];
      expect(image(node)?.style.width).toBe(
        `${Math.round(bottomRight[0]) - Math.round(topLeft[0])}px`
      );
      expect(image(node)?.style.height).toBe(
        `${Math.round(bottomRight[1]) - Math.round(topLeft[1])}px`
      );
    });

    test("lands the right and bottom edges on the projected south-east corner", () => {
      // Corners chosen so that rounding each one goes a different way: x from 10.6 to 20.4.
      const projection = (point: [number, number]) =>
        point[0] === 0 ? ([10.6, 10.6] as [number, number]) : ([20.4, 20.4] as [number, number]);
      const node = layer()
        .call(
          mapRendererImage()
            .projection(projection)
            .src(SRC)
            .geoBounds([
              [0, 0],
              [1, 1],
            ])
        )
        .node() as HTMLElement;
      expect(image(node)?.style.left).toBe("11px");
      // The right edge lands at 11 + 9 = 20px, the rounded projected corner.
      expect(image(node)?.style.width).toBe("9px");
      expect(image(node)?.style.height).toBe("9px");
    });

    test("positions the image itself, without relying on the stylesheet", () => {
      const node = render();
      expect(image(node)?.style.position).toBe("absolute");
      expect(image(node)?.style.left).not.toBe("");
    });

    test("calls the projection once per corner, with the corner coordinates", () => {
      const seen: unknown[] = [];
      const projection = projectionOf();
      const spy = (point: [number, number]) => {
        seen.push(point);
        return projection(point);
      };
      layer().call(mapRendererImage().projection(spy).src(SRC).geoBounds(GEO_BOUNDS));
      expect(seen).toEqual([GEO_BOUNDS[0], GEO_BOUNDS[1]]);
    });

    test("layers a second image renderer alongside the first", () => {
      const target = layer("two-images");
      target.call(mapRendererImage().projection(projectionOf()).src(SRC).geoBounds(GEO_BOUNDS));
      const first = image(target.node() as HTMLElement);
      target.call(
        mapRendererImage()
          .projection(projectionOf())
          .src("data:image/gif;base64,OTHER")
          .geoBounds(GEO_BOUNDS)
          .opacity(0.5)
      );
      const node = target.node() as HTMLElement;
      const images = [...node.querySelectorAll<HTMLImageElement>("img.sszvis-map__image")];
      expect(images).toHaveLength(2);
      expect(images[0]).toBe(first);
      expect(images[0].getAttribute("src")).toBe(SRC);
      expect(images[0].style.opacity).toBe("1");
      expect(images[1].getAttribute("src")).toBe("data:image/gif;base64,OTHER");
      expect(images[1].style.opacity).toBe("0.5");
    });

    test("reuses the same img element across renders", () => {
      const target = layer("image-reuse");
      const renderWith = () =>
        target
          .call(mapRendererImage().projection(projectionOf()).src(SRC).geoBounds(GEO_BOUNDS))
          .node() as HTMLElement;
      const first = image(renderWith());
      expect(image(renderWith())).toBe(first);
    });
  });

  describe("opacity", () => {
    test("defaults to fully opaque", () => {
      expect(mapRendererImage().opacity()).toBe(1);
      expect(image(render())?.style.opacity).toBe("1");
    });

    test("takes a number", () => {
      expect(image(render((c) => c.opacity(0.4)))?.style.opacity).toBe("0.4");
    });
  });

  describe("alt", () => {
    test("marks the image decorative by default", () => {
      expect(mapRendererImage().alt()).toBe("");
      expect(image(render())?.getAttribute("alt")).toBe("");
    });

    test("writes a caller-supplied description to alt", () => {
      const node = render((c) => c.alt("Topographic layer of the city of Zurich"));
      expect(image(node)?.getAttribute("alt")).toBe("Topographic layer of the city of Zurich");
    });
  });

  describe("validation", () => {
    test("reports a missing projection", () => {
      expect(() => layer().call(mapRendererImage().src(SRC).geoBounds(GEO_BOUNDS))).toThrow(
        /projection/
      );
    });

    test("reports a missing src", () => {
      expect(() =>
        layer().call(mapRendererImage().projection(projectionOf()).geoBounds(GEO_BOUNDS))
      ).toThrow(/src/);
    });

    test("reports a missing geoBounds", () => {
      expect(() => layer().call(mapRendererImage().projection(projectionOf()).src(SRC))).toThrow(
        /geoBounds/
      );
    });

    test("reports inverted geoBounds instead of silently unsizing the image", () => {
      expect(() =>
        layer().call(
          mapRendererImage()
            .projection(projectionOf())
            .src(SRC)
            .geoBounds([GEO_BOUNDS[1], GEO_BOUNDS[0]])
        )
      ).toThrow(/geoBounds/);
    });

    test("reports a corner the projection cannot place, naming it", () => {
      expect(() =>
        layer().call(
          mapRendererImage()
            .projection(() => null)
            .src(SRC)
            .geoBounds(GEO_BOUNDS)
        )
      ).toThrow(/north-west corner/);
    });

    test("builds nothing when a property is missing", () => {
      const target = layer("image-unvalidated");
      expect(() => target.call(mapRendererImage().projection(projectionOf()).src(SRC))).toThrow();
      expect(image(target.node() as HTMLElement)).toBeNull();
    });
  });

  describe("known quirks", () => {
    // NOTE: a Mercator projection does not reject a pole; log(tan(pi/2)) is merely a very large
    // float, so a geoBounds latitude of 90 yields an enormous finite offset and the image is
    // positioned and sized tens of thousands of pixels off. Silently off-screen, not reported -
    // and, being finite, it is not caught by the non-finite case below either.
    test("positions the image far off-screen for a corner at the pole", () => {
      const node = layer()
        .call(
          mapRendererImage()
            .projection(projectionOf())
            .src(SRC)
            .geoBounds([
              [8, 90],
              [9, 47],
            ])
        )
        .node() as HTMLElement;
      expect(Number.parseInt(image(node)?.style.top ?? "", 10)).toBeLessThan(-10_000);
      expect(Number.parseInt(image(node)?.style.height ?? "", 10)).toBeGreaterThan(10_000);
    });

    // NOTE: a projection that returns a non-finite coordinate yields the string "Infinitypx",
    // which the CSS parser drops - leaving the image unpositioned and unsized, with no error.
    // Like the null case, this needs a caller-supplied projection to reach.
    test("silently drops the position for a non-finite projected coordinate", () => {
      const node = layer()
        .call(
          mapRendererImage()
            .projection(() => [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY])
            .src(SRC)
            .geoBounds(GEO_BOUNDS)
        )
        .node() as HTMLElement;
      expect(image(node)?.style.top).toBe("");
      expect(image(node)?.style.left).toBe("");
      expect(image(node)?.style.height).toBe("");
    });

    // NOTE: nothing ties this component to an HTML layer. Called on an SVG selection it appends an
    // <img> inside the SVG, which no browser renders, with no warning.
    test("appends an img into an svg selection without complaining", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      container.appendChild(svg);
      select(svg).call(
        mapRendererImage().projection(projectionOf()).src(SRC).geoBounds(GEO_BOUNDS)
      );
      const appended = svg.querySelector("img");
      expect(appended).not.toBeNull();
      // d3's creator inherits the parent namespace, so this is an SVG-namespaced img element, not
      // an HTMLImageElement - which is why nothing renders it.
      expect(appended?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    });

    // NOTE: an invalid opacity is dropped by the CSS parser rather than reported, leaving the
    // image fully opaque. A string is a caller error; pinned because it fails silently.
    test("falls back to fully opaque for an invalid opacity", () => {
      // @ts-expect-error - a string is a caller error
      expect(image(render((c) => c.opacity("abc")))?.style.opacity).toBe("");
    });

    // NOTE: a zero opacity renders nothing at all, which is indistinguishable from a src that
    // failed to load.
    test("renders an invisible image for a zero opacity", () => {
      expect(image(render((c) => c.opacity(0)))?.style.opacity).toBe("0");
    });

    // NOTE: neither src nor opacity is wrapped in fn.functor, unlike the colour props of the map
    // renderers - but both are handed straight to d3, which evaluates a function against the
    // bound datum. So an accessor happens to work, called with the join's placeholder 0.
    test("accepts a function for src and opacity, called with the placeholder datum", () => {
      const seen: unknown[] = [];
      const node = layer()
        .call(
          mapRendererImage()
            .projection(projectionOf())
            .src((...args: unknown[]) => {
              seen.push(args[0]);
              return "data:image/gif;base64,FN";
            })
            .geoBounds(GEO_BOUNDS)
            .opacity(() => 0.25)
        )
        .node() as HTMLElement;
      expect(seen).toEqual([0]);
      expect(image(node)?.getAttribute("src")).toBe("data:image/gif;base64,FN");
      expect(image(node)?.style.opacity).toBe("0.25");
    });

    // NOTE: the projected coordinates are written unshifted, and createHtmlLayer positions the
    // layer itself by the bounds padding - so the image's offset is relative to the layer, and the
    // padding is applied exactly once. This is what keeps it aligned with the svg layer, and the
    // four docs rastermaps depend on it.
    test("offsets the image within a padded layer, not within the page", () => {
      const padded = createHtmlLayer(
        "#chart-container",
        boundsOf({ width: 400, height: 300, top: 30, left: 40 }),
        { key: "image-padded" }
      );
      const projection = projectionOf();
      padded.call(mapRendererImage().projection(projection).src(SRC).geoBounds(GEO_BOUNDS));
      const node = padded.node() as HTMLElement;
      const topLeft = projection(GEO_BOUNDS[0]) as [number, number];
      expect(node.style.left).toBe("40px");
      expect(node.style.top).toBe("30px");
      expect(image(node)?.style.left).toBe(`${Math.round(topLeft[0])}px`);
    });

    // NOTE: no transition is scheduled, so the image jumps to its new position on a resize rather
    // than animating. Pinned so the port cannot introduce one.
    test("schedules no transition at all", () => {
      const node = render();
      const img = image(node) as Element & { __transition?: unknown };
      expect(img.__transition).toBeUndefined();
    });
  });
});
