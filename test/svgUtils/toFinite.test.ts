import { describe, expect, test } from "vitest";
import { toFinite } from "../../src/svgUtils/toFinite.js";

describe("svgUtils/toFinite", () => {
  test("should pass finite numbers through, including negatives and zero", () => {
    expect(toFinite(42)).toBe(42);
    expect(toFinite(-7.5)).toBe(-7.5);
    expect(toFinite(0)).toBe(0);
  });

  test("should coerce a numeric string", () => {
    expect(toFinite("12")).toBe(12);
    expect(toFinite("-3.5")).toBe(-3.5);
  });

  test("should substitute 0 for NaN", () => {
    expect(toFinite(Number.NaN)).toBe(0);
  });

  test("should substitute 0 for either infinity", () => {
    // Distinct from NaN: a finiteness check catches these, an isNaN check would not, and
    // an Infinity written into a geometry attribute is what this guard exists to stop.
    expect(toFinite(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toFinite(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  test("should substitute 0 for values that do not coerce to a number", () => {
    expect(toFinite("abc")).toBe(0);
    expect(toFinite(undefined)).toBe(0);
    expect(toFinite({})).toBe(0);
    expect(toFinite([1, 2])).toBe(0);
  });

  test("should return 0 for null, which coerces to 0 in its own right", () => {
    // Pinned deliberately: null reaches 0 through coercion rather than through the
    // finiteness fallback, so the two routes are not distinguishable from the result alone.
    expect(toFinite(null)).toBe(0);
  });
});
