import { describe, expect, test } from "vitest";
import {
  aspectRatio,
  aspectRatio4to3,
  aspectRatio12to5,
  aspectRatio16to10,
  aspectRatioAuto,
} from "../src/aspectRatio";

describe("aspectRatio", () => {
  describe("aspectRatio", () => {
    test("should create aspect ratio function with correct calculation", () => {
      const ratio = aspectRatio(16, 9);
      expect(ratio(1600)).toBeCloseTo(900, 1);
      expect(ratio(800)).toBeCloseTo(450, 1);
    });

    test("should handle different aspect ratios", () => {
      const ratio43 = aspectRatio(4, 3);
      const ratio169 = aspectRatio(16, 9);
      expect(ratio43(400)).toBeCloseTo(300, 1);
      expect(ratio169(1920)).toBeCloseTo(1080, 1);
    });

    test("should handle edge cases", () => {
      const ratio = aspectRatio(1, 1);
      expect(ratio(100)).toBe(100);
      expect(ratio(0)).toBe(0);
    });

    test("should handle fractional ratios", () => {
      const ratio = aspectRatio(3, 2);
      expect(ratio(300)).toBe(200);
      expect(ratio(150)).toBe(100);
    });
  });

  describe("aspectRatio4to3", () => {
    test("should calculate 4:3 aspect ratio correctly", () => {
      expect(aspectRatio4to3(400)).toBeCloseTo(300, 1);
      expect(aspectRatio4to3(800)).toBeCloseTo(600, 1);
      expect(aspectRatio4to3(1200)).toBeCloseTo(900, 1);
    });

    test("should handle small values", () => {
      expect(aspectRatio4to3(4)).toBe(3);
      expect(aspectRatio4to3(40)).toBe(30);
    });
  });

  describe("aspectRatio16to10", () => {
    test("should calculate 16:10 aspect ratio correctly", () => {
      expect(aspectRatio16to10(1600)).toBe(1000);
      expect(aspectRatio16to10(800)).toBe(500);
      expect(aspectRatio16to10(320)).toBe(200);
    });

    test("should maintain precision", () => {
      expect(aspectRatio16to10(160)).toBe(100);
      expect(aspectRatio16to10(32)).toBe(20);
    });
  });

  describe("aspectRatio12to5", () => {
    test("should calculate 12:5 aspect ratio correctly", () => {
      expect(aspectRatio12to5(1200)).toBe(500);
      expect(aspectRatio12to5(600)).toBe(250);
      expect(aspectRatio12to5(240)).toBe(100);
    });

    test("should handle fractional results", () => {
      expect(aspectRatio12to5(120)).toBeCloseTo(50, 1);
      expect(aspectRatio12to5(360)).toBe(150);
    });
  });

  describe("aspectRatioAuto", () => {
    test("should handle different screen sizes", () => {
      const dimensions1 = {
        width: 400,
        screenWidth: 800,
        screenHeight: 600,
      };
      const dimensions2 = {
        width: 400,
        screenWidth: 1200,
        screenHeight: 800,
      };

      expect(aspectRatioAuto(dimensions1)).toBe(aspectRatioAuto(dimensions2));
    });
  });
});
