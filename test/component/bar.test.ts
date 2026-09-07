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

  /** The names of the tweens d3 scheduled on a node, e.g. ["attr.x"]. */
  const tweenNames = (node: Element) => {
    const schedules = (node as Element & { __transition?: Record<string, unknown> }).__transition;
    if (!schedules) return null;
    return Object.values(schedules)
      .filter((s): s is { tween: { name: string }[] } => typeof s === "object" && s !== null)
      .flatMap((s) => s.tween.map((t) => t.name));
  };

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
      // transition is off so that the updated geometry is readable on this tick; the
      // transitioning case is covered in the transition block.
      const component = barOf().transition(false);
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

    test("should replace null with 0", () => {
      // The guard used to let null through, and d3 removes the attribute for it - so the
      // rect silently fell back to the SVG default instead of the intended 0.
      expect(xOf(null)).toBe("0");
    });

    test("should replace Infinity with 0", () => {
      // A scale over a zero-width domain produces Infinity, and "Infinity" is not a valid
      // SVG coordinate. dot guards this identically.
      expect(xOf(Number.POSITIVE_INFINITY)).toBe("0");
      expect(xOf(Number.NEGATIVE_INFINITY)).toBe("0");
    });

    test("should normalise values that do coerce to their number", () => {
      expect(xOf("50")).toBe("50");
      expect(xOf("")).toBe("0");
      expect(xOf(true)).toBe("1");
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

    test("should pass the index to the accessors read for the default anchor", () => {
      const node = render(
        bar()
          .x((_d: Datum, i: number) => i * 100)
          .y((_d: Datum, i: number) => i * 10)
          .width(20)
          .height(10),
        testData
      );
      expect(attrs(node, "x")).toEqual(["0", "100"]);
      // x + width / 2, y - with the index reaching the accessors, as it does for the rects
      expect(anchors(node)).toEqual(["translate(10,0)", "translate(110,10)"]);
    });

    test("should pass the index to the accessors read for the centred anchor", () => {
      const node = render(
        bar()
          .x((_d: Datum, i: number) => i * 100)
          .y((_d: Datum, i: number) => i * 10)
          .width(20)
          .height(10)
          .centerTooltip(true),
        testData
      );
      expect(anchors(node)).toEqual(["translate(10,5)", "translate(110,15)"]);
    });

    test("should pass the index to the accessors read for a fractional anchor", () => {
      const node = render(
        bar()
          .x((_d: Datum, i: number) => i * 100)
          .y((_d: Datum, i: number) => i * 10)
          .width(20)
          .height(10)
          .tooltipAnchor([1, 1]),
        testData
      );
      expect(anchors(node)).toEqual(["translate(20,10)", "translate(120,20)"]);
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
        // NOTE: documented on the tooltipAnchor property in bar.ts. A shorter array
        // leaves uv[1] undefined, so y becomes NaN and the transform is invalid - silently,
        // unlike the missing-prop errors the legends log.
        expect(anchors(render(barOf().tooltipAnchor([0.5]), [testData[0]]))).toEqual([
          "translate(25,NaN)",
        ]);
        expect(anchors(render(barOf().tooltipAnchor([]), [testData[0]]))).toEqual([
          "translate(NaN,NaN)",
        ]);
      });

      test("ignores tooltipAnchor entries beyond the first two", () => {
        // NOTE: documented on the tooltipAnchor property in bar.ts.
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

    test("should give entering bars their geometry before the transition starts", () => {
      // The entering elements are positioned on the join, so a fresh render is correct
      // synchronously - nothing waits for the first animation frame.
      const node = render(barOf().transition(true), testData);
      expect(attrs(node, "x")).toEqual(["10", "60"]);
      expect(attrs(node, "y")).toEqual(["20", "25"]);
      expect(attrs(node, "width")).toEqual(["30", "30"]);
      expect(attrs(node, "height")).toEqual(["40", "50"]);
    });

    test("should animate the geometry between renders when enabled", async () => {
      const component = barOf().transition(true);
      const g = group("animated");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(component as never);
      await new Promise((resolve) => setTimeout(resolve, 400));
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["0"]);

      g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(component as never);
      // The update tweens from its previous value, so it still holds it on this tick.
      expect(attrs(node, "x")).toEqual(["0"]);
      expect(attrs(node, "y")).toEqual(["0"]);
      expect(attrs(node, "width")).toEqual(["10"]);
      expect(attrs(node, "height")).toEqual(["10"]);

      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(attrs(node, "x")).toEqual(["500"]);
      expect(attrs(node, "y")).toEqual(["400"]);
      expect(attrs(node, "width")).toEqual(["20"]);
      expect(attrs(node, "height")).toEqual(["30"]);
    });

    test("should update the geometry synchronously when disabled", () => {
      const component = barOf().transition(false);
      const g = group("no-transition");
      g.datum([{ x: 0, y: 0, w: 10, h: 10 }]).call(component as never);
      g.datum([{ x: 500, y: 400, w: 20, h: 30 }]).call(component as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "x")).toEqual(["500"]);
      expect(attrs(node, "height")).toEqual(["30"]);
    });

    test("should schedule one tween per geometry attribute and no more", () => {
      // The transition used to be created and discarded, which attached d3 state to every
      // bar without ever scheduling a tween. There is now exactly one tween per geometry
      // attribute, and none at all when the property is off.
      const node = render(barOf().fill("#f00").stroke("#00f").transition(true), [testData[0]]);
      expect(tweenNames(bars(node)[0])).toEqual(["attr.x", "attr.y", "attr.width", "attr.height"]);

      const plain = render(barOf().transition(false), [testData[0]]);
      expect(tweenNames(bars(plain)[0])).toBeNull();
    });

    test("should not transition fill or stroke, so a colour change jumps", () => {
      // Decided rather than inherited: the colour scales these charts use are categorical,
      // and interpolating between two category colours reads as a third category. So the
      // colours are applied to the selection and never appear among the tweens.
      const component = barOf();
      const g = group("colour-jump");
      g.datum([testData[0]]).call(component.fill("#f00") as never);
      g.datum([testData[0]]).call(component.fill("#0f0") as never);
      const node = g.node() as SVGGElement;
      expect(attrs(node, "fill")).toEqual(["#0f0"]);
      expect(tweenNames(bars(node)[0])).not.toContain("attr.fill");
    });

    test("should apply the geometry exactly once per selection", () => {
      // The geometry used to be written on the join and again after the discarded
      // transition, which made the first write dead code: swapping x with y in the first
      // block produced byte-identical output. Now the entering elements are written once
      // and the merged selection - or its transition - once, and the two agree.
      const node = render(barOf().transition(false), [testData[0]]);
      expect(attrs(node, "x")).toEqual(["10"]);
      expect(attrs(node, "y")).toEqual(["20"]);
      expect(attrs(node, "width")).toEqual(["30"]);
      expect(attrs(node, "height")).toEqual(["40"]);
    });
  });
});
