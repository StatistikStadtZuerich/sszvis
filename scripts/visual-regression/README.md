# Side-by-side visual regression harness

Renders the production charts from `.reference/d3charts-website` twice — once
against the sszvis release each page pins, once against this working copy's
`build/` output — so breaking changes show up as a visible difference rather
than a bug report from downstream.

## Run it

```bash
npm run build:ts && npm run build:lib   # refresh build/ (the candidate side)
npm run regression                      # http://localhost:8100
```

The comparison page is a long scroll: one row per chart, baseline on the left,
working copy on the right. Only rows near the viewport hold live iframes, so all
711 charts stay in one page without exhausting the browser.

Each pane reports `<n> svg · <n> err`, and the row gets a verdict:

| verdict | meaning |
| --- | --- |
| `matches baseline` | same number of rendered SVGs, no new errors |
| `new errors in candidate` | the working copy threw where the baseline did not |
| `render count differs` | one side rendered a chart, the other did not |
| `nothing rendered on either side` | the page is broken independently of our change |

Filters: free-text on chart id / folder / title, library version, and
flagged-only. `fit to content` sizes each iframe to its rendered height.

## Batch report

```bash
npm run regression:crawl -- --concurrency 8 --shots
```

Loads every comparable chart on both sides in headless Chromium and writes
`__report__/report.json` (per-chart verdict, error messages, SVG counts), plus
before/after screenshots of flagged charts under `__report__/shots/` when
`--shots` is passed. Flags: `--limit N`, `--concurrency N`, `--settle MS`.

## How the swap works

The reference chart pages hardcode absolute library URLs:

```html
<script src="http://sszsttprd/.../library_script/3.4.0/sszvis.js"></script>
```

The server rewrites those to `/lib/<side>/<version>/…` as it serves the HTML and
resolves them per side. Nothing in `.reference` is modified.

- **baseline** — every file from the pinned `library_script/<version>/` folder.
- **candidate** — `build/sszvis.js` and `docs/sszvis.css` from this repo;
  `d3.js` and `topojson.js` still come from the pinned folder, so sszvis is the
  only variable.

It also injects a small reporter into each page that collects `window.onerror`,
unhandled rejections and `console.error`, counts rendered SVGs, and posts the
result to the parent frame (and exposes it as `window.__sszvisRegression()` for
the crawler).

## Which charts are compared

`.reference` holds 1083 chart pages across four pinned library versions:

| version | pages | compared |
| --- | --- | --- |
| 3.4.0 | 665 | yes |
| 3.2.1 | 46 | yes |
| 2.0.2 | 7 | no — d3 v4 |
| 1.0.0 | 365 | no — d3 v3 |

The 372 pages on 1.0.0/2.0.2 ship their own d3 v3/v4 and predate the current
sszvis API, so running them against today's build proves nothing. They are still
listed under the `all versions` filter if you want to look at them.

## Caveats

- The verdict is a smoke signal, not a pixel diff: it catches thrown errors and
  charts that fail to render, not subtle layout or colour shifts. Those are what
  the visual side-by-side is for.
- `build/` is a snapshot. Rebuild before a run or you are comparing against
  stale output.
