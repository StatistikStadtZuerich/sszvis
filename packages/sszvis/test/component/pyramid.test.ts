import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import pyramid from "../../src/component/pyramid.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import { describesTheMarkJoin } from "../support/componentConformance.js";
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

  // Both sides are fed the same series: binding an empty population object is not an option,
  // because a side accessor returning undefined throws from d3's join - the behaviour pinned
  // under "required props" below.
  describesTheMarkJoin<Datum>(() => ({
    make: pyramidOf,
    renderInto: (key, component, data) =>
      group(key)
        .datum({ left: data, right: data })
        .call(component as never)
        .node() as SVGGElement,
    count: (node) => ({
      leftBars: bars(node, "left").length,
      rightBars: bars(node, "right").length,
      leftAnchors: anchors(node, "left").length,
      rightAnchors: anchors(node, "right").length,
    }),
    full: { data: left, marks: { leftBars: 2, rightBars: 2, leftAnchors: 2, rightAnchors: 2 } },
    smaller: {
      data: [left[0]],
      marks: { leftBars: 1, rightBars: 1, leftAnchors: 1, rightAnchors: 1 },
    },
  }));

  describe("groups", () => {
    test("should order the reference groups after the bar groups when it renders", () => {
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
    test("should mirror the two sides around a one-pixel spine when it renders", () => {
      const node = render(pyramidOf(), testData);
      // On the left x = -SPINE_PADDING - barWidth, so the bar grows leftwards from the
      // spine; on the right it starts at +SPINE_PADDING and grows rightwards.
      expect(attrs(node, "left", "x")).toEqual(["-40.5", "-20.5"]);
      expect(attrs(node, "left", "width")).toEqual(["40", "20"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
      expect(attrs(node, "right", "width")).toEqual(["30", "10"]);
      // 2 * SPINE_PADDING between the sides, whatever the bars measure: the left bar's own
      // right edge lands at -0.5 and the right bar starts at 0.5.
      expect(Number(attrs(node, "left", "x")[0]) + Number(attrs(node, "left", "width")[0])).toBe(
        -0.5,
      );
    });

    test("should take a bar's vertical position and height from the props when it renders", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "left", "y")).toEqual(["0", "12"]);
      expect(attrs(node, "right", "y")).toEqual(["0", "12"]);
      expect(attrs(node, "left", "height")).toEqual(["10", "10"]);
      expect(attrs(node, "right", "height")).toEqual(["10", "10"]);
    });

    test("should treat a constant as an accessor when a dimension prop is set to a number", () => {
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

    test("should paint both sides with the colour barFill returns when barFill is an accessor", () => {
      const node = render(
        pyramidOf().barFill((d: Datum) => d.color),
        testData,
      );
      expect(attrs(node, "left", "fill")).toEqual(["#f00", "#f00"]);
      expect(attrs(node, "right", "fill")).toEqual(["#00f", "#00f"]);
    });

    test("should paint the bars black when barFill is left unset", () => {
      const node = render(pyramidOf(), testData);
      expect(attrs(node, "left", "fill")).toEqual(["#000", "#000"]);
      expect(attrs(node, "right", "fill")).toEqual(["#000", "#000"]);
    });

    test("should draw each side independently when the two sides differ in length", () => {
      const node = render(pyramidOf(), { left, right: [right[0]] });
      expect(bars(node, "left").length).toBe(2);
      expect(bars(node, "right").length).toBe(1);
    });

    test("should reuse a side's group rather than add a second one when it renders twice", () => {
      // The marks themselves are covered by the shared join contract above; what is left here
      // is the layer the marks live in, which the join never counts.
      const component = pyramidOf();
      const g = group("rerender");
      g.datum(testData).call(component as never);
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(node.querySelectorAll('[data-d3-selectgroup="left"]').length).toBe(1);
    });

    test("should hand barWidth d3's index on both sides when the accessor takes one", () => {
      const node = render(
        pyramidOf().barWidth((_d: Datum, i: number) => 100 + i),
        testData,
      );
      expect(attrs(node, "left", "width")).toEqual(["100", "101"]);
      expect(attrs(node, "left", "x")).toEqual(["-100.5", "-101.5"]);
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
    });

    test("should move the bars to the new geometry when the data changes", async () => {
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
    test("should render one anchor per bar inside its own side's group when both sides have data", () => {
      const node = render(pyramidOf(), testData);
      expect(anchors(node, "left").length).toBe(2);
      expect(anchors(node, "right").length).toBe(2);
    });

    test("should centre an anchor on its bar when tooltipAnchor is left unset", () => {
      const node = render(pyramidOf(), testData);
      // The default tooltipAnchor of [0.5, 0.5] overrides bar's own top-centre default:
      // left x + 0.5 * width, y + 0.5 * height
      expect(anchors(node, "left")).toEqual(["translate(-20.5,5)", "translate(-10.5,17)"]);
      expect(anchors(node, "right")).toEqual(["translate(15.5,5)", "translate(5.5,17)"]);
    });

    test("should hand both sides the same anchor when a custom tooltipAnchor is set", () => {
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

    test("should draw one path per side that has a reference accessor, and none for a side without one", () => {
      const none = render(pyramidOf(), testData);
      expect([lines(none, "leftReference").length, lines(none, "rightReference").length]).toEqual([
        0, 0,
      ]);

      const both = render(withRefs(), refData);
      expect([lines(both, "leftReference").length, lines(both, "rightReference").length]).toEqual([
        1, 1,
      ]);
      expect(lines(both, "leftReference")[0].tagName).toBe("path");

      const rightOnly = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      expect([
        lines(rightOnly, "leftReference").length,
        lines(rightOnly, "rightReference").length,
      ]).toEqual([0, 1]);
    });

    test("should mirror only the left reference line when both sides are configured", () => {
      const node = render(withRefs(), refData);
      expect(lines(node, "leftReference")[0].getAttribute("transform")).toBe("scale(-1, 1)");
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("should trace the bars' outer edges at their mid-height when a reference series is set", async () => {
      const node = render(withRefs(), refData);
      // x is SPINE_PADDING + barWidth, y is barPosition + barHeight / 2
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
      expect(await lineD(node, "leftReference")).toBe("M40.5,5L20.5,17");
    });

    test("should put the reference point on the bar's outer edge when the two describe the same row", async () => {
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

    test("should already carry its geometry on the render tick when a reference path first appears", () => {
      // getBBox, snapshots and PNG exports all measure right after render, so an entering
      // path must not wait for the first animation frame.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData,
      );
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30.5,5L10.5,17");
    });

    test("should follow the reference series when it differs from the bar data", async () => {
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { age: 0, value: 5 },
          { age: 2, value: 7 },
        ]),
        testData,
      );
      expect(await lineD(node, "rightReference")).toBe("M5.5,5L7.5,29");
    });

    test("should update the reference line in place when the same data is rendered twice", async () => {
      const component = withRefs();
      const g = group("ref-rerender");
      g.datum(refData).call(component as never);
      g.datum(refData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(lines(node, "rightReference").length).toBe(1);
      expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
    });

    test("should ease the reference line to its new shape when the data changes", async () => {
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

      test("should warn and draw no path when the accessor returns something that is not a series", () => {
        // The guard tests Array.isArray rather than null-ness: an array-like such as
        // { length: 0 } used to pass as an empty series, and a plain object was wrapped
        // and handed to d3.line, where it renders nonsense or throws.
        for (const value of [undefined, null, { length: 0 }, { a: 1 }, "abc"]) {
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

      test("should draw no path and not warn when the reference series is empty", () => {
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

      test("should remove the path when its series goes away, and draw it again when it comes back", async () => {
        // This is where pyramid and stackedPyramid part company: stackedPyramid wraps the
        // series in a one-element array, so its exit selection is always empty and the path
        // it drew survives the series disappearing.
        const component = pyramidOf().rightRefAccessor((d: Population) => d.rightRef ?? []);
        const g = group("ref-lifecycle");
        g.datum({ left, right, rightRef: right }).call(component as never);
        const node = g.node() as SVGGElement;
        expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");

        g.datum({ left, right }).call(component as never);
        expect(lines(node, "rightReference").length).toBe(0);

        g.datum({ left, right, rightRef: right }).call(component as never);
        expect(lines(node, "rightReference").length).toBe(1);
        expect(await lineD(node, "rightReference")).toBe("M30.5,5L10.5,17");
      });
    });

    describe("gaps in the reference series", () => {
      // One rule - `.defined()` drops the point and d3.line starts a new subpath - observed
      // at each position a gap can occupy. stackedPyramid has no such guard, and a NaN there
      // poisons the whole path string.
      test.each([
        {
          when: "the gap falls in the middle of the series",
          series: [
            { age: 0, value: 10 },
            { age: 1, value: Number.NaN },
            { age: 2, value: 30 },
          ],
          // The gap breaks the outline into two segments rather than truncating it.
          d: "M10.5,5ZM30.5,29Z",
        },
        {
          when: "the gap falls in the first position",
          series: [
            { age: 0, value: Number.NaN },
            { age: 1, value: 5 },
            { age: 2, value: 7 },
          ],
          d: "M5.5,17L7.5,29",
        },
        {
          when: "the gap falls in the last position",
          series: [
            { age: 0, value: 5 },
            { age: 1, value: 7 },
            { age: 2, value: Number.NaN },
          ],
          d: "M5.5,5L7.5,17",
        },
      ])("should carry the outline past the missing point when $when", async ({ series, d }) => {
        const node = render(
          pyramidOf().rightRefAccessor(() => series),
          testData,
        );
        expect(await lineD(node, "rightReference")).toBe(d);
      });

      test("should carry the outline past a point when its vertical position is missing", async () => {
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

    test("should move the bars and the reference lines together when the data changes", async () => {
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

    /** Every required property, each row dropping the one it names. */
    const withoutProp = {
      barHeight: () => bare().barWidth(10).barPosition(5),
      barWidth: () => bare().barHeight(5).barPosition(5),
      barPosition: () => bare().barHeight(5).barWidth(10),
      leftAccessor: () =>
        pyramid()
          .barHeight(5)
          .barWidth(10)
          .barPosition(5)
          .rightAccessor((d: Population) => d.right),
      rightAccessor: () =>
        pyramid()
          .barHeight(5)
          .barWidth(10)
          .barPosition(5)
          .leftAccessor((d: Population) => d.left),
    };

    test.each(Object.keys(withoutProp))(
      "should throw an error naming the property when %s is missing",
      (prop) => {
        expect(() => render(withoutProp[prop as keyof typeof withoutProp](), testData)).toThrow(
          `[pyramid] the ${prop} property is required`,
        );
      },
    );

    test("should leave the group empty when a required property is missing", () => {
      // The check runs before the first selectGroup, so a failed render leaves no partial
      // chart behind for the caller to misread.
      const g = group("required-no-render");
      expect(() => g.datum(testData).call(bare().barWidth(10) as never)).toThrow();
      expect((g.node() as SVGGElement).childElementCount).toBe(0);
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
