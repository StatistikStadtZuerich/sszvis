import { afterEach, beforeEach, describe, expect, test } from "vitest";
import bar from "../../src/component/bar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type Datum = { x: number; y: number; w: number; h: number; color?: string };

describe("component/bar", () => {
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
      key: key ?? `bar-${++layerKey}`,
    }).selectGroup("bars");

  const render = (component: unknown, data: unknown[]) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  const testData: Datum[] = [
    { x: 10, y: 20, w: 30, h: 40, color: "#f00" },
    { x: 60, y: 25, w: 30, h: 50, color: "#0f0" },
  ];

  /** A bar wired to the test datum shape. */
  const barOf = () =>
    bar()
      .x((d: Datum) => d.x)
      .y((d: Datum) => d.y)
      .width((d: Datum) => d.w)
      .height((d: Datum) => d.h);

  const bars = (node: Element) => [...node.querySelectorAll("rect.sszvis-bar")];
  const attrs = (node: Element, attr: string) => bars(node).map((b) => b.getAttribute(attr));
  const anchors = (node: Element) =>
    [...node.querySelectorAll("[data-tooltip-anchor]")].map((a) => a.getAttribute("transform"));

  describe("rendering", () => {
    test("should render one classed rect per datum", () => {
      const node = render(barOf(), testData);
      expect(bars(node).length).toBe(2);
      for (const b of bars(node)) expect(b.tagName).toBe("rect");
    });

    test("should take x, y, width and height from the accessors", () => {
      const node = render(barOf(), testData);
      expect(attrs(node, "x")).toEqual(["10", "60"]);
      expect(attrs(node, "y")).toEqual(["20", "25"]);
      expect(attrs(node, "width")).toEqual(["30", "30"]);
      expect(attrs(node, "height")).toEqual(["40", "50"]);
    });

    test("should accept constants in place of accessors", () => {
      const node = render(bar().x(5).y(6).width(7).height(8), [{}, {}]);
      expect(attrs(node, "x")).toEqual(["5", "5"]);
      expect(attrs(node, "y")).toEqual(["6", "6"]);
      expect(attrs(node, "width")).toEqual(["7", "7"]);
      expect(attrs(node, "height")).toEqual(["8", "8"]);
    });

    test("should apply fill and stroke", () => {
      const node = render(
        barOf()
          .fill((d: Datum) => d.color)
          .stroke("#00f"),
        testData
      );
      expect(attrs(node, "fill")).toEqual(["#f00", "#0f0"]);
      expect(attrs(node, "stroke")).toEqual(["#00f", "#00f"]);
    });

    test("should omit fill and stroke when they are not configured", () => {
      const node = render(bar().x(0).y(0).width(10).height(10), [{}]);
      expect(bars(node)[0].getAttribute("fill")).toBeNull();
      expect(bars(node)[0].getAttribute("stroke")).toBeNull();
    });

    test("should render nothing for an empty data array", () => {
      const node = render(barOf(), []);
      expect(bars(node).length).toBe(0);
      expect(anchors(node)).toEqual([]);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = barOf();
      const g = group("rerender");
      g.datum(testData).call(component as never);
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(bars(node).length).toBe(2);
      expect(anchors(node).length).toBe(2);
    });

    test("should remove bars and anchors when the data shrinks", () => {
      const component = barOf();
      const g = group("shrink");
      g.datum(testData).call(component as never);
      g.datum([testData[0]]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(bars(node).length).toBe(1);
      expect(anchors(node).length).toBe(1);
    });

    test("should update the geometry when the data changes", () => {
      const component = barOf();
      const g = group("update");
      g.datum(testData).call(component as never);
      g.datum([{ x: 99, y: 88, w: 77, h: 66 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["99"]);
      expect(attrs(node, "height")).toEqual(["66"]);
    });
  });

  describe("missing values", () => {
    /** Renders a single bar whose x is the given value. */
    const xOf = (value: unknown) =>
      bars(
        render(
          bar()
            // The typed API rejects a non-numeric accessor. This test deliberately supplies
            // one to characterise the runtime coercion, so the rejection is the point.
            // @ts-expect-error - accessor returns unknown on purpose
            .x(() => value)
            .y(0)
            .width(10)
            .height(10),
          [{}]
        )
      )[0].getAttribute("x");

    test("should replace NaN with 0", () => {
      expect(xOf(Number.NaN)).toBe("0");
    });

    test("should replace undefined with 0", () => {
      expect(xOf(undefined)).toBe("0");
    });

    test("should replace a non-numeric string with 0", () => {
      expect(xOf("abc")).toBe("0");
    });

    test("should pass real numbers through, including negatives and zero", () => {
      expect(xOf(0)).toBe("0");
      expect(xOf(-5)).toBe("-5");
      expect(xOf(12.5)).toBe("12.5");
    });

    test("should guard all four geometry attributes", () => {
      const node = render(
        bar()
          .x(() => Number.NaN)
          .y(() => Number.NaN)
          .width(() => Number.NaN)
          .height(() => Number.NaN),
        [{}]
      );
      expect(attrs(node, "x")).toEqual(["0"]);
      expect(attrs(node, "y")).toEqual(["0"]);
      expect(attrs(node, "width")).toEqual(["0"]);
      expect(attrs(node, "height")).toEqual(["0"]);
    });

    describe("known quirks", () => {
      test("lets null through, which drops the attribute entirely", () => {
        // NOTE: handleMissingVal tests with the global isNaN, and isNaN(null) is false
        // because Number(null) is 0. So null passes through to d3, which removes the
        // attribute for a null value. The rect then falls back to the SVG default of 0
        // rather than being reported as missing.
        expect(xOf(null)).toBeNull();
      });

      test("lets a numeric string through unconverted", () => {
        // NOTE: isNaN("50") is false, so the string is written to the attribute as-is.
        // Harmless, since SVG parses it, but the guard does not normalise the type.
        expect(xOf("50")).toBe("50");
      });

      test("lets Infinity through, producing an invalid attribute value", () => {
        // NOTE: isNaN(Infinity) is false, so Infinity reaches the attribute. "Infinity"
        // is not a valid SVG coordinate, so the browser ignores it. A scale dividing by
        // a zero-width domain can produce this, and it fails silently.
        expect(xOf(Number.POSITIVE_INFINITY)).toBe("Infinity");
      });

      test("lets the empty string and booleans through", () => {
        // NOTE: Number("") and Number(true) are both numeric, so isNaN is false for each
        // and neither is caught by the guard.
        expect(xOf("")).toBe("");
        expect(xOf(true)).toBe("true");
      });
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per datum", () => {
      const node = render(barOf(), testData);
      expect(anchors(node).length).toBe(2);
    });

    test("should render the anchor as a hidden 1x1 rect", () => {
      const node = render(barOf(), [testData[0]]);
      const anchor = node.querySelector("[data-tooltip-anchor]");
      expect(anchor?.tagName).toBe("rect");
      expect(anchor?.getAttribute("width")).toBe("1");
      expect(anchor?.getAttribute("height")).toBe("1");
      expect(anchor?.getAttribute("fill")).toBe("none");
      expect(anchor?.getAttribute("stroke")).toBe("none");
    });

    test("should default to the top centre of the bar", () => {
      const node = render(barOf(), testData);
      // x + width / 2, y
      expect(anchors(node)).toEqual(["translate(25,20)", "translate(75,25)"]);
    });

    test("should centre the anchor in both dimensions when centerTooltip is set", () => {
      const node = render(barOf().centerTooltip(true), testData);
      // x + width / 2, y + height / 2
      expect(anchors(node)).toEqual(["translate(25,40)", "translate(75,50)"]);
    });

    test("should fall back to the default position when centerTooltip is false", () => {
      const node = render(barOf().centerTooltip(false), [testData[0]]);
      expect(anchors(node)).toEqual(["translate(25,20)"]);
    });

    test("should place the anchor at a fractional position given tooltipAnchor", () => {
      expect(anchors(render(barOf().tooltipAnchor([0, 0]), [testData[0]]))).toEqual([
        "translate(10,20)",
      ]);
      expect(anchors(render(barOf().tooltipAnchor([1, 1]), [testData[0]]))).toEqual([
        "translate(40,60)",
      ]);
      expect(anchors(render(barOf().tooltipAnchor([0.5, 0.5]), [testData[0]]))).toEqual([
        "translate(25,40)",
      ]);
    });

    test("should parse string values in tooltipAnchor", () => {
      expect(anchors(render(barOf().tooltipAnchor(["0.5", "1"]), [testData[0]]))).toEqual([
        "translate(25,60)",
      ]);
      // A trailing unit only survives parseFloat - plain arithmetic coercion yields NaN,
      // so this is what actually pins the parse rather than JS's own string coercion.
      expect(anchors(render(barOf().tooltipAnchor(["0.5px", "1"]), [testData[0]]))).toEqual([
        "translate(25,60)",
      ]);
    });

    test("should let centerTooltip override tooltipAnchor", () => {
      const node = render(barOf().centerTooltip(true).tooltipAnchor([0, 0]), [testData[0]]);
      expect(anchors(node)).toEqual(["translate(25,40)"]);
    });

    test("should position anchors from the missing-value-guarded geometry", () => {
      const node = render(
        bar()
          .x(() => Number.NaN)
          .y(() => Number.NaN)
          .width(20)
          .height(10),
        [{}]
      );
      // NaN x and y become 0, so the anchor lands at 0 + 20 / 2, 0
      expect(anchors(node)).toEqual(["translate(10,0)"]);
    });

    describe("known quirks", () => {
      test("a tooltipAnchor with fewer than two entries yields NaN in the transform", () => {
        // NOTE: the JSDoc requires a two-element array. A shorter one leaves uv[1]
        // undefined, so the y coordinate becomes NaN and the transform is invalid. It
        // fails silently rather than warning, unlike other misconfigurations elsewhere.
        expect(anchors(render(barOf().tooltipAnchor([0.5]), [testData[0]]))).toEqual([
          "translate(25,NaN)",
        ]);
        expect(anchors(render(barOf().tooltipAnchor([]), [testData[0]]))).toEqual([
          "translate(NaN,NaN)",
        ]);
      });

      test("ignores tooltipAnchor entries beyond the first two", () => {
        // NOTE: extra entries are simply unused.
        expect(anchors(render(barOf().tooltipAnchor([0, 0, 9]), [testData[0]]))).toEqual([
          "translate(10,20)",
        ]);
      });
    });
  });

  describe("transition", () => {
    test("should render the same output whether or not transition is enabled", () => {
      const withTransition = render(barOf().transition(true), testData);
      const withoutTransition = render(barOf().transition(false), testData);
      expect(withTransition.innerHTML).toBe(withoutTransition.innerHTML);
    });

    test("should default transition to true", () => {
      const node = render(barOf(), [testData[0]]);
      const withState = bars(node)[0] as SVGRectElement & { __transition?: unknown };
      expect(withState.__transition).not.toBeUndefined();
    });

    describe("known quirks", () => {
      test("the transition property never animates anything", () => {
        // BUG: `bars.transition(defaultTransition())` is created and thrown away, then the
        // same four attributes are re-applied to the plain selection on the next line. So
        // the transition schedules no tweens and the geometry always jumps. The property
        // defaults to true, so every bar chart pays for an empty transition and no chart
        // has ever animated its bars.
        // current: geometry updates synchronously. expected: it eases over 300ms.
        const component = barOf().transition(true);
        const g = group("no-animation");
        g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(component as never);
        g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(component as never);
        const node = g.node() as SVGGElement;
        // A live transition would still show the old values on this tick.
        expect(attrs(node, "x")).toEqual(["500"]);
        expect(attrs(node, "y")).toEqual(["400"]);
        expect(attrs(node, "width")).toEqual(["20"]);
        expect(attrs(node, "height")).toEqual(["30"]);
      });

      test("applies the geometry attributes twice, so the first application is dead", () => {
        // BUG: the same root cause as the inert transition above. x/y/width/height are set
        // on the join, then set again after the discarded transition. Swapping x with y in
        // the first block, or deleting the second line entirely, produces byte-identical
        // output - verified by mutation testing, where all three variants were equivalent
        // mutants that no test can distinguish.
        // The fix for the transition removes the redundancy too: apply the geometry once,
        // to `bars.transition(...)` when transitioning and to `bars` otherwise.
        // This test can only assert the observable result: one consistent geometry.
        const node = render(barOf(), [testData[0]]);
        expect(attrs(node, "x")).toEqual(["10"]);
        expect(attrs(node, "y")).toEqual(["20"]);
        expect(attrs(node, "width")).toEqual(["30"]);
        expect(attrs(node, "height")).toEqual(["40"]);
      });

      test("still schedules an empty transition on every bar when enabled", () => {
        // NOTE: the discarded transition is not free - it puts d3 transition state on each
        // node, which also interrupts any transition already running on those bars.
        const node = render(barOf().transition(true), [testData[0]]);
        const withState = bars(node)[0] as SVGRectElement & { __transition?: unknown };
        expect(withState.__transition).not.toBeUndefined();

        const plain = bars(
          render(barOf().transition(false), [testData[0]])
        )[0] as SVGRectElement & {
          __transition?: unknown;
        };
        expect(plain.__transition).toBeUndefined();
      });
    });
  });
});
