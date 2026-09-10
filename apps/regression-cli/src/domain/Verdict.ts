/**
 * What one load of a chart reported, and how two of them compare.
 *
 * The verdicts separate breakage this working copy introduced from breakage
 * that was already there: an error both sides raise is a library or chart
 * fault that predates the working copy, worth filing but not worth blocking on.
 */
import { Schema } from "effect";

/**
 * Worst first, so a chart's verdict is the most serious thing seen at any width.
 */
export const SEVERITY = [
  "new-errors", // candidate raised errors the baseline did not
  "render-differs", // the two sides disagree on how many SVGs got drawn
  "renders-empty", // the candidate drew the SVG but none of the marks the baseline drew
  "load-failed", // the page did not load far enough to report
  "renders-nothing", // neither side drew anything
  "shared-errors", // both sides raised the same number of errors
  "fixed", // the baseline raised errors the candidate does not
  "ok",
] as const;

export const Verdict = Schema.Literals(SEVERITY);
export type Verdict = (typeof SEVERITY)[number];

export const worst = (verdicts: ReadonlyArray<Verdict>): Verdict =>
  SEVERITY.find((v) => verdicts.includes(v)) ?? "ok";

/** What the reporter injected into each page posts back. */
export const Snapshot = Schema.Struct({
  // The reporter hardcodes this. Validating it is what makes a decoded snapshot
  // identifiably ours rather than any object with the right numeric fields.
  type: Schema.Literal("sszvis-regression"),
  side: Schema.String,
  path: Schema.String,
  errors: Schema.Array(Schema.String),
  errorCount: Schema.Finite,
  resources: Schema.Array(Schema.String),
  resourceCount: Schema.Finite,
  svgCount: Schema.Finite,
  markCount: Schema.Finite,
  height: Schema.Finite,
});

export interface Snapshot extends Schema.Schema.Type<typeof Snapshot> {}

export const Unreported = Schema.Struct({ fatal: Schema.String });

export const SideOutcome = Schema.Union([Snapshot, Unreported]);
export type SideOutcome = Schema.Schema.Type<typeof SideOutcome>;

/**
 * Whether a side got far enough to report, as opposed to carrying only a reason
 * why not.
 *
 * Derived from the schema rather than probing for a field, so the two arms
 * cannot drift apart. A `_tag` discriminant would be the usual answer, but
 * `SideOutcome` is written verbatim into `report.json` and a tag would change
 * every entry in it.
 */
const isSnapshot = Schema.is(Snapshot);

export const marksOf = (outcome: SideOutcome): number =>
  isSnapshot(outcome) ? outcome.markCount : 0;

export const firstErrorOf = (outcome: SideOutcome): string | undefined =>
  isSnapshot(outcome) ? outcome.errors[0]?.split("\n")[0] : undefined;

export const fatalOf = (outcome: SideOutcome): string | undefined =>
  isSnapshot(outcome) ? undefined : outcome.fatal;

export const WidthOutcome = Schema.Struct({
  width: Schema.Finite,
  verdict: Verdict,
  baseline: SideOutcome,
  candidate: SideOutcome,
});

export interface WidthOutcome extends Schema.Schema.Type<typeof WidthOutcome> {}

export const ChartOutcome = Schema.Struct({
  path: Schema.String,
  name: Schema.String,
  version: Schema.String,
  verdict: Verdict,
  widths: Schema.Array(WidthOutcome),
});

export interface ChartOutcome extends Schema.Schema.Type<typeof ChartOutcome> {}

export const Report = Schema.Struct({
  base: Schema.String,
  generated: Schema.String,
  widths: Schema.Array(Schema.Finite),
  summary: Schema.Record(Schema.String, Schema.Finite),
  results: Schema.Array(ChartOutcome),
});

export interface Report extends Schema.Schema.Type<typeof Report> {}

/**
 * `svgCount` and the error log both stay clean when a chart draws its frame and
 * axes but joins no data, so the marks are compared separately.
 */
export const compare = (
  baseline: Snapshot | undefined,
  candidate: Snapshot | undefined,
): Verdict => {
  if (baseline === undefined || candidate === undefined) return "load-failed";
  if (candidate.errorCount > baseline.errorCount) return "new-errors";
  if (candidate.svgCount !== baseline.svgCount) return "render-differs";
  if (baseline.markCount > 0 && candidate.markCount === 0) return "renders-empty";
  if (baseline.errorCount > candidate.errorCount) return "fixed";
  if (candidate.svgCount === 0) return "renders-nothing";
  if (candidate.errorCount > 0) return "shared-errors";
  return "ok";
};
