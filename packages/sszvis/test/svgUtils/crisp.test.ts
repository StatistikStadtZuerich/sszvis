import { describe, expect, test } from "vitest";
import {
  halfPixel,
  roundTransformString,
  transformTranslateSubpixelShift,
} from "../../src/svgUtils/crisp.js";

describe("svgUtils/crisp", () => {
  describe("halfPixel", () => {
    test.each([
      [0, 0.5],
      [10, 10.5],
      [10.1, 10.5],
      [10.4, 10.5],
      [10.6, 10.5],
      [10.999, 10.5],
      [-1, -0.5],
      [-0.5, -0.5],
      [-1.5, -1.5],
      [-1.2, -1.5],
    ])("should return the half pixel of the enclosing pixel when given %s", (input, expected) => {
      expect(halfPixel(input)).toBe(expected);
    });

    test("should return an unchanged position when given an already snapped position", () => {
      expect(halfPixel(10.5)).toBe(10.5);
      expect(halfPixel(halfPixel(10.3))).toBe(halfPixel(10.3));
    });
  });

  describe("roundTransformString", () => {
    test.each([
      ["translate(12.3,4.56789) rotate(3.5)", "translate(12,4) rotate(3.5)"],
      ["translate(12.3 4.56789)", "translate(12,4)"],
      ["translate(12.3)", "translate(12)"],
      ["rotate(45)", "rotate(45)"],
      ["scale(1.5)", "scale(1.5)"],
      ["", ""],
      ["TRANSLATE(1.9,2.9)", "TRANSLATE(1,2)"],
      ["translate(12,4)", "translate(12,4)"],
      ["translate(-12.3,-4.9)", "translate(-13,-5)"],
      ["translate(12.3,-4.9)", "translate(12,-5)"],
      ["translate( 12.3 , 4.9 )", "translate(12,4)"],
      ["translate(  12.3   4.9  )", "translate(12,4)"],
    ])(
      'should return "%s" as "%s" when crisping its translate and leaving other instructions untouched',
      (input, expected) => {
        expect(roundTransformString(input)).toBe(expected);
      },
    );

    // Characterization tests: these pin down defects in the current implementation so a
    // behaviour-preserving port stays verifiable. Each carries a defect marker naming the
    // cause and the behaviour that would be correct instead.
    describe("known quirks", () => {
      test("floors rather than rounds coordinates", () => {
        // NOTE: not a defect. Flooring is deliberate and consistent with halfPixel — both
        // move a coordinate to the origin of its enclosing pixel. The JSDoc used to claim
        // rounding (translate(12,5)); that error is corrected in crisp.ts.
        expect(roundTransformString("translate(0.9,0.9)")).toBe("translate(0,0)");
        expect(roundTransformString("translate(4.99,4.99)")).toBe("translate(4,4)");
      });

      test("rounds only the first translate instruction of a transform string", () => {
        // NOTE: documented scope, not a defect. The match regex has no /g flag, so only the
        // first translate instruction is processed. Crisping a single translate is all this
        // is used for; see the scope paragraph in the crisp.ts JSDoc.
        expect(roundTransformString("translate(1.5,2.5) translate(3.5,4.5)")).toBe(
          "translate(1,2) translate(3.5,4.5)",
        );
      });

      test("floors every component of a translate with more than two components", () => {
        // NOTE: a three-component translate is not valid SVG, so this is undefined-input
        // behaviour rather than a guarantee. Pinned so a future change is visible.
        expect(roundTransformString("translate(1.5,2.5,3.5)")).toBe("translate(1,2,3)");
      });
    });
  });

  describe("transformTranslateSubpixelShift", () => {
    test.each<[string, [number, number]]>([
      ["translate(12.3,4.56789)", [0.3, 0.56789]],
      ["translate(12.3 4.9)", [0.3, 0.9]],
      ["translate(12,4)", [0, 0]],
      ["translate(12.3,4.9) rotate(3.5)", [0.3, 0.9]],
      ["rotate(45)", [0, 0]],
      ["", [0, 0]],
    ])(
      'should return the subpixel shift of the translate when given "%s"',
      (input, [expectedDx, expectedDy]) => {
        const [dx, dy] = transformTranslateSubpixelShift(input);
        expect(dx).toBeCloseTo(expectedDx, 10);
        expect(dy).toBeCloseTo(expectedDy, 10);
      },
    );

    test("should return a zero y shift for a translate with only an x component", () => {
      // NOTE: resolved by the TypeScript port. The original padded the vector with
      // `vec.push([0])` — an *array*, not the number 0 — which only yielded 0 because
      // [0] - 0 coerces to 0. The port pushes 0 directly; the output is unchanged.
      const [dx, dy] = transformTranslateSubpixelShift("translate(12.3)");
      expect(dx).toBeCloseTo(0.3, 10);
      expect(dy).toBe(0);
    });

    test("should return the distance above the enclosing pixel for negative coordinates", () => {
      // NOTE: not a defect. The shift is measured from Math.floor for consistency with
      // halfPixel, so -12.3 shifts by 0.7 rather than -0.3.
      const [dx, dy] = transformTranslateSubpixelShift("translate(-12.3,-4.9)");
      expect(dx).toBeCloseTo(0.7, 10);
      expect(dy).toBeCloseTo(0.1, 10);
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
