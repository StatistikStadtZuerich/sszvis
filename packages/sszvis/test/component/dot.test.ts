import { afterEach, beforeEach, describe, expect, test } from "vitest";
import dot from "../../src/component/dot.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
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

  /** The names of the tweens d3 scheduled on a node, e.g. ["attr.cx"]. */
  const tweenNames = (node: Element) => {
    const schedules = (node as Element & { __transition?: Record<string, unknown> }).__transition;
    if (!schedules) return null;
    return Object.values(schedules)
      .filter((s): s is { tween: { name: string }[] } => typeof s === "object" && s !== null)
      .flatMap((s) => s.tween.map((t) => t.name));
  };

  describe("rendering", () => {
    test("should render one classed circle per datum", () => {
      const node = render(dotOf(), testData);
      expect(circles(node).length).toBe(2);
      for (const c of circles(node)) expect(c.tagName).toBe("circle");
    });

    test("should take cx, cy and r from the accessors", () => {
      const node = render(dotOf(), testData);
      expect(attrs(node, "cx")).toEqual(["10", "60"]);
      expect(attrs(node, "cy")).toEqual(["20", "25"]);
      expect(attrs(node, "r")).toEqual(["4", "8"]);
    });

    test("should accept constants in place of accessors", () => {
      const node = render(dot().x(5).y(6).radius(7), [{}, {}]);
      expect(attrs(node, "cx")).toEqual(["5", "5"]);
      expect(attrs(node, "cy")).toEqual(["6", "6"]);
      expect(attrs(node, "r")).toEqual(["7", "7"]);
    });

    test("should apply fill and stroke, as accessors or as constants", () => {
      const node = render(
        dotOf()
          .fill((d: Datum) => d.color)
          .stroke("#00f"),
        testData,
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#0f0"]);
      expect(attrs(node, "stroke")).toEqual(["#00f", "#00f"]);
    });

    test("should omit fill and stroke when they are not configured", () => {
      const node = render(dot().x(0).y(0).radius(3), [{}]);
      expect(circles(node)[0].getAttribute("fill")).toBeNull();
      expect(circles(node)[0].getAttribute("stroke")).toBeNull();
    });

    test("should render nothing for an empty data array", () => {
      const node = render(dotOf(), []);
      expect(circles(node).length).toBe(0);
      expect(anchors(node)).toEqual([]);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = dotOf();
      const g = group("rerender");
      g.datum(testData).call(component as never);
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(circles(node).length).toBe(2);
      expect(anchors(node).length).toBe(2);
    });

    test("should remove circles and anchors when the data shrinks", () => {
      const component = dotOf();
      const g = group("shrink");
      g.datum(testData).call(component as never);
      g.datum([testData[0]]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(circles(node).length).toBe(1);
      expect(anchors(node).length).toBe(1);
    });

    test("should update the geometry when the data changes", () => {
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

    test("should pass each datum and its index to the accessors", () => {
      const seen = callLog(testData, false);
      expect(seen.slice(0, 2)).toEqual([
        [testData[0], 0],
        [testData[1], 1],
      ]);
    });

    test("should pass the index to the accessors read for the tooltip anchor", () => {
      const seen = callLog(testData, false);
      // The last two calls are the anchor's, and they arrive with the index like the rest.
      expect(seen.slice(-2)).toEqual([
        [testData[0], 0],
        [testData[1], 1],
      ]);
    });

    test("should anchor an index-based accessor at the same position as the dot", () => {
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
    test("should default transition to true", () => {
      expect(dot().transition()).toBe(true);
    });

    test("should name the component and the property when x is not configured", () => {
      expect(() => render(dot().y(1).radius(3), [{}])).toThrow("[dot] the x property is required");
    });

    test("should name the component and the property when y is not configured", () => {
      expect(() => render(dot().x(1).radius(3), [{}])).toThrow("[dot] the y property is required");
    });

    test("should name the component and the property when radius is not configured", () => {
      expect(() => render(dot().x(1).y(2), [{}])).toThrow("[dot] the radius property is required");
    });

    test("should report a missing property before any data arrives", () => {
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

    test("should read back an unset required property as undefined", () => {
      // x, y and radius have no default - required() only runs at render - so the getters
      // return undefined until they are set, which is what their types now say.
      const component = dot();
      expect(component.x()).toBeUndefined();
      expect(component.y()).toBeUndefined();
      expect(component.radius()).toBeUndefined();
    });

    test("should wrap every visual property in fn.functor, so the getters agree", () => {
      const component = dot().x(5).y(6).radius(7).fill("#f00").stroke("#00f");
      expect(typeof component.x()).toBe("function");
      expect(component.x()?.()).toBe(5);
      expect(typeof component.y()).toBe("function");
      expect(component.y()?.()).toBe(6);
      expect(typeof component.radius()).toBe("function");
      expect(component.radius()?.()).toBe(7);
      expect(typeof component.fill()).toBe("function");
      expect(component.fill()?.()).toBe("#f00");
      expect(typeof component.stroke()).toBe("function");
      expect(component.stroke()?.()).toBe("#00f");
    });

    test("should render radius, fill and stroke identically as constants or accessors", () => {
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

    test("should still allow a radius of 0, which is how a dot is hidden", () => {
      expect(attrs(render(dotOf().radius(0), [testData[0]]), "r")).toEqual(["0"]);
    });
  });

  describe("missing values", () => {
    /** Renders a single dot whose x and radius are both the given value. */
    const withValue = (value: unknown) => {
      const node = render(
        dot()
          // The typed API rejects a non-numeric accessor. These tests deliberately supply
          // one to characterise the runtime coercion, so the rejection is the point.
          // @ts-expect-error - accessor returns unknown on purpose
          .x(() => value)
          .y(0)
          // @ts-expect-error - accessor returns unknown on purpose
          .radius(() => value),
        [{}],
      );
      return {
        cx: circles(node)[0].getAttribute("cx"),
        r: circles(node)[0].getAttribute("r"),
      };
    };

    test("should pass real numbers through, including negatives and zero", () => {
      expect(withValue(0).cx).toBe("0");
      expect(withValue(-5).cx).toBe("-5");
      expect(withValue(12.5).cx).toBe("12.5");
    });

    test("should replace undefined and null with 0", () => {
      // The attribute used to be dropped for both, which left the circle on the SVG
      // default rather than on the guarded 0 that bar writes.
      expect(withValue(undefined)).toEqual({ cx: "0", r: "0" });
      expect(withValue(null)).toEqual({ cx: "0", r: "0" });
    });

    test("should replace NaN with 0, as bar does", () => {
      // NaN is what a scale returns outside its domain, and what any arithmetic on a null
      // measurement produces, so this is the common case rather than an exotic one.
      expect(withValue(Number.NaN)).toEqual({ cx: "0", r: "0" });
    });

    test("should replace Infinity with 0", () => {
      // A scale over a zero-width domain produces Infinity, and "Infinity" is not a valid
      // SVG length.
      expect(withValue(Number.POSITIVE_INFINITY)).toEqual({ cx: "0", r: "0" });
      expect(withValue(Number.NEGATIVE_INFINITY)).toEqual({ cx: "0", r: "0" });
    });

    test("should replace values that do not coerce to a number with 0", () => {
      expect(withValue("abc")).toEqual({ cx: "0", r: "0" });
    });

    test("should normalise values that do coerce to their number", () => {
      expect(withValue("50")).toEqual({ cx: "50", r: "50" });
      expect(withValue("")).toEqual({ cx: "0", r: "0" });
      expect(withValue(true)).toEqual({ cx: "1", r: "1" });
    });

    test("should clamp a negative radius to 0 while leaving coordinates signed", () => {
      // A negative r is invalid per the SVG spec and the circle is not rendered at all, so
      // it is clamped; a negative cx or cy is perfectly valid and is left alone.
      const node = render(dot().x(-5).y(-6).radius(-5), [{}]);
      expect(circles(node)[0].getAttribute("r")).toBe("0");
      expect(circles(node)[0].getAttribute("cx")).toBe("-5");
      expect(circles(node)[0].getAttribute("cy")).toBe("-6");
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per datum", () => {
      const node = render(dotOf(), testData);
      expect(anchors(node).length).toBe(2);
    });

    test("should render the anchor as an invisible 1x1 rect", () => {
      const node = render(dotOf(), [testData[0]]);
      const anchor = node.querySelector("[data-tooltip-anchor]");
      expect(anchor?.tagName).toBe("rect");
      expect(anchor?.getAttribute("width")).toBe("1");
      expect(anchor?.getAttribute("height")).toBe("1");
      expect(anchor?.getAttribute("fill")).toBe("none");
      expect(anchor?.getAttribute("stroke")).toBe("none");
    });

    test("should position the anchor from the guarded geometry", () => {
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

    test("should position the anchor at the centre of the dot", () => {
      const node = render(dotOf(), testData);
      expect(anchors(node)).toEqual(["translate(10,20)", "translate(60,25)"]);
    });

    test("should ignore the radius when positioning the anchor", () => {
      expect(anchors(render(dotOf().radius(1), [testData[0]]))).toEqual(["translate(10,20)"]);
      expect(anchors(render(dotOf().radius(100), [testData[0]]))).toEqual(["translate(10,20)"]);
    });

    test("should move the anchor when the data changes", () => {
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
    test("should not let an in-flight tween overwrite a later synchronous render", async () => {
      const g = group("interrupted");
      g.datum([{ x: 0, y: 0, r: 2 }]).call(dotOf().transition(true) as never);
      // Schedules a tween from 0 towards 500.
      g.datum([{ x: 500, y: 400, r: 20 }]).call(dotOf().transition(true) as never);
      await untilMoved(circles(g.node() as SVGGElement)[0], "cx");

      g.datum([{ x: 0, y: 0, r: 2 }]).call(dotOf().transition(false) as never);
      // Past the 300ms default, so an uninterrupted tween would have reached its destination.
      await new Promise((resolve) => setTimeout(resolve, 400));

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
      await new Promise((resolve) => setTimeout(resolve, 400));

      const node = g.node() as SVGGElement;
      expect(attrs(node, "opacity")).toEqual(["1"]);
      expect(attrs(node, "cx")).toEqual(["5"]);
    });

    test("should render the same output whether or not transition is enabled", () => {
      const withTransition = render(dotOf().transition(true), testData);
      const withoutTransition = render(dotOf().transition(false), testData);
      expect(withTransition.innerHTML).toBe(withoutTransition.innerHTML);
    });

    test("should schedule a transition only when the property is set", () => {
      expect(
        tweenNames(circles(render(dotOf().transition(true), [testData[0]]))[0]),
      ).not.toBeNull();
      expect(tweenNames(circles(render(dotOf().transition(false), [testData[0]]))[0])).toBeNull();
    });

    test("should give entering dots their geometry before the transition starts", () => {
      // The entering elements are positioned on the join, so a fresh render is correct
      // synchronously - nothing waits for the first animation frame.
      const node = render(dotOf().transition(true), testData);
      expect(attrs(node, "cx")).toEqual(["10", "60"]);
      expect(attrs(node, "cy")).toEqual(["20", "25"]);
      expect(attrs(node, "r")).toEqual(["4", "8"]);
    });

    test("should animate the geometry between renders when enabled", async () => {
      const component = dotOf().transition(true);
      const g = group("animated");
      g.datum([{ x: 0, y: 0, r: 1 }]).call(component as never);
      await new Promise((resolve) => setTimeout(resolve, 400));
      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["0"]);

      g.datum([{ x: 500, y: 400, r: 20 }]).call(component as never);
      // The update tweens from its previous value, so it still holds it on this tick.
      expect(attrs(node, "cx")).toEqual(["0"]);
      expect(attrs(node, "cy")).toEqual(["0"]);
      expect(attrs(node, "r")).toEqual(["1"]);

      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(attrs(node, "cx")).toEqual(["500"]);
      expect(attrs(node, "cy")).toEqual(["400"]);
      expect(attrs(node, "r")).toEqual(["20"]);
    });

    test("should update the geometry synchronously when disabled", () => {
      const component = dotOf().transition(false);
      const g = group("no-transition");
      g.datum([{ x: 0, y: 0, r: 1 }]).call(component as never);
      g.datum([{ x: 500, y: 400, r: 20 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "cx")).toEqual(["500"]);
      expect(attrs(node, "cy")).toEqual(["400"]);
      expect(attrs(node, "r")).toEqual(["20"]);
    });

    test("should schedule one tween per geometry attribute and no more", () => {
      // The other half of the defect this fixed: callers who never wanted an animation
      // were paying for tweens that ran from a value to itself. There is now exactly one
      // tween per geometry attribute, and none at all when the property is off.
      const node = render(dotOf().fill("#f00").stroke("#00f").transition(true), [testData[0]]);
      expect(tweenNames(circles(node)[0])).toEqual(["attr.cx", "attr.cy", "attr.r"]);

      const plain = render(dotOf().fill("#f00").transition(false), [testData[0]]);
      expect(tweenNames(circles(plain)[0])).toBeNull();
    });

    test("should not transition fill or stroke, so a colour change jumps", () => {
      // Decided rather than inherited: the colour scales these charts use are categorical,
      // and interpolating between two category colours reads as a third category. So the
      // colours are applied to the selection and never appear among the tweens.
      const component = dotOf();
      const g = group("colour-jump");
      g.datum([testData[0]]).call(component.fill("#f00") as never);
      g.datum([testData[0]]).call(component.fill("#0f0") as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
      expect(tweenNames(circles(node)[0])).not.toContain("attr.fill");
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
