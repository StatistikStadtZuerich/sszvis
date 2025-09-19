import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rangeFlag from "../../src/annotation/rangeFlag";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  x: number;
  y0: number;
  y1: number;
};

type ComplexTestDatum = {
  position: { x: number };
  range: { lower: number; upper: number };
  id: string;
};

describe("annotation/rangeFlag", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const testData: TestDatum[] = [
    { x: 100, y0: 50, y1: 80 },
    { x: 200, y0: 60, y1: 90 },
  ];

  test("should render rangeFlag with proper DOM structure", () => {
    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum(testData)
      .call(flagComponent);

    // Check that flag marks are rendered
    const bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    const topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();

    expect(bottomMarks.length).toBe(2);
    expect(topMarks.length).toBe(2);

    // Check that each mark has the correct classes and properties
    bottomMarks.forEach((mark) => {
      const circle = select(mark);
      expect(circle.classed("sszvis-rangeFlag__mark")).toBe(true);
      expect(circle.classed("bottom")).toBe(true);
      expect(Number(circle.attr("r"))).toBe(3.5);
    });

    topMarks.forEach((mark) => {
      const circle = select(mark);
      expect(circle.classed("sszvis-rangeFlag__mark")).toBe(true);
      expect(circle.classed("top")).toBe(true);
      expect(Number(circle.attr("r"))).toBe(3.5);
    });
  });

  test("should position flag marks correctly", () => {
    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum(testData)
      .call(flagComponent);

    const bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    const topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();

    // Check first flag positions
    const firstBottom = select(bottomMarks[0]);
    const firstTop = select(topMarks[0]);

    expect(Number(firstBottom.attr("cx"))).toBe(100.5); // halfPixel adjustment
    expect(Number(firstBottom.attr("cy"))).toBe(50.5);
    expect(Number(firstTop.attr("cx"))).toBe(100.5);
    expect(Number(firstTop.attr("cy"))).toBe(80.5);

    // Check second flag positions
    const secondBottom = select(bottomMarks[1]);
    const secondTop = select(topMarks[1]);

    expect(Number(secondBottom.attr("cx"))).toBe(200.5);
    expect(Number(secondBottom.attr("cy"))).toBe(60.5);
    expect(Number(secondTop.attr("cx"))).toBe(200.5);
    expect(Number(secondTop.attr("cy"))).toBe(90.5);
  });

  test("should create tooltip anchor between flag marks", () => {
    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum(testData)
      .call(flagComponent);

    // Check that tooltip anchor elements are created
    const tooltipAnchors = chartLayer.selectAll("[data-tooltip-anchor]").nodes();
    expect(tooltipAnchors.length).toBe(2);

    // Tooltip anchors should be positioned at the middle point between y0 and y1
    tooltipAnchors.forEach((anchor, i) => {
      const anchorEl = select(anchor);
      const datum = testData[i];
      const transform = anchorEl.attr("transform");
      const expectedX = datum.x + 0.5; // halfPixel adjustment
      const expectedY = (datum.y0 + datum.y1) / 2 + 0.5;

      expect(transform).toContain(`translate(${expectedX},${expectedY})`);
    });
  });

  test("should work with custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[] = [
      {
        position: { x: 150 },
        range: { lower: 40, upper: 70 },
        id: "flag-1",
      },
    ];

    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as ComplexTestDatum).position.x)
      .y0((d: unknown) => (d as ComplexTestDatum).range.lower)
      .y1((d: unknown) => (d as ComplexTestDatum).range.upper);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum(complexTestData)
      .call(flagComponent);

    const bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    const topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();

    expect(bottomMarks.length).toBe(1);
    expect(topMarks.length).toBe(1);

    const bottomMark = select(bottomMarks[0]);
    const topMark = select(topMarks[0]);

    expect(Number(bottomMark.attr("cx"))).toBe(150.5);
    expect(Number(bottomMark.attr("cy"))).toBe(40.5);
    expect(Number(topMark.attr("cx"))).toBe(150.5);
    expect(Number(topMark.attr("cy"))).toBe(70.5);
  });

  test("should handle empty data array", () => {
    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum([])
      .call(flagComponent);

    const bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    const topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();
    const tooltipAnchors = chartLayer.selectAll(".sszvis-tooltip-anchor").nodes();

    expect(bottomMarks.length).toBe(0);
    expect(topMarks.length).toBe(0);
    expect(tooltipAnchors.length).toBe(0);
  });

  test("should handle data updates correctly", () => {
    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("rangeFlags");

    // Initial render with 1 flag
    chartLayer.datum([testData[0]]).call(flagComponent);
    let bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    let topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();
    expect(bottomMarks.length).toBe(1);
    expect(topMarks.length).toBe(1);

    // Update with 2 flags
    chartLayer.datum(testData).call(flagComponent);
    bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();
    expect(bottomMarks.length).toBe(2);
    expect(topMarks.length).toBe(2);

    // Update with 0 flags
    chartLayer.datum([]).call(flagComponent);
    bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();
    expect(bottomMarks.length).toBe(0);
    expect(topMarks.length).toBe(0);
  });

  test("should position flags with same x-coordinate but different y-values", () => {
    const sameXData: TestDatum[] = [
      { x: 100, y0: 20, y1: 40 },
      { x: 100, y0: 60, y1: 80 },
    ];

    const flagComponent = rangeFlag()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rangeFlags")
      .datum(sameXData)
      .call(flagComponent);

    const bottomMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.bottom").nodes();
    const topMarks = chartLayer.selectAll("circle.sszvis-rangeFlag__mark.top").nodes();

    // All should have same x position but different y positions
    expect(Number(select(bottomMarks[0]).attr("cx"))).toBe(100.5);
    expect(Number(select(bottomMarks[1]).attr("cx"))).toBe(100.5);
    expect(Number(select(topMarks[0]).attr("cx"))).toBe(100.5);
    expect(Number(select(topMarks[1]).attr("cx"))).toBe(100.5);

    // Y positions should be different
    expect(Number(select(bottomMarks[0]).attr("cy"))).toBe(20.5);
    expect(Number(select(bottomMarks[1]).attr("cy"))).toBe(60.5);
    expect(Number(select(topMarks[0]).attr("cy"))).toBe(40.5);
    expect(Number(select(topMarks[1]).attr("cy"))).toBe(80.5);
  });
});
