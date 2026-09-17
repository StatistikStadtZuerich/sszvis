import { describe, expect, test } from "vitest";
import layoutPopulationPyramid from "../../src/layout/populationPyramidLayout.js";

// The chart height follows a 4:5 portrait aspect ratio, capped at 480px; bars are at least
// 2px tall and always separated by exactly 1px.
const MAX_HEIGHT = 480;
const MIN_BAR_HEIGHT = 2;
const PADDING = 1;

describe("populationPyramidLayout", () => {
  describe("bar sizing", () => {
    test("should divide the available height between the bars and their 1px gaps", () => {
      const layout = layoutPopulationPyramid(600, 20);
      // (480 - 19) / 20, rounded
      expect(layout.barHeight).toBe(23);
      expect(layout.padding).toBe(PADDING);
      expect(layout.totalHeight).toBe(20 * 23 + 19);
    });

    test("should round the bar height to a whole pixel", () => {
      for (const numBars of [7, 13, 20, 91]) {
        const layout = layoutPopulationPyramid(600, numBars);
        expect(Number.isInteger(layout.barHeight)).toBe(true);
      }
    });

    test("should cap the chart height at 480px, however wide the container is", () => {
      const wide = layoutPopulationPyramid(2000, 20);
      const atCap = layoutPopulationPyramid(600, 20);
      expect(wide.barHeight).toBe(atCap.barHeight);
      expect(wide.totalHeight).toBeLessThanOrEqual(MAX_HEIGHT);
    });

    test("should follow the 4:5 portrait ratio when the height stays below the cap", () => {
      // 300 * 5 / 4 = 375, which is under the 480px cap
      const layout = layoutPopulationPyramid(300, 10);
      expect(layout.barHeight).toBe(Math.round((375 - 9) / 10));
      expect(layout.totalHeight).toBe(10 * 37 + 9);
    });

    test("should keep the bar height at 2px when there are too many bars to fit", () => {
      const layout = layoutPopulationPyramid(300, 500);
      expect(layout.barHeight).toBe(MIN_BAR_HEIGHT);
    });
  });

  describe("positions", () => {
    test("should return one position per bar", () => {
      for (const numBars of [1, 10, 20, 500]) {
        expect(layoutPopulationPyramid(600, numBars).positions).toHaveLength(numBars);
      }
    });

    test("should count up from the bottom of the chart", () => {
      const numBars = 20;
      const { positions, barHeight } = layoutPopulationPyramid(600, numBars);
      // positions are top-edge y coordinates, and the scale's domain is the ages in ascending
      // order, so the array runs bottom bar first (largest y) up to the top bar at y 0
      expect(positions[0]).toBe((numBars - 1) * (barHeight + PADDING));
      expect(positions.at(-1)).toBe(0);
    });

    test("should space the positions one bar plus one pixel apart", () => {
      const { positions, barHeight } = layoutPopulationPyramid(600, 20);
      for (let i = 1; i < positions.length; i++) {
        expect((positions[i - 1] as number) - (positions[i] as number)).toBe(barHeight + PADDING);
      }
    });

    test("should sit on the baseline when there is a single bar", () => {
      const layout = layoutPopulationPyramid(300, 1);
      expect(layout.positions).toEqual([0]);
      expect(layout.totalHeight).toBe(layout.barHeight);
    });

    test("should end the bottom bar flush with the bottom of the chart", () => {
      const layout = layoutPopulationPyramid(600, 20);
      expect((layout.positions[0] as number) + layout.barHeight).toBe(layout.totalHeight);
    });
  });

  describe("horizontal sizing", () => {
    test("should give each side half the width and no padding when the screen is narrow", () => {
      const layout = layoutPopulationPyramid(300, 10);
      expect(layout.maxBarLength).toBe(150);
      expect(layout.maxBarLength * 2).toBe(300);
      expect(layout.chartPadding).toBe(0);
    });

    test("should cap a half-pyramid at 240px when the screen is wide", () => {
      const layout = layoutPopulationPyramid(1000, 20);
      expect(layout.maxBarLength).toBe(240);
      expect(layout.chartPadding).toBe((1000 - 480) / 2);
    });

    test("should cap a half-pyramid at half the chart's own maximum height", () => {
      const layout = layoutPopulationPyramid(5000, 20);
      expect(layout.maxBarLength).toBe(MAX_HEIGHT / 2);
    });
  });

  describe("degenerate inputs", () => {
    const EMPTY = {
      barHeight: 0,
      padding: 0,
      totalHeight: 0,
      positions: [],
      maxBarLength: 0,
      chartPadding: 0,
    };

    test("should report no dimensions when the pyramid has no bars", () => {
      expect(layoutPopulationPyramid(600, 0)).toEqual(EMPTY);
    });

    test("should report no dimensions when the container has no width", () => {
      expect(layoutPopulationPyramid(0, 10)).toEqual(EMPTY);
    });

    test("should throw when the width is negative", () => {
      expect(() => layoutPopulationPyramid(-200, 10)).toThrow(/spaceWidth/);
    });

    test("should throw when the bar count is not a whole number of bars", () => {
      expect(() => layoutPopulationPyramid(600, 2.5)).toThrow(/numBars/);
      expect(() => layoutPopulationPyramid(600, -1)).toThrow(/numBars/);
    });
  });

  describe("known quirks", () => {
    test("the total height ignores the 480px cap once the bars hit their 2px floor", () => {
      // NOTE: intended - the 2px floor wins over the height cap, so a pyramid with many age
      // groups grows past the aspect-ratio height. The JSDoc says totalHeight should be the
      // basis of the bounds calculation, which is what keeps this consistent.
      const layout = layoutPopulationPyramid(300, 500);
      expect(layout.totalHeight).toBe(500 * MIN_BAR_HEIGHT + 499);
      expect(layout.totalHeight).toBeGreaterThan(MAX_HEIGHT);
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
