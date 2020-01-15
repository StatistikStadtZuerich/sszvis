import { formatNumber, formatPreciseNumber } from "../src/format.js";

describe("Special cases", () => {
  test("NaN is mdash –", () => expect(formatNumber(NaN)).toBe("–")); // Note: this uses an mdash
  test("0, without precision", () => expect(formatNumber(0)).toBe("0"));
  test("0, with precision", () => expect(formatPreciseNumber(3, 0)).toBe("0.000"));
  test("test that currying works, 0", () => expect(formatPreciseNumber(3)(0)).toBe("0.000"));
  test("test that currying works, 123.456789", () =>
    expect(formatPreciseNumber(3)(123.123456)).toBe("123.123"));
  test("(negative number) abs 0 - 1, leading zeroes, all digits cut off", () =>
    expect(formatPreciseNumber(3, -0.000124)).toBe("0.000"));
  test("raw numbers with explicit zero decimals lose those decimals because of Javascript", () =>
    expect(formatNumber(42.0)).toBe("42"));
  test("to add zeroes to a raw number with explicit zero decimals, pass a precision value", () =>
    expect(formatPreciseNumber(3, 42.0)).toBe("42.000"));
});

describe("Numbers > 10000", () => {
  // Note: tests for numbers > 10000 expect a 'narrow space' as the thousands separator
  test("abs >10000, uses a thin space thousands separator", () =>
    expect(formatNumber(10250)).toBe("10 250"));
  test("abs >10000, with decimal precision supplied", () =>
    expect(formatPreciseNumber(5, 10250)).toBe("10 250.00000"));
  test("abs >10000, with precision and decimals", () =>
    expect(formatPreciseNumber(2, 10250.12345)).toBe("10 250.12"));
  test("abs >10000, with precision, decimals, and needing to be rounded", () =>
    expect(formatPreciseNumber(3, 10250.16855)).toBe("10 250.169"));
  test("(negative number) abs >10000, with precision, decimals, and needing to be rounded", () =>
    expect(formatPreciseNumber(3, -10250.16855)).toBe("-10 250.169"));
});

describe("Numbers 100–10000", () => {
  test("abs 100 - 10000, has no separator", () => expect(formatNumber(6578)).toBe("6578"));
  test("abs 100 - 10000, with decimal but no precision rounds to 1 point", () =>
    expect(formatNumber(1234.5678)).toBe("1234.6"));
  test("abs 100 - 10000, with precision", () =>
    expect(formatPreciseNumber(2, 1234)).toBe("1234.00"));
  test("abs 100 - 10000, with precision and decimals", () =>
    expect(formatPreciseNumber(3, 1234.12345678)).toBe("1234.123"));
  test("abs 100 - 10000, with precision, decimals, and rounding", () =>
    expect(formatPreciseNumber(3, 1234.9876543)).toBe("1234.988"));
  test("(negative number) abs 100 - 10000, with precision, decimals, and rounding", () =>
    expect(formatPreciseNumber(3, -1234.9876543)).toBe("-1234.988"));
});

describe("Numbers 0–100", () => {
  test("abs 0 - 100, no decimals, no precision", () => expect(formatNumber(42)).toBe("42"));
  test("(negative number) abs 0 - 100, no decimals, no precision", () =>
    expect(formatNumber(-42)).toBe("-42"));
  test("abs 0 - 100, 1 decimal, no precision, rounds to 1", () =>
    expect(formatNumber(42.2)).toBe("42.2"));
  test("abs 0 - 100, 2 decimals, no precision, rounds to 2", () =>
    expect(formatNumber(42.45)).toBe("42.45"));
  test("(negative number) abs 0 - 100, >2 decimals, no precision, rounds to 2", () =>
    expect(formatNumber(-42.1234)).toBe("-42.12"));
  test("abs 0 - 100, no decimals, with precision", () =>
    expect(formatPreciseNumber(3, 42)).toBe("42.000"));
  test("abs 0 - 100, 1 decimals, with precision", () =>
    expect(formatPreciseNumber(3, 42.2)).toBe("42.200"));
  test("abs 0 - 100, 2 decimals, with precision", () =>
    expect(formatPreciseNumber(3, 42.26)).toBe("42.260"));
  test("abs 0 - 100, >2 decimals, with precision", () =>
    expect(formatPreciseNumber(4, 42.987654)).toBe("42.9877"));
  test("abs 0 - 100, leading zeroes, with precision", () =>
    expect(formatPreciseNumber(4, 20.000042)).toBe("20.0000"));
  test("abs 0 - 100, leading zeroes, precision causes rounding", () =>
    expect(formatPreciseNumber(4, 20.000088)).toBe("20.0001"));
});

describe("Numbers 0–1", () => {
  test("abs 0 - 1, 1 decimal, no precision, rounds to 1", () =>
    expect(formatNumber(0.1)).toBe("0.1"));
  test("abs 0 - 1, 2 decimals, no precision, rounds to 2", () =>
    expect(formatNumber(0.12)).toBe("0.12"));
  test("abs 0 - 1, >2 decimals, no precision, rounds to 2", () =>
    expect(formatNumber(0.8765)).toBe("0.88"));
  test("abs 0 - 1, >2 decimals, remove insignificant zeros", () =>
    expect(formatNumber(0.001)).toBe("0"));
  test("abs 0 - 1, >2 decimals, remove insignificant zeros", () =>
    expect(formatNumber(0.005)).toBe("0.01"));
  test("(negative number) abs 0 - 1, >2 decimals, no precision, rounds to 2", () =>
    expect(formatNumber(-0.8765)).toBe("-0.88"));
  test("abs 0 - 1, 1 decimal, with precision", () =>
    expect(formatPreciseNumber(2, 0.2)).toBe("0.20"));
  test("abs 0 - 1, 2 decimals, with precision", () =>
    expect(formatPreciseNumber(3, 0.34)).toBe("0.340"));
  test("abs 0 - 1, >2 decimals, with 2 precision", () =>
    expect(formatPreciseNumber(2, 0.98765432)).toBe("0.99"));
  test("abs 0 - 1, >2 decimals, with 4 precision", () =>
    expect(formatPreciseNumber(4, 0.98765432)).toBe("0.9877"));
  test("abs 0 - 1, >2 decimals, with 6 precision", () =>
    expect(formatPreciseNumber(6, 0.98765432)).toBe("0.987654"));
  test("(negative number) abs 0 - 1, >2 decimals, with 6 precision", () =>
    expect(formatPreciseNumber(6, -0.98765432)).toBe("-0.987654"));
  test("abs 0 - 1, leading zeroes", () =>
    expect(formatPreciseNumber(6, -0.000124)).toBe("-0.000124"));
  test("abs 0 - 1, leading zeroes, all digits cut off", () =>
    expect(formatPreciseNumber(3, 0.00000556)).toBe("0.000"));
});
