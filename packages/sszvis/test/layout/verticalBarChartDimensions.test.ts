import { describe, expect, test } from "vitest";
import dimensionsVerticalBarChart from "../../src/layout/verticalBarChartDimensions.js";

// The layout uses a target ratio of 0.7 bar to 0.3 padding, then clamps the bar
// width to 48px and the padding to [2, 100].
const MAX_BAR_WIDTH = 48;
const MIN_PADDING = 2;
const MAX_PADDING = 100;

describe("verticalBarChartDimensions", () => {
  describe("unclamped layout", () => {
    test("splits the available width in the target 70/30 ratio", () => {
      const dim = dimensionsVerticalBarChart(200, 10);
      // padding = width * 0.3 / (0.3 * numPads + 0.7 * numBars)
      expect(dim.padWidth).toBeCloseTo(6.185_567, 5);
      expect(dim.barWidth).toBeCloseTo(14.432_989, 5);
      // the step is split exactly in the target ratio
      expect(dim.padRatio).toBeCloseTo(0.3, 12);
    });

    test("fills the available width exactly when nothing is clamped", () => {
      const dim = dimensionsVerticalBarChart(200, 10);
      expect(dim.barGroupWidth).toBeCloseTo(200, 9);
      expect(dim.outerRatio).toBeCloseTo(0, 12);
      expect(dim.totalWidth).toBe(200);
    });

    test("scales linearly with the available width", () => {
      const small = dimensionsVerticalBarChart(100, 12);
      const large = dimensionsVerticalBarChart(200, 12);
      expect(large.barWidth).toBeCloseTo(small.barWidth * 2, 9);
      expect(large.padWidth).toBeCloseTo(small.padWidth * 2, 9);
      expect(large.padRatio).toBeCloseTo(small.padRatio, 12);
    });

    test("always reports the requested width as totalWidth", () => {
      expect(dimensionsVerticalBarChart(640, 4).totalWidth).toBe(640);
      expect(dimensionsVerticalBarChart(0, 4).totalWidth).toBe(0);
    });
  });

  describe("bar width clamping", () => {
    test("caps the bar width at 48px and redistributes the slack into the padding", () => {
      const dim = dimensionsVerticalBarChart(800, 10);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      // padding = (width - barWidth * numBars) / numPads
      expect(dim.padWidth).toBeCloseTo(35.555_556, 6);
      expect(dim.barGroupWidth).toBeCloseTo(800, 9);
      expect(dim.outerRatio).toBeCloseTo(0, 12);
    });

    test("is continuous at the 48px cap", () => {
      // width chosen so that the unclamped bar width lands exactly on the cap: both
      // branches agree there, so the layout does not jump as the width crosses it
      const width = 665.142_857_142_857_1;
      const dim = dimensionsVerticalBarChart(width, 10);
      expect(dim.barWidth).toBeCloseTo(MAX_BAR_WIDTH, 9);
      expect(dim.padRatio).toBeCloseTo(0.3, 9);
    });
  });

  describe("padding clamping", () => {
    test("raises padding to the 2px minimum for very dense charts", () => {
      const dim = dimensionsVerticalBarChart(100, 40);
      expect(dim.padWidth).toBe(MIN_PADDING);
      expect(dim.barWidth).toBeCloseTo(1.763_224, 5);
    });

    test("lowers padding to the 100px maximum for very sparse charts", () => {
      const dim = dimensionsVerticalBarChart(10_000, 2);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      expect(dim.padWidth).toBe(MAX_PADDING);
      expect(dim.barGroupWidth).toBe(48 * 2 + 100);
      // the leftover width ends up in the outer padding ratio
      expect(dim.outerRatio).toBeCloseTo((10_000 - 196) / 2 / 148, 9);
    });
  });

  describe("derived ratios", () => {
    test("padRatio is the padding's share of one step", () => {
      const dim = dimensionsVerticalBarChart(800, 10);
      expect(dim.padRatio).toBeCloseTo(dim.padWidth / (dim.barWidth + dim.padWidth), 12);
    });

    test("outerRatio is the leftover width, halved, in step units", () => {
      const dim = dimensionsVerticalBarChart(10_000, 2);
      expect(dim.outerRatio).toBeCloseTo(
        (dim.totalWidth - dim.barGroupWidth) / 2 / (dim.barWidth + dim.padWidth),
        9,
      );
    });

    test("barGroupWidth counts all bars and the inner padding only", () => {
      const dim = dimensionsVerticalBarChart(500, 7);
      expect(dim.barGroupWidth).toBeCloseTo(dim.barWidth * 7 + dim.padWidth * 6, 9);
    });
  });

  describe("a single bar", () => {
    test("reports no padding, because it draws no gaps", () => {
      // the padding used to be recomputed over zero gaps, and the resulting Infinity was
      // masked by the 100px clamp and then fed into padRatio
      const dim = dimensionsVerticalBarChart(1000, 1);
      expect(dim.barWidth).toBe(MAX_BAR_WIDTH);
      expect(dim.padWidth).toBe(0);
      expect(dim.padRatio).toBe(0);
      expect(dim.barGroupWidth).toBe(MAX_BAR_WIDTH);
    });

    test("reports no padding below the 48px cap either", () => {
      const dim = dimensionsVerticalBarChart(30, 1);
      expect(dim.barWidth).toBe(30);
      expect(dim.padWidth).toBe(0);
      expect(dim.padRatio).toBe(0);
      expect(dim.barGroupWidth).toBe(30);
    });
  });

  describe("degenerate inputs", () => {
    test("zero bars have no dimensions to report", () => {
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

    test("a zero width has no dimensions to report", () => {
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

    test("rejects a negative width", () => {
      expect(() => dimensionsVerticalBarChart(-200, 10)).toThrow(/width/);
    });

    test("rejects a bar count that is not a whole number of bars", () => {
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
