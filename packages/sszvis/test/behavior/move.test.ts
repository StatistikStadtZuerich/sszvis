import { scaleBand, scaleLinear, scalePoint } from "d3";
import { afterEach, assert, beforeEach, describe, expect, test, vi } from "vitest";
import move, { type MoveComponent } from "../../src/behavior/move.js";
import { bounds } from "../../src/bounds.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";

describe("behavior/move", () => {
  let container: HTMLDivElement;
  let svg: LayerSelection<SVGGElement, number>;
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
    const moveComponent = move<number, number>()
      .xScale(xScale)
      .yScale(yScale)
      .debug(true)
      .draggable(true);
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
    svg.call(move<number, number>().xScale(xScale).yScale(yScale));
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.empty()).toBe(false);
    expect(interactiveRect.attr("class")).toBe("sszvis-interactive");
    expect(interactiveRect.attr("fill")).toBe("transparent");
  });

  test("should apply draggable class when draggable is true", () => {
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).draggable(true));
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.classed("sszvis-interactive--draggable")).toBe(true);
  });

  test("should apply padding to rect dimensions", () => {
    svg.call(
      move<number, number>()
        .xScale(xScale)
        .yScale(yScale)
        .padding({ top: 10, right: 15, bottom: 20, left: 25 })
    );
    const interactiveRect = svg.select("[data-sszvis-behavior-move]");
    expect(interactiveRect.attr("x")).toBe("-25"); // 0 - 25 = -25
    expect(interactiveRect.attr("y")).toBe("-10"); // 0 - 10 = -10
    expect(interactiveRect.attr("width")).toBe("340"); // 300 + 25 + 15 = 340
    expect(interactiveRect.attr("height")).toBe("230"); // 200 + 10 + 20 = 230
  });

  test("should dispatch move event on mousemove when not dragging", () => {
    const moveHandler = vi.fn();
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("move", moveHandler));
    const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
    rectNode?.dispatchEvent(
      new MouseEvent("mouseover", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    rectNode?.dispatchEvent(
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
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("drag", dragHandler));
    const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
    rectNode?.dispatchEvent(
      new MouseEvent("mousedown", {
        clientX: 150,
        clientY: 100,
        bubbles: true,
      })
    );
    rectNode?.dispatchEvent(
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
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("start", startHandler));
    const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
    rectNode?.dispatchEvent(
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
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("end", endHandler));
    const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
    rectNode?.dispatchEvent(
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
      move<number, number>()
        .xScale(xScale)
        .yScale(yScale)
        .on("drag", dragHandler)
        .on("move", moveHandler)
        .on("end", endHandler)
    );
    const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).toBeUndefined();
    const touchstartEvent = new Event("touchstart", { bubbles: true });
    Object.defineProperty(touchstartEvent, "touches", {
      value: [{ clientX: 150, clientY: 100, identifier: 0 }],
      writable: false,
    });
    rectNode?.dispatchEvent(touchstartEvent);
    expect(dragHandler).toHaveBeenCalled();
    expect(moveHandler).toHaveBeenCalled();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).not.toBeNull();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).not.toBeNull();
    rectNode?.dispatchEvent(new Event("touchend", { bubbles: true }));
    expect(endHandler).toHaveBeenCalled();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).toBeUndefined();
    expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).toBeUndefined();
  });

  describe("using band scale", () => {
    let xBandScale: d3.ScaleBand<string>;
    let yBandScale: d3.ScaleBand<string>;

    beforeEach(() => {
      xBandScale = scaleBand().domain(["A", "B", "C", "D"]).range([0, 300]).padding(0.1);
      yBandScale = scaleBand().domain(["1", "2", "3"]).range([200, 0]).padding(0.2);
    });

    test("should create move component with band scales", () => {
      const moveComponent = move<string, string>().xScale(xBandScale).yScale(yBandScale);
      expect(moveComponent.xScale()).toBe(xBandScale);
      expect(moveComponent.yScale()).toBe(yBandScale);
    });

    test("should dispatch move event with band scales", () => {
      const moveHandler = vi.fn();
      svg.call(
        move<string, string>().xScale(xBandScale).yScale(yBandScale).on("move", moveHandler)
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      rectNode?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      expect(moveHandler).toHaveBeenCalled();
    });

    test("should handle band scale drag events", () => {
      const dragHandler = vi.fn();
      svg.call(
        move<string, string>().xScale(xBandScale).yScale(yBandScale).on("drag", dragHandler)
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      rectNode?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      expect(dragHandler).toHaveBeenCalled();
    });
  });

  describe("using point scale", () => {
    let xPointScale: d3.ScalePoint<string>;
    let yPointScale: d3.ScalePoint<string>;

    beforeEach(() => {
      xPointScale = scalePoint().domain(["A", "B", "C", "D"]).range([0, 300]).padding(0.1);
      yPointScale = scalePoint().domain(["1", "2", "3"]).range([200, 0]).padding(0.2);
    });

    test("should create move component with point scales", () => {
      const moveComponent = move<string, string>().xScale(xPointScale).yScale(yPointScale);
      expect(moveComponent.xScale()).toBe(xPointScale);
      expect(moveComponent.yScale()).toBe(yPointScale);
    });

    test("should dispatch move event with point scales", () => {
      const moveHandler = vi.fn();
      svg.call(
        move<string, string>().xScale(xPointScale).yScale(yPointScale).on("move", moveHandler)
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      rectNode?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      expect(moveHandler).toHaveBeenCalled();
    });

    test("should handle point scale drag events", () => {
      const dragHandler = vi.fn();
      svg.call(
        move<string, string>().xScale(xPointScale).yScale(yPointScale).on("drag", dragHandler)
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      rectNode?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      expect(dragHandler).toHaveBeenCalled();
    });

    test("should handle point scale start and end events", () => {
      const startHandler = vi.fn();
      const endHandler = vi.fn();
      svg.call(
        move<string, string>()
          .xScale(xPointScale)
          .yScale(yPointScale)
          .on("start", startHandler)
          .on("end", endHandler)
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(startHandler).toHaveBeenCalled();
      rectNode?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      expect(endHandler).toHaveBeenCalled();
    });
  });

  describe("Safari mobile touch event handling", () => {
    // Helper to create a TouchEvent-like object that mimics Safari mobile behavior
    // where clientX/clientY are NOT on the event itself, only in the touches array
    const createSafariTouchEvent = (
      type: string,
      touches: Array<{ clientX: number; clientY: number; identifier?: number }>
    ): Event => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", {
        value: touches.map((t, i) => ({
          clientX: t.clientX,
          clientY: t.clientY,
          identifier: t.identifier ?? i,
        })),
        writable: false,
      });
      Object.defineProperty(event, "changedTouches", {
        value: touches.map((t, i) => ({
          clientX: t.clientX,
          clientY: t.clientY,
          identifier: t.identifier ?? i,
        })),
        writable: false,
      });
      return event;
    };

    test("should handle touchstart with coordinates only in touches array (Safari mobile)", () => {
      const startHandler = vi.fn();
      const moveHandler = vi.fn();
      const dragHandler = vi.fn();

      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", startHandler)
          .on("move", moveHandler)
          .on("drag", dragHandler)
      );

      const touchEvent = createSafariTouchEvent("touchstart", [{ clientX: 150, clientY: 100 }]);

      expect((touchEvent as unknown as { clientX?: number }).clientX).toBeUndefined();
      expect((touchEvent as unknown as { clientY?: number }).clientY).toBeUndefined();

      svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node()?.dispatchEvent(touchEvent);
      expect(startHandler).toHaveBeenCalled();
      expect(moveHandler).toHaveBeenCalled();
      expect(dragHandler).toHaveBeenCalled();
    });

    test("should pass correct data values from touch coordinates", () => {
      const moveHandler = vi.fn();

      svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("move", moveHandler));

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      assert(rectNode);
      const rect = rectNode.getBoundingClientRect();

      rectNode.dispatchEvent(
        createSafariTouchEvent("touchstart", [
          { clientX: rect.left + 150, clientY: rect.top + 100 },
        ])
      );
      expect(moveHandler).toHaveBeenCalled();
      const [, x, y] = moveHandler.mock.calls[0];
      expect(x).toBeCloseTo(50, 0);
      expect(y).toBeCloseTo(25, 0);
    });

    test("should handle touchmove with updated coordinates (Safari mobile)", () => {
      const moveHandler = vi.fn();

      svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("move", moveHandler));

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      assert(rectNode);

      const rect = rectNode.getBoundingClientRect();

      rectNode.dispatchEvent(
        createSafariTouchEvent("touchstart", [
          { clientX: rect.left + 150, clientY: rect.top + 100 },
        ])
      );

      expect(moveHandler).toHaveBeenCalledTimes(1);

      rectNode.dispatchEvent(
        createSafariTouchEvent("touchmove", [{ clientX: rect.left + 200, clientY: rect.top + 50 }])
      );

      expect(moveHandler).toHaveBeenCalledTimes(2);
      const [, x, y] = moveHandler.mock.calls[1];
      expect(x).toBeCloseTo(66.67, 0);
      expect(y).toBeCloseTo(37.5, 0);
    });

    test("should handle touchend and clean up listeners", () => {
      const endHandler = vi.fn();

      svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("end", endHandler));

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      if (!rectNode) throw new Error("rectNode not found");

      const rect = rectNode.getBoundingClientRect();

      rectNode.dispatchEvent(
        createSafariTouchEvent("touchstart", [
          { clientX: rect.left + 150, clientY: rect.top + 100 },
        ])
      );

      expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).not.toBeNull();
      expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).not.toBeNull();

      const touchEndEvent = new Event("touchend", { bubbles: true });
      Object.defineProperty(touchEndEvent, "touches", {
        value: [],
        writable: false,
      });
      Object.defineProperty(touchEndEvent, "changedTouches", {
        value: [{ clientX: rect.left + 150, clientY: rect.top + 100, identifier: 0 }],
        writable: false,
      });
      rectNode.dispatchEvent(touchEndEvent);

      expect(endHandler).toHaveBeenCalled();
      expect(svg.select("[data-sszvis-behavior-move]").on("touchmove")).toBeUndefined();
      expect(svg.select("[data-sszvis-behavior-move]").on("touchend")).toBeUndefined();
    });

    test("should not fire events when touch has no coordinates", () => {
      const moveHandler = vi.fn();
      const startHandler = vi.fn();

      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", startHandler)
          .on("move", moveHandler)
      );

      const emptyTouchEvent = new Event("touchstart", { bubbles: true });
      Object.defineProperty(emptyTouchEvent, "touches", {
        value: [],
        writable: false,
      });
      Object.defineProperty(emptyTouchEvent, "changedTouches", {
        value: [],
        writable: false,
      });

      svg
        .select<SVGRectElement>("[data-sszvis-behavior-move]")
        .node()
        ?.dispatchEvent(emptyTouchEvent);

      expect(startHandler).not.toHaveBeenCalled();
      expect(moveHandler).not.toHaveBeenCalled();
    });

    test("should not fire events when touch coordinates are invalid (NaN)", () => {
      const moveHandler = vi.fn();
      const startHandler = vi.fn();

      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", startHandler)
          .on("move", moveHandler)
      );

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();

      // Create event with NaN coordinates
      const invalidTouchEvent = new Event("touchstart", { bubbles: true });
      Object.defineProperty(invalidTouchEvent, "touches", {
        value: [{ clientX: NaN, clientY: NaN, identifier: 0 }],
        writable: false,
      });

      rectNode?.dispatchEvent(invalidTouchEvent);

      // Handlers should not be called when coordinates are invalid
      expect(startHandler).not.toHaveBeenCalled();
      expect(moveHandler).not.toHaveBeenCalled();
    });
  });
  describe("resolving the pointer into the scale's coordinate space", () => {
    /**
     * Dispatches a pointer at an offset measured from the interaction rect's own box, and
     * returns the [x, y] pair the behaviour reports for it. `path` selects which of the two
     * coordinate paths in the behaviour is exercised: `pointer(event, target)` for the mouse,
     * `pointer(touch, target)` for touch.
     */
    function dispatchTouch(
      node: SVGRectElement,
      type: "touchstart" | "touchmove",
      clientX: number,
      clientY: number
    ) {
      const touchEvent = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(touchEvent, "touches", {
        value: [{ clientX, clientY, identifier: 0 }],
        writable: false,
      });
      node.dispatchEvent(touchEvent);
    }

    function valueAt<XDomain, YDomain>(
      moveComponent: MoveComponent<XDomain, YDomain>,
      path: "mouse" | "touch",
      offsetX: number,
      offsetY: number
    ): [unknown, unknown] {
      let seen: [unknown, unknown] = [undefined, undefined];
      svg.call(
        moveComponent.on("move", (_e, x, y) => {
          seen = [x, y];
        })
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      const box = rectNode?.getBoundingClientRect() as DOMRect;
      const clientX = box.left + offsetX;
      const clientY = box.top + offsetY;
      if (path === "mouse") {
        rectNode?.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY, bubbles: true }));
      } else if (rectNode) {
        dispatchTouch(rectNode, "touchstart", clientX, clientY);
      }
      return seen;
    }

    // The 0-based baseline. A 0-based range is the common case - it is what the library's own
    // components build and what most live consumer charts pass - but it is not universal: the
    // consumer survey behind this fix found 64 live non-zero x ranges and 22 non-zero y ranges.
    // These cases pin the values a 0-based caller sees, so that the inset fix is demonstrably
    // a no-op for them.
    describe.each(["mouse", "touch"] as const)("with a 0-based range, over %s", (path) => {
      test("should report the domain start at the start of the range", () => {
        expect(valueAt(move<number, number>().xScale(xScale).yScale(yScale), path, 0, 200)).toEqual(
          [0, 0]
        );
      });

      test("should report the domain end at the end of the range", () => {
        expect(valueAt(move<number, number>().xScale(xScale).yScale(yScale), path, 300, 0)).toEqual(
          [100, 50]
        );
      });
    });

    // The regression: a scale whose range starts away from 0. The interaction rect is drawn
    // at the range start, so a position measured from the rect's own box has to have that
    // origin added back before it is inverted.
    describe.each(["mouse", "touch"] as const)("with an inset range, over %s", (path) => {
      const insetX = () => scaleLinear().domain([0, 10]).range([100, 400]);
      const insetY = () => scaleLinear().domain([0, 20]).range([250, 50]);

      test("should report the domain start at the start of the range", () => {
        expect(
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 0, 200)
        ).toEqual([0, 0]);
      });

      test("should report the domain end at the end of the range", () => {
        expect(
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 300, 0)
        ).toEqual([10, 20]);
      });

      test("should report the midpoint of the domain at the middle of the range", () => {
        expect(
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 150, 100)
        ).toEqual([5, 10]);
      });
    });

    // The pan path resolves its own coordinates from each `touchmove` through a second
    // `pointer()` call, and is only reachable by a touch that starts and then moves. Without a
    // moving touch, breaking the resolution in the pan branch alone would still pass every
    // case above.
    test("should report the moved-to domain value when a touch pans over an inset range", () => {
      const seen: [unknown, unknown][] = [];
      svg.call(
        move<number, number>()
          .xScale(scaleLinear().domain([0, 10]).range([100, 400]))
          .yScale(scaleLinear().domain([0, 20]).range([250, 50]))
          .on("move", (_e, x, y) => {
            seen.push([x, y]);
          })
      );
      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node() as
        | SVGRectElement
        | undefined;
      assert(rectNode);
      const box = rectNode.getBoundingClientRect();

      dispatchTouch(rectNode, "touchstart", box.left, box.top + 200);
      expect(seen.at(-1)).toEqual([0, 0]);

      dispatchTouch(rectNode, "touchmove", box.left + 150, box.top + 100);
      expect(seen.at(-1)).toEqual([5, 10]);

      dispatchTouch(rectNode, "touchmove", box.left + 300, box.top);
      expect(seen.at(-1)).toEqual([10, 20]);
    });

    // The band and point inverters read `scale.range()` themselves, so they already work in
    // the scale's coordinate space, which is also the space `pointer()` reports in. If either
    // path shifted its position by the range's start before handing it over, an inset band
    // scale would be wrong by twice the offset and these would report the wrong band.
    describe.each(["mouse", "touch"] as const)("with an inset band range, over %s", (path) => {
      test("should report the band under the pointer without double-counting the origin", () => {
        const xBand = scaleBand<string>().domain(["A", "B", "C"]).range([90, 390]);
        const seen = valueAt(move<string, string>().xScale(xBand).yScale(yScale), path, 10, 200);
        expect(seen[0]).toBe("A");
        const seenLast = valueAt(
          move<string, string>()
            .xScale(scaleBand<string>().domain(["A", "B", "C"]).range([90, 390]))
            .yScale(yScale),
          path,
          290,
          200
        );
        expect(seenLast[0]).toBe("C");
      });
    });

    // `padding` widens the hit area without moving the coordinate space, so a pointer in the
    // padded margin reads as a value just outside the domain rather than as the domain's end.
    test("should keep padding a hit-area widening rather than an origin shift", () => {
      const scale = scaleLinear().domain([0, 10]).range([100, 400]);
      const seen = valueAt(
        move<number, number>().xScale(scale).yScale(yScale).padding({ left: 20, right: 20 }),
        "touch",
        0,
        220
      );
      // The rect now starts 20px before the range, so its own left edge is one padding
      // width outside the domain: 20px is 10/300 * 20 of the domain.
      expect(seen[0]).toBeCloseTo(-20 / 30, 10);
    });

    // Under a scaled ancestor the touch path must resolve through the same inverse CTM the
    // mouse path uses. Measuring client deltas against `getBoundingClientRect()` mixes CSS
    // pixels into user-space values, and at scale(2) the visual midpoint of an inset range
    // read as the domain's end.
    test("should agree with the mouse path under a scaled ancestor", () => {
      container.style.transform = "scale(2)";
      container.style.transformOrigin = "top left";
      const scale = () => scaleLinear().domain([0, 100]).range([100, 400]);
      // 300 visual pixels past the rect's left edge is 150 user-space pixels, the midpoint of
      // the 300px-wide range.
      const overTouch = valueAt(
        move<number, number>().xScale(scale()).yScale(yScale),
        "touch",
        300,
        0
      );
      const overMouse = valueAt(
        move<number, number>().xScale(scale()).yScale(yScale),
        "mouse",
        300,
        0
      );
      expect(overTouch[0]).toBeCloseTo(50, 10);
      expect(overTouch[0]).toBeCloseTo(overMouse[0] as number, 10);
    });
  });
});
