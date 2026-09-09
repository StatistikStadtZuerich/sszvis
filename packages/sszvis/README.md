# sszvis

The Statistik Stadt Zürich Visualization Library — a d3-based charting library
for the City of Zürich's statistical publications.

See the [interactive documentation](https://statistikstadtzuerich.github.io/sszvis/)
for the full component catalogue and runnable examples.

## Install

```sh
npm install sszvis d3
```

`d3` is a peer dependency. TypeScript users also want `@types/d3`.

```js
import * as sszvis from "sszvis";
```

Or embed it directly:

```html
<link href="https://unpkg.com/sszvis@3/build/sszvis.css" rel="stylesheet" />
<script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
<script src="https://unpkg.com/sszvis@3/build/sszvis.min.js"></script>
```

For maps you also need the TopoJSON client:

```html
<script src="https://unpkg.com/topojson-client@3/dist/topojson-client.min.js"></script>
```

sszvis renders into the DOM, so it needs a browser environment — importing it in
bare Node (SSR without a DOM shim) will fail on `document`.

## Development

This package lives in the [sszvis monorepo](https://github.com/StatistikStadtZuerich/sszvis).
See the repository root `README.md` and `AGENTS.md` for build, test and release
instructions.

## License

BSD-3-Clause. sszvis can freely be used, but no support is provided by
Statistik Stadt Zürich.
