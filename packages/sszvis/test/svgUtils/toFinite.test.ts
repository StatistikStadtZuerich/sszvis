import { describe, expect, test } from "vitest";
import { toFinite } from "../../src/svgUtils/toFinite.js";

describe("svgUtils/toFinite", () => {
  test.each<[unknown, number]>([
    [42, 42],
    [-7.5, -7.5],
    [0, 0],
    ["12", 12],
    ["-3.5", -3.5],
    [Number.NaN, 0],
    // Either infinity is distinct from NaN: a finiteness check catches these, an isNaN check
    // would not, and an Infinity written into a geometry attribute is what this guard exists
    // to stop.
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
    ["abc", 0],
    [undefined, 0],
    [{}, 0],
    [[1, 2], 0],
    // null is pinned deliberately: it reaches 0 through coercion rather than through the
    // finiteness fallback, so the two routes are not distinguishable from the result alone.
    [null, 0],
  ])(
    "should return the finite number %s as %s, substituting 0 for anything not finite",
    (input, expected) => {
      expect(toFinite(input)).toBe(expected);
    },
  );
});
