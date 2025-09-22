import { scaleLinear } from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import move from "../../src/behavior/move";
import { bounds } from "../../src/bounds";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

describe("behavior/move", () => {
  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  let chartBounds: ReturnType<typeof bounds>;
  let xScale: d3.ScaleLinear<number, number>;
  let yScale: d3.ScaleLinear<number, number>;

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
    xScale = scaleLinear().domain([0, 100]).range([0, 300]);
    yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    svg = createSvgLayer(container, chartBounds);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  test("should create move component with proper API", () => {
    const moveComponent = move().xScale(xScale).yScale(yScale).debug(true).draggable(true);
    expect(moveComponent.xScale()).toBe(xScale);
    expect(moveComponent.yScale()).toBe(yScale);
    expect(moveComponent.debug()).toBe(true);
    expect(moveComponent.draggable()).toBe(true);
    expect(moveComponent.fireOnPanOnly()()).toBe(false);
    expect(moveComponent.cancelScrolling()()).toBe(false);
    expect(moveComponent.padding()).toEqual({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    });
  });

  test("should attach interactive rectangle when rendered", () => {
    svg.call(move().xScale(xScale).yScale(yScale));
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.empty()).toBe(false);
    expect(interactiveRect.attr("class")).toBe("sszvis-interactive");
    expect(interactiveRect.attr("fill")).toBe("transparent");
  });

  test("should apply draggable class when draggable is true", () => {
    svg.call(move().xScale(xScale).yScale(yScale).draggable(true));
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.classed("sszvis-interactive--draggable")).toBe(true);
  });

  test("should apply padding to rect dimensions", () => {
    svg.call(
      move().xScale(xScale).yScale(yScale).padding({ top: 10, right: 15, bottom: 20, left: 25 })
    );
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.attr("x")).toBe("-25"); // 0 - 25 = -25
    expect(interactiveRect.attr("y")).toBe("-10"); // 0 - 10 = -10
    expect(interactiveRect.attr("width")).toBe("340"); // 300 + 25 + 15 = 340
    expect(interactiveRect.attr("height")).toBe("230"); // 200 + 10 + 20 = 230
  });

  test("should dispatch move event on mousemove when not dragging", () => {
    const moveHandler = vi.fn();
    svg.call(move().xScale(xScale).yScale(yScale).on("move", moveHandler));
    const rectNode = svg.select("[data-sszvis-behavior-move]").node() as SVGRectElement;
    rectNode.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    rectNode.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    expect(moveHandler).toHaveBeenCalled();
  });

  test("should dispatch drag event on mousemove when dragging", () => {
    const dragHandler = vi.fn();
    svg.call(move().xScale(xScale).yScale(yScale).on("drag", dragHandler));
    const rectNode = svg.select("[data-sszvis-behavior-move]").node() as SVGRectElement;
    rectNode.dispatchEvent(
      new MouseEvent("mousedown", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    rectNode.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    expect(dragHandler).toHaveBeenCalled();
  });

  test("should dispatch start event on mouseover", () => {
    const startHandler = vi.fn();
    svg.call(move().xScale(xScale).yScale(yScale).on("start", startHandler));
    const rectNode = svg.select("[data-sszvis-behavior-move]").node() as SVGRectElement;
    rectNode.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    expect(startHandler).toHaveBeenCalled();
  });

  test("should dispatch end event on mouseout", () => {
    const endHandler = vi.fn();
    svg.call(move().xScale(xScale).yScale(yScale).on("end", endHandler));
    const rectNode = svg.select("[data-sszvis-behavior-move]").node() as SVGRectElement;
    rectNode.dispatchEvent(
      new MouseEvent("mouseout", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    expect(endHandler).toHaveBeenCalled();
  });

  test("should set up touchmove listeners after touchstart", () => {
    const dragHandler = vi.fn();
    const moveHandler = vi.fn();
    const endHandler = vi.fn();
    svg.call(
      move()
        .xScale(xScale)
        .yScale(yScale)
        .on("drag", dragHandler)
        .on("move", moveHandler)
        .on("end", endHandler)
    );
    const rectNode = svg.select("[data-sszvis-behavior-move]").node() as SVGRectElement;
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).toBeUndefined();
    const touchstartEvent = new Event("touchstart", { bubbles: true });
    Object.defineProperty(touchstartEvent, "touches", {
      value: [{ clientX: 150, clientY: 100, identifier: 0 }],
      writable: false,
    });
    rectNode.dispatchEvent(touchstartEvent);
    expect(dragHandler).toHaveBeenCalled();
    expect(moveHandler).toHaveBeenCalled();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).not.toBeNull();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).not.toBeNull();
    rectNode.dispatchEvent(new Event("touchend", { bubbles: true }));
    expect(endHandler).toHaveBeenCalled();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).toBeUndefined();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).toBeUndefined();
  });
});
