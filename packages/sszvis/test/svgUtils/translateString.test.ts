import { describe, expect, test } from "vitest";
import translateString from "../../src/svgUtils/translateString.js";

describe("svgUtils/translateString", () => {
  test("should build a translate string from an x and a y component", () => {
    expect(translateString(10, 20)).toBe("translate(10,20)");
  });

  test("should handle zero", () => {
    expect(translateString(0, 0)).toBe("translate(0,0)");
  });

  test("should handle negative components", () => {
    expect(translateString(-10, -20)).toBe("translate(-10,-20)");
    expect(translateString(-10, 20)).toBe("translate(-10,20)");
  });

  test("should not round fractional components", () => {
    expect(translateString(1.5, 2.25)).toBe("translate(1.5,2.25)");
    expect(translateString(0.1, 0.2)).toBe("translate(0.1,0.2)");
  });

  test("should produce a value accepted as an svg transform attribute", () => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("transform", translateString(30, 40));
    expect(rect.getAttribute("transform")).toBe("translate(30,40)");
  });
});
