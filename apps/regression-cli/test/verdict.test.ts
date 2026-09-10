/**
 * The comparison rules, which are the whole judgement the harness makes.
 *
 * Each case names the situation it encodes rather than just the verdict, because
 * the ordering of the checks in `compare` is load-bearing: a candidate that both
 * raised new errors and drew fewer SVGs is `new-errors`, not `render-differs`.
 */
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Chart } from "../src/domain/Chart.ts";
import {
  compare,
  fatalOf,
  firstErrorOf,
  marksOf,
  type Snapshot,
  worst,
} from "../src/domain/Verdict.ts";

const snapshot = (over: Partial<Snapshot> = {}): Snapshot => ({
  type: "sszvis-regression",
  side: "baseline",
  path: "some/chart.html",
  errors: [],
  errorCount: 0,
  resources: [],
  resourceCount: 0,
  svgCount: 1,
  markCount: 10,
  height: 900,
  ...over,
});

describe("compare", () => {
  it("is ok when both sides drew the same SVGs with marks and no errors", () => {
    expect(compare(snapshot(), snapshot())).toBe("ok");
  });

  it("is ok when the candidate drew fewer marks but not zero", () => {
    // Deliberate: a mark-count drop is a smoke signal the side-by-side is for,
    // not something the sweep blocks on.
    expect(compare(snapshot({ markCount: 100 }), snapshot({ markCount: 3 }))).toBe("ok");
  });

  it("flags new-errors when the candidate raised more errors than the baseline", () => {
    expect(compare(snapshot(), snapshot({ errorCount: 1, errors: ["boom"] }))).toBe("new-errors");
  });

  it("prefers new-errors over render-differs when both are true", () => {
    expect(compare(snapshot(), snapshot({ errorCount: 1, errors: ["boom"], svgCount: 0 }))).toBe(
      "new-errors",
    );
  });

  it("flags render-differs when the sides disagree on how many SVGs were drawn", () => {
    expect(compare(snapshot(), snapshot({ svgCount: 2 }))).toBe("render-differs");
  });

  it("flags renders-empty when the candidate kept the SVG but lost every mark", () => {
    expect(compare(snapshot({ markCount: 5 }), snapshot({ markCount: 0 }))).toBe("renders-empty");
  });

  it("does not flag renders-empty when the baseline had no marks either", () => {
    // The precondition that makes the verdict mean "we broke this".
    expect(compare(snapshot({ markCount: 0 }), snapshot({ markCount: 0 }))).toBe("ok");
  });

  it("flags fixed when the baseline raised errors the candidate does not", () => {
    expect(compare(snapshot({ errorCount: 2, errors: ["a", "b"] }), snapshot())).toBe("fixed");
  });

  it("flags renders-nothing when neither side drew anything", () => {
    expect(
      compare(snapshot({ svgCount: 0, markCount: 0 }), snapshot({ svgCount: 0, markCount: 0 })),
    ).toBe("renders-nothing");
  });

  it("flags shared-errors when both sides raised the same number of errors", () => {
    const both = { errorCount: 1, errors: ["predates us"] };
    expect(compare(snapshot(both), snapshot(both))).toBe("shared-errors");
  });

  it("flags load-failed when either side never reported", () => {
    expect(compare(undefined, snapshot())).toBe("load-failed");
    expect(compare(snapshot(), undefined)).toBe("load-failed");
    expect(compare(undefined, undefined)).toBe("load-failed");
  });
});

describe("worst", () => {
  it("picks the most serious verdict seen at any width", () => {
    expect(worst(["ok", "renders-empty", "shared-errors"])).toBe("renders-empty");
    expect(worst(["fixed", "ok"])).toBe("fixed");
  });

  it("is ok for a chart with no widths at all", () => {
    expect(worst([])).toBe("ok");
  });
});

describe("side outcome accessors", () => {
  it("reads marks and the first error line from a side that reported", () => {
    const reported = snapshot({ markCount: 7, errors: ["TypeError: nope\n  at line 1"] });
    expect(marksOf(reported)).toBe(7);
    expect(firstErrorOf(reported)).toBe("TypeError: nope");
  });

  it("treats a side that never reported as zero marks and no error", () => {
    const failed = { fatal: "page.goto: Timeout 30000ms exceeded." };
    expect(marksOf(failed)).toBe(0);
    expect(firstErrorOf(failed)).toBeUndefined();
  });

  it("reads why a side never reported, which is all a load-failed chart has", () => {
    expect(fatalOf({ fatal: "page.goto: Timeout 30000ms exceeded." })).toBe(
      "page.goto: Timeout 30000ms exceeded.",
    );
    expect(fatalOf(snapshot())).toBeUndefined();
  });

  it("reports no error for a side that reported none", () => {
    expect(firstErrorOf(snapshot())).toBeUndefined();
  });
});

describe("Chart", () => {
  const chart = {
    path: "Statistik_Daten/1_Daten/BEV/BEV323V3230.html",
    group: "1_Daten / BEV",
    name: "BEV323V3230",
    title: "BEV323V3230",
    version: "3.4.0",
    comparable: true,
  };
  const decode = Schema.decodeUnknownEffect(Chart);
  const accepts = (over: Record<string, unknown>) =>
    Effect.runSync(Effect.exit(decode({ ...chart, ...over })))._tag === "Success";

  it("accepts a real catalogue entry", () => {
    expect(accepts({})).toBe(true);
  });

  it("accepts the umlauts eight real chart folders carry", () => {
    expect(accepts({ path: "Statistik_Daten/1_Daten/BEV541V5413_Sicherheitsgefühl/x.html" })).toBe(
      true,
    );
  });

  it.each(["../../../../tmp/pwned", "..", "a/b", "a\\b", "", "with space"])(
    "rejects the name %o, which would steer where screenshots are written",
    (name) => {
      // Under `--base` the catalogue is whatever a remote harness serves, and
      // `crawl` joins the name into the screenshot path.
      expect(accepts({ name })).toBe(false);
    },
  );

  it.each(["../escape/x.html", "a/../../x.html", "/absolute/x.html", "..", ""])(
    "rejects the path %o",
    (path) => {
      expect(accepts({ path })).toBe(false);
    },
  );

  it("keeps `..` legal inside a segment, which is not a climb", () => {
    expect(accepts({ path: "Statistik_Daten/od..d/x.html" })).toBe(true);
  });
});
