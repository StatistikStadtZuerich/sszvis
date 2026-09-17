import { describe, expect, test } from "vitest";
import { formatNumber, formatPreciseNumber } from "../src/format.js";

const EN_DASH = "–";
const THINSP = " ";

describe("formatNumber", () => {
  testMatrix("Non-numbers", "the value is not a number", formatNumber, [
    [undefined, EN_DASH],
    [null, EN_DASH],
    [Number.NaN, EN_DASH],
  ]);

  testMatrix("Basics", "the value is a small whole number", formatNumber, [
    [1, "1"],
    [0, "0"],
    [-0, "0"],
    [-1, "−1"],
  ]);

  testMatrix("Range 0–1", "the value lies between 0 and 1", formatNumber, [
    [0.1, "0.1"],
    [0.12, "0.12"],
    [0.001, "0"],
    [0.005, "0.01"],
  ]);

  testMatrix("Range 1–99", "the value lies between 1 and 99", formatNumber, [
    [42.1, "42.1"],
    [42.001, "42"],
    [42.005, "42.01"],
  ]);

  testMatrix("Range 100–9999", "the value lies between 100 and 9999", formatNumber, [
    [1234, "1234"],
    [1234.09, "1234.1"],
    [1234.04, "1234"],
  ]);

  testMatrix("Range >10000", "the value is 10000 or more", formatNumber, [
    [10_250, `10${THINSP}250`],
    [10_250.1, `10${THINSP}250`],
    [10_250.91, `10${THINSP}251`],
  ]);
});

describe("formatPreciseNumber", () => {
  testMatrix("With three decimal places", "three decimal places are requested", formatPreciseNumber(3), [
    [0, "0.000"],
    [0.0001, "0.000"],
    [0.0005, "0.001"],
    [10_250, `10${THINSP}250.000`],
    [10_250.1234, `10${THINSP}250.123`],
  ]);
});

// -----------------------------------------------------------------------------

function testMatrix<I>(
  label: string,
  condition: string,
  format: (input: I) => string,
  matrix: [I, string][],
) {
  describe(label, () => {
    test.each(matrix)(`should format %s as "%s" when ${condition}`, (input, output) => {
      expect(format(input)).toBe(output);
    });
  });
}
