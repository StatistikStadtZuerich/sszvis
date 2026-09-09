# Side-by-side visual regression harness

Renders the production charts from `.reference/d3charts-website` twice — once
against the sszvis release each page pins, once against this working copy's
`build/` output — so breaking changes show up as a visible difference rather
than a bug report from downstream.

## Run it locally

```bash
pnpm --filter sszvis run build   # refresh packages/sszvis/build/ (the candidate side)
pnpm run regression                      # http://localhost:8100
```

The comparison page is a long scroll: one row per chart, baseline on the left,
working copy on the right. Only rows near the viewport hold live iframes, so all
711 charts stay in one page without exhausting the browser.

Each pane reports `<n> svg · <n> marks · <n> err`, and the row gets a verdict:

| verdict                           | meaning                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `matches baseline`                | same number of rendered SVGs, no new errors, and marks on the candidate wherever the baseline had them - mark counts may still differ |
| `new errors in candidate`         | the working copy threw where the baseline did not                                                                                     |
| `render count differs`            | one side rendered a chart, the other did not                                                                                          |
| `candidate renders no marks`      | the SVG and axes are there, the data marks are gone                                                                                   |
| `nothing rendered on either side` | the page is broken independently of our change                                                                                        |

Filters: free-text on chart id / folder / title, library version, and
flagged-only. `fit to content` sizes each iframe to its rendered height.

## Batch report

```bash
pnpm run regression:crawl --concurrency 8 --shots
```

Loads every comparable chart on both sides in headless Chromium and writes
`__report__/report.json` (per-chart and per-width verdicts, error messages, SVG
counts), plus before/after screenshots of flagged charts under `__report__/shots/`
when `--shots` is passed.

Each chart is loaded at several widths (`400,560,900` by default, straddling the
breakpoints the reference charts declare) because a fault often lives in one
breakpoint only — every layout and choropleth fault found in the first sweep
appeared at some widths and not others. A chart's verdict is the worst of them.

Verdicts separate our breakage from breakage that was already there:

| verdict           |                                                                    |
| ----------------- | ------------------------------------------------------------------ |
| `new-errors`      | the candidate raised errors the baseline did not                   |
| `render-differs`  | the sides disagree on how many SVGs were drawn                     |
| `renders-empty`   | the candidate drew the SVG but none of the marks the baseline drew |
| `load-failed`     | the page never loaded far enough to report                         |
| `renders-nothing` | neither side drew anything                                         |
| `shared-errors`   | both sides raised the same errors — predates the working copy      |
| `fixed`           | the baseline raised errors the candidate does not                  |

Flags: `--limit N`, `--concurrency N`, `--widths 400,900`, `--settle MS`, `--shots`.

## Sharing it

```bash
pnpm run regression:export              # all 711 charts   -> 60MB folder, 12MB zip
pnpm run regression:export --flagged # only what a sweep flagged -> 23MB, 3.8MB zip
```

Writes a self-contained folder plus a zip under `__export__/`, with a `START-HERE.md`
for whoever receives it. No checkout of this repo or of the reference charts is needed
to view it — the URL rewriting the server does per request is done once at export time,
and both copies of each page sit beside their data as `<name>.baseline.html` and
`<name>.candidate.html`, pointing at a `lib/` folder by relative path.

It does still have to be served over HTTP (`npx serve .`), because the charts fetch
their CSV and TopoJSON and a browser refuses to do that from a `file://` page. The
included instructions say so.

`--flagged` reads `__report__/report.json` and narrows the export to the charts a sweep
found wanting, which is the difference between an emailable zip and something that
needs hosting. Other flags: `--out DIR`, `--limit N`, `--no-zip`.

For a hosted copy, the folder is a plain static site — any static host will do. Note
that GitHub Pages allows one site per repository, and this repo's is already the docs
site, so a subpath there means teaching the docs deploy not to delete it.

## How the swap works

The reference chart pages hardcode absolute library URLs:

```html
<script src="http://sszsttprd/.../library_script/3.4.0/sszvis.js"></script>
```

The server rewrites those to `/lib/<side>/<version>/…` as it serves the HTML and
resolves them per side. Nothing in `.reference` is modified.

- **baseline** — every file from the pinned `library_script/<version>/` folder.
- **candidate** — `packages/sszvis/build/sszvis.js` and `packages/sszvis/build/sszvis.css` from this repo;
  `d3.js` and `topojson.js` still come from the pinned folder, so sszvis is the
  only variable.

It also injects a small reporter into each page that collects `window.onerror`,
unhandled rejections and `console.error`, counts rendered SVGs and the data marks
inside them, and posts the result to the parent frame (and exposes it as
`window.__sszvisRegression()` for the crawler).

The mark count deliberately means _shapes drawn because there was data_. It skips
chrome that is drawn either way — axes, legends, rulers, tooltips, controls, `<defs>`
patterns, a map's border and lake paths — as well as the invisible interaction
overlays and tooltip anchors, which are identified by attribute rather than class
(`[data-sszvis-behavior-move]`, `[data-sszvis-behavior-voronoi]`,
`[data-tooltip-anchor]`). Excluding those is what makes `candidate renders no marks`
reachable at all: `behavior/move` draws its transparent rect whether or not any data
arrived, so counting it kept an empty chart at one mark. Marks a behavior only
_decorates_ still count — `behavior/panning` puts `[data-sszvis-behavior-pannable]`
and `.sszvis-interactive` on a choropleth's own map areas, so those attributes are
not exclusions.

One consequence: a map's areas come from the topology, not the data, so a choropleth
that loses its values keeps a non-zero mark count. `renders-empty` cannot see that
case; the side-by-side can.

## Which charts are compared

`.reference` holds 1083 chart pages across four pinned library versions:

| version | pages | compared   |
| ------- | ----- | ---------- |
| 3.4.0   | 665   | yes        |
| 3.2.1   | 46    | yes        |
| 2.0.2   | 7     | no — d3 v4 |
| 1.0.0   | 365   | no — d3 v3 |

The 372 pages on 1.0.0/2.0.2 ship their own d3 v3/v4 and predate the current
sszvis API, so running them against today's build proves nothing. They are still
listed under the `all versions` filter if you want to look at them.

## Caveats

- The verdict is a smoke signal, not a pixel diff: it catches thrown errors,
  charts that fail to render, and charts that render their frame but no data
  marks — not subtle layout or colour shifts, and not a chart that draws _fewer_
  marks than the baseline. Those are what the visual side-by-side is for.
- `build/` is a snapshot. Rebuild before a run or you are comparing against
  stale output.
