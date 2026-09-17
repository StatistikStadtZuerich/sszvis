import * as d3 from "d3";
import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import panning from "../../src/behavior/panning.js";
import { bounds } from "../../src/bounds.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";

type TestDatum = { id: number; value: number };

describe("behavior/panning", () => {
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

  function createTestElements() {
    const testData: TestDatum[] = [
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

  function touchEvent(type: string, touches: Array<Record<string, number>>): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const list = touches.map((touch, i) => ({ identifier: i, ...touch }));
    Object.defineProperty(event, "touches", { value: list, writable: false });
    Object.defineProperty(event, "changedTouches", { value: list, writable: false });
    return event;
  }

  test("should make only the elements matching the selector interactive, leaving their siblings alone", () => {
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

  test("should make newly added elements interactive when the behaviour is applied again", () => {
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

  test("should report start, then pan, then end when the mouse enters, moves over and leaves an element", () => {
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
        .on("end", handlers.end),
    );
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    firstCircle.dispatchEvent(
      new MouseEvent("mouseenter", {
        clientX: 50,
        clientY: 100,
        bubbles: true,
      }),
    );
    expect(handlers.start).toHaveBeenCalledTimes(1);
    firstCircle.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 60,
        clientY: 110,
        bubbles: true,
      }),
    );
    expect(handlers.pan).toHaveBeenCalledTimes(1);
    firstCircle.dispatchEvent(
      new MouseEvent("mouseleave", {
        clientX: 70,
        clientY: 120,
        bubbles: true,
      }),
    );
    expect(handlers.end).toHaveBeenCalledTimes(1);
  });

  test("should report an interaction for each element when several are hovered in turn", () => {
    const startHandler = vi.fn();
    const panHandler = vi.fn();
    const { circles } = createTestElements();
    svg.call(
      panning()
        .elementSelector("circle.test-element")
        .on("start", startHandler)
        .on("pan", panHandler),
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

  // A handler is called on the element the interaction is happening on, and is handed that
  // element's own datum - the documented second argument of `PanEventHandler<T>`, which is what
  // lets a tooltip name the thing under the finger.
  test("should hand the handler the element it fired on and that element's datum when an element is hovered", () => {
    const startHandler = vi.fn();
    const { circles, testData } = createTestElements();
    svg.call(panning<TestDatum>().elementSelector("circle.test-element").on("start", startHandler));
    const secondCircle = circles.nodes()[1] as SVGCircleElement;

    secondCircle.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    expect(startHandler).toHaveBeenCalledTimes(1);
    expect(startHandler.mock.instances[0]).toBe(secondCircle);
    const [event, datum] = startHandler.mock.calls[0];
    expect(event).toBeInstanceOf(MouseEvent);
    expect(datum).toEqual(testData[1]);
  });

  // Touch is the reason this behaviour exists: it cancels the browser's scroll for the whole
  // gesture so that a finger can be dragged across the chart the way a mouse is hovered.
  test("should report the touch gesture and suppress scrolling from the first touch to the last", () => {
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
        .on("end", handlers.end),
    );
    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    const box = firstCircle.getBoundingClientRect();
    const onTheCircle = {
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    };

    const touchstart = touchEvent("touchstart", [onTheCircle]);
    firstCircle.dispatchEvent(touchstart);
    expect(handlers.start).toHaveBeenCalledTimes(1);
    expect(touchstart.defaultPrevented).toBe(true);

    const touchmove = touchEvent("touchmove", [onTheCircle]);
    firstCircle.dispatchEvent(touchmove);
    expect(handlers.pan).toHaveBeenCalledTimes(1);
    expect(touchmove.defaultPrevented).toBe(true);

    firstCircle.dispatchEvent(touchEvent("touchend", []));
    expect(handlers.end).toHaveBeenCalledTimes(1);
  });

  // The one real decision in the module: a touchmove reports a pan only while the finger is
  // still over a pannable element, and reports `end` as soon as it is not. Without this the
  // tooltip would follow a finger that has already left the chart.
  test("should report a pan while the finger stays on pannable elements and end as soon as it leaves them", () => {
    const handlers = { start: vi.fn(), pan: vi.fn(), end: vi.fn() };
    const { circles } = createTestElements();
    svg.call(
      panning<TestDatum>()
        .elementSelector("circle.test-element")
        .on("start", handlers.start)
        .on("pan", handlers.pan)
        .on("end", handlers.end),
    );
    const circleNodes = circles.nodes() as SVGCircleElement[];
    const firstCircle = circleNodes[0];
    const ctm = (svg.node() as SVGGElement).getScreenCTM();
    assert(ctm);
    const at = (x: number, y: number) => ({ clientX: ctm.e + x, clientY: ctm.f + y });

    // Guards the premise: it is the browser's own hit test that decides what the finger is on,
    // so the assertions below only mean something if these positions really land where the
    // test thinks they do.
    const onSecond = at(150, 100);
    const onNothing = at(150, 250);
    expect(document.elementFromPoint(onSecond.clientX, onSecond.clientY)).toBe(circleNodes[1]);
    expect(document.elementFromPoint(onNothing.clientX, onNothing.clientY)).not.toBe(
      circleNodes[1],
    );

    firstCircle.dispatchEvent(touchEvent("touchstart", [at(50, 100)]));
    expect(handlers.start).toHaveBeenCalledTimes(1);

    firstCircle.dispatchEvent(touchEvent("touchmove", [onSecond]));
    expect(handlers.pan).toHaveBeenCalledTimes(1);
    expect(handlers.end).not.toHaveBeenCalled();

    firstCircle.dispatchEvent(touchEvent("touchmove", [onNothing]));
    expect(handlers.pan).toHaveBeenCalledTimes(1);
    expect(handlers.end).toHaveBeenCalledTimes(1);

    // Back onto a pannable element, the pan resumes.
    firstCircle.dispatchEvent(touchEvent("touchmove", [onSecond]));
    expect(handlers.pan).toHaveBeenCalledTimes(2);
    expect(handlers.end).toHaveBeenCalledTimes(1);
  });

  test("accepts handlers for every declared event, including namespaced typenames", () => {
    const startHandler = vi.fn((_event: Event) => {});
    const panHandler = vi.fn((_event: Event) => {});
    const endHandler = vi.fn((_event: Event) => {});
    const { circles } = createTestElements();
    const component = panning()
      .elementSelector("circle.test-element")
      .on("start", startHandler)
      .on("pan.tooltip", panHandler)
      .on("end", endHandler);
    svg.call(component);

    expect(component.on("start")).toBe(startHandler);

    const firstCircle = circles.nodes()[0] as SVGCircleElement;
    firstCircle.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    firstCircle.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    firstCircle.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

    expect(startHandler).toHaveBeenCalled();
    expect(panHandler).toHaveBeenCalled();
    expect(endHandler).toHaveBeenCalled();
  });
});
