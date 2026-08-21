import { describe, expect, test } from "vitest";
import dimensionsHorizontalBarChart from "../../src/layout/horizontalBarChartDimensions.js";

// The layout is fixed: 24px bars separated by 20px of padding, with no outer padding.
const DEFAULT_HEIGHT = 24;
const MIN_PADDING = 20;

describe("horizontalBarChartDimensions", () => {
  describe("fixed dimensions", () => {
    test("uses a constant 24px bar height and 20px padding", () => {
      const dim = dimensionsHorizontalBarChart(5);
      expect(dim.barHeight).toBe(DEFAULT_HEIGHT);
      expect(dim.padHeight).toBe(MIN_PADDING);
    });

    test("keeps the bar height and padding independent of the bar count", () => {
      for (const numBars of [1, 2, 17, 500]) {
        const dim = dimensionsHorizontalBarChart(numBars);
        expect(dim.barHeight).toBe(DEFAULT_HEIGHT);
        expect(dim.padHeight).toBe(MIN_PADDING);
      }
    });

    test("padRatio is the padding's share of one step", () => {
      const dim = dimensionsHorizontalBarChart(5);
      expect(dim.padRatio).toBeCloseTo(MIN_PADDING / (DEFAULT_HEIGHT + MIN_PADDING), 12);
      expect(dim.padRatio).toBeCloseTo(0.454_545, 5);
    });

    test("outerRatio is always zero", () => {
      expect(dimensionsHorizontalBarChart(1).outerRatio).toBe(0);
      expect(dimensionsHorizontalBarChart(50).outerRatio).toBe(0);
    });

    test("axisOffset lifts the axis half a bar plus 10px", () => {
      expect(dimensionsHorizontalBarChart(5).axisOffset).toBe(-(DEFAULT_HEIGHT / 2) - 10);
      expect(dimensionsHorizontalBarChart(5).axisOffset).toBe(-22);
      // it is derived from the constant bar height, so it never varies
      expect(dimensionsHorizontalBarChart(1).axisOffset).toBe(-22);
      expect(dimensionsHorizontalBarChart(0).axisOffset).toBe(-22);
    });
  });

  describe("group height", () => {
    test("counts every bar and the padding between them", () => {
      const dim = dimensionsHorizontalBarChart(4);
      expect(dim.barGroupHeight).toBe(DEFAULT_HEIGHT * 4 + MIN_PADDING * 3);
      expect(dim.barGroupHeight).toBe(156);
    });

    test("grows by one step per additional bar", () => {
      const step = DEFAULT_HEIGHT + MIN_PADDING;
      for (let n = 1; n < 6; n++) {
        expect(dimensionsHorizontalBarChart(n + 1).barGroupHeight).toBe(
          dimensionsHorizontalBarChart(n).barGroupHeight + step
        );
      }
    });

    test("a single bar has no padding at all", () => {
      const dim = dimensionsHorizontalBarChart(1);
      expect(dim.barGroupHeight).toBe(DEFAULT_HEIGHT);
      expect(dim.totalHeight).toBe(DEFAULT_HEIGHT);
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

    test("zero bars yields a negative group height", () => {
      // BUG: numPads = numBars - 1 goes to -1, so the padding term subtracts a full 20px
      // from an otherwise empty layout.
      // got: { barGroupHeight: -20, totalHeight: -20 }
      // want: 0 for an empty chart.
      const dim = dimensionsHorizontalBarChart(0);
      expect(dim.barGroupHeight).toBe(-MIN_PADDING);
      expect(dim.totalHeight).toBe(-MIN_PADDING);
      // the fixed properties stay valid, so the negative height is easy to miss: the
      // returned object is half sensible and half nonsense
      expect(dim.barHeight).toBe(DEFAULT_HEIGHT);
      expect(dim.padRatio).toBeCloseTo(0.454_545, 5);
      expect(dim.axisOffset).toBe(-22);
      // one bar is the last count that still works: numPads is 0, not negative
      expect(dimensionsHorizontalBarChart(1).barGroupHeight).toBe(DEFAULT_HEIGHT);
    });

    test("a negative or fractional bar count is accepted without complaint", () => {
      // BUG: no input validation. A fractional count produces a fractional group height and
      // a negative count a negative one, rather than an error or a clamp.
      // got: dimensionsHorizontalBarChart(2.5).barGroupHeight === 90
      // want: reject or round a non-integer bar count.
      expect(dimensionsHorizontalBarChart(2.5).barGroupHeight).toBe(24 * 2.5 + 20 * 1.5);
      expect(dimensionsHorizontalBarChart(-3).barGroupHeight).toBeLessThan(0);
    });

    test("the available height is never an input, so the chart cannot be fitted", () => {
      // NOTE: intended - unlike the vertical layout, this function takes no width/height
      // budget. The caller is expected to size the container from barGroupHeight, not the
      // other way round, so a long series simply grows the chart.
      expect(dimensionsHorizontalBarChart(100).barGroupHeight).toBe(24 * 100 + 20 * 99);
    });
  });
});
