import { describe, expect, test } from "vitest";

import { parse } from "./csv";
import { ColumnName } from "./spec";
import {
  categoricalChoices,
  categoryScaleCode,
  colorScaleCode,
  continuousChoices,
  DEFAULT_CATEGORY_PALETTE,
  DEFAULT_PALETTE,
  isDiverging,
  DEFAULT_SERIES_PALETTE,
  palettes,
  seriesChoices,
  seriesScaleCode,
  unkeyedValues,
} from "./palettes";

/* The stops themselves are held to the library in `palettes.browser.test.ts`, which is where
   sszvis can be imported: its barrel measures the document as it loads. */
describe("the palette table", () => {
  test("should offer every family under a name of its own", () => {
    expect(new Set(continuousChoices.map((choice) => choice.group))).toEqual(
      new Set(["Sequential", "Diverging"]),
    );
    /* Automatic belongs to no family, which is what the undefined stands for. */
    expect(new Set(categoricalChoices.map((choice) => choice.group))).toEqual(
      new Set([undefined, "Categorical", "Gender"]),
    );
  });

  test("should name every choice once", () => {
    expect(new Set(palettes.map((palette) => palette.value)).size).toBe(palettes.length);
    expect(new Set(palettes.map((palette) => palette.label)).size).toBe(palettes.length);
  });

  test("should carry the stops into the menu as the swatch", () => {
    for (const choice of [...continuousChoices, ...categoricalChoices]) {
      const palette = palettes.find((entry) => entry.value === choice.value);
      expect(choice.swatch?.colors, choice.value).toEqual(palette?.stops);
    }
  });

  /*
   * Only a continuous scale interpolates between its stops. Blending a set of twelve
   * categories would draw a rainbow gradient and say the categories run into each other.
   */
  test("should blend a ramp's swatch and not a set's", () => {
    expect(continuousChoices.every((choice) => choice.swatch?.blend === true)).toBe(true);
    expect(categoricalChoices.every((choice) => choice.swatch?.blend === false)).toBe(true);
  });

  /* The two menus are separate, and neither offers what the other's charts can use. */
  test("should keep the families apart", () => {
    const continuous = new Set(continuousChoices.map((choice) => choice.value));
    const categorical = new Set(categoricalChoices.map((choice) => choice.value));
    expect([...continuous].filter((value) => categorical.has(value))).toEqual([]);
  });
});

describe("the colour scale a map is drawn with", () => {
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

  /* A saved spec can name a palette that has since been dropped, or one belonging to the
     other menu after a change of chart type; a map is still a map. */
  test.each(["seq-chartreuse", "qual6", "gender3"])(
    "should fall back to the default when the spec names %s",
    (value) => {
      expect(colorScaleCode(value)).toBe(
        `sszvis.${DEFAULT_PALETTE.scale}().domain(state.valueDomain)`,
      );
    },
  );
});

describe("the colour scale a categorical chart is drawn with", () => {
  /* What every one of these recipes emitted before there was anything to choose. */
  const AUTOMATIC =
    "state.categories.length > 6\n      ? sszvis.scaleQual12().domain(state.categories)\n      : sszvis.scaleQual6().domain(state.categories)";

  test("should leave the choice to the chart by default", () => {
    expect(categoryScaleCode(DEFAULT_CATEGORY_PALETTE.value)).toBe(AUTOMATIC);
  });

  /*
   * The domain has to be set: an sszvis qualitative scale declares an `unknown` colour,
   * which stops d3 extending the domain implicitly and paints every category alike.
   */
  test("should give a categorical scale the chart's own categories", () => {
    expect(categoryScaleCode("qual6b")).toBe("sszvis.scaleQual6b().domain(state.categories)");
  });

  /* And a keyed scale keeps the domain it carries, which is the whole point of choosing it. */
  test("should leave a keyed scale's own domain alone", () => {
    expect(categoryScaleCode("gender3")).toBe("sszvis.scaleGender3()");
  });

  test.each(["", "seq-blu", "div-ntr", "qual-chartreuse"])(
    "should fall back to automatic when the spec names %s",
    (value) => {
      expect(categoryScaleCode(value)).toBe(AUTOMATIC);
    },
  );
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

  test.each(["seq-chartreuse", "qual6", "gender3"])("should say no for %s", (value) => {
    expect(isDiverging(value)).toBe(false);
  });
});

describe("the values a choice will not be colouring", () => {
  const table = parse("Geschlecht,Anzahl\nFrauen,1\nMänner,2\nDivers,3");
  const column = ColumnName.make("Geschlecht");
  const choice = (value: string) => categoricalChoices.find((entry) => entry.value === value);

  test("should be none when every value is one the scale knows", () => {
    expect(unkeyedValues(choice("gender3"), table, column)).toEqual([]);
  });

  test("should name the values the scale was not built for", () => {
    const other = parse("Geschlecht,Anzahl\nFrauen,1\nweiblich,2\nmännlich,3");
    expect(unkeyedValues(choice("gender3"), other, column)).toEqual(["weiblich", "männlich"]);
  });

  /* A scale that colours positions rather than values colours whatever it is given. */
  test.each(["auto", "qual12", "qual6b"])("should be none for %s", (value) => {
    const other = parse("Geschlecht,Anzahl\na,1\nb,2");
    expect(unkeyedValues(choice(value), other, column)).toEqual([]);
  });

  test("should be none when the role has no column yet", () => {
    expect(unkeyedValues(choice("gender3"), table, undefined)).toEqual([]);
    expect(unkeyedValues(choice("gender3"), table, ColumnName.make(""))).toEqual([]);
  });

  test("should be none when the option names no choice at all", () => {
    expect(unkeyedValues(undefined, table, column)).toEqual([]);
  });
});

describe("the colour scale a chart with one series is drawn with", () => {
  /*
   * The domain is the fix, not a detail. An sszvis qualitative scale declares an `unknown`
   * colour, so a scale with nothing in its domain hands that colour back for every key -
   * and keeps handing back the same one after `darker()`, which is why the highlight a
   * tooltip drew was the colour the bar already was.
   */
  test("should name the series as the scale's whole domain", () => {
    expect(seriesScaleCode("qual6b")).toBe("sszvis.scaleQual6b().domain([SERIES_KEY])");
  });

  test("should draw in what it drew in before by default", () => {
    expect(seriesScaleCode(DEFAULT_SERIES_PALETTE.value)).toBe(
      "sszvis.scaleQual12().domain([SERIES_KEY])",
    );
  });

  /*
   * The four `qual` scales and nothing else: Automatic has nothing to decide where one
   * colour is picked, and a keyed scale colours values this chart does not have.
   */
  test("should offer the categorical scales alone", () => {
    expect(seriesChoices.map((choice) => choice.value)).toEqual([
      "qual12",
      "qual6",
      "qual6a",
      "qual6b",
    ]);
    expect(seriesChoices.every((choice) => choice.expects === undefined)).toBe(true);
  });

  /* One family, so the menu has no heading to draw over it. */
  test("should gather them under one name", () => {
    expect(new Set(seriesChoices.map((choice) => choice.group))).toEqual(new Set(["Categorical"]));
  });

  test.each(["", "auto", "gender3", "seq-blu", "qual-chartreuse"])(
    "should fall back to the default when the spec names %s",
    (value) => {
      expect(seriesScaleCode(value)).toBe("sszvis.scaleQual12().domain([SERIES_KEY])");
    },
  );
});
