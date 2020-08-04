import { formatNumber, formatPreciseNumber } from "../src/format.js";

const EN_DASH = "–";
const THINSP = " ";

describe("formatNumber", () => {
  testMatrix("Non-numbers", formatNumber, [
    [undefined, EN_DASH],
    [null, EN_DASH],
    [NaN, EN_DASH],
  ]);

  testMatrix("Basics", formatNumber, [
    [1, "1"],
    [0, "0"],
    [-0, "0"],
    [-1, "-1"],
  ]);

  testMatrix("Range 0–1", formatNumber, [
    [0.1, "0.1"],
    [0.12, "0.12"],
    [0.001, "0"],
    [0.005, "0.01"],
  ]);

  testMatrix("Range 1–99", formatNumber, [
    [42.1, "42.1"],
    [42.001, "42"],
    [42.005, "42.01"],
  ]);

  testMatrix("Range 100–9999", formatNumber, [
    [1234, "1234"],
    [1234.09, "1234.1"],
    [1234.04, "1234"],
  ]);

  testMatrix("Range >10000", formatNumber, [
    [10250, `10${THINSP}250`],
    [10250.1, `10${THINSP}250`],
    [10250.91, `10${THINSP}251`],
  ]);
});

describe("formatPreciseNumber", () => {
  testMatrix("With three decimal places", formatPreciseNumber(3), [
    [0, "0.000"],
    [0.0001, "0.000"],
    [0.0005, "0.001"],
    [10250, `10${THINSP}250.000`],
    [10250.1234, `10${THINSP}250.123`],
  ]);
});

// -----------------------------------------------------------------------------

function testMatrix(label, format, matrix) {
  describe(label, () => {
    test.each(matrix)('%s -> "%s"', (input, output) => {
      expect(format(input)).toBe(output);
    });
  });
}
