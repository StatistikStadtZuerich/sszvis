import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createHtmlLayer } from "../../../src/createHtmlLayer.js";
import mapRendererRaster from "../../../src/map/renderer/raster.js";

interface Cell {
  x: number;
  y: number;
  value?: number;
}

const cell = (x: number, y: number, value = 1): Cell => ({ x, y, value });

describe("map/renderer/raster", () => {
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
    createHtmlLayer("#chart-container", undefined, { key: key ?? `raster-${++layerKey}` });

  const canvasOf = (node: Element) =>
    node.querySelector<HTMLCanvasElement>("canvas.sszvis-map__rasterimage");

  /** The RGBA of one device pixel, as the canvas actually holds it. */
  const pixelAt = (node: Element, x: number, y: number): [number, number, number, number] => {
    const context = canvasOf(node)?.getContext("2d");
    if (!context) throw new Error("no canvas context");
    const { data } = context.getImageData(x, y, 1, 1);
    return [data[0], data[1], data[2], data[3]];
  };

  /** Renders the raster over the given data, returning the layer node it drew into. */
  const render = (
    data: Cell[],
    configure: (c: ReturnType<typeof mapRendererRaster>) => ReturnType<typeof mapRendererRaster> = (
      c
    ) => c,
    key?: string
  ) => {
    const component = configure(
      mapRendererRaster()
        .width(20)
        .height(20)
        .position((d: Cell) => [d.x, d.y])
        .fill("#ff0000")
    );
    return layer(key).datum(data).call(component).node() as HTMLElement;
  };

  describe("rendering", () => {
    test("renders one classed canvas at the given width and height", () => {
      const node = render([cell(10, 10)]);
      expect(node.querySelectorAll("canvas.sszvis-map__rasterimage")).toHaveLength(1);
      expect(canvasOf(node)?.getAttribute("width")).toBe("20");
      expect(canvasOf(node)?.getAttribute("height")).toBe("20");
    });

    test("fills one cell per datum, in the fill colour", () => {
      const node = render([cell(4, 4), cell(12, 12)], (c) => c.cellSide(4));
      expect(pixelAt(node, 4, 4)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 12, 12)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 18, 18)).toEqual([0, 0, 0, 0]);
    });

    test("centres each cell on its position", () => {
      // A 4px cell at (10, 10) covers 8..11 on both axes.
      const node = render([cell(10, 10)], (c) => c.cellSide(4));
      expect(pixelAt(node, 8, 8)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 11, 11)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 7, 10)).toEqual([0, 0, 0, 0]);
      expect(pixelAt(node, 12, 10)).toEqual([0, 0, 0, 0]);
    });

    test("defaults to a two pixel cell", () => {
      expect(mapRendererRaster().cellSide()).toBe(2);
      const node = render([cell(10, 10)]);
      expect(pixelAt(node, 9, 9)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 8, 8)).toEqual([0, 0, 0, 0]);
    });

    test("calls position and fill once per datum, with the datum", () => {
      const positions: Cell[] = [];
      const fills: Cell[] = [];
      const data = [cell(4, 4), cell(12, 12)];
      layer()
        .datum(data)
        .call(
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((d: Cell) => {
              positions.push(d);
              return [d.x, d.y];
            })
            .fill((d: Cell) => {
              fills.push(d);
              return "#00ff00";
            })
        );
      expect(positions).toEqual(data);
      expect(fills).toEqual(data);
    });

    test("takes a constant fill colour", () => {
      const node = render([cell(10, 10)], (c) => c.fill("#0000ff").cellSide(4));
      expect(pixelAt(node, 10, 10)).toEqual([0, 0, 255, 255]);
    });

    test("leaves a cell unpainted when its fill does not parse", () => {
      const node = render([cell(4, 4), cell(12, 12)], (c) =>
        c.cellSide(4).fill((d: Cell) => (d.x === 4 ? "#00ff00" : "not-a-colour"))
      );
      expect(pixelAt(node, 4, 4)).toEqual([0, 255, 0, 255]);
      expect(pixelAt(node, 12, 12)).toEqual([0, 0, 0, 0]);
    });

    test("leaves a cell unpainted when its fill is undefined", () => {
      const node = render([cell(4, 4), cell(12, 12)], (c) =>
        c.cellSide(4).fill(
          // @ts-expect-error - an accessor returning undefined is a caller error; pinned because
          // the cell must be skipped rather than inherit the previous cell's colour.
          (d: Cell) => (d.x === 4 ? "#00ff00" : undefined)
        )
      );
      expect(pixelAt(node, 4, 4)).toEqual([0, 255, 0, 255]);
      expect(pixelAt(node, 12, 12)).toEqual([0, 0, 0, 0]);
    });

    test("keeps debug mode additive when a fill does not parse", () => {
      const node = render([cell(10, 10)], (c) =>
        c
          .debug(true)
          .cellSide(4)
          .fill(() => "not-a-colour")
      );
      // Only the debug rectangle, not a cell composited on top of it.
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 51]);
      expect(pixelAt(node, 0, 0)).toEqual([255, 0, 0, 51]);
    });

    test("clears the canvas before redrawing", () => {
      const target = layer("raster-clear");
      const renderWith = (data: Cell[]) =>
        target
          .datum(data)
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
              .cellSide(4)
          )
          .node() as HTMLElement;
      renderWith([cell(4, 4)]);
      const node = renderWith([cell(12, 12)]);
      expect(pixelAt(node, 12, 12)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 4, 4)).toEqual([0, 0, 0, 0]);
    });

    test.each([
      ["width", () => mapRendererRaster().height(20)],
      ["height", () => mapRendererRaster().width(20)],
    ])("reports a missing %s rather than sizing the canvas by default", (name, raster) => {
      const target = layer();
      expect(() =>
        target
          .datum([cell(10, 10)])
          .call(
            raster()
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
          )
      ).toThrow(new RegExp(`${name} is required`));
      // Nothing is drawn, so no stale canvas is left behind either.
      expect(canvasOf(target.node() as HTMLElement)).toBeNull();
    });

    test.each([Number.NaN, -1])("reports a nonsensical dimension (%s)", (width) => {
      expect(() =>
        layer()
          .datum([cell(10, 10)])
          .call(
            mapRendererRaster()
              .width(width)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
          )
      ).toThrow(/width is required/);
    });

    test("reuses the same canvas element across renders", () => {
      const target = layer("raster-reuse");
      const renderWith = () =>
        target
          .datum([cell(10, 10)])
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
          )
          .node() as HTMLElement;
      const first = canvasOf(renderWith());
      expect(canvasOf(renderWith())).toBe(first);
    });

    test("renders an empty canvas for empty data", () => {
      const node = render([]);
      expect(canvasOf(node)).not.toBeNull();
      expect(pixelAt(node, 10, 10)).toEqual([0, 0, 0, 0]);
    });
  });

  describe("opacity and debug", () => {
    test("defaults to fully opaque", () => {
      expect(mapRendererRaster().opacity()).toBe(1);
      expect(canvasOf(render([cell(10, 10)]))?.style.opacity).toBe("1");
    });

    test("takes an opacity as a style on the canvas, not in the pixels", () => {
      const node = render([cell(10, 10)], (c) => c.opacity(0.4).cellSide(4));
      expect(canvasOf(node)?.style.opacity).toBe("0.4");
      // The cell itself is still drawn fully opaque; the layer is what fades.
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
    });

    test("draws nothing extra when debug is off, which is the default", () => {
      expect(mapRendererRaster().debug()).toBe(false);
      expect(pixelAt(render([]), 1, 1)).toEqual([0, 0, 0, 0]);
    });

    // NOTE: no docs example can actually turn this on - rastermap-gradient.js guards the
    // debug(DEBUG) call with `if (DEBUG)` on a hardcoded false, and the other three never touch
    // the property - so these two tests are the only exercise the feature gets.
    test("covers the whole canvas with a translucent red in debug mode", () => {
      const node = render([], (c) => c.debug(true));
      expect(pixelAt(node, 0, 0)).toEqual([255, 0, 0, 51]);
      expect(pixelAt(node, 19, 19)).toEqual([255, 0, 0, 51]);
    });
  });

  describe("known quirks", () => {
    // BUG: the bitmap is sized in CSS pixels - the width and height attributes are the layer
    // dimensions, with no devicePixelRatio factor and no compensating style width - so on a
    // display with a device pixel ratio above 1 the bitmap is stretched across more device pixels
    // than it has. The cells come out soft while the SVG layers over them stay sharp. The usual
    // fix is a bitmap of width * dpr with the CSS size pinned to width.
    test("sizes the bitmap in CSS pixels, ignoring devicePixelRatio", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.width).toBe(20);
      expect(canvas.style.width).toBe("");
    });

    // BUG: the data are iterated without a guard, and createHtmlLayer binds 0 as its own datum -
    // so a layer the caller forgot to hand data to throws "data is not iterable" rather than
    // rendering nothing. The canvas has already been created by then, so the layer is left with an
    // empty one.
    test("throws when the layer has no data of its own bound", () => {
      const target = layer("raster-no-data");
      expect(() =>
        target.call(
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((d: Cell) => [d.x, d.y])
            .fill("#ff0000")
        )
      ).toThrow(TypeError);
      expect(canvasOf(target.node() as HTMLElement)).not.toBeNull();
    });

    // BUG: neither accessor is validated either. A missing position or fill throws a bare
    // TypeError from calling undefined, once per render, naming neither property - and only when
    // the data are non-empty, so an empty dataset hides the misconfiguration entirely.
    test("throws when position is missing, but only for non-empty data", () => {
      const raster = () => mapRendererRaster().width(20).height(20).fill("#ff0000");
      expect(() =>
        layer()
          .datum([cell(1, 1)])
          .call(raster())
      ).toThrow(TypeError);
      expect(() => layer().datum([]).call(raster())).not.toThrow();
    });

    test("throws when fill is missing, but only for non-empty data", () => {
      const raster = () =>
        mapRendererRaster()
          .width(20)
          .height(20)
          .position((d: Cell) => [d.x, d.y]);
      expect(() =>
        layer()
          .datum([cell(1, 1)])
          .call(raster())
      ).toThrow(TypeError);
      expect(() => layer().datum([]).call(raster())).not.toThrow();
    });

    // NOTE: a non-finite position is dropped by the canvas API rather than reported, so a datum
    // the projection could not place leaves a hole in the raster with no indication.
    test("silently skips a cell at a non-finite position", () => {
      const node = render([cell(Number.NaN, Number.NaN), cell(10, 10)], (c) => c.cellSide(4));
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 0, 0)).toEqual([0, 0, 0, 0]);
    });

    // A null position throws instead, from indexing it - so the two ways a projection can fail to
    // place a point fail differently. The message is asserted because the guard is a strict null
    // check on purpose: loosening it to a nullish check would swallow the undefined case below.
    test("throws when position returns null", () => {
      expect(() =>
        layer()
          .datum([cell(1, 1)])
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              .position(() => null)
              .fill("#ff0000")
          )
      ).toThrow(new TypeError("Cannot read properties of null (reading '0')"));
    });

    // The other half of that distinction: an undefined position falls through the strict null check
    // and is indexed, so the error comes from the engine and names undefined, not null. A nullish
    // guard would report null for both and lose the difference.
    test("throws the engine's own undefined error when position returns undefined", () => {
      expect(() =>
        layer()
          .datum([cell(1, 1)])
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              // @ts-expect-error - a position accessor returning undefined is a caller error;
              // pinned because it fails with a different error than the null case.
              .position(() => undefined)
              .fill("#ff0000")
          )
      ).toThrow(/Cannot read properties of undefined/);
    });

    // NOTE: a zero cellSide draws nothing at all, which is indistinguishable from data that fell
    // outside the canvas.
    test("draws nothing for a zero cellSide", () => {
      const node = render([cell(10, 10)], (c) => c.cellSide(0));
      expect(pixelAt(node, 10, 10)).toEqual([0, 0, 0, 0]);
    });

    // NOTE: a negative cellSide is neither rejected nor distinguishable: the half-side offset and
    // the width negate each other, and fillRect normalises a negative rectangle - so cellSide(-4)
    // paints exactly the pixels cellSide(4) does. Pinned because it is surprising, and because a
    // future validation would change it.
    test("draws a negative cellSide as the same cell as its positive counterpart", () => {
      const negative = render([cell(10, 10)], (c) => c.cellSide(-4));
      const positive = render([cell(10, 10)], (c) => c.cellSide(4));
      for (const [x, y] of [
        [8, 8],
        [11, 11],
        [12, 12],
      ]) {
        expect(pixelAt(negative, x, y)).toEqual(pixelAt(positive, x, y));
      }
      expect(pixelAt(negative, 8, 8)).toEqual([255, 0, 0, 255]);
    });

    // BUG: the component writes no position, so the canvas is only positioned because sszvis.css
    // sets position: absolute on the class - the same dependency as the image renderer. Without
    // that stylesheet the raster sits in the document flow and, without pointer-events: none,
    // swallows the events of the layers beneath it.
    test("relies on the stylesheet for positioning and pointer-events", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.style.position).toBe("");
      expect(canvas.style.pointerEvents).toBe("");
    });

    // BUG: the selector is unscoped and the join binds a placeholder, so a second raster renderer
    // in the same layer redraws the first one's canvas instead of adding its own. The same defect
    // as the mesh, highlight, lake overlay and image renderers.
    test("a second raster renderer in one layer redraws the first", () => {
      const target = layer("two-rasters");
      const raster = (fill: string) =>
        mapRendererRaster()
          .width(20)
          .height(20)
          .position((d: Cell) => [d.x, d.y])
          .fill(fill)
          .cellSide(4);
      target.datum([cell(4, 4)]).call(raster("#ff0000"));
      const first = canvasOf(target.node() as HTMLElement);
      target.datum([cell(12, 12)]).call(raster("#0000ff"));
      const node = target.node() as HTMLElement;
      expect(node.querySelectorAll("canvas.sszvis-map__rasterimage")).toHaveLength(1);
      expect(canvasOf(node)).toBe(first);
      expect(pixelAt(node, 12, 12)).toEqual([0, 0, 255, 255]);
      expect(pixelAt(node, 4, 4)).toEqual([0, 0, 0, 0]);
    });

    // BUG: a fractional width is truncated to an integer bitmap, and every docs caller passes
    // bounds.innerWidth, which is routinely fractional - so a raster layer is up to a pixel
    // narrower and shorter than the SVG layers it has to line up with.
    test("truncates a fractional width and height", () => {
      const node = layer()
        .datum([cell(10, 10)])
        .call(
          mapRendererRaster()
            .width(20.5)
            .height(20.9)
            .position((d: Cell) => [d.x, d.y])
            .fill("#ff0000")
        )
        .node() as HTMLElement;
      const canvas = canvasOf(node) as HTMLCanvasElement;
      expect(canvas.getAttribute("width")).toBe("20.5");
      expect(canvas.width).toBe(20);
      expect(canvas.height).toBe(20);
    });

    // NOTE: a change of dimensions resizes the existing canvas rather than replacing it, which is
    // what makes the bitmap reset double as the clear.
    test("resizes the existing canvas when the dimensions change", () => {
      const target = layer("raster-resize");
      const renderWith = (width: number) =>
        target
          .datum([cell(4, 4)])
          .call(
            mapRendererRaster()
              .width(width)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
          )
          .node() as HTMLElement;
      const first = canvasOf(renderWith(20));
      const node = renderWith(40);
      expect(canvasOf(node)).toBe(first);
      expect(canvasOf(node)?.width).toBe(40);
    });

    // NOTE: a fractional cellSide puts the cell edges on half pixels, so they antialias to partial
    // alpha rather than being snapped. pixelsFromGeoDistance returns a float, so every real raster
    // map has softly composited cell seams - which is also why neighbouring cells do not tile
    // exactly.
    test("antialiases the edges of an odd cellSide", () => {
      const node = render([cell(10, 10)], (c) => c.cellSide(3));
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 8, 10)[3]).toBeGreaterThan(0);
      expect(pixelAt(node, 8, 10)[3]).toBeLessThan(255);
    });

    // NOTE: position and fill are called with the datum only - no index, no array - unlike a d3
    // accessor. The render callback itself does receive d3's (data, index, group).
    test("calls the accessors with the datum only", () => {
      const seen: unknown[][] = [];
      layer()
        .datum([cell(4, 4)])
        .call(
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((...args: unknown[]) => {
              seen.push(args);
              return [4, 4];
            })
            .fill((...args: unknown[]) => {
              seen.push(args);
              return "#ff0000";
            })
        );
      expect(seen).toHaveLength(2);
      expect(seen[0]).toHaveLength(1);
      expect(seen[1]).toHaveLength(1);
    });

    // NOTE: a zero opacity hides the layer but still draws every cell - there is no early return -
    // so a hidden raster costs as much as a visible one.
    test("draws every cell even at zero opacity", () => {
      const node = render([cell(10, 10)], (c) => c.opacity(0).cellSide(4));
      expect(canvasOf(node)?.style.opacity).toBe("0");
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
    });

    // NOTE: nothing ties this component to an HTML layer. Called on an SVG selection the join
    // creates an SVG-namespaced canvas, which has no getContext, so it throws - where the image
    // renderer silently appends an unrenderable img instead.
    test("throws when called on an svg selection", async () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      container.appendChild(svg);
      const { select } = await import("d3");
      expect(() =>
        select(svg)
          .datum([cell(4, 4)])
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
          )
      ).toThrow(TypeError);
    });

    // NOTE: the context is fetched by testing for a getContext method rather than with
    // `instanceof HTMLCanvasElement`, which would reject a canvas created by another realm's
    // document. An iframe's canvas is such a case, and the JavaScript drew onto it happily.
    test("draws onto a canvas owned by an iframe document", async () => {
      const frame = document.createElement("iframe");
      container.appendChild(frame);
      const frameDocument = frame.contentDocument;
      if (!frameDocument) throw new Error("no iframe document");

      const host = frameDocument.createElement("div");
      frameDocument.body.appendChild(host);

      const { select } = await import("d3");
      const node = select(host)
        .datum([cell(10, 10)])
        .call(
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((d: Cell) => [d.x, d.y])
            .fill("#ff0000")
            .cellSide(4)
        )
        .node() as HTMLElement;

      const canvas = node.querySelector<HTMLCanvasElement>("canvas.sszvis-map__rasterimage");
      expect(canvas).not.toBeNull();
      // The proof this is cross-realm: it is a canvas, but not this realm's HTMLCanvasElement.
      expect(canvas).not.toBeInstanceOf(HTMLCanvasElement);
      const context = canvas?.getContext("2d");
      if (!context) throw new Error("no canvas context");
      const { data } = context.getImageData(10, 10, 1, 1);
      expect([data[0], data[1], data[2], data[3]]).toEqual([255, 0, 0, 255]);
    });

    // NOTE: the canvas is appended to the layer rather than positioned within it, so it stacks
    // over whatever the layer already holds - which is what rastermap-bins relies on when it calls
    // the image renderer and then the raster renderer on the same layer.
    test("appends the canvas after an existing image in the same layer", async () => {
      const { default: mapRendererImage } = await import("../../../src/map/renderer/image.js");
      const target = layer("raster-over-image");
      target.call(
        mapRendererImage()
          .projection((p: [number, number]) => [p[0], p[1]])
          .src("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
          .geoBounds([
            [0, 0],
            [20, 20],
          ])
      );
      target.datum([cell(10, 10)]).call(
        mapRendererRaster()
          .width(20)
          .height(20)
          .position((d: Cell) => [d.x, d.y])
          .fill("#ff0000")
      );
      const node = target.node() as HTMLElement;
      const children = [...node.children].map((child) => child.tagName);
      expect(children).toEqual(["IMG", "CANVAS"]);
    });

    // NOTE: the positions are written unshifted and createHtmlLayer offsets the layer itself by
    // the bounds padding, so cell positions are layer-relative and the padding is applied exactly
    // once. All four docs callers pass a padded bounds, and this is what keeps the raster aligned
    // with the svg layer.
    test("draws at layer-relative positions inside a padded layer", async () => {
      const { bounds: boundsOf } = await import("../../../src/bounds.js");
      const padded = createHtmlLayer(
        "#chart-container",
        boundsOf({ width: 400, height: 300, top: 30, left: 40 }),
        { key: "raster-padded" }
      );
      padded.datum([cell(4, 4)]).call(
        mapRendererRaster()
          .width(20)
          .height(20)
          .position((d: Cell) => [d.x, d.y])
          .fill("#ff0000")
          .cellSide(4)
      );
      const node = padded.node() as HTMLElement;
      expect(node.style.left).toBe("40px");
      expect(pixelAt(node, 4, 4)).toEqual([255, 0, 0, 255]);
    });

    // NOTE: no transition is scheduled - a canvas cannot be transitioned by d3 anyway - so the
    // raster repaints instantly on every render. Pinned so the port cannot introduce one.
    test("schedules no transition at all", () => {
      const node = render([cell(10, 10)]);
      const canvas = canvasOf(node) as Element & { __transition?: unknown };
      expect(canvas.__transition).toBeUndefined();
    });
  });
});
