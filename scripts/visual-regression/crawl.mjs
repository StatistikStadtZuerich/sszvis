/**
 * Headless sweep over every comparable chart, loading each one against the
 * baseline release and against this working copy and diffing the outcome.
 *
 * Requires `npm run regression` to be running (or pass BASE=http://host:port).
 * Writes a JSON report plus screenshots of every flagged chart.
 *
 * Usage: node scripts/visual-regression/crawl.mjs [--limit N] [--concurrency N] [--shots]
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
const LIMIT = flag("limit", Infinity);
const CONCURRENCY = flag("concurrency", 6);
const SHOTS = args.includes("--shots");
/** Charts fetch their data, then transition; give rendering time to settle. */
const SETTLE_MS = flag("settle", 2500);

const VIEWPORT = { width: 700, height: 900 };

async function loadSide(context, chart, side) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/chart/${chart.path}?side=${side}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(SETTLE_MS);
    const snapshot = await page.evaluate(() =>
      window.__sszvisRegression ? window.__sszvisRegression() : null
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
  if (candidate.snapshot.errorCount > baseline.snapshot.errorCount) return "new-errors";
  if (candidate.snapshot.svgCount !== baseline.snapshot.svgCount) return "render-differs";
  if (candidate.snapshot.svgCount === 0) return "renders-nothing";
  return "ok";
}

const manifest = await fetch(`${BASE}/api/manifest.json`).then((r) => r.json());
const charts = manifest.filter((c) => c.comparable).slice(0, LIMIT);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const results = [];
let done = 0;

async function worker(queue) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  for (;;) {
    const chart = queue.shift();
    if (!chart) break;
    const [baseline, candidate] = await Promise.all([
      loadSide(context, chart, "baseline"),
      loadSide(context, chart, "candidate"),
    ]);
    const outcome = verdict(baseline, candidate);
    results.push({
      path: chart.path,
      name: chart.name,
      version: chart.version,
      verdict: outcome,
      baseline: baseline.snapshot ?? { fatal: baseline.fatal },
      candidate: candidate.snapshot ?? { fatal: candidate.fatal },
    });
    if (SHOTS && outcome !== "ok") {
      const dir = path.join(OUT, "shots", chart.name);
      await mkdir(dir, { recursive: true });
      if (baseline.shot) await writeFile(path.join(dir, "baseline.png"), baseline.shot);
      if (candidate.shot) await writeFile(path.join(dir, "candidate.png"), candidate.shot);
    }
    done++;
    process.stdout.write(`\r${done}/${charts.length} charts (${outcome.padEnd(15)})`);
  }
  await context.close();
}

const queue = [...charts];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue))
);
await browser.close();

results.sort((a, b) => a.path.localeCompare(b.path));
const summary = {};
for (const r of results) summary[r.verdict] = (summary[r.verdict] || 0) + 1;

await writeFile(
  path.join(OUT, "report.json"),
  JSON.stringify({ base: BASE, generated: new Date().toISOString(), summary, results }, null, 2)
);

process.stdout.write(`\n\nsummary: ${JSON.stringify(summary)}\n`);
for (const r of results.filter((r) => r.verdict !== "ok")) {
  const errs = (r.candidate.errors || []).slice(0, 2).join(" | ");
  process.stdout.write(`  ${r.verdict.padEnd(15)} ${r.name}  ${errs}\n`);
}
process.stdout.write(`\nreport: ${path.relative(process.cwd(), path.join(OUT, "report.json"))}\n`);
