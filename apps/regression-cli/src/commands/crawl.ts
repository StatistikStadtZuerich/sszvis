/**
 * `crawl` - the headless sweep.
 *
 * Loads every comparable chart against the baseline release and against this
 * working copy, diffs the outcome, and writes a JSON report plus screenshots of
 * every flagged chart.
 *
 * Charts are responsive and a fault often lives in one breakpoint only - the
 * choropleth and layout faults found in the first sweep all appeared at some
 * widths and not others. Every chart is therefore loaded at several widths, and
 * a chart's verdict is the worst of them.
 */
import { Console, DateTime, Effect, Layer, Option, Ref, Schema } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { Command, Flag } from "effect/unstable/cli";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/unstable/http";
import { type Chart, Charts, type Side } from "../domain/Chart.ts";
import {
  type ChartOutcome,
  compare,
  fatalOf,
  firstErrorOf,
  marksOf,
  Report,
  SEVERITY,
  type SideOutcome,
  Snapshot,
  type WidthOutcome,
  worst,
} from "../domain/Verdict.ts";
import { Browser } from "../services/Browser.ts";
import { baseUrl, harnessLayer } from "./serve.ts";
import { Manifest } from "../services/Manifest.ts";
import { Progress } from "../services/Progress.ts";
import { Workspace } from "../services/Workspace.ts";
import { userError } from "../userError.ts";

/**
 * Omitted, the sweep starts a harness of its own on a free port. Given, it
 * sweeps a `serve` already running and takes the chart list from that harness.
 */
const base = Flag.String("base").pipe(
  Flag.withDescription("Sweep an already-running harness instead of starting one"),
  Flag.optional,
);

const limit = Flag.Int("limit").pipe(
  Flag.withDescription("Sweep only the first N charts"),
  Flag.optional,
);

const concurrency = Flag.Int("concurrency").pipe(
  Flag.withDescription("How many charts to sweep at once"),
  Flag.withDefault(6),
);

const widths = Flag.String("widths").pipe(
  Flag.withDescription("Comma-separated viewport widths to load each chart at"),
  Flag.withDefault("400,560,900"),
  Flag.filterMap(
    (raw) => {
      const parsed = raw.split(",").map((part) => Number(part.trim()));
      return parsed.length > 0 && parsed.every((n) => Number.isInteger(n) && n > 0)
        ? Option.some(parsed)
        : Option.none();
    },
    (raw) => `Expected a comma-separated list of positive integers, got "${raw}"`,
  ),
);

/**
 * 2500ms matches the reporter's second re-report (see `Rewrite.ts`), by which
 * point a chart that fetches its data has normally drawn. Below ~800ms most
 * charts report before their data arrives and the sweep flags all of them.
 */
const settle = Flag.Int("settle").pipe(
  Flag.withDescription("Milliseconds to let each chart settle before reading it"),
  Flag.withDefault(2500),
);

const shots = Flag.Boolean("shots").pipe(
  Flag.withDescription("Save before/after screenshots of every flagged chart"),
  Flag.withDefault(false),
);

const decodeSnapshot = Schema.decodeUnknownEffect(Snapshot);

export const crawl = Command.make(
  "crawl",
  { base, limit, concurrency, widths, settle, shots },
  Effect.fn("crawl")(function* ({ base: baseFlag, limit, concurrency, widths, settle, shots }) {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const workspace = yield* Workspace;
    const browser = yield* Browser;
    const progress = yield* Progress;

    /**
     * Built rather than launched: the server lives for the scope of this sweep
     * and is torn down with it, instead of running until interrupted.
     */
    const base = yield* Option.match(baseFlag, {
      onSome: Effect.succeed,
      onNone: () =>
        Effect.flatMap(Layer.build(harnessLayer({ port: 0, quiet: true })), (context) =>
          Effect.provideContext(baseUrl, context),
        ),
    });
    yield* Effect.logInfo(`sweeping ${base}`);

    /**
     * A remote harness may serve a different reference checkout, so only it
     * knows which charts it can serve; pairing its pages with local paths would
     * report 404s as chart faults.
     */
    const all = yield* Option.match(baseFlag, {
      onSome: () =>
        Effect.gen(function* () {
          const client = yield* HttpClient.HttpClient;
          const charts = yield* client.get(`${base}/api/manifest.json`).pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(Charts)),
            Effect.catch((cause) =>
              userError(
                `Could not read the chart list from ${base}/api/manifest.json (${cause}).\n` +
                  "Check that a harness is serving there, or omit --base to have the sweep start its own.",
              ),
            ),
          );
          return charts.filter((chart) => chart.comparable);
        }),
      onNone: () => Effect.flatMap(Manifest, (manifest) => manifest.comparable),
    });
    const charts = Option.isSome(limit) ? all.slice(0, limit.value) : all;
    const done = yield* Ref.make(0);

    yield* fs.makeDirectory(workspace.reportDir, { recursive: true });

    const loadSide = Effect.fnUntraced(function* (chart: Chart, side: Side, width: number) {
      const load = yield* browser.load({
        url: `${base}/chart/${chart.path}?side=${side}`,
        width,
        settle: `${settle} millis`,
        shot: shots,
      });
      const snapshot = yield* decodeSnapshot(load.snapshot).pipe(Effect.option);
      if (Option.isNone(snapshot) && load.snapshot !== null && load.fatal === undefined) {
        // The reporter ran but its payload did not match: drift between it and
        // `Snapshot`, not a chart that failed.
        return { ...load, snapshot: undefined, fatal: "reporter payload did not decode" };
      }
      return { ...load, snapshot: Option.getOrUndefined(snapshot) };
    });

    const outcomeOf = (load: {
      readonly snapshot: Snapshot | undefined;
      readonly fatal: string | undefined;
    }): SideOutcome => load.snapshot ?? { fatal: load.fatal ?? "the page reported nothing" };

    const sweepWidth = Effect.fnUntraced(function* (chart: Chart, width: number) {
      // A tuple rather than a mapped array: `Effect.all` then types the two
      // results positionally, instead of widening them to `| undefined` under
      // `noUncheckedIndexedAccess`.
      const [baseline, candidate] = yield* Effect.all(
        [loadSide(chart, "baseline", width), loadSide(chart, "candidate", width)] as const,
        { concurrency: 2 },
      );
      const verdict = compare(baseline.snapshot, candidate.snapshot);

      if (shots && verdict !== "ok" && verdict !== "fixed") {
        const shotsRoot = path.join(workspace.reportDir, "shots");
        const dir = path.join(shotsRoot, `${chart.name}@${width}`);
        // `ChartName` already rules this out, but the write happens on data that
        // may have come from a remote harness, so the containment is asserted
        // here too rather than resting on a regex two modules away.
        if (!path.resolve(dir).startsWith(path.resolve(shotsRoot) + path.sep)) {
          return yield* userError(`Refusing to write a screenshot outside ${shotsRoot}.`);
        }
        yield* fs.makeDirectory(dir, { recursive: true });
        for (const [side, load] of [
          ["baseline", baseline],
          ["candidate", candidate],
        ] as const) {
          if (load.shot !== undefined) {
            yield* fs.writeFile(path.join(dir, `${side}.png`), load.shot);
          }
        }
      }

      const seen = yield* Ref.updateAndGet(done, (n) => n + 1);
      yield* progress.show(
        `${seen}/${charts.length * widths.length} loads (${chart.name} @${width} ${verdict})`,
      );

      return {
        width,
        verdict,
        baseline: outcomeOf(baseline),
        candidate: outcomeOf(candidate),
      } satisfies WidthOutcome;
    });

    const sweepChart = Effect.fnUntraced(function* (chart: Chart) {
      // Widths run in sequence: they share one chart and the concurrency budget
      // is spent across charts instead.
      const byWidth = yield* Effect.forEach(widths, (width) => sweepWidth(chart, width));
      return {
        path: chart.path,
        name: chart.name,
        version: chart.version,
        verdict: worst(byWidth.map((w) => w.verdict)),
        widths: byWidth,
      } satisfies ChartOutcome;
    });

    const results = yield* Effect.forEach(charts, sweepChart, { concurrency });
    yield* progress.done;

    const sorted = [...results].sort((a, b) => a.path.localeCompare(b.path));
    const summary: Record<string, number> = {};
    for (const result of sorted) summary[result.verdict] = (summary[result.verdict] ?? 0) + 1;

    const report: Report = {
      base,
      generated: DateTime.formatIso(yield* DateTime.now),
      widths,
      summary,
      results: sorted,
    };
    const reportFile = path.join(workspace.reportDir, "report.json");
    // The 2-space formatting is part of the report's shape, so the codec carries it.
    const json = yield* Schema.encodeEffect(Schema.fromJsonString(Report, { space: 2 }))(
      report,
    ).pipe(Effect.orDie);
    yield* fs.writeFileString(reportFile, json);

    /* --------------------------------------------------------------- summary */

    // A terminal line for the operator, not a document Schema needs to own.
    // @effect-diagnostics-next-line preferSchemaOverJson:off
    yield* Console.log(`\nsummary: ${JSON.stringify(summary)}`);
    for (const level of SEVERITY) {
      if (level === "ok") continue;
      const hits = sorted.filter((r) => r.verdict === level);
      if (hits.length === 0) continue;
      yield* Console.log(`\n${level} (${hits.length})`);
      for (const hit of hits) {
        const bad = hit.widths.filter((w) => w.verdict === level);
        const at = bad.map((w) => w.width).join(",");
        const first = bad[0];
        // Marks for the verdict about marks, the fatal for the load that never
        // reported, the first error for the rest.
        const detail =
          first === undefined
            ? ""
            : level === "renders-empty"
              ? `${marksOf(first.baseline)} marks -> 0`
              : level === "load-failed"
                ? (fatalOf(first.candidate) ?? fatalOf(first.baseline) ?? "")
                : (firstErrorOf(first.candidate) ?? firstErrorOf(first.baseline) ?? "");
        yield* Console.log(`  ${hit.name.padEnd(16)} @${at.padEnd(13)} ${detail}`);
      }
    }
    yield* Console.log(`\nreport: ${path.relative(workspace.repo, reportFile)}`);
  }, Effect.scoped),
).pipe(
  // Provided here, not at the root: only the sweep launches Chromium, writes a
  // progress line, or fetches a remote chart list under `--base`.
  Command.provide(Browser.layer),
  Command.provide(FetchHttpClient.layer),
  Command.provide(Progress.layer),
  Command.withDescription("Sweep every comparable chart headlessly and write a report"),
  Command.withExamples([
    { command: "sszvis-regression crawl", description: "Sweep every comparable chart" },
    {
      command: "sszvis-regression crawl --base http://localhost:8100",
      description: "Sweep a `serve` that is already running",
    },
    {
      command: "sszvis-regression crawl --concurrency 8 --shots",
      description: "Sweep faster and keep screenshots of what it flags",
    },
    {
      command: "sszvis-regression crawl --limit 20 --widths 400,900",
      description: "A quick pass over the first 20 charts at two widths",
    },
  ]),
);
