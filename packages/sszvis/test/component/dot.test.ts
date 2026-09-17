import { afterEach, beforeEach, describe, expect, test } from "vitest";
import dot from "../../src/component/dot.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
import "../../src/d3-selectgroup.js";

type Datum = { x: number; y: number; r: number; color?: string };

describe("component/dot", () => {
  let container: HTMLDivElement;
  let layerKey = 0;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "600px";
    container.style.height = "400px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  /** Binds data to a fresh layer group and renders the component into it. */
  const group = (key?: string) =>
    createSvgLayer("#chart-container", undefined, {
      key: key ?? `dot-${++layerKey}`,
    }).selectGroup("dots");

  const render = (component: unknown, data: unknown[]) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  const testData: Datum[] = [
    { x: 10, y: 20, r: 4, color: "#f00" },
    { x: 60, y: 25, r: 8, color: "#0f0" },
  ];

  /** A dot wired to the test datum shape. */
  const dotOf = () =>
    dot()
      .x((d: Datum) => d.x)
      .y((d: Datum) => d.y)
      .radius((d: Datum) => d.r);

  const circles = (node: Element) => [...node.querySelectorAll("circle.sszvis-circle")];
  const attrs = (node: Element, attr: string) => circles(node).map((c) => c.getAttribute(attr));
  const anchors = (node: Element) =>
    [...node.querySelectorAll("[data-tooltip-anchor]")].map((a) => a.getAttribute("transform"));

  /**
   * Resolves once a transition has actually moved `attr` on `node`, rather than after a fixed
   * delay. A fixed delay can overshoot the whole 300ms transition under load, which would let
   * these tests pass with the interrupt removed.
   */
  const untilMoved = (node: Element, attr: string) =>
    new Promise<void>((resolve) => {
      const from = node.getAttribute(attr);
      const check = () => (node.getAttribute(attr) === from ? setTimeout(check, 0) : resolve());
      check();
    });

  /**
   * Waits out the component's 300ms transition, so that an attribute read afterwards is the
   * value the render settled on rather than a value some tween is still moving.
   */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

  /** The names of the tweens d3 scheduled on a node, e.g. ["attr.cx"]. */
  const tweenNames = (node: Element) => {
    const schedules = (node as Element & { __transition?: Record<string, unknown> }).__transition;
    if (!schedules) return null;
    return Object.values(schedules)
      .filter((s): s is { tween: { name: string }[] } => typeof s === "object" && s !== null)
      .flatMap((s) => s.tween.map((t) => t.name));
  };

  describesTheMarkJoin<Datum>(() => ({
    make: dotOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum(data)
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({ circles: circles(node).length, anchors: anchors(node).length }),
    full: { data: testData, marks: { circles: 2, anchors: 2 } },
    smaller: { data: [testData[0]], marks: { circles: 1, anchors: 1 } },
  }));

  describe("rendering", () => {
    test("should place each circle from x, y and radius whether they are accessors or constants", () => {
      const fromAccessors = render(dotOf(), testData);
      expect(attrs(fromAccessors, "cx")).toEqual(["10", "60"]);
      expect(attrs(fromAccessors, "cy")).toEqual(["20", "25"]);
      expect(attrs(fromAccessors, "r")).toEqual(["4", "8"]);

      // A constant reaches every circle as though an accessor had returned it for each datum,
      // which is the whole observable effect of the fn.functor wrapping on set.
      const fromConstants = render(dot().x(5).y(6).radius(7), [{}, {}]);
      expect(attrs(fromConstants, "cx")).toEqual(["5", "5"]);
      expect(attrs(fromConstants, "cy")).toEqual(["6", "6"]);
      expect(attrs(fromConstants, "r")).toEqual(["7", "7"]);
    });

    test("should apply fill and stroke when they are configured", () => {
      const node = render(
        dotOf()
          .fill((d: Datum) => d.color)
          .stroke("#00f"),
        testData,
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#0f0"]);
      expect(attrs(node, "stroke")).toEqual(["#00f", "#00f"]);
    });

    test("should write no fill or stroke attribute when neither is configured", () => {
      const node = render(dot().x(0).y(0).radius(3), [{}]);
      expect(circles(node)[0].getAttribute("fill")).toBeNull();
      expect(circles(node)[0].getAttribute("stroke")).toBeNull();
    });

    test("should move the circles to the new geometry when the data changes", () => {
      // transition is off so that the updated geometry is readable on this tick; the
      // transitioning case is covered in the transition block.
      const component = dotOf().transition(false);
      const g = group("update");
      g.datum(testData).call(component as never);
      g.datum([{ x: 99, y: 88, r: 12 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["99"]);
      expect(attrs(node, "cy")).toEqual(["88"]);
      expect(attrs(node, "r")).toEqual(["12"]);
    });
  });

  describe("accessors", () => {
    /**
     * Renders the given data with an x accessor that records every call, and returns the
     * recorded (datum, index) pairs.
     */
    const callLog = (data: unknown[], transition: boolean) => {
      const seen: [unknown, unknown][] = [];
      render(
        dot()
          .x((d: unknown, i: unknown) => {
            seen.push([d, i]);
            return 0;
          })
          .y(0)
          .radius(1)
          .transition(transition),
        data,
      );
      return seen;
    };

    test("should call the accessors with each datum and its index, for the circles and the anchor alike", () => {
      const seen = callLog(testData, false);
      const pairs = [
        [testData[0], 0],
        [testData[1], 1],
      ];
      expect(seen.slice(0, 2)).toEqual(pairs);
      // The last two calls are the anchor's, and they arrive with the index like the rest.
      expect(seen.slice(-2)).toEqual(pairs);
    });

    test("should anchor an index-based accessor at the same position as the dot it belongs to", () => {
      const node = render(
        dot()
          .x((_d: Datum, i: number) => i * 10)
          .y((_d: Datum, i: number) => i * 5)
          .radius(3),
        testData,
      );
      expect(attrs(node, "cx")).toEqual(["0", "10"]);
      expect(attrs(node, "cy")).toEqual(["0", "5"]);
      expect(anchors(node)).toEqual(["translate(0,0)", "translate(10,5)"]);
    });

    describe("known quirks", () => {
      test("calls every geometry accessor three times per datum on every render", () => {
        // NOTE: cx/cy/r are applied to the entering elements, applied once more so that
        // updates tween from their previous values, and read a third time to position the
        // tooltip anchor. The second application lands on the transition when there is one
        // and on the plain selection otherwise, so the count is the same either way.
        // Accessors are expected to be cheap and pure; an expensive scale lookup or an
        // accessor with side effects pays for all three passes.
        expect(callLog(testData, true).length).toBe(6);
        expect(callLog(testData, false).length).toBe(6);
      });

      test("passes an accessor the datum and the index only, not d3's node list", () => {
        // NOTE: the documented accessor signature is (datum, index). The geometry is read
        // through a wrapper that applies the missing-value guard and forwards only those
        // two, so an accessor cannot reach the group's nodes the way a raw d3 attribute
        // callback can.
        const seen: unknown[][] = [];
        render(
          dot()
            .x((...args: unknown[]) => {
              seen.push(args);
              return 0;
            })
            .y(0)
            .radius(1)
            .transition(false),
          [testData[0]],
        );
        expect(seen.map((args) => args.length)).toEqual([2, 2, 2]);
      });
    });
  });

  describe("configuration", () => {
    test("should report transition as enabled when it has not been configured", () => {
      expect(dot().transition()).toBe(true);
    });

    test("should name the component and the property when a required property is not configured", () => {
      expect(() => render(dot().y(1).radius(3), [{}])).toThrow("[dot] the x property is required");
      expect(() => render(dot().x(1).radius(3), [{}])).toThrow("[dot] the y property is required");
      expect(() => render(dot().x(1).y(2), [{}])).toThrow("[dot] the radius property is required");
    });

    test("should name the missing property even when the first render has no data", () => {
      // The failure used to depend on the data - an empty first render succeeded and the
      // same chart threw as soon as data arrived, which is how it escaped a smoke test.
      expect(() => render(dot().radius(3), [])).toThrow("[dot] the x property is required");
      const g = group("empty-then-populated");
      expect(() => g.datum([]).call(dot().radius(3) as never)).toThrow();
      expect(() => g.datum([{}]).call(dot().radius(3) as never)).toThrow();
    });

    test("should leave nothing rendered when a required property is missing", () => {
      const g = group("partial");
      expect(() => g.datum([{}]).call(dot().radius(3) as never)).toThrow();
      const node = g.node() as SVGGElement;
      expect(circles(node)).toEqual([]);
      expect(anchors(node)).toEqual([]);
    });

    test("should render radius, fill and stroke identically whether they are constants or accessors", () => {
      const constant = render(dotOf().radius(4).fill("#f00").stroke("#00f"), [testData[0]]);
      const accessor = render(
        dotOf()
          .radius(() => 4)
          .fill(() => "#f00")
          .stroke(() => "#00f"),
        [testData[0]],
      );
      expect(attrs(constant, "r")).toEqual(attrs(accessor, "r"));
      expect(attrs(constant, "fill")).toEqual(attrs(accessor, "fill"));
      expect(attrs(constant, "stroke")).toEqual(attrs(accessor, "stroke"));
      expect(attrs(accessor, "r")).toEqual(["4"]);
    });
  });

  describe("missing values", () => {
    // Which values count as unusable, and what each one coerces to, is the guard's own
    // contract and is covered once in test/svgUtils/toFinite.test.ts. What belongs here is
    // only that dot routes all three of its geometry attributes through that guard, plus the
    // negative-radius clamp below, which is dot's own rule rather than the guard's.
    test("should fall back to 0 on cx, cy and r when an accessor returns an unusable value", () => {
      const node = render(
        dot()
          .x(() => Number.NaN)
          .y(() => Number.NaN)
          .radius(() => Number.NaN),
        [{}],
      );
      expect(attrs(node, "cx")).toEqual(["0"]);
      expect(attrs(node, "cy")).toEqual(["0"]);
      expect(attrs(node, "r")).toEqual(["0"]);
    });

    test("should clamp a negative radius to 0 while leaving the coordinates signed", () => {
      // A negative r is invalid per the SVG spec and the circle is not rendered at all, so
      // it is clamped; a negative cx or cy is perfectly valid and is left alone.
      const node = render(dot().x(-5).y(-6).radius(-5), [{}]);
      expect(circles(node)[0].getAttribute("r")).toBe("0");
      expect(circles(node)[0].getAttribute("cx")).toBe("-5");
      expect(circles(node)[0].getAttribute("cy")).toBe("-6");
    });
  });

  describe("tooltip anchors", () => {
    // The anchor's own shape - an invisible rect that still has a measurable box - belongs to
    // the tooltipAnchor module and is covered in test/annotation/tooltipAnchor.test.ts. What
    // dot owns, and what these tests assert, is where it puts the anchor.

    test("should position the anchor from the guarded geometry when an accessor returns no usable value", () => {
      const node = render(
        dot()
          .x(() => Number.NaN)
          // @ts-expect-error - accessor returns undefined on purpose
          .y(() => undefined)
          .radius(3),
        [{}],
      );
      expect(anchors(node)).toEqual(["translate(0,0)"]);
    });

    test("should place the anchor at the centre of the dot whatever its radius", () => {
      expect(anchors(render(dotOf(), testData))).toEqual(["translate(10,20)", "translate(60,25)"]);
      // The radius does not enter the position, so a tooltip points at the centre rather
      // than drifting with the size of the dot.
      expect(anchors(render(dotOf().radius(1), [testData[0]]))).toEqual(["translate(10,20)"]);
      expect(anchors(render(dotOf().radius(100), [testData[0]]))).toEqual(["translate(10,20)"]);
    });

    test("should move the anchor to the new centre when the data changes", () => {
      const component = dotOf();
      const g = group("anchor-update");
      g.datum([testData[0]]).call(component as never);
      g.datum([{ x: 99, y: 88, r: 4 }]).call(component as never);
      expect(anchors(g.node() as SVGGElement)).toEqual(["translate(99,88)"]);
    });

    describe("known quirks", () => {
      test("still anchors a tooltip to a dot that was hidden with radius 0", () => {
        // NOTE: radius 0 is how the scatterplot-over-time example hides dots outside the
        // selected period. The circle disappears, but its anchor is still created and
        // positioned, so an invisible dot keeps a live tooltip target.
        const node = render(dotOf().radius(0), [testData[0]]);
        expect(attrs(node, "r")).toEqual(["0"]);
        expect(anchors(node)).toEqual(["translate(10,20)"]);
      });
    });
  });

  describe("transition", () => {
    test("should keep the synchronous geometry when an in-flight tween is still running", async () => {
      const g = group("interrupted");
      g.datum([{ x: 0, y: 0, r: 2 }]).call(dotOf().transition(true) as never);
      // Schedules a tween from 0 towards 500.
      g.datum([{ x: 500, y: 400, r: 20 }]).call(dotOf().transition(true) as never);
      await untilMoved(circles(g.node() as SVGGElement)[0], "cx");

      g.datum([{ x: 0, y: 0, r: 2 }]).call(dotOf().transition(false) as never);
      // Past the 300ms default, so an uninterrupted tween would have reached its destination.
      await settle();

      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["0"]);
      expect(attrs(node, "cy")).toEqual(["0"]);
      expect(attrs(node, "r")).toEqual(["2"]);
    });

    test("should not interrupt a transition the consumer scheduled on the same dots", async () => {
      const g = group("consumer-tween");
      g.datum([{ x: 0, y: 0, r: 2 }]).call(dotOf().transition(false) as never);

      // A consumer fades the dots in with its own, unnamed transition - the name a bare
      // selection.transition() uses, which the component's interrupt must not reach.
      g.selectAll("circle.sszvis-circle")
        .attr("opacity", 0)
        .transition()
        .duration(300)
        .attr("opacity", 1);
      await untilMoved(circles(g.node() as SVGGElement)[0], "opacity");

      g.datum([{ x: 5, y: 5, r: 3 }]).call(dotOf().transition(false) as never);
      await settle();

      const node = g.node() as SVGGElement;
      expect(attrs(node, "opacity")).toEqual(["1"]);
      expect(attrs(node, "cx")).toEqual(["5"]);
    });

    test("should render the same markup whether or not transition is enabled", () => {
      const withTransition = render(dotOf().transition(true), testData);
      const withoutTransition = render(dotOf().transition(false), testData);
      expect(withTransition.innerHTML).toBe(withoutTransition.innerHTML);
    });

    test("should give entering dots their geometry synchronously when transition is enabled", () => {
      // The entering elements are positioned on the join, so a fresh render is correct
      // synchronously - nothing waits for the first animation frame.
      const node = render(dotOf().transition(true), testData);
      expect(attrs(node, "cx")).toEqual(["10", "60"]);
      expect(attrs(node, "cy")).toEqual(["20", "25"]);
      expect(attrs(node, "r")).toEqual(["4", "8"]);
    });

    test("should animate the geometry towards the new values when transition is enabled", async () => {
      const component = dotOf().transition(true);
      const g = group("animated");
      g.datum([{ x: 0, y: 0, r: 1 }]).call(component as never);
      await settle();
      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["0"]);

      g.datum([{ x: 500, y: 400, r: 20 }]).call(component as never);
      // The update tweens from its previous value, so it still holds it on this tick.
      expect(attrs(node, "cx")).toEqual(["0"]);
      expect(attrs(node, "cy")).toEqual(["0"]);
      expect(attrs(node, "r")).toEqual(["1"]);

      await settle();
      expect(attrs(node, "cx")).toEqual(["500"]);
      expect(attrs(node, "cy")).toEqual(["400"]);
      expect(attrs(node, "r")).toEqual(["20"]);
    });

    test("should write the new geometry straight away and animate nothing when transition is disabled", async () => {
      const component = dotOf().transition(false);
      const g = group("no-transition");
      g.datum([{ x: 0, y: 0, r: 1 }]).call(component as never);
      g.datum([{ x: 500, y: 400, r: 20 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["500"]);
      expect(attrs(node, "cy")).toEqual(["400"]);
      expect(attrs(node, "r")).toEqual(["20"]);

      // Nothing was scheduled, so nothing moves afterwards either. Reading the geometry again
      // past the transition's own duration is the observable form of "no tween was created" -
      // a tween would have had to start from the old value and travel, which would show up
      // either here or in the synchronous read above.
      await settle();
      expect(attrs(node, "cx")).toEqual(["500"]);
      expect(attrs(node, "cy")).toEqual(["400"]);
      expect(attrs(node, "r")).toEqual(["20"]);
    });

    test("should land the new colour immediately rather than interpolating when the fill changes", async () => {
      // Decided rather than inherited: the colour scales these charts use are categorical,
      // and interpolating between two category colours reads as a third category. So the
      // colour is applied to the selection, with the transition left to the geometry.
      const component = dotOf();
      const g = group("colour-jump");
      g.datum([testData[0]]).call(component.fill("#f00") as never);
      g.datum([testData[0]]).call(component.fill("#0f0") as never);
      const node = g.node() as SVGGElement;

      // Already the destination colour on the tick of the render, with no intermediate
      // blend, and unchanged once a tween would have run its course.
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
      await settle();
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
    });

    describe("known quirks", () => {
      test("a re-render stacks another schedule on the same circles", () => {
        // NOTE: d3's own semantics rather than a defect of this component - a second
        // transition on the same node is scheduled alongside the first and supersedes it
        // once it starts. It does mean a chart that re-renders faster than 300ms replaces
        // its animation mid-flight rather than continuing it.
        const component = dotOf().transition(true);
        const g = group("interrupt");
        g.datum([testData[0]]).call(component as never);
        expect(tweenNames(circles(g.node() as SVGGElement)[0])).toEqual([
          "attr.cx",
          "attr.cy",
          "attr.r",
        ]);
        g.datum([testData[0]]).call(component as never);
        expect(tweenNames(circles(g.node() as SVGGElement)[0])?.length).toBe(6);
      });
    });
  });
});
