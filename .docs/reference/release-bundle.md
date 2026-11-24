# Release bundle

The files a consumer chart loads, and where each comes from. For why the list is
short, see [How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).

## Files

| File              | Source                                          | GitHub release asset | Docs site root   |
| ----------------- | ----------------------------------------------- | -------------------- | ---------------- |
| `sszvis.js`       | `packages/sszvis/build/`                        | yes                  | `/sszvis.js`     |
| `sszvis.min.js`   | `packages/sszvis/build/`                        | yes                  | `/sszvis.min.js` |
| `sszvis.css`      | `packages/sszvis/build/`, from `src/sszvis.css` | yes                  | `/sszvis.css`    |
| `sszvis.d.ts`     | `packages/sszvis/build/`                        | yes                  | no               |
| `d3.js`           | d3, a version agreed with the consumer          | no                   | no               |
| `topojson.js`     | the `topojson-client` library                   | no                   | no               |
| TopoJSON map data | `packages/geodata/dist/topo/`                   | no                   | `/topo/…`        |

`pnpm --filter sszvis run build` writes the `build/` files. The
`.github/workflows/gh-pages.yml` deploy copies the docs site root files, together with
their source maps.

## Globals

| Global     | Set by        | Read by                                             |
| ---------- | ------------- | --------------------------------------------------- |
| `sszvis`   | `sszvis.js`   | consumer charts                                     |
| `d3`       | `d3.js`       | `sszvis.js` and consumer charts                     |
| `topojson` | `topojson.js` | consumer map charts, to convert TopoJSON to GeoJSON |

sszvis takes GeoJSON and does not read the `topojson` global.

## Bundled dependencies

Rollup bundles `immer` and `nano-throttle` into `sszvis.js`. It treats `d3` as
external. `packages/sszvis/rollup.config.mjs` also lists `topojson` as external, but
no module imports it.

## npm entry points

| Field    | File                   |
| -------- | ---------------------- |
| `main`   | `build/sszvis.js`      |
| `unpkg`  | `build/sszvis.js`      |
| `module` | `build/index.js` (ESM) |
| `types`  | `build/index.d.ts`     |
