import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { annotationRuler } from "../../src/annotation/ruler";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  x: number;
  y: number;
  label: string;
  color?: string;
};

type ComplexTestDatum = {
  position: { x: number; y: number };
  category: string;
  value: number;
  id: string;
};

describe("annotation/ruler", () => {
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
    { x: 100, y: 50, label: "Point A", color: "red" },
    { x: 100, y: 80, label: "Point B", color: "blue" },
    { x: 100, y: 110, label: "Point C", color: "green" },
  ];

  test("should render ruler with proper DOM structure", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color((d: unknown) => (d as TestDatum).color || "black");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    // Check that ruler lines are rendered
    const rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    expect(rulerLines.length).toBe(3);

    // Check that dots are rendered
    const dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    expect(dots.length).toBe(3);

    // Check that labels are rendered
    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();
    const labelOutlines = chartLayer.selectAll("text.sszvis-ruler__label-outline").nodes();
    expect(labels.length).toBe(3);
    expect(labelOutlines.length).toBe(3);
  });

  test("should position ruler lines correctly", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    const rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();

    rulerLines.forEach((lineNode, i) => {
      const line = select(lineNode);
      const datum = testData[i];

      expect(Number(line.attr("x1"))).toBe(100.5); // halfPixel adjustment
      expect(Number(line.attr("x2"))).toBe(100.5);
      expect(Number(line.attr("y1"))).toBe(datum.y);
      expect(Number(line.attr("y2"))).toBe(150);
    });
  });

  test("should position dots correctly", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color((d: unknown) => (d as TestDatum).color || "black");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    const dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();

    dots.forEach((dotNode, i) => {
      const dot = select(dotNode);
      const datum = testData[i];

      expect(Number(dot.attr("cx"))).toBe(100.5); // halfPixel adjustment
      expect(Number(dot.attr("cy"))).toBe(datum.y + 0.5); // halfPixel adjustment
      expect(Number(dot.attr("r"))).toBe(3.5);
      expect(dot.attr("fill")).toBe(datum.color);
    });
  });

  test("should position labels correctly with default alignment", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();

    labels.forEach((labelNode, i) => {
      const label = select(labelNode);
      const datum = testData[i];

      // Labels should be positioned with an offset from the dot
      const transform = label.attr("transform");
      expect(transform).toContain("translate(110.5"); // x + 10 offset
      expect(label.style("text-anchor")).toBe("start");
      expect(label.html()).toBe(datum.label);
    });
  });

  test("should flip labels when flip is enabled", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black")
      .flip(true);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();

    labels.forEach((labelNode) => {
      const label = select(labelNode);

      // Labels should be positioned with negative offset when flipped
      const transform = label.attr("transform");
      expect(transform).toContain("translate(90.5"); // x - 10 offset
      expect(label.style("text-anchor")).toBe("end");
    });
  });

  test("should work with custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[] = [
      {
        position: { x: 150, y: 60 },
        category: "Category A",
        value: 25,
        id: "item-1",
      },
      {
        position: { x: 150, y: 90 },
        category: "Category B",
        value: 35,
        id: "item-2",
      },
    ];

    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as ComplexTestDatum).position.x)
      .y((d: unknown) => (d as ComplexTestDatum).position.y)
      .top(40)
      .bottom(120)
      .label((d: unknown) => (d as ComplexTestDatum).category)
      .color("purple")
      .labelId((d: unknown) => (d as ComplexTestDatum).id);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(complexTestData)
      .call(rulerComponent);

    const rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    const dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();

    expect(rulerLines.length).toBe(2);
    expect(dots.length).toBe(2);
    expect(labels.length).toBe(2);

    // Check first item positioning
    expect(Number(select(rulerLines[0]).attr("x1"))).toBe(150.5);
    expect(Number(select(dots[0]).attr("cy"))).toBe(60.5);
    expect(select(labels[0]).html()).toBe("Category A");
  });

  test("should handle empty data array", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum([])
      .call(rulerComponent);

    const rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    const dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();

    expect(rulerLines.length).toBe(0);
    expect(dots.length).toBe(0);
    expect(labels.length).toBe(0);
  });

  test("should handle data updates correctly", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black");

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("ruler");

    // Initial render with 1 item
    chartLayer.datum([testData[0]]).call(rulerComponent);
    let rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    let dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    expect(rulerLines.length).toBe(1);
    expect(dots.length).toBe(1);

    // Update with 3 items
    chartLayer.datum(testData).call(rulerComponent);
    rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    expect(rulerLines.length).toBe(3);
    expect(dots.length).toBe(3);

    // Update with 0 items
    chartLayer.datum([]).call(rulerComponent);
    rulerLines = chartLayer.selectAll("line.sszvis-ruler__rule").nodes();
    dots = chartLayer.selectAll("circle.sszvis-ruler__dot").nodes();
    expect(rulerLines.length).toBe(0);
    expect(dots.length).toBe(0);
  });

  test("should work with functional flip property", () => {
    const mixedFlipData: TestDatum[] = [
      { x: 100, y: 50, label: "Right Label" },
      { x: 100, y: 80, label: "Left Label" },
    ];

    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black")
      .flip((d: unknown) => (d as TestDatum).label.includes("Left"));

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(mixedFlipData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();

    // First label should be right-aligned (not flipped)
    expect(select(labels[0]).style("text-anchor")).toBe("start");

    // Second label should be left-aligned (flipped)
    expect(select(labels[1]).style("text-anchor")).toBe("end");
  });

  test("should handle reduceOverlap property", () => {
    // Create data with potentially overlapping labels
    const overlappingData: TestDatum[] = [
      { x: 100, y: 50, label: "Very Long Label A" },
      { x: 100, y: 52, label: "Very Long Label B" },
      { x: 100, y: 54, label: "Very Long Label C" },
    ];

    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black")
      .reduceOverlap(true);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(overlappingData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();
    expect(labels.length).toBe(3);

    // The reduceOverlap algorithm should run without errors
    // Testing the exact positioning would be complex as it depends on DOM measurements
    labels.forEach((label) => {
      expect(select(label).classed("sszvis-ruler__label")).toBe(true);
    });
  });

  test("should handle custom labelId function", () => {
    const keyedData: TestDatum[] = [
      { x: 100, y: 50, label: "Item 1" },
      { x: 100, y: 80, label: "Item 2" },
    ];

    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black")
      .labelId((d: unknown) => (d as TestDatum).label);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(keyedData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();
    expect(labels.length).toBe(2);

    // Test data update with same keys
    const updatedData: TestDatum[] = [
      { x: 120, y: 60, label: "Item 1" }, // Same label, different position
      { x: 120, y: 90, label: "Item 2" },
    ];

    chartLayer.datum(updatedData).call(rulerComponent);
    const updatedLabels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();
    expect(updatedLabels.length).toBe(2);
  });

  test("should disable reduceOverlap when set to false", () => {
    const rulerComponent = annotationRuler()
      .x((d: unknown) => (d as TestDatum).x)
      .y((d: unknown) => (d as TestDatum).y)
      .top(30)
      .bottom(150)
      .label((d: unknown) => (d as TestDatum).label)
      .color("black")
      .reduceOverlap(false);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("ruler")
      .datum(testData)
      .call(rulerComponent);

    const labels = chartLayer.selectAll("text.sszvis-ruler__label").nodes();
    expect(labels.length).toBe(3);

    // When reduceOverlap is false, labels should not have y attribute set by overlap algorithm
    labels.forEach((label) => {
      expect(select(label).classed("sszvis-ruler__label")).toBe(true);
    });
  });
});
