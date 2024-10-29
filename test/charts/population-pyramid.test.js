import { ascending } from "d3";
import { test, describe, expect } from "vitest";
import { cascade } from "../../src/cascade";
import { stackedPyramidData } from "../../src/component/stackedPyramid";

const xAcc = (d) => d.xValue;
const yAcc = (d) => d.yValue;
const gAcc = (d) => d.gender;
const cAcc = (d) => d.category;

describe("population-pyramid", () => {
  const tidyData = [
    { yValue: 0, gender: "Frauen", xValue: 2126 },
    { yValue: 0, gender: "Männer", xValue: 2296 },
    { yValue: 1, gender: "Frauen", xValue: 2091 },
    { yValue: 1, gender: "Männer", xValue: 2281 },
    { yValue: 2, gender: "Frauen", xValue: 2043 },
    { yValue: 2, gender: "Männer", xValue: 2106 },
    { yValue: 3, gender: "Frauen", xValue: 1928 },
    { yValue: 3, gender: "Männer", xValue: 1978 },
    { yValue: 4, gender: "Frauen", xValue: 1648 },
    { yValue: 4, gender: "Männer", xValue: 1861 },
    { yValue: 5, gender: "Frauen", xValue: 1620 },
    { yValue: 5, gender: "Männer", xValue: 1751 },
    { yValue: 6, gender: "Frauen", xValue: 1598 },
    { yValue: 6, gender: "Männer", xValue: 1603 },
  ];

  test("when preparing data with population", () => {
    const grouper = cascade()
      .arrayBy(gAcc)
      .sort((a, b) => ascending(yAcc(a), yAcc(b)));

    const groupedData = grouper.apply(tidyData);

    for (const group of groupedData) {
      expect(group.map(gAcc).every((d) => d === gAcc(group[0]))).toBe(true);
    }
  });

  test("when preparing data with binnedData", () => {
    const grouper = cascade()
      .arrayBy(gAcc)
      .sort((a, b) => ascending(yAcc(a), yAcc(b)));

    const groupedData = grouper.apply(tidyData);

    const binWidth = 2;
    const binnedData = groupedData.map((group) => {
      const bins = [];
      for (let i = 0; i < group.length; i += binWidth) {
        const bin = group.slice(i, i + binWidth);
        const binData = bin.reduce(
          (acc, d) => ({ gender: gAcc(d), yValue: i + binWidth, xValue: xAcc(acc) + xAcc(d) }),
          {
            xValue: 0,
          }
        );
        bins.push(binData);
      }
      return bins;
    });
    for (const bin of binnedData) {
      expect(bin.map(gAcc).every((d) => d === gAcc(bin[0]))).toBe(true);
      expect(bin.map(yAcc).every((d) => d % binWidth == 0)).toBe(true);
    }
  });

  test("when preparing data with stackedData", () => {
    const stackedTidyData = [
      { yValue: 0, gender: "Frauen", category: "Hochschulabschluss", xValue: 675 },
      { yValue: 1, gender: "Frauen", category: "Hochschulabschluss", xValue: 747 },
      { yValue: 2, gender: "Frauen", category: "Hochschulabschluss", xValue: 842 },
      { yValue: 3, gender: "Frauen", category: "Hochschulabschluss", xValue: 869 },
      { yValue: 0, gender: "Frauen", category: "Andere", xValue: 1451 },
      { yValue: 1, gender: "Frauen", category: "Andere", xValue: 1344 },
      { yValue: 2, gender: "Frauen", category: "Andere", xValue: 1201 },
      { yValue: 3, gender: "Frauen", category: "Andere", xValue: 1059 },
      { yValue: 0, gender: "Männer", category: "Hochschulabschluss", xValue: 2061 },
      { yValue: 1, gender: "Männer", category: "Hochschulabschluss", xValue: 2047 },
      { yValue: 2, gender: "Männer", category: "Hochschulabschluss", xValue: 1872 },
      { yValue: 3, gender: "Männer", category: "Hochschulabschluss", xValue: 1693 },
      { yValue: 0, gender: "Männer", category: "Andere", xValue: 235 },
      { yValue: 1, gender: "Männer", category: "Andere", xValue: 234 },
      { yValue: 2, gender: "Männer", category: "Andere", xValue: 234 },
      { yValue: 3, gender: "Männer", category: "Andere", xValue: 285 },
    ];
    const stackedLayout = stackedPyramidData(gAcc, yAcc, cAcc, xAcc);
    const stackedData = stackedLayout(stackedTidyData);

    for (const side of stackedData) {
      expect(side.flatMap((d) => d.map((d) => d.side)).every((d) => d === side[0][0].side)).toBe(
        true
      );
      for (const series of side) {
        expect(series.map((d) => d.series).every((d) => d === series[0].series)).toBe(true);
        for (const stack of series) {
          expect(stack[0]).toBeDefined();
          expect(stack[1]).toBeDefined();
          expect(stack[0]).toBeLessThan(stack[1]);
          expect(stack).toHaveProperty("data");
          expect(stack).toHaveProperty("side");
          expect(stack).toHaveProperty("series");
          expect(stack).toHaveProperty("value");
        }
      }
    }
  });
});
