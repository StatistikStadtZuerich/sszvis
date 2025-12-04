import { scaleBand, scaleLinear, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { groupedBarsHorizontal, groupedBarsVertical } from "../../src/component/groupedBars.js";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  category: string;
  group: string;
  value: number;
};

describe("component/groupedBars", () => {
  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;

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
      const component = groupedBarsVertical();
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
      const component = groupedBarsVertical();

      const result = component
        .groupScale(groupScale)
        .groupSize(2)
        .groupWidth(50)
        .x((d: TestDatum) => d.value)
        .y((d: TestDatum) => valueScale(d.value))
        .height((d: TestDatum) => 200 - valueScale(d.value))
        .fill("steelblue");

      expect(result).toBe(component);
    });

    test("should render .sszvis-bargroup elements for each group", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
        );
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(3); // 3 groups
    });

    test("should render .sszvis-barunit elements for each bar", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
        );
      expect(svg.selectAll(".sszvis-barunit").size()).toBe(6); // 3 groups × 2 bars
    });

    test("should render .sszvis-bar rect elements for defined values", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d: TestDatum) => !Number.isNaN(d.value))
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(3); // 3 defined values
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // 2 lines for the missing value (X shape)
    });

    test("bars should be positioned using x = groupScale + inGroupScale offset", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill((d: TestDatum) => (d.category === "A" ? "red" : "blue"))
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const fill = select(this).attr("fill");
        const expectedFill = datum.category === "A" ? "red" : "blue";
        expect(fill).toBe(expectedFill);
      });
    });

    test("should handle empty data", () => {
      const component = groupedBarsVertical()
        .groupScale((d: TestDatum) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupWidth(groupScale.bandwidth())
        .y((d: TestDatum) => valueScale(d.value))
        .height((d: TestDatum) => 200 - valueScale(d.value))
        .fill("steelblue");
      expect(() => {
        svg.selectGroup("bars").datum([]).call(component);
      }).not.toThrow();
      const barGroups = svg.selectAll(".sszvis-bargroup");
      expect(barGroups.size()).toBe(0);
    });

    test("should handle data updates correctly", () => {
      const component = groupedBarsVertical()
        .groupScale((d: TestDatum) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupWidth(groupScale.bandwidth())
        .y((d: TestDatum) => valueScale(d.value))
        .height((d: TestDatum) => 200 - valueScale(d.value))
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .groupSpace(0.2) // Larger space between bars
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
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
      const component = groupedBarsHorizontal();
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
      const component = groupedBarsHorizontal();
      const result = component
        .groupScale(groupScale)
        .groupSize(2)
        .groupHeight(50)
        .x(() => 0)
        .y((d: TestDatum) => d.value)
        .width((d: TestDatum) => valueScale(d.value))
        .fill("steelblue");
      expect(result).toBe(component);
    });

    test("should render .sszvis-bargroup elements for each group", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
        );
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(3);
    });

    test("should render .sszvis-barunit elements for each bar", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
        );
      expect(svg.selectAll(".sszvis-barunit").size()).toBe(6);
    });

    test("should render .sszvis-bar rect elements for defined values", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
            .defined((d: TestDatum) => !Number.isNaN(d.value))
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(3);
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2);
    });

    test("bars should be positioned using y = groupScale + inGroupScale offset", () => {
      svg
        .selectGroup("bars")
        .datum(testData)
        .call(
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill((d: TestDatum) => (d.category === "A" ? "green" : "orange"))
        );
      svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar").each(function (datum) {
        const fill = select(this).attr("fill");
        const expectedFill = datum.category === "A" ? "green" : "orange";
        expect(fill).toBe(expectedFill);
      });
    });

    test("should handle empty data", () => {
      const component = groupedBarsHorizontal()
        .groupScale((d: TestDatum) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupHeight(groupScale.bandwidth())
        .x(() => 0)
        .width((d: TestDatum) => valueScale(d.value))
        .fill("steelblue");
      expect(() => {
        svg.selectGroup("bars").datum([]).call(component);
      }).not.toThrow();
      expect(svg.selectAll(".sszvis-bargroup").size()).toBe(0);
    });

    test("should handle data updates correctly", () => {
      const component = groupedBarsHorizontal()
        .groupScale((d: TestDatum) => groupScale(d.group) || 0)
        .groupSize(2)
        .groupHeight(groupScale.bandwidth())
        .x(() => 0)
        .width((d: TestDatum) => valueScale(d.value))
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
          groupedBarsHorizontal()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupHeight(groupScale.bandwidth())
            .groupSpace(0.15)
            .x(() => 0)
            .width((d: TestDatum) => valueScale(d.value))
            .fill("steelblue")
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d: TestDatum) => !Number.isNaN(d.value))
        );
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // Two lines form the X
      expect(svg.select("line.sszvis-bar--missing.line1").empty()).toBe(false);
      expect(svg.select("line.sszvis-bar--missing.line2").empty()).toBe(false);
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(3)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
            .defined((d: TestDatum) => !Number.isNaN(d.value))
        );
      expect(svg.selectAll("rect.sszvis-bar").size()).toBe(2); // 2 defined values
      expect(svg.selectAll("line.sszvis-bar--missing").size()).toBe(2); // 1 missing value = 2 lines
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
          groupedBarsVertical()
            .groupScale((d: TestDatum) => groupScale(d.group) || 0)
            .groupSize(2)
            .groupWidth(groupScale.bandwidth())
            .y((d: TestDatum) => valueScale(d.value))
            .height((d: TestDatum) => 200 - valueScale(d.value))
            .fill("steelblue")
            .stroke("red")
        );
      const bars = svg.selectAll<SVGRectElement, TestDatum>("rect.sszvis-bar");
      expect(bars.size()).toBeGreaterThan(0);
      bars.each(function () {
        expect(select(this).attr("stroke")).toBe("red");
      });
    });
  });
});
