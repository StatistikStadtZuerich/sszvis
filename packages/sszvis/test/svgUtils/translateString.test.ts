import { describe, expect, test } from "vitest";
import translateString from "../../src/svgUtils/translateString.js";

describe("svgUtils/translateString", () => {
  test.each([
    [10, 20, "translate(10,20)"],
    [0, 0, "translate(0,0)"],
    [-10, -20, "translate(-10,-20)"],
    [-10, 20, "translate(-10,20)"],
    [1.5, 2.25, "translate(1.5,2.25)"],
    [0.1, 0.2, "translate(0.1,0.2)"],
  ])(
    'should return the exact unrounded translate string when given %s and %s ("%s")',
    (x, y, expected) => {
      expect(translateString(x, y)).toBe(expected);
    },
  );

  test("should return a value svg accepts when given a transform attribute to fill", () => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("transform", translateString(30, 40));
    expect(rect.getAttribute("transform")).toBe("translate(30,40)");
  });
});
