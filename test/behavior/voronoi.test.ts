import * as d3 from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import voronoi from "../../src/behavior/voronoi";
import { bounds } from "../../src/bounds";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

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
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
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
    const testBounds = [0, 0, 400, 300];
    const chainedComponent = voronoi().x(xAccessor).y(yAccessor).bounds(testBounds).debug(true);
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
      voronoi()
        .x((d: TestDataPoint) => d.x)
        .y((d: TestDataPoint) => d.y)
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
      voronoi()
        .x((d: TestDataPoint) => d.x)
        .y((d: TestDataPoint) => d.y)
        .bounds([0, 0, 400, 300])
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
        voronoi()
          .x((d: TestDataPoint) => d.x)
          .y((d: TestDataPoint) => d.y)
          .bounds([0, 0, 400, 300])
          .debug(true)
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
        voronoi()
          .x((d: TestDataPoint) => d.x)
          .y((d: TestDataPoint) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler)
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    const firstPath = svg.selectAll("[data-sszvis-behavior-voronoi]").nodes()[0] as SVGPathElement;
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 100, // Near first data point
        clientY: svgRect.top + 100,
        bubbles: true,
      })
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    expect(overHandler.mock.calls[0][1]).toEqual(testData[0]); // Correct data passed
    firstPath.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: svgRect.left + 105, // Close to first point
        clientY: svgRect.top + 105,
        bubbles: true,
      })
    );
    expect(overHandler).toHaveBeenCalledTimes(2);
    firstPath.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: svgRect.left + 50, // Far from any data point
        clientY: svgRect.top + 50,
        bubbles: true,
      })
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
        voronoi()
          .x((d: TestDataPoint) => d.x)
          .y((d: TestDataPoint) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
          .on("out", outHandler)
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
        voronoi()
          .x((d: TestDataPoint) => d.x)
          .y((d: TestDataPoint) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
      );
    const svgRect = svg.node()?.getBoundingClientRect() as DOMRect;
    const firstPath = svg.selectAll("[data-sszvis-behavior-voronoi]").nodes()[0] as SVGPathElement;
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 200,
        clientY: svgRect.top + 150,
        bubbles: true,
      })
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    overHandler.mockClear();
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 210, // 10px away horizontally
        clientY: svgRect.top + 155, // 5px away vertically (total ~11px)
        bubbles: true,
      })
    );
    expect(overHandler).toHaveBeenCalledTimes(1);
    overHandler.mockClear();
    firstPath.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: svgRect.left + 220, // 20px away horizontally
        clientY: svgRect.top + 170, // 20px away vertically (total ~28px)
        bubbles: true,
      })
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
        voronoi()
          .x((d: TestDataPoint) => d.x)
          .y((d: TestDataPoint) => d.y)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
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
        voronoi()
          .x((d: NestedDataPoint) => d.position.horizontal)
          .y((d: NestedDataPoint) => d.position.vertical)
          .bounds([0, 0, 400, 300])
          .on("over", overHandler)
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
});
