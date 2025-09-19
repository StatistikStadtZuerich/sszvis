import { select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import confidenceBar from "../../src/annotation/confidenceBar";
import { createSvgLayer } from "../../src/createSvgLayer";
import "../../src/d3-selectgroup";

type TestDatum = {
  value: number;
  low: number;
  high: number;
};

type ComplexTestDatum = {
  measurement: number;
  errorRange: { min: number; max: number };
  position: { x: number; y: number };
};

describe("annotation/confidenceBar", () => {
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

  const testData: TestDatum[][] = [
    [
      { value: 50, low: 40, high: 60 },
      { value: 75, low: 65, high: 85 },
    ],
  ];

  test("should render confidenceBar with proper DOM structure", () => {
    const confidenceBarComponent = confidenceBar<TestDatum>()
      .confidenceLow((d) => d.low)
      .confidenceHigh((d) => d.high)
      .width(10)
      .groupSize(2)
      .groupWidth(60)
      .groupScale(() => 0);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(confidenceBarComponent);
    const groups = chartLayer.selectAll("g.sszvis-confidence-bargroup").nodes();
    expect(groups.length).toBe(1);
    expect(select(groups[0]).classed("sszvis-confidence-bargroup")).toBe(true);
    const barUnits = chartLayer.selectAll("g.sszvis-confidence-barunit").nodes();
    expect(barUnits.length).toBe(2);
    barUnits.forEach((unit) => {
      expect(select(unit).classed("sszvis-confidence-barunit")).toBe(true);
      expect(select(unit).selectAll("line.sszvis-confidence-bar").nodes().length).toBe(3);
    });
  });

  test("should position confidence bounds correctly", () => {
    const confidenceBarComponent = confidenceBar()
      .confidenceLow((d) => (d as unknown as TestDatum).low)
      .confidenceHigh((d) => (d as unknown as TestDatum).high)
      .width(10)
      .groupSize(1)
      .groupWidth(60)
      .groupScale(() => 150);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(confidenceBarComponent);
    const lines = chartLayer.selectAll("line.sszvis-confidence-bar").nodes();
    expect(lines.length).toBe(6);
    const verticalLine = select(lines[0]);
    expect(Number(verticalLine.attr("y1"))).toBe(60);
    expect(Number(verticalLine.attr("y2"))).toBe(40);
    expect(verticalLine.attr("x1")).toBe(verticalLine.attr("x2"));
    const topCap = select(lines[1]);
    expect(Number(topCap.attr("y1"))).toBe(60);
    expect(Number(topCap.attr("y2"))).toBe(60);
    const bottomCap = select(lines[2]);
    expect(Number(bottomCap.attr("y1"))).toBe(40);
    expect(Number(bottomCap.attr("y2"))).toBe(40);
  });

  test("should position groups correctly with groupScale", () => {
    let groupIndex = 0;
    const confidenceBarComponent = confidenceBar()
      .confidenceLow((d) => (d as unknown as TestDatum).low)
      .confidenceHigh((d) => (d as unknown as TestDatum).high)
      .width(10)
      .groupSize(1)
      .groupWidth(60)
      .groupScale(() => groupIndex++ * 100);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(confidenceBarComponent);
    const barUnits = chartLayer.selectAll("g.sszvis-confidence-barunit").nodes();
    expect(barUnits.length).toBe(2);
    const firstX = Number(select(barUnits[0]).select("line.sszvis-confidence-bar").attr("x1"));
    const secondX = Number(select(barUnits[1]).select("line.sszvis-confidence-bar").attr("x1"));
    expect(firstX).not.toBe(secondX);
    expect(secondX).toBeGreaterThan(firstX);
  });

  test("should render caps with correct width", () => {
    const confidenceBarComponent = confidenceBar()
      .confidenceLow((d) => (d as unknown as TestDatum).low)
      .confidenceHigh((d) => (d as unknown as TestDatum).high)
      .width(20) // Wide caps
      .groupSize(1)
      .groupWidth(60)
      .groupScale(() => 150);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(confidenceBarComponent);
    const lines = chartLayer.selectAll("line.sszvis-confidence-bar").nodes();
    const topCap = select(lines[1]);
    const bottomCap = select(lines[2]);
    expect(Number(topCap.attr("x2")) - Number(topCap.attr("x1"))).toBe(20);
    expect(Number(bottomCap.attr("x2")) - Number(bottomCap.attr("x1"))).toBe(20);
  });

  test("should handle multiple items within a group with groupSpace", () => {
    const confidenceBarComponent = confidenceBar()
      .confidenceLow((d) => (d as unknown as TestDatum).low)
      .confidenceHigh((d) => (d as unknown as TestDatum).high)
      .width(10)
      .groupSize(2)
      .groupWidth(100)
      .groupSpace(0.1) // 10% spacing
      .groupScale(() => 150);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(confidenceBarComponent);
    const barUnits = chartLayer.selectAll("g.sszvis-confidence-barunit").nodes();
    expect(barUnits.length).toBe(2);
    const firstX = Number(select(barUnits[0]).select("line.sszvis-confidence-bar").attr("x1"));
    const secondX = Number(select(barUnits[1]).select("line.sszvis-confidence-bar").attr("x1"));
    expect(firstX).not.toBe(secondX);
    expect(secondX).toBeGreaterThan(firstX);
  });

  test("should work with custom accessor functions", () => {
    const complexTestData: ComplexTestDatum[][] = [
      [
        {
          measurement: 50,
          errorRange: { min: 40, max: 60 },
          position: { x: 100, y: 200 },
        },
      ],
    ];

    const confidenceBarComponent = confidenceBar<ComplexTestDatum>()
      .x((d) => d.position.x)
      .y((d) => d.position.y)
      .confidenceLow((d) => d.errorRange.min)
      .confidenceHigh((d) => d.errorRange.max)
      .width(15)
      .groupSize(1)
      .groupWidth(60)
      .groupScale(() => 150);
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(complexTestData)
      .call(confidenceBarComponent);
    const lines = chartLayer.selectAll("line.sszvis-confidence-bar").nodes();
    expect(lines.length).toBe(3);
    expect(Number(select(lines[0]).attr("y1"))).toBe(60);
    expect(Number(select(lines[0]).attr("y2"))).toBe(40);
  });
});
