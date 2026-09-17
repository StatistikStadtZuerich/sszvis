import { range, scaleBand, select } from "d3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import confidenceBar from "../../src/annotation/confidenceBar.js";
import { createSvgLayer } from "../../src/createSvgLayer.js";
import "../../src/d3-selectgroup.js";

type TestDatum = {
  value: number;
  low: number;
  high: number;
  group?: number;
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

  test("should draw a capped vertical span between the bounds for every bar in every group", () => {
    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(testData)
      .call(
        confidenceBar<TestDatum>()
          .confidenceLow((d) => d.low)
          .confidenceHigh((d) => d.high)
          .width(20)
          .groupSize(2)
          .groupWidth(60)
          .groupScale(() => 150),
      );

    expect(chartLayer.selectAll("g.sszvis-confidence-bargroup").nodes()).toHaveLength(1);
    const barUnits = chartLayer.selectAll("g.sszvis-confidence-barunit").nodes();
    expect(barUnits).toHaveLength(2);

    const geometryOf = (unit: Element) =>
      select(unit)
        .selectAll("line.sszvis-confidence-bar")
        .nodes()
        .map((l) => {
          const line = select(l);
          return [
            Number(line.attr("x1")),
            Number(line.attr("y1")),
            Number(line.attr("x2")),
            Number(line.attr("y2")),
          ];
        });

    // Each bar is a vertical span from its high bound down to its low bound, with a 20-wide
    // cap centred on the span at each end. Where the span sits along x is the slot test's job.
    for (const [unit, { low, high }] of [
      [barUnits[0] as Element, testData[0][0]],
      [barUnits[1] as Element, testData[0][1]],
    ] as const) {
      const [span, highCap, lowCap] = geometryOf(unit);
      const centre = span[0];
      expect(span).toEqual([centre, high, centre, low]);
      expect(highCap).toEqual([centre - 10, high, centre + 10, high]);
      expect(lowCap).toEqual([centre - 10, low, centre + 10, low]);
    }
  });

  test("should place each bar at its own slot within its group when groups are spaced apart", () => {
    const GROUP_SIZE = 2;
    const GROUP_WIDTH = 100;
    const GROUP_SPACE = 0.1;
    const groupedData: TestDatum[][] = [
      [
        { value: 50, low: 40, high: 60, group: 0 },
        { value: 75, low: 65, high: 85, group: 0 },
      ],
      [
        { value: 20, low: 15, high: 25, group: 1 },
        { value: 30, low: 25, high: 35, group: 1 },
      ],
    ];

    const chartLayer = createSvgLayer("#chart-container", undefined, { key: "test-layer" })
      .selectGroup("confidenceBars")
      .datum(groupedData)
      .call(
        confidenceBar<TestDatum>()
          .confidenceLow((d) => d.low)
          .confidenceHigh((d) => d.high)
          .width(10)
          .groupSize(GROUP_SIZE)
          .groupWidth(GROUP_WIDTH)
          .groupSpace(GROUP_SPACE)
          .groupScale((d) => (d.group ?? 0) * 200),
      );

    const band = scaleBand()
      .domain(range(GROUP_SIZE).map(String))
      .rangeRound([0, GROUP_WIDTH])
      .paddingInner(GROUP_SPACE)
      .paddingOuter(0);
    const slot = (i: number) => (band(String(i)) ?? 0) + band.bandwidth() / 2;

    // Absolute positions, so a groupScale or a groupSpace that is silently ignored fails here
    // rather than passing a "the second bar is further right" comparison.
    expect(
      chartLayer
        .selectAll("g.sszvis-confidence-barunit")
        .nodes()
        .map((u) => Number(select(u).select("line.sszvis-confidence-bar").attr("x1"))),
    ).toEqual([slot(0), slot(1), 200 + slot(0), 200 + slot(1)]);
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
});
