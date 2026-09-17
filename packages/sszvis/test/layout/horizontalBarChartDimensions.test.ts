import { describe, expect, test } from "vitest";
import dimensionsHorizontalBarChart from "../../src/layout/horizontalBarChartDimensions.js";

// The layout is fixed: 24px bars separated by 20px of padding, with no outer padding.
const DEFAULT_HEIGHT = 24;
const MIN_PADDING = 20;

describe("horizontalBarChartDimensions", () => {
  describe("fixed dimensions", () => {
    test("should report the fixed 24/20 geometry and its derived ratios, whatever the bar count", () => {
      for (const numBars of [1, 2, 17, 50, 500]) {
        const dim = dimensionsHorizontalBarChart(numBars);
        expect(dim.barHeight).toBe(DEFAULT_HEIGHT);
        expect(dim.padHeight).toBe(MIN_PADDING);
        expect(dim.padRatio).toBeCloseTo(MIN_PADDING / (DEFAULT_HEIGHT + MIN_PADDING), 12);
        expect(dim.padRatio).toBeCloseTo(0.454_545, 5);
        expect(dim.outerRatio).toBe(0);
      }
    });

    test("should lift the axis half a bar plus 10px, whatever the bar count", () => {
      expect(dimensionsHorizontalBarChart(5).axisOffset).toBe(-(DEFAULT_HEIGHT / 2) - 10);
      expect(dimensionsHorizontalBarChart(5).axisOffset).toBe(-22);
      // it is derived from the constant bar height, so it never varies
      expect(dimensionsHorizontalBarChart(1).axisOffset).toBe(-22);
      expect(dimensionsHorizontalBarChart(0).axisOffset).toBe(-22);
    });
  });

  describe("group height", () => {
    test("should count every bar and the padding between them", () => {
      const dim = dimensionsHorizontalBarChart(4);
      expect(dim.barGroupHeight).toBe(DEFAULT_HEIGHT * 4 + MIN_PADDING * 3);
      expect(dim.barGroupHeight).toBe(156);
    });

    test("should grow by one step when one more bar is added", () => {
      const step = DEFAULT_HEIGHT + MIN_PADDING;
      for (let n = 1; n < 6; n++) {
        expect(dimensionsHorizontalBarChart(n + 1).barGroupHeight).toBe(
          dimensionsHorizontalBarChart(n).barGroupHeight + step,
        );
      }
    });

    test("should report no padding at all when there is a single bar", () => {
      const dim = dimensionsHorizontalBarChart(1);
      expect(dim.barGroupHeight).toBe(DEFAULT_HEIGHT);
      expect(dim.totalHeight).toBe(DEFAULT_HEIGHT);
    });
  });

  describe("degenerate inputs", () => {
    test("should occupy no height when there are no bars", () => {
      const dim = dimensionsHorizontalBarChart(0);
      expect(dim.barGroupHeight).toBe(0);
      expect(dim.totalHeight).toBe(0);
      // the fixed properties are constants and stay valid
      expect(dim.barHeight).toBe(DEFAULT_HEIGHT);
      expect(dim.padHeight).toBe(MIN_PADDING);
      expect(dim.axisOffset).toBe(-22);
    });

    test("should throw when the bar count is not a whole number of bars", () => {
      expect(() => dimensionsHorizontalBarChart(2.5)).toThrow(/numBars/);
      expect(() => dimensionsHorizontalBarChart(-3)).toThrow(/numBars/);
    });
  });

  describe("known quirks", () => {
    test("totalHeight always equals barGroupHeight", () => {
      // NOTE: the JSDoc describes totalHeight as barGroupHeight plus the outer padding, but
      // outerRatio is hard-coded to 0, so the `outerRatio * (barHeight + padding) * 2` term
      // is always 0 and the two properties are indistinguishable. The distinction is kept
      // so the shape matches the vertical bar chart layout.
      for (const numBars of [1, 3, 42]) {
        const dim = dimensionsHorizontalBarChart(numBars);
        expect(dim.totalHeight).toBe(dim.barGroupHeight);
      }
    });

    test("the available height is never an input, so the chart cannot be fitted", () => {
      // NOTE: intended - unlike the vertical layout, this function takes no width/height
      // budget. The caller is expected to size the container from barGroupHeight, not the
      // other way round, so a long series simply grows the chart.
      expect(dimensionsHorizontalBarChart(100).barGroupHeight).toBe(24 * 100 + 20 * 99);
    });
  });
});
