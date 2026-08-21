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

    test("too many columns produce a negative side and a padRatio above 1", () => {
      // BUG: the box side is only capped from above. When the padding alone exceeds the
      // available width the side goes negative, and padRatio - documented as a band scale
      // argument, so valid only in [0, 1) - goes above 1.
      // got: side -0.98, padRatio 1.96
      // want: the side clamped at 0, or an explicit error.
      const dim = dimensionsHeatTable(100, 2, 100, 5);
      expect(dim.side).toBeLessThan(0);
      expect(dim.padRatio).toBeGreaterThan(1);
    });

    test("chart padding alone can starve the table into a negative side", () => {
      // BUG: same unclamped side as the too-many-columns case, but reached through a
      // realistic input - horizontal chart padding that eats the whole container.
      // got: side -1.8, padRatio 5.5
      // want: the side clamped at 0.
      const dim = dimensionsHeatTable(100, 2, 10, 5, { left: 50, right: 50 });
      expect(dim.side).toBeLessThan(0);
      // the width collapses to a floating-point crumb rather than to exactly 0
      expect(dim.width).toBeCloseTo(0, 12);
      expect(dim.centeredOffset).toBeCloseTo(0, 12);
    });

    test("a padding wider than a column makes the boxes negative at any column count", () => {
      // BUG: the same defect at a much smaller scale - two columns and a 40px gap in a
      // 30px space is enough.
      const dim = dimensionsHeatTable(30, 40, 2, 2);
      expect(dim.side).toBeLessThan(0);
    });

    test("a negative squarePadding overlaps the boxes and inverts padRatio", () => {
      // BUG: squarePadding is not validated. A negative value shrinks paddedSide below the
      // box side, so the boxes overlap and padRatio goes negative - again outside the
      // [0, 1) range a band scale accepts.
      // got: side 30, paddedSide 26, padRatio -0.154
      // want: reject a negative padding.
      const dim = dimensionsHeatTable(800, -4, 10, 5);
      expect(dim.paddedSide).toBeLessThan(dim.side);
      expect(dim.padRatio).toBeLessThan(0);
    });

    test("a fractional column count is accepted without rounding", () => {
      // BUG: numX and numY are used directly in the geometry, so a fractional count yields
      // a table sized for two and a half columns rather than an error.
      // got: width for numX 2.5 is 2.5 * paddedSide - squarePadding
      // want: reject or round a non-integer count.
      const dim = dimensionsHeatTable(800, 2, 2.5, 5);
      expect(dim.width).toBeCloseTo(2.5 * dim.paddedSide - 2, 9);
    });

    test("zero columns fall back to the default side and a negative width", () => {
      // BUG: numX = 0 divides by zero, giving an Infinity side that Math.min silently
      // replaces with the 30px default. The width then comes out as -squarePadding.
      // got: { side: 30, width: -2 }
      // want: a zero-sized table, or an explicit error.
      const dim = dimensionsHeatTable(100, 2, 0, 5);
      expect(dim.side).toBe(DEFAULT_SIDE);
      expect(dim.width).toBe(-2);
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
