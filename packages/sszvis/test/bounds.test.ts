import { type BaseType, select } from "d3";
import { describe, expect, test } from "vitest";
import { type BoundsConfig, type BoundsResult, bounds } from "../src/bounds.js";

describe("bounds", () => {
  test.each<[string, BoundsConfig | undefined, Partial<BoundsResult>]>([
    [
      "nothing is configured",
      undefined,
      { width: 516, padding: { top: 0, right: 1, bottom: 0, left: 1 } },
    ],
    [
      "a width and height are given",
      { width: 800, height: 600 },
      { width: 800, height: 600, innerWidth: 798, innerHeight: 600 },
    ],
    [
      "all four padding sides are given",
      { width: 400, height: 300, top: 20, right: 30, bottom: 40, left: 50 },
      {
        innerWidth: 320,
        innerHeight: 240,
        padding: { top: 20, right: 30, bottom: 40, left: 50 },
      },
    ],
    [
      "only some padding sides are given",
      { top: 10, left: 20 },
      { padding: { top: 10, right: 1, bottom: 0, left: 20 } },
    ],
  ])(
    "should report the width, height and padding it derives when %s",
    (_when, config, expected) => {
      expect(config === undefined ? bounds() : bounds(config)).toMatchObject(expected);
    },
  );

  // Every DOM case below stubs getBoundingClientRect, so none of them exercises the real
  // measurement path - measure.test.ts owns that.
  describe("measuring a container", () => {
    const withMeasuredDiv = (width: number, prepare: (div: HTMLDivElement) => void = () => {}) => {
      const div = document.createElement("div");
      div.getBoundingClientRect = () => ({ width }) as DOMRect;
      prepare(div);
      document.body.append(div);
      return div;
    };

    test.each<[string, () => BoundsResult, number]>([
      ["an element passed alongside a config", () => bounds({}, withMeasuredDiv(500)), 500],
      [
        "an id selector passed alongside a config",
        () => {
          withMeasuredDiv(300, (div) => {
            div.id = "config-id-element";
          });
          return bounds({}, "#config-id-element");
        },
        300,
      ],
      [
        "an id selector on its own",
        () => {
          withMeasuredDiv(400, (div) => {
            div.id = "lone-id-element";
          });
          return bounds("#lone-id-element");
        },
        400,
      ],
      [
        "a class selector on its own",
        () => {
          withMeasuredDiv(350, (div) => {
            div.className = "lone-class-element";
          });
          return bounds(".lone-class-element");
        },
        350,
      ],
      [
        "a d3 selection passed alongside a config",
        () => {
          withMeasuredDiv(250, (div) => {
            div.id = "d3-selection-element";
          });
          // Selected by string so the selection carries d3's general BaseType generics.
          // select(element) narrows them to the concrete element and its null parent, which
          // d3's invariant `merge` signature then makes unassignable to sszvis's AnySelection.
          return bounds({}, select<BaseType, unknown>("#d3-selection-element"));
        },
        250,
      ],
    ])("should take its width from %s", (_form, makeBounds, expectedWidth) => {
      expect(makeBounds().width).toBe(expectedWidth);
    });

    test("should keep the configured width when a container is measured as well", () => {
      const div = withMeasuredDiv(500);
      expect(bounds({ width: 800 }, div).width).toBe(800);
    });
  });
});
