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
      a.getAttribute("transform")
    );
  const lines = (node: Element, key: string) => [
    ...(side(node, key)?.querySelectorAll("path.sszvis-pyramid__referenceline") ?? []),
  ];
  /** The reference line's `d` is applied through a transition, so it lands a frame later. */
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
        g.getAttribute("data-d3-selectgroup")
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
        testData
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
        testData
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
        testData
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

    test("should update the geometry when the data changes", () => {
      const component = pyramidOf();
      const g = group("update");
      g.datum(testData).call(component as never);
      g.datum({ left: [{ age: 3, value: 99 }], right: [{ age: 3, value: 5 }] }).call(
        component as never
      );
      const node = g.node() as SVGGElement;
      expect(attrs(node, "left", "x")).toEqual(["-99.5"]);
      expect(attrs(node, "left", "y")).toEqual(["36"]);
      expect(attrs(node, "right", "width")).toEqual(["5"]);
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
        testData
      );
      expect(lines(node, "leftReference").length).toBe(0);
      expect(lines(node, "rightReference").length).toBe(1);
    });

    test("should mirror the left reference line only", () => {
      const node = render(withRefs(), refData);
      expect(lines(node, "leftReference")[0].getAttribute("transform")).toBe("scale(-1, 1)");
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });

    test("should draw the path from barWidth and barPosition", async () => {
      const node = render(withRefs(), refData);
      // x comes from barWidth, y from barPosition - the same accessors the bars use
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");
      expect(await lineD(node, "leftReference")).toBe("M40,0L20,12");
    });

    test("should follow reference data that differs from the bar data", async () => {
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { age: 0, value: 5 },
          { age: 2, value: 7 },
        ]),
        testData
      );
      expect(await lineD(node, "rightReference")).toBe("M5,0L7,24");
    });

    test("should re-render the reference line in place", async () => {
      const component = withRefs();
      const g = group("ref-rerender");
      g.datum(refData).call(component as never);
      g.datum(refData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(lines(node, "rightReference").length).toBe(1);
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");
    });

    test("should animate the reference line when the data changes", async () => {
      const component = withRefs();
      const g = group("ref-animate");
      g.datum(refData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");

      g.datum({
        ...refData,
        rightRef: [
          { age: 0, value: 100 },
          { age: 1, value: 90 },
        ],
      }).call(component as never);
      // Unlike the bars, the line really does transition: the old path is still in place
      // on the tick the re-render happens.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30,0L10,12");
      await vi.waitFor(() =>
        expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M100,0L90,12")
      );
    });
  });

  describe("required props", () => {
    /** A pyramid with both side accessors wired but no bar dimensions set. */
    const bare = () =>
      pyramid()
        .leftAccessor((d: Population) => d.left)
        .rightAccessor((d: Population) => d.right);

    test("should throw when leftAccessor is missing", () => {
      expect(() => render(pyramid().barHeight(1).barWidth(1).barPosition(1), testData)).toThrow(
        TypeError
      );
    });

    test("should throw when barWidth is missing", () => {
      // barWidth is the only bar dimension the component itself calls: the left bar's x is
      // computed as -SPINE_PADDING - props.barWidth(d), which dies on an unset prop.
      expect(() => render(bare().barHeight(1).barPosition(1), testData)).toThrow(TypeError);
    });

    describe("known quirks", () => {
      test("silently renders zero-height bars when barHeight is missing", () => {
        // BUG: barHeight and barPosition are passed straight through to bar, which runs
        // them through its NaN guard, so an unset prop becomes 0 instead of an error. The
        // chart renders as an empty axis frame with no bars and no warning - the failure is
        // invisible, unlike the barWidth case above.
        // current: height="0". expected: an error naming the missing prop.
        const node = render(bare().barWidth(10).barPosition(5), testData);
        expect(attrs(node, "right", "height")).toEqual(["0", "0"]);
      });

      test("silently stacks every bar at y=0 when barPosition is missing", () => {
        // BUG: same root cause as barHeight above. All the bars pile up on one row.
        // current: y="0" for every bar. expected: an error naming the missing prop.
        const node = render(bare().barWidth(10).barHeight(5), testData);
        expect(attrs(node, "right", "y")).toEqual(["0", "0"]);
      });

      test("throws when a side accessor returns undefined", () => {
        // NOTE: the error comes from d3's data join, so the message names neither the prop
        // nor the component: "undefined is not iterable".
        expect(() =>
          render(
            // @ts-expect-error - deliberately violating the accessor's return contract
            pyramidOf().leftAccessor(() => undefined),
            testData
          )
        ).toThrow(TypeError);
      });
    });
  });

  describe("known quirks", () => {
    test("the reference line ignores the spine padding, so it sits half a pixel inside the bars", async () => {
      // NOTE: the bars are offset outwards by SPINE_PADDING (0.5) but the reference line is
      // drawn straight from barWidth with no offset, so a reference value equal to a bar
      // value lands half a pixel inside that bar's outer edge. It does so symmetrically on
      // both sides, and the line is the side that agrees with the axis scale - the padding
      // is a deliberate cosmetic gap between the bars. stackedPyramid makes the identical
      // choice. Filed as a NOTE rather than a BUG for that reason, but it does mean bars
      // and reference lines are drawn in two subtly different coordinate systems.
      const node = render(
        pyramid()
          .barHeight(10)
          .barWidth((d: Datum) => d.value)
          .barPosition(0)
          .leftAccessor((d: Population) => d.left)
          .rightAccessor((d: Population) => d.right)
          .rightRefAccessor((d: Population) => d.right),
        { left, right: [{ age: 0, value: 100 }] }
      );
      const barRight =
        Number(attrs(node, "right", "x")[0]) + Number(attrs(node, "right", "width")[0]);
      expect(barRight).toBe(100.5);
      // d3.line closes a single-point path with Z
      expect(await lineD(node, "rightReference")).toBe("M100,0Z");
    });

    test("has no d attribute on the tick it is first rendered", async () => {
      // NOTE: the path's `d` is only ever applied through a transition, so the element
      // exists with no geometry until the first animation frame. Anything that measures
      // the chart synchronously after render (getBBox, a snapshot, an export to PNG) sees
      // an empty path.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData
      );
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull();
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");
    });

    test("crashes when a reference accessor returns undefined", () => {
      // BUG: the reference line is guarded on the accessor existing, not on it returning
      // data - `props.rightRefAccessor ? [props.rightRefAccessor(data)] : []`. An accessor
      // that returns undefined for some states (a filter with no matches, a group that is
      // missing for one year) throws instead of hiding the line.
      // current: TypeError "undefined is not iterable". expected: no line.
      expect(() =>
        render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().rightRefAccessor(() => undefined),
          testData
        )
      ).toThrow(TypeError);
      // null takes a different path through d3 and produces a different message again:
      // "Cannot use 'in' operator to search for 'length' in null".
      expect(() =>
        render(
          // @ts-expect-error - deliberately violating the accessor's return contract
          pyramidOf().rightRefAccessor(() => null),
          testData
        )
      ).toThrow(TypeError);
    });

    test("leaves an empty path element behind for empty reference data", async () => {
      // NOTE: an empty array is handled, but the path is still created - d3.line returns
      // null for no points, so `d` is simply absent.
      const node = render(
        pyramidOf().rightRefAccessor(() => []),
        testData
      );
      expect(lines(node, "rightReference").length).toBe(1);
      await vi.waitFor(() => expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull());
    });

    test("does not guard the reference line against missing values", async () => {
      // BUG: bar runs every geometry value through a NaN guard, but the reference line
      // passes barWidth and barPosition straight to d3.line. One missing value poisons the
      // path string; the browser renders the valid prefix and drops the rest of the line,
      // so a single gap in the reference series truncates the outline.
      // current: d="MNaN,0L5,12". expected: the point is skipped, or coerced to 0.
      const node = render(
        pyramidOf().rightRefAccessor(() => [
          { age: 0, value: Number.NaN },
          { age: 1, value: 5 },
        ]),
        testData
      );
      expect(await lineD(node, "rightReference")).toBe("MNaN,0L5,12");
    });

    test("collapses a mirrored bar onto the spine when its width is missing", () => {
      // NOTE: -SPINE_PADDING - NaN is NaN, which bar's guard turns into 0. The left bar
      // therefore lands at x=0 rather than at the spine's -0.5, so a missing value on the
      // left is drawn half a pixel off from a missing value on the right.
      const node = render(
        pyramidOf().barWidth(() => Number.NaN),
        testData
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
        testData
      );
      const path = lines(node, "rightReference")[0];
      expect(path.getAttribute("fill")).toBeNull();
      expect(path.getAttribute("stroke")).toBeNull();
      expect(path.getAttribute("stroke-width")).toBeNull();
    });

    test("the bars jump while the reference lines animate", async () => {
      // BUG: bar's transition property is inert (see test/component/bar.test.ts), but the
      // reference line's transition is real. On a state change the outline eases into
      // place over 300ms while the bars underneath it snap immediately, so the reference
      // line visibly detaches from the bars mid-transition.
      const component = pyramidOf().rightRefAccessor((d: Population) => d.right);
      const g = group("mixed-transitions");
      g.datum(testData).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");

      g.datum({
        left,
        right: [
          { age: 0, value: 100 },
          { age: 1, value: 90 },
        ],
      }).call(component as never);
      // The bar is already at its new width on this tick...
      expect(attrs(node, "right", "width")).toEqual(["100", "90"]);
      // ...while the line still describes the old one.
      expect(lines(node, "rightReference")[0].getAttribute("d")).toBe("M30,0L10,12");
    });

    test("traces the top edges of the bars, not their mid-lines", async () => {
      // BUG: the reference line takes y straight from barPosition, which is the bar's top
      // edge, and never accounts for barHeight. The outline is therefore drawn half a bar
      // height above the values it describes - a much larger error than the half pixel of
      // spine padding above, and it grows with barHeight.
      // current: the line passes through the bars' top left corners. expected: through
      // their mid-height, or as a step path along their outer edges.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData
      );
      expect(attrs(node, "right", "y")).toEqual(["0", "12"]);
      expect(attrs(node, "right", "height")).toEqual(["10", "10"]);
      // Bar mid-lines are at y = 5 and y = 17, but the line is drawn at 0 and 12.
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");
    });

    test("drops the index when computing the left bars' x", () => {
      // BUG: the left bar's x calls props.barWidth(d) with the datum only, while bar calls
      // width with (d, i, nodes). An index-aware or node-aware barWidth accessor therefore
      // sees undefined for i, and on the left side only: position desynchronises from
      // width, here collapsing to x=0 because 100 + undefined is NaN and bar's guard turns
      // that into 0. stackedPyramid has the same shape.
      // current: left x="0" with width="100"/"101". expected: x="-100.5"/"-101.5".
      const node = render(
        pyramidOf().barWidth((_d: Datum, i: number) => 100 + i),
        testData
      );
      expect(attrs(node, "left", "width")).toEqual(["100", "101"]);
      expect(attrs(node, "left", "x")).toEqual(["0", "0"]);
      // The right side, which passes the accessor to bar untouched, is fine.
      expect(attrs(node, "right", "x")).toEqual(["0.5", "0.5"]);
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

    test("never removes a reference path once it has been rendered", async () => {
      // BUG: the reference datum is wrapped in an array - [props.rightRefAccessor(data)] -
      // so the join always has exactly one element and the exit selection can never fire.
      // When the reference series goes away the stale path stays in the DOM; only `d` is
      // dropped. Harmless visually, but the DOM keeps state that no longer corresponds to
      // the data, and CSS or a hit test can still find the element. The same wrapping caps
      // each side at one reference line.
      const component = pyramidOf().rightRefAccessor((d: Population) => d.rightRef ?? []);
      const g = group("ref-removal");
      g.datum({ left, right, rightRef: right }).call(component as never);
      const node = g.node() as SVGGElement;
      expect(await lineD(node, "rightReference")).toBe("M30,0L10,12");

      g.datum({ left, right }).call(component as never);
      await vi.waitFor(() => expect(lines(node, "rightReference")[0].getAttribute("d")).toBeNull());
      expect(lines(node, "rightReference").length).toBe(1);
    });

    test("gives the right reference line an empty transform attribute", () => {
      // NOTE: the mirror prop writes `transform=""` rather than omitting the attribute.
      // Harmless, but it means the attribute is always present.
      const node = render(
        pyramidOf().rightRefAccessor((d: Population) => d.right),
        testData
      );
      expect(lines(node, "rightReference")[0].getAttribute("transform")).toBe("");
    });
  });
});
