/**
 * Side-by-side visual regression harness.
 *
 * Serves every chart in `.reference/d3charts-website` twice: once against the
 * pinned sszvis release the page was authored for ("baseline"), once against
 * this working copy's `build/` output ("candidate"). The chart pages hardcode
 * absolute `http://sszsttprd/...` library URLs, so the HTML is rewritten on the
 * fly - nothing in `.reference` is modified.
 *
 * Usage: pnpm run regression  (then open http://localhost:8100)
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REF, REPO, buildManifest, resolveLib, rewriteChart } from "./harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8100);

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
