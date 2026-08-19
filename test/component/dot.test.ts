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
        testData
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
      const component = dotOf();
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
        data
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

    describe("known quirks", () => {
      test("calls every accessor three times per datum on every render", () => {
        // NOTE: cx/cy/r are applied on the join, applied a second time (see the transition
        // block below), and read once more to position the tooltip anchor. The second
        // application runs whether or not transition is set - the property only decides
        // whether it lands on a transition or on the plain selection - so the count does
        // not change. Accessors are expected to be cheap and pure; an expensive scale
        // lookup or an accessor with side effects pays for all three passes.
        expect(callLog(testData, true).length).toBe(6);
        expect(callLog(testData, false).length).toBe(6);
      });

      test("does not pass the index when reading accessors for the tooltip anchor", () => {
        // BUG: the anchor position is `(d) => [props.x(d), props.y(d)]` - a one-argument
        // callback, so the index d3 supplies is dropped. An index-based accessor, which
        // works fine for the circles, returns NaN for the anchor and every tooltip in the
        // chart collapses onto the origin.
        // current: anchors at translate(NaN,NaN). expected: the same position as the dot.
        // bar has the identical defect in its own anchor callbacks.
        const seen = callLog(testData, false);
        // The last two calls are the anchor's, and they arrive without an index.
        expect(seen.slice(-2)).toEqual([
          [testData[0], undefined],
          [testData[1], undefined],
        ]);

        const node = render(
          dot()
            .x((_d: Datum, i: number) => i * 10)
            .y((_d: Datum, i: number) => i * 5)
            .radius(3),
          testData
        );
        expect(attrs(node, "cx")).toEqual(["0", "10"]);
        expect(anchors(node)).toEqual(["translate(NaN,NaN)", "translate(NaN,NaN)"]);
      });
    });
  });

  describe("configuration", () => {
    test("should default transition to true", () => {
      expect(dot().transition()).toBe(true);
    });

    describe("known quirks", () => {
      test("throws when x or y is never configured, but only once there is data", () => {
        // BUG: x and y are declared with fn.functor, so an unset property stays undefined
        // rather than becoming a functor. The circle attributes survive it - d3 drops an
        // attribute whose value is undefined - but the tooltip anchor calls props.x(d)
        // directly and throws. Nothing in the library reports the missing property before
        // that point, and the failure depends on the data, so an empty first render
        // succeeds and the same chart throws as soon as data arrives.
        // current: a TypeError from d3's internals. expected: a named error identifying
        // the missing property, or a default of 0.
        expect(() => render(dot().radius(3), [{}])).toThrow(TypeError);
        expect(() => render(dot().radius(3), [{}])).toThrow(/is not a function/);
        expect(() => render(dot().radius(3), [])).not.toThrow();
      });

      test("leaves half-rendered elements behind when it throws", () => {
        // NOTE: the throw above happens after the circles and the anchor rects have been
        // created, so the group is left holding circles with no position and anchors with
        // no transform. A caller that catches the error sees a partially updated chart.
        const g = group("partial");
        expect(() => g.datum([{}]).call(dot().radius(3) as never)).toThrow();
        const node = g.node() as SVGGElement;
        expect(circles(node).length).toBe(1);
        expect(circles(node)[0].getAttribute("cx")).toBeNull();
        expect(anchors(node)).toEqual([null]);
      });

      test("radius, fill and stroke are not wrapped by fn.functor, unlike x and y", () => {
        // NOTE: only x and y are declared with fn.functor. Rendering is unaffected, since
        // d3 accepts a constant or a function for any attribute, but the getters are
        // inconsistent: .x() always returns a function while .radius() returns whatever
        // was set. Anything reading a dot's configuration back has to handle both shapes.
        const component = dot().x(5).y(6).radius(7).fill("#f00").stroke("#00f");
        expect(typeof component.x()).toBe("function");
        expect(component.x()()).toBe(5);
        expect(typeof component.y()).toBe("function");
        expect(component.radius()).toBe(7);
        expect(component.fill()).toBe("#f00");
        expect(component.stroke()).toBe("#00f");
      });

      test("renders an invisible circle when radius is not configured", () => {
        // NOTE: an unset radius means .attr("r", undefined), which removes the attribute.
        // SVG then defaults r to 0, so the dots are silently invisible rather than
        // reported as a missing required property. Unlike a missing x or y, this never
        // throws, because the anchor does not read the radius.
        const node = render(dot().x(1).y(2), [{}]);
        expect(circles(node)[0].getAttribute("r")).toBeNull();
        expect(circles(node).length).toBe(1);
      });
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
        [{}]
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

    test("should drop the attribute for undefined and null", () => {
      expect(withValue(undefined)).toEqual({ cx: null, r: null });
      expect(withValue(null)).toEqual({ cx: null, r: null });
    });

    describe("known quirks", () => {
      test("has no missing-value guard at all, unlike the bar component", () => {
        // BUG: bar composes every geometry accessor with handleMissingVal, which turns NaN
        // into 0. dot has no equivalent, so a NaN - the usual result of feeding a scale a
        // value outside its domain, or a null measurement - is written straight into the
        // attribute. The browser rejects "NaN" and falls back to the attribute's initial
        // value, so a NaN coordinate parks the dot at the chart's origin while a NaN
        // radius makes it vanish. Both fail silently.
        // current: cx="NaN". expected: 0, as in bar, or no circle at all.
        expect(withValue(Number.NaN)).toEqual({ cx: "NaN", r: "NaN" });
      });

      test("writes non-numeric values into the attributes verbatim", () => {
        // NOTE: same root cause as above - nothing validates what an accessor returns.
        // Every one of these is an invalid SVG length, and all of them fail silently.
        expect(withValue("abc")).toEqual({ cx: "abc", r: "abc" });
        expect(withValue(Number.POSITIVE_INFINITY)).toEqual({ cx: "Infinity", r: "Infinity" });
        expect(withValue("")).toEqual({ cx: "", r: "" });
        expect(withValue(true)).toEqual({ cx: "true", r: "true" });
      });

      test("passes a negative radius through, which is an SVG error", () => {
        // NOTE: a negative r is invalid per the SVG spec and the element is not rendered.
        // A radius scale with a reversed range, or a `value - baseline` accessor, can
        // produce one, and nothing here catches it.
        const node = render(dot().x(1).y(2).radius(-5), [{}]);
        expect(circles(node)[0].getAttribute("r")).toBe("-5");
      });
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
      test("propagates unguarded coordinates into the transform", () => {
        // NOTE: the anchor position reads props.x and props.y directly, so the missing
        // values above reach it too. "translate(NaN,undefined)" is not a valid transform,
        // so the anchor - and therefore the tooltip - ends up at the origin.
        const node = render(
          dot()
            .x(() => Number.NaN)
            // @ts-expect-error - accessor returns undefined on purpose
            .y(() => undefined)
            .radius(3),
          [{}]
        );
        expect(anchors(node)).toEqual(["translate(NaN,undefined)"]);
      });

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
    test("should render the same output whether or not transition is enabled", () => {
      const withTransition = render(dotOf().transition(true), testData);
      const withoutTransition = render(dotOf().transition(false), testData);
      expect(withTransition.innerHTML).toBe(withoutTransition.innerHTML);
    });

    test("should schedule a transition only when the property is set", () => {
      expect(
        tweenNames(circles(render(dotOf().transition(true), [testData[0]]))[0])
      ).not.toBeNull();
      expect(tweenNames(circles(render(dotOf().transition(false), [testData[0]]))[0])).toBeNull();
    });

    describe("known quirks", () => {
      test("the transition property never animates anything", () => {
        // BUG: `dots` is reassigned to `dots.transition(...)`, and the next line re-applies
        // cx/cy/r to it - but the join has already written those same values to the
        // elements, so every tween runs from a value to itself. The geometry jumps and the
        // 300ms transition is pure overhead. transition defaults to true, so every
        // scatterplot in the docs pays for a transition that has never animated.
        // current: geometry updates synchronously. expected: it eases over 300ms.
        // The fix is to apply the geometry once: to `dots.transition(...)` when
        // transitioning, and to `dots` otherwise. bar has the same symptom by a different
        // route - it discards its transition instead of assigning it back.
        const component = dotOf().transition(true);
        const g = group("no-animation");
        g.datum([{ x: 0, y: 0, r: 1 }]).call(component as never);
        g.datum([{ x: 500, y: 400, r: 20 }]).call(component as never);
        const node = g.node() as SVGGElement;
        // A live transition would still show the old values on this tick.
        expect(attrs(node, "cx")).toEqual(["500"]);
        expect(attrs(node, "cy")).toEqual(["400"]);
        expect(attrs(node, "r")).toEqual(["20"]);
      });

      test("schedules value-to-value tweens for the geometry and nothing else", () => {
        // NOTE: the two halves of the bug above, pinned directly. The transition really is
        // scheduled - three attribute tweens per circle - and the attributes already hold
        // their final values when it starts, so the tweens interpolate each value to
        // itself. fill and stroke are applied only on the join and never appear here, so
        // colour changes will still jump even once the geometry animates.
        const node = render(dotOf().fill("#f00").stroke("#00f").transition(true), [testData[0]]);
        const circle = circles(node)[0];
        expect(tweenNames(circle)).toEqual(["attr.cx", "attr.cy", "attr.r"]);
        expect(circle.getAttribute("cx")).toBe("10");
        expect(circle.getAttribute("cy")).toBe("20");
        expect(circle.getAttribute("r")).toBe("4");
      });

      test("stacks another schedule on the same circles with every render", () => {
        // NOTE: each render attaches a fresh schedule to every circle. The pending ones
        // pile up until they start, at which point d3 cancels the superseded ones and
        // interrupts anything else the caller had running on those nodes. So a chart that
        // re-renders on every interaction accrues and then discards transition state for
        // an animation that never happens.
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
