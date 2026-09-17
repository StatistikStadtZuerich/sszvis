import type { LabColor } from "d3";
import { describe, expect, test } from "vitest";
import {
  scaleDeepGry,
  scaleDimGry,
  scaleDivNtr,
  scaleDivNtrGry,
  scaleDivVal,
  scaleDivValGry,
  scaleGry,
  scaleLightGry,
  scaleMedGry,
  scalePaleGry,
  scaleQual6,
  scaleQual6a,
  scaleQual6b,
  scaleQual12,
  scaleSeqBlu,
  scaleSeqBrn,
  scaleSeqGrn,
  scaleSeqRed,
} from "../src/color.js";

const expectIsColor = (color: LabColor) => {
  expect(color).toHaveProperty("l");
  expect(color).toHaveProperty("a");
  expect(color).toHaveProperty("b");
};

describe("Color scales", () => {
  test.each<[string, () => { range(): LabColor[] }, number]>([
    ["scaleQual12", scaleQual12, 12],
    ["scaleQual6", scaleQual6, 6],
    ["scaleQual6a", scaleQual6a, 6],
    ["scaleQual6b", scaleQual6b, 6],
    ["scaleSeqBlu", scaleSeqBlu, 3],
    ["scaleSeqRed", scaleSeqRed, 3],
    ["scaleSeqGrn", scaleSeqGrn, 3],
    ["scaleSeqBrn", scaleSeqBrn, 3],
    ["scaleDivVal", scaleDivVal, 10],
    ["scaleDivValGry", scaleDivValGry, 9],
    ["scaleDivNtr", scaleDivNtr, 10],
    ["scaleDivNtrGry", scaleDivNtrGry, 9],
    ["scaleGry", scaleGry, 1],
    ["scaleDeepGry", scaleDeepGry, 1],
    ["scaleDimGry", scaleDimGry, 1],
    ["scaleLightGry", scaleLightGry, 1],
    ["scaleMedGry", scaleMedGry, 1],
    ["scalePaleGry", scalePaleGry, 1],
  ])("should offer its full set of colors when %s is built", (_name, scale, expectedLength) => {
    const range = scale().range();
    expect(range).toHaveLength(expectedLength);
    for (const color of range) {
      expectIsColor(color);
    }
  });

  describe("Diverging color scales", () => {
    test("should expand the domain across every range stop when a two-value domain is set", () => {
      const scale = scaleDivValGry().domain([-60, 60]);
      expect(scale.domain()).toEqual([-60, -45, -30, -15, 0, 15, 30, 45, 60]);
    });

    test("should map a value to the same colour as before when the domain has been read back", () => {
      const scale = scaleDivValGry().domain([-60, 60]);
      const before = String(scale(30));
      scale.domain();
      expect(String(scale(30))).toBe(before);
    });

    test("should still expand the domain across every stop when the scale is reversed", () => {
      const scale = scaleDivValGry().reverse().domain([-60, 60]);
      expect(scale.domain()).toHaveLength(scale.range().length);
      expect(scale.domain()).toEqual([-60, -45, -30, -15, 0, 15, 30, 45, 60]);
    });

    test("should map each end to the other's colour when the scale is reversed", () => {
      const forward = scaleDivValGry().domain([-60, 60]);
      const reversed = scaleDivValGry().reverse().domain([-60, 60]);
      expect(String(reversed(-60))).toBe(String(forward(60)));
      expect(String(reversed(60))).toBe(String(forward(-60)));
    });

    test("should take the domain verbatim when it holds more than two values", () => {
      const scale = scaleDivValGry().domain([-1, 0, 1]);
      expect(scale.domain()).toEqual([-1, 0, 1]);
    });
  });
});
