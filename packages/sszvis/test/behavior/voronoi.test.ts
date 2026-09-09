import * as d3 from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import voronoi, { type VoronoiBounds } from "../../src/behavior/voronoi.js";
import { bounds } from "../../src/bounds.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";

type TestDataPoint = {
  id: number;
  name: string;
  value: number;
  x: number;
  y: number;
};

type NestedDataPoint = {
  position: {
    horizontal: number;
    vertical: number;
  };
  info: string;
};

// Helper function to create test data
const testData: TestDataPoint[] = [
  { id: 1, name: "Point A", value: 10, x: 100, y: 100 },
  { id: 2, name: "Point B", value: 20, x: 200, y: 150 },
  { id: 3, name: "Point C", value: 30, x: 300, y: 120 },
  { id: 4, name: "Point D", value: 40, x: 150, y: 200 },
];

describe("behavior/voronoi", () => {
  let container: HTMLDivElement;
  let svg: LayerSelection<SVGGElement, number>;
  let chartBounds: ReturnType<typeof bounds>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);
    chartBounds = bounds({
      width: 400,
      height: 300,
      top: 20,
      right: 20,
      bottom: 30,
      left: 40,
    });
    svg = createSvgLayer(container, chartBounds);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  test("should create component with proper API and require bounds", () => {
    const xAccessor = (d: TestDataPoint) => d.x;
    const yAccessor = (d: TestDataPoint) => d.y;
    const testBounds: VoronoiBounds = [0, 0, 400, 300];
    const chainedComponent = voronoi<TestDataPoint>()
      .x(xAccessor)
      .y(yAccessor)
      .bounds(testBounds)
      .debug(true);
    expect(chainedComponent.x()).toBe(xAccessor);
    expect(chainedComponent.y()).toBe(yAccessor);
    expect(chainedComponent.bounds()).toBe(testBounds);
    expect(chainedComponent.debug()).toBe(true);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const selection = svg
      .selectAll("g.voronoi-layer")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-layer");
    selection.call(
      voronoi<TestDataPoint>()
        .x((d) => d.x)
        .y((d) => d.y),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith("behavior.voronoi - requires bounds");
    consoleErrorSpy.mockRestore();
  });

  test("should create voronoi cells with debug mode support", () => {
    const normalSelection = svg
      .selectAll("g.voronoi-normal")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-normal");
    normalSelection.call(
      voronoi<TestDataPoint>()
        .x((d) => d.x)
        .y((d) => d.y)
        .bounds([0, 0, 400, 300]),
    );
    const voronoiPaths = svg.selectAll("[data-sszvis-behavior-voronoi]");
    expect(voronoiPaths.size()).toBe(testData.length);
    voronoiPaths.each(function () {
      const path = d3.select(this);
      expect(path.attr("data-sszvis-behavior-voronoi")).toBe("");
      expect(path.attr("data-sszvis-behavior-pannable")).toBe("");
      expect(path.classed("sszvis-interactive")).toBe(true);
      expect(path.attr("fill")).toBe("transparent");
      expect(path.attr("d")).toMatch(/^M[\d.,\-\sL]+Z$/); // SVG path format
      expect(path.attr("stroke")).toBeNull(); // No debug stroke
    });
    svg.selectAll("*").remove(); // Clear previous paths
    svg
      .selectAll("g.voronoi-debug")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-debug")
      .call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([0, 0, 400, 300])
          .debug(true),
      );
    svg.selectAll("[data-sszvis-behavior-voronoi]").each(function () {
      const path = d3.select(this);
      expect(path.attr("stroke")).toBe("#f00"); // Debug stroke enabled
    });
  });

  test("should handle mouse interaction", () => {
    const overHandler = vi.fn();
    const outHandler = vi.fn();
    svg
      .selectAll("g.voronoi-layer")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-layer")
      .call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    const firstPath = svg.selectAll("[data-sszvis-behavior-voronoi]").nodes()[0] as SVGPathElement;
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 100, // Near first data point
        clientY: svgRect.top + 100,
        bubbles: true,
      }),
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    expect(overHandler.mock.calls[0][1]).toEqual(testData[0]); // Correct data passed
    firstPath.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: svgRect.left + 105, // Close to first point
        clientY: svgRect.top + 105,
        bubbles: true,
      }),
    );
    expect(overHandler).toHaveBeenCalledTimes(2);
    firstPath.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: svgRect.left + 50, // Far from any data point
        clientY: svgRect.top + 50,
        bubbles: true,
      }),
    );
    expect(outHandler).toHaveBeenCalledTimes(1);
    firstPath.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(outHandler).toHaveBeenCalledTimes(2);
  });

  test("should handle touch interactions", () => {
    const overHandler = vi.fn();
    const outHandler = vi.fn();
    svg
      .selectAll("g.voronoi-layer")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-layer")
      .call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    const firstPath = svg.selectAll("[data-sszvis-behavior-voronoi]").nodes()[0] as SVGPathElement;
    const nearTouch = {
      clientX: svgRect.left + 100,
      clientY: svgRect.top + 100,
      identifier: 0,
      pageX: svgRect.left + 100,
      pageY: svgRect.top + 100,
      screenX: 100,
      screenY: 100,
      target: firstPath,
      force: 1,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
    } as Touch;
    const nearTouchEvent = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(nearTouchEvent, "touches", { value: [nearTouch], writable: false });
    Object.defineProperty(nearTouchEvent, "clientX", { value: nearTouch.clientX, writable: false });
    Object.defineProperty(nearTouchEvent, "clientY", { value: nearTouch.clientY, writable: false });
    const preventDefaultSpy = vi.spyOn(nearTouchEvent, "preventDefault");
    firstPath.dispatchEvent(nearTouchEvent);
    expect(overHandler).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(overHandler.mock.calls[0][1]).toEqual(testData[0]);
    firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
    expect(outHandler).toHaveBeenCalledTimes(1);
    const pathSelection = d3.select(firstPath);
    expect(pathSelection.on("touchmove")).toBeUndefined();
    expect(pathSelection.on("touchend")).toBeUndefined();
    overHandler.mockClear();
    const farTouch = {
      clientX: svgRect.left + 50, // Far from data points
      clientY: svgRect.top + 50,
      identifier: 0,
      pageX: svgRect.left + 50,
      pageY: svgRect.top + 50,
      screenX: 50,
      screenY: 50,
      target: firstPath,
      force: 1,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
    } as Touch;
    const farTouchEvent = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(farTouchEvent, "touches", { value: [farTouch], writable: false });
    Object.defineProperty(farTouchEvent, "clientX", { value: farTouch.clientX, writable: false });
    Object.defineProperty(farTouchEvent, "clientY", { value: farTouch.clientY, writable: false });
    firstPath.dispatchEvent(farTouchEvent);
    expect(overHandler).toHaveBeenCalledTimes(0);
  });

  test("should respect maximum interaction radius", () => {
    const overHandler = vi.fn();
    const testData = [{ id: 1, name: "Single Point", x: 200, y: 150, value: 10 }]; // Single point for clear testing
    svg
      .selectAll("g.voronoi-layer")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-layer")
      .call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler),
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    const firstPath = svg.selectAll("[data-sszvis-behavior-voronoi]").nodes()[0] as SVGPathElement;
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 200,
        clientY: svgRect.top + 150,
        bubbles: true,
      }),
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    overHandler.mockClear();
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 210, // 10px away horizontally
        clientY: svgRect.top + 155, // 5px away vertically (total ~11px)
        bubbles: true,
      }),
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    overHandler.mockClear();
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 220, // 20px away horizontally
        clientY: svgRect.top + 170, // 20px away vertically (total ~28px)
        bubbles: true,
      }),
    );
    expect(overHandler).toHaveBeenCalledTimes(0);
  });

  test("should handle custom accessor", () => {
    const overHandler = vi.fn();
    svg
      .selectAll("g.voronoi-standard")
      .data([testData])
      .join("g")
      .attr("class", "voronoi-standard")
      .call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler),
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    let voronoiPaths = svg.selectAll("[data-sszvis-behavior-voronoi]");
    testData.forEach((expectedDatum, index) => {
      const mouseEvent = new MouseEvent("mouseover", {
        clientX: svgRect.left + expectedDatum.x,
        clientY: svgRect.top + expectedDatum.y,
        bubbles: true,
      });
      (voronoiPaths.nodes()[index] as SVGPathElement).dispatchEvent(mouseEvent);
    });
    expect(overHandler).toHaveBeenCalledTimes(testData.length);
    overHandler.mock.calls.forEach((call, index) => {
      const [event, datum] = call;
      expect(event).toBeInstanceOf(MouseEvent);
      expect(datum).toEqual(testData[index]);
    });
    svg.selectAll("*").remove();
    overHandler.mockClear();
    const nestedData = [
      { position: { horizontal: 100, vertical: 120 }, info: "A" },
      { position: { horizontal: 200, vertical: 180 }, info: "B" },
    ];
    svg
      .selectAll("g.voronoi-nested")
      .data([nestedData])
      .join("g")
      .attr("class", "voronoi-nested")
      .call(
        voronoi<NestedDataPoint>()
          .x((d) => d.position.horizontal)
          .y((d) => d.position.vertical)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler),
      );
    voronoiPaths = svg.selectAll("[data-sszvis-behavior-voronoi]");
    const mouseEvent = new MouseEvent("mouseover", {
      clientX: svgRect.left + 100,
      clientY: svgRect.top + 120,
      bubbles: true,
    });
    (voronoiPaths.nodes()[0] as SVGPathElement).dispatchEvent(mouseEvent);
    expect(overHandler).toHaveBeenCalledTimes(1);
    const [, datum] = overHandler.mock.calls[0];
    expect(datum).toEqual(nestedData[0]);
  });
  describe("resolving the pointer into the group's coordinate space", () => {
    // The `x`/`y` accessors report positions in the coordinate space of the group the
    // behaviour is called on. The hit test therefore has to resolve the pointer into that
    // same space. Reading it off the group's `getBoundingClientRect()` instead measures from
    // the bounding box of the group's *contents* - which is the clipped voronoi mesh, i.e.
    // the `bounds` rectangle - so it only agrees with the group's origin when `bounds` starts
    // at 0,0. Every 0-based case above pins that agreement; this one pins the inset case.
    const insetData: TestDataPoint[] = [
      { id: 1, name: "Point A", value: 10, x: 200, y: 150 },
      { id: 2, name: "Point B", value: 20, x: 330, y: 250 },
    ];

    function renderInset(overHandler: () => void) {
      const layer = svg
        .selectAll("g.voronoi-inset")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("over", overHandler),
      );
      // The screen position of the group's user-space origin. `getBoundingClientRect()` would
      // report the mesh's box, which starts 100px right and 80px down from here.
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      return { origin: [ctm.e, ctm.f] as [number, number], layer };
    }

    test("should hit the datum under the pointer when bounds do not start at the origin", () => {
      const overHandler = vi.fn();
      const { origin, layer } = renderInset(overHandler);
      const paths = layer.selectAll("[data-sszvis-behavior-voronoi]").nodes();
      (paths[0] as SVGPathElement).dispatchEvent(
        new MouseEvent("mouseover", {
          clientX: origin[0] + 200,
          clientY: origin[1] + 150,
          bubbles: true,
        }),
      );
      expect(overHandler).toHaveBeenCalledTimes(1);
      expect(overHandler.mock.calls[0][1]).toEqual(insetData[0]);
    });

    // `touchstart` resolves its position through the same `pointer()` call as the mouse, but
    // from the `Touch` rather than the event, so it needs its own case: with the mouse cases
    // alone, reverting the touch branch to the old `getBoundingClientRect()` subtraction goes
    // unnoticed.
    test("should hit the datum under a touch when bounds do not start at the origin", () => {
      const overHandler = vi.fn();
      const { origin, layer } = renderInset(overHandler);
      const firstPath = layer
        .selectAll("[data-sszvis-behavior-voronoi]")
        .nodes()[0] as SVGPathElement;

      const touchAt = (offsetX: number, offsetY: number) => {
        const touchstart = new Event("touchstart", { bubbles: true, cancelable: true });
        Object.defineProperty(touchstart, "touches", {
          value: [{ clientX: origin[0] + offsetX, clientY: origin[1] + offsetY, identifier: 0 }],
          writable: false,
        });
        firstPath.dispatchEvent(touchstart);
        firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
      };

      // The datum's own position in the group's coordinate space.
      touchAt(200, 150);
      expect(overHandler).toHaveBeenCalledTimes(1);
      expect(overHandler.mock.calls[0][1]).toEqual(insetData[0]);

      // The position the old, `bounds`-relative subtraction would have read as the datum.
      overHandler.mockClear();
      touchAt(300, 230);
      expect(overHandler).not.toHaveBeenCalled();
    });

    // Dragging a finger across the cells has to report the datum under the finger's *current*
    // position: the pan handler reads the incoming `touchmove`, not the `touchstart` it was
    // registered from, and resolves the datum from the panned position rather than from the
    // `{data}` container the cells - joined to `voronoi.cellPolygons()` - never carried.
    test("should follow the datum under the finger while panning", () => {
      const overHandler = vi.fn();
      const outHandler = vi.fn();
      const layer = svg
        .selectAll("g.voronoi-inset")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      const firstPath = layer
        .selectAll("[data-sszvis-behavior-voronoi]")
        .nodes()[0] as SVGPathElement;

      const touchEventAt = (type: string, offsetX: number, offsetY: number) => {
        const touchEvent = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(touchEvent, "touches", {
          value: [{ clientX: ctm.e + offsetX, clientY: ctm.f + offsetY, identifier: 0 }],
          writable: false,
        });
        return touchEvent;
      };

      firstPath.dispatchEvent(touchEventAt("touchstart", 200, 150));
      expect(overHandler).toHaveBeenCalledTimes(1);
      expect(overHandler.mock.calls[0][1]).toEqual(insetData[0]);

      // Onto the second datum: a pan that re-read the `touchstart` position would report the
      // first datum again.
      firstPath.dispatchEvent(touchEventAt("touchmove", 330, 250));
      expect(overHandler).toHaveBeenCalledTimes(2);
      expect(overHandler.mock.calls[1][1]).toEqual(insetData[1]);

      // Between the two, outside either interaction radius.
      firstPath.dispatchEvent(touchEventAt("touchmove", 265, 200));
      expect(overHandler).toHaveBeenCalledTimes(2);
      expect(outHandler).toHaveBeenCalledTimes(1);

      firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
    });

    // Leaving the mesh has to end the interaction even when the finger lands on some *other*
    // pannable element. `data-sszvis-behavior-pannable` is shared with `behavior/panning`, so
    // reading it alone would report "still on this layer" for any pannable element in the
    // chart, and the pan would keep reporting the datum the mesh happens to hold under that
    // position - here, the second datum, which the overlay sits exactly on top of.
    test("should end the interaction when the finger leaves the mesh onto another pannable element", () => {
      const overHandler = vi.fn();
      const outHandler = vi.fn();
      const layer = svg
        .selectAll("g.voronoi-inset-foreign")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset-foreign");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      const firstPath = layer
        .selectAll("[data-sszvis-behavior-voronoi]")
        .nodes()[0] as SVGPathElement;

      // A pannable element belonging to some other behavior, covering the second datum.
      const foreign = d3
        .select(document.body)
        .append("div")
        .attr("data-sszvis-behavior-pannable", "")
        .style("position", "fixed")
        .style("left", `${ctm.e + 330 - 20}px`)
        .style("top", `${ctm.f + 250 - 20}px`)
        .style("width", "40px")
        .style("height", "40px")
        .style("z-index", "10");
      foreign.datum({ data: "some other behavior's datum" });

      const touchEventAt = (type: string, offsetX: number, offsetY: number) => {
        const touchEvent = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(touchEvent, "touches", {
          value: [{ clientX: ctm.e + offsetX, clientY: ctm.f + offsetY, identifier: 0 }],
          writable: false,
        });
        return touchEvent;
      };

      try {
        firstPath.dispatchEvent(touchEventAt("touchstart", 200, 150));
        expect(overHandler).toHaveBeenCalledTimes(1);

        // Guards the premise: the overlay, not a voronoi cell, is what the browser hit-tests
        // at the panned position.
        expect(document.elementFromPoint(ctm.e + 330, ctm.f + 250)).toBe(foreign.node());

        firstPath.dispatchEvent(touchEventAt("touchmove", 330, 250));
        expect(overHandler).toHaveBeenCalledTimes(1);
        expect(outHandler).toHaveBeenCalledTimes(1);
      } finally {
        foreign.remove();
        firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
      }
    });

    // A `Touch` can reach a handler without coordinates - a `TouchEvent` carries no position of
    // its own, so it lives on the `Touch`, and a malformed one carries neither axis. Both consumers
    // of the position reject a non-finite coordinate rather than degrading, so the guard is
    // what keeps the handler from throwing: `pointer()` throws setting a non-finite
    // `SVGPoint.x`, and `document.elementFromPoint` takes a WebIDL `double`.
    //
    // The throw has to be observed through `window.onerror`, not `expect().toThrow()`:
    // `dispatchEvent` reports a listener's exception as an uncaught error and returns
    // normally, so a `toThrow` assertion here passes whether or not the guard is present.
    test("should ignore a touch that carries no coordinates", () => {
      const overHandler = vi.fn();
      const outHandler = vi.fn();
      const layer = svg
        .selectAll("g.voronoi-inset-coordless")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset-coordless");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      const firstPath = layer
        .selectAll("[data-sszvis-behavior-voronoi]")
        .nodes()[0] as SVGPathElement;

      const touchWith = (type: string, touch: Record<string, number>) => {
        const touchEvent = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(touchEvent, "touches", {
          value: [{ identifier: 0, ...touch }],
          writable: false,
        });
        return touchEvent;
      };
      const uncaught: string[] = [];
      const recordError = (errorEvent: ErrorEvent) => {
        uncaught.push(errorEvent.message);
        errorEvent.preventDefault();
      };
      window.addEventListener("error", recordError);

      try {
        // Neither axis, then each axis alone: a guard that checked only one of them would let
        // the other through. An infinite coordinate is present but unusable, and separates a
        // finiteness test from a mere missing-value or NaN test.
        for (const touch of [
          {},
          { clientX: ctm.e + 200 },
          { clientY: ctm.f + 150 },
          { clientX: Number.POSITIVE_INFINITY, clientY: ctm.f + 150 },
          { clientX: ctm.e + 200, clientY: Number.NEGATIVE_INFINITY },
        ]) {
          firstPath.dispatchEvent(touchWith("touchstart", touch));
          expect(uncaught).toEqual([]);
          expect(overHandler).not.toHaveBeenCalled();
          expect(outHandler).not.toHaveBeenCalled();
        }

        // The same probe on the pan path, which needs a real `touchstart` to register first.
        const touchstart = new Event("touchstart", { bubbles: true, cancelable: true });
        Object.defineProperty(touchstart, "touches", {
          value: [{ clientX: ctm.e + 200, clientY: ctm.f + 150, identifier: 0 }],
          writable: false,
        });
        firstPath.dispatchEvent(touchstart);
        expect(overHandler).toHaveBeenCalledTimes(1);
        overHandler.mockClear();

        for (const touch of [
          {},
          { clientX: ctm.e + 330 },
          { clientY: ctm.f + 250 },
          { clientX: Number.POSITIVE_INFINITY, clientY: ctm.f + 250 },
          { clientX: ctm.e + 330, clientY: Number.NEGATIVE_INFINITY },
        ]) {
          firstPath.dispatchEvent(touchWith("touchmove", touch));
          expect(uncaught).toEqual([]);
          expect(overHandler).not.toHaveBeenCalled();
          expect(outHandler).not.toHaveBeenCalled();
        }
      } finally {
        window.removeEventListener("error", recordError);
        firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
      }
    });

    // Both `out` emitters hand over the event that actually fired. The `touchend` path used to
    // apply the `touchstart` event its closure had captured, which is a plausible-looking
    // object of the wrong type for any consumer that reads it.
    test("should end a drag with the touchend event, not the touchstart it captured", () => {
      const outHandler = vi.fn();
      const layer = svg
        .selectAll("g.voronoi-inset-end")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset-end");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("out", outHandler),
      );
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      const firstPath = layer
        .selectAll("[data-sszvis-behavior-voronoi]")
        .nodes()[0] as SVGPathElement;

      const touchstart = new Event("touchstart", { bubbles: true, cancelable: true });
      Object.defineProperty(touchstart, "touches", {
        value: [{ clientX: ctm.e + 200, clientY: ctm.f + 150, identifier: 0 }],
        writable: false,
      });
      firstPath.dispatchEvent(touchstart);

      const touchend = new Event("touchend", { bubbles: true });
      firstPath.dispatchEvent(touchend);

      expect(outHandler).toHaveBeenCalledTimes(1);
      expect(outHandler.mock.calls[0][0]).toBe(touchend);

      // Ending the drag also unwires it: a leaked `touchmove` listener would keep reporting a
      // datum after the finger lifted.
      const strayMove = new Event("touchmove", { bubbles: true, cancelable: true });
      Object.defineProperty(strayMove, "touches", {
        value: [{ clientX: ctm.e + 330, clientY: ctm.f + 250, identifier: 0 }],
        writable: false,
      });
      firstPath.dispatchEvent(strayMove);
      firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
      expect(outHandler).toHaveBeenCalledTimes(1);
    });

    test("should miss when the pointer is outside the interaction radius of every datum", () => {
      const overHandler = vi.fn();
      const outHandler = vi.fn();
      const layer = svg
        .selectAll("g.voronoi-inset-miss")
        .data([insetData])
        .join("g")
        .attr("class", "voronoi-inset-miss");
      layer.call(
        voronoi<TestDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .bounds([100, 80, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler),
      );
      const ctm = (layer.node() as SVGGElement).getScreenCTM() as DOMMatrix;
      const paths = layer.selectAll("[data-sszvis-behavior-voronoi]").nodes();
      (paths[0] as SVGPathElement).dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: ctm.e + 130,
          clientY: ctm.f + 100,
          bubbles: true,
        }),
      );
      expect(overHandler).not.toHaveBeenCalled();
      expect(outHandler).toHaveBeenCalledTimes(1);
    });

    // The interaction radius is 15 units in the group's coordinate space, not 15 CSS pixels:
    // `pointer()` divides the client delta by the ancestor scale, so a chart drawn at
    // `scale(2)` keeps the same hit area in chart units and doubles it on screen. Comparing
    // undivided client deltas against the radius would halve it in user space, and both
    // boundary cases below would land on the wrong side of it.
    describe.each(["mouse", "touch"] as const)("under a scale(2) ancestor, over %s", (path) => {
      function overAt(offsetX: number, offsetY: number) {
        const overHandler = vi.fn();
        container.style.transform = "scale(2)";
        container.style.transformOrigin = "top left";
        const { layer } = renderInset(overHandler);
        const node = layer.node() as SVGGElement;
        const ctm = node.getScreenCTM() as DOMMatrix;
        // Guards the premise: without the transform every assertion below would pass for the
        // wrong reason.
        expect(ctm.a).toBe(2);
        const clientX = ctm.e + ctm.a * offsetX;
        const clientY = ctm.f + ctm.d * offsetY;
        const firstPath = layer
          .selectAll("[data-sszvis-behavior-voronoi]")
          .nodes()[0] as SVGPathElement;
        if (path === "mouse") {
          firstPath.dispatchEvent(new MouseEvent("mouseover", { clientX, clientY, bubbles: true }));
        } else {
          const touchstart = new Event("touchstart", { bubbles: true, cancelable: true });
          Object.defineProperty(touchstart, "touches", {
            value: [{ clientX, clientY, identifier: 0 }],
            writable: false,
          });
          firstPath.dispatchEvent(touchstart);
          firstPath.dispatchEvent(new Event("touchend", { bubbles: true }));
        }
        return overHandler;
      }

      test("should select the datum under the pointer", () => {
        const overHandler = overAt(200, 150);
        expect(overHandler).toHaveBeenCalledTimes(1);
        expect(overHandler.mock.calls[0][1]).toEqual(insetData[0]);
      });

      // 14 user units is 28 CSS pixels away, so a radius applied to the client delta would
      // reject it.
      test("should hit just inside the 15-unit radius", () => {
        const overHandler = overAt(214, 150);
        expect(overHandler).toHaveBeenCalledTimes(1);
        expect(overHandler.mock.calls[0][1]).toEqual(insetData[0]);
      });

      test("should miss just outside the 15-unit radius", () => {
        expect(overAt(216, 150)).not.toHaveBeenCalled();
      });
    });
  });
});
