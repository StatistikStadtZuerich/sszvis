import { describe, expect, test } from "vitest";
import {
  halfPixel,
  roundTransformString,
  transformTranslateSubpixelShift,
} from "../../src/svgUtils/crisp.js";

describe("svgUtils/crisp", () => {
  describe("halfPixel", () => {
    test("should snap an integer position to the following half pixel", () => {
      expect(halfPixel(0)).toBe(0.5);
      expect(halfPixel(10)).toBe(10.5);
    });

    test("should snap a fractional position down to the enclosing half pixel", () => {
      expect(halfPixel(10.1)).toBe(10.5);
      expect(halfPixel(10.4)).toBe(10.5);
      expect(halfPixel(10.6)).toBe(10.5);
      expect(halfPixel(10.999)).toBe(10.5);
    });

    test("should be idempotent", () => {
      expect(halfPixel(10.5)).toBe(10.5);
      expect(halfPixel(halfPixel(10.3))).toBe(halfPixel(10.3));
    });

    test("should handle negative positions", () => {
      expect(halfPixel(-1)).toBe(-0.5);
      expect(halfPixel(-0.5)).toBe(-0.5);
      expect(halfPixel(-1.5)).toBe(-1.5);
      expect(halfPixel(-1.2)).toBe(-1.5);
    });
  });

  describe("roundTransformString", () => {
    test("should round the translate coordinates and leave other instructions untouched", () => {
      expect(roundTransformString("translate(12.3,4.56789) rotate(3.5)")).toBe(
        "translate(12,4) rotate(3.5)"
      );
    });

    test("should normalize a space separator to a comma", () => {
      expect(roundTransformString("translate(12.3 4.56789)")).toBe("translate(12,4)");
    });

    test("should handle a translate with only an x component", () => {
      expect(roundTransformString("translate(12.3)")).toBe("translate(12)");
    });

    test("should leave a transform without a translate untouched", () => {
      expect(roundTransformString("rotate(45)")).toBe("rotate(45)");
      expect(roundTransformString("scale(1.5)")).toBe("scale(1.5)");
      expect(roundTransformString("")).toBe("");
    });

    test("should match the translate instruction case-insensitively and preserve its casing", () => {
      expect(roundTransformString("TRANSLATE(1.9,2.9)")).toBe("TRANSLATE(1,2)");
    });

    test("should leave already-rounded coordinates unchanged", () => {
      expect(roundTransformString("translate(12,4)")).toBe("translate(12,4)");
    });

    // Characterization tests: these pin down defects in the current implementation so a
    // behaviour-preserving port stays verifiable. Each carries a defect marker naming the
    // cause and the behaviour that would be correct instead.
    describe("known quirks", () => {
      test("floors rather than rounds coordinates", () => {
        // BUG: the JSDoc in crisp.js claims translate(12.3,4.56789) => translate(12,5),
        // but the implementation uses Math.floor. Either the doc or the rounding is wrong.
        // current: floors both components. expected (per the doc): rounds them.
        expect(roundTransformString("translate(0.9,0.9)")).toBe("translate(0,0)");
        expect(roundTransformString("translate(4.99,4.99)")).toBe("translate(4,4)");
      });

      test("leaves negative translate coordinates untouched", () => {
        // BUG: the match character class /[\d ,.]+/ omits "-", so the instruction does not
        // match at all and the string is returned verbatim. transformTranslateSubpixelShift
        // uses /[\d ,.-]+/ for the same job, so the two functions disagree on negatives.
        // current: "translate(-12.3,-4.9)". expected: "translate(-13,-5)".
        expect(roundTransformString("translate(-12.3,-4.9)")).toBe("translate(-12.3,-4.9)");
        expect(roundTransformString("translate(12.3,-4.9)")).toBe("translate(12.3,-4.9)");
      });

      test("rounds only the first translate instruction of a transform string", () => {
        // BUG: the match regex has no /g flag, so later translate instructions are skipped.
        // current: "translate(1,2) translate(3.5,4.5)". expected: both rounded.
        expect(roundTransformString("translate(1.5,2.5) translate(3.5,4.5)")).toBe(
          "translate(1,2) translate(3.5,4.5)"
        );
      });

      test("emits a spurious third component when the coordinates are padded with spaces", () => {
        // BUG: .replace(",", " ") and .replace(/\s+/, " ") both lack /g, so only the first
        // comma and the first whitespace run collapse. The surviving spaces split into an
        // extra empty component, which Number() turns into a third coordinate.
        // current: "translate(12,4,0)". expected: "translate(12,4)".
        expect(roundTransformString("translate( 12.3 , 4.9 )")).toBe("translate(12,4,0)");
      });

      test("emits NaN for a translate with more than two components", () => {
        // BUG: same non-global replace. After the first comma is collapsed, "2.5,3.5"
        // survives as one token and Number("2.5,3.5") is NaN, producing invalid SVG.
        // current: "translate(1,NaN)". expected: reject or round all three components.
        expect(roundTransformString("translate(1.5,2.5,3.5)")).toBe("translate(1,NaN)");
      });
    });
  });

  describe("transformTranslateSubpixelShift", () => {
    test("should return the subpixel offset of both components", () => {
      const [dx, dy] = transformTranslateSubpixelShift("translate(12.3,4.56789)");
      expect(dx).toBeCloseTo(0.3, 10);
      expect(dy).toBeCloseTo(0.56789, 10);
    });

    test("should accept a space separator", () => {
      const [dx, dy] = transformTranslateSubpixelShift("translate(12.3 4.9)");
      expect(dx).toBeCloseTo(0.3, 10);
      expect(dy).toBeCloseTo(0.9, 10);
    });

    test("should return a zero shift for integer coordinates", () => {
      expect(transformTranslateSubpixelShift("translate(12,4)")).toEqual([0, 0]);
    });

    test("should return a zero y shift for a translate with only an x component", () => {
      // BUG: the zero here is accidental. crisp.js pads the vector with `vec.push([0])`,
      // pushing an *array* rather than the number 0; it only yields 0 because [0] - 0
      // coerces to 0. The result is correct, but a typed port will reject the push.
      const [dx, dy] = transformTranslateSubpixelShift("translate(12.3)");
      expect(dx).toBeCloseTo(0.3, 10);
      expect(dy).toBe(0);
    });

    test("should ignore other transform instructions", () => {
      const [dx, dy] = transformTranslateSubpixelShift("translate(12.3,4.9) rotate(3.5)");
      expect(dx).toBeCloseTo(0.3, 10);
      expect(dy).toBeCloseTo(0.9, 10);
    });

    test("should return the distance above the enclosing pixel for negative coordinates", () => {
      // NOTE: not a defect. The shift is measured from Math.floor for consistency with
      // halfPixel, so -12.3 shifts by 0.7 rather than -0.3.
      const [dx, dy] = transformTranslateSubpixelShift("translate(-12.3,-4.9)");
      expect(dx).toBeCloseTo(0.7, 10);
      expect(dy).toBeCloseTo(0.1, 10);
    });

    test("throws when the transform string contains no translate instruction", () => {
      // BUG: the regex match result is dereferenced as m[2] without a null check, so any
      // transform lacking a translate throws instead of reporting "no shift".
      // current: TypeError. expected: [0, 0].
      expect(() => transformTranslateSubpixelShift("rotate(45)")).toThrow(TypeError);
      expect(() => transformTranslateSubpixelShift("")).toThrow(TypeError);
    });
  });

  describe("crisp helpers in combination", () => {
    test("shifting a transform by its subpixel shift yields integer coordinates", () => {
      const transform = "translate(12.3,4.9)";
      const [dx, dy] = transformTranslateSubpixelShift(transform);
      expect(12.3 - dx).toBeCloseTo(12, 10);
      expect(4.9 - dy).toBeCloseTo(4, 10);
      expect(roundTransformString(transform)).toBe("translate(12,4)");
    });
  });
});
