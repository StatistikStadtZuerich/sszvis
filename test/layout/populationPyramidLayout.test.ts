import { describe, expect, test } from "vitest";
import layoutPopulationPyramid from "../../src/layout/populationPyramidLayout.js";

// The chart height follows a 4:5 portrait aspect ratio, capped at 480px; bars are at least
// 2px tall and always separated by exactly 1px.
const MAX_HEIGHT = 480;
const MIN_BAR_HEIGHT = 2;
const PADDING = 1;

describe("populationPyramidLayout", () => {
  describe("bar sizing", () => {
    test("divides the available height between the bars and their 1px gaps", () => {
      const layout = layoutPopulationPyramid(600, 20);
      // (480 - 19) / 20, rounded
      expect(layout.barHeight).toBe(23);
      expect(layout.padding).toBe(PADDING);
      expect(layout.totalHeight).toBe(20 * 23 + 19);
    });

    test("rounds the bar height to a whole pixel", () => {
      for (const numBars of [7, 13, 20, 91]) {
        const layout = layoutPopulationPyramid(600, numBars);
        expect(Number.isInteger(layout.barHeight)).toBe(true);
      }
    });

    test("caps the chart height at 480px however wide the container is", () => {
      const wide = layoutPopulationPyramid(2000, 20);
      const atCap = layoutPopulationPyramid(600, 20);
      expect(wide.barHeight).toBe(atCap.barHeight);
      expect(wide.totalHeight).toBeLessThanOrEqual(MAX_HEIGHT);
    });

    test("follows the 4:5 portrait ratio below the cap", () => {
      // 300 * 5 / 4 = 375, which is under the 480px cap
      const layout = layoutPopulationPyramid(300, 10);
      expect(layout.barHeight).toBe(Math.round((375 - 9) / 10));
      expect(layout.totalHeight).toBe(10 * 37 + 9);
    });

    test("never shrinks a bar below 2px", () => {
      const layout = layoutPopulationPyramid(300, 500);
      expect(layout.barHeight).toBe(MIN_BAR_HEIGHT);
    });
  });

  describe("positions", () => {
    test("returns one position per bar", () => {
      for (const numBars of [1, 10, 20, 500]) {
        expect(layoutPopulationPyramid(600, numBars).positions).toHaveLength(numBars);
      }
    });

    test("counts up from the bottom of the chart", () => {
      const { positions } = layoutPopulationPyramid(600, 20);
      // positions are top-edge y coordinates, and the scale's domain is the ages in ascending
      // order, so the array runs bottom bar first (largest y) up to the top bar at y 0
      expect(positions[0]).toBe(456);
      expect(positions.at(-1)).toBe(0);
    });

    test("spaces the positions one bar plus one pixel apart", () => {
      const { positions, barHeight } = layoutPopulationPyramid(600, 20);
      for (let i = 1; i < positions.length; i++) {
        expect((positions[i - 1] as number) - (positions[i] as number)).toBe(barHeight + PADDING);
      }
    });

    test("a single bar sits on the baseline", () => {
      const layout = layoutPopulationPyramid(300, 1);
      expect(layout.positions).toEqual([0]);
      expect(layout.totalHeight).toBe(layout.barHeight);
    });

    test("the bottom bar ends flush with the bottom of the chart", () => {
      const layout = layoutPopulationPyramid(600, 20);
      expect((layout.positions[0] as number) + layout.barHeight).toBe(layout.totalHeight);
    });
  });

  describe("horizontal sizing", () => {
    test("gives each side half the width on a narrow screen", () => {
      const layout = layoutPopulationPyramid(300, 10);
      expect(layout.maxBarLength).toBe(150);
    });

    test("caps a half-pyramid at 240px on a wide screen", () => {
      const layout = layoutPopulationPyramid(1000, 20);
      expect(layout.maxBarLength).toBe(240);
      expect(layout.chartPadding).toBe((1000 - 480) / 2);
    });

    test("the cap is four fifths of the portrait max height, halved", () => {
      const layout = layoutPopulationPyramid(5000, 20);
      expect(layout.maxBarLength).toBe((600 * (4 / 5)) / 2);
      // NOTE: that expression reaches into aspectRatioPortrait.MAX_HEIGHT (600) and
      // re-derives the 4:5 ratio, which only coincidentally equals this module's own
      // MAX_HEIGHT of 480. The two constants are unrelated and can drift apart.
      expect((600 * (4 / 5)) / 2).toBe(MAX_HEIGHT / 2);
    });
  });

  describe("known quirks", () => {
    test("chartPadding is 1, not 0, when the pyramid already fills the width", () => {
      // BUG: the JSDoc promises 0 when no offset is needed, but the floor is
      // Math.max(..., 1), so axes and legends are shifted one pixel right of the bars on
      // every container narrower than 480px.
      // got: chartPadding 1
      // want: 0, as documented.
      const layout = layoutPopulationPyramid(300, 10);
      expect(layout.maxBarLength * 2).toBe(300);
      expect(layout.chartPadding).toBe(1);
    });

    test("the total height ignores the 480px cap once the bars hit their 2px floor", () => {
      // NOTE: intended - the 2px floor wins over the height cap, so a pyramid with many age
      // groups grows past the aspect-ratio height. The JSDoc says totalHeight should be the
      // basis of the bounds calculation, which is what keeps this consistent.
      const layout = layoutPopulationPyramid(300, 500);
      expect(layout.totalHeight).toBe(500 * MIN_BAR_HEIGHT + 499);
      expect(layout.totalHeight).toBeGreaterThan(MAX_HEIGHT);
    });

    test("zero bars yields a NaN height and no positions", () => {
      // BUG: numBars = 0 divides by zero, so the bar height is Infinity (clamped up from
      // nothing) and totalHeight is 0 * Infinity = NaN. The loop then never runs.
      // got: { barHeight: Infinity, totalHeight: NaN, positions: [] }
      // want: a zero-height layout, or an explicit error.
      const layout = layoutPopulationPyramid(600, 0);
      expect(layout.barHeight).toBe(Number.POSITIVE_INFINITY);
      expect(layout.totalHeight).toBeNaN();
      expect(layout.positions).toEqual([]);
    });

    test("a zero width still produces 2px bars and a 1px chart padding", () => {
      // BUG: a container measured before layout gives a height of 0, but the 2px bar floor
      // and the 1px padding floor mean the layout reports a positive height for a chart
      // with no room at all.
      // got: { barHeight: 2, totalHeight: 29, maxBarLength: 0, chartPadding: 1 }
      // want: a zero-sized layout.
      const layout = layoutPopulationPyramid(0, 10);
      expect(layout.barHeight).toBe(MIN_BAR_HEIGHT);
      expect(layout.totalHeight).toBe(29);
      expect(layout.maxBarLength).toBe(0);
      expect(layout.chartPadding).toBe(1);
    });

    test("a negative width gives negative bar lengths but a positive chartPadding", () => {
      // BUG: no input validation. maxBarLength follows the negative width while
      // chartPadding is floored at 1, so the two disagree about which way the chart runs.
      // got: { maxBarLength: -100, chartPadding: 1 }
      // want: the width clamped at 0, or an explicit error.
      const layout = layoutPopulationPyramid(-200, 10);
      expect(layout.maxBarLength).toBe(-100);
      expect(layout.chartPadding).toBe(1);
    });

    test("the positions array is built by a loop rather than counted", () => {
      // NOTE: harmless today - the bar height is rounded to an integer and the padding is
      // exactly 1, so `totalHeight - barHeight` is always a whole number of steps and the
      // loop lands exactly on 0. It would drift if either value ever became fractional.
      for (const numBars of [3, 17, 64]) {
        const { positions } = layoutPopulationPyramid(600, numBars);
        expect(positions).toHaveLength(numBars);
        expect(positions.at(-1)).toBe(0);
        expect(positions.every(Number.isInteger)).toBe(true);
      }
    });
  });
});
