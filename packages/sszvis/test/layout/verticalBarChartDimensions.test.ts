import { describe, expect, test } from "vitest";
import dimensionsVerticalBarChart from "../../src/layout/verticalBarChartDimensions.js";

// The layout uses a target ratio of 0.7 bar to 0.3 padding, then clamps the bar
// width to 48px and the padding to [2, 100].
const MAX_BAR_WIDTH = 48;
const MIN_PADDING = 2;
const MAX_PADDING = 100;

describe("verticalBarChartDimensions", () => {
  describe("unclamped layout", () => {
    test("should split the available width in the target 70/30 ratio", () => {
      const dim = dimensionsVerticalBarChart(200, 10);
      // padding = width * 0.3 / (0.3 * numPads + 0.7 * numBars)
      expect(dim.padWidth).toBeCloseTo(6.185_567, 5);
      expect(dim.barWidth).toBeCloseTo(14.432_989, 5);
      // the step is split exactly in the target ratio
      expect(dim.padRatio).toBeCloseTo(0.3, 12);
    });

    test("should fill the available width exactly when nothing is clamped", () => {
      const dim = dimensionsVerticalBarChart(200, 10);
      expect(dim.barGroupWidth).toBeCloseTo(200, 9);
      expect(dim.outerRatio).toBeCloseTo(0, 12);
      expect(dim.totalWidth).toBe(200);
    });

    test("should scale linearly with the available width", () => {
      const small = dimensionsVerticalBarChart(100, 12);
      const large = dimensionsVerticalBarChart(200, 12);
      expect(large.barWidth).toBeCloseTo(small.barWidth * 2, 9);
      expect(large.padWidth).toBeCloseTo(small.padWidth * 2, 9);
      expect(large.padRatio).toBeCloseTo(small.padRatio, 12);
    });

    test("should always report the requested width as totalWidth", () => {
      expect(dimensionsVerticalBarChart(640, 4).totalWidth).toBe(640);
      expect(dimensionsVerticalBarChart(0, 4).totalWidth).toBe(0);
    });
  });

  describe("bar width clamping", () => {
    test("should cap the bar width at 48px and redistribute the slack into the padding", () => {
      const dim = dimensionsVerticalBarChart(800, 10);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      // padding = (width - barWidth * numBars) / numPads
      expect(dim.padWidth).toBeCloseTo(35.555_556, 6);
      expect(dim.barGroupWidth).toBeCloseTo(800, 9);
      expect(dim.outerRatio).toBeCloseTo(0, 12);
    });

    test("should not jump when the width crosses the 48px cap", () => {
      // width chosen so that the unclamped bar width lands exactly on the cap: both
      // branches agree there, so the layout does not jump as the width crosses it
      const width = 665.142_857_142_857_1;
      const dim = dimensionsVerticalBarChart(width, 10);
      expect(dim.barWidth).toBeCloseTo(MAX_BAR_WIDTH, 9);
      expect(dim.padRatio).toBeCloseTo(0.3, 9);
    });
  });

  describe("padding clamping", () => {
    test("should raise the padding to the 2px minimum when the chart is very dense", () => {
      const numBars = 40;
      const dim = dimensionsVerticalBarChart(100, numBars);
      expect(dim.padWidth).toBe(MIN_PADDING);
      // the bar width comes from the unclamped 70/30 target and is never recomputed:
      // width * 0.7 / (0.3 * numPads + 0.7 * numBars)
      expect(dim.barWidth).toBeCloseTo((100 * 0.7) / (0.3 * (numBars - 1) + 0.7 * numBars), 9);
    });

    test("should lower the padding to the 100px maximum when the chart is very sparse", () => {
      const dim = dimensionsVerticalBarChart(10_000, 2);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      expect(dim.padWidth).toBe(MAX_PADDING);
      expect(dim.barGroupWidth).toBe(48 * 2 + 100);
      // the leftover width ends up in the outer padding ratio
      expect(dim.outerRatio).toBeCloseTo((10_000 - 196) / 2 / 148, 9);
    });
  });

  describe("derived ratios", () => {
    test("should report ratios that agree with the reported widths", () => {
      const clamped = dimensionsVerticalBarChart(800, 10);
      // padRatio is the padding's share of one step
      expect(clamped.padRatio).toBeCloseTo(
        clamped.padWidth / (clamped.barWidth + clamped.padWidth),
        12,
      );

      const sparse = dimensionsVerticalBarChart(10_000, 2);
      // outerRatio is the leftover width, halved, in step units
      expect(sparse.outerRatio).toBeCloseTo(
        (sparse.totalWidth - sparse.barGroupWidth) / 2 / (sparse.barWidth + sparse.padWidth),
        9,
      );

      const seven = dimensionsVerticalBarChart(500, 7);
      // barGroupWidth counts all the bars and the inner padding only
      expect(seven.barGroupWidth).toBeCloseTo(seven.barWidth * 7 + seven.padWidth * 6, 9);
    });
  });

  describe("a single bar", () => {
    test("should report no padding when a single bar draws no gaps", () => {
      // the padding used to be recomputed over zero gaps, and the resulting Infinity was
      // masked by the 100px clamp and then fed into padRatio
      const dim = dimensionsVerticalBarChart(1000, 1);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      expect(dim.padWidth).toBe(0);
      expect(dim.padRatio).toBe(0);
      expect(dim.barGroupWidth).toBe(MAX_BAR_WIDTH);
    });

    test("should report no padding when a single bar stays below the 48px cap", () => {
      const dim = dimensionsVerticalBarChart(30, 1);
      expect(dim.barWidth).toBe(30);
      expect(dim.padWidth).toBe(0);
      expect(dim.padRatio).toBe(0);
      expect(dim.barGroupWidth).toBe(30);
    });
  });

  describe("degenerate inputs", () => {
    test("should report no dimensions but echo the width when there are no bars", () => {
      const dim = dimensionsVerticalBarChart(500, 0);
      expect(dim).toEqual({
        barWidth: 0,
        padWidth: 0,
        padRatio: 0,
        outerRatio: 0,
        barGroupWidth: 0,
        // the requested width is still reported back
        totalWidth: 500,
      });
    });

    test("should report no dimensions when the width is zero", () => {
      // a container measured before its first paint reports a width of 0
      const dim = dimensionsVerticalBarChart(0, 10);
      expect(dim).toEqual({
        barWidth: 0,
        padWidth: 0,
        padRatio: 0,
        outerRatio: 0,
        barGroupWidth: 0,
        totalWidth: 0,
      });
    });

    test("should throw when the width is negative", () => {
      expect(() => dimensionsVerticalBarChart(-200, 10)).toThrow(/width/);
    });

    test("should throw when the bar count is not a whole number of bars", () => {
      expect(() => dimensionsVerticalBarChart(500, -3)).toThrow(/numBars/);
      expect(() => dimensionsVerticalBarChart(500, 2.5)).toThrow(/numBars/);
    });
  });

  describe("known quirks", () => {
    test("clamped padding is not compensated for, so the bars can overflow the width", () => {
      // NOTE: intended - the JSDoc states the computed layout is not guaranteed to fit
      // inside the given width. The bar width is computed before the padding is clamped
      // and is never recomputed afterwards, so raising the padding to MIN_PADDING pushes
      // the bar group past the available width.
      const dim = dimensionsVerticalBarChart(100, 40);
      expect(dim.barGroupWidth).toBeGreaterThan(dim.totalWidth);
      // the overflow surfaces as a negative outer ratio
      expect(dim.outerRatio).toBeLessThan(0);
    });

    test("padRatio drifts away from the 0.3 target once the padding is clamped", () => {
      // NOTE: intended - padRatio is derived from the clamped padding, not from the target
      // ratio, so any clamp moves it. It stays inside the [0, 1) range a band scale needs
      // as long as barWidth is positive.
      const dim = dimensionsVerticalBarChart(100, 40);
      expect(dim.padRatio).toBeGreaterThan(0.3);
      expect(dim.padRatio).toBeLessThan(1);
    });
  });
});
