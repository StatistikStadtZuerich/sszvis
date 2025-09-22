import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as d3 from "d3";
import panning from "../../src/behavior/panning";
import { bounds } from "../../src/bounds";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

describe("behavior/panning", () => {
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

  function createTestElements() {
    const testData = [
      { id: 1, value: 10 },
      { id: 2, value: 20 },
      { id: 3, value: 30 },
    ];

    const circles = svg
      .selectAll("circle.test-element")
      .data(testData)
      .join("circle")
      .attr("class", "test-element")
      .attr("cx", (_, i) => 50 + i * 100)
      .attr("cy", 100)
      .attr("r", 20);

    return { circles, testData };
  }

  test("should apply panning attributes and classes to selected elements", () => {
    const { circles } = createTestElements();
    svg.call(panning().elementSelector("circle.test-element"));
    circles.each(function () {
      const element = d3.select(this);
      expect(element.attr("data-sszvis-behavior-pannable")).toBe("");
      expect(element.classed("sszvis-interactive")).toBe(true);
    });
  });

  test("should only apply to elements matching selector", () => {
    const { circles } = createTestElements();
    const rects = svg
      .selectAll("rect.non-target")
      .data([1, 2])
      .join("rect")
      .attr("class", "non-target")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 20)
      .attr("height", 20);
    svg.call(panning().elementSelector("circle.test-element"));
    circles.each(function () {
      const element = d3.select(this);
      expect(element.attr("data-sszvis-behavior-pannable")).toBe("");
      expect(element.classed("sszvis-interactive")).toBe(true);
    });
    rects.each(function () {
      const element = d3.select(this);
      expect(element.attr("data-sszvis-behavior-pannable")).toBeNull();
      expect(element.classed("sszvis-interactive")).toBe(false);
    });
  });

  test("should handle complete mouse interaction lifecycle", () => {
    const handlers = {
      start: vi.fn(),
      pan: vi.fn(),
      end: vi.fn(),
    };
    const { circles } = createTestElements();

    svg.call(
      panning()
        .elementSelector("circle.test-element")
        .on("start", handlers.start)
        .on("pan", handlers.pan)
        .on("end", handlers.end)
    );
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    firstCircle.dispatchEvent(
      new MouseEvent("mouseenter", {
        clientX: 50,
        clientY: 100,
        bubbles: true,
      })
    );
    expect(handlers.start).toHaveBeenCalledTimes(1);
    firstCircle.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 60,
        clientY: 110,
        bubbles: true,
      })
    );
    expect(handlers.pan).toHaveBeenCalledTimes(1);
    firstCircle.dispatchEvent(
      new MouseEvent("mouseleave", {
        clientX: 70,
        clientY: 120,
        bubbles: true,
      })
    );
    expect(handlers.end).toHaveBeenCalledTimes(1);
  });

  test("should handle interactions on multiple elements", () => {
    const startHandler = vi.fn();
    const panHandler = vi.fn();
    const { circles } = createTestElements();
    svg.call(
      panning()
        .elementSelector("circle.test-element")
        .on("start", startHandler)
        .on("pan", panHandler)
    );
    const circleNodes = circles.nodes() as SVGCircleElement[];
    circleNodes[0].dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(startHandler).toHaveBeenCalledTimes(1);
    circleNodes[1].dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(startHandler).toHaveBeenCalledTimes(2);
    circleNodes[0].dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    circleNodes[1].dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(panHandler).toHaveBeenCalledTimes(2);
  });

  test("should handle touch interaction lifecycle", () => {
    const handlers = {
      start: vi.fn(),
      pan: vi.fn(),
      end: vi.fn(),
    };
    const { circles } = createTestElements();
    svg.call(
      panning()
        .elementSelector("circle.test-element")
        .on("start", handlers.start)
        .on("pan", handlers.pan)
        .on("end", handlers.end)
    );
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    const createTouchEvent = (type: string, touches: Touch[] = []) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: touches, writable: false });
      Object.defineProperty(event, "changedTouches", { value: touches, writable: false });
      return event;
    };
    const touch = {
      clientX: 50,
      clientY: 100,
      identifier: 0,
      pageX: 50,
      pageY: 100,
      screenX: 50,
      screenY: 100,
      target: firstCircle,
      force: 1,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
    } as Touch;
    const touchstartEvent = createTouchEvent("touchstart", [touch]);
    const preventDefaultSpy = vi.spyOn(touchstartEvent, "preventDefault");
    firstCircle.dispatchEvent(touchstartEvent);
    expect(handlers.start).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
    const touchmoveEvent = createTouchEvent("touchmove", [touch]);
    const touchmovePreventSpy = vi.spyOn(touchmoveEvent, "preventDefault");
    firstCircle.dispatchEvent(touchmoveEvent);
    expect(touchmovePreventSpy).toHaveBeenCalled();
    firstCircle.dispatchEvent(createTouchEvent("touchend", []));
    expect(handlers.end).toHaveBeenCalled();
  });

  test("should prevent default on touch events", () => {
    const { circles } = createTestElements();
    svg.call(panning().elementSelector("circle.test-element"));
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    const touch = {
      clientX: 50,
      clientY: 100,
      identifier: 0,
      pageX: 50,
      pageY: 100,
      screenX: 50,
      screenY: 100,
      target: firstCircle,
      force: 1,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
    } as Touch;
    const touchstartEvent = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(touchstartEvent, "touches", { value: [touch], writable: false });
    const startPreventSpy = vi.spyOn(touchstartEvent, "preventDefault");
    firstCircle.dispatchEvent(touchstartEvent);
    expect(startPreventSpy).toHaveBeenCalled();
    const touchmoveEvent = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(touchmoveEvent, "touches", { value: [touch], writable: false });
    const movePreventSpy = vi.spyOn(touchmoveEvent, "preventDefault");
    firstCircle.dispatchEvent(touchmoveEvent);
    expect(movePreventSpy).toHaveBeenCalled();
  });

  test("should pass correct context and data to event handlers", () => {
    const startHandler = vi.fn();
    const { circles } = createTestElements();
    svg.call(panning().elementSelector("circle.test-element").on("start", startHandler));
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    const mouseEvent = new MouseEvent("mouseenter", {
      clientX: 50,
      clientY: 100,
      bubbles: true,
    });
    firstCircle.dispatchEvent(mouseEvent);
    expect(startHandler).toHaveBeenCalledTimes(1);
    expect(startHandler.mock.calls[0].length).toBeGreaterThan(0);
    expect(startHandler.mock.instances[0]).toBe(firstCircle);
  });

  test("should work with dynamic element changes", () => {
    createTestElements();
    svg.call(panning().elementSelector("circle.test-element"));
    const newData = [
      { id: 4, value: 40 },
      { id: 5, value: 50 },
    ];
    const newCircles = svg
      .selectAll("circle.test-element")
      .data([...svg.selectAll("circle.test-element").data(), ...newData])
      .join("circle")
      .attr("class", "test-element")
      .attr("cx", (_, i) => 50 + i * 100)
      .attr("cy", 100)
      .attr("r", 20);
    svg.call(panning().elementSelector("circle.test-element"));
    newCircles.each(function () {
      const element = d3.select(this);
      expect(element.attr("data-sszvis-behavior-pannable")).toBe("");
      expect(element.classed("sszvis-interactive")).toBe(true);
    });
  });
});
