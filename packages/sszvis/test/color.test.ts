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

  describe("Qualitative color scales", () => {
    const qualScales: [string, typeof scaleQual12][] = [
      ["scaleQual12", scaleQual12],
      ["scaleQual6", scaleQual6],
      ["scaleQual6a", scaleQual6a],
      ["scaleQual6b", scaleQual6b],
    ];

    test.each(qualScales)(
      "should lower the lightness of every %s color when darkened",
      (_name, scale) => {
        const base = scale().range();
        for (const [i, color] of scale().darker().range().entries()) {
          expect(color.l).toBeLessThan(base[i].l);
        }
      },
    );

    test.each(qualScales)(
      "should raise the lightness of every %s color when brightened",
      (_name, scale) => {
        const base = scale().range();
        for (const [i, color] of scale().brighter().range().entries()) {
          expect(color.l).toBeGreaterThan(base[i].l);
        }
      },
    );

    test("should shift the lightness of a color looked up through the domain", () => {
      const scale = scaleQual6b().domain(["a"]);
      expect(scale.darker()("a").l).toBeLessThan(scale("a").l);
      expect(scale.brighter()("a").l).toBeGreaterThan(scale("a").l);
    });

    test("should leave the scale it was called on untouched", () => {
      const scale = scaleQual12();
      const before = scale.range().map((c) => c.l);
      scale.darker();
      scale.brighter();
      expect(scale.range().map((c) => c.l)).toEqual(before);
    });

    /* `copy()` hands back a bare d3 scale, so the result has to be re-decorated to stay chainable. */
    test("should hand back a scale that can be darkened and brightened again", () => {
      const scale = scaleQual12();
      for (const [i, color] of scale.darker().brighter().range().entries()) {
        expect(color.l).toBeCloseTo(scale.range()[i].l, 10);
      }
    });
  });
});
