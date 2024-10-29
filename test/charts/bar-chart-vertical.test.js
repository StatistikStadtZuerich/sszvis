import { extent, stack } from "d3";
import { test, describe, expect } from "vitest";
import { cascade } from "../../src/cascade";
import { stackedBarVerticalData } from "../../src/component/stackedBar";

const xAcc = (d) => d.xValue;
const yAcc = (d) => d.yValue;
const cAcc = (d) => d.category;

describe("bar-chart-vertical", () => {
  const tidyData = [
    { xValue: 1901, yValue: 8702, category: "Ausländer" },
    { xValue: 1902, yValue: 12_817, category: "Ausländer" },
    { xValue: 1903, yValue: 20_182, category: "Ausländer" },
    { xValue: 1904, yValue: 26_435, category: "Ausländer" },
    { xValue: 1901, yValue: 32_002, category: "Schweizer" },
    { xValue: 1902, yValue: 37_171, category: "Schweizer" },
    { xValue: 1903, yValue: 41_726, category: "Schweizer" },
    { xValue: 1904, yValue: 64_700, category: "Schweizer" },
  ];
  const categories = extent(tidyData, cAcc);

  test("when preparing data with stackedLayout for nested bar charts", () => {
    const stackLayout = stack().keys(categories);
    const stackedData = stackLayout(
      cascade()
        .arrayBy(xAcc)
        .objectBy(cAcc)
        .apply(tidyData)
        .map((d) => {
          const r = { xValue: xAcc(d[Object.keys(d)[0]][0]) };
          for (const k of categories) {
            r[k] = yAcc(d[k][0]);
          }
          return r;
        })
    );

    for (const bar of stackedData) {
      expect(bar).toHaveProperty("key");
      expect(bar).toHaveProperty("index");
      expect(bar).toHaveProperty("0");

      for (const stack of bar) {
        expect(stack[0]).toBeDefined();
        expect(stack[1]).toBeDefined();
        expect(stack[0]).toBeLessThan(stack[1]);

        expect(stack).toHaveProperty("data");
      }
    }
  });

  test("when preparing data with stackedLayout for stacked bar charts", () => {
    const stackLayout = stackedBarVerticalData(xAcc, cAcc, yAcc);
    // BUG: By default the `stackedBarVerticalData` does not sort by index
    const stackedData = stackLayout(tidyData).sort((a, b) => a.index - b.index);

    for (const bar of stackedData) {
      expect(bar).toHaveProperty("key");
      expect(bar).toHaveProperty("index");
      expect(bar).toHaveProperty("0");

      for (const stack of bar) {
        expect(stack[0]).toBeDefined();
        expect(stack[1]).toBeDefined();
        expect(stack[0]).toBeLessThan(stack[1]);

        expect(stack).toHaveProperty("data");
        expect(stack).toHaveProperty("series");
        expect(stack).toHaveProperty("stack");
      }
    }
  });

  test("when preparing data with groupedData for grouped bar charts", () => {
    const groupedData = cascade().arrayBy(xAcc).apply(tidyData);

    for (const group of groupedData) {
      expect(group.map((d) => xAcc(d)).every((d) => d === xAcc(group[0]))).toBe(true);
    }
  });
});
