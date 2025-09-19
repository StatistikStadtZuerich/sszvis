import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import rectangle from "../../src/annotation/rectangle";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  x: number;
  y: number;
  width: number;
  height: number;
  caption?: string;
};

type ComplexTestDatum = {
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  label: string;
  offset: { dx: number; dy: number };
};

describe("annotation/rectangle", () => {
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
    { x: 50, y: 60, width: 100, height: 80 },
    { x: 200, y: 100, width: 120, height: 60 },
    { x: 10, y: 200, width: 80, height: 40 },
  ];

  const testDataWithCaptions: TestDatum[] = [
    { x: 50, y: 60, width: 100, height: 80, caption: "Area A" },
    { x: 200, y: 100, width: 120, height: 60, caption: "Area B" },
  ];

  test("should render rectangle annotation with proper DOM structure", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testData)
      .call(rectangleComponent);

    // Check that rectangles are rendered
    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(3);

    // Check that each rectangle has the correct class
    rectangles.forEach((rect) => {
      expect(select(rect).classed("sszvis-dataarearectangle")).toBe(true);
    });

    // Check that pattern defs are created
    const defs = chartLayer.select("defs").node();
    expect(defs).not.toBeNull();
    const pattern = chartLayer.select("pattern#data-area-pattern").node();
    expect(pattern).not.toBeNull();
  });

  test("should position rectangles correctly using accessor functions", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testData)
      .call(rectangleComponent);

    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();

    // Check first rectangle position and dimensions
    const firstRect = select(rectangles[0]);
    expect(Number(firstRect.attr("x"))).toBe(50);
    expect(Number(firstRect.attr("y"))).toBe(60);
    expect(Number(firstRect.attr("width"))).toBe(100);
    expect(Number(firstRect.attr("height"))).toBe(80);

    // Check second rectangle position and dimensions
    const secondRect = select(rectangles[1]);
    expect(Number(secondRect.attr("x"))).toBe(200);
    expect(Number(secondRect.attr("y"))).toBe(100);
    expect(Number(secondRect.attr("width"))).toBe(120);
    expect(Number(secondRect.attr("height"))).toBe(60);

    // Check third rectangle position and dimensions
    const thirdRect = select(rectangles[2]);
    expect(Number(thirdRect.attr("x"))).toBe(10);
    expect(Number(thirdRect.attr("y"))).toBe(200);
    expect(Number(thirdRect.attr("width"))).toBe(80);
    expect(Number(thirdRect.attr("height"))).toBe(40);
  });

  test("should apply data area pattern fill to rectangles", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testData)
      .call(rectangleComponent);

    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();

    rectangles.forEach((rect) => {
      expect(select(rect).attr("fill")).toBe("url(#data-area-pattern)");
    });
  });

  test("should render captions when caption accessor is provided", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height)
      .caption((d) => d.caption || "");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testDataWithCaptions)
      .call(rectangleComponent);

    // Check that captions are rendered
    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();
    expect(captions.length).toBe(2);

    // Check caption positioning (should be at rectangle centers by default)
    const firstCaption = select(captions[0]);
    const firstRectCenterX = 50 + 100 / 2; // x + width/2
    const firstRectCenterY = 60 + 80 / 2; // y + height/2
    expect(Number(firstCaption.attr("x"))).toBe(firstRectCenterX);
    expect(Number(firstCaption.attr("y"))).toBe(firstRectCenterY);
    expect(firstCaption.text()).toBe("Area A");

    const secondCaption = select(captions[1]);
    const secondRectCenterX = 200 + 120 / 2; // x + width/2
    const secondRectCenterY = 100 + 60 / 2; // y + height/2
    expect(Number(secondCaption.attr("x"))).toBe(secondRectCenterX);
    expect(Number(secondCaption.attr("y"))).toBe(secondRectCenterY);
    expect(secondCaption.text()).toBe("Area B");

    // Check that each caption has the correct class
    captions.forEach((caption) => {
      expect(select(caption).classed("sszvis-dataarearectangle__caption")).toBe(true);
    });
  });

  test("should not render captions when caption accessor is not provided", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testDataWithCaptions)
      .call(rectangleComponent);

    // Check that no captions are rendered
    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();
    expect(captions.length).toBe(0);
  });

  test("should offset captions using dx and dy properties", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height)
      .caption((d) => d.caption || "")
      .dx(() => 15)
      .dy(() => -10);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(testDataWithCaptions)
      .call(rectangleComponent);

    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();

    captions.forEach((caption) => {
      const captionSelection = select(caption);
      expect(Number(captionSelection.attr("dx"))).toBe(15);
      expect(Number(captionSelection.attr("dy"))).toBe(-10);
    });
  });

  test("should work with constant values instead of accessor functions", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x(150)
      .y(125)
      .width(100)
      .height(50)
      .caption("Fixed Rectangle");

    const singleDataPoint = [{}]; // Single empty object since we're using constants

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(singleDataPoint)
      .call(rectangleComponent);

    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(1);

    const rectangleElement = select(rectangles[0]);
    expect(Number(rectangleElement.attr("x"))).toBe(150);
    expect(Number(rectangleElement.attr("y"))).toBe(125);
    expect(Number(rectangleElement.attr("width"))).toBe(100);
    expect(Number(rectangleElement.attr("height"))).toBe(50);

    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();
    expect(captions.length).toBe(1);

    const captionElement = select(captions[0]);
    expect(captionElement.text()).toBe("Fixed Rectangle");
    // Caption should be positioned at center of rectangle
    expect(Number(captionElement.attr("x"))).toBe(150 + 100 / 2); // x + width/2
    expect(Number(captionElement.attr("y"))).toBe(125 + 50 / 2); // y + height/2
  });

  test("should work with complex data structures and custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[] = [
      {
        position: { x: 80, y: 120 },
        dimensions: { width: 60, height: 40 },
        label: "Complex Area 1",
        offset: { dx: 10, dy: 5 },
      },
      {
        position: { x: 180, y: 80 },
        dimensions: { width: 90, height: 70 },
        label: "Complex Area 2",
        offset: { dx: -15, dy: 8 },
      },
    ];

    const rectangleComponent = rectangle<ComplexTestDatum>()
      .x((d) => d.position.x)
      .y((d) => d.position.y)
      .width((d) => d.dimensions.width)
      .height((d) => d.dimensions.height)
      .caption((d) => d.label)
      .dx((d) => d.offset.dx)
      .dy((d) => d.offset.dy);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(complexTestData)
      .call(rectangleComponent);

    // Check rectangles
    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(2);

    const firstRectangle = select(rectangles[0]);
    expect(Number(firstRectangle.attr("x"))).toBe(80);
    expect(Number(firstRectangle.attr("y"))).toBe(120);
    expect(Number(firstRectangle.attr("width"))).toBe(60);
    expect(Number(firstRectangle.attr("height"))).toBe(40);

    // Check captions with offsets
    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();
    expect(captions.length).toBe(2);

    const firstCaption = select(captions[0]);
    expect(Number(firstCaption.attr("x"))).toBe(80 + 60 / 2); // Center x
    expect(Number(firstCaption.attr("y"))).toBe(120 + 40 / 2); // Center y
    expect(Number(firstCaption.attr("dx"))).toBe(10);
    expect(Number(firstCaption.attr("dy"))).toBe(5);
    expect(firstCaption.text()).toBe("Complex Area 1");

    const secondCaption = select(captions[1]);
    expect(Number(secondCaption.attr("dx"))).toBe(-15);
    expect(Number(secondCaption.attr("dy"))).toBe(8);
    expect(secondCaption.text()).toBe("Complex Area 2");
  });

  test("should handle empty data array", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum([])
      .call(rectangleComponent);

    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(0);

    const captions = chartLayer.selectAll("text.sszvis-dataarearectangle__caption").nodes();
    expect(captions.length).toBe(0);
  });

  test("should handle data updates correctly", () => {
    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("rectangles");

    // Initial render with 2 rectangles
    chartLayer.datum(testData.slice(0, 2)).call(rectangleComponent);
    let rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(2);

    // Update with 3 rectangles
    chartLayer.datum(testData).call(rectangleComponent);
    rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(3);

    // Update with 1 rectangle
    chartLayer.datum(testData.slice(0, 1)).call(rectangleComponent);
    rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(1);
  });

  test("should handle zero and negative dimensions gracefully", () => {
    const edgeCaseData: TestDatum[] = [
      { x: 50, y: 60, width: 0, height: 80 }, // Zero width
      { x: 200, y: 100, width: 120, height: 0 }, // Zero height
    ];

    const rectangleComponent = rectangle<TestDatum>()
      .x((d) => d.x)
      .y((d) => d.y)
      .width((d) => d.width)
      .height((d) => d.height);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("rectangles")
      .datum(edgeCaseData)
      .call(rectangleComponent);

    const rectangles = chartLayer.selectAll("rect.sszvis-dataarearectangle").nodes();
    expect(rectangles.length).toBe(2);

    // Check that rectangles are still created with zero dimensions
    const firstRect = select(rectangles[0]);
    expect(Number(firstRect.attr("width"))).toBe(0);
    expect(Number(firstRect.attr("height"))).toBe(80);

    const secondRect = select(rectangles[1]);
    expect(Number(secondRect.attr("width"))).toBe(120);
    expect(Number(secondRect.attr("height"))).toBe(0);
  });
});
