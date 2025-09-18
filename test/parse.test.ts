import { describe, expect, test } from "vitest";
import { parseDate, parseNumber, parseYear } from "../src/parse";

describe("parse", () => {
  describe("parseDate", () => {
    test("should parse valid Swiss date format", () => {
      const result = parseDate("17.08.2014");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2014);
      expect(result?.getMonth()).toBe(7); // Month is 0-indexed
      expect(result?.getDate()).toBe(17);
    });

    test("should parse date with single-digit day and month", () => {
      const result = parseDate("5.3.2020");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2020);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(5);
    });

    test("should return null for invalid date format", () => {
      expect(parseDate("2014-08-17")).toBeNull();
      expect(parseDate("invalid")).toBeNull();
      expect(parseDate("")).toBeNull();
    });

    test("should return null for invalid date values", () => {
      expect(parseDate("invalid")).toBeNull();
      expect(parseDate("not-a-date")).toBeNull();
    });
  });

  describe("parseYear", () => {
    test("should parse valid year string", () => {
      const result = parseYear("2014");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2014);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });

    test("should parse year with leading zeros", () => {
      const result = parseYear("0001");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(1);
    });

    test("should return null for invalid year format", () => {
      expect(parseYear("invalid")).toBeNull();
      expect(parseYear("")).toBeNull();
      expect(parseYear("not-a-year")).toBeNull();
    });

    test("should return null for non-year strings", () => {
      expect(parseYear("2014-01-01")).toBeNull();
      expect(parseYear("abc")).toBeNull();
    });
  });

  describe("parseNumber", () => {
    test("should parse valid number strings", () => {
      expect(parseNumber("42")).toBe(42);
      expect(parseNumber("3.14")).toBe(3.14);
      expect(parseNumber("-10")).toBe(-10);
      expect(parseNumber("0")).toBe(0);
    });

    test("should parse numbers with whitespace", () => {
      expect(parseNumber("  42  ")).toBe(42);
      expect(
        parseNumber(String.raw`	123
`)
      ).toBe(123);
    });

    test("should return NaN for empty or whitespace-only strings", () => {
      expect(parseNumber("")).toBeNaN();
      expect(parseNumber("   ")).toBeNaN();
      expect(
        parseNumber(String.raw`	
`)
      ).toBeNaN();
    });

    test("should return NaN for invalid number strings", () => {
      expect(parseNumber("abc")).toBeNaN();
      expect(parseNumber("12abc")).toBeNaN();
      expect(parseNumber("")).toBeNaN();
    });

    test("should handle scientific notation", () => {
      expect(parseNumber("1e5")).toBe(100_000);
      expect(parseNumber("2.5e-3")).toBe(0.0025);
    });

    test("should handle infinity", () => {
      expect(parseNumber("Infinity")).toBe(Number.POSITIVE_INFINITY);
      expect(parseNumber("-Infinity")).toBe(Number.NEGATIVE_INFINITY);
    });
  });
});
