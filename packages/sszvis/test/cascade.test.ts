import { describe, expect, test } from "vitest";
import { type CascadeInstance, cascade } from "../src/cascade.js";

type DataItem = {
  city: string;
  category: string;
  value: number;
};

describe("cascade", () => {
  const zurichA: DataItem = { city: "Zurich", category: "A", value: 10 };
  const baselA: DataItem = { city: "Basel", category: "A", value: 20 };
  const zurichB: DataItem = { city: "Zurich", category: "B", value: 15 };
  const baselB: DataItem = { city: "Basel", category: "B", value: 25 };
  const genevaA: DataItem = { city: "Geneva", category: "A", value: 30 };
  const testData: DataItem[] = [zurichA, baselA, zurichB, baselB, genevaA];

  describe("objectBy", () => {
    test("should group data into object with key-value pairs", () => {
      const result = cascade<DataItem>()
        .objectBy((d) => d.city)
        .apply<Record<string, DataItem[]>>(testData);
      expect(result).toHaveProperty("Zurich");
      expect(result).toHaveProperty("Basel");
      expect(result).toHaveProperty("Geneva");
      expect(result.Zurich).toHaveLength(2);
      expect(result.Basel).toHaveLength(2);
      expect(result.Geneva).toHaveLength(1);
    });

    test("should handle nested objectBy grouping", () => {
      const result = cascade<DataItem>()
        .objectBy((d) => d.city)
        .objectBy((d) => d.category)
        .apply<Record<string, Record<string, DataItem[]>>>(testData);
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
    test("should place each city's rows in their own group when grouping by city", () => {
      const result = cascade<DataItem>()
        .arrayBy((d) => d.city)
        .apply<DataItem[][]>(testData);
      expect(result).toEqual([[zurichA, zurichB], [baselA, baselB], [genevaA]]);
    });

    test("should order the groups by the sorter when one is provided", () => {
      const result = cascade<DataItem>()
        .arrayBy(
          (d) => d.city,
          (a, b) => a.localeCompare(b),
        )
        .apply<DataItem[][]>(testData);
      expect(result).toEqual([[baselA, baselB], [genevaA], [zurichA, zurichB]]);
    });

    test("should split every city group by category when arrayBy is nested", () => {
      const result = cascade<DataItem>()
        .arrayBy((d) => d.city)
        .arrayBy((d) => d.category)
        .apply<DataItem[][][]>(testData);
      expect(result).toEqual([[[zurichA], [zurichB]], [[baselA], [baselB]], [[genevaA]]]);
    });
  });

  describe("mixed grouping", () => {
    test("should build each level in the form its own step asked for when objectBy and arrayBy are mixed", () => {
      const objectThenArray = cascade<DataItem>()
        .objectBy((d) => d.city)
        .arrayBy((d) => d.category)
        .apply<Record<string, DataItem[][]>>(testData);
      expect(objectThenArray).toEqual({
        Zurich: [[zurichA], [zurichB]],
        Basel: [[baselA], [baselB]],
        Geneva: [[genevaA]],
      });

      const arrayThenObject = cascade<DataItem>()
        .arrayBy((d) => d.city)
        .objectBy((d) => d.category)
        .apply<Record<string, DataItem[]>[]>(testData);
      expect(arrayThenObject).toEqual([
        { A: [zurichA], B: [zurichB] },
        { A: [baselA], B: [baselB] },
        { A: [genevaA] },
      ]);
    });
  });

  describe("sort", () => {
    test("should sort final data arrays when sort is specified", () => {
      const result = cascade<DataItem>()
        .objectBy((d) => d.city)
        .sort((a, b) => a.value - b.value)
        .apply<Record<string, DataItem[]>>(testData);
      expect(result.Zurich[0].value).toBe(10);
      expect(result.Zurich[1].value).toBe(15);
      expect(result.Basel[0].value).toBe(20);
      expect(result.Basel[1].value).toBe(25);
    });

    test("should sort with reverse order", () => {
      const result = cascade<DataItem>()
        .objectBy((d) => d.city)
        .sort((a, b) => b.value - a.value)
        .apply<Record<string, DataItem[]>>(testData);
      expect(result.Zurich[0].value).toBe(15);
      expect(result.Zurich[1].value).toBe(10);
      expect(result.Basel[0].value).toBe(25);
      expect(result.Basel[1].value).toBe(20);
    });
  });

  describe("empty data", () => {
    test.each<[string, CascadeInstance<DataItem>, unknown]>([
      ["objectBy", cascade<DataItem>().objectBy((d) => d.city), {}],
      ["arrayBy", cascade<DataItem>().arrayBy((d) => d.city), []],
    ])("should return an empty %s level when there is no data", (_form, chain, expected) => {
      expect(chain.apply([])).toEqual(expected);
    });
  });
});
