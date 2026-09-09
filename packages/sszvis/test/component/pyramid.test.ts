import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import pyramid from "../../src/component/pyramid.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type Datum = { age: number; value: number; color?: string };
type Population = { left: Datum[]; right: Datum[]; leftRef?: Datum[]; rightRef?: Datum[] };

describe("component/pyramid", () => {
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
      key: key ?? `pyramid-${++layerKey}`,
    }).selectGroup("pyramid");

  const render = (component: unknown, data: unknown) =>
    group()
      .datum(data)
      .call(component as never)
      .node() as SVGGElement;

  const left: Datum[] = [
    { age: 0, value: 40, color: "#f00" },
    { age: 1, value: 20, color: "#f00" },
  ];
  const right: Datum[] = [
    { age: 0, value: 30, color: "#00f" },
    { age: 1, value: 10, color: "#00f" },
  ];
  const testData: Population = { left, right };

  /**
   * A pyramid wired to the test datum shape: value becomes the bar width, age the
   * vertical position. The whole datum is one object holding both sides, which is how
   * the population pyramid examples feed a cascaded object into the component.
   */
  const pyramidOf = () =>
    pyramid()
      .barHeight(10)
      .barWidth((d: Datum) => d.value)
      .barPosition((d: Datum) => d.age * 12)
      .leftAccessor((d: Population) => d.left)
      .rightAccessor((d: Population) => d.right);

  const side = (node: Element, key: string) =>
    node.querySelector(`[data-d3-selectgroup="${key}"]`) as SVGGElement | null;
  const bars = (node: Element, key: string) => [
    ...(side(node, key)?.querySelectorAll("rect.sszvis-bar") ?? []),
  ];
  const attrs = (node: Element, key: string, attr: string) =>
    bars(node, key).map((b) => b.getAttribute(attr));
  const anchors = (node: Element, key: string) =>
    [...(side(node, key)?.querySelectorAll("[data-tooltip-anchor]") ?? [])].map((a) =>
      a.getAttribute("transform"),
    );
  const lines = (node: Element, key: string) => [
    ...(side(node, key)?.querySelectorAll("path.sszvis-pyramid__referenceline") ?? []),
  ];
  /** Entering paths carry `d` at once; updates settle a transition later. */
  const lineD = (node: Element, key: string) =>
    vi.waitFor(() => {
      const d = lines(node, key)[0]?.getAttribute("d");
      expect(d).not.toBeNull();
      return d;
    });

  describe("groups", () => {
    test("should render a group per side plus a group per reference line", () => {
      const node = render(pyramidOf(), testData);
      expect(side(node, "left")).not.toBeNull();
      expect(side(node, "right")).not.toBeNull();
      expect(side(node, "leftReference")).not.toBeNull();
      expect(side(node, "rightReference")).not.toBeNull();
    });

    test("should render the reference groups after the bars, so lines draw on top", () => {
      const node = render(pyramidOf(), testData);
      const keys = [...node.querySelectorAll("[data-d3-selectgroup]")].map((g) =>
        g.getAttribute("data-d3-selectgroup"),
      );
      expect(keys).toEqual(["left", "right", "leftReference", "rightReference"]);
    });

    test("should create the reference groups even when no reference data is configured", () => {
      // NOTE: the groups are unconditional; only the paths inside them are conditional.
      const node = render(pyramidOf(), testData);
      expect(side(node, "leftReference")?.childElementCount).toBe(0);
      expect(side(node, "rightReference")?.childElementCount).toBe(0);
    });
  });

  describe("bars", () => {
    test("should render one bar per datum on each side", () => {
      const node = render(pyramidOf(), testData);
      expect(bars(node, "left").length).toBe(2);
      expect(bars(node, "right").length).toBe(2);
    });

    test("should mirror the left bars across the spine", () => {
      const node = render(pyramidOf(), testData);
      // x = -SPINE_PADDING - barWidth, so the bar grows leftwards from the spine
      expect(attrs(node, "left", "x")).toEqual(["-40.5", "-20.5"]);
      expect(attrs(node, "left", "width")).toEqual(["40", "20"]);
    });

    test("should place the right bars just right of the spine", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
      expect(attrs(node, "right", "width")).toEqual(["30", "10"]);
    });

    test("should leave a one pixel gap across the spine", () => {
      const node = render(
        pyramid()
          .barHeight(10)
          .barWidth(100)
          .barPosition(0)
          .leftAccessor((d: Population) => d.left)
          .rightAccessor((d: Population) => d.right),
        testData,
      );
      // 2 * SPINE_PADDING: the left bar ends at -0.5 and the right one starts at 0.5
      const leftEdge =
        Number(attrs(node, "left", "x")[0]) + Number(attrs(node, "left", "width")[0]);
      expect(leftEdge).toBe(-0.5);
      expect(Number(attrs(node, "right", "x")[0])).toBe(0.5);
    });

    test("should take the vertical position and height from the props", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "left", "y")).toEqual(["0", "12"]);
      expect(attrs(node, "right", "y")).toEqual(["0", "12"]);
      expect(attrs(node, "left", "height")).toEqual(["10", "10"]);
      expect(attrs(node, "right", "height")).toEqual(["10", "10"]);
    });

    test("should accept constants in place of accessors", () => {
      const node = render(
        pyramid()
          .barHeight(5)
          .barWidth(7)
          .barPosition(9)
          .leftAccessor((d: Population) => d.left)
          .rightAccessor((d: Population) => d.right),
        testData,
      );
      expect(attrs(node, "left", "x")).toEqual(["-7.5", "-7.5"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
      expect(attrs(node, "right", "width")).toEqual(["7", "7"]);
      expect(attrs(node, "right", "y")).toEqual(["9", "9"]);
      expect(attrs(node, "right", "height")).toEqual(["5", "5"]);
    });

    test("should apply barFill to both sides", () => {
      const node = render(
        pyramidOf().barFill((d: Datum) => d.color),
        testData,
      );
      expect(attrs(node, "left", "fill")).toEqual(["#f00", "#f00"]);
      expect(attrs(node, "right", "fill")).toEqual(["#00f", "#00f"]);
    });

    test("should default barFill to black", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "left", "fill")).toEqual(["#000", "#000"]);
      expect(attrs(node, "right", "fill")).toEqual(["#000", "#000"]);
    });

    test("should not set a stroke on the bars", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "left", "stroke")).toEqual([null, null]);
    });

    test("should render nothing for empty sides", () => {
      const node = render(pyramidOf(), { left: [], right: [] });
      expect(bars(node, "left").length).toBe(0);
      expect(bars(node, "right").length).toBe(0);
      expect(anchors(node, "left")).toEqual([]);
    });

    test("should allow the two sides to have different lengths", () => {
      const node = render(pyramidOf(), { left, right: [right[0]] });
      expect(bars(node, "left").length).toBe(2);
      expect(bars(node, "right").length).toBe(1);
    });

    test("should re-render in place rather than appending duplicates", () => {
      const component = pyramidOf();
      const g = group("rerender");
      g.datum(testData).call(component as never);
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="left"]').length).toBe(1);
      expect(bars(node, "left").length).toBe(2);
      expect(bars(node, "right").length).toBe(2);
      expect(anchors(node, "left").length).toBe(2);
    });

    test("should remove bars when a side shrinks", () => {
      const component = pyramidOf();
      const g = group("shrink");
      g.datum(testData).call(component as never);
      g.datum({ left: [left[0]], right }).call(component as never);
      const node = g.node() as SVGGElement;
      expect(bars(node, "left").length).toBe(1);
      expect(bars(node, "right").length).toBe(2);
    });

    test("should forward d3's index to an index-aware barWidth on both sides", () => {
      const node = render(
        pyramidOf().barWidth((_d: Datum, i: number) => 100 + i),
        testData,
      );
      expect(attrs(node, "left", "width")).toEqual(["100", "101"]);
      expect(attrs(node, "left", "x")).toEqual(["-100.5", "-101.5"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
    });

    test("should update the geometry when the data changes", async () => {
      // bar animates an update over 300ms, so the destination geometry is only on the DOM
      // once the transition has run. Reading it synchronously would pin the start values.
      const component = pyramidOf();
      const g = group("update");
      g.datum(testData).call(component as never);
      g.datum({ left: [{ age: 3, value: 99 }], right: [{ age: 3, value: 5 }] }).call(
        component as never,
      );
      const node = g.node() as SVGGElement;
      await vi.waitFor(() => {
        expect(attrs(node, "left", "x")).toEqual(["-99.5"]);
        expect(attrs(node, "left", "y")).toEqual(["36"]);
        expect(attrs(node, "right", "width")).toEqual(["5"]);
      });
    });
  });

  describe("tooltip anchors", () => {
    test("should render one anchor per bar, inside the side's group", () => {
      const node = render(pyramidOf(), testData);
      expect(anchors(node, "left").length).toBe(2);
      expect(anchors(node, "right").length).toBe(2);
    });

    test("should centre the anchors on the bars by default", () => {
      const node = render(pyramidOf(), testData);
      // The default tooltipAnchor of [0.5, 0.5] overrides bar's own top-centre default:
      // left x + 0.5 * width, y + 0.5 * height
      expect(anchors(node, "left")).toEqual(["translate(-20.5,5)", "translate(-10.5,17)"]);
      expect(anchors(node, "right")).toEqual(["translate(15.5,5)", "translate(5.5,17)"]);
    });

    test("should pass a custom tooltipAnchor through to both sides", () => {
      const node = render(pyramidOf().tooltipAnchor([0, 0]), testData);
      // [0, 0] is each bar's own upper left corner, which mirrors to the outer edge on
      // the left side and the spine on the right
      expect(anchors(node, "left")).toEqual(["translate(-40.5,0)", "translate(-20.5,12)"]);
      expect(anchors(node, "right")).toEqual(["translate(0.5,0)", "translate(0.5,12)"]);
    });

    test("should not mirror tooltipAnchor for the left side", () => {
      // NOTE: tooltipAnchor is handed to both bar components unchanged, and bar measures
      // from its own upper left corner. The left bar's corner is the outer tip of the
      // pyramid, so [1, 0.5] means "outer tip" on the right and "spine" on the left - the
      // same setting lands on visually opposite sides. Only x = 0.5 is mirror-safe, which
      // is why the default is [0.5, 0.5].
      const node = render(pyramidOf().tooltipAnchor([1, 0.5]), testData);
      expect(anchors(node, "right")).toEqual(["translate(30.5,5)", "translate(10.5,17)"]);
      expect(anchors(node, "left")).toEqual(["translate(-0.5,5)", "translate(-0.5,17)"]);
    });

    test("should yield a NaN coordinate for a tooltipAnchor with fewer than two entries", () => {
      // NOTE: inherited from bar, and documented on bar's tooltipAnchor property. The
      // pyramid adds no validation of its own, so a one-element array silently produces an
      // invalid transform on every anchor.
      const node = render(pyramidOf().tooltipAnchor([0.5]), testData);
      expect(anchors(node, "right")).toEqual(["translate(15.5,NaN)", "translate(5.5,NaN)"]);
    });
  });

  describe("reference lines", () => {
    /** Both reference series present, which is what the reference accessors require. */
    type WithRefs = Required<Population>;
    const withRefs = () =>
      pyramidOf()
        .leftRefAccessor((d: WithRefs) => d.leftRef)
        .rightRefAccessor((d: WithRefs) => d.rightRef);
    const refData: WithRefs = { left, right, leftRef: left, rightRef: right };

    test("should render no path when no reference accessor is set", () => {
      const node = render(pyramidOf(), testData);
      expect(lines(node, "leftReference").length).toBe(0);
      expect(lines(node, "rightReference").length).toBe(0);
    });

    test("should render exactly one classed path per configured side", () => {
      const node = render(withRefs(), refData);
      expect(lines(node, "leftReference").length).toBe(1);
      expect(lines(node, "rightReference").length).toBe(1);
      expect(lines(node, "leftReference")[0].tagName).toBe("path");
    });

    test("should render only the configured side", () => {
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      expect(lines(node, "leftReference").length).toBe(0);
      expect(lines(node, "rightReference").length).toBe(1);
    });

    test("should mirror the left reference line only", () => {
      const node = render(withRefs(), refData);
      expect(lines(node, "leftReference")[0].getAttribute("transform")).toBe("scale(-1, 1)");
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("should draw the path along the bars' outer edges at their mid-height", async () => {
      const node = render(withRefs(), refData);
      // x is SPINE_PADDING + barWidth, y is barPosition + barHeight / 2
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
      expect(await lineD(node, "leftReference")).toBe("M40.5,5L20.5,17");
    });

    test("should line up with the bars it describes", async () => {
      // The reference point sits exactly on the bar's outer edge, vertically centred on it.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        { left, right: [{ age: 0, value: 100 }] },
      );
      const barRight =
        Number(attrs(node, "right", "x")[0]) + Number(attrs(node, "right", "width")[0]);
      const barMiddle =
        Number(attrs(node, "right", "y")[0]) + Number(attrs(node, "right", "height")[0]) / 2;
      expect([barRight, barMiddle]).toEqual([100.5, 5]);
      // d3.line closes a single-point path with Z
      expect(await lineD(node, "rightReference")).toBe(`M${barRight},${barMiddle}Z`);
    });

    test("should carry geometry synchronously on the tick it is first rendered", () => {
      // getBBox, snapshots and PNG exports all measure right after render, so an entering
      // path must not wait for the first animation frame.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30.5,5L10.5,17");
    });

    test("should follow reference data that differs from the bar data", async () => {
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { age: 0, value: 5 },
          { age: 2, value: 7 },
        ]),
        testData,
      );
      expect(await lineD(node, "rightReference")).toBe("M5.5,5L7.5,29");
    });

    test("should re-render the reference line in place", async () => {
      const component = withRefs();
      const g = group("ref-rerender");
      g.datum(refData).call(component as never);
      g.datum(refData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(lines(node, "rightReference").length).toBe(1);
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
    });

    test("should animate the reference line when the data changes", async () => {
      const component = withRefs();
      const g = group("ref-animate");
      g.datum(refData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");

      g.datum({
        ...refData,
        rightRef: [
          { age: 0, value: 100 },
          { age: 1, value: 90 },
        ],
      }).call(component as never);
      // Unlike the bars, the line really does transition: the old path is still in place
      // on the tick the re-render happens.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30.5,5L10.5,17");
      await vi.waitFor(() =>
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M100.5,5L90.5,17"),
      );
    });

    describe("missing reference data", () => {
      const warn = () => vi.spyOn(console, "warn").mockImplementation(() => {});

      test("should render no path when the accessor returns undefined", () => {
        const spy = warn();
        const node = render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().rightRefAccessor(() => undefined),
          testData,
        );
        expect(lines(node, "rightReference").length).toBe(0);
        expect(spy).toHaveBeenCalledOnce();
        spy.mockRestore();
      });

      test("should render no path when the accessor returns null", () => {
        const spy = warn();
        const node = render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().rightRefAccessor(() => null),
          testData,
        );
        expect(lines(node, "rightReference").length).toBe(0);
        expect(spy).toHaveBeenCalledOnce();
        spy.mockRestore();
      });

      test("should render no path for a non-array the accessor returned", () => {
        // The guard tests Array.isArray rather than null-ness: an array-like such as
        // { length: 0 } used to pass as an empty series, and a plain object was wrapped
        // and handed to d3.line, where it renders nonsense or throws.
        for (const value of [{ length: 0 }, { a: 1 }, "abc"]) {
          const spy = warn();
          const node = render(
            // @ts-expect-error - deliberately violating the accessor's return contract
            pyramidOf().rightRefAccessor(() => value),
            testData,
          );
          expect(lines(node, "rightReference").length).toBe(0);
          expect(spy).toHaveBeenCalledOnce();
          spy.mockRestore();
        }
      });

      test("should render no path for an empty series, without warning", () => {
        // An empty array is a legitimately empty series, unlike undefined or null.
        const spy = warn();
        const node = render(
          pyramidOf().rightRefAccessor(() => []),
          testData,
        );
        expect(lines(node, "rightReference").length).toBe(0);
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      });

      test("should remove a rendered path when its series goes away", async () => {
        const component = pyramidOf().rightRefAccessor((d: Population) => d.rightRef ?? []);
        const g = group("ref-removal");
        g.datum({ left, right, rightRef: right }).call(component as never);
        const node = g.node() as SVGGElement;
        expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");

        g.datum({ left, right }).call(component as never);
        expect(lines(node, "rightReference").length).toBe(0);
      });

      test("should render the path again on a later non-empty render", async () => {
        const component = pyramidOf().rightRefAccessor((d: Population) => d.rightRef ?? []);
        const g = group("ref-return");
        const node = g
          .datum({ left, right })
          .call(component as never)
          .node() as SVGGElement;
        expect(lines(node, "rightReference").length).toBe(0);

        g.datum({ left, right, rightRef: right }).call(component as never);
        expect(lines(node, "rightReference").length).toBe(1);
        expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
      });
    });

    describe("gaps in the reference series", () => {
      test("should skip a missing value and continue the outline past it", async () => {
        const node = render(
          pyramidOf().rightRefAccessor(() => [
            { age: 0, value: 10 },
            { age: 1, value: Number.NaN },
            { age: 2, value: 30 },
          ]),
          testData,
        );
        // The gap breaks the outline into two segments rather than truncating it.
        expect(await lineD(node, "rightReference")).toBe("M10.5,5ZM30.5,29Z");
      });

      test("should skip a missing value in the first position", async () => {
        const node = render(
          pyramidOf().rightRefAccessor(() => [
            { age: 0, value: Number.NaN },
            { age: 1, value: 5 },
            { age: 2, value: 7 },
          ]),
          testData,
        );
        expect(await lineD(node, "rightReference")).toBe("M5.5,17L7.5,29");
      });

      test("should skip a missing value in the last position", async () => {
        const node = render(
          pyramidOf().rightRefAccessor(() => [
            { age: 0, value: 5 },
            { age: 1, value: 7 },
            { age: 2, value: Number.NaN },
          ]),
          testData,
        );
        expect(await lineD(node, "rightReference")).toBe("M5.5,5L7.5,17");
      });

      test("should skip a point whose vertical position is missing", async () => {
        const node = render(
          pyramid()
            .barHeight(10)
            .barWidth((d: Datum) => d.value)
            .barPosition((d: Datum) => (d.age === 1 ? Number.NaN : d.age * 12))
            .leftAccessor((d: Population) => d.left)
            .rightAccessor((d: Population) => d.right)
            .rightRefAccessor(() => [
              { age: 0, value: 10 },
              { age: 1, value: 20 },
              { age: 2, value: 30 },
            ]),
          testData,
        );
        expect(await lineD(node, "rightReference")).toBe("M10.5,5ZM30.5,29Z");
      });
    });

    test("should animate the bars and the reference lines in step", async () => {
      // Both the bars and the outline now transition, so on the tick after an update both
      // still describe the old geometry and both ease to the new one together. Before bar's
      // transition was made real the bars snapped to their destination on this tick while
      // the outline eased, and the reference line visibly detached from them mid-animation.
      const component = pyramidOf().rightRefAccessor((d: Population) => d.right);
      const g = group("stepped-transitions");
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");

      g.datum({
        left,
        right: [
          { age: 0, value: 100 },
          { age: 1, value: 90 },
        ],
      }).call(component as never);
      // On this tick the bars have not jumped ahead...
      expect(attrs(node, "right", "width")).toEqual(["30", "10"]);
      // ...and the line still describes the same old geometry.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30.5,5L10.5,17");

      // Once the transition has run, both have arrived.
      await vi.waitFor(() => {
        expect(attrs(node, "right", "width")).toEqual(["100", "90"]);
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M100.5,5L90.5,17");
      });
    });
  });

  describe("required props", () => {
    /** A pyramid with both side accessors wired but no bar dimensions set. */
    const bare = () =>
      pyramid()
        .leftAccessor((d: Population) => d.left)
        .rightAccessor((d: Population) => d.right);

    /** A pyramid with every required property set, so one can be dropped at a time. */
    const complete = () => bare().barHeight(5).barWidth(10).barPosition(5);

    test("should throw a named error when barHeight is missing", () => {
      expect(() => render(bare().barWidth(10).barPosition(5), testData)).toThrow(
        "[pyramid] the barHeight property is required",
      );
    });

    test("should throw a named error when barWidth is missing", () => {
      expect(() => render(bare().barHeight(5).barPosition(5), testData)).toThrow(
        "[pyramid] the barWidth property is required",
      );
    });

    test("should throw a named error when barPosition is missing", () => {
      expect(() => render(bare().barHeight(5).barWidth(10), testData)).toThrow(
        "[pyramid] the barPosition property is required",
      );
    });

    test("should throw a named error when leftAccessor is missing", () => {
      expect(() =>
        render(
          pyramid()
            .barHeight(5)
            .barWidth(10)
            .barPosition(5)
            .rightAccessor((d: Population) => d.right),
          testData,
        ),
      ).toThrow("[pyramid] the leftAccessor property is required");
    });

    test("should throw a named error when rightAccessor is missing", () => {
      expect(() =>
        render(
          pyramid()
            .barHeight(5)
            .barWidth(10)
            .barPosition(5)
            .leftAccessor((d: Population) => d.left),
          testData,
        ),
      ).toThrow("[pyramid] the rightAccessor property is required");
    });

    test("should render nothing at all when a required property is missing", () => {
      // The check runs before the first selectGroup, so a failed render leaves no partial
      // chart behind for the caller to misread.
      const g = group("required-no-render");
      expect(() => g.datum(testData).call(bare().barWidth(10) as never)).toThrow();
      expect((g.node() as SVGGElement).childElementCount).toBe(0);
    });

    test("should not throw once every required property is set", () => {
      expect(() => render(complete(), testData)).not.toThrow();
    });

    test("should throw when a side accessor returns undefined", () => {
      // NOTE: only the *unset* case is reported by name. A side accessor that returns no
      // data is a broken chart rather than an empty one, so it is left to throw from d3's
      // data join - unlike a reference accessor, which warns and skips its line.
      expect(() =>
        render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().leftAccessor(() => undefined),
          testData,
        ),
      ).toThrow(TypeError);
    });
  });

  describe("known quirks", () => {
    test("collapses a mirrored bar onto the spine when its width is missing", () => {
      // NOTE: -SPINE_PADDING - NaN is NaN, which bar's guard turns into 0. The left bar
      // therefore lands at x=0 rather than at the spine's -0.5, so a missing value on the
      // left is drawn half a pixel off from a missing value on the right. Left as is
      // deliberately: bar owns the missing-value guard, and duplicating it here to guard
      // barWidth before the mirroring arithmetic would put the same rule in two places.
      const node = render(
        pyramidOf().barWidth(() => Number.NaN),
        testData,
      );
      expect(attrs(node, "left", "x")).toEqual(["0", "0"]);
      expect(attrs(node, "left", "width")).toEqual(["0", "0"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
    });

    test("relies entirely on stylesheet rules for the reference line's appearance", () => {
      // NOTE: unlike stackedPyramid's otherwise identical lineComponent, which inlines
      // fill, stroke, stroke-width and stroke-dasharray, this one sets only a class and
      // leans on .sszvis-pyramid__referenceline in sszvis.css - which defines exactly the
      // same four values stackedPyramid hardcodes. The two components solve one problem in
      // two mutually exclusive ways, and stackedPyramid's class (.sszvis-path) has no CSS
      // rule at all. Without the stylesheet this path renders as a solid black filled
      // shape, since fill defaults to black.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      const path = lines(node, "rightReference")[0];
      expect(path.getAttribute("fill")).toBeNull();
      expect(path.getAttribute("stroke")).toBeNull();
      expect(path.getAttribute("stroke-width")).toBeNull();
    });

    test("puts a negative-width left bar on the wrong side of the spine", () => {
      // NOTE: bar guards NaN but not negative numbers, and mirroring turns the sign around
      // twice: -SPINE_PADDING - (-5) is 4.5, so the left bar starts to the right of the
      // spine. Both rects also get an invalid negative width. Reaching this needs a scale
      // with an inverted range or negative input data, which a population pyramid should
      // never see, so this is a note rather than a bug in practice.
      const node = render(pyramidOf().barWidth(-5), testData);
      expect(attrs(node, "left", "x")).toEqual(["4.5", "4.5"]);
      expect(attrs(node, "left", "width")).toEqual(["-5", "-5"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
    });

    test("gives the right reference line an empty transform attribute", () => {
      // NOTE: the mirror prop writes `transform=""` rather than omitting the attribute.
      // Harmless, but it means the attribute is always present.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });
  });
});
