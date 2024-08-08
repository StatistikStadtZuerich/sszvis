import {
  scaleQual12,
  scaleQual6,
  scaleQual6a,
  scaleQual6b,
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
  scaleSeqBlu,
  scaleSeqBrn,
  scaleSeqGrn,
  scaleSeqRed,
} from "../src/color";
import { expect, test, describe } from "vitest";

const expectIsColor = (color) => {
  expect(color).toContain("rgb");
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
  });

  describe("Greyscale color scales", () => {
    test("should a single color", () => {
      expect(scaleGry().range()).toHaveLength(1);
      expectIsColor(scaleGry().range()[0]);
    });
    test("should a single color", () => {
      expect(scaleDeepGry().range()).toHaveLength(1);
      expectIsColor(scaleDeepGry().range()[0]);
    });
    test("should a single color", () => {
      expect(scaleDimGry().range()).toHaveLength(1);
      expectIsColor(scaleDimGry().range()[0]);
    });
    test("should a single color", () => {
      expect(scaleLightGry().range()).toHaveLength(1);
      expectIsColor(scaleLightGry().range()[0]);
    });
    test("should a single color", () => {
      expect(scaleMedGry().range()).toHaveLength(1);
      expectIsColor(scaleMedGry().range()[0]);
    });
    test("should a single color", () => {
      expect(scalePaleGry().range()).toHaveLength(1);
      expectIsColor(scalePaleGry().range()[0]);
    });
  });

  // Add more tests for sequential and diverging color scales here
});
