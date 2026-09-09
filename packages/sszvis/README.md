# sszvis

**Statistik Stadt Zürich Visualization Library** — a [d3](https://d3js.org)-based
charting library for the statistical publications of the City of Zürich.

[Documentation & examples](https://statistikstadtzuerich.github.io/sszvis/) ·
[Source](https://github.com/StatistikStadtZuerich/sszvis) ·
[Changelog](https://github.com/StatistikStadtZuerich/sszvis/blob/master/apps/docs/docs/CHANGELOG.md)

sszvis is not a chart-type library. It is a set of small, composable d3 components —
axes, bars, lines, areas, maps, legends, tooltips, interaction behaviours, responsive
breakpoints — that you assemble into a chart. Anything sszvis renders can be mixed
with plain d3, and any component can be swapped for your own.

## Install

```sh
npm install sszvis d3
```

`d3` is a peer dependency (`>=7.9.0`).

TypeScript users also need `@types/d3`, not just when calling d3 directly: d3 itself
ships no types, and sszvis's own declarations reference d3 types throughout their
public signatures (`Selection`, `ScaleLinear`, `GeoProjection` and others), so without
it those declarations do not resolve.

```sh
npm install --save-dev @types/d3
```

```js
import * as sszvis from "sszvis";
```

Maps additionally need [`topojson-client`](https://github.com/topojson/topojson-client)
and the TopoJSON bundles, which the documentation site serves.

### Or from a CDN

```html
<link href="https://unpkg.com/sszvis@3/build/sszvis.css" rel="stylesheet" />

<script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
<script src="https://unpkg.com/sszvis@3/build/sszvis.min.js"></script>
<!-- maps only -->
<script src="https://unpkg.com/topojson-client@3/dist/topojson-client.min.js"></script>
```

The script build exposes a global `sszvis`.

## Stylesheet

sszvis renders bare SVG plus HTML overlays; **`sszvis.css` is required**, not
optional. Without it tooltips, layer positioning and the fallback image are unstyled.

It ships in the package at `build/sszvis.css`. Load it from the CDN as above,
copy it into your project, or import it if your bundler handles CSS:

```js
import "sszvis/sszvis.css";
```

## Usage

Every chart follows the same shape: measure the container, create a layer, configure
components, render. A minimal bar chart:

```js
import * as d3 from "d3";
import * as sszvis from "sszvis";

const data = [
  { category: "A", value: 10 },
  { category: "B", value: 24 },
  { category: "C", value: 17 },
];

const xAcc = sszvis.prop("category");
const yAcc = sszvis.prop("value");

const bounds = sszvis.bounds({ top: 3, bottom: 40, left: 40 }, "#chart");

const xScale = d3.scaleBand().domain(data.map(xAcc)).padding(0.2).range([0, bounds.innerWidth]);

const heightScale = d3
  .scaleLinear()
  .domain([0, d3.max(data, yAcc)])
  .range([0, bounds.innerHeight]);

const yScale = heightScale.copy().range([bounds.innerHeight, 0]);
const cScale = sszvis.scaleQual12();

// The layer carries the data; components read it from the selection.
const chartLayer = sszvis.createSvgLayer("#chart", bounds).datum(data);

const bars = sszvis
  .bar()
  .x(sszvis.compose(xScale, xAcc))
  .y(sszvis.compose(yScale, yAcc))
  .width(xScale.bandwidth())
  .height(sszvis.compose(heightScale, yAcc))
  .fill(cScale);

const yAxis = sszvis.axisY().scale(yScale).orient("right").contour(true);
const xAxis = sszvis.axisX.ordinal().scale(xScale).orient("bottom");

chartLayer.selectGroup("bars").call(bars);
chartLayer.selectGroup("yAxis").call(yAxis);
chartLayer
  .selectGroup("xAxis")
  .attr("transform", sszvis.translateString(0, bounds.innerHeight))
  .call(xAxis);
```

The [documentation site](https://statistikstadtzuerich.github.io/sszvis/) has a
runnable, downloadable example for every chart type — bar, line, stacked area, pie,
scatterplot, heat table, population pyramid, sankey, sunburst, treemap, pack and the
Zürich maps — and guides for axes, colors, annotations, legends, responsiveness and
accessibility. Start there rather than from this README.

## Conventions

- **Reusable-chart pattern.** Components are configurable functions applied with
  `selection.call(component)`; every option is a chainable setter.
- **Central state, idempotent render.** Examples keep one `state` object and one
  `render()` that can run at any time with the same result.
- **Immutable data.** Components never mutate the data you hand them.
- **Responsive by breakpoint.** `sszvis.responsiveProps()` selects values per
  breakpoint (`palm`, `lap`, `_`) instead of per pixel.

## Environment

sszvis measures and writes to the DOM, so it needs a browser. Importing it in bare
Node without a DOM implementation fails on `document`; for SSR, load it client-side
only.

Both ESM (`import`) and CommonJS (`require`) entry points are published, plus UMD
builds for `<script>` tags.

## Contributing

This package lives in the [sszvis monorepo](https://github.com/StatistikStadtZuerich/sszvis).
See the repository [README](https://github.com/StatistikStadtZuerich/sszvis#readme) and
[AGENTS.md](https://github.com/StatistikStadtZuerich/sszvis/blob/master/AGENTS.md) for
build, test and release instructions.

## License

BSD-3-Clause. sszvis can be used freely, but no support is provided by Statistik
Stadt Zürich.

Contact: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
