import { scaleLinear, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import line from "../../src/annotation/line";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

describe("annotation/line", () => {
  let container: HTMLDivElement;
  let xScale: (value: number) => number;
  let yScale: (value: number) => number;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "chart-container";
    container.style.width = "400px";
    container.style.height = "300px";
    document.body.appendChild(container);

    // Create test scales
    xScale = scaleLinear().domain([0, 100]).range([0, 400]);
    yScale = scaleLinear().domain([0, 100]).range([300, 0]); // Inverted for typical chart coordinates
  });

  afterEach(() => {
    container?.parentNode?.removeChild(container);
  });

  const testData = [{}]; // Line annotation typically uses a single data point for the line

  test("should render line annotation with proper DOM structure", () => {
    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    // Check that line is rendered
    const lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(1);

    // Check that the line has the correct class
    expect(select(lines[0]).classed("sszvis-referenceline")).toBe(true);
  });

  test("should position line correctly using scales and coordinates", () => {
    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const lineElement = chartLayer.select("line.sszvis-referenceline");

    // Check that coordinates are properly scaled
    expect(Number(lineElement.attr("x1"))).toBe(xScale(10)); // 40
    expect(Number(lineElement.attr("y1"))).toBe(yScale(20)); // 240
    expect(Number(lineElement.attr("x2"))).toBe(xScale(90)); // 360
    expect(Number(lineElement.attr("y2"))).toBe(yScale(80)); // 60
  });

  test("should render caption when caption property is provided", () => {
    const lineComponent = line()
      .x1(20)
      .y1(30)
      .x2(80)
      .y2(70)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Test Line");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    // Check that caption is rendered
    const captions = chartLayer.selectAll("text.sszvis-referenceline__caption").nodes();
    expect(captions.length).toBe(1);

    const captionElement = select(captions[0]);
    expect(captionElement.classed("sszvis-referenceline__caption")).toBe(true);
    expect(captionElement.text()).toBe("Test Line");
  });

  test("should not render caption when caption property is not provided", () => {
    const lineComponent = line().x1(20).y1(30).x2(80).y2(70).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    // Check that no caption is rendered
    const captions = chartLayer.selectAll("text.sszvis-referenceline__caption").nodes();
    expect(captions.length).toBe(0);
  });

  test("should position caption at midpoint of line with correct rotation", () => {
    const lineComponent = line()
      .x1(0)
      .y1(0)
      .x2(60)
      .y2(60)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Diagonal Line");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const captionElement = chartLayer.select("text.sszvis-referenceline__caption");
    const transform = captionElement.attr("transform");

    expect(transform).toBeTruthy();
    expect(transform).toContain("translate");
    expect(transform).toContain("rotate");

    // For a diagonal line from (0,0) to (60,60), the midpoint should be at (30,30) in data coordinates
    const x1Scaled = xScale(0);
    const y1Scaled = yScale(0);
    const x2Scaled = xScale(60);
    const y2Scaled = yScale(60);
    const expectedMidX = (x1Scaled + x2Scaled) / 2;
    const expectedMidY = (y1Scaled + y2Scaled) / 2;

    expect(transform).toContain(`translate(${expectedMidX},${expectedMidY})`);
  });

  test("should apply dx and dy offsets to caption", () => {
    const lineComponent = line()
      .x1(10)
      .y1(20)
      .x2(50)
      .y2(40)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Offset Line")
      .dx(15)
      .dy(-10);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const captionElement = chartLayer.select("text.sszvis-referenceline__caption");

    expect(Number(captionElement.attr("dx"))).toBe(15);
    expect(Number(captionElement.attr("dy"))).toBe(-10);
  });

  test("should work with constant coordinate values", () => {
    // Note: The line component appears to work with constant values rather than data-driven accessors
    // for the coordinate properties. Each line uses the same coordinate values.
    const dataWithCoordinates = [{ id: "line1" }, { id: "line2" }];

    const lineComponent = line()
      .x1(25) // Using constant values instead of accessor functions
      .y1(25)
      .x2(75)
      .y2(75)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Multiple Lines");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(dataWithCoordinates)
      .call(lineComponent);

    const lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(2);

    // Check coordinates for all lines (they should be the same since we used constants)
    lines.forEach((lineEl) => {
      const lineElement = select(lineEl);
      expect(Number(lineElement.attr("x1"))).toBe(xScale(25)); // Should be 100
      expect(Number(lineElement.attr("y1"))).toBe(yScale(25)); // Should be 225
      expect(Number(lineElement.attr("x2"))).toBe(xScale(75)); // Should be 300
      expect(Number(lineElement.attr("y2"))).toBe(yScale(75)); // Should be 75
    });

    // Check caption (should be one caption element regardless of number of data points)
    const captions = chartLayer.selectAll("text.sszvis-referenceline__caption").nodes();
    expect(captions.length).toBe(1);
    expect(select(captions[0]).text()).toBe("Multiple Lines");
  });

  test("should work with function accessors for dx and dy", () => {
    const lineComponent = line()
      .x1(10)
      .y1(20)
      .x2(50)
      .y2(40)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Function Offset Line")
      .dx(() => 20)
      .dy(() => -15);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const captionElement = chartLayer.select("text.sszvis-referenceline__caption");

    expect(Number(captionElement.attr("dx"))).toBe(20);
    expect(Number(captionElement.attr("dy"))).toBe(-15);
  });

  test("should handle horizontal lines correctly", () => {
    const lineComponent = line()
      .x1(10)
      .y1(50)
      .x2(90)
      .y2(50) // Same y-coordinate for horizontal line
      .xScale(xScale)
      .yScale(yScale)
      .caption("Horizontal Line");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const lineElement = chartLayer.select("line.sszvis-referenceline");
    const captionElement = chartLayer.select("text.sszvis-referenceline__caption");

    // Check that y-coordinates are the same
    expect(Number(lineElement.attr("y1"))).toBe(Number(lineElement.attr("y2")));

    // Check that caption rotation is 0 degrees for horizontal line
    const transform = captionElement.attr("transform");
    expect(transform).toContain("rotate(0)");
  });

  test("should handle vertical lines correctly", () => {
    const lineComponent = line()
      .x1(50)
      .y1(10)
      .x2(50) // Same x-coordinate for vertical line
      .y2(90)
      .xScale(xScale)
      .yScale(yScale)
      .caption("Vertical Line");

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(testData)
      .call(lineComponent);

    const lineElement = chartLayer.select("line.sszvis-referenceline");
    const captionElement = chartLayer.select("text.sszvis-referenceline__caption");

    // Check that x-coordinates are the same
    expect(Number(lineElement.attr("x1"))).toBe(Number(lineElement.attr("x2")));

    // Check that caption rotation is 90 or -90 degrees for vertical line
    const transform = captionElement.attr("transform");
    expect(transform).toMatch(/rotate\((90|-90)\)/);
  });

  test("should handle multiple data points for multiple lines", () => {
    const multipleLineData = [{ id: "line1" }, { id: "line2" }, { id: "line3" }];

    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum(multipleLineData)
      .call(lineComponent);

    const lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(3);

    // All lines should have the same coordinates since we used constant values
    lines.forEach((lineEl) => {
      const lineSelection = select(lineEl);
      expect(lineSelection.classed("sszvis-referenceline")).toBe(true);
      expect(Number(lineSelection.attr("x1"))).toBe(xScale(10));
      expect(Number(lineSelection.attr("y1"))).toBe(yScale(20));
    });
  });

  test("should handle data updates correctly", () => {
    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, {
      key: "test-layer",
    }).selectGroup("lines");

    // Initial render with 1 line
    chartLayer.datum([{ id: "line1" }]).call(lineComponent);
    let lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(1);

    // Update with 2 lines
    chartLayer.datum([{ id: "line1" }, { id: "line2" }]).call(lineComponent);
    lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(2);

    // Update with 0 lines
    chartLayer.datum([]).call(lineComponent);
    lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(0);
  });

  test("should handle empty data array", () => {
    const lineComponent = line().x1(10).y1(20).x2(90).y2(80).xScale(xScale).yScale(yScale);

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("lines")
      .datum([])
      .call(lineComponent);

    const lines = chartLayer.selectAll("line.sszvis-referenceline").nodes();
    expect(lines.length).toBe(0);

    const captions = chartLayer.selectAll("text.sszvis-referenceline__caption").nodes();
    expect(captions.length).toBe(0);
  });
});
