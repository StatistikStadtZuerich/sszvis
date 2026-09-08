import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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

  const warnedSpies: { mockRestore: () => void }[] = [];

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    for (const spy of warnedSpies) spy.mockRestore();
    warnedSpies.length = 0;
  });

  /**
   * Captures the warnings a render emits, restoring console.warn afterwards. The renderer warns
   * through sszvis.logger, which delegates to console.warn - spying on the console rather than on
   * the logger keeps the test on the observable output, and the same idiom as the highlight suite.
   */
  const captureWarnings = () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
    });
    warnedSpies.push(spy);
    return warnings;
  };

  const layer = (key?: string) =>
    createHtmlLayer("#chart-container", undefined, { key: key ?? `raster-${++layerKey}` });

  const canvasOf = (node: Element) =>
    node.querySelector<HTMLCanvasElement>("canvas.sszvis-map__rasterimage");

  /**
   * The device pixels per CSS pixel this runner draws at. Every assertion below is written in terms
   * of it rather than assuming 1, so the suite says the same thing on a retina display as in CI.
   */
  const dpr = () => window.devicePixelRatio || 1;

  /** The RGBA of the device pixel the canvas holds for a CSS-pixel coordinate. */
  const pixelAt = (node: Element, x: number, y: number): [number, number, number, number] =>
    devicePixelAt(node, Math.floor(x * dpr()), Math.floor(y * dpr()));

  /** The RGBA of one device pixel, addressed in the bitmap's own coordinates. */
  const devicePixelAt = (node: Element, x: number, y: number): [number, number, number, number] => {
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
      expect(canvasOf(node)?.style.width).toBe("20px");
      expect(canvasOf(node)?.style.height).toBe("20px");
    });

    test("sizes the bitmap in device pixels and pins the CSS size to the layer", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.width).toBe(Math.round(20 * dpr()));
      expect(canvas.height).toBe(Math.round(20 * dpr()));
      expect(canvas.style.width).toBe("20px");
      expect(canvas.style.height).toBe("20px");
    });

    test("scales the drawing context so positions stay in CSS pixels", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      const transform = canvas.getContext("2d")?.getTransform();
      expect(transform?.a).toBe(dpr());
      expect(transform?.d).toBe(dpr());
      // The scale factor is the ratio between the bitmap and the CSS box, whatever the ratio is.
      expect(canvas.width / Number.parseFloat(canvas.style.width)).toBeCloseTo(dpr(), 5);
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
        target.datum([cell(10, 10)]).call(
          raster()
            .position((d: Cell) => [d.x, d.y])
            .fill("#ff0000")
        )
      ).toThrow(new RegExp(`the ${name} property is required`));
      // Nothing is drawn, so no stale canvas is left behind either.
      expect(canvasOf(target.node() as HTMLElement)).toBeNull();
    });

    // Both accessors are validated alongside the dimensions, so a misconfigured raster is named
    // before the canvas is created - and reported for an empty dataset too, which is the state
    // every chart is in before its data load.
    test.each([
      ["position", () => mapRendererRaster().width(20).height(20).fill("#ff0000")],
      [
        "fill",
        () =>
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((d: Cell) => [d.x, d.y]),
      ],
    ])("reports a missing %s, naming the component and the property", (name, raster) => {
      const target = layer();
      expect(() => target.datum([cell(1, 1)]).call(raster())).toThrow(
        new RegExp(`\\[mapRendererRaster\\] the ${name} property is required`)
      );
      // The same report for an empty dataset, which used to hide the misconfiguration entirely,
      // and no canvas left behind either way.
      expect(() => layer().datum([]).call(raster())).toThrow(
        new RegExp(`\\[mapRendererRaster\\] the ${name} property is required`)
      );
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
      ).toThrow(/the width property is required/);
    });

    // A fractional dimension is rounded up, so the raster covers the layers it aligns with rather
    // than falling a hairline short of them. Every docs caller passes a fractional bounds value.
    test("rounds a fractional width and height up to whole pixels", () => {
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
      expect(canvas.style.width).toBe("21px");
      expect(canvas.style.height).toBe("21px");
      expect(canvas.width).toBe(Math.round(21 * dpr()));
      expect(canvas.height).toBe(Math.round(21 * dpr()));
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

    test("gives each keyed raster in one layer its own canvas", () => {
      const target = layer("two-rasters");
      const raster = (key: string, fill: string) =>
        mapRendererRaster()
          .width(20)
          .height(20)
          .position((d: Cell) => [d.x, d.y])
          .fill(fill)
          .cellSide(4)
          .key(key);
      target.datum([cell(4, 4)]).call(raster("below", "#ff0000"));
      target.datum([cell(12, 12)]).call(raster("above", "#0000ff"));
      const node = target.node() as HTMLElement;
      const canvases = node.querySelectorAll<HTMLCanvasElement>("canvas.sszvis-map__rasterimage");
      expect(canvases).toHaveLength(2);
      // Each keeps its own cells, and they stack in the order they were rendered.
      const cellsOf = (canvas: HTMLCanvasElement, x: number, y: number) => {
        const context = canvas.getContext("2d");
        if (!context) throw new Error("no canvas context");
        const { data } = context.getImageData(Math.floor(x * dpr()), Math.floor(y * dpr()), 1, 1);
        return [data[0], data[1], data[2], data[3]];
      };
      expect(cellsOf(canvases[0], 4, 4)).toEqual([255, 0, 0, 255]);
      expect(cellsOf(canvases[0], 12, 12)).toEqual([0, 0, 0, 0]);
      expect(cellsOf(canvases[1], 12, 12)).toEqual([0, 0, 255, 255]);
      expect(canvases[0].getAttribute("data-raster-key")).toBe("below");
      expect(canvases[1].getAttribute("data-raster-key")).toBe("above");
    });

    test("defaults to one raster per layer, so two unkeyed rasters share a canvas", () => {
      expect(mapRendererRaster().key()).toBe("raster");
      const target = layer("one-raster");
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
    });

    test("renders an empty canvas for empty data", () => {
      const node = render([]);
      expect(canvasOf(node)).not.toBeNull();
      expect(pixelAt(node, 10, 10)).toEqual([0, 0, 0, 0]);
    });
  });

  // The runner draws at a ratio of 1, so the scaling is also exercised against a stubbed 2x
  // display - the only way to see the doubled bitmap and the halved device-pixel coordinates
  // deterministically, whatever screen the suite happens to run on.
  describe("on a stubbed 2x display", () => {
    const own = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");

    beforeEach(() => {
      Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
    });

    afterEach(() => {
      if (own) Object.defineProperty(window, "devicePixelRatio", own);
    });

    test("doubles the bitmap while keeping the CSS size at the layer size", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.width).toBe(40);
      expect(canvas.height).toBe(40);
      expect(canvas.style.width).toBe("20px");
      expect(canvas.getContext("2d")?.getTransform().a).toBe(2);
    });

    test("draws a cell at twice its CSS position, at twice the size", () => {
      const node = render([cell(10, 10)], (c) => c.cellSide(4));
      // The 4 CSS pixel cell at (10, 10) covers 16..23 device pixels on both axes.
      expect(devicePixelAt(node, 16, 16)).toEqual([255, 0, 0, 255]);
      expect(devicePixelAt(node, 23, 23)).toEqual([255, 0, 0, 255]);
      expect(devicePixelAt(node, 15, 16)).toEqual([0, 0, 0, 0]);
      expect(devicePixelAt(node, 24, 24)).toEqual([0, 0, 0, 0]);
    });

    test("covers the whole doubled bitmap in debug mode", () => {
      const node = render([], (c) => c.debug(true));
      expect(devicePixelAt(node, 0, 0)).toEqual([255, 0, 0, 51]);
      expect(devicePixelAt(node, 39, 39)).toEqual([255, 0, 0, 51]);
    });
  });

  describe("accessibility", () => {
    test("marks the canvas decorative when no description is given, which is the default", () => {
      expect(mapRendererRaster().alt()).toBe("");
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.getAttribute("aria-hidden")).toBe("true");
      expect(canvas.hasAttribute("role")).toBe(false);
      expect(canvas.hasAttribute("aria-label")).toBe(false);
    });

    test("carries a caller-supplied accessible name and fallback content", () => {
      const canvas = canvasOf(
        render([cell(10, 10)], (c) => c.alt("Population density per hectare"))
      ) as HTMLCanvasElement;
      expect(canvas.getAttribute("role")).toBe("img");
      expect(canvas.getAttribute("aria-label")).toBe("Population density per hectare");
      expect(canvas.textContent).toBe("Population density per hectare");
      expect(canvas.hasAttribute("aria-hidden")).toBe(false);
    });

    test("drops the name again when a later render has none", () => {
      const target = layer("raster-alt");
      const renderWith = (alt: string) =>
        target
          .datum([cell(10, 10)])
          .call(
            mapRendererRaster()
              .width(20)
              .height(20)
              .position((d: Cell) => [d.x, d.y])
              .fill("#ff0000")
              .alt(alt)
          )
          .node() as HTMLElement;
      renderWith("Described");
      const canvas = canvasOf(renderWith("")) as HTMLCanvasElement;
      expect(canvas.hasAttribute("aria-label")).toBe(false);
      expect(canvas.getAttribute("aria-hidden")).toBe("true");
      expect(canvas.textContent).toBe("");
    });

    test("still draws its cells when it is described", () => {
      const node = render([cell(10, 10)], (c) => c.alt("A raster").cellSide(4));
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
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

  // A projection that cannot place a datum fails two ways - d3's own projections answer a
  // non-finite pair for a point outside the clip, a hand-written one may answer nothing at all -
  // and both mean the same thing, so both are reported the same way: the cell is skipped and the
  // render warns once, naming how many cells it could not place. Skipping a stray point silently
  // is defensible; skipping a whole dataset silently is not.
  describe("cells the projection could not place", () => {
    test("skips a cell at a non-finite position and still draws the rest", () => {
      captureWarnings();
      const node = render([cell(Number.NaN, Number.NaN), cell(10, 10)], (c) => c.cellSide(4));
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
      expect(pixelAt(node, 0, 0)).toEqual([0, 0, 0, 0]);
    });

    test("skips a null position rather than taking the whole render down with it", () => {
      const warnings = captureWarnings();
      const node = render([cell(1, 1), cell(10, 10)], (c) =>
        c.cellSide(4).position((d: Cell) => (d.x === 1 ? null : [d.x, d.y]))
      );
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
      expect(warnings).toEqual([
        "[mapRendererRaster] the position property could not place 1 of 2 cells; they were not drawn",
      ]);
    });

    test("skips an undefined position the same way, so the two failures agree", () => {
      const warnings = captureWarnings();
      const node = render([cell(1, 1), cell(10, 10)], (c) =>
        c
          .cellSide(4)
          // @ts-expect-error - the contract says a position accessor returns a pair or null; an
          // accessor answering undefined is a caller error, tolerated as the same failure.
          .position((d: Cell) => (d.x === 1 ? undefined : [d.x, d.y]))
      );
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
      expect(warnings).toEqual([
        "[mapRendererRaster] the position property could not place 1 of 2 cells; they were not drawn",
      ]);
    });

    test("warns once per render, naming how many cells could not be placed", () => {
      const warnings = captureWarnings();
      render(
        [cell(Number.NaN, Number.NaN), cell(1, 1), cell(Number.POSITIVE_INFINITY, 2), cell(10, 10)],
        (c) => c.cellSide(4).position((d: Cell) => (d.x === 1 ? null : [d.x, d.y]))
      );
      expect(warnings).toEqual([
        "[mapRendererRaster] the position property could not place 3 of 4 cells; they were not drawn",
      ]);
    });

    test("stays silent when every cell is placed", () => {
      const warnings = captureWarnings();
      render([cell(4, 4), cell(10, 10)], (c) => c.cellSide(4));
      expect(warnings).toEqual([]);
    });
  });

  // A cellSide of zero or less can never draw the cells asked for - zero draws nothing, and a
  // negative side draws like its positive counterpart, since fillRect normalises a negative
  // rectangle - so it is a misconfiguration rather than a datum that went stale, reported by name
  // like the other required properties instead of leaving a blank or misleading canvas.
  describe("cellSide validation", () => {
    test("defaults to 2", () => {
      expect(mapRendererRaster().cellSide()).toBe(2);
    });

    test("reports a zero cellSide", () => {
      expect(() => render([cell(10, 10)], (c) => c.cellSide(0))).toThrow(
        /\[mapRendererRaster\].*cellSide/
      );
    });

    test("reports a negative cellSide, which used to draw its positive counterpart", () => {
      expect(() => render([cell(10, 10)], (c) => c.cellSide(-4))).toThrow(
        /\[mapRendererRaster\].*cellSide/
      );
    });

    test("reports a non-finite cellSide", () => {
      expect(() => render([cell(10, 10)], (c) => c.cellSide(Number.NaN))).toThrow(
        /\[mapRendererRaster\].*cellSide/
      );
    });

    test("reports the cellSide before any canvas is created", () => {
      const target = layer("raster-bad-cellside");
      expect(() =>
        target.datum([cell(10, 10)]).call(
          mapRendererRaster()
            .width(20)
            .height(20)
            .position((d: Cell) => [d.x, d.y])
            .fill("#ff0000")
            .cellSide(0)
        )
      ).toThrow(/cellSide/);
      expect(canvasOf(target.node() as HTMLElement)).toBeNull();
    });

    test("accepts a fractional cellSide, which is what pixelsFromGeoDistance returns", () => {
      const node = render([cell(10, 10)], (c) => c.cellSide(3.5));
      expect(pixelAt(node, 10, 10)).toEqual([255, 0, 0, 255]);
    });
  });

  describe("known quirks", () => {
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

    // BUG: the component writes no position, so the canvas is only positioned because sszvis.css
    // sets position: absolute on the class - the same dependency as the image renderer. Without
    // that stylesheet the raster sits in the document flow and, without pointer-events: none,
    // swallows the events of the layers beneath it.
    test("relies on the stylesheet for positioning and pointer-events", () => {
      const canvas = canvasOf(render([cell(10, 10)])) as HTMLCanvasElement;
      expect(canvas.style.position).toBe("");
      expect(canvas.style.pointerEvents).toBe("");
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
      expect(canvasOf(node)?.style.width).toBe("40px");
      expect(canvasOf(node)?.width).toBe(Math.round(40 * dpr()));
    });

    // NOTE: a cell edge that falls between device pixels antialiases to partial alpha rather than
    // being snapped. pixelsFromGeoDistance returns a float, so every real raster map has softly
    // composited cell seams - which is also why neighbouring cells do not tile exactly. The cell
    // side is expressed in device pixels here so the edge lands on a half pixel whatever the
    // runner's devicePixelRatio is.
    test("antialiases a cell edge that falls between device pixels", () => {
      const node = render([cell(10, 10)], (c) => c.cellSide(3 / dpr()));
      const centre = Math.round(10 * dpr());
      // The cell covers centre-1.5 .. centre+1.5 device pixels, so its edges are half pixels.
      expect(devicePixelAt(node, centre, centre)).toEqual([255, 0, 0, 255]);
      const edge = devicePixelAt(node, centre - 2, centre);
      expect(edge[3]).toBeGreaterThan(0);
      expect(edge[3]).toBeLessThan(255);
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
      const { data } = context.getImageData(Math.floor(10 * dpr()), Math.floor(10 * dpr()), 1, 1);
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
