import { describe, expect, test } from "vitest";
import { parseDate, parseNumber, parseYear } from "../src/parse.js";

describe("parse", () => {
  describe("parseDate", () => {
    test.each([
      ["17.08.2014", { year: 2014, month: 7, date: 17 }], // Month is 0-indexed
      ["5.3.2020", { year: 2020, month: 2, date: 5 }],
    ])(
      "should return the Swiss date %s as a Date when given a parseable cell",
      (input, expected) => {
        const result = parseDate(input);
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(expected.year);
        expect(result?.getMonth()).toBe(expected.month);
        expect(result?.getDate()).toBe(expected.date);
      },
    );

    test.each([["2014-08-17"], ["invalid"], ["not-a-date"], [""]])(
      "should return null when given %s",
      (input) => {
        expect(parseDate(input)).toBeNull();
      },
    );
  });

  describe("parseYear", () => {
    test.each([
      ["2014", 2014],
      ["0001", 1],
    ])(
      "should return the year %s as its first instant when given a parseable cell",
      (input, year) => {
        const result = parseYear(input);
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(year);
        expect(result?.getMonth()).toBe(0);
        expect(result?.getDate()).toBe(1);
      },
    );

    test.each([["invalid"], ["not-a-year"], ["abc"], ["2014-01-01"], [""]])(
      "should return null when given %s",
      (input) => {
        expect(parseYear(input)).toBeNull();
      },
    );
  });

  describe("parseNumber", () => {
    test.each<[string, number]>([
      ["42", 42],
      ["3.14", 3.14],
      ["-10", -10],
      ["0", 0],
      ["  42  ", 42],
      ["\t123\n", 123],
      ["1e5", 100_000],
      ["2.5e-3", 0.0025],
      ["Infinity", Number.POSITIVE_INFINITY],
      ["-Infinity", Number.NEGATIVE_INFINITY],
    ])("should return the number %s when given a numeric cell", (input, expected) => {
      expect(parseNumber(input)).toBe(expected);
    });

    test.each([[""], ["   "], ["\t\n"], ["abc"], ["12abc"]])(
      "should return NaN when given %s",
      (input) => {
        expect(parseNumber(input)).toBeNaN();
      },
    );
  });

  test.each([[undefined], [null]])(
    "should return an empty result from every parser when given a missing CSV cell (%s)",
    (cell) => {
      expect(parseDate(cell)).toBeNull();
      expect(parseYear(cell)).toBeNull();
      expect(parseNumber(cell)).toBeNaN();
    },
  );
});
