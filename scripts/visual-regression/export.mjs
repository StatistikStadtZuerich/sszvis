/**
 * Writes the side-by-side comparison out as a static directory, so it can be
 * shared without a checkout of this repository or of the reference charts.
 *
 * The server's only runtime job is rewriting each chart page's hardcoded library
 * URLs, which is a build step in disguise: do it once per side up front and the
 * result is plain files. Both copies of a page live beside the data they load, as
 * `<name>.baseline.html` and `<name>.candidate.html`, and point at a `lib/` folder
 * at the export root by a relative path.
 *
 * The export still has to be served over HTTP - the charts fetch their CSV and
 * TopoJSON, which a browser refuses to do from `file://` - so START-HERE.md tells
 * the recipient how. That is a one-line command, not a checkout.
 *
 * Usage: npm run regression:export -- [--out DIR] [--flagged] [--limit N] [--no-zip]
 */

import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LIB_FILES, REF, buildManifest, resolveLib, rewriteChart } from "./harness.mjs";

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT = path.join(__dirname, "__report__", "report.json");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const LIMIT = Number(flag("limit", Infinity));
const FLAGGED_ONLY = args.includes("--flagged");
const ZIP = !args.includes("--no-zip");

const stamp = new Date().toISOString().slice(0, 10);
// The suffix keeps a flagged export from overwriting a full one taken the same day.
const NAME = `sszvis-regression-${stamp}${FLAGGED_ONLY ? "-flagged" : ""}`;
const OUT = path.resolve(flag("out", path.join(__dirname, "__export__", NAME)));

/* ------------------------------------------------------------ chart selection */

const manifest = (await buildManifest()).filter((c) => c.comparable);

/**
 * `--flagged` narrows the export to what a previous sweep found wanting, which is
 * the difference between something emailable and something that needs hosting.
 */
let charts = manifest;
let report = null;
if (FLAGGED_ONLY) {
  if (!existsSync(REPORT)) {
    console.error(`--flagged needs a sweep report at ${path.relative(process.cwd(), REPORT)}.`);
    console.error("Run: npm run regression:crawl");
    process.exit(1);
  }
  report = JSON.parse(await readFile(REPORT, "utf8"));
  const wanted = new Set(
    report.results.filter((r) => r.verdict !== "ok" && r.verdict !== "fixed").map((r) => r.path)
  );
  charts = manifest.filter((c) => wanted.has(c.path));
}
charts = charts.slice(0, LIMIT);

if (charts.length === 0) {
  console.error("Nothing to export.");
  process.exit(1);
}

/* -------------------------------------------------------------------- copying */

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/** Every asset in a chart's own folder: its data, its script, its fallback image. */
async function copyChartFolder(relDir) {
  const from = path.join(REF, relDir);
  const to = path.join(OUT, "chart", relDir);
  await mkdir(to, { recursive: true });
  // The folder minus the chart pages themselves: those are written per side below,
  // and the originals would only point at a host the recipient cannot reach.
  await cp(from, to, { recursive: true, filter: (src) => !src.endsWith(".html") });
}

const versions = new Set(charts.map((c) => c.version));
for (const version of versions) {
  for (const side of ["baseline", "candidate"]) {
    const dir = path.join(OUT, "lib", side, version);
    await mkdir(dir, { recursive: true });
    for (const file of LIB_FILES) {
      const source = resolveLib(side, version, file);
      if (existsSync(source)) await copyFile(source, path.join(dir, file));
    }
  }
}

const folders = new Set();
let written = 0;

for (const chart of charts) {
  const relDir = path.dirname(chart.path);
  if (!folders.has(relDir)) {
    await copyChartFolder(relDir);
    folders.add(relDir);
  }
  const html = await readFile(path.join(REF, chart.path), "utf8");
  const outDir = path.join(OUT, "chart", relDir);
  // How far this page sits below the export root, so `lib/` resolves without a server.
  const libPrefix = `${path.relative(outDir, OUT).split(path.sep).join("/")}/lib/`;
  const base = path.basename(chart.path, ".html");
  for (const side of ["baseline", "candidate"]) {
    await writeFile(
      path.join(outDir, `${base}.${side}.html`),
      rewriteChart(html, side, chart.path, libPrefix)
    );
  }
  written++;
  process.stdout.write(`\r${written}/${charts.length} charts`);
}

/* ------------------------------------------------------------------- the shell */

await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(charts, null, 2));
if (report) await copyFile(REPORT, path.join(OUT, "report.json"));

// The comparison page is shared with the server; a flag at the top switches it to
// addressing the per-side files this export just wrote.
const page = await readFile(path.join(__dirname, "index.html"), "utf8");
await writeFile(
  path.join(OUT, "index.html"),
  page.replace("<script>", "<script>window.__REGRESSION_STATIC__ = true;</script>\n    <script>")
);

await writeFile(
  path.join(OUT, "START-HERE.md"),
  `# sszvis side-by-side comparison — ${stamp}

${charts.length} charts, each rendered twice: the pinned sszvis release the chart was
written against ("current"), and the development build this snapshot was taken from
("working copy").

## Viewing it

The charts load their data files over HTTP, which a browser will not do from a
\`file://\` page — so opening \`index.html\` by double-clicking shows empty charts.
Serve the folder instead, from inside it:

    npx serve .

or, with no Node available:

    python3 -m http.server 8000

Then open the address it prints (\`http://localhost:3000\` or \`http://localhost:8000\`).

## Reading it

One row per chart, current on the left, working copy on the right. Each pane reports
how many SVGs it drew and how many errors it raised:

- **matches baseline** — same number of rendered charts, no new errors
- **new errors in candidate** — the working copy threw where the release did not
- **render count differs** — one side drew a chart and the other did not
- **nothing rendered on either side** — broken independently of the working copy

Filter by chart id, folder or library version at the top; "only flagged" narrows to
rows where the two sides disagree. "fit to content" sizes each pane to its chart.

A caveat worth knowing: a chart that only fails when a render lands before its data
arrives will flag on one load and not the next, and can flag on either side. If a row
looks wrong, reload it a few times before believing it.

## What is in here

    index.html      the comparison page
    manifest.json   the chart list it reads
    chart/          each chart, its data, and one page per side
    lib/baseline/   the pinned sszvis release, with its d3 and topojson
    lib/candidate/  the working copy's build, with the same d3 and topojson
${report ? "    report.json     verdicts from the headless sweep this export was filtered by\n" : ""}
Only sszvis differs between the two sides. d3 and topojson are the same files in
both, so nothing here is explained by a different d3.
`
);

process.stdout.write("\n");

/* ----------------------------------------------------------------------- zip */

let zipPath = null;
if (ZIP) {
  zipPath = `${OUT}.zip`;
  await rm(zipPath, { force: true });
  try {
    await run("zip", ["-rq", zipPath, path.basename(OUT)], { cwd: path.dirname(OUT) });
  } catch (error) {
    console.error(`\ncould not create the zip (${error.message.split("\n")[0]}).`);
    console.error(`the folder itself is complete at ${OUT}`);
    zipPath = null;
  }
}

const size = async (target) => {
  const { stdout } = await run("du", ["-sh", target]);
  return stdout.split("\t")[0].trim();
};

console.log(`\n${charts.length} charts exported${FLAGGED_ONLY ? " (flagged only)" : ""}`);
console.log(`  folder  ${path.relative(process.cwd(), OUT)}  (${await size(OUT)})`);
if (zipPath) console.log(`  zip     ${path.relative(process.cwd(), zipPath)}  (${await size(zipPath)})`);
console.log(`\nTo check it locally:  cd ${path.relative(process.cwd(), OUT)} && npx serve .`);
