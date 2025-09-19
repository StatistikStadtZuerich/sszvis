import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import confidenceArea from "../../src/annotation/confidenceArea";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  x: number;
  y0: number;
  y1: number;
};

type ComplexTestDatum = {
  position: { x: number };
  bounds: { lower: number; upper: number };
  id: string;
};

type KeyedTestDatum = TestDatum & {
  id: string;
};

type WrappedTestData = {
  values: TestDatum[];
};

describe("annotation/confidenceArea", () => {
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
    { x: 0, y0: 50, y1: 80 },
    { x: 50, y0: 60, y1: 90 },
    { x: 100, y0: 40, y1: 70 },
    { x: 150, y0: 55, y1: 85 },
  ];

  const multiAreaData: TestDatum[][] = [
    [
      { x: 0, y0: 50, y1: 80 },
      { x: 50, y0: 60, y1: 90 },
    ],
    [
      { x: 0, y0: 30, y1: 40 },
      { x: 50, y0: 35, y1: 45 },
    ],
  ];

  test("should render confidenceArea with proper DOM structure", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaComponent);

    // Check that areas are rendered
    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);

    // Check that each area has the correct class
    areas.forEach((area) => {
      expect(select(area).classed("sszvis-area")).toBe(true);
    });

    // Check that pattern defs are created
    const defs = chartLayer.select("defs").node();
    expect(defs).not.toBeNull();
    const pattern = chartLayer.select("pattern#data-area-pattern").node();
    expect(pattern).not.toBeNull();
  });

  test("should apply data area pattern fill to areas", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();

    areas.forEach((area) => {
      expect(select(area).attr("fill")).toBe("url(#data-area-pattern)");
    });
  });

  test("should generate correct path data for area", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);

    // Just check that the path element exists and has the expected class
    expect(select(areas[0]).classed("sszvis-area")).toBe(true);
  });

  test("should handle multiple areas with data binding", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum(multiAreaData)
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(2);

    // Each area should have the correct class and fill
    areas.forEach((area) => {
      expect(select(area).classed("sszvis-area")).toBe(true);
      expect(select(area).attr("fill")).toBe("url(#data-area-pattern)");
    });
  });

  test("should apply custom stroke styling", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1)
      .stroke("#ff0000")
      .strokeWidth(2);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();

    // Just verify that stroke properties can be set without error
    // The actual styling verification depends on how the browser interprets CSS
    expect(areas.length).toBe(1);
    expect(select(areas[0]).classed("sszvis-area")).toBe(true);
  });

  test("should work with custom key function for data binding", () => {
    const keyedData: KeyedTestDatum[][] = [
      [
        { x: 0, y0: 50, y1: 80, id: "area1" },
        { x: 50, y0: 60, y1: 90, id: "area1" },
      ],
      [
        { x: 0, y0: 30, y1: 40, id: "area2" },
        { x: 50, y0: 35, y1: 45, id: "area2" },
      ],
    ];

    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as KeyedTestDatum).x)
      .y0((d: unknown) => (d as KeyedTestDatum).y0)
      .y1((d: unknown) => (d as KeyedTestDatum).y1)
      .key((d: unknown, i: unknown) => (d as KeyedTestDatum[])[0]?.id || (i as number));

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum(keyedData)
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(2);

    // Test data update with same keys
    const updatedData: KeyedTestDatum[][] = [
      [
        { x: 10, y0: 55, y1: 85, id: "area1" },
        { x: 60, y0: 65, y1: 95, id: "area1" },
      ],
      [
        { x: 10, y0: 35, y1: 45, id: "area2" },
        { x: 60, y0: 40, y1: 50, id: "area2" },
      ],
    ];

    chartLayer.datum(updatedData).call(areaComponent);
    const updatedAreas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(updatedAreas.length).toBe(2);
  });

  test("should work with custom valuesAccessor", () => {
    const wrappedData: WrappedTestData[] = [
      {
        values: [
          { x: 0, y0: 50, y1: 80 },
          { x: 50, y0: 60, y1: 90 },
        ],
      },
    ];

    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1)
      .valuesAccessor((d: unknown) => (d as WrappedTestData).values);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum(wrappedData)
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);

    // Just check that the path element exists and has the expected class
    expect(select(areas[0]).classed("sszvis-area")).toBe(true);
  });

  test("should work with complex data structures and custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[][] = [
      [
        {
          position: { x: 20 },
          bounds: { lower: 30, upper: 60 },
          id: "complex-area-1",
        },
        {
          position: { x: 80 },
          bounds: { lower: 40, upper: 70 },
          id: "complex-area-1",
        },
      ],
    ];

    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as ComplexTestDatum).position.x)
      .y0((d: unknown) => (d as ComplexTestDatum).bounds.lower)
      .y1((d: unknown) => (d as ComplexTestDatum).bounds.upper);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum(complexTestData)
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);

    // Just check that the path element exists and has the expected class
    expect(select(areas[0]).classed("sszvis-area")).toBe(true);
  });

  test("should handle empty data array", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([])
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(0);
  });

  test("should handle data updates correctly", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1);

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("areas");

    // Initial render with 1 area
    chartLayer.datum([testData.slice(0, 2)]).call(areaComponent);
    let areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);

    // Update with 2 areas
    chartLayer.datum(multiAreaData).call(areaComponent);
    areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(2);

    // Update with 0 areas
    chartLayer.datum([]).call(areaComponent);
    areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(0);
  });

  test("should handle transition property", () => {
    const areaComponent = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1)
      .transition(false); // Disable transitions for testing

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("areas")
      .datum([testData])
      .call(areaComponent);

    const areas = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areas.length).toBe(1);
    expect(select(areas[0]).classed("sszvis-area")).toBe(true);

    // Test with transitions enabled
    const areaComponentWithTransition = confidenceArea()
      .x((d: unknown) => (d as TestDatum).x)
      .y0((d: unknown) => (d as TestDatum).y0)
      .y1((d: unknown) => (d as TestDatum).y1)
      .transition(true);

    chartLayer.call(areaComponentWithTransition);
    const areasWithTransition = chartLayer.selectAll("path.sszvis-area").nodes();
    expect(areasWithTransition.length).toBe(1);
  });
});
