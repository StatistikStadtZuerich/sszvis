import { range, scaleBand, scaleLinear, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { groupedBarsHorizontal, groupedBarsVertical } from "../../src/component/groupedBars.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import type { LayerSelection } from "../../src/types.js";
import "../../src/d3-selectgroup.js";

type TestDatum = {
  category: string;
  group: string;
  value: number;
};

describe("component/groupedBars", () => {
  let container: HTMLDivElement;
  let svg: LayerSelection<SVGGElement, number>;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    svg = createSvgLayer("#chart-container", undefined, { key: "test-layer" });
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

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

  const testData: TestDatum[][] = [
    [
      { category: "A", group: "G1", value: 10 },
      { category: "B", group: "G1", value: 20 },
    ],
    [
      { category: "A", group: "G2", value: 15 },
      { category: "B", group: "G2", value: 25 },
    ],
    [
      { category: "A", group: "G3", value: 12 },
      { category: "B", group: "G3", value: 18 },
    ],
  ];

  /**
   * The in-group band the component builds internally, rebuilt here so the tests can assert
   * absolute slots rather than "somewhere inside the group", which a render that ignored the
   * in-group index would also satisfy.
   */
  const bandOf = (groupSize: number, extent: number, groupSpace = 0.05) =>
    scaleBand<number>()
      .domain(range(groupSize))
      .padding(groupSpace)
      .paddingOuter(0)
      .rangeRound([0, extent]);

  const verticalGroupScale = scaleBand<string>()
    .domain(["G1", "G2", "G3"])
    .range([0, 300])
    .padding(0.1);
  const verticalValueScale = scaleLinear().domain([0, 30]).range([200, 0]);
  const horizontalGroupScale = scaleBand<string>()
    .domain(["G1", "G2", "G3"])
    .range([0, 200])
    .padding(0.1);
  const horizontalValueScale = scaleLinear().domain([0, 30]).range([0, 300]);

  /**
   * The two orientations are the same component with the roles of the two axes swapped, so
   * the contracts below are stated once and read through this table: which rect attribute
   * carries the group offset, which carries the in-group band's thickness, and which is
   * driven by the consumer's value accessor.
   */
  const orientations = [
    {
      name: "vertical",
      groupScale: verticalGroupScale,
      component: (groupSize: number) =>
        groupedBarsVertical<TestDatum>()
          .transition(false)
          .groupScale((d) => verticalGroupScale(d.group) ?? 0)
          .groupSize(groupSize)
          .groupWidth(verticalGroupScale.bandwidth())
          .y((d) => verticalValueScale(d.value))
          .height((d) => 200 - verticalValueScale(d.value))
          .fill("steelblue"),
      alongAttr: "x",
      slotAttr: "width",
      valueAttr: "height",
      sizeOf: (d: TestDatum) => 200 - verticalValueScale(d.value),
    },
    {
      name: "horizontal",
      groupScale: horizontalGroupScale,
      component: (groupSize: number) =>
        groupedBarsHorizontal<TestDatum>()
          .transition(false)
          .groupScale((d) => horizontalGroupScale(d.group) ?? 0)
          .groupSize(groupSize)
          .groupHeight(horizontalGroupScale.bandwidth())
          .x(() => 0)
          .width((d) => horizontalValueScale(d.value))
          .fill("steelblue"),
      alongAttr: "y",
      slotAttr: "height",
      valueAttr: "width",
      sizeOf: (d: TestDatum) => horizontalValueScale(d.value),
    },
  ];

  const rects = () => svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").nodes();

  describe.each(orientations)("$name grouped bars", (o) => {
    test("should render a group, a unit per bar and a rect per bar when every value is defined", () => {
      svg.selectGroup("bars").datum(testData).call(o.component(2));

      expect(svg.selectAll("g.sszvis-bargroup").size()).toBe(3);
      expect(svg.selectAll("g.sszvis-barunit").size()).toBe(6);
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(6);
    });

    test("should draw a two-line cross in place of the rect when a bar's value is not defined", () => {
      const dataWithMissing: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: Number.NaN },
          { category: "C", group: "G1", value: 15 },
        ],
      ];

      svg
        .selectGroup("bars")
        .datum(dataWithMissing)
        .call(o.component(3).defined((d: TestDatum) => !Number.isNaN(d.value)));

      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(2);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
      expect(svg.select("line.sszvis-bar--missing.line1").empty()).toBe(false);
      expect(svg.select("line.sszvis-bar--missing.line2").empty()).toBe(false);
    });

    test("should place every bar in its own in-group slot when a group is laid out", () => {
      svg.selectGroup("bars").datum(testData).call(o.component(2));

      const band = bandOf(2, o.groupScale.bandwidth());
      const bars = rects();
      expect(bars).toHaveLength(6);
      // Absolute slots, not "inside the group somewhere": a render that dropped the in-group
      // offset, or handed every bar the same one, would still land inside the group band.
      expect(bars.map((r) => Number(r.getAttribute(o.alongAttr)))).toEqual(
        testData.flatMap((group) =>
          group.map((d, i) => (o.groupScale(d.group) ?? 0) + (band(i) ?? 0)),
        ),
      );
      expect(bars.map((r) => Number(r.getAttribute(o.slotAttr)))).toEqual(
        bars.map(() => band.bandwidth()),
      );
    });

    test("should size every bar from the value accessor when it renders", () => {
      svg.selectGroup("bars").datum(testData).call(o.component(2));

      const bars = rects();
      expect(bars).toHaveLength(6);
      expect(bars.map((r) => Number(r.getAttribute(o.valueAttr)))).toEqual(
        testData.flat().map(o.sizeOf),
      );
    });

    test("should paint each bar with the colours its fill and stroke accessors return", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          o
            .component(2)
            .fill((d: TestDatum) => (d.category === "A" ? "red" : "blue"))
            .stroke((d: TestDatum) => (d.category === "A" ? "black" : "white")),
        );

      const bars = rects();
      expect(bars).toHaveLength(6);
      expect(bars.map((r) => [r.getAttribute("fill"), r.getAttribute("stroke")])).toEqual(
        testData.flat().map((d) => (d.category === "A" ? ["red", "black"] : ["blue", "white"])),
      );
    });

    test("should leave nothing behind when the data empties after a render", () => {
      const bars = svg.selectGroup("bars");
      const component = o.component(2);

      bars.datum(testData).call(component);
      expect(svg.selectAll("g.sszvis-bargroup").size()).toBe(3);

      bars.datum([]).call(component);
      expect(svg.selectAll("g.sszvis-bargroup").size()).toBe(0);
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(0);
    });

    test("should follow the data when groups are added and removed", () => {
      const bars = svg.selectGroup("bars");
      const component = o.component(2);

      bars.datum(testData.slice(0, 2)).call(component);
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(2);

      bars.datum(testData).call(component);
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(3);

      bars.datum(testData.slice(0, 1)).call(component);
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(1);
    });

    test("should narrow the bars when groupSpace is widened", () => {
      const slotOf = (groupSpace: number) => {
        svg.selectGroup("bars").datum(testData).call(o.component(2).groupSpace(groupSpace));
        return Number(rects()[0]?.getAttribute(o.slotAttr));
      };

      const tight = slotOf(0.05);
      const loose = slotOf(0.4);

      expect(tight).toBeGreaterThan(0);
      expect(loose).toBeGreaterThan(0);
      expect(loose).toBeLessThan(tight);
    });
  });

  describe("tooltip anchors", () => {
    const anchorTransforms = () =>
      svg
        .selectAll<SVGRectElement, unknown>("[data-tooltip-anchor]")
        .nodes()
        .map((a) => a.getAttribute("transform"));

    // Two bars in a group declared to hold three, so the mean of the two slot centres is
    // neither the group's centre nor either bar's own centre. An anchor placed at a single
    // bar, at the group offset, or at the origin cannot satisfy these.
    const twoOfThree: TestDatum[][] = [
      [
        { category: "A", group: "G1", value: 10 },
        { category: "B", group: "G1", value: 25 },
      ],
    ];
    const groupScale = scaleBand<string>().domain(["G1"]).range([0, 200]).padding(0.1);
    const meanSlotCentre = () => {
      const inGroup = bandOf(3, groupScale.bandwidth());
      const centreOf = (i: number) =>
        (groupScale("G1") ?? 0) + (inGroup(i) ?? 0) + inGroup.bandwidth() / 2;
      return (centreOf(0) + centreOf(1)) / 2;
    };

    test("should put a vertical group's anchor above its tallest bar, centred on the group's bars", () => {
      const valueScale = scaleLinear().domain([0, 30]).range([200, 0]);

      svg
        .selectGroup("bars")
        .datum(twoOfThree)
        .call(
          groupedBarsVertical<TestDatum>()
            .transition(false)
            .groupScale((d) => groupScale(d.group) ?? 0)
            .groupSize(3)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );

      // The taller bar has the smaller y, and its top edge is the one a tooltip points at.
      expect(anchorTransforms()).toEqual([`translate(${meanSlotCentre()},${valueScale(25)})`]);
    });

    test("should put a horizontal group's anchor at its furthest bar end, centred on the group's bars", () => {
      const valueScale = scaleLinear().domain([0, 30]).range([0, 300]);

      svg
        .selectGroup("bars")
        .datum(twoOfThree)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .transition(false)
            .groupScale((d) => groupScale(d.group) ?? 0)
            .groupSize(3)
            .groupHeight(groupScale.bandwidth())
            // x varies per bar, so the anchor's extreme coordinate has something to choose
            // between; with a constant x every bar would offer the same answer.
            .x((d) => valueScale(d.value))
            .width(() => 4)
            .fill("steelblue"),
        );

      expect(anchorTransforms()).toEqual([`translate(${valueScale(25)},${meanSlotCentre()})`]);
    });

    test("should keep one anchor per group and drop them all when the data empties", () => {
      const bars = svg.selectGroup("bars");
      const component = orientations[0].component(2);

      bars.datum(testData).call(component);
      expect(anchorTransforms()).toHaveLength(3);

      bars.datum([]).call(component);
      expect(anchorTransforms()).toHaveLength(0);
    });
  });

  describe("missing value rendering", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    /**
     * A single-group vertical component whose only value is missing. Transitions are off:
     * these tests never assert transition behaviour, and a render of a defined value would
     * otherwise schedule a 300ms tween that outlives the test.
     */
    const missingOnly = () =>
      groupedBarsVertical<TestDatum>()
        .transition(false)
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(1)
        .groupWidth(groupScale.bandwidth())
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue")
        .defined((d) => !Number.isNaN(d.value));

    const oneMissing: TestDatum[][] = [[{ category: "A", group: "G1", value: NaN }]];

    test("should leave a consumer-added line.line1 in place when a missing value re-renders", () => {
      const bars = svg.selectGroup("bars").datum(oneMissing);
      bars.call(missingOnly());

      const unit = svg.select<SVGGElement>("g.sszvis-barunit").node();
      expect(unit).not.toBeNull();
      const consumerLine = select(unit)
        .append("line")
        .classed("line1", true)
        .attr("data-consumer", "yes")
        .attr("x1", 99);

      bars.call(missingOnly());

      expect(svg.selectAll("line[data-consumer]").size()).toBe(1);
      expect(consumerLine.attr("x1")).toBe("99");
      expect(consumerLine.node()?.parentNode).toBe(unit);
      // The component still owns exactly one cross of its own.
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
    });

    test("should leave a consumer-added rect.sszvis-bar in place when a bar re-renders", () => {
      const withValue: TestDatum[][] = [[{ category: "A", group: "G1", value: 10 }]];
      const bars = svg.selectGroup("bars").datum(withValue);
      bars.call(missingOnly());

      const unit = svg.select<SVGGElement>("g.sszvis-barunit").node();
      expect(unit).not.toBeNull();
      const consumerRect = select(unit)
        .append("rect")
        .classed("sszvis-bar", true)
        .attr("data-consumer", "yes")
        .attr("x", 99);

      bars.call(missingOnly());

      expect(svg.selectAll("rect[data-consumer]").size()).toBe(1);
      expect(consumerRect.attr("x")).toBe("99");
      expect(consumerRect.node()?.parentNode).toBe(unit);
      // The component still owns exactly one rect of its own.
      expect(svg.selectAll("rect.sszvis-bar-rect").size()).toBe(1);
    });

    test("should leave a consumer-added rect.sszvis-bar in place when the bar's value goes missing", () => {
      const withValue: TestDatum[][] = [[{ category: "A", group: "G1", value: 10 }]];
      const bars = svg.selectGroup("bars").datum(withValue);
      bars.call(missingOnly());

      const unit = svg.select<SVGGElement>("g.sszvis-barunit").node();
      expect(unit).not.toBeNull();
      const consumerRect = select(unit)
        .append("rect")
        .classed("sszvis-bar", true)
        .attr("data-consumer", "yes")
        .attr("x", 99);

      // The unit loses its value, so the component clears its own rect. Its exit join is
      // scoped to the component-owned class, so the consumer's rect is left untouched.
      bars.datum(oneMissing).call(missingOnly());

      expect(svg.selectAll("rect[data-consumer]").size()).toBe(1);
      expect(consumerRect.attr("x")).toBe("99");
      expect(consumerRect.node()?.parentNode).toBe(unit);
      expect(svg.selectAll("rect.sszvis-bar-rect").size()).toBe(0);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
    });

    test("should restore the cross geometry when the lines are perturbed between renders", () => {
      const bars = svg.selectGroup("bars").datum(oneMissing);
      bars.call(missingOnly());

      // Simulate anything that perturbs the constant geometry between renders.
      svg.selectAll("line.sszvis-bar--missing").attr("x1", 0).attr("y1", 0);

      bars.call(missingOnly());

      const line1 = svg.select("line.sszvis-bar--missing.line1");
      expect([line1.attr("x1"), line1.attr("y1"), line1.attr("x2"), line1.attr("y2")]).toEqual([
        "-4",
        "-4",
        "4",
        "4",
      ]);
      const line2 = svg.select("line.sszvis-bar--missing.line2");
      expect([line2.attr("x1"), line2.attr("y1"), line2.attr("x2"), line2.attr("y2")]).toEqual([
        "4",
        "-4",
        "-4",
        "4",
      ]);
    });
  });

  describe("transition", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    /** A single-group vertical component; `defined` keeps NaN values out. */
    const verticalOf = () =>
      groupedBarsVertical<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(1)
        .groupWidth(groupScale.bandwidth())
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue")
        .defined((d) => !Number.isNaN(d.value));

    const oneBar = (value: number): TestDatum[][] => [[{ category: "A", group: "G1", value }]];

    test("should reuse the same rect element when the bar's value changes", () => {
      const component = verticalOf();
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(component);
      const first = svg.select<SVGRectElement>("rect.sszvis-bar").node();
      chartLayer.datum(oneBar(25)).call(component);
      const second = svg.select<SVGRectElement>("rect.sszvis-bar").node();
      // Asserted non-null first: `toBe` alone is satisfied by a component that draws no bar
      // at all, since both lookups then return null.
      expect(first).not.toBeNull();
      expect(second).toBe(first);
      svg.selectAll("*").interrupt();
    });

    test("should write the destination geometry synchronously when the transition is disabled", () => {
      const component = verticalOf().transition(false);
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(component);
      chartLayer.datum(oneBar(30)).call(component);
      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("y")).toBe(String(valueScale(30)));
      expect(bar.attr("height")).toBe(String(200 - valueScale(30)));
    });

    test("should still hold its previous geometry on the tick when an updating bar is re-rendered", () => {
      const component = verticalOf();
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(component);
      // Entering bars are placed on the join, so the first render is correct synchronously.
      expect(svg.select("rect.sszvis-bar").attr("y")).toBe(String(valueScale(10)));

      chartLayer.datum(oneBar(30)).call(component);
      // The update tweens, so on this tick the bar still holds its previous geometry. The
      // rect is re-selected, so a torn-down and re-appended bar cannot pass this.
      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("y")).toBe(String(valueScale(10)));
      expect(bar.attr("height")).toBe(String(200 - valueScale(10)));
      svg.selectAll("*").interrupt();
    });

    test("should not let an in-flight tween overwrite the geometry when a synchronous render follows it", async () => {
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(verticalOf());
      // Schedules a tween from 10 towards 30.
      chartLayer.datum(oneBar(30)).call(verticalOf());
      // Let the tween start and run partway, so it holds an interpolated geometry.
      await new Promise((resolve) => setTimeout(resolve, 60));

      chartLayer.datum(oneBar(0)).call(verticalOf().transition(false));
      // The stale tween must have been interrupted: it may not tick again and reinstate its
      // own interpolation over the geometry the synchronous render just wrote.
      await new Promise((resolve) => setTimeout(resolve, 60));

      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("y")).toBe(String(valueScale(0)));
      expect(bar.attr("height")).toBe(String(200 - valueScale(0)));
    });

    test("should leave a consumer's own transition running when it renders over the same bars", async () => {
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(verticalOf().transition(false));

      // A consumer fades the bars in with its own, unnamed transition - the name a bare
      // selection.transition() uses, which the component's interrupt used to reach as well.
      svg
        .selectAll("rect.sszvis-bar")
        .attr("opacity", 0)
        .transition()
        .duration(300)
        .attr("opacity", 1);
      await untilMoved(svg.select<SVGRectElement>("rect.sszvis-bar").node() as Element, "opacity");

      chartLayer.datum(oneBar(0)).call(verticalOf().transition(false));
      await new Promise((resolve) => setTimeout(resolve, 400));

      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("opacity")).toBe("1");
      // The component's own geometry still landed synchronously.
      expect(bar.attr("y")).toBe(String(valueScale(0)));
    });

    test("should swap between a rect and the missing-value cross when `defined` changes", () => {
      const component = verticalOf().transition(false);
      const chartLayer = svg.selectGroup("bars");

      chartLayer.datum(oneBar(10)).call(component);
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(1);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(0);

      chartLayer.datum(oneBar(Number.NaN)).call(component);
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(0);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);

      chartLayer.datum(oneBar(20)).call(component);
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(1);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(0);
      // The unit's translation, set while the value was missing, is cleared again.
      expect(svg.select("g.sszvis-barunit").attr("transform")).toBe("translate(0,0)");
    });
  });

  describe("shared datum objects", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    const GROUP_SIZE = 3;

    const componentOf = () =>
      groupedBarsVertical<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(GROUP_SIZE)
        .groupWidth(groupScale.bandwidth())
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue");

    /** The in-group band the component builds internally, to assert absolute slots against. */
    const inGroupScale = () =>
      scaleBand<number>()
        .domain([0, 1, 2])
        .padding(0.05)
        .paddingOuter(0)
        .rangeRound([0, groupScale.bandwidth()]);

    const xs = () =>
      [...svg.selectAll<SVGRectElement, unknown>("rect.sszvis-bar").nodes()].map((r) =>
        Number(r.getAttribute("x")),
      );

    test("should offset each bar by its own in-group index when one datum object is reused across groups", () => {
      // The same object at index 2 of the first group and index 0 of the second. Asserted
      // against absolute slots rather than by comparing the bars to each other, so that an
      // off-by-one or a reversed in-group order cannot satisfy the test - with groupSize 3
      // neither permutation maps {2, 0} back onto itself.
      const shared = { category: "S", group: "G1", value: 10 };
      const data: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 20 },
          { category: "B", group: "G1", value: 12 },
          shared,
        ],
        [shared, { category: "C", group: "G2", value: 15 }],
      ];

      svg.selectGroup("bars").datum(data).call(componentOf());
      const band = inGroupScale();
      const g1 = groupScale("G1") ?? 0;
      const g2 = groupScale("G2") ?? 0;
      const [a, b, sharedInFirst, sharedInSecond, c] = xs();

      expect(a).toBeCloseTo(g1 + (band(0) ?? 0), 5);
      expect(b).toBeCloseTo(g1 + (band(1) ?? 0), 5);
      // The shared object's bar in the first group is at index 2 ...
      expect(sharedInFirst).toBeCloseTo(g1 + (band(2) ?? 0), 5);
      // ... and its bar in the second group at index 0. groupScale reads the datum, so both
      // resolve to G1's offset; the in-group index is the only thing distinguishing them,
      // and recording it on the datum gave the object a single value for both bars.
      expect(sharedInSecond).toBeCloseTo(g1 + (band(0) ?? 0), 5);
      expect(c).toBeCloseTo(g2 + (band(1) ?? 0), 5);
    });

    test("should leave the caller's datum objects untouched when it renders", () => {
      const shared = { category: "S", group: "G1", value: 10 };
      const data: TestDatum[][] = [
        [{ category: "A", group: "G1", value: 20 }, shared],
        [shared, { category: "B", group: "G2", value: 15 }],
      ];
      const before = data.flat().map((d) => Object.keys(d).sort());

      svg.selectGroup("bars").datum(data).call(componentOf());

      // The bars have to have been drawn for the absence of bookkeeping to mean anything.
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(4);
      // Asserted on the key set rather than on a named property, so this still catches any
      // future bookkeeping the component decides to hang off the caller's data.
      expect(data.flat().map((d) => Object.keys(d).sort())).toEqual(before);
      expect(Object.keys(shared).sort()).toEqual(["category", "group", "value"]);
    });
  });

  describe("non-finite geometry", () => {
    let groupScale: d3.ScaleBand<string>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1"]).range([0, 200]).padding(0.1);
    });

    const oneBar: TestDatum[][] = [[{ category: "A", group: "G1", value: 10 }]];

    /**
     * The centre of the single bar's slot, which is where the component translates the
     * missing-value cross to: the group offset plus the in-group band's centre.
     */
    const slotCentre = () => {
      const band = scaleBand<number>()
        .domain([0])
        .padding(0.05)
        .paddingOuter(0)
        .rangeRound([0, groupScale.bandwidth()]);
      return (groupScale("G1") ?? 0) + (band(0) ?? 0) + band.bandwidth() / 2;
    };

    test("should park a vertical bar at 0 when its geometry accessors return NaN", () => {
      svg
        .selectGroup("bars")
        .datum(oneBar)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(1)
            .groupWidth(groupScale.bandwidth())
            .y(() => Number.NaN)
            .height(() => Number.NaN)
            .fill("steelblue"),
        );

      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("y")).toBe("0");
      expect(bar.attr("height")).toBe("0");
    });

    test("should park a horizontal bar at 0 when its geometry accessors return NaN", () => {
      svg
        .selectGroup("bars")
        .datum(oneBar)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(1)
            .groupHeight(groupScale.bandwidth())
            .x(() => Number.NaN)
            .width(() => Number.NaN)
            .fill("steelblue"),
        );

      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("x")).toBe("0");
      expect(bar.attr("width")).toBe("0");
    });

    test("should keep a vertical cross's transform finite when the value accessor returns NaN", () => {
      // The cross is positioned by a translation on the bar unit, and translateString
      // interpolates its arguments into a string, so an unguarded NaN would survive as text.
      svg
        .selectGroup("bars")
        .datum(oneBar)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(1)
            .groupWidth(groupScale.bandwidth())
            .y(() => Number.NaN)
            .height(() => Number.NaN)
            .fill("steelblue")
            .defined(() => false),
        );

      const unit = svg.select<SVGGElement>("g.sszvis-barunit");
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
      // Both coordinates are pinned, not merely screened for the substring NaN: the
      // along-group one keeps its real value, and only the guarded accessor falls back to 0.
      expect(unit.attr("transform")).toBe(`translate(${slotCentre()},0)`);
    });

    test("should keep a cross's along-group coordinate finite when groupScale returns NaN", () => {
      // groupScale is a consumer prop, so it is the along-group coordinate's reachable path
      // to a non-finite value - the rest of that expression is computed internally.
      svg
        .selectGroup("bars")
        .datum(oneBar)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale(() => Number.NaN)
            .groupSize(1)
            .groupWidth(groupScale.bandwidth())
            .y(() => 10)
            .height(() => 10)
            .fill("steelblue")
            .defined(() => false),
        );

      const unit = svg.select<SVGGElement>("g.sszvis-barunit");
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
      expect(unit.attr("transform")).toBe("translate(0,10)");
    });

    test("should keep a horizontal cross's transform finite when the position accessor returns NaN", () => {
      // The horizontal config is the one where a consumer accessor - x - feeds the guarded
      // cross-axis coordinate, so it is the orientation most likely to go non-finite.
      svg
        .selectGroup("bars")
        .datum(oneBar)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(1)
            .groupHeight(groupScale.bandwidth())
            .x(() => Number.NaN)
            .width(() => Number.NaN)
            .fill("steelblue")
            .defined(() => false),
        );

      const unit = svg.select<SVGGElement>("g.sszvis-barunit");
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
      expect(unit.attr("transform")).toBe(`translate(0,${slotCentre()})`);
    });
  });

  describe("accessor indices", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    test("should give a vertical group's geometry and colour accessors the bar's in-group index", () => {
      const seen: Record<"height" | "fill", [string, number][]> = { height: [], fill: [] };
      svg
        .selectGroup("bars")
        .datum([
          [
            { category: "A", group: "G1", value: 10 },
            { category: "B", group: "G1", value: 20 },
          ],
        ] satisfies TestDatum[][])
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d, i) => {
              seen.height.push([d.category, i]);
              return 200 - valueScale(d.value);
            })
            .fill((d, i) => {
              seen.fill.push([d.category, i]);
              return "steelblue";
            })
            .transition(false),
        );

      // The horizontal orientation's own accessors are covered, call site by call site, by
      // the missing-value test below, which renders horizontally.
      expect(seen.fill).toEqual([
        ["A", 0],
        ["B", 1],
      ]);
      // `height` is reached from more than one call site per render, so only the pairs it is
      // called with are pinned here, not how often.
      expect(new Set(seen.height.map(([category, index]) => `${category}:${index}`))).toEqual(
        new Set(["A:0", "B:1"]),
      );
    });

    test("should give every accessor the same in-group index when a group has a missing value", () => {
      const seen: Record<string, [string, unknown][]> = {
        x: [],
        y: [],
        width: [],
        height: [],
        fill: [],
        stroke: [],
      };
      const recordInto = (key: string, value: number) => (d: TestDatum, i: number) => {
        seen[key].push([d.category, i]);
        return value;
      };

      // The middle bar of the group is missing, so its index within the group differs from
      // its position in the filtered selection of bars that do have a value.
      const mixedData: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: Number.NaN },
          { category: "C", group: "G1", value: 20 },
        ],
      ];

      svg
        .selectGroup("bars")
        .datum(mixedData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(3)
            .groupHeight(groupScale.bandwidth())
            .x(recordInto("x", 0))
            .y(recordInto("y", 0))
            .width(recordInto("width", 10))
            .height(recordInto("height", 10))
            .fill((d, i) => {
              seen.fill.push([d.category, i]);
              return "steelblue";
            })
            .stroke((d, i) => {
              seen.stroke.push([d.category, i]);
              return "red";
            })
            .defined((d) => !Number.isNaN(d.value))
            .transition(false),
        );

      // Every consumer accessor must be called with the bar's index within its group, for
      // the missing bar "B" (group index 1) as much as for the two bars that have a value.
      // The exact sequences are pinned rather than a set of distinct indices, so a call site
      // that passes the index within the filtered missing-value selection cannot hide behind
      // a correct call elsewhere in the same render.
      //
      // `x` is reached from four call sites, in this order: the missing-value cross's
      // transform ("B"), the entering rects' geometry, the same geometry re-applied to the
      // plain selection because `transition` is off, and finally the tooltip anchor, which
      // walks the whole group and so sees all three bars.
      expect(seen.x).toEqual([
        ["B", 1],
        ["A", 0],
        ["C", 2],
        ["A", 0],
        ["C", 2],
        ["A", 0],
        ["B", 1],
        ["C", 2],
      ]);
      // `width`, `fill` and `stroke` are only applied to bars that have a value.
      expect(seen.width).toEqual([
        ["A", 0],
        ["C", 2],
        ["A", 0],
        ["C", 2],
      ]);
      expect(seen.fill).toEqual([
        ["A", 0],
        ["C", 2],
      ]);
      expect(seen.stroke).toEqual([
        ["A", 0],
        ["C", 2],
      ]);
      // The horizontal `y` and `height` are supplied by the component itself, so consumer
      // accessors for them are never called; only the four above reach the consumer.
      expect(seen.y).toEqual([]);
      expect(seen.height).toEqual([]);
    });
  });
});
