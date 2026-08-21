import { describe, expect, test } from "vitest";
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
    test("gives the centre circle a third of the radius", () => {
      const layout = computeLayout(3, 600);
      expect(layout.centerRadius).toBe(100);
      expect(layout.centerRadius).toBe(600 / 6);
    });

    test("divides the remaining radius between the rings", () => {
      const layout = computeLayout(4, 600);
      // (300 - 100) / 4
      expect(layout.ringWidth).toBe(50);
      expect(layout.centerRadius + layout.ringWidth * 4).toBe(300);
    });

    test("passes the layer count straight through", () => {
      expect(computeLayout(3, 600).numLayers).toBe(3);
      expect(computeLayout(7, 600).numLayers).toBe(7);
    });

    test("caps a ring at 60px", () => {
      // one layer in a wide chart would otherwise take the whole 200px
      const layout = computeLayout(1, 600);
      expect(layout.ringWidth).toBe(MAX_SUNBURST_RING_WIDTH);
    });

    test("floors a ring at 10px", () => {
      const layout = computeLayout(40, 600);
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
    });

    test("scales with the chart width between the two limits", () => {
      const small = computeLayout(4, 300);
      const large = computeLayout(4, 600);
      expect(small.centerRadius).toBe(large.centerRadius / 2);
      expect(small.ringWidth).toBe(large.ringWidth / 2);
    });
  });

  describe("getRadiusExtent", () => {
    test("returns the smallest y0 and the largest y1", () => {
      const nodes = [
        { y0: 1, y1: 2 },
        { y0: 2, y1: 3 },
        { y0: 0, y1: 1 },
      ];
      expect(getRadiusExtent(nodes)).toEqual([0, 3]);
    });

    test("ignores the pairing, taking each extreme independently", () => {
      const nodes = [
        { y0: 5, y1: 6 },
        { y0: 1, y1: 2 },
      ];
      expect(getRadiusExtent(nodes)).toEqual([1, 6]);
    });

    test("works on the output of prepareData", () => {
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
    test("returns one flat node per branch and leaf, without the root", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .layer((d: Row) => d.country)
        .value((d: Row) => d.value)
        .calculate(DATA);
      // 2 continents + 3 countries
      expect(data).toHaveLength(5);
      expect(data.every((d) => d.data._tag !== "root")).toBe(true);
    });

    test("gives every node the partition positions the chart needs", () => {
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

    test("sums the values up the hierarchy", () => {
      const data = prepareData<Row>()
        .layer((d: Row) => d.continent)
        .layer((d: Row) => d.country)
        .value((d: Row) => d.value)
        .calculate(DATA);
      const europe = data.find((d) => d.data._tag !== "root" && d.data.key === "Europa");
      expect(europe?.value).toBe(180);
    });

    test("is chainable in any order", () => {
      const builder = prepareData<Row>();
      expect(builder.value((d: Row) => d.value)).toBe(builder);
      expect(builder.layer((d: Row) => d.continent)).toBe(builder);
      expect(builder.sort(() => 0)).toBe(builder);
    });
  });

  describe("known quirks", () => {
    test("the rings can overflow the chart once they hit the 10px floor", () => {
      // BUG: centerRadius is always a sixth of the width, and the ring width is floored at
      // 10px without re-checking that the rings still fit. A deep hierarchy in a narrow
      // chart therefore draws outside its own bounds.
      // got: outer radius 450 in a chart whose half-width is 150
      // want: the centre radius or the layer count reduced so the chart fits.
      const layout = computeLayout(40, 300);
      const outerRadius = layout.centerRadius + layout.ringWidth * layout.numLayers;
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
      expect(outerRadius).toBeGreaterThan(300 / 2);
    });

    test("the rings can also fall short of the chart once they hit the 60px cap", () => {
      // NOTE: the mirror image of the floor, and harmless - a shallow hierarchy in a wide
      // chart simply leaves empty space outside the outermost ring.
      const layout = computeLayout(1, 1200);
      const outerRadius = layout.centerRadius + layout.ringWidth * layout.numLayers;
      expect(layout.ringWidth).toBe(MAX_SUNBURST_RING_WIDTH);
      expect(outerRadius).toBeLessThan(1200 / 2);
    });

    test("zero layers gives a full-width ring instead of no rings", () => {
      // BUG: numLayers = 0 divides by zero. The resulting Infinity is caught by the 60px
      // cap, so the layout looks valid and reports a ring width for a chart with no rings.
      // got: { ringWidth: 60, numLayers: 0 }
      // want: a zero ring width, or an explicit error.
      const layout = computeLayout(0, 600);
      expect(layout.ringWidth).toBe(MAX_SUNBURST_RING_WIDTH);
      expect(layout.numLayers).toBe(0);
    });

    test("a negative layer count is floored to a 10px ring", () => {
      // BUG: no input validation. A negative count produces a negative ring width that the
      // 10px floor turns back into a positive one, so the error is completely hidden.
      // got: ringWidth 10
      // want: an explicit error.
      expect(computeLayout(-3, 600).ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
    });

    test("a negative width gives a negative centre and a positive ring", () => {
      // BUG: no validation of chartWidth either. The centre radius follows the negative
      // width while the ring width is floored back to 10px, so the two disagree about which
      // way the chart grows.
      // got: { centerRadius: -50, ringWidth: 10 }
      // want: an explicit error.
      const layout = computeLayout(4, -300);
      expect(layout.centerRadius).toBe(-50);
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
    });

    test("a zero width still reports a 10px ring", () => {
      // BUG: a container measured before layout gives width 0, but the ring floor means the
      // layout claims a 10px ring around a zero-radius centre.
      // got: { centerRadius: 0, ringWidth: 10 }
      // want: a zero-sized layout.
      const layout = computeLayout(3, 0);
      expect(layout.centerRadius).toBe(0);
      expect(layout.ringWidth).toBe(MIN_SUNBURST_RING_WIDTH);
    });

    test("an empty data array gives an extent of undefined", () => {
      // BUG: d3.min and d3.max are undefined for an empty array, so the extent is
      // [undefined, undefined]. Used as a scale domain, that produces a NaN radius for
      // every node rather than an empty chart.
      // got: [undefined, undefined]
      // want: [0, 0], or an explicit error.
      expect(getRadiusExtent([])).toEqual([undefined, undefined]);
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
