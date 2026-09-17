import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { measureDimensions } from "../src/measure.js";
import { responsiveProps } from "../src/responsiveProps.js";
import type { Measurement } from "../src/types.js";

describe("responsiveProps", () => {
  const testBreakpoints = [
    { name: "small", width: 400 },
    { name: "medium", width: 800 },
    { name: "large", width: 1200 },
  ];

  const at = (width: number, screenWidth = 1024, screenHeight = 768) => ({
    width,
    screenWidth,
    screenHeight,
  });

  describe("breakpoint resolution", () => {
    const queryProps = responsiveProps()
      .breakpoints([
        { name: "small", width: 10 },
        { name: "medium", width: 20 },
      ])
      .prop("example", { small: "A", medium: "B", _: "C" });

    // This table came from the file formerly named breakpoint.test.ts, which imported
    // responsiveProps and so duplicated the boundary cases below in a clearer form. It is
    // the clearer form that survived; breakpoint.test.ts now tests src/breakpoint.ts.
    test.each([
      [0, "A"],
      [10, "A"],
      [11, "B"],
      [20, "B"],
      [21, "C"],
    ])(
      "should resolve a width of %s to %s, a breakpoint's width being its inclusive upper bound",
      (width, expected) => {
        expect(queryProps({ width, screenWidth: 400, screenHeight: 300 }).example).toBe(expected);
      },
    );

    test.each([
      [300, "mobile"],
      [600, "tablet"],
      [1000, "desktop"],
      [1400, "wide"],
    ])(
      "should select the %s-wide breakpoint's value %s when breakpoints are customised",
      (width, expected) => {
        const rProps = responsiveProps().breakpoints(testBreakpoints).prop("layout", {
          small: "mobile",
          medium: "tablet",
          large: "desktop",
          _: "wide",
        });
        expect(rProps(at(width, 1600, 900)).layout).toBe(expected);
      },
    );

    test("should fall through to the next defined breakpoint when the matching one is omitted", () => {
      const rProps = responsiveProps().breakpoints(testBreakpoints).prop("spacing", {
        small: 5,
        // medium intentionally omitted
        large: 15,
        _: 20,
      });
      expect(rProps(at(600)).spacing).toBe(15);
    });

    test("should apply the default breakpoints when none are configured", () => {
      const rProps = responsiveProps().prop("test", { _: "default" });
      expect(rProps(at(500)).test).toBe("default");
    });
  });

  describe("prop specifications", () => {
    test("should resolve a prop declared as a static value", () => {
      const rProps = responsiveProps()
        .breakpoints(testBreakpoints)
        .prop("color", { small: "red", medium: "blue", large: "green", _: "black" });
      expect(rProps(at(600)).color).toBe("blue");
    });

    // The rows below all resolve to a number, so they share one numeric comparison.
    test.each([
      [
        "a function of the width",
        { small: (w: number) => w / 2, medium: (w: number) => w / 3, _: (w: number) => w / 5 },
        600,
        200,
      ],
      [
        "a mix of static and function values",
        { small: 10, medium: (w: number) => w * 0.05, large: 50, _: 100 },
        600,
        30,
      ],
      [
        // Absorbed from a "real-world usage patterns" test that re-ran the function-value
        // behaviour with an aspect-ratio flavoured fixture; kept as a row for its input.
        "a function reached through the widest breakpoint",
        {
          small: (w: number) => w / (4 / 3),
          medium: (w: number) => w / (16 / 9),
          large: (w: number) => w / (21 / 9),
          _: (w: number) => w / 2,
        },
        900,
        900 / (21 / 9),
      ],
      [
        // Absorbed from the second "real-world usage patterns" test, likewise a re-run.
        "a function with a floor applied",
        {
          small: (w: number) => Math.max(10, w / 40),
          large: (w: number) => Math.max(14, w / 60),
          _: 16,
        },
        1000,
        1000 / 60,
      ],
    ])("should resolve a prop declared as %s", (_label, spec, width, expected) => {
      const rProps = responsiveProps()
        .breakpoints(testBreakpoints)
        .prop("value", spec as never);
      expect(rProps(at(width, 1600, 900)).value).toBeCloseTo(expected as number, 4);
    });

    test("should resolve every prop independently when several are declared", () => {
      const rProps = responsiveProps()
        .breakpoints(testBreakpoints)
        .prop("columns", { small: 1, medium: 2, large: 3, _: 4 })
        .prop("fontSize", { small: 12, medium: 14, large: 16, _: 18 })
        .prop("orientation", { small: "vertical", medium: "horizontal", _: "horizontal" });
      const result = rProps(at(600));
      expect(result.columns).toBe(2);
      expect(result.fontSize).toBe(14);
      expect(result.orientation).toBe("horizontal");
    });

    test("should return an empty result when no props are declared", () => {
      expect(Object.keys(responsiveProps()(at(500)))).toHaveLength(0);
    });

    test("should constrain a breakpoint on the screen width as well as the element width", () => {
      const rProps = responsiveProps()
        .breakpoints([
          { name: "mobile", width: 600, screenWidth: 768 },
          { name: "desktop", width: 1000, screenWidth: 1200 },
        ])
        .prop("display", { mobile: "mobile-view", desktop: "desktop-view", _: "default-view" });
      expect(rProps(at(500, 600, 400)).display).toBe("mobile-view");
      expect(rProps(at(1000, 1400, 900)).display).toBe("desktop-view");
    });
  });

  describe("method chaining", () => {
    test("should return the same instance from every configuration method, so calls chain", () => {
      const rProps = responsiveProps();
      expect(rProps.breakpoints(testBreakpoints)).toBe(rProps);
      expect(rProps.prop("test", { _: "test" })).toBe(rProps);
    });

    test("should keep every prop declared along a chain", () => {
      const rProps = responsiveProps()
        .breakpoints(testBreakpoints)
        .prop("prop1", { _: "value1" })
        .prop("prop2", { _: "value2" });
      const result = rProps(at(500));
      expect(result.prop1).toBe("value1");
      expect(result.prop2).toBe("value2");
    });
  });

  describe("unusable measurements", () => {
    test.each([
      ["undefined", undefined],
      ["a string", "invalid"],
      ["an object without a width", { someOtherProp: 100 }],
    ])("should fall back to the '_' value when the measurement is %s", (_label, measurement) => {
      const rProps = responsiveProps().prop("test", { _: "fallback" });
      expect(rProps(measurement as unknown as Measurement).test).toBe("fallback");
    });

    test("should invoke a functorised fallback with a width of 0 when there is no measurement", () => {
      const rProps = responsiveProps().prop("height", { _: (w) => w + 10 });
      expect(rProps(undefined as unknown as Measurement).height).toBe(10);
    });
  });

  describe("diagnostics", () => {
    test("should warn but still resolve a prop whose spec names an unknown breakpoint", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      try {
        const rProps = responsiveProps().breakpoints(testBreakpoints).prop("spacing", {
          smal: 5, // typo for "small"
          _: 20,
        });

        const result = rProps(at(300));

        // The typo must be loud...
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("spacing"));
        // ...but the key must still exist, because the result type says it does.
        expect("spacing" in result).toBe(true);
        expect(result.spacing).toBe(20);
      } finally {
        warn.mockRestore();
      }
    });

    test("should warn but still write the key for a prop spec with no '_' fallback", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      try {
        // Missing '_' is a type error, so this is only reachable from untyped callers.
        const rProps = responsiveProps()
          .breakpoints(testBreakpoints)
          .prop("spacing", { small: 5 } as unknown as { _: number });

        // Wider than every breakpoint, so resolution has to reach for the absent '_'.
        const result = rProps(at(1500, 1600, 900));

        expect(warn).toHaveBeenCalledWith(expect.stringContaining("spacing"));
        expect("spacing" in result).toBe(true);
        expect(result.spacing).toBeUndefined();
      } finally {
        warn.mockRestore();
      }
    });

    test("should write the key for a spec with no '_' fallback when measurements are missing", () => {
      const rProps = responsiveProps().prop("spacing", { small: 5 } as unknown as { _: number });

      const result = rProps(undefined as unknown as Measurement);

      expect("spacing" in result).toBe(true);
      expect(result.spacing).toBeUndefined();
    });
  });

  describe("types", () => {
    test("should type the result from the prop definitions, not as unknown", () => {
      const queryProps = responsiveProps()
        .breakpoints(testBreakpoints)
        .prop("barPadding", { small: 4, _: 8 })
        .prop("axisOrientation", { small: "left" as const, _: "bottom" as const })
        .prop("height", { _: (w) => w / 2 });

      const props = queryProps(at(600));

      expectTypeOf(props.barPadding).toEqualTypeOf<number>();
      expectTypeOf(props.axisOrientation).toEqualTypeOf<"left" | "bottom">();
      expectTypeOf(props.height).toEqualTypeOf<number>();
    });

    test("should accept what measureDimensions returns", () => {
      const queryProps = responsiveProps().prop("barPadding", { _: 8 });
      // measureDimensions reports an undefined width for an element it cannot measure;
      // queryProps(measureDimensions(...)) is the most common line in any chart.
      const props = queryProps(measureDimensions("#does-not-exist"));
      expect(props.barPadding).toBe(8);
    });
  });
});
