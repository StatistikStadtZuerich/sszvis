/**
 * Headless sweep over every comparable chart, loading each one against the
 * baseline release and against this working copy and diffing the outcome.
 *
 * Requires `npm run regression` to be running (or pass BASE=http://host:port).
 * Writes a JSON report plus screenshots of every flagged chart.
 *
 * Charts are responsive, and a fault often lives in one breakpoint only - the
 * choropleth and layout faults found in the first sweep all appeared at some
 * widths and not others. Every chart is therefore loaded at several widths, and
 * a chart's verdict is the worst of them.
 *
 * Usage: node scripts/visual-regression/crawl.mjs [--limit N] [--concurrency N]
 *                                                 [--widths 400,560,900] [--shots]
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || "http://localhost:8100";
const OUT = path.join(__dirname, "__report__");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
const listFlag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1].split(",").map(Number);
};
const LIMIT = flag("limit", Infinity);
const CONCURRENCY = flag("concurrency", 6);
const SHOTS = args.includes("--shots");
/** Charts fetch their data, then transition; give rendering time to settle. */
const SETTLE_MS = flag("settle", 2500);
/** Straddles the breakpoints the reference charts declare (280 / 516 and up). */
const WIDTHS = listFlag("widths", [400, 560, 900]);

/**
 * Worst-first, so a chart's verdict is the most serious thing seen at any width.
 *
 * The three that mean "our change broke this" are separated from the two that mean
 * "this was already broken": an error both sides raise is a library or chart fault
 * that predates the working copy, and is worth filing but not worth blocking on.
 */
const SEVERITY = [
  "new-errors", // candidate raised errors the baseline did not
  "render-differs", // the two sides disagree on how many SVGs got drawn
  "renders-empty", // the candidate drew the SVG but none of the marks in it
  "load-failed", // the page did not load far enough to report
  "renders-nothing", // neither side drew anything
  "shared-errors", // both sides raised the same number of errors
  "fixed", // the baseline raised errors the candidate does not
  "ok",
];

async function loadSide(context, chart, side) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/chart/${chart.path}?side=${side}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(SETTLE_MS);
    const snapshot = await page.evaluate(() =>
      window.__sszvisRegression ? window.__sszvisRegression() : null,
    );
    let shot = null;
    if (SHOTS) shot = await page.screenshot({ fullPage: true });
    return { snapshot, shot };
  } catch (error) {
    return { snapshot: null, shot: null, fatal: String(error).split("\n")[0] };
  } finally {
    await page.close();
  }
}

function verdict(baseline, candidate) {
  if (!baseline.snapshot || !candidate.snapshot) return "load-failed";
  const b = baseline.snapshot;
  const c = candidate.snapshot;
  if (c.errorCount > b.errorCount) return "new-errors";
  if (c.svgCount !== b.svgCount) return "render-differs";
  // svgCount and the error log both stay clean when a chart draws its frame and
  // axes but joins no data, so the marks are counted separately.
  if (b.markCount > 0 && c.markCount === 0) return "renders-empty";
  if (b.errorCount > c.errorCount) return "fixed";
  if (c.svgCount === 0) return "renders-nothing";
  if (c.errorCount > 0) return "shared-errors";
  return "ok";
}

const worst = (verdicts) => SEVERITY.find((v) => verdicts.includes(v)) ?? "ok";

const manifest = await fetch(`${BASE}/api/manifest.json`).then((r) => r.json());
const charts = manifest.filter((c) => c.comparable).slice(0, LIMIT);
const total = charts.length * WIDTHS.length;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const results = [];
let done = 0;

async function worker(queue) {
  for (;;) {
    const chart = queue.shift();
    if (!chart) break;
    const byWidth = [];
    for (const width of WIDTHS) {
      // A context per side per width: the viewport is fixed at creation, so the
      // chart runs its first render at the width under test rather than
      // re-laying out from a previous one.
      const [baseline, candidate] = await Promise.all(
        ["baseline", "candidate"].map(async (side) => {
          const context = await browser.newContext({ viewport: { width, height: 900 } });
          const result = await loadSide(context, chart, side);
          await context.close();
          return result;
        }),
      );
      const outcome = verdict(baseline, candidate);
      byWidth.push({
        width,
        verdict: outcome,
        baseline: baseline.snapshot ?? { fatal: baseline.fatal },
        candidate: candidate.snapshot ?? { fatal: candidate.fatal },
      });
      if (SHOTS && outcome !== "ok" && outcome !== "fixed") {
        const dir = path.join(OUT, "shots", `${chart.name}@${width}`);
        await mkdir(dir, { recursive: true });
        if (baseline.shot) await writeFile(path.join(dir, "baseline.png"), baseline.shot);
        if (candidate.shot) await writeFile(path.join(dir, "candidate.png"), candidate.shot);
      }
      done++;
      process.stdout.write(
        `\r${done}/${total} loads (${chart.name} @${width} ${outcome})`.padEnd(78),
      );
    }
    results.push({
      path: chart.path,
      name: chart.name,
      version: chart.version,
      verdict: worst(byWidth.map((w) => w.verdict)),
      widths: byWidth,
    });
  }
}

const queue = [...charts];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue)));
await browser.close();

results.sort((a, b) => a.path.localeCompare(b.path));
const summary = {};
for (const r of results) summary[r.verdict] = (summary[r.verdict] || 0) + 1;

await writeFile(
  path.join(OUT, "report.json"),
  JSON.stringify(
    { base: BASE, generated: new Date().toISOString(), widths: WIDTHS, summary, results },
    null,
    2,
  ),
);

process.stdout.write(`\n\nsummary: ${JSON.stringify(summary)}\n`);
for (const level of SEVERITY.filter((v) => v !== "ok")) {
  const hits = results.filter((r) => r.verdict === level);
  if (hits.length === 0) continue;
  process.stdout.write(`\n${level} (${hits.length})\n`);
  for (const r of hits) {
    const bad = r.widths.filter((w) => w.verdict === level);
    const at = bad.map((w) => w.width).join(",");
    const detail =
      level === "renders-empty"
        ? `${bad[0].baseline.markCount} marks -> 0`
        : ((bad[0].candidate.errors || bad[0].baseline.errors || [])[0] || "").split("\n")[0];
    process.stdout.write(`  ${r.name.padEnd(16)} @${at.padEnd(13)} ${detail}\n`);
  }
}
process.stdout.write(`\nreport: ${path.relative(process.cwd(), path.join(OUT, "report.json"))}\n`);
