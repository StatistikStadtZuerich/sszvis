import { describe, expect, test } from "vitest";
import dimensionsHeatTable from "../../src/layout/heatTableDimensions.js";
import { describesTheLayoutContract } from "../support/layoutConformance.js";

// A box side is the available width divided between the columns, capped at 30px.
const DEFAULT_SIDE = 30;

describe("heatTableDimensions", () => {
  const EMPTY = { side: 0, paddedSide: 0, padRatio: 0, width: 0, height: 0, centeredOffset: 0 };

  describe("box sizing", () => {
    test("should cap the box side at 30px when there is room to spare", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.paddedSide).toBe(DEFAULT_SIDE + 2);
    });

    test("should shrink the box side when the container is too narrow for 30px boxes", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      // (100 - 2 * 9) / 10
      expect(dim.side).toBeCloseTo(8.2, 9);
      expect(dim.paddedSide).toBeCloseTo(10.2, 9);
    });

    test("should report padRatio as the padding's share of one padded side", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.padRatio).toBeCloseTo(2 / 32, 12);
      expect(dim.padRatio).toBeCloseTo(0.0625, 12);
    });

    test("should give touching boxes and a zero padRatio when the padding is zero", () => {
      const dim = dimensionsHeatTable(800, 0, 10, 5);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.paddedSide).toBe(DEFAULT_SIDE);
      expect(dim.padRatio).toBe(0);
    });
  });

  describe("table size", () => {
    test("should count the boxes and the gaps between them, but not after the last one", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.width).toBe(10 * 32 - 2);
      expect(dim.height).toBe(5 * 32 - 2);
    });

    test("should fill the container exactly when the boxes are shrunk to fit", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      expect(dim.width).toBeCloseTo(100, 9);
    });
  });

  describe("centering", () => {
    test("should centre the table when the container is wider than the table", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.centeredOffset).toBe((800 - dim.width) / 2);
    });

    test("should centre within the padded chart area when a chart padding is given", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5, { left: 20, right: 10 });
      expect(dim.centeredOffset).toBe((800 - 20 - 10 - dim.width) / 2);
    });

    test("should report a zero offset when there is no leftover space", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      expect(dim.centeredOffset).toBe(0);
    });
  });

  describe("chart padding", () => {
    test("should treat chartPadding as zero on every side when it is missing", () => {
      const without = dimensionsHeatTable(800, 2, 10, 5);
      const zeroed = dimensionsHeatTable(800, 2, 10, 5, { top: 0, right: 0, bottom: 0, left: 0 });
      expect(without).toEqual(zeroed);
    });

    test("should change the layout only when the chart padding is horizontal", () => {
      const horizontal = dimensionsHeatTable(800, 2, 10, 5, { left: 50, right: 50 });
      const vertical = dimensionsHeatTable(800, 2, 10, 5, { top: 50, bottom: 50 });
      const none = dimensionsHeatTable(800, 2, 10, 5);
      expect(vertical).toEqual(none);
      expect(horizontal.centeredOffset).toBeLessThan(none.centeredOffset);
    });
  });

  describesTheLayoutContract({
    layoutName: "dimensionsHeatTable",
    slots: [
      { name: "spaceWidth", kind: "size", callWith: (bad) => dimensionsHeatTable(bad, 2, 10, 5) },
      {
        name: "squarePadding",
        kind: "size",
        callWith: (bad) => dimensionsHeatTable(800, bad, 10, 5),
      },
      { name: "numX", kind: "count", callWith: (bad) => dimensionsHeatTable(800, 2, bad, 5) },
      { name: "numY", kind: "count", callWith: (bad) => dimensionsHeatTable(800, 2, 10, bad) },
    ],
    zeroed: [
      {
        when: "the table has no columns",
        call: () => dimensionsHeatTable(100, 2, 0, 5),
        expected: EMPTY,
      },
      {
        when: "the table has no rows",
        call: () => dimensionsHeatTable(100, 2, 5, 0),
        expected: EMPTY,
      },
      {
        when: "the container has no width",
        call: () => dimensionsHeatTable(0, 2, 10, 5),
        expected: EMPTY,
      },
    ],
  });

  describe("no room for a box", () => {
    test("should report no dimensions when there are too many columns for a box", () => {
      // the side used to go negative, taking padRatio above the [0, 1) a band scale accepts
      expect(dimensionsHeatTable(100, 2, 100, 5)).toEqual(EMPTY);
    });

    test("should report no dimensions when the chart padding eats the container", () => {
      expect(dimensionsHeatTable(100, 2, 10, 5, { left: 50, right: 50 })).toEqual(EMPTY);
    });

    test("should report no dimensions when the padding is wider than a column", () => {
      expect(dimensionsHeatTable(30, 40, 2, 2)).toEqual(EMPTY);
    });
  });

  describe("chart padding is the caller's", () => {
    test("should leave the chartPadding object untouched, even when it is frozen", () => {
      const padding: { left: number; top?: number; right?: number; bottom?: number } = {
        left: 20,
      };
      dimensionsHeatTable(800, 2, 10, 5, padding);
      expect(padding).toEqual({ left: 20 });

      const frozen = Object.freeze({ left: 20 });
      expect(() => dimensionsHeatTable(800, 2, 10, 5, frozen)).not.toThrow();
      expect(dimensionsHeatTable(800, 2, 10, 5, frozen)).toEqual(
        dimensionsHeatTable(800, 2, 10, 5, { left: 20 }),
      );
    });
  });

  describe("known quirks", () => {
    test("a zero-valued padding side is indistinguishable from a missing one", () => {
      // NOTE: harmless today - the defaults are applied with `||`, so an explicit 0 is
      // overwritten with 0. It becomes a trap only if a falsy-but-meaningful value is ever
      // allowed for these fields.
      const dim = dimensionsHeatTable(800, 2, 10, 5, { left: 0, right: 0 });
      expect(dim).toEqual(dimensionsHeatTable(800, 2, 10, 5));
    });

    test("the row count never influences the box size", () => {
      // NOTE: intended - the heat table is fitted to the available width only. A table with
      // many rows simply grows past the bottom of its container.
      const dim = dimensionsHeatTable(800, 2, 10, 1000);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.height).toBe(1000 * 32 - 2);
    });
  });
});
