import { describe, expect, test } from "vitest";
import {
  breakpointCreateSpec,
  breakpointDefaultSpec,
  breakpointFind,
  breakpointFindByName,
  breakpointLap,
  breakpointMatch,
  breakpointPalm,
  breakpointTest,
} from "../src/breakpoint.js";

/**
 * This file used to import responsiveProps rather than breakpoint, so its width -> prop
 * table duplicated responsiveProps.test.ts's boundary cases and src/breakpoint.ts itself
 * had no direct coverage at all. That table now lives in responsiveProps.test.ts, and this
 * file tests the module it is named after.
 *
 * The documented rule is that a breakpoint is an INCLUSIVE upper bound on every dimension,
 * and that an unspecified dimension becomes Infinity, so it matches anything.
 */
describe("breakpoint", () => {
  const spec = breakpointCreateSpec([
    { name: "small", width: 10 },
    { name: "medium", width: 20 },
  ]);

  describe("breakpointTest", () => {
    const small = breakpointFindByName(spec, "small") as never;

    test.each([
      [9, true],
      [10, true],
      [11, false],
    ])(
      "should report %s as matching=%s, since a breakpoint is an inclusive upper bound",
      (width, matches) => {
        expect(breakpointTest(small, { width })).toBe(matches);
      },
    );

    test("should match any width when the breakpoint does not constrain width", () => {
      const [unbounded] = breakpointCreateSpec([{ name: "any" }]);
      expect(breakpointTest(unbounded, { width: 1e6, screenHeight: 1e6 })).toBe(true);
    });

    test("should reject an empty measurement, because an absent dimension reads as Infinity", () => {
      expect(breakpointTest(small, {})).toBe(false);
    });

    test("should require every constrained dimension to fit, not just the width", () => {
      const [constrained] = breakpointCreateSpec([{ name: "both", width: 100, screenHeight: 100 }]);
      expect(breakpointTest(constrained, { width: 50, screenHeight: 50 })).toBe(true);
      expect(breakpointTest(constrained, { width: 50, screenHeight: 150 })).toBe(false);
    });
  });

  describe("breakpointFind", () => {
    test.each([
      [0, "small"],
      [10, "small"],
      [11, "medium"],
      [20, "medium"],
      [21, "_"],
    ])(
      "should select the first breakpoint that fits, so width %s resolves to %s",
      (width, name) => {
        expect(breakpointFind(spec, { width })?.name).toBe(name);
      },
    );
  });

  describe("breakpointMatch", () => {
    test("should return every breakpoint the measurement fits, not only the first", () => {
      // The difference from find: a sparse spec may need all the matches.
      expect(breakpointMatch(spec, { width: 5 }).map((bp) => bp.name)).toEqual([
        "small",
        "medium",
        "_",
      ]);
      expect(breakpointMatch(spec, { width: 15 }).map((bp) => bp.name)).toEqual(["medium", "_"]);
    });
  });

  describe("breakpointFindByName", () => {
    test("should return the named breakpoint when the spec holds one", () => {
      expect(breakpointFindByName(spec, "medium")?.measurement.width).toBe(20);
    });

    test("should return undefined when no breakpoint carries that name", () => {
      expect(breakpointFindByName(spec, "enormous")).toBeUndefined();
    });
  });

  describe("breakpointCreateSpec", () => {
    test("should append an unbounded '_' fallback so resolution always terminates", () => {
      expect(spec.map((bp) => bp.name)).toEqual(["small", "medium", "_"]);
      expect(spec.at(-1)?.measurement).toEqual({ width: Infinity, screenHeight: Infinity });
    });

    test("should accept a dimension given inline or nested under measurement", () => {
      const [inline, nested] = breakpointCreateSpec([
        { name: "inline", width: 42 },
        { name: "nested", measurement: { width: 42 } },
      ]);
      expect(inline.measurement).toEqual(nested.measurement);
    });
  });

  describe("the default spec", () => {
    test("should name palm, lap and the fallback in increasing order of width", () => {
      const widths = breakpointDefaultSpec().map((bp) => bp.measurement.width);
      expect(breakpointDefaultSpec().map((bp) => bp.name)).toEqual(["palm", "lap", "_"]);
      expect(widths).toEqual([...widths].sort((a, b) => a - b));
    });

    test.each([
      [540, true, true],
      [541, false, true],
      [749, false, true],
      [750, false, false],
    ])("should classify width %s as palm=%s and lap=%s", (width, isPalm, isLap) => {
      // palm and lap are the presets every responsive chart branches on, so their
      // boundaries are the module's most load-bearing numbers.
      expect(breakpointPalm({ width })).toBe(isPalm);
      expect(breakpointLap({ width })).toBe(isLap);
    });
  });
});
