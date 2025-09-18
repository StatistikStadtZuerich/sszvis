import { describe, expect, test } from "vitest";
import { stackedBarHorizontalData } from "../../src/component/stackedBar";

const xAcc = (d) => d.xValue;
const yAcc = (d) => d.yValue;
const cAcc = (d) => d.category;

describe("bar-chart-horizontal", () => {
  test("when preparing data with stackedLayout for stacked bar charts", () => {
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

    const stackLayout = stackedBarHorizontalData(xAcc, cAcc, yAcc);

    const stackedData = stackLayout(tidyData);

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
});
