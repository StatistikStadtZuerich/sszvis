import { expect, test } from "vitest";
import * as sszvis from "sszvis";

import { palettes } from "./palettes";

/** What a colour scale offers this file: the stops it was built from, and any domain. */
type ColorScale = () => { range: () => readonly unknown[]; domain: () => readonly unknown[] };

const factoryFor = (name: string): ColorScale | undefined => {
  const found: unknown = Reflect.get(sszvis, name);
  return typeof found === "function" ? (found as ColorScale) : undefined;
};

/* Everything but the entry that names no scale, which stands for whichever one the chart
   picks for itself and so has nothing here to be held to. */
const named = palettes.filter((palette) => palette.scale !== "");

/*
 * The swatch in the builder and the ramp in the chart have to be the same colours, and
 * nothing else makes them so: the builder reads them from the palette table and the chart
 * reads them from the library. Holding the table to `range()` is what keeps the two
 * together when the library restyles a scale - and it is also what catches a misspelled
 * factory name, which would otherwise emit a chart that throws on load.
 *
 * Here rather than beside the table's own tests because importing sszvis needs a document.
 */
test.each(named.map((palette) => [palette.value, palette] as const))(
  "should hold the library's own stops for %s",
  (_value, palette) => {
    const factory = factoryFor(palette.scale);
    expect(factory, `sszvis exports no ${palette.scale}`).toBeDefined();
    expect(factory?.().range().map(String)).toEqual(palette.stops);
  },
);

/*
 * And the values a keyed scale colours, which the panel holds the table up against. A value
 * written down wrongly here would have the panel promise a colour the chart never gives it,
 * which is the one mistake the warning exists to prevent.
 */
test.each(named.filter((palette) => palette.keys !== undefined).map((p) => [p.value, p] as const))(
  "should hold the library's own domain for %s",
  (_value, palette) => {
    expect(factoryFor(palette.scale)?.().domain()).toEqual(palette.keys);
  },
);

/* The other way round: a scale that carries no domain must not claim to colour values. */
test.each(named.filter((palette) => palette.keys === undefined).map((p) => [p.value, p] as const))(
  "should leave %s without values of its own",
  (_value, palette) => {
    const domain = factoryFor(palette.scale)?.().domain() ?? [];
    /* A linear scale reports d3's default [0, 1]; only strings would be values to colour. */
    expect(domain.filter((entry) => typeof entry === "string")).toEqual([]);
  },
);
