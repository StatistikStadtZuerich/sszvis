import { expect, test } from "vitest";
import * as sszvis from "sszvis";

import { palettes } from "./palettes";

/** What a colour scale offers this file: the stops it was built from. */
type ColorScale = () => { range: () => readonly unknown[] };

const factoryFor = (name: string): ColorScale | undefined => {
  const found: unknown = Reflect.get(sszvis, name);
  return typeof found === "function" ? (found as ColorScale) : undefined;
};

/*
 * The swatch in the builder and the ramp in the chart have to be the same colours, and
 * nothing else makes them so: the builder reads them from the palette table and the chart
 * reads them from the library. Holding the table to `range()` is what keeps the two
 * together when the library restyles a scale - and it is also what catches a misspelled
 * factory name, which would otherwise emit a chart that throws on load.
 *
 * Here rather than beside the table's own tests because importing sszvis needs a document.
 */
test.each(palettes.map((palette) => [palette.value, palette] as const))(
  "should hold the library's own stops for %s",
  (_value, palette) => {
    const factory = factoryFor(palette.scale);
    expect(factory, `sszvis exports no ${palette.scale}`).toBeDefined();
    expect(factory?.().range().map(String)).toEqual(palette.stops);
  },
);
