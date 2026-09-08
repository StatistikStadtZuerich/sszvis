import { describe, expect, test } from "vitest";
import layoutStackedAreaMultiples from "../../src/layout/stackedAreaMultiplesLayout.js";

describe("stackedAreaMultiplesLayout", () => {
  describe("band geometry", () => {
    test("splits the height into one band per stack, separated by padding", () => {
      const layout = layoutStackedAreaMultiples(300, 3);
      // step = height / (num - pct); band and pad share the step in a (1 - pct) / pct ratio
      expect(layout.bandHeight).toBeCloseTo(93.103_448, 5);
      expect(layout.padHeight).toBeCloseTo(10.344_828, 5);
      expect(layout.bandHeight + layout.padHeight).toBeCloseTo(300 / (3 - 0.1), 9);
    });

    test("defaults the padding ratio to 0.1 of a step", () => {
      const layout = layoutStackedAreaMultiples(300, 3);
      expect(layout.padHeight / (layout.bandHeight + layout.padHeight)).toBeCloseTo(0.1, 12);
    });

    test("honours an explicit padding ratio", () => {
      const layout = layoutStackedAreaMultiples(300, 3, 0.5);
      expect(layout.bandHeight).toBe(60);
      expect(layout.padHeight).toBe(60);
    });

    test("an explicit padding ratio of 0 means gapless multiples", () => {
      const zero = layoutStackedAreaMultiples(300, 3, 0);
      expect(zero.padHeight).toBe(0);
      expect(zero.bandHeight).toBe(100);
      expect(zero.range).toEqual([100, 200, 300]);
    });

    test("a padding ratio of 1 leaves no room for the bands", () => {
      const layout = layoutStackedAreaMultiples(300, 3, 1);
      expect(layout.bandHeight).toBe(0);
      expect(layout.padHeight).toBe(150);
    });
  });

  describe("baseline range", () => {
    test("returns one baseline per stack", () => {
      expect(layoutStackedAreaMultiples(300, 3).range).toHaveLength(3);
      expect(layoutStackedAreaMultiples(500, 5).range).toHaveLength(5);
      expect(layoutStackedAreaMultiples(400, 7).range).toHaveLength(7);
      expect(layoutStackedAreaMultiples(50, 20).range).toHaveLength(20);
    });

    test("counts downwards from the top, starting at the bottom of the first band", () => {
      const { range, bandHeight } = layoutStackedAreaMultiples(300, 3);
      expect(range[0]).toBeCloseTo(bandHeight, 9);
      expect(range.every((v, i) => i === 0 || v > (range[i - 1] as number))).toBe(true);
    });

    test("the last baseline sits on the bottom of the chart", () => {
      const { range } = layoutStackedAreaMultiples(300, 3);
      expect(range.at(-1)).toBeCloseTo(300, 9);
    });

    test("consecutive baselines are one step apart", () => {
      const { range, bandHeight, padHeight } = layoutStackedAreaMultiples(500, 5);
      const step = bandHeight + padHeight;
      for (let i = 1; i < range.length; i++) {
        expect((range[i] as number) - (range[i - 1] as number)).toBeCloseTo(step, 9);
      }
    });

    test("a single stack fills the whole height", () => {
      const layout = layoutStackedAreaMultiples(1000, 1);
      expect(layout.range).toEqual([1000]);
      expect(layout.bandHeight).toBe(1000);
      // the padding is still computed, even though nothing is between anything
      expect(layout.padHeight).toBeCloseTo(111.111_111, 5);
    });
  });

  describe("degenerate inputs", () => {
    const EMPTY = { range: [], bandHeight: 0, padHeight: 0 };

    test("a zero height has no band to lay out", () => {
      // the step would be 0, so the baseline loop could never reach the bottom of the chart
      expect(layoutStackedAreaMultiples(0, 5)).toEqual(EMPTY);
    });

    test("zero stacks have no band to lay out", () => {
      // the step would be negative, so the baselines would march upwards without bound
      expect(layoutStackedAreaMultiples(300, 0)).toEqual(EMPTY);
    });

    test("an infinite step has no band to lay out", () => {
      // num - pct is exactly zero in both of these, so the step divides by zero. Guarding
      // only on step > 0 let Infinity through, which gave bandHeight = Infinity * 0 = NaN
      // for the first and a NaN padHeight for the second.
      expect(layoutStackedAreaMultiples(300, 1, 1)).toEqual(EMPTY);
      expect(layoutStackedAreaMultiples(300, 0, 0)).toEqual(EMPTY);
    });

    test("rejects a negative height", () => {
      expect(() => layoutStackedAreaMultiples(-300, 3)).toThrow(/height/);
    });

    test("rejects a padding ratio outside [0, 1]", () => {
      expect(() => layoutStackedAreaMultiples(300, 3, 4)).toThrow(/pct/);
      expect(() => layoutStackedAreaMultiples(300, 3, 3)).toThrow(/pct/);
      expect(() => layoutStackedAreaMultiples(300, 3, -1)).toThrow(/pct/);
      expect(() => layoutStackedAreaMultiples(300, 3, Number.NaN)).toThrow(/pct/);
    });

    test("rejects a stack count that is not a whole number of stacks", () => {
      // 0.1 and 0.5 are the counts that used to divide by zero and to empty the range
      expect(() => layoutStackedAreaMultiples(300, 0.1)).toThrow(/num/);
      expect(() => layoutStackedAreaMultiples(300, 0.5)).toThrow(/num/);
      expect(() => layoutStackedAreaMultiples(300, -2)).toThrow(/num/);
    });
  });

  describe("baseline count", () => {
    test("returns exactly one baseline per stack, at any height", () => {
      // The loop terminates on the stack count rather than on an absolute 1px slack, so a
      // sub-pixel step no longer buys an extra iteration or two. A chart drawn into a few
      // pixels - mid-entrance, or before a flex parent has settled - gets as many bands as
      // it has series.
      expect(layoutStackedAreaMultiples(1, 3).range).toHaveLength(3);
      expect(layoutStackedAreaMultiples(0.001, 5).range).toHaveLength(5);
      for (const [height, num] of [
        [1, 3],
        [9, 3],
        [300, 3],
        [400, 7],
      ] as const) {
        expect(layoutStackedAreaMultiples(height, num).range).toHaveLength(num);
      }
    });

    test("the num-th baseline always lands exactly on the chart height", () => {
      // NOTE: step * (num - pct) === height by construction, so the last baseline is always
      // `height`. Terminating on the count rather than on a pixel slack preserves that at
      // every height, including the sub-pixel ones where the slack used to overshoot.
      for (const [height, num] of [
        [1, 3], // step 0.345px: the sub-pixel case the old 1px slack overshot
        [9, 3],
        [300, 3],
        [400, 7],
      ] as const) {
        expect(layoutStackedAreaMultiples(height, num).range[num - 1]).toBeCloseTo(height, 9);
      }
    });
  });
});
