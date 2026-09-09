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
  describe("Qualitative color scales", () => {
    test("should return an array of 12 colors for scaleQual12", () => {
      expect(scaleQual12().range()).toHaveLength(12);
    });
    test("should return an array of 6 colors for scaleQual6", () => {
      expect(scaleQual6().range()).toHaveLength(6);
    });
    test("should return an array of 6 colors for scaleQual6a", () => {
      expect(scaleQual6a().range()).toHaveLength(6);
    });
    test("should return an array of 6 colors for scaleQual6b", () => {
      expect(scaleQual6b().range()).toHaveLength(6);
    });
  });

  describe("Sequential color scales", () => {
    test("should return an array of 3 colors for scaleSeqBlu", () => {
      expect(scaleSeqBlu().range()).toHaveLength(3);
    });
    test("should return an array of 3 colors for scaleSeqRed", () => {
      expect(scaleSeqRed().range()).toHaveLength(3);
    });
    test("should return an array of 3 colors for scaleSeqGrn", () => {
      expect(scaleSeqGrn().range()).toHaveLength(3);
    });
    test("should return an array of 3 colors for scaleSeqBrn", () => {
      expect(scaleSeqBrn().range()).toHaveLength(3);
    });
  });

  describe("Diverging color scales", () => {
    test("should return an array of 10 colors for scaleDivVal", () => {
      expect(scaleDivVal().range()).toHaveLength(10);
    });
    test("should return an array of 10 colors for scaleDivVal", () => {
      expect(scaleDivVal().range()).toHaveLength(10);
    });
    test("should return an array of 9 colors for scaleDivValGry", () => {
      expect(scaleDivValGry().range()).toHaveLength(9);
    });
    test("should return an array of 10 colors for scaleDivNtr", () => {
      expect(scaleDivNtr().range()).toHaveLength(10);
    });
    test("should return an array of 9 colors for scaleDivNtrGry", () => {
      expect(scaleDivNtrGry().range()).toHaveLength(9);
    });

    test("reads back the domain expanded across the range's stops", () => {
      const scale = scaleDivValGry().domain([-60, 60]);
      expect(scale.domain()).toEqual([-60, -45, -30, -15, 0, 15, 30, 45, 60]);
    });

    test("keeps mapping values after the domain has been read", () => {
      const scale = scaleDivValGry().domain([-60, 60]);
      const before = String(scale(30));
      scale.domain();
      expect(String(scale(30))).toBe(before);
    });

    test("stays a diverging scale after reverse, expanding across every stop", () => {
      const scale = scaleDivValGry().reverse().domain([-60, 60]);
      expect(scale.domain()).toHaveLength(scale.range().length);
      expect(scale.domain()).toEqual([-60, -45, -30, -15, 0, 15, 30, 45, 60]);
    });

    test("reverses the range rather than only the first three stops", () => {
      const forward = scaleDivValGry().domain([-60, 60]);
      const reversed = scaleDivValGry().reverse().domain([-60, 60]);
      expect(String(reversed(-60))).toBe(String(forward(60)));
      expect(String(reversed(60))).toBe(String(forward(-60)));
    });

    test("expands a two-value domain but takes any other domain verbatim", () => {
      const scale = scaleDivValGry().domain([-1, 0, 1]);
      expect(scale.domain()).toEqual([-1, 0, 1]);
    });
  });

  describe("Greyscale color scales", () => {
    test("should a single color for scaleGry", () => {
      expect(scaleGry().range()).toHaveLength(1);
      expectIsColor(scaleGry().range()[0]);
    });
    test("should a single color for scaleDeepGry", () => {
      expect(scaleDeepGry().range()).toHaveLength(1);
      expectIsColor(scaleDeepGry().range()[0]);
    });
    test("should a single color for scaleDimGry", () => {
      expect(scaleDimGry().range()).toHaveLength(1);
      expectIsColor(scaleDimGry().range()[0]);
    });
    test("should a single color for scaleLightGry", () => {
      expect(scaleLightGry().range()).toHaveLength(1);
      expectIsColor(scaleLightGry().range()[0]);
    });
    test("should a single color for scaleMedGry", () => {
      expect(scaleMedGry().range()).toHaveLength(1);
      expectIsColor(scaleMedGry().range()[0]);
    });
    test("should a single color for scalePaleGry", () => {
      expect(scalePaleGry().range()).toHaveLength(1);
      expectIsColor(scalePaleGry().range()[0]);
    });
  });

  // Add more tests for sequential and diverging color scales here
});
