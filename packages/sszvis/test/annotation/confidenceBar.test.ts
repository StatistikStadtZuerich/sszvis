import { range, scaleBand, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import confidenceBar from "../../src/annotation/confidenceBar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

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

  describe("shared datum objects", () => {
    const GROUP_SIZE = 3;
    const GROUP_WIDTH = 90;

    /** The in-group band the component builds internally, to assert absolute slots against. */
    const band = () =>
      scaleBand()
        .domain(range(GROUP_SIZE).map(String))
        .rangeRound([0, GROUP_WIDTH])
        .paddingInner(0.05)
        .paddingOuter(0);

    const componentOf = () =>
      confidenceBar<TestDatum>()
        .confidenceLow((d) => d.low)
        .confidenceHigh((d) => d.high)
        .width(10)
        .groupSize(GROUP_SIZE)
        .groupWidth(GROUP_WIDTH)
        .groupScale(() => 0);

    /** The x of each unit's vertical line, which sits at its slot's centre. */
    const centres = (layer: ReturnType<typeof createSvgLayer>) =>
      [...layer.selectAll<SVGGElement, unknown>("g.sszvis-confidence-barunit").nodes()].map((u) =>
        Number(select(u).select("line.sszvis-confidence-bar").attr("x1")),
      );

    const sharedData = () => {
      const shared = { value: 10, low: 5, high: 15 };
      const data: TestDatum[][] = [
        [{ value: 20, low: 15, high: 25 }, { value: 12, low: 8, high: 16 }, shared],
        [shared, { value: 30, low: 25, high: 35 }],
      ];
      return { shared, data };
    };

    test("should offset a datum object reused across groups by each bar's own index", () => {
      // The same object at index 2 of the first group and index 0 of the second. Asserted
      // against absolute slots, so an off-by-one or a reversed in-group order cannot pass:
      // with groupSize 3 neither permutation maps {2, 0} back onto itself.
      const { data } = sharedData();
      const layer = createSvgLayer("#chart-container", undefined, { key: "test-layer" });
      layer.selectGroup("confidenceBars").datum(data).call(componentOf());

      const b = band();
      const halfBand = b.bandwidth() / 2;
      const [a, second, sharedInFirst, sharedInSecond, last] = centres(layer);

      expect(a).toBeCloseTo((b("0") ?? 0) + halfBand, 5);
      expect(second).toBeCloseTo((b("1") ?? 0) + halfBand, 5);
      // The shared object's bar in the first group is at index 2 ...
      expect(sharedInFirst).toBeCloseTo((b("2") ?? 0) + halfBand, 5);
      // ... and its bar in the second group at index 0. Writing the index onto the datum
      // gave the object a single value, so both of its bars landed in the same slot.
      expect(sharedInSecond).toBeCloseTo((b("0") ?? 0) + halfBand, 5);
      expect(last).toBeCloseTo((b("1") ?? 0) + halfBand, 5);
    });

    test("should not mutate the caller's datum objects", () => {
      const { shared, data } = sharedData();
      const before = data.flat().map((d) => Object.keys(d).sort());

      createSvgLayer("#chart-container", undefined, { key: "test-layer" })
        .selectGroup("confidenceBars")
        .datum(data)
        .call(componentOf());

      // Asserted on the key set rather than on a named property, so this still catches any
      // future bookkeeping the component decides to hang off the caller's data. These objects
      // are shared with the bar component drawn underneath, which compares them by identity.
      expect(data.flat().map((d) => Object.keys(d).sort())).toEqual(before);
      expect(Object.keys(shared).sort()).toEqual(["high", "low", "value"]);
    });
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
