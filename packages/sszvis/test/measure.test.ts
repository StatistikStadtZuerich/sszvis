import { select } from "d3";
import { describe, expect, test, vi } from "vitest";
import {
  measureAxisLabel,
  measureDimensions,
  measureLegendLabel,
  measureText,
} from "../src/measure.js";

/**
 * A detached div whose width is stubbed, so the container-form tests measure the
 * argument handling rather than the layout engine. The one test that exercises real
 * layout is named for it.
 */
function stubbedDiv(width: number) {
  const div = document.createElement("div");
  div.getBoundingClientRect = vi.fn().mockReturnValue({ width });
  document.body.append(div);
  return div;
}

const screen = () => ({ screenWidth: window.innerWidth, screenHeight: window.innerHeight });

describe("measureDimensions", () => {
  test.each([
    ["a DOM element", (div: HTMLDivElement) => div],
    ["a d3 selection", (div: HTMLDivElement) => select(div)],
    [
      "a CSS selector",
      (div: HTMLDivElement) => {
        div.id = "measure-target";
        return "#measure-target";
      },
    ],
  ])("should report the element's width when given %s", (_label, toArgument) => {
    const div = stubbedDiv(500);
    expect(measureDimensions(toArgument(div))).toEqual({ width: 500, ...screen() });
  });

  test.each([
    ["a selector matches no element", "#non-existent"],
    ["there is nothing to measure", null],
  ])("should report an undefined width but still report the screen when %s", (_label, argument) => {
    expect(measureDimensions(argument as unknown as string)).toEqual({
      width: undefined,
      ...screen(),
    });
  });

  test("should measure the laid-out width when the element is really in the document", () => {
    // The only test here that does not stub getBoundingClientRect, so the only one that
    // proves the real measurement path works at all.
    const div = document.createElement("div");
    div.style.width = "200px";
    div.style.height = "100px";
    div.style.position = "absolute";
    div.style.top = "-9999px";
    document.body.append(div);

    expect(measureDimensions(div).width).toBeCloseTo(200, 0);
  });
});

/**
 * measureText wraps the canvas text metrics of whatever browser and font stack the suite
 * happens to run in, so an expected pixel width would pin the environment rather than any
 * sszvis behaviour and would break unactionably on a font or browser change. These assert
 * only the relations the callers (axis and legend label layout) actually rely on.
 */
describe("measureText", () => {
  const SHORT = "Test";
  const LONG = "The rabbit goes down the hole";
  const FAMILIES = ["Arial, sans-serif", "Times, serif", "Courier, monospace"];

  test.each(FAMILIES)("should report a wider result for a longer string in %s", (family) => {
    expect(measureText(16, family, LONG)).toBeGreaterThan(measureText(16, family, SHORT));
  });

  test.each(FAMILIES)("should grow the measured width with the font size in %s", (family) => {
    expect(measureText(16, family, SHORT)).toBeGreaterThan(measureText(9, family, SHORT));
    expect(measureText(36, family, SHORT)).toBeGreaterThan(measureText(16, family, SHORT));
  });

  test.each(FAMILIES)(
    "should scale the measured width in proportion to the font size in %s",
    (family) => {
      // Canvas advance widths are linear in the font size, so quadrupling the size should
      // quadruple the width. The tolerance absorbs hinting at small sizes.
      const ratio = measureText(36, family, LONG) / measureText(9, family, LONG);
      expect(ratio).toBeCloseTo(4, 0);
    },
  );

  test.each([16, 36])(
    "should report a wider result for a monospace face than a proportional one at %spx",
    (fontSize) => {
      const monospace = measureText(fontSize, "Courier, monospace", LONG);
      expect(monospace).toBeGreaterThan(measureText(fontSize, "Arial, sans-serif", LONG));
      expect(monospace).toBeGreaterThan(measureText(fontSize, "Times, serif", LONG));
    },
  );

  test("should report no width when the string is empty", () => {
    expect(measureText(16, "Arial, sans-serif", "")).toBe(0);
  });

  test("should report the same width when the same arguments are measured twice", () => {
    expect(measureText(16, "Arial, sans-serif", LONG)).toBe(
      measureText(16, "Arial, sans-serif", LONG),
    );
  });
});

describe("label presets", () => {
  test.each([
    ["measureAxisLabel", measureAxisLabel, 10],
    ["measureLegendLabel", measureLegendLabel, 12],
  ])("should measure %s at its fixed size and face", (_label, preset, fontSize) => {
    // Compared against measureText rather than a pixel number, so the preset's contract
    // (which size and face it pins) is asserted without depending on the font stack.
    for (const text of ["Test", "The rabbit goes down the hole"]) {
      expect(preset(text)).toBe(measureText(fontSize, "Arial, sans-serif", text));
    }
  });
});
