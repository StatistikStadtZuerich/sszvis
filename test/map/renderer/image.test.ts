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

    test("sizes the image from the distance between the projected corners", () => {
      const projection = projectionOf();
      const node = layer()
        .call(mapRendererImage().projection(projection).src(SRC).geoBounds(GEO_BOUNDS))
        .node() as HTMLElement;
      const topLeft = projection(GEO_BOUNDS[0]) as [number, number];
      const bottomRight = projection(GEO_BOUNDS[1]) as [number, number];
      expect(image(node)?.style.width).toBe(`${Math.round(bottomRight[0] - topLeft[0])}px`);
      expect(image(node)?.style.height).toBe(`${Math.round(bottomRight[1] - topLeft[1])}px`);
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

  describe("known quirks", () => {
    // BUG: the image carries no alt attribute and no role, and the component offers no property
    // for one, so a topographic layer is announced by screen readers as an unlabelled image. All
    // six docs examples ship this.
    test("renders no alt text and offers no way to supply one", () => {
      const node = render();
      expect(image(node)?.hasAttribute("alt")).toBe(false);
      expect(image(node)?.hasAttribute("role")).toBe(false);
    });

    // BUG: the component writes left and top but never position, so both are inert unless
    // sszvis.css is loaded - it is the stylesheet that sets position: absolute, along with
    // display: block and pointer-events: none. Without it the image sits in the document flow at
    // the computed pixel size, unoffset and clickable, which is not a recognisable failure.
    test("relies on the stylesheet for the positioning it depends on", () => {
      const node = render();
      expect(image(node)?.style.position).toBe("");
      expect(image(node)?.style.left).not.toBe("");
    });

    // BUG: the width is the rounded difference of the unrounded corners, while left is the rounded
    // north-west corner - so left + width does not necessarily equal the rounded south-east
    // corner. The image's right and bottom edges can sit a pixel off the map layers it is meant
    // to align with. Rounding each corner first, then subtracting, would keep them consistent.
    test("can place the right edge a pixel off the projected south-east corner", () => {
      // Corners chosen so that both roundings go different ways: x from 10.6 to 20.4.
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
      // The right edge lands at 11 + 10 = 21px, though the projected corner rounds to 20px.
      expect(image(node)?.style.width).toBe("10px"); // Math.round(20.4 - 10.6) = 10
    });

    // BUG: neither geoBounds nor projection is validated. A missing geoBounds throws a bare
    // TypeError from indexing undefined, and a missing projection throws from calling it - both
    // before any attribute is written, so the failure names neither property.
    test("throws when geoBounds is missing", () => {
      expect(() => layer().call(mapRendererImage().projection(projectionOf()).src(SRC))).toThrow(
        TypeError
      );
    });

    test("throws when the projection is missing", () => {
      expect(() => layer().call(mapRendererImage().src(SRC).geoBounds(GEO_BOUNDS))).toThrow(
        TypeError
      );
    });

    // NOTE: the img element is appended before the corners are projected, so a throw from the
    // projection leaves a classed, empty img in the layer. Unlike the map renderers this one has
    // no geometry to lose, but the element is still there on the next render.
    test("leaves a classed img behind when the projection throws", () => {
      const target = layer("image-throwing-projection");
      expect(() =>
        target.call(
          mapRendererImage()
            .projection(() => {
              throw new Error("nope");
            })
            .src(SRC)
            .geoBounds(GEO_BOUNDS)
        )
      ).toThrow();
      expect(image(target.node() as HTMLElement)).not.toBeNull();
      expect(image(target.node() as HTMLElement)?.hasAttribute("src")).toBe(false);
    });

    // NOTE: the projection's return value is indexed without a guard, so a projection that
    // answers null for a point it cannot place throws a bare TypeError. d3's own projections
    // return a point for every input when called directly - clipAngle and clipExtent apply to
    // streams, not to this call form - so this only bites a caller-supplied projection.
    test("throws when the projection returns null for a corner", () => {
      expect(() =>
        layer().call(
          mapRendererImage()
            .projection(() => null)
            .src(SRC)
            .geoBounds(GEO_BOUNDS)
        )
      ).toThrow(TypeError);
    });

    // Both corners are projected, and the src is written, before the coordinates are read - so the
    // throw above leaves an img that has its src but no position. Pinned because it is the kind of
    // ordering a port could quietly change by validating the corners up front.
    test("writes the src and projects both corners before failing on a null result", () => {
      const target = layer("image-null-projection");
      let calls = 0;
      expect(() =>
        target.call(
          mapRendererImage()
            .projection(() => {
              calls += 1;
              return null;
            })
            .src(SRC)
            .geoBounds(GEO_BOUNDS)
        )
      ).toThrow(TypeError);
      expect(calls).toBe(2);
      const node = target.node() as HTMLElement;
      expect(image(node)?.getAttribute("src")).toBe(SRC);
      expect(image(node)?.style.left).toBe("");
    });

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

    // BUG: the join binds [0] rather than the src, so one image per container is the documented
    // limit - and the selector is unscoped, so a second image renderer in the same layer replaces
    // the first one's src and position instead of adding its own. The same defect as the mesh,
    // highlight and lake overlay renderers.
    test("a second image renderer in one layer replaces the first", () => {
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
      expect(node.querySelectorAll("img.sszvis-map__image")).toHaveLength(1);
      expect(image(node)).toBe(first);
      expect(image(node)?.getAttribute("src")).toBe("data:image/gif;base64,OTHER");
      expect(image(node)?.style.opacity).toBe("0.5");
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

    // BUG: a missing src is not reported. d3 removes an attribute set to undefined, so the
    // component renders a fully positioned, correctly sized img with no src at all - which the
    // browser shows as a broken image, or as nothing, depending on the layout.
    test("renders a positioned img with no src when src is missing", () => {
      const node = layer()
        .call(mapRendererImage().projection(projectionOf()).geoBounds(GEO_BOUNDS))
        .node() as HTMLElement;
      expect(image(node)?.hasAttribute("src")).toBe(false);
      expect(image(node)?.style.left).not.toBe("");
    });

    // BUG: the corners are subtracted in the order given, so passing the south-east corner first -
    // the mistake the docs examples guard against with an "Expects longitude, latitude" comment -
    // yields negative widths and heights. The CSS parser drops those, so the image is positioned
    // but unsized, with no error.
    test("silently unsizes the image when geoBounds is inverted", () => {
      const node = layer()
        .call(
          mapRendererImage()
            .projection(projectionOf())
            .src(SRC)
            .geoBounds([GEO_BOUNDS[1], GEO_BOUNDS[0]])
        )
        .node() as HTMLElement;
      expect(image(node)?.style.width).toBe("");
      expect(image(node)?.style.height).toBe("");
      expect(image(node)?.style.left).not.toBe("");
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
    // two docs rastermaps depend on it.
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
