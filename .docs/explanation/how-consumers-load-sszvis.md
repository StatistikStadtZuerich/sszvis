# How consumers load sszvis

Most decisions in this repository follow from one fact. The main consumer of sszvis
does not install it from npm into a bundled application. Its charts are plain HTML
pages that load a fixed set of files with `<script>` and `<link>` tags.

## A chart is HTML, a script and its data

Each production chart is a folder with an HTML page, a JavaScript file and a CSV file.
There is no bundler, no framework and no build step. The page loads the library files
from a versioned folder on the consumer's own server, so the URL pins the version:

- `sszvis.js` (or `sszvis.min.js`), the library as one UMD bundle that sets the
  global `sszvis`.
- `sszvis.css`, the stylesheet for controls, tooltips, axes, rulers, legends and map
  layers. A chart without it still draws, but its HTML layers lose their styling.
- `d3.js`, one complete d3 build. sszvis reads it as the global `d3`.
- `topojson.js`, the TopoJSON client, loaded only by map charts. sszvis reads it as
  the global `topojson` in `src/map/mapUtils.ts`.

A map chart also carries its own copy of the map data next to its script. Current
charts load a TopoJSON file such as `sszvis-map-zurich-statistischequartiere.json`
with `d3.json`. Older charts load a `sszvis-map-*.js` module that wraps the TopoJSON
instead. The data comes from `@sszvis/geodata`.

The full list of files and where each comes from is in
[the release bundle reference](../reference/release-bundle.md).

## What the consumer has agreed to is a short list

The consumer agrees in advance which files and dependencies it loads, and its
security review checks them. sszvis is shaped around that agreement. Rollup bundles
every runtime dependency (`immer`, `nano-throttle`) into `sszvis.js` and keeps only
`d3` and `topojson` external.

Three rules follow from this:

- **No new runtime or peer dependencies.** A new dependency changes what the consumer
  agreed to and had reviewed. That is not an engineering decision. If a consumer
  needs something extra, document it in the package README instead.
- **d3 is imported as the whole `d3` barrel**, never from `d3-*` submodules, because
  the page loads one complete d3 build. The supported d3 version is negotiated with
  the consumer. See [How to upgrade d3](../how-to/upgrade-d3.md).
- **Every chart is self-contained JavaScript.** The chart builder therefore emits
  code rather than a spec that a renderer interprets. See
  [decisions.md](../decisions.md#a-chart-builder-that-emits-code).

## Charts move between versions one page at a time

Each page names the version it loads, and the consumer keeps every released version
in its own folder. Old charts keep working on old versions until someone updates
their page. A new sszvis release therefore reaches production chart by chart, when
the consumer edits each page's version.

This is also why any observable behavior may be relied on somewhere. Charts are
hand-written JavaScript that can use the library in any way the language allows. See
[pitfalls.md](../pitfalls.md#fixing-a-bug-can-break-a-chart).

The npm package serves other users and the TypeScript types. The `.github/workflows/gh-pages.yml`
deploy also copies the bundles and the TopoJSON to the root of the documentation site
(`/sszvis.js`, `/topo/…`) for consumers that load them from there.
