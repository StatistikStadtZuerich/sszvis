import { scaleLinear, scaleOrdinal, scaleTime } from "d3";
import { describe, expect, test } from "vitest";
import { range, rangeExtent } from "../src/scale.js";

describe("scale/rangeExtent", () => {
  test.each<[string, Parameters<typeof rangeExtent>[0], [number, number]]>([
    ["ascending from 0", scaleLinear().domain([0, 1]).range([0, 400]), [0, 400]],
    ["ascending from an offset", scaleLinear().domain([0, 1]).range([100, 400]), [100, 400]],
    ["entirely negative", scaleLinear().domain([0, 1]).range([-50, -10]), [-50, -10]],
    ["zero-width", scaleLinear().domain([0, 1]).range([20, 20]), [20, 20]],
    [
      "a time scale's",
      scaleTime()
        .domain([new Date(2020, 0, 1), new Date(2020, 0, 31)])
        .range([0, 300]),
      [0, 300],
    ],
  ])("should report the ends of a range that is %s", (_shape, scale, expected) => {
    expect(rangeExtent(scale)).toEqual(expected);
  });

  // The behaviour that gave the old `range` name away: what comes back is a measurement, so
  // the direction of a descending range - which is what every y scale is - does not survive.
  // Callers that need the direction have to read the scale's own `range()`.
  test("should sort a descending range, so the direction does not round trip", () => {
    const y = scaleLinear().domain([0, 1]).range([400, 0]);
    expect(rangeExtent(y)).toEqual([0, 400]);
    expect(y.range()).toEqual([400, 0]);
  });

  // A scale carrying its own `rangeExtent` method is asked for it directly rather than having
  // its range measured. d3 v4 and later dropped the method from the built-in scales, so this
  // branch is only reachable through a scale that supplies one.
  test("should prefer a scale's own rangeExtent method over measuring its range", () => {
    const ordinal = scaleOrdinal<string, number>().domain(["a", "b", "c"]).range([10, 20, 30]);
    const withRangeExtent = Object.assign(ordinal, {
      rangeExtent: (): [number, number] => [5, 95],
    });
    expect(rangeExtent(withRangeExtent)).toEqual([5, 95]);
  });

  // Ordinal scales have no rangeExtent of their own, so the ends of the range list are what
  // gets measured - the intermediate values are not consulted.
  test("should measure an ordinal scale from the ends of its range list", () => {
    const ordinal = scaleOrdinal<string, number>().domain(["a", "b", "c"]).range([30, 10, 20]);
    expect(rangeExtent(ordinal)).toEqual([20, 30]);
  });

  test("should still be reachable under its deprecated name", () => {
    expect(range).toBe(rangeExtent);
  });
});
