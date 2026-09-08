/**
 * Side-by-side visual regression harness.
 *
 * Serves every chart in `.reference/d3charts-website` twice: once against the
 * pinned sszvis release the page was authored for ("baseline"), once against
 * this working copy's `build/` output ("candidate"). The chart pages hardcode
 * absolute `http://sszsttprd/...` library URLs, so the HTML is rewritten on the
 * fly - nothing in `.reference` is modified.
 *
 * Usage: npm run regression  (then open http://localhost:8100)
 */

import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const REF = path.join(REPO, ".reference", "d3charts-website");
const LIBS = path.join(
  REF,
  "statisticstools/Modules/StyleGuide/projects/library_script"
);
const PORT = Number(process.env.PORT || 8100);

/** Library versions whose chart code targets d3 v7 and today's sszvis API. */
const COMPARABLE = new Set(["3.4.0", "3.2.1"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".tsv": "text/tab-separated-values; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

/* ---------------------------------------------------------------- manifest */

const LIB_REF = /https?:\/\/[^"'\s]*?library_script\/(\d+\.\d+\.\d+)\//g;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function buildManifest() {
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

/* ------------------------------------------------------------- html rewrite */

const REPORTER = (side, chartPath) => `<script>
(function(){
  var errors = [];
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

function rewriteChart(html, side, chartPath) {
  let out = html.replace(LIB_REF, (_match, version) => `/lib/${side}/${version}/`);
  const reporter = REPORTER(side, chartPath);
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, (m) => m + reporter);
  else if (/<body[^>]*>/i.test(out)) out = out.replace(/<body[^>]*>/i, (m) => m + reporter);
  else out = reporter + out;
  return out;
}

/* ------------------------------------------------------------ library files */

/**
 * Candidate resolution: sszvis itself comes from this working copy, while d3 and
 * topojson stay pinned to the baseline release so the only variable is sszvis.
 */
function resolveLib(side, version, file) {
  const baseline = path.join(LIBS, version, file);
  if (side === "baseline") return baseline;
  if (file === "sszvis.js") return path.join(REPO, "build", "sszvis.js");
  if (file === "sszvis.min.js") return path.join(REPO, "build", "sszvis.min.js");
  if (file === "sszvis.css") return path.join(REPO, "docs", "sszvis.css");
  return baseline;
}

/* -------------------------------------------------------------------- server */

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

async function sendFile(res, file) {
  try {
    const info = await stat(file);
    if (!info.isFile()) return send(res, 404, "Not a file");
    const body = await readFile(file);
    send(res, 200, body, MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
  } catch {
    send(res, 404, `Not found: ${file}`);
  }
}

/** Reject anything that escapes the directory it claims to be in. */
function within(root, target) {
  const resolved = path.resolve(target);
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}

let manifest = null;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/" || pathname === "/index.html") {
    return sendFile(res, path.join(__dirname, "index.html"));
  }

  if (pathname === "/api/manifest.json") {
    manifest ??= await buildManifest();
    return send(res, 200, JSON.stringify(manifest), MIME[".json"]);
  }

  const lib = pathname.match(/^\/lib\/(baseline|candidate)\/(\d+\.\d+\.\d+)\/(.+)$/);
  if (lib) {
    const [, side, version, file] = lib;
    const target = resolveLib(side, version, file);
    const root = side === "baseline" ? REF : REPO;
    const safe = within(root, target);
    return safe ? sendFile(res, safe) : send(res, 403, "Forbidden");
  }

  if (pathname.startsWith("/chart/")) {
    const safe = within(REF, path.join(REF, pathname.slice("/chart/".length)));
    if (!safe) return send(res, 403, "Forbidden");
    const side = url.searchParams.get("side");
    if (safe.endsWith(".html") && (side === "baseline" || side === "candidate")) {
      try {
        const html = await readFile(safe, "utf8");
        const rel = path.relative(REF, safe).split(path.sep).join("/");
        return send(res, 200, rewriteChart(html, side, rel), MIME[".html"]);
      } catch {
        return send(res, 404, "Chart not found");
      }
    }
    return sendFile(res, safe);
  }

  send(res, 404, "Not found");
});

server.listen(PORT, () => {
  process.stdout.write(`sszvis side-by-side regression harness: http://localhost:${PORT}\n`);
});
