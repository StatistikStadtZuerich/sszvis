import { scaleBand, scaleLinear, select } from "d3";
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

  describe("groupedBarsVertical", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2", "G3"]).range([0, 300]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    test("should have all expected props", () => {
      const component = groupedBarsVertical<TestDatum>();
      expect(typeof component.groupScale).toBe("function");
      expect(typeof component.groupSize).toBe("function");
      expect(typeof component.groupWidth).toBe("function");
      expect(typeof component.groupHeight).toBe("function");
      expect(typeof component.groupSpace).toBe("function");
      expect(typeof component.x).toBe("function");
      expect(typeof component.y).toBe("function");
      expect(typeof component.width).toBe("function");
      expect(typeof component.height).toBe("function");
      expect(typeof component.fill).toBe("function");
      expect(typeof component.stroke).toBe("function");
      expect(typeof component.defined).toBe("function");
    });

    test("props should be chainable", () => {
      const component = groupedBarsVertical<TestDatum>();

      const result = component
        .groupScale(groupScale)
        .groupSize(2)
        .groupWidth(50)
        .x((d) => d.value)
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue");

      expect(result).toBe(component);
    });

    test("should render .sszvis-bargroup elements for each group", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(3); // 3 groups
    });

    test("should render .sszvis-barunit elements for each bar", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll(".sszvis-barunit").size()).toBe(6); // 3 groups × 2 bars
    });

    test("should render .sszvis-bar rect elements for defined values", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(6); // All values are defined
    });

    test("should render .sszvis-bar--missing lines for undefined values", () => {
      const dataWithMissing: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: NaN }, // Missing value
        ],
        [
          { category: "A", group: "G2", value: 15 },
          { category: "B", group: "G2", value: 25 },
        ],
      ];
      svg
        .selectGroup("bars")
        .datum(dataWithMissing)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d) => !Number.isNaN(d.value)),
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(3); // 3 defined values
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // 2 lines for the missing value (X shape)
    });

    test("bars should be positioned using x = groupScale + inGroupScale offset", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const x = Number(select(this).attr("x"));
        const groupOffset = groupScale(datum.group) || 0;
        expect(x).toBeGreaterThanOrEqual(groupOffset);
        expect(x).toBeLessThan(groupOffset + groupScale.bandwidth());
      });
    });

    test("bar height should come from props.height", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const height = Number(select(this).attr("height"));
        const expectedHeight = 200 - valueScale(datum.value);
        expect(height).toBeCloseTo(expectedHeight, 1);
      });
    });

    test("should apply fill color correctly", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill((d) => (d.category === "A" ? "red" : "blue")),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const fill = select(this).attr("fill");
        const expectedFill = datum.category === "A" ? "red" : "blue";
        expect(fill).toBe(expectedFill);
      });
    });

    test("should handle empty data", () => {
      const component = groupedBarsVertical<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupWidth(groupScale.bandwidth())
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue");
      expect(() => {
        svg.selectGroup("bars").datum([]).call(component);
      }).not.toThrow();
      const barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(0);
    });

    test("should handle data updates correctly", () => {
      const component = groupedBarsVertical<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupWidth(groupScale.bandwidth())
        .y((d) => valueScale(d.value))
        .height((d) => 200 - valueScale(d.value))
        .fill("steelblue");
      const chartLayer = svg.selectGroup("bars");
      // Initial render with 2 groups
      chartLayer.datum(testData.slice(0, 2)).call(component);
      let barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(2);
      // Update with all 3 groups
      chartLayer.datum(testData).call(component);
      barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(3);
      // Update with 1 group
      chartLayer.datum(testData.slice(0, 1)).call(component);
      barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(1);
    });

    test("should support custom groupSpace", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .groupSpace(0.2) // Larger space between bars
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue"),
        );
      const bars = svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar");
      expect(bars.size()).toBeGreaterThan(0);
      // With larger groupSpace, bars should be narrower
      const firstBar = bars.node();
      if (firstBar) {
        const width = Number(select(firstBar).attr("width"));
        expect(width).toBeGreaterThan(0);
      }
    });
  });

  describe("groupedBarsHorizontal", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2", "G3"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([0, 300]);
    });

    test("should have all expected props", () => {
      const component = groupedBarsHorizontal<TestDatum>();
      expect(typeof component.groupScale).toBe("function");
      expect(typeof component.groupSize).toBe("function");
      expect(typeof component.groupWidth).toBe("function");
      expect(typeof component.groupHeight).toBe("function");
      expect(typeof component.groupSpace).toBe("function");
      expect(typeof component.x).toBe("function");
      expect(typeof component.y).toBe("function");
      expect(typeof component.width).toBe("function");
      expect(typeof component.height).toBe("function");
      expect(typeof component.fill).toBe("function");
      expect(typeof component.stroke).toBe("function");
      expect(typeof component.defined).toBe("function");
    });

    test("props should be chainable", () => {
      const component = groupedBarsHorizontal<TestDatum>();
      const result = component
        .groupScale(groupScale)
        .groupSize(2)
        .groupHeight(50)
        .x(() => 0)
        .y((d) => d.value)
        .width((d) => valueScale(d.value))
        .fill("steelblue");
      expect(result).toBe(component);
    });

    test("should render .sszvis-bargroup elements for each group", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(3);
    });

    test("should render .sszvis-barunit elements for each bar", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll(".sszvis-barunit").size()).toBe(6);
    });

    test("should render .sszvis-bar rect elements for defined values", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(6);
    });

    test("should render .sszvis-bar--missing lines for undefined values", () => {
      const dataWithMissing: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: NaN },
        ],
        [
          { category: "A", group: "G2", value: 15 },
          { category: "B", group: "G2", value: 25 },
        ],
      ];
      svg
        .selectGroup("bars")
        .datum(dataWithMissing)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue")
            .defined((d) => !Number.isNaN(d.value)),
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(3);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
    });

    test("bars should be positioned using y = groupScale + inGroupScale offset", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const y = Number(select(this).attr("y"));
        const groupOffset = groupScale(datum.group) || 0;
        expect(y).toBeGreaterThanOrEqual(groupOffset);
        expect(y).toBeLessThan(groupOffset + groupScale.bandwidth());
      });
    });

    test("bar width should come from props.width", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const width = Number(select(this).attr("width"));
        const expectedWidth = valueScale(datum.value);
        expect(width).toBeCloseTo(expectedWidth, 1);
      });
    });

    test("should apply fill color correctly", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill((d) => (d.category === "A" ? "green" : "orange")),
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const fill = select(this).attr("fill");
        const expectedFill = datum.category === "A" ? "green" : "orange";
        expect(fill).toBe(expectedFill);
      });
    });

    test("should handle empty data", () => {
      const component = groupedBarsHorizontal<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupHeight(groupScale.bandwidth())
        .x(() => 0)
        .width((d) => valueScale(d.value))
        .fill("steelblue");
      expect(() => {
        svg.selectGroup("bars").datum([]).call(component);
      }).not.toThrow();
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(0);
    });

    test("should handle data updates correctly", () => {
      const component = groupedBarsHorizontal<TestDatum>()
        .groupScale((d) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupHeight(groupScale.bandwidth())
        .x(() => 0)
        .width((d) => valueScale(d.value))
        .fill("steelblue");
      const chartLayer = svg.selectGroup("bars");
      // Initial render
      chartLayer.datum(testData.slice(0, 2)).call(component);
      let barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(2);
      // Update
      chartLayer.datum(testData).call(component);
      barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(3);
    });

    test("should support custom groupSpace", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .groupSpace(0.15)
            .x(() => 0)
            .width((d) => valueScale(d.value))
            .fill("steelblue"),
        );
      const bars = svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar");
      expect(bars.size()).toBeGreaterThan(0);
      const firstBar = bars.node();
      if (firstBar) {
        const height = Number(select(firstBar).attr("height"));
        expect(height).toBeGreaterThan(0);
      }
    });
  });

  describe("missing value rendering", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    test("missing values should render as X shape (two lines)", () => {
      const dataWithMissing: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: NaN },
        ],
      ];
      svg
        .selectGroup("bars")
        .datum(dataWithMissing)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d) => !Number.isNaN(d.value)),
        );
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // Two lines form the X
      expect(svg.select("line.sszvis-bar--missing.line1").empty()).toBe(false);
      expect(svg.select("line.sszvis-bar--missing.line2").empty()).toBe(false);
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

    test("a consumer-added line.line1 survives a render of a missing value", () => {
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

    test("a consumer-added rect.sszvis-bar survives a render of a value", () => {
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

    test("a consumer-added rect.sszvis-bar survives a value going missing", () => {
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

    test("the cross geometry is reapplied on a second render", () => {
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

    test("defined function should filter bars correctly", () => {
      const mixedData: TestDatum[][] = [
        [
          { category: "A", group: "G1", value: 10 },
          { category: "B", group: "G1", value: NaN },
          { category: "C", group: "G1", value: 15 },
        ],
      ];

      svg
        .selectGroup("bars")
        .datum(mixedData)
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(3)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d) => !Number.isNaN(d.value)),
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(2); // 2 defined values
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // 1 missing value = 2 lines
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

    test("should keep the same rect element across renders", () => {
      const component = verticalOf();
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(component);
      const first = svg.select<SVGRectElement>("rect.sszvis-bar").node();
      chartLayer.datum(oneBar(25)).call(component);
      const second = svg.select<SVGRectElement>("rect.sszvis-bar").node();
      expect(second).toBe(first);
      svg.selectAll("*").interrupt();
    });

    test("should update the geometry synchronously when disabled", () => {
      const component = verticalOf().transition(false);
      const chartLayer = svg.selectGroup("bars");
      chartLayer.datum(oneBar(10)).call(component);
      chartLayer.datum(oneBar(30)).call(component);
      const bar = svg.select<SVGRectElement>("rect.sszvis-bar");
      expect(bar.attr("y")).toBe(String(valueScale(30)));
      expect(bar.attr("height")).toBe(String(200 - valueScale(30)));
    });

    test("should start an updating bar from its previous geometry", () => {
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

    test("should not let an in-flight tween overwrite a later synchronous render", async () => {
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

    test("should not interrupt a transition the consumer scheduled on the same bars", async () => {
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

    test("should swap between a rect and the missing-value lines as `defined` changes", () => {
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

    test("should offset a datum object reused across groups by each bar's own index", () => {
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

    test("should not mutate the caller's datum objects", () => {
      const shared = { category: "S", group: "G1", value: 10 };
      const data: TestDatum[][] = [
        [{ category: "A", group: "G1", value: 20 }, shared],
        [shared, { category: "B", group: "G2", value: 15 }],
      ];
      const before = data.flat().map((d) => Object.keys(d).sort());

      svg.selectGroup("bars").datum(data).call(componentOf());

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

    test("should keep the vertical geometry finite when the accessors return NaN", () => {
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

    test("should keep the horizontal geometry finite when the accessors return NaN", () => {
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

    test("should keep the vertical missing-value cross's transform finite", () => {
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

    test("should keep the cross's along-group coordinate finite when groupScale returns NaN", () => {
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

    test("should keep the horizontal missing-value cross's transform finite", () => {
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

    test("should give the vertical `height` accessor the bar's index within its group", () => {
      const indices: unknown[] = [];
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
              indices.push(i);
              return 200 - valueScale(d.value);
            })
            .fill("steelblue")
            .transition(false),
        );

      expect(indices.length).toBeGreaterThan(0);
      expect(indices.every((i) => typeof i === "number")).toBe(true);
      expect(new Set(indices)).toEqual(new Set([0, 1]));
    });

    test("should give the horizontal `width` accessor the bar's index within its group", () => {
      const indices: unknown[] = [];
      svg
        .selectGroup("bars")
        .datum([
          [
            { category: "A", group: "G1", value: 10 },
            { category: "B", group: "G1", value: 20 },
          ],
        ] satisfies TestDatum[][])
        .call(
          groupedBarsHorizontal<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d, i) => {
              indices.push(i);
              return d.value;
            })
            .fill("steelblue")
            .transition(false),
        );

      expect(indices.length).toBeGreaterThan(0);
      expect(indices.every((i) => typeof i === "number")).toBe(true);
      expect(new Set(indices)).toEqual(new Set([0, 1]));
    });

    test("should give the `fill` accessor the bar's index within its group", () => {
      const seen: [string, number][] = [];
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
            .height((d) => 200 - valueScale(d.value))
            .fill((d, i) => {
              seen.push([d.category, i]);
              return "steelblue";
            })
            .transition(false),
        );

      expect(seen).toEqual([
        ["A", 0],
        ["B", 1],
      ]);
    });

    test("should give every accessor the same index when a group has missing values", () => {
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

  describe("stroke property", () => {
    let groupScale: d3.ScaleBand<string>;
    let valueScale: d3.ScaleLinear<number, number>;

    beforeEach(() => {
      groupScale = scaleBand<string>().domain(["G1", "G2"]).range([0, 200]).padding(0.1);
      valueScale = scaleLinear().domain([0, 30]).range([200, 0]);
    });

    test("should apply stroke when provided", () => {
      svg
        .selectGroup("bars")
        .datum(testData.slice(0, 1))
        .call(
          groupedBarsVertical<TestDatum>()
            .groupScale((d) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d) => valueScale(d.value))
            .height((d) => 200 - valueScale(d.value))
            .fill("steelblue")
            .stroke("red"),
        );
      const bars = svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar");
      expect(bars.size()).toBeGreaterThan(0);
      bars.each(function () {
        expect(select(this).attr("stroke")).toBe("red");
      });
    });
  });
});
