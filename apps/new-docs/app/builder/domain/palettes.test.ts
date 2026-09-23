import { describe, expect, test } from "vitest";

import { colorScaleCode, DEFAULT_PALETTE, isDiverging, paletteChoices, palettes } from "./palettes";

/* The stops themselves are held to the library in `palettes.browser.test.ts`, which is where
   sszvis can be imported: its barrel measures the document as it loads. */
describe("the palette table", () => {
  test("should offer both families", () => {
    expect(new Set(paletteChoices.map((choice) => choice.group))).toEqual(
      new Set(["Sequential", "Diverging"]),
    );
  });

  test("should name every choice once", () => {
    expect(new Set(palettes.map((palette) => palette.value)).size).toBe(palettes.length);
    expect(new Set(palettes.map((palette) => palette.label)).size).toBe(palettes.length);
  });

  test("should carry the stops into the menu as the swatch", () => {
    expect(paletteChoices.map((choice) => choice.swatch)).toEqual(
      palettes.map((palette) => palette.stops),
    );
  });
});

describe("the colour scale a palette emits", () => {
  test("should read the zero-anchored domain when it is sequential", () => {
    expect(colorScaleCode("seq-grn")).toBe("sszvis.scaleSeqGrn().domain(state.valueDomain)");
  });

  /*
   * The other domain, and the reason the diverging feature exists: a ramp whose middle stop
   * is its neutral colour says nothing true on a domain running from zero to the maximum,
   * where the middle lands at half the largest value.
   */
  test("should read the straddling domain when it is diverging", () => {
    expect(colorScaleCode("div-val-gry")).toBe("sszvis.scaleDivValGry().domain(state.colorDomain)");
  });

  test("should fall back to the default when the spec names no palette", () => {
    expect(colorScaleCode("")).toBe(`sszvis.${DEFAULT_PALETTE.scale}().domain(state.valueDomain)`);
  });

  /* A saved spec can name a palette that has since been dropped; a map is still a map. */
  test("should fall back to the default when the spec names one that is gone", () => {
    expect(colorScaleCode("seq-chartreuse")).toBe(
      `sszvis.${DEFAULT_PALETTE.scale}().domain(state.valueDomain)`,
    );
  });
});

describe("asking whether a palette diverges", () => {
  test("should say so only for the diverging family", () => {
    expect(palettes.filter((palette) => isDiverging(palette.value)).map((p) => p.value)).toEqual([
      "div-val",
      "div-val-gry",
      "div-ntr",
      "div-ntr-gry",
    ]);
  });

  test("should say no for a palette it does not know", () => {
    expect(isDiverging("seq-chartreuse")).toBe(false);
  });
});
