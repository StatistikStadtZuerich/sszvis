import { describe, expect, test } from "vitest";
import {
  aspectRatio,
  aspectRatio4to3,
  aspectRatio12to5,
  aspectRatio16to10,
  aspectRatioAuto,
  aspectRatioPortrait,
  aspectRatioSquare,
} from "../src/aspectRatio.js";

describe("aspectRatio", () => {
  describe("the base function", () => {
    // Ten assertions across four tests previously restated one formula, height = width / (x/y).
    test.each([
      [16, 9, 1600, 900],
      [16, 9, 800, 450],
      [16, 9, 1920, 1080],
      [4, 3, 400, 300],
      [1, 1, 100, 100],
      [1, 1, 0, 0],
      [3, 2, 300, 200],
      [3, 2, 150, 100],
    ])("should give a %s:%s ratio a height of %s for a width of %s", (x, y, width, height) => {
      expect(aspectRatio(x, y)(width)).toBeCloseTo(height, 4);
    });
  });

  describe("the unclamped presets", () => {
    test.each([
      ["aspectRatio4to3", aspectRatio4to3, 400, 300],
      ["aspectRatio4to3", aspectRatio4to3, 800, 600],
      ["aspectRatio4to3", aspectRatio4to3, 1200, 900],
      ["aspectRatio4to3", aspectRatio4to3, 4, 3],
      ["aspectRatio4to3", aspectRatio4to3, 40, 30],
      ["aspectRatio16to10", aspectRatio16to10, 1600, 1000],
      ["aspectRatio16to10", aspectRatio16to10, 800, 500],
      ["aspectRatio16to10", aspectRatio16to10, 320, 200],
      ["aspectRatio16to10", aspectRatio16to10, 160, 100],
      ["aspectRatio16to10", aspectRatio16to10, 32, 20],
    ])("should give %s a height of %s for a width of %s", (_name, preset, width, height) => {
      expect(preset(width)).toBeCloseTo(height, 4);
    });
  });

  describe("the clamped presets", () => {
    // The clamp is the only non-trivial behaviour in this module and had no test at all.
    test.each([
      ["aspectRatio12to5", aspectRatio12to5, 500, 1200],
      ["aspectRatioSquare", aspectRatioSquare, 420, 420],
      ["aspectRatioPortrait", aspectRatioPortrait, 600, 480],
    ])("should cap %s at %s once the width passes %s", (_name, preset, maxHeight, atWidth) => {
      expect(preset.MAX_HEIGHT).toBe(maxHeight);

      // Just below the threshold the ratio still governs...
      expect(preset(atWidth - 120)).toBeLessThan(maxHeight);
      // ...at it, the two agree...
      expect(preset(atWidth)).toBeCloseTo(maxHeight, 4);
      // ...and beyond it the height stops growing.
      expect(preset(atWidth * 2)).toBe(maxHeight);
      expect(preset(atWidth * 10)).toBe(maxHeight);
    });

    test.each([
      ["aspectRatio12to5", aspectRatio12to5, 600, 250],
      ["aspectRatio12to5", aspectRatio12to5, 240, 100],
      ["aspectRatio12to5", aspectRatio12to5, 120, 50],
      ["aspectRatio12to5", aspectRatio12to5, 360, 150],
    ])(
      "should give %s a height of %s for a width of %s, below the clamp",
      (_name, preset, width, height) => {
        expect(preset(width)).toBeCloseTo(height, 4);
      },
    );
  });

  describe("aspectRatioAuto", () => {
    // The previous test here asserted only that two widths resolving to the SAME breakpoint
    // produced the same ratio, which a constant-returning implementation would satisfy. These
    // assert which ratio each breakpoint actually selects.
    test.each([
      ["palm", 400, aspectRatio4to3(400)],
      ["palm at its upper bound", 540, aspectRatio4to3(540)],
      ["lap", 700, aspectRatio16to10(700)],
      ["lap at its upper bound", 749, aspectRatio16to10(749)],
      ["desk, past the last breakpoint", 1000, aspectRatio12to5(1000)],
    ])("should select the %s ratio for a width of %s", (_label, width, expected) => {
      expect(aspectRatioAuto({ width, screenWidth: 1600, screenHeight: 800 })).toBeCloseTo(
        expected,
        4,
      );
    });

    test("should select a different ratio either side of a breakpoint boundary", () => {
      const measurement = (width: number) => ({ width, screenWidth: 1600, screenHeight: 800 });
      // 540 is palm's inclusive upper bound, so 541 must fall through to lap.
      expect(aspectRatioAuto(measurement(540))).not.toBeCloseTo(
        aspectRatioAuto(measurement(541)),
        4,
      );
    });
  });
});
