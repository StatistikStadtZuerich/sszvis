import { describe, expect, test } from "vitest";
import dimensionsHeatTable from "../../src/layout/heatTableDimensions.js";

// A box side is the available width divided between the columns, capped at 30px.
const DEFAULT_SIDE = 30;

describe("heatTableDimensions", () => {
  describe("box sizing", () => {
    test("caps the box side at 30px when there is room to spare", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.paddedSide).toBe(DEFAULT_SIDE + 2);
    });

    test("shrinks the box side to fit a narrow container", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      // (100 - 2 * 9) / 10
      expect(dim.side).toBeCloseTo(8.2, 9);
      expect(dim.paddedSide).toBeCloseTo(10.2, 9);
    });

    test("padRatio is the padding's share of one padded side", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.padRatio).toBeCloseTo(2 / 32, 12);
      expect(dim.padRatio).toBeCloseTo(0.0625, 12);
    });

    test("a zero padding gives touching boxes and a zero padRatio", () => {
      const dim = dimensionsHeatTable(800, 0, 10, 5);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.paddedSide).toBe(DEFAULT_SIDE);
      expect(dim.padRatio).toBe(0);
    });
  });

  describe("table size", () => {
    test("counts the boxes and the padding between them, but not after the last one", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.width).toBe(10 * 32 - 2);
      expect(dim.height).toBe(5 * 32 - 2);
    });

    test("fills the container exactly when the boxes are shrunk to fit", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      expect(dim.width).toBeCloseTo(100, 9);
    });

    test("height follows the row count independently of the width", () => {
      const wide = dimensionsHeatTable(800, 2, 10, 5);
      const tall = dimensionsHeatTable(800, 2, 10, 20);
      expect(tall.width).toBe(wide.width);
      expect(tall.height).toBe(20 * 32 - 2);
    });
  });

  describe("centering", () => {
    test("centers the table in the leftover space", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5);
      expect(dim.centeredOffset).toBe((800 - dim.width) / 2);
    });

    test("centers within the padded chart area, not the full container", () => {
      const dim = dimensionsHeatTable(800, 2, 10, 5, { left: 20, right: 10 });
      expect(dim.centeredOffset).toBe((800 - 20 - 10 - dim.width) / 2);
    });

    test("never returns a negative offset", () => {
      const dim = dimensionsHeatTable(100, 2, 10, 5);
      expect(dim.centeredOffset).toBe(0);
    });
  });

  describe("chart padding", () => {
    test("treats a missing chartPadding as zero on every side", () => {
      const without = dimensionsHeatTable(800, 2, 10, 5);
      const zeroed = dimensionsHeatTable(800, 2, 10, 5, { top: 0, right: 0, bottom: 0, left: 0 });
      expect(without).toEqual(zeroed);
    });

    test("only the horizontal padding affects the layout", () => {
      const horizontal = dimensionsHeatTable(800, 2, 10, 5, { left: 50, right: 50 });
      const vertical = dimensionsHeatTable(800, 2, 10, 5, { top: 50, bottom: 50 });
      const none = dimensionsHeatTable(800, 2, 10, 5);
      expect(vertical).toEqual(none);
      expect(horizontal.centeredOffset).toBeLessThan(none.centeredOffset);
    });
  });

  describe("degenerate inputs", () => {
    const EMPTY = { side: 0, paddedSide: 0, padRatio: 0, width: 0, height: 0, centeredOffset: 0 };

    test("a table with no columns has no dimensions to report", () => {
      expect(dimensionsHeatTable(100, 2, 0, 5)).toEqual(EMPTY);
    });

    test("a table with no rows has no dimensions to report", () => {
      expect(dimensionsHeatTable(100, 2, 5, 0)).toEqual(EMPTY);
    });

    test("a container of no width has no dimensions to report", () => {
      expect(dimensionsHeatTable(0, 2, 10, 5)).toEqual(EMPTY);
    });

    test("rejects a column or row count that is not a whole number", () => {
      expect(() => dimensionsHeatTable(800, 2, 2.5, 5)).toThrow(/numX/);
      expect(() => dimensionsHeatTable(800, 2, 10, -5)).toThrow(/numY/);
    });

    test("rejects a negative width or padding", () => {
      expect(() => dimensionsHeatTable(-800, 2, 10, 5)).toThrow(/spaceWidth/);
      expect(() => dimensionsHeatTable(800, -4, 10, 5)).toThrow(/squarePadding/);
    });
  });

  describe("no room for a box", () => {
    const EMPTY = { side: 0, paddedSide: 0, padRatio: 0, width: 0, height: 0, centeredOffset: 0 };

    test("too many columns leave no room for a box", () => {
      // the side used to go negative, taking padRatio above the [0, 1) a band scale accepts
      expect(dimensionsHeatTable(100, 2, 100, 5)).toEqual(EMPTY);
    });

    test("chart padding that eats the container leaves no room for a box", () => {
      expect(dimensionsHeatTable(100, 2, 10, 5, { left: 50, right: 50 })).toEqual(EMPTY);
    });

    test("a padding wider than a column leaves no room at any column count", () => {
      expect(dimensionsHeatTable(30, 40, 2, 2)).toEqual(EMPTY);
    });
  });

  describe("known quirks", () => {
    test("mutates the chartPadding object it is given", () => {
      // BUG: the defaults are written back onto the caller's object instead of onto a copy,
      // so a padding object shared between charts (or frozen) is silently rewritten.
      // got: { left: 20 } becomes { left: 20, top: 0, right: 0, bottom: 0 }
      // want: the argument left untouched.
      const padding: { left: number; top?: number; right?: number; bottom?: number } = {
        left: 20,
      };
      dimensionsHeatTable(800, 2, 10, 5, padding);
      expect(padding).toEqual({ left: 20, top: 0, right: 0, bottom: 0 });
    });

    test("throws on a frozen chartPadding object in strict mode", () => {
      // BUG: the same mutation, made fatal. A frozen or shared config object is a normal
      // thing to pass; the layout should not need write access to it.
      const frozen = Object.freeze({ left: 20 });
      expect(() => dimensionsHeatTable(800, 2, 10, 5, frozen)).toThrow(TypeError);
    });

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
