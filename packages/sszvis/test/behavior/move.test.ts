import { scaleBand, scaleLinear, scalePoint } from "d3";
import { afterEach, assert, beforeEach, describe, expect, expectTypeOf, test, vi } from "vitest";
import move, { type MoveComponent, type MoveEventHandler } from "../../src/behavior/move.js";
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
    // A mouse drag installs listeners on `window` and `document` that outlive the chart. A
    // real mouseup is how a user ends one, so it is also how this suite stops a drag from one
    // test reaching into the next.
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    container?.parentNode?.removeChild(container);
    vi.restoreAllMocks();
  });

  /**
   * A touch event carries no position of its own: a `Touch` in `event.touches` does. Safari
   * mobile is the reason every touch case here is built this way rather than with clientX/clientY
   * on the event.
   */
  function touchEvent(type: string, touches: Array<Record<string, number>>): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const list = touches.map((touch, i) => ({ identifier: i, ...touch }));
    Object.defineProperty(event, "touches", { value: list, writable: false });
    Object.defineProperty(event, "changedTouches", { value: list, writable: false });
    return event;
  }

  function hitLayer() {
    return svg.select<SVGRectElement>("[data-sszvis-behavior-move]");
  }

  function hitLayerNode(): SVGRectElement {
    const node = hitLayer().node();
    assert(node);
    return node;
  }

  test("should default padding to zero on every side, and neither cancel scrolling nor restrict itself to pans, when nothing is configured", () => {
    const moveComponent = move<number, number>().xScale(xScale).yScale(yScale);
    expect(moveComponent.padding()).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
    expect(moveComponent.cancelScrolling()()).toBe(false);
    expect(moveComponent.fireOnPanOnly()()).toBe(false);
  });

  test("should cover the chart with an invisible hit layer when rendered", () => {
    svg.call(move<number, number>().xScale(xScale).yScale(yScale));
    expect(hitLayer().empty()).toBe(false);
    expect(hitLayer().attr("class")).toBe("sszvis-interactive");
    expect(hitLayer().attr("fill")).toBe("transparent");
  });

  test("should mark the hit layer draggable when the component is configured as draggable", () => {
    svg.call(move<number, number>().xScale(xScale).yScale(yScale).draggable(true));
    expect(hitLayer().classed("sszvis-interactive--draggable")).toBe(true);
  });

  test("should grow the hit area on every side when padding is configured", () => {
    svg.call(
      move<number, number>()
        .xScale(xScale)
        .yScale(yScale)
        .padding({ top: 10, right: 15, bottom: 20, left: 25 }),
    );
    expect(hitLayer().attr("x")).toBe("-25"); // 0 - 25 = -25
    expect(hitLayer().attr("y")).toBe("-10"); // 0 - 10 = -10
    expect(hitLayer().attr("width")).toBe("340"); // 300 + 25 + 15 = 340
    expect(hitLayer().attr("height")).toBe("230"); // 200 + 10 + 20 = 230
  });

  describe("over the mouse", () => {
    function handlers() {
      const spies = { start: vi.fn(), move: vi.fn(), drag: vi.fn(), end: vi.fn() };
      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", spies.start)
          .on("move", spies.move)
          .on("drag", spies.drag)
          .on("end", spies.end),
      );
      return spies;
    }

    function counts(spies: ReturnType<typeof handlers>) {
      return {
        start: spies.start.mock.calls.length,
        move: spies.move.mock.calls.length,
        drag: spies.drag.mock.calls.length,
        end: spies.end.mock.calls.length,
      };
    }

    function mouseAt(node: SVGRectElement, type: string, init: MouseEventInit = {}) {
      const box = node.getBoundingClientRect();
      node.dispatchEvent(
        new MouseEvent(type, {
          clientX: box.left + 150,
          clientY: box.top + 100,
          bubbles: true,
          ...init,
        }),
      );
    }

    // Each verb must reach exactly one handler. Asserting only that a spy fired cannot catch a
    // handler wired to the wrong verb, which is why the counts below are checked as a set after
    // every step.
    test("should report exactly one event per pointer verb when the mouse enters, moves, presses, drags and leaves", () => {
      const spies = handlers();
      const node = hitLayerNode();

      mouseAt(node, "mouseover");
      expect(counts(spies)).toEqual({ start: 1, move: 0, drag: 0, end: 0 });

      mouseAt(node, "mousemove");
      expect(counts(spies)).toEqual({ start: 1, move: 1, drag: 0, end: 0 });

      // Pressing the button is not itself an event; it turns the next move into a drag.
      mouseAt(node, "mousedown");
      expect(counts(spies)).toEqual({ start: 1, move: 1, drag: 0, end: 0 });

      mouseAt(node, "mousemove");
      expect(counts(spies)).toEqual({ start: 1, move: 1, drag: 1, end: 0 });

      mouseAt(node, "mouseout");
      expect(counts(spies)).toEqual({ start: 1, move: 1, drag: 1, end: 1 });
    });

    // A drag started inside the chart can be released anywhere, so the mouseup that ends it is
    // listened for on `window` rather than on the hit layer. Until it arrives every move is a
    // drag; afterwards they are plain moves again.
    test("should end the drag and report plain moves again when the button is released outside the chart", () => {
      const spies = handlers();
      const node = hitLayerNode();

      mouseAt(node, "mousedown");
      mouseAt(node, "mousemove");
      expect(counts(spies)).toEqual({ start: 0, move: 0, drag: 1, end: 0 });

      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      expect(spies.end).toHaveBeenCalledTimes(1);

      mouseAt(node, "mousemove");
      expect(counts(spies)).toEqual({ start: 0, move: 1, drag: 1, end: 1 });
    });

    // BUG: the second escape hatch, a mouseout on `document`, never ends a drag in Chromium.
    // It is meant to catch the pointer leaving the page, and it decides that by reading
    // `relatedTarget` and the legacy `toElement` alias - but it reads them off the *mousedown*
    // it closed over rather than off the mouseout that fired, and Chromium reports `toElement`
    // on a mousedown as the event's own target. The element it finds is therefore always the
    // hit layer, never null and never HTML, so the branch is unreachable and only the window
    // mouseup above ends a drag. Pinned as observed, not as intended: a fix should turn this
    // test red.
    test("should keep reporting drags when a mouseout reaches the document, whatever the press it started from", () => {
      const spies = handlers();
      const node = hitLayerNode();

      for (const relatedTarget of [container, null]) {
        mouseAt(node, "mousedown", { relatedTarget });
        document.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        mouseAt(node, "mousemove");
      }
      expect(counts(spies)).toEqual({ start: 0, move: 0, drag: 2, end: 0 });
    });
  });

  describe("over touch", () => {
    // A touch opens a pan session: the three "pointer is here" events fire at once, further
    // positions arrive as drags, and the session is torn down on touchend. Teardown is asserted
    // the way a user would notice it - a stray touchmove afterwards reports nothing - rather
    // than by reading d3's listener registry.
    test("should report each position between touchstart and touchend, and nothing after it, when a finger drags", () => {
      const spies = { start: vi.fn(), move: vi.fn(), drag: vi.fn(), end: vi.fn() };
      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", spies.start)
          .on("move", spies.move)
          .on("drag", spies.drag)
          .on("end", spies.end),
      );
      const node = hitLayerNode();
      const box = node.getBoundingClientRect();

      node.dispatchEvent(
        touchEvent("touchstart", [{ clientX: box.left + 150, clientY: box.top + 100 }]),
      );
      expect(spies.start).toHaveBeenCalledTimes(1);
      expect(spies.drag).toHaveBeenCalledTimes(1);
      expect(spies.move).toHaveBeenCalledTimes(1);
      expect(spies.end).not.toHaveBeenCalled();

      node.dispatchEvent(
        touchEvent("touchmove", [{ clientX: box.left + 200, clientY: box.top + 50 }]),
      );
      expect(spies.drag).toHaveBeenCalledTimes(2);
      expect(spies.move).toHaveBeenCalledTimes(2);

      const touchend = touchEvent("touchend", []);
      node.dispatchEvent(touchend);
      expect(spies.end).toHaveBeenCalledTimes(1);
      expect(spies.end.mock.calls[0][0]).toBe(touchend);

      node.dispatchEvent(
        touchEvent("touchmove", [{ clientX: box.left + 250, clientY: box.top + 20 }]),
      );
      node.dispatchEvent(touchEvent("touchend", []));
      expect(spies.drag).toHaveBeenCalledTimes(2);
      expect(spies.move).toHaveBeenCalledTimes(2);
      expect(spies.end).toHaveBeenCalledTimes(1);
    });

    test("should report the touch when its coordinates live only in the touches array, as they do on Safari mobile", () => {
      const spies = { start: vi.fn(), move: vi.fn(), drag: vi.fn() };
      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", spies.start)
          .on("move", spies.move)
          .on("drag", spies.drag),
      );

      const event = touchEvent("touchstart", [{ clientX: 150, clientY: 100 }]);
      // Guards the premise: d3's `pointer()` reads clientX/clientY off its argument, and on
      // Safari mobile the event does not have them.
      expect(Reflect.get(event, "clientX")).toBeUndefined();
      expect(Reflect.get(event, "clientY")).toBeUndefined();

      hitLayerNode().dispatchEvent(event);
      expect(spies.start).toHaveBeenCalled();
      expect(spies.move).toHaveBeenCalled();
      expect(spies.drag).toHaveBeenCalled();
    });

    // A malformed touch must be ignored rather than resolved: `pointer()` throws when it sets a
    // non-finite `SVGPoint.x`, so without the guard the handler would throw for every case
    // below. The throw has to be observed through `window.onerror`, not `expect().toThrow()`:
    // `dispatchEvent` reports a listener's exception as an uncaught error and returns normally,
    // so a `toThrow` assertion would pass whether or not the guard is present.
    test("should report nothing and throw nothing when a touch carries no usable coordinates", () => {
      const spies = { start: vi.fn(), move: vi.fn(), drag: vi.fn(), end: vi.fn() };
      svg.call(
        move<number, number>()
          .xScale(xScale)
          .yScale(yScale)
          .on("start", spies.start)
          .on("move", spies.move)
          .on("drag", spies.drag)
          .on("end", spies.end),
      );
      const node = hitLayerNode();
      const box = node.getBoundingClientRect();

      const uncaught: string[] = [];
      const recordError = (errorEvent: ErrorEvent) => {
        uncaught.push(errorEvent.message);
        errorEvent.preventDefault();
      };
      window.addEventListener("error", recordError);

      try {
        // No touch at all, then each axis alone - a guard that checked only one of them would
        // let the other through - then NaN and infinite coordinates, which separate a
        // finiteness test from a mere missing-value test.
        const malformed: Array<Array<Record<string, number>>> = [
          [],
          [{}],
          [{ clientX: box.left + 150 }],
          [{ clientY: box.top + 100 }],
          [{ clientX: Number.NaN, clientY: Number.NaN }],
          [{ clientX: Number.POSITIVE_INFINITY, clientY: box.top + 100 }],
          [{ clientX: box.left + 150, clientY: Number.NEGATIVE_INFINITY }],
        ];
        for (const touches of malformed) {
          node.dispatchEvent(touchEvent("touchstart", touches));
          expect(uncaught).toEqual([]);
          expect(spies.start).not.toHaveBeenCalled();
          expect(spies.move).not.toHaveBeenCalled();
          expect(spies.drag).not.toHaveBeenCalled();
          expect(spies.end).not.toHaveBeenCalled();
        }

        // The same probe on the pan path, which needs a real touchstart to open a session
        // first.
        node.dispatchEvent(
          touchEvent("touchstart", [{ clientX: box.left + 150, clientY: box.top + 100 }]),
        );
        expect(spies.move).toHaveBeenCalledTimes(1);
        spies.move.mockClear();
        spies.drag.mockClear();

        for (const touches of malformed) {
          node.dispatchEvent(touchEvent("touchmove", touches));
          expect(uncaught).toEqual([]);
          expect(spies.move).not.toHaveBeenCalled();
          expect(spies.drag).not.toHaveBeenCalled();
        }
      } finally {
        window.removeEventListener("error", recordError);
        node.dispatchEvent(touchEvent("touchend", []));
      }
    });

    // `cancelScrolling` and `fireOnPanOnly` are the two switches behind the bar charts' "pan
    // over the bars" interaction, and they are independent: the first decides whether the
    // browser scrolls, the second whether the chart reports anything at all. Together they give
    // the three configurations below - area and line charts (report always, never cancel), bar
    // charts (report only over a bar, and cancel there), and the in-between case where a chart
    // cancels scrolling but still reports everywhere.
    describe("with cancelScrolling and fireOnPanOnly configured", () => {
      // Positions in the left half of the 300px range are "over a bar".
      const overABar = (x: number | null) => x !== null && x < 50;

      function render(
        handlers: Record<"start" | "move" | "drag" | "end", ReturnType<typeof vi.fn>>,
        fireOnPanOnly: boolean,
        cancelScrolling: (x: number | null) => boolean,
      ) {
        svg.call(
          move<number, number>()
            .xScale(xScale)
            .yScale(yScale)
            .cancelScrolling(cancelScrolling)
            .fireOnPanOnly(fireOnPanOnly)
            .on("start", handlers.start)
            .on("move", handlers.move)
            .on("drag", handlers.drag)
            .on("end", handlers.end),
        );
        return hitLayerNode();
      }

      function makeSpies() {
        return { start: vi.fn(), move: vi.fn(), drag: vi.fn(), end: vi.fn() };
      }

      test("should cancel the browser's scroll when the touch position satisfies the cancelScrolling predicate", () => {
        const handlers = makeSpies();
        const node = render(handlers, false, overABar);
        const box = node.getBoundingClientRect();

        const onBar = touchEvent("touchstart", [
          { clientX: box.left + 30, clientY: box.top + 100 },
        ]);
        node.dispatchEvent(onBar);
        expect(onBar.defaultPrevented).toBe(true);
        expect(handlers.move).toHaveBeenCalledTimes(1);

        node.dispatchEvent(touchEvent("touchend", []));

        const offBar = touchEvent("touchstart", [
          { clientX: box.left + 250, clientY: box.top + 100 },
        ]);
        node.dispatchEvent(offBar);
        expect(offBar.defaultPrevented).toBe(false);
      });

      test("should still report the touch when cancelScrolling rejects it and fireOnPanOnly is left off", () => {
        const handlers = makeSpies();
        const node = render(handlers, false, overABar);
        const box = node.getBoundingClientRect();

        node.dispatchEvent(
          touchEvent("touchstart", [{ clientX: box.left + 250, clientY: box.top + 100 }]),
        );
        expect(handlers.start).toHaveBeenCalledTimes(1);
        expect(handlers.move).toHaveBeenCalledTimes(1);
        expect(handlers.drag).toHaveBeenCalledTimes(1);
      });

      test("should report nothing at all when cancelScrolling rejects the touch and fireOnPanOnly is set", () => {
        const handlers = makeSpies();
        const node = render(handlers, true, overABar);
        const box = node.getBoundingClientRect();

        node.dispatchEvent(
          touchEvent("touchstart", [{ clientX: box.left + 250, clientY: box.top + 100 }]),
        );
        expect(handlers.start).not.toHaveBeenCalled();
        expect(handlers.move).not.toHaveBeenCalled();
        expect(handlers.drag).not.toHaveBeenCalled();
        expect(handlers.end).not.toHaveBeenCalled();

        // No session was opened either, so a following touchmove reports nothing.
        node.dispatchEvent(
          touchEvent("touchmove", [{ clientX: box.left + 30, clientY: box.top + 100 }]),
        );
        expect(handlers.drag).not.toHaveBeenCalled();
      });

      test("should end the pan instead of dragging when the finger leaves the panning profile and fireOnPanOnly is set", () => {
        const handlers = makeSpies();
        const node = render(handlers, true, overABar);
        const box = node.getBoundingClientRect();

        node.dispatchEvent(
          touchEvent("touchstart", [{ clientX: box.left + 30, clientY: box.top + 100 }]),
        );
        expect(handlers.drag).toHaveBeenCalledTimes(1);
        expect(handlers.end).not.toHaveBeenCalled();

        node.dispatchEvent(
          touchEvent("touchmove", [{ clientX: box.left + 60, clientY: box.top + 100 }]),
        );
        expect(handlers.drag).toHaveBeenCalledTimes(2);

        node.dispatchEvent(
          touchEvent("touchmove", [{ clientX: box.left + 250, clientY: box.top + 100 }]),
        );
        expect(handlers.drag).toHaveBeenCalledTimes(2);
        expect(handlers.end).toHaveBeenCalledTimes(1);

        // Back over a bar, the pan resumes: leaving the profile ends the reported interaction
        // without closing the session.
        node.dispatchEvent(
          touchEvent("touchmove", [{ clientX: box.left + 30, clientY: box.top + 100 }]),
        );
        expect(handlers.drag).toHaveBeenCalledTimes(3);

        node.dispatchEvent(touchEvent("touchend", []));
      });

      test("should pass the inverted position, not the pixel position, to the cancelScrolling predicate when a finger moves", () => {
        const seen: Array<[number | null, number | null]> = [];
        const handlers = makeSpies();
        svg.call(
          move<number, number>()
            .xScale(xScale)
            .yScale(yScale)
            .cancelScrolling((x, y) => {
              seen.push([x, y]);
              return false;
            })
            .on("move", handlers.move),
        );
        const node = hitLayerNode();
        const box = node.getBoundingClientRect();
        node.dispatchEvent(
          touchEvent("touchstart", [{ clientX: box.left + 150, clientY: box.top + 100 }]),
        );
        expect(seen).toEqual([[50, 25]]);
      });
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
      clientY: number,
    ) {
      node.dispatchEvent(touchEvent(type, [{ clientX, clientY }]));
    }

    function valueAt<XDomain, YDomain>(
      moveComponent: MoveComponent<XDomain, YDomain>,
      path: "mouse" | "touch",
      offsetX: number,
      offsetY: number,
    ): [unknown, unknown] {
      let seen: [unknown, unknown] = [undefined, undefined];
      svg.call(
        moveComponent.on("move", (_e, x, y) => {
          seen = [x, y];
        }),
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
          [0, 0],
        );
      });

      test("should report the domain end at the end of the range", () => {
        expect(valueAt(move<number, number>().xScale(xScale).yScale(yScale), path, 300, 0)).toEqual(
          [100, 50],
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
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 0, 200),
        ).toEqual([0, 0]);
      });

      test("should report the domain end at the end of the range", () => {
        expect(
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 300, 0),
        ).toEqual([10, 20]);
      });

      test("should report the midpoint of the domain at the middle of the range", () => {
        expect(
          valueAt(move<number, number>().xScale(insetX()).yScale(insetY()), path, 150, 100),
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
          }),
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
          200,
        );
        expect(seenLast[0]).toBe("C");
      });
    });

    // A point scale has its own inverter, with its own padding arithmetic: it divides the step
    // rather than the band, so a position that a band scale resolves correctly can still land
    // on the wrong point.
    describe.each(["mouse", "touch"] as const)("with an inset point range, over %s", (path) => {
      test("should report the point under the pointer without double-counting the origin", () => {
        const seenFirst = valueAt(
          move<string, string>()
            .xScale(scalePoint<string>().domain(["A", "B", "C"]).range([90, 390]).padding(0.1))
            .yScale(yScale),
          path,
          10,
          200,
        );
        expect(seenFirst[0]).toBe("A");
        const seenLast = valueAt(
          move<string, string>()
            .xScale(scalePoint<string>().domain(["A", "B", "C"]).range([90, 390]).padding(0.1))
            .yScale(yScale),
          path,
          290,
          200,
        );
        expect(seenLast[0]).toBe("C");
      });
    });

    // `padding` widens the hit area without moving the coordinate space, so a pointer in the
    // padded margin reads as a value just outside the domain rather than as the domain's end.
    test("should keep padding a hit-area widening rather than an origin shift when the pointer is in the padded margin", () => {
      const scale = scaleLinear().domain([0, 10]).range([100, 400]);
      const seen = valueAt(
        move<number, number>().xScale(scale).yScale(yScale).padding({ left: 20, right: 20 }),
        "touch",
        0,
        220,
      );
      // The rect now starts 20px before the range, so its own left edge is one padding
      // width outside the domain: 20px is 10/300 * 20 of the domain.
      expect(seen[0]).toBeCloseTo(-20 / 30, 10);
    });

    // Under a scaled ancestor the touch path must resolve through the same inverse CTM the
    // mouse path uses. Measuring client deltas against `getBoundingClientRect()` mixes CSS
    // pixels into user-space values, and at scale(2) the visual midpoint of an inset range
    // read as the domain's end.
    test("should agree with the mouse path when the container has a scaled ancestor", () => {
      container.style.transform = "scale(2)";
      container.style.transformOrigin = "top left";
      const scale = () => scaleLinear().domain([0, 100]).range([100, 400]);
      // 300 visual pixels past the rect's left edge is 150 user-space pixels, the midpoint of
      // the 300px-wide range.
      const overTouch = valueAt(
        move<number, number>().xScale(scale()).yScale(yScale),
        "touch",
        300,
        0,
      );
      const overMouse = valueAt(
        move<number, number>().xScale(scale()).yScale(yScale),
        "mouse",
        300,
        0,
      );
      expect(overTouch[0]).toBeCloseTo(50, 10);
      expect(overTouch[0]).toBeCloseTo(overMouse[0] as number, 10);
    });
  });

  describe("typed event handlers", () => {
    test("should accept a handler shaped like the configured domains when the scales are typed", () => {
      const seen: [number | null, string | null][] = [];
      // The point of this test is the handler's declared parameter types: before `MoveEventHandler`
      // became generic, a handler narrowed to the component's own domains was a compile error.
      const onMove = (_event: Event, x: number | null, y: string | null) => {
        seen.push([x, y]);
      };
      expectTypeOf(onMove).toMatchTypeOf<MoveEventHandler<number, string>>();

      const yBandScale = scaleBand<string>().domain(["a", "b"]).range([0, 200]);
      const component = move<number, string>().xScale(xScale).yScale(yBandScale).on("move", onMove);
      svg.call(component);

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      if (!rectNode) throw new Error("rectNode not found");
      const rect = rectNode.getBoundingClientRect();
      rectNode.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: rect.left + 150,
          clientY: rect.top + 50,
          bubbles: true,
        }),
      );

      expect(seen).toHaveLength(1);
      expect(seen[0][0]).toBeCloseTo(50, 10);
      expect(seen[0][1]).toBe("a");
    });

    test("should pass the end handler only the event when the pointer leaves", () => {
      const endHandler = vi.fn((_event: Event) => {});
      svg.call(move<number, number>().xScale(xScale).yScale(yScale).on("end", endHandler));

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      rectNode?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));

      expect(endHandler).toHaveBeenCalled();
      // The mouse path forwards d3's listener arguments verbatim, so the only extra argument is
      // the layer rect's bound datum (0), never an inverted position. That is why the "end"
      // overload declares the event alone.
      const [endEvent, ...rest] = endHandler.mock.calls[0] as unknown[];
      expect(endEvent).toBeInstanceOf(Event);
      expect(rest).toEqual([0]);
    });

    test("should call every listener when handlers are registered under d3's namespaced typenames", () => {
      const first = vi.fn();
      const second = vi.fn();
      const component = move<number, number>()
        .xScale(xScale)
        .yScale(yScale)
        .on("move.one", first)
        .on("move.two", second);
      svg.call(component);

      expect(component.on("move.one")).toBe(first);

      const rectNode = svg.select<SVGRectElement>("[data-sszvis-behavior-move]").node();
      if (!rectNode) throw new Error("rectNode not found");
      const rect = rectNode.getBoundingClientRect();
      rectNode.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: rect.left + 10,
          clientY: rect.top + 10,
          bubbles: true,
        }),
      );

      expect(first).toHaveBeenCalled();
      expect(second).toHaveBeenCalled();
    });
  });
});
