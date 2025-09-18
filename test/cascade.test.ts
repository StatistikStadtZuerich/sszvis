import { describe, expect, test } from "vitest";
import { cascade } from "../src/cascade";

type DataItem = {
  city: string;
  category: string;
  value: number;
};
describe("cascade", () => {
  const testData: DataItem[] = [
    { city: "Zurich", category: "A", value: 10 },
    { city: "Basel", category: "A", value: 20 },
    { city: "Zurich", category: "B", value: 15 },
    { city: "Basel", category: "B", value: 25 },
    { city: "Geneva", category: "A", value: 30 },
  ];

  describe("objectBy", () => {
    test("should group data into object with key-value pairs", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .apply(testData);
      expect(result).toHaveProperty("Zurich");
      expect(result).toHaveProperty("Basel");
      expect(result).toHaveProperty("Geneva");
      expect(result.Zurich).toHaveLength(2);
      expect(result.Basel).toHaveLength(2);
      expect(result.Geneva).toHaveLength(1);
    });

    test("should handle nested objectBy grouping", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .objectBy((d) => d.category)
        .apply(testData);
      expect(result.Zurich).toHaveProperty("A");
      expect(result.Zurich).toHaveProperty("B");
      expect(result.Basel).toHaveProperty("A");
      expect(result.Basel).toHaveProperty("B");
      expect(result.Geneva).toHaveProperty("A");
      expect(result.Zurich.A).toHaveLength(1);
      expect(result.Zurich.B).toHaveLength(1);
      expect(result.Basel.A).toHaveLength(1);
      expect(result.Basel.B).toHaveLength(1);
      expect(result.Geneva.A).toHaveLength(1);
    });
  });

  describe("arrayBy", () => {
    test("should group data into array of groups", () => {
      const result = cascade()
        .arrayBy((d) => d.city)
        .apply(testData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3); // Zurich, Basel, Geneva
      for (const group of result) {
        expect(Array.isArray(group)).toBe(true);
      }
    });

    test("should sort groups when sorter is provided", () => {
      const result = cascade()
        .arrayBy(
          (d) => d.city,
          (a, b) => a.localeCompare(b)
        )
        .apply(testData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0].some((d: DataItem) => d.city === "Basel")).toBe(true);
      expect(result[1].some((d: DataItem) => d.city === "Geneva")).toBe(true);
      expect(result[2].some((d: DataItem) => d.city === "Zurich")).toBe(true);
    });

    test("should handle nested arrayBy grouping", () => {
      const result = cascade()
        .arrayBy((d) => d.city)
        .arrayBy((d) => d.category)
        .apply(testData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3); // Cities
      for (const cityGroup of result) {
        expect(Array.isArray(cityGroup)).toBe(true);
        for (const categoryGroup of cityGroup) {
          expect(Array.isArray(categoryGroup)).toBe(true);
        }
      }
    });
  });

  describe("mixed grouping", () => {
    test("should handle objectBy followed by arrayBy", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .arrayBy((d) => d.category)
        .apply(testData);
      expect(result).toHaveProperty("Zurich");
      expect(result).toHaveProperty("Basel");
      expect(result).toHaveProperty("Geneva");
      expect(Array.isArray(result.Zurich)).toBe(true);
      expect(Array.isArray(result.Basel)).toBe(true);
      expect(Array.isArray(result.Geneva)).toBe(true);
    });

    test("should handle arrayBy followed by objectBy", () => {
      const result = cascade()
        .arrayBy((d) => d.city)
        .objectBy((d) => d.category)
        .apply(testData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      for (const cityGroup of result) {
        expect(cityGroup).toHaveProperty("A");
        expect(Array.isArray(cityGroup.A)).toBe(true);
      }
    });
  });

  describe("sort", () => {
    test("should sort final data arrays when sort is specified", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .sort((a, b) => a.value - b.value)
        .apply(testData);
      expect(result.Zurich[0].value).toBe(10);
      expect(result.Zurich[1].value).toBe(15);
      expect(result.Basel[0].value).toBe(20);
      expect(result.Basel[1].value).toBe(25);
    });

    test("should sort with reverse order", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .sort((a, b) => b.value - a.value)
        .apply(testData);
      expect(result.Zurich[0].value).toBe(15);
      expect(result.Zurich[1].value).toBe(10);
      expect(result.Basel[0].value).toBe(25);
      expect(result.Basel[1].value).toBe(20);
    });
  });

  describe("empty data", () => {
    test("should handle empty input array", () => {
      const result = cascade()
        .objectBy((d) => d.city)
        .apply([]);
      expect(result).toEqual({});
    });

    test("should handle empty input with arrayBy", () => {
      const result = cascade()
        .arrayBy((d) => d.city)
        .apply([]);
      expect(result).toEqual([]);
    });
  });
});
