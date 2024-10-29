import { cascade } from "../../src/cascade";
import { stack, extent } from "d3";
import { test, describe, expect } from "vitest";

const xAcc = (d) => d.xValue;
const yAcc = (d) => d.yValue;
const cAcc = (d) => d.category;

describe("area-chart-stacked", () => {
  test("when preparing data with stackedLayout", () => {
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

    expect(stackedData[0]).toHaveProperty("key");
    expect(stackedData[0]).toHaveProperty("index");
    expect(stackedData[0]).toHaveProperty("0");

    expect(stackedData[0][0][0]).toBeDefined();
    expect(stackedData[0][0][1]).toBeDefined();

    expect(stackedData[0][0][1]).toBe(stackedData[1][0][0]);

    expect(stackedData[0][0]).toHaveProperty("data");
  });
});
