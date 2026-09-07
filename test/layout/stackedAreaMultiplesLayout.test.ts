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

    test("a padding ratio larger than the stack count has no band to lay out", () => {
      expect(layoutStackedAreaMultiples(300, 3, 4)).toEqual(EMPTY);
    });

    test("rejects a negative height", () => {
      expect(() => layoutStackedAreaMultiples(-300, 3)).toThrow(/height/);
    });

    test("rejects a stack count that is not a whole number of stacks", () => {
      // 0.1 and 0.5 are the counts that used to divide by zero and to empty the range
      expect(() => layoutStackedAreaMultiples(300, 0.1)).toThrow(/num/);
      expect(() => layoutStackedAreaMultiples(300, 0.5)).toThrow(/num/);
      expect(() => layoutStackedAreaMultiples(300, -2)).toThrow(/num/);
    });
  });

  describe("known quirks", () => {
    test("the loop terminates on an absolute 1px tolerance, so small charts get extra bands", () => {
      // BUG: the baseline loop runs `while (level - height < 1)`. The 1 is an absolute pixel
      // slack, not a fraction of the step, so whenever a step is smaller than about 1px the
      // loop emits more baselines than there are stacks.
      // got: 5 baselines for 3 stacks in a 1px-high chart
      // want: exactly `num` baselines at any height.
      const layout = layoutStackedAreaMultiples(1, 3);
      expect(layout.range).toHaveLength(5);
      expect(layout.range.at(-1)).toBeGreaterThan(1);
    });

    test("an explicit padding ratio of 0 is replaced by the 0.1 default", () => {
      // BUG: the default is applied with `pct || (pct = 0.1)`, so the falsy-but-meaningful
      // value 0 - "no gap between the multiples" - cannot be requested.
      // got: padHeight 10.34 for pct 0
      // want: padHeight 0.
      const zero = layoutStackedAreaMultiples(300, 3, 0);
      const omitted = layoutStackedAreaMultiples(300, 3);
      expect(zero).toEqual(omitted);
      expect(zero.padHeight).toBeGreaterThan(0);
      // every other falsy value is swallowed the same way
      expect(layoutStackedAreaMultiples(300, 3, Number.NaN)).toEqual(omitted);
    });

    test("a pct equal to num emits a single -Infinity baseline", () => {
      // BUG: step is Infinity here, and bandHeight is Infinity * (1 - 3) = -Infinity, which
      // passes the loop condition once before `level += step` makes it NaN and stops the
      // loop. The single baseline is unusable as an ordinal scale range.
      // got: range [-Infinity]
      // want: an empty range, or a guard on num.
      const layout = layoutStackedAreaMultiples(300, 3, 3);
      expect(layout.range).toEqual([Number.NEGATIVE_INFINITY]);
    });

    test("the num-th baseline always lands exactly on the chart height", () => {
      // NOTE: intended, and the reason the loop can use an absolute 1px slack at all:
      // step * (num - pct) === height by construction, so baseline number `num` is always
      // `height`. The slack only exists to survive the rounding error in that identity, and
      // it is only visible when a step is smaller than 1px (see the small-chart BUG above).
      for (const [height, num] of [
        [9, 3],
        [300, 3],
        [400, 7],
      ] as const) {
        expect(layoutStackedAreaMultiples(height, num).range[num - 1]).toBeCloseTo(height, 9);
      }
    });
  });
});
