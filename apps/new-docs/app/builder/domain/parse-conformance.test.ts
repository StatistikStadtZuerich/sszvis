import { timeFormatLocale } from "d3";
import { Option } from "effect";
import { describe, expect, test } from "vitest";

import { timeLocale } from "../../../../../packages/sszvis/src/locale.js";
import { parseAs } from "./csv";

/*
 * `domain/` reads dates itself rather than calling sszvis, which touches `document`
 * as it loads and so cannot be imported into the worker this runs in. That leaves
 * two readings of the same notation free to drift apart, and a builder that
 * disagrees with the code it writes is the bug this whole area keeps producing.
 *
 * So the same d3 parsers sszvis builds are built here from sszvis's own locale, and
 * every case is put to both. `parse.ts` in the library is three lines over these
 * two format strings; if it gains a third, this file should fail until it is taught
 * the new one.
 */
const locale = timeFormatLocale(timeLocale);
const sszvis = { swiss: locale.parse("%d.%m.%Y"), year: locale.parse("%Y") } as const;

const CASES = [
  "17.08.2014",
  "1.1.2020",
  "01.01.2020",
  /* Rolls over to 2 March rather than being refused. */
  "31.02.2020",
  "29.02.2021",
  /* Two-digit year, which `%Y` takes. */
  "17.08.14",
  "1999",
  "99",
  "0001",
  /* Five digits is past what `%Y` reads. */
  "12345",
  "017.08.2014",
  "17-08-2014",
  "2020-01-01",
  "1999.5",
  "-500",
  "2020a",
  "",
  " ",
  " 17.08.2014",
  "17.08.2014 ",
] as const;

describe("reading dates the way sszvis reads them", () => {
  test.for(["swiss", "year"] as const)(
    "should agree with sszvis.parse%s on every case",
    (format) => {
      for (const value of CASES) {
        const theirs = sszvis[format](value);
        const ours = Option.getOrNull(parseAs(format, value));
        expect(ours?.getTime() ?? null, `${format} ${JSON.stringify(value)}`).toBe(
          theirs?.getTime() ?? null,
        );
      }
    },
  );
});
