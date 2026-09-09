/**
 * Shared plumbing for the regression harness: locating the reference checkout,
 * cataloguing its chart pages, rewriting a page to point at one side's library,
 * and resolving which file each side's library URL means.
 *
 * `server.mjs` uses these to answer requests, `export.mjs` to write a static copy.
 * They live here so the two cannot drift: a rewrite the server does and the export
 * does not would make the shared build and the shipped one different comparisons.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO = path.resolve(__dirname, "..", "..");
export const REF = path.join(REPO, ".reference", "d3charts-website");

/**
 * Where this working copy's own library and stylesheet live. Kept as two
 * constants so a future move breaks one line rather than three call sites -
 * these pointed at the pre-monorepo `build/` and `docs/` until the workspace
 * split, which made every chart report `sszvis is not defined`.
 */
export const CANDIDATE_BUILD = path.join(REPO, "packages", "sszvis", "build");
export const CANDIDATE_DOCS = path.join(REPO, "apps", "docs", "docs");
export const LIBS = path.join(REF, "statisticstools/Modules/StyleGuide/projects/library_script");

/** Library versions whose chart code targets d3 v7 and today's sszvis API. */
export const COMPARABLE = new Set(["3.4.0", "3.2.1"]);

/** Files a chart page loads from its pinned library folder. */
export const LIB_FILES = ["sszvis.js", "sszvis.min.js", "sszvis.css", "d3.js", "topojson.js"];

export const LIB_REF = /https?:\/\/[^"'\s]*?library_script\/(\d+\.\d+\.\d+)\//g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

export async function buildManifest() {
  const charts = [];
  for await (const file of walk(path.join(REF, "Statistik_Daten"))) {
    if (!file.endsWith(".html")) continue;
    const html = await readFile(file, "utf8");
    const versions = [...html.matchAll(LIB_REF)].map((m) => m[1]);
    if (versions.length === 0) continue;
    const version = versions[0];
    const rel = path.relative(REF, file).split(path.sep).join("/");
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    charts.push({
      path: rel,
      // The folder name carries the human-readable topic; the file name carries
      // the SSZ chart id. Both are useful when scanning 700 rows.
      group: rel.split("/").slice(1, -1).join(" / "),
      name: path.basename(file, ".html"),
      title: (titleMatch?.[1] || "").trim(),
      version,
      comparable: COMPARABLE.has(version),
    });
  }
  charts.sort((a, b) => a.path.localeCompare(b.path));
  return charts;
}

const REPORTER = (side, chartPath) => `<script>
(function(){
  var errors = [];
  // Shapes a chart draws to carry data. A chart that renders its frame but no
  // marks is the failure mode svgCount cannot see: d3's .data() over a
  // non-iterable joins nothing, silently, so the SVG and axes still appear.
  var MARKS = "rect,path,circle,line,polygon,ellipse";
  // Chrome that is drawn whether or not there is any data to show, and so must
  // not keep an empty chart's mark count above zero.
  //
  // Two forms have to be covered. Most families are identified by class, matched on
  // substring because the suffix varies ("sszvis-legend--entry", "…__mark") and
  // case-insensitively because the stems do too ("sszvis-ruler__rule" but
  // "sszvis-rangeRuler__rule", "sszvis-handleRuler__handle"). Some overlays instead
  // carry only a data attribute: behavior/move writes [data-sszvis-behavior-move] on
  // a transparent rect that is drawn whether or not any data arrived, and
  // annotation/tooltipAnchor writes [data-tooltip-anchor] on a rect with no class at
  // all - so matching on class alone kept an empty chart's mark count at one and hid
  // the very failure "renders-empty" looks for.
  //
  // The list deliberately covers only elements a behavior *creates*. behavior/panning
  // decorates marks the chart already drew - a choropleth's own map areas get both
  // [data-sszvis-behavior-pannable] and class "sszvis-interactive" - so excluding
  // either of those would delete the real data marks instead of the chrome.
  var CHROME = ["defs"]
    .concat(
      // class stems: chart frame, keys, interaction rulers, tooltips, controls, and
      // the map base geometry, which comes from the topology rather than the data.
      ["axis", "legend", "ruler", "tooltip", "control", "map__border", "map__lake"]
        .map(function(part){ return '[class*="sszvis-' + part + '" i]'; })
    )
    .concat(
      // overlays identified only by attribute (src/behavior/*, annotation/tooltipAnchor).
      ["data-sszvis-behavior-move", "data-sszvis-behavior-voronoi",
       "data-tooltip-anchor", "data-tooltip-anchor-debug"]
        .map(function(attr){ return "[" + attr + "]"; })
    )
    .join(",");
  function countMarks(){
    var nodes = document.querySelectorAll("svg " + MARKS.split(",").join(",svg "));
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].closest || !nodes[i].closest(CHROME)) n++;
    }
    return n;
  }
  var meta = { side: ${JSON.stringify(side)}, path: ${JSON.stringify(chartPath)} };
  var resources = [];
  function snapshot(){
    return {
      type: "sszvis-regression",
      side: meta.side,
      path: meta.path,
      errors: errors.slice(0, 20),
      errorCount: errors.length,
      resources: resources.slice(0, 20),
      resourceCount: resources.length,
      svgCount: document.querySelectorAll("svg").length,
      markCount: countMarks(),
      height: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)
    };
  }
  // Exposed for the headless crawler; the comparison page uses postMessage.
  window.__sszvisRegression = snapshot;
  function report(){ try { parent.postMessage(snapshot(), "*"); } catch (e) {} }
  window.addEventListener("error", function(e){
    // The capture phase also sees a failed <link>/<script>/<img>, which arrives as an
    // Event on the element rather than an ErrorEvent with a message - stringifying it
    // gives "[object Event]". A dead asset is worth reporting, but it is not a script
    // fault and must not count towards the error totals the two sides are compared on.
    if (e.target && e.target !== window && e.target.tagName) {
      var url = e.target.src || e.target.href || "";
      resources.push(e.target.tagName.toLowerCase() + " failed to load: " + url);
    } else {
      errors.push(String((e.error && e.error.stack) || e.message || e));
    }
    report();
  }, true);
  window.addEventListener("unhandledrejection", function(e){
    errors.push("unhandled rejection: " + String(e.reason));
    report();
  });
  var nativeError = console.error;
  console.error = function(){
    errors.push(Array.prototype.map.call(arguments, String).join(" "));
    nativeError.apply(console, arguments);
    report();
  };
  window.addEventListener("load", function(){
    report();
    // Chart data is fetched asynchronously, so re-report as rendering settles.
    setTimeout(report, 800);
    setTimeout(report, 2500);
    setTimeout(report, 5000);
  });
})();
</script>`;

/**
 * `libPrefix` is where this copy of the page should look for the libraries. The server
 * answers absolute `/lib/...` paths; a static export has no server to resolve those, so
 * it passes a `../..`-style path back to its own root.
 */
export function rewriteChart(html, side, chartPath, libPrefix = "/lib/") {
  let out = html.replace(LIB_REF, (_match, version) => `${libPrefix}${side}/${version}/`);
  const reporter = REPORTER(side, chartPath);
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, (m) => m + reporter);
  else if (/<body[^>]*>/i.test(out)) out = out.replace(/<body[^>]*>/i, (m) => m + reporter);
  else out = reporter + out;
  return out;
}

/**
 * Candidate resolution: sszvis itself comes from this working copy, while d3 and
 * topojson stay pinned to the baseline release so the only variable is sszvis.
 */
export function resolveLib(side, version, file) {
  const baseline = path.join(LIBS, version, file);
  if (side === "baseline") return baseline;
  if (file === "sszvis.js") return path.join(CANDIDATE_BUILD, "sszvis.js");
  if (file === "sszvis.min.js") return path.join(CANDIDATE_BUILD, "sszvis.min.js");
  if (file === "sszvis.css") return path.join(CANDIDATE_DOCS, "sszvis.css");
  return baseline;
}
