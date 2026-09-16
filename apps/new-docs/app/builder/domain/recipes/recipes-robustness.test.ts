import { Effect } from "effect";
import tsBlankSpace from "ts-blank-space";
import { describe, expect, test } from "vitest";

import { compile } from "../compile";
import { initialSpec } from "../initial-spec";
import { summarize, type Recipe } from "../spec";
import { recipes } from ".";

/*
 * These tests run the emitted chart code, not a copy of it: a recipe is
 * compiled the way the builder compiles it, the fragment under test is cut out
 * of the result and evaluated. Types are erased with the same tool the worker
 * uses before the preview runs the code.
 */

const recipeNamed = (key: string): Recipe => {
  const recipe = recipes.find((candidate) => candidate.key === key);
  if (recipe === undefined) throw new Error(`no recipe named "${key}"`);
  return recipe;
};

const emit = (key: string): string => {
  const recipe = recipeNamed(key);
  return tsBlankSpace(Effect.runSync(compile(recipe, initialSpec(summarize(recipe)))));
};

/** The source from `start` up to the first line that closes it at column zero. */
const sliceFrom = (source: string, start: string, end: string): string => {
  const from = source.indexOf(start);
  expect(from, `${start} is not in the emitted chart`).toBeGreaterThan(-1);
  const to = source.indexOf(end, from);
  expect(to, `${start} is never closed by ${JSON.stringify(end)}`).toBeGreaterThan(-1);
  return source.slice(from, to + end.length);
};

/*
 * d3 is not a dependency of this app - the generated chart loads it from the
 * bundle - so the one function under test is stubbed with d3-array's own
 * algorithm (d3-array 3.2.4, src/bisector.js): with `lo` at 1 and an empty
 * array, `lo < hi` is false and the index comes back as 1, past the end.
 */
const d3Stub = {
  bisector: <T, V>(accessor: (d: T) => V) => ({
    left: (data: T[], value: V, lo = 0, hi = data.length) => {
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        // SAFETY: the accessor's values are dates here, which compare with `<`.
        if ((accessor(data[mid] as T) as unknown as number) < (value as unknown as number))
          lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
  }),
};

describe("line chart hover ruler", () => {
  const chart = emit("line-chart");

  const closestDatum = new Function(
    "d3",
    `${sliceFrom(chart, "const closestDatum =", "\n};")}\nreturn closestDatum;`,
  )(d3Stub) as (data: unknown[], accessor: (d: unknown) => Date, datum: Date) => unknown;

  /** The emitted `changeDate` action, as a function of the state it mutates. */
  const changeDate = (state: unknown, inputDate: Date | null) => {
    const action = sliceFrom(chart, "changeDate(state, _e, inputDate", "\n    },");
    const body = action.slice(action.indexOf("{") + 1, action.lastIndexOf("}"));
    const sszvisStub = {
      find: (predicate: (d: unknown) => boolean, values: unknown[]) => values.find(predicate),
    };
    new Function(
      "d3",
      "sszvis",
      "xAcc",
      "yAcc",
      "state",
      "inputDate",
      `${sliceFrom(chart, "const closestDatum =", "\n};")}\n${body}`,
    )(
      d3Stub,
      sszvisStub,
      (d: { xValue: Date }) => d.xValue,
      (d: { yValue: number }) => d.yValue,
      state,
      inputDate,
    );
  };

  const datum = (year: number) => ({ xValue: new Date(year, 0, 1), yValue: year });

  test("should find the nearest datum when the chart has data", () => {
    const data = [datum(2000), datum(2010), datum(2020)];
    expect(closestDatum(data, (d) => (d as { xValue: Date }).xValue, new Date(2009, 6, 1))).toBe(
      data[1],
    );
  });

  test("should report no nearest datum when every row was dropped", () => {
    /* A Date role mapped to a column `parseDate` rejects leaves `state.data` empty. */
    expect(closestDatum([], (d) => (d as { xValue: Date }).xValue, new Date(2010, 0, 1))).toBe(
      undefined,
    );
  });

  test("should show no ruler rather than throw when the pointer moves over an empty chart", () => {
    const state = { data: [], lineData: [], selection: [datum(2000)] };
    expect(() => changeDate(state, new Date(2010, 0, 1))).not.toThrow();
    expect(state.selection).toEqual([]);
  });

  test("should select one point per line when the pointer moves over a chart with data", () => {
    const hit = datum(2010);
    const state = { data: [datum(2000), hit], lineData: [[datum(2000), hit]], selection: [] };
    changeDate(state, new Date(2009, 6, 1));
    expect(state.selection).toEqual([hit]);
  });

  test("should clear the selection when the pointer leaves the plot", () => {
    const state = { data: [datum(2000)], lineData: [[datum(2000)]], selection: [datum(2000)] };
    changeDate(state, null);
    expect(state.selection).toEqual([]);
  });
});

describe("vertical bar chart layout", () => {
  const chart = emit("bar-chart-vertical");

  test("should measure the layout over the distinct categories the band scale draws", () => {
    /*
     * `scaleBand` interns its domain, so a layout measured over the rows would
     * size the chart for bars that are never drawn. `sszvis.set` is the
     * library's distinct-values helper, and both readers take the same array.
     */
    expect(chart).toContain("state.categories = sszvis.set(state.data, xAcc);");
    expect(chart).toContain("state.categories.length,");
    expect(chart).toContain(".domain(state.categories)");
  });

  test("should name the same categories in the tooltip as on the axis", () => {
    expect(chart).toContain("state.data.filter((d) => xAcc(d) === category)");
  });
});

/*
 * `sszvis.colorLegendLayout` chooses qual6 at six labels or fewer and qual12 above,
 * and the legend feature hands that scale to the chart. The colours must not depend
 * on whether the legend is shown, so the recipe's own default follows the same rule.
 */
describe("the line chart's colours", () => {
  const withoutLegend = (recipe: Recipe) => {
    const spec = initialSpec(summarize(recipe));
    return Effect.runSync(
      compile(recipe, { ...spec, features: spec.features.filter((key) => key !== "legend") }),
    );
  };

  test("should pick the palette by the same count the legend does", () => {
    const source = withoutLegend(recipeNamed("line-chart"));
    expect(source).toContain("state.categories.length > 6");
    expect(source).toContain("sszvis.scaleQual12().domain(state.categories)");
    expect(source).toContain("sszvis.scaleQual6().domain(state.categories)");
  });

  test("should let the legend supply the scale when it is shown", () => {
    expect(emit("line-chart")).toContain("const cScale = legendLayout.scale;");
  });
});
