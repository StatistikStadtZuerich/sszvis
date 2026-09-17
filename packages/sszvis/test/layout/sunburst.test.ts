import { describe, expect, test, vi } from "vitest";
import { prepareHierarchyData } from "../../src/layout/hierarchy.js";
import {
  computeLayout,
  getRadiusExtent,
  MAX_SUNBURST_RING_WIDTH,
  MIN_SUNBURST_RING_WIDTH,
  prepareData,
} from "../../src/layout/sunburst.js";

type Row = { continent: string; country: string; value: number };

const DATA: Row[] = [
  { continent: "Europa", country: "Schweiz", value: 100 },
  { continent: "Europa", country: "Frankreich", value: 80 },
  { continent: "Asien", country: "Japan", value: 60 },
];

describe("layout/sunburst", () => {
  describe("computeLayout", () => {
    test("should give the centre circle a third of the radius", () => {
      const layout = computeLayout(3, 600);
      expect(layout.centerRadius).toBe(100);
      expect(layout.centerRadius).toBe(600 / 6);
    });

    test("should divide the remaining radius between the rings", () => {
      const layout = computeLayout(4, 600);
      // (300 - 100) / 4
      expect(layout.ringWidth).toBe(50);
      expect(layout.centerRadius + layout.ringWidth * 4).toBe(300);
    });

    test("should cap a ring at 60px when a shallow hierarchy has room to spare", () => {
      // one layer in a wide chart would otherwise take the whole 200px
      const layout = computeLayout(1, 600);
      expect(layout.ringWidth).toBe(MAX_SUNBURST_RING_WIDTH);
    });

    test("should floor a ring at 10px when a deep hierarchy runs out of room", () => {
      const layout = computeLayout(40, 600);
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
    });

    test("should scale with the chart width between the two limits", () => {
      const small = computeLayout(4, 300);
      const large = computeLayout(4, 600);
      expect(small.centerRadius).toBe(large.centerRadius / 2);
      expect(small.ringWidth).toBe(large.ringWidth / 2);
    });
  });

  describe("getRadiusExtent", () => {
    test("should return the smallest y0 and the largest y1", () => {
      const nodes = [
        { y0: 1, y1: 2 },
        { y0: 2, y1: 3 },
        { y0: 0, y1: 1 },
      ];
      expect(getRadiusExtent(nodes)).toEqual([0, 3]);
    });

    test("should take each extreme independently of its pairing", () => {
      const nodes = [
        { y0: 5, y1: 6 },
        { y0: 1, y1: 2 },
      ];
      expect(getRadiusExtent(nodes)).toEqual([1, 6]);
    });

    test("should start the extent at the first layer's inner edge when given prepareData output", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .layer((d: Row) => d.country)
        .value((d: Row) => d.value)
        .calculate(DATA);
      const [minRadius, maxRadius] = getRadiusExtent(data);
      // the root occupies the innermost band and is filtered out, so the extent starts at
      // the first layer's inner edge rather than at 0
      expect(minRadius).toBeCloseTo(1 / 3, 12);
      expect(maxRadius).toBe(1);
    });
  });

  describe("prepareData", () => {
    test("should return one flat node per branch and leaf, without the root", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .layer((d: Row) => d.country)
        .value((d: Row) => d.value)
        .calculate(DATA);
      // 2 continents + 3 countries
      expect(data).toHaveLength(5);
      expect(data.every((d) => d.data._tag !== "root")).toBe(true);
    });

    test("should give every node the partition positions the chart needs", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .value((d: Row) => d.value)
        .calculate(DATA);
      for (const node of data) {
        expect(typeof node.x0).toBe("number");
        expect(typeof node.x1).toBe("number");
        expect(typeof node.y0).toBe("number");
        expect(typeof node.y1).toBe("number");
      }
    });

    test("should sum the values up the hierarchy", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .layer((d: Row) => d.country)
        .value((d: Row) => d.value)
        .calculate(DATA);
      const europe = data.find((d) => d.data._tag !== "root" && d.data.key === "Europa");
      expect(europe?.value).toBe(180);
    });
  });

  describe("fitting the rings to the chart", () => {
    test("should shrink the centre when the floored rings need the room", () => {
      // 12 rings would each be 8.33px wide, so the 10px floor takes 20px off the centre
      const layout = computeLayout(12, 300);
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
      expect(layout.centerRadius).toBe(30);
      expect(layout.centerRadius + layout.ringWidth * layout.numLayers).toBe(300 / 2);
    });

    test("should leave the centre alone when the rings already fit", () => {
      const layout = computeLayout(4, 600);
      expect(layout.centerRadius).toBe(100);
    });

    test("should warn when even a centre of nothing cannot hold the rings", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const layout = computeLayout(40, 300);
      expect(layout.centerRadius).toBe(0);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe("degenerate inputs", () => {
    test("should report no rings when the hierarchy has no layers", () => {
      expect(computeLayout(0, 600)).toEqual({ centerRadius: 0, numLayers: 0, ringWidth: 0 });
    });

    test("should report no rings when the chart has no width", () => {
      expect(computeLayout(3, 0)).toEqual({ centerRadius: 0, numLayers: 3, ringWidth: 0 });
    });

    test("should throw when the layer count is not a whole number of layers", () => {
      expect(() => computeLayout(-3, 600)).toThrow(/numLayers/);
      expect(() => computeLayout(2.5, 600)).toThrow(/numLayers/);
    });

    test("should throw when the width is negative", () => {
      expect(() => computeLayout(4, -300)).toThrow(/chartWidth/);
    });

    test("should report an empty radius extent when the data array is empty", () => {
      expect(getRadiusExtent([])).toEqual([0, 0]);
    });
  });

  describe("known quirks", () => {
    test("the rings can also fall short of the chart once they hit the 60px cap", () => {
      // NOTE: the mirror image of the floor, and harmless - a shallow hierarchy in a wide
      // chart simply leaves empty space outside the outermost ring.
      const layout = computeLayout(1, 1200);
      const outerRadius = layout.centerRadius + layout.ringWidth * layout.numLayers;
      expect(layout.ringWidth).toBe(MAX_SUNBURST_RING_WIDTH);
      expect(outerRadius).toBeLessThan(1200 / 2);
    });

    test("the extent ignores nodes whose positions are missing", () => {
      // NOTE: intended - d3.min and d3.max skip undefined and NaN, so a node without
      // partition positions is dropped from the extent instead of poisoning it. The chart
      // then renders that node with a NaN radius.
      const nodes = [
        { y0: 1, y1: 2 },
        { y0: undefined, y1: undefined },
        { y0: 0, y1: 5 },
      ];
      expect(getRadiusExtent(nodes)).toEqual([0, 5]);
    });

    test("prepareData is deprecated but still the only source of partition positions", () => {
      // NOTE: prepareData is marked deprecated in favour of prepareHierarchyData, but
      // prepareHierarchyData alone does not run d3.partition, so its nodes have no y0/y1 and
      // getRadiusExtent cannot be used on them. The sunburst component is unaffected - it
      // partitions a plain hierarchy itself - so the deprecation only strands this helper.
      const partitioned = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .value((d: Row) => d.value)
        .calculate(DATA);
      expect(partitioned[0]?.y0).toBeTypeOf("number");

      const plain = prepareHierarchyData<Row>()
        .layer((d) => d.continent)
        .value((d) => d.value)
        .calculate(DATA);
      expect((plain.children?.[0] as { y0?: number } | undefined)?.y0).toBeUndefined();
    });
  });
});
