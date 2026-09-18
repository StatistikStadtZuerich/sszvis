## 3.5.2

### Patch Changes

- [`1405f0c`](https://github.com/StatistikStadtZuerich/sszvis/commit/1405f0c97b212df3244b2398afb15cb37c363bcb) Thanks [@lloydrichards](https://github.com/lloydrichards)! - check up front that `sszvis.mapRendererBubble()`'s `mapPath` is a real d3 `geoPath`, since the anchor positions are read through `mapPath.projection()`. A bare path function used to fail from inside the transform callback, after every circle had already been created, sorted and styled

- [`1405f0c`](https://github.com/StatistikStadtZuerich/sszvis/commit/1405f0c97b212df3244b2398afb15cb37c363bcb) Thanks [@lloydrichards](https://github.com/lloydrichards)! - report a null `mapPath` by name in `sszvis.mapRendererBubble()` and `sszvis.mapRendererPatternedLakeOverlay()`. An explicit `null` slipped past the required-property check and failed one line later reading a property of `null` — the anonymous mid-render failure those checks exist to replace

- [`4a92da0`](https://github.com/StatistikStadtZuerich/sszvis/commit/4a92da0f7daf4e77d2aab11c2bf16a8568c2e08c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - report `sszvis.mapRendererBubble()`'s missing required properties by name — `mergedData`, `radius` and `fill` — before anything is drawn, instead of an anonymous `TypeError` raised partway through the render, as `mapRendererMesh()` and `mapRendererRaster()` already do

- [`bc37604`](https://github.com/StatistikStadtZuerich/sszvis/commit/bc37604fa4d46878ffea993ae389726c49b17be4) Thanks [@lloydrichards](https://github.com/lloydrichards)! - accept the library's own colour scales wherever a component takes a colour, so `.fill((d) => cScale(cAcc(d)))` typechecks

- [#416](https://github.com/StatistikStadtZuerich/sszvis/pull/416) [`722cd15`](https://github.com/StatistikStadtZuerich/sszvis/commit/722cd15ae1330b54785057d4cf89240063b93577) Thanks [@lloydrichards](https://github.com/lloydrichards)! - pass d3's index to the colour accessors of `sszvis.annotationRuler()`, `sszvis.handleRuler()` and `sszvis.sankey()`, as the other components already do

- [#463](https://github.com/StatistikStadtZuerich/sszvis/pull/463) [`9e3f6e8`](https://github.com/StatistikStadtZuerich/sszvis/commit/9e3f6e8142c097b815107cc76ac4ca76dea70942) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `mapRendererGeoJson` shapes are now a hit area when an `over`, `out` or `click` handler is registered on the component. The elements were marked `data-event-target` and the component bound mouse handlers to them, but `.sszvis-map__geojsonelement` carried `pointer-events: none` in `sszvis.css`, so none of those handlers could ever fire. `pointer-events` is now written inline and conditionally, matching `mapRendererBubble`.

  With no handler registered the shapes stay inert, exactly as before. With one registered they become a target, which means the overlay now shadows the layer beneath it over its own shapes — so a chart that drives tooltips from a choropleth base layer _and_ registers handlers on a geojson overlay on top will see the overlay win there. That is the intended semantics, and it matches how `mapRendererBubble` already behaves.

- [`9790cf1`](https://github.com/StatistikStadtZuerich/sszvis/commit/9790cf1e470953e95a00c4fd1625641cfe8cdbf4) Thanks [@lloydrichards](https://github.com/lloydrichards)! - let `sszvis.groupedBarsVertical()` and `groupedBarsHorizontal()` take a constant for `x` and `y`, as `width` and `height` already did

- [`e9e6d88`](https://github.com/StatistikStadtZuerich/sszvis/commit/e9e6d88fe97167500dfee7f05c0206d12f9020d5) Thanks [@lloydrichards](https://github.com/lloydrichards)! - type label and tick formatters against the values they actually receive, not against `string`

- [#463](https://github.com/StatistikStadtZuerich/sszvis/pull/463) [`ec3b6e9`](https://github.com/StatistikStadtZuerich/sszvis/commit/ec3b6e9246b6f99ff6a741cf3b049d82b96427c2) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `mapRendererPatternedLakeOverlay` now writes the lake border's stroke, width and dash pattern inline, defaulting to the grey dotted line `sszvis.css` used to supply. A consumer not shipping the stylesheet previously saw no lake borders at all, since SVG's initial stroke is `none`. An explicitly falsy `lakePathColor` still clears the stroke, which now means no border rather than a fallback to the stylesheet.

- [`60f5cae`](https://github.com/StatistikStadtZuerich/sszvis/commit/60f5caeb3cd0c22787032b396387ac23ab918066) Thanks [@lloydrichards](https://github.com/lloydrichards)! - stop `sszvis.mapRendererPatternedLakeOverlay()` leaving a geometry-less border path behind: an unset `lakeBounds` now draws no border path at all — and removes one drawn earlier — instead of binding `undefined` and producing a classed path with no `d` that CSS rules and hit tests could still find.

  `mapPath` is now required whenever there is a lake to draw, and a missing or null one throws a `TypeError` naming it. This is a new failure mode: a chart that set `lakeFeature` without a `mapPath` previously rendered two classed, styled paths with no geometry. Asking for "no lake" still needs neither property. `mapRendererMesh()` was given the same treatment in an earlier release.

- [#416](https://github.com/StatistikStadtZuerich/sszvis/pull/416) [`1bf1115`](https://github.com/StatistikStadtZuerich/sszvis/commit/1bf11159450e3c1ab548ed46c548d2433db61c7d) Thanks [@lloydrichards](https://github.com/lloydrichards)! - type `sszvis.legendColorLinear().labelFormat()` against the numbers it is handed when `labelText` is unset, and give `sszvis.legendRadius().tickFormat()` d3's index, nodes and `this`

- [#462](https://github.com/StatistikStadtZuerich/sszvis/pull/462) [`0812749`](https://github.com/StatistikStadtZuerich/sszvis/commit/0812749af494d3b22bdb4b4973c00870a59d5780) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `line` now treats a non-finite value as missing, as it already treated `NaN`. `Infinity` — what a scale over a zero-width domain returns — passed the guard and reached the `d` attribute, where the browser dropped that segment and every one after it, so the line was truncated rather than broken.

- [#453](https://github.com/StatistikStadtZuerich/sszvis/pull/453) [`076f240`](https://github.com/StatistikStadtZuerich/sszvis/commit/076f2407e9b319c27c951ac561b24889da9d9eb8) Thanks [@lloydrichards](https://github.com/lloydrichards)! - give an entering `sszvis.line()` path its `d` and stroke width on the render tick rather than only through the transition, so a line measured before the first animation frame — with `getTotalLength`, a bounding box or a synchronous screenshot — is no longer empty. An entering line's stroke width is therefore drawn at its final value instead of animating up from whatever the stylesheet set, matching how an entering line's geometry already behaved

- [#457](https://github.com/StatistikStadtZuerich/sszvis/pull/457) [`f1ac3b3`](https://github.com/StatistikStadtZuerich/sszvis/commit/f1ac3b3f8667dbf6d482fba0b2ee67aa6eaf388b) Thanks [@lloydrichards](https://github.com/lloydrichards)! - write the presentation the SVG map renderers depend on as inline styles instead of leaving it to sszvis.css. `mapRendererMesh()`, `mapRendererHighlight()` and the lake overlay's border path now set `fill: none` and `pointer-events: none`; the textured lake shape keeps its pattern `fill` attribute and gains only `pointer-events: none`. Without the stylesheet, SVG's initial black fill turned each outline into a shape covering the map, and all of them swallowed the base layer's hover and click events

- [`223203e`](https://github.com/StatistikStadtZuerich/sszvis/commit/223203e8fb4f64a22b1651899691aedd09d91a6f) Thanks [@lloydrichards](https://github.com/lloydrichards)! - type the handlers of `sszvis.move().on(…)` against the component's own scales

- [`842d1ec`](https://github.com/StatistikStadtZuerich/sszvis/commit/842d1ec9eadcdfcfc328ce7d43f8a8d7621ce060) Thanks [@lloydrichards](https://github.com/lloydrichards)! - accept missing values in `sszvis.parseNumber`, `sszvis.parseDate` and `sszvis.parseYear`, so a `d3.csv` row whose cells are `string | undefined` typechecks

- [#455](https://github.com/StatistikStadtZuerich/sszvis/pull/455) [`faa7d14`](https://github.com/StatistikStadtZuerich/sszvis/commit/faa7d149644b2d9b6f3c4f7902bae8ac73745c9f) Thanks [@lloydrichards](https://github.com/lloydrichards)! - report a missing `geoJson` by name in `sszvis.prepareMergedGeoData()` instead of an anonymous `TypeError` from reading its features. A missing `dataset` still yields an entry per feature with no datum, since that is a state a chart passes through before its data load

- [#416](https://github.com/StatistikStadtZuerich/sszvis/pull/416) [`1e17771`](https://github.com/StatistikStadtZuerich/sszvis/commit/1e1777162003f7fec011a13572c592ef36f48c57) Thanks [@lloydrichards](https://github.com/lloydrichards)! - export `ColorValue`, `Measurement` and `PartialMeasurement`, and `sszvis.colorToString`, so a chart can name the types its own accessors return

- [`323dc8a`](https://github.com/StatistikStadtZuerich/sszvis/commit/323dc8afd9374bcda926875ebad0a0cfc201587c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - write `sszvis.mapRendererRaster()`'s `position`, `display` and `pointer-events` as inline styles, so the canvas aligns over the map and lets the layers beneath it be hovered without sszvis.css. It was the one HTML-layer renderer still depending on the stylesheet for its alignment; `mapRendererImage()` writes the same three

- [`3639bec`](https://github.com/StatistikStadtZuerich/sszvis/commit/3639becf58df3399111f82406ee909bfb9fe6d9c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - draw an empty `sszvis.mapRendererRaster()` canvas when the layer has no data bound, instead of throwing "data is not iterable" after the canvas has already been created. `createHtmlLayer` binds `0` when the caller binds none, which is the state every chart is in before its data load

- [#416](https://github.com/StatistikStadtZuerich/sszvis/pull/416) [`61657d9`](https://github.com/StatistikStadtZuerich/sszvis/commit/61657d967dec919a8c70b513fe1b506debdd0772) Thanks [@lloydrichards](https://github.com/lloydrichards)! - keep a prop in the result of `sszvis.responsiveProps()` when its spec is invalid, so a mistyped breakpoint name warns and falls back to `_` instead of throwing at the point of use

- [`ea9f2b0`](https://github.com/StatistikStadtZuerich/sszvis/commit/ea9f2b0264c28dc396f26da6dbaafbeb7eb34987) Thanks [@lloydrichards](https://github.com/lloydrichards)! - type the result of `sszvis.responsiveProps()` from the `.prop()` calls that built it

- [#462](https://github.com/StatistikStadtZuerich/sszvis/pull/462) [`8a43009`](https://github.com/StatistikStadtZuerich/sszvis/commit/8a430098a47abc1c6e38d79bce2292d6f1e40593) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `stackedArea` and `stackedAreaMultiples` now treat a non-finite bound as missing, matching `line`. `Infinity` passed the guard and reached the `d` attribute, truncating the shape at that point rather than breaking it.

- [#453](https://github.com/StatistikStadtZuerich/sszvis/pull/453) [`7b286a8`](https://github.com/StatistikStadtZuerich/sszvis/commit/7b286a84dbf8386e69d8d2d24da46b0b7e4e1c59) Thanks [@lloydrichards](https://github.com/lloydrichards)! - give an entering `sszvis.stackedArea()` path its geometry, colours and stroke width on the render tick rather than only through the transition, so a chart measured or serialised before the first animation frame is no longer blank — as a consequence an entering area appears complete instead of growing its hairline up from 0, and a colour reaches the DOM as it was given rather than rewritten as `rgb()`

- [#456](https://github.com/StatistikStadtZuerich/sszvis/pull/456) [`9ccc7b5`](https://github.com/StatistikStadtZuerich/sszvis/commit/9ccc7b566f26e2eece45fab7fbb7d0925d1a2baf) Thanks [@lloydrichards](https://github.com/lloydrichards)! - make `sszvis.stackedBarVerticalData()`'s and `sszvis.stackedBarVerticalLayout()`'s series `index` agree with the array it is returned in. The vertical layout stacks in reverse, so d3 numbered each series by its stacking position while returning the array in key order — a caller reading `index` to drive a legend got the stack the wrong way up, while the horizontal layout's already agreed. The array order is unchanged, so nothing about the rendering moves

- [#461](https://github.com/StatistikStadtZuerich/sszvis/pull/461) [`c4e5f96`](https://github.com/StatistikStadtZuerich/sszvis/commit/c4e5f96bf7cd0297435bba879a5273eadf92f54e) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `stackedPyramid` now forwards d3's index to `barWidth`. An index-aware accessor previously saw `undefined` for `i`, so it returned `NaN` and `bar`'s missing-value guard collapsed every bar's width and x to `0`.

- [#461](https://github.com/StatistikStadtZuerich/sszvis/pull/461) [`5ecd060`](https://github.com/StatistikStadtZuerich/sszvis/commit/5ecd060257e4e39ee3eb6496b1f9da9f84b5554d) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `stackedPyramid` now forwards d3's index to `barPosition` and `barFill`. `barPosition` was composed with the row accessor, and `fn.compose` passes arguments only to the innermost function; `barFill` went through a one-parameter wrapper. An index-aware `barPosition` collapsed every bar onto one row, and an index-aware `barFill` looked up `undefined`.

- [#454](https://github.com/StatistikStadtZuerich/sszvis/pull/454) [`039fc9f`](https://github.com/StatistikStadtZuerich/sszvis/commit/039fc9fb3dd4d3b77b7e0100957aec92600fa485) Thanks [@lloydrichards](https://github.com/lloydrichards)! - centre a `sszvis.stackedPyramid()` reference outline on the bars it describes: it was drawn from `barPosition` alone, a bar's top edge, so it ran half a bar height above its values — an error that grows with `barHeight`. Matches `sszvis.pyramid()`

- [#454](https://github.com/StatistikStadtZuerich/sszvis/pull/454) [`eaea839`](https://github.com/StatistikStadtZuerich/sszvis/commit/eaea8399d61f68957c50c77f7c43896e2427be78) Thanks [@lloydrichards](https://github.com/lloydrichards)! - skip a non-finite point in a `sszvis.stackedPyramid()` reference series instead of writing `NaN` into the path: a gap now breaks the outline at the gap rather than truncating everything after it, matching both `sszvis.pyramid()` and the missing-value guard the bars already had

- [#454](https://github.com/StatistikStadtZuerich/sszvis/pull/454) [`161ec7b`](https://github.com/StatistikStadtZuerich/sszvis/commit/161ec7b6458fe45daa0795514b53dd23ea7bc929) Thanks [@lloydrichards](https://github.com/lloydrichards)! - let a `sszvis.stackedPyramid()` reference accessor return no data: `leftRefAccessor` and `rightRefAccessor` returning `undefined` or `null` now draw no reference line and warn, rather than throwing mid-render, matching `sszvis.pyramid()`

- [#454](https://github.com/StatistikStadtZuerich/sszvis/pull/454) [`1d07805`](https://github.com/StatistikStadtZuerich/sszvis/commit/1d07805b60ec7e6bc8c0d55c03f5c4a812cf0b81) Thanks [@lloydrichards](https://github.com/lloydrichards)! - remove a `sszvis.stackedPyramid()` reference path when its series goes away, instead of leaving a classed path element behind with no `d` attribute where CSS rules, hit tests and snapshots can still find it, matching `sszvis.pyramid()`

- [#461](https://github.com/StatistikStadtZuerich/sszvis/pull/461) [`ad9159f`](https://github.com/StatistikStadtZuerich/sszvis/commit/ad9159fced9e431b50eefdeece48a483b0bdbf98) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `stackedPyramid` now reports an unset `barHeight`, `barWidth`, `barPosition`, `leftAccessor` or `rightAccessor` by name before it renders. Previously each failed differently: `barHeight` reached `bar`'s missing-value guard as `undefined` and drew a chart of zero-height bars with a clean console.

- [#456](https://github.com/StatistikStadtZuerich/sszvis/pull/456) [`97179a6`](https://github.com/StatistikStadtZuerich/sszvis/commit/97179a6a58b2a6e3305ca31bdc72c63bc70f1cff) Thanks [@lloydrichards](https://github.com/lloydrichards)! - keep `sszvis.stackedPyramidLayout()`'s and `sszvis.stackedPyramidData()`'s stacking order as the series accessor returned it. The keys were read back off the cascade's plain rows, which enumerate integer-like keys numerically, so a series accessor returning years or numeric codes silently restacked the chart — and with it which series sits on the baseline. `stackedBarData()` was fixed this way already

- [#456](https://github.com/StatistikStadtZuerich/sszvis/pull/456) [`8eef8b3`](https://github.com/StatistikStadtZuerich/sszvis/commit/8eef8b35766769ff4709f9c89006115e300e1b54) Thanks [@lloydrichards](https://github.com/lloydrichards)! - sum every row `sszvis.stackedPyramidLayout()`'s and `sszvis.stackedPyramidData()`'s accessors place in one (side, row, series) cell, instead of reading only the first. Data that was not already aggregated to one row per triplet was silently understated — no warning, no error, just a shorter bar. `stackedBarData()` was fixed this way already

- [#453](https://github.com/StatistikStadtZuerich/sszvis/pull/453) [`3fa7b17`](https://github.com/StatistikStadtZuerich/sszvis/commit/3fa7b17699c6fe509019cfbae6999a81d5d4ae4c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - position `sszvis.sunburst()` tooltip anchors from the destination angles instead of the angles currently on screen, so they no longer trail a render behind the arcs after an update

- [#453](https://github.com/StatistikStadtZuerich/sszvis/pull/453) [`55f15b8`](https://github.com/StatistikStadtZuerich/sszvis/commit/55f15b8345daf5c4a9ff254f09348b4048255b5b) Thanks [@lloydrichards](https://github.com/lloydrichards)! - give `sszvis.sunburst()` arcs their `d` on the render tick rather than only through the `attrTween`, so a sunburst serialised straight after rendering — or rendered in a hidden tab, where `requestAnimationFrame` never fires — is no longer geometrically empty

- [#412](https://github.com/StatistikStadtZuerich/sszvis/pull/412) [`4c21db3`](https://github.com/StatistikStadtZuerich/sszvis/commit/4c21db338230a261d3d6a4d5049d0227d2c52d67) Thanks [@lloydrichards](https://github.com/lloydrichards)! - stop writing a `<title>` element into the chart's SVG, where the browser drew a native tooltip over the whole chart

- [#462](https://github.com/StatistikStadtZuerich/sszvis/pull/462) [`65bf83a`](https://github.com/StatistikStadtZuerich/sszvis/commit/65bf83a5d0e615d9972dc60b29ecb0512243070c) Thanks [@lloydrichards](https://github.com/lloydrichards)! - `textWrap` now skips wrapping and warns when `width` is not a finite number, instead of writing `x="NaN"` or `x="-Infinity"` onto every line. Reachable through `axis().textWrap()`, which screens its prop with `fn.defined` — that excludes `NaN` but not `±Infinity`. A `y` attribute in non-numeric units, such as the legal `1em` or `50%`, is now copied to the wrapped lines verbatim rather than coerced to `y="NaN"`.

## 3.5.1 (2026-09-10)

- ship `sszvis.css` from the library package, so `sszvis/sszvis.css` resolves from an install instead of only from the documentation site

The stylesheet is now published with the library and exported under its own subpath, so a bundler or `<link>` can reach it directly from `node_modules` — copying it out of the documentation site is no longer necessary:

```code
import "sszvis/sszvis.css";
```

`sszvis/build/sszvis.css` resolves as well, for anyone who already points at that path.

## 3.5.0 (2026-09-08)

- the library is now written entirely in TypeScript, and its types describe the datum your chart actually binds
- add an `ariaLabel` property and keyboard operation to `sszvis.buttonGroup` and `sszvis.selectMenu`
- add `sszvis.stackedBarHorizontalLayout`, `sszvis.stackedBarVerticalLayout` and `sszvis.stackedPyramidLayout`, which return the prepared series together with their layout metadata
- add a `columnLabelOpacity` property to `sszvis.sankey`
- add a `key` property to the mesh, highlight, raster and lake overlay map renderers so several maps can share a page
- bars, dots, pie slices, grouped bars, sunburst rings, map bubbles and map fills now animate
- components now validate their required properties instead of drawing something incomplete
- around 200 fixes across components, maps, controls, layouts and utilities

The TypeScript port that began in 3.3.0 is finished: there is no JavaScript left in the library, and the datum type now flows through the builder chain instead of being erased to `any`. Expect accurate inference where the surface was previously only partly typed — and expect the compiler to point out mistakes in chart code that compiled before.

We also read every component closely this release, and many turned out to be quietly wrong: stacked bars that summed only the first row of a cell, sunburst rings that saturated to white, map bubbles that swallowed clicks meant for the map beneath, and a `sszvis.nestedStackedBarsVertical` exported under a name that did not exist. Your charts may look different after upgrading, usually because they are now drawing what you asked for.

### Breaking changes

Most components now throw at render time when a required property is missing, naming themselves and the property: `[stackedBarVertical] the xScale property is required`. Open each of your charts once before upgrading in production. Wrongly typed properties throw too — a non-function `tickFormat`, an unrecognized `orientation` on `sszvis.legendColorOrdinal` or `slant` in `sszvis.colorLegendLayout`, a resize listener that is not callable.

Other changes worth checking:

- components join only the elements they own, so anything you appended inside their group now accumulates instead of being cleared — append it to a sibling group
- the end caps of `sszvis.legendColorLinear` use the class `sszvis-legend__mark`; the old `ssvis-legend--mark` was a misspelling and any rule matching it is now dead
- lake and missing-value SVG ids are scoped per map; `sszvis.mapLakeFadeGradient` and `sszvis.mapLakeGradientMask` take an id, defaulting to `sszvis.LAKE_FADE_GRADIENT_ID`
- `sszvis.selectMenu` resolves an option by value rather than position, and `current` now overrides a selection the reader made
- `sszvis.app` returns a handle with `destroy()`, accepts a synchronous `init`, and freezes the state it hands to `render`

### Animation

Marks that used to jump now animate. Charts rendering into a screenshot or print pipeline should wait for the transition, or turn it off:

```code
const bars = sszvis.bar().transition(false);
```

Not everything is opt-out: `sszvis.sunburst` interpolates its arcs unconditionally, and the base map renderer eases its fill through `transitionColor`.

### Layouts that carry their metadata

The `…Data` helpers are unchanged. The new `…Layout` helpers return the same series alongside the values a chart usually recomputes by hand:

```code
const layout = sszvis.stackedBarVerticalLayout(stackAcc, seriesAcc, valueAcc)(data);
// { series, keys, maxValue, minValue }

const yScale = d3.scaleLinear().domain([0, layout.maxValue]).range([height, 0]);

chartLayer.selectGroup("bars").datum(layout.series).call(bars);
```

### Fixes

Every fix is listed in the [release notes for 3.5.0](https://github.com/StatistikStadtZuerich/sszvis/releases/tag/v3.5.0). The ones most likely to change what you see:

- **Components** — stacked bars sum every row and draw negative values; stacked pyramids place their reference lines correctly; grouped bars keep and tween their rects; pack and treemap anchor tooltips on the drawn nodes; pie no longer writes transition state onto your data
- **Maps** — handlers receive the hovered entity's datum; bubbles let pointers through unless they handle them; the lake and anchored shape can be switched back off; each choropleth fits its own features
- **Controls and legends** — the slider reads the scale it draws with; the button group lays out as a row again; the linear legend stops corrupting the `displayValues` you pass it; diverging color scales survive `.reverse()`
- **Layouts** — degenerate sizes give a zeroed layout rather than NaN geometry, and sankey places a single column instead of sending it to infinity ([#120](https://github.com/StatistikStadtZuerich/sszvis/issues/120))
- **Utilities** — `sszvis.behavior.move` resolves pointers in the scale's own coordinate space, the voronoi behavior follows a finger on touch, and `sszvis.logger` prints a message and its cause as one entry

## 3.4.0 (2025-12-05)

- add `sszvis.treemap` component for hierarchical data visualization
- add `sszvis.pack` component for circle packing visualizations
- add `sszvis.groupedBarsHorizontal` component for horizontal grouped bar charts
- renamed `sszvis.groupedBars` to `sszvis.groupedBarsVertical` for clarity (backwards compatible for now)
- fix pointer events in `sszvis.move` behavior for better touch support

We've added a new hierarchy section to the documentation that includes examples and guides for using the new `sszvis.treemap` and `sszvis.pack` components as well as the existing `sszvis.sunburst`. These components all follow a similar data structure which has been consolidated into the `sszvis.prepareHierarchyData` utility.

```code
 const hierarchicalData = sszvis
      .prepareHierarchyData()
      .layer(continentAcc)
      .layer(regionAcc)
      .layer(countryAcc)
      .value(numAcc)
      .calculate(data);

```

Existing examples have been updated to use this new utility for preparing hierarchical data more easily.

### Deprecated

The `sszvis.groupedBars` component has been renamed to `sszvis.groupedBarsVertical` to make it clearer that it renders vertical grouped bar charts. The old name is still available for backwards compatibility but will be removed in a future release.

## 3.3.1 (2025-09-25)

- fix `sszvis.panning` behavior with correct data arguments in event handlers

## 3.3.0 (2025-09-19)

- add `sszvis.annotationConfidenceBar` annotation component for displaying confidence intervals and error ranges
- expand props for adding slants to `sszvis.slider` labels

The `sszvis` library now partially supports TypeScript. There are a lot of files still to be converted, but most of the utility functionality is now typed as well as new components like `sszvis.annotationConfidenceBar`. More conversions will follow in future releases.

If you are using TypeScript, you can now import types directly from the `sszvis` package without the need for separate type declaration files.

## 3.2.1 (2025-06-18)

- fix `sszvis.voronoi` when using with centered elements

## 3.2.0 (2025-03-17)

- add new color scales for genders: `sszvis.scaleGender3`, `sszvis.scaleGender6Origin`, `sszvis.scaleGender5Wedding`
- fix darker and brighter color fn

## 3.1.1 (2024-10-28)

- fix the selection of the `sszvis.nestedStackedBarsVertical` to render first time
- updated documentation on data structure to match new `d3.stack` and include examples

## 3.1.0 (2024-10-25)

- added `sszvis.nestedStackedBarsVertical` component
- added `sszvis.annotationConfidenceArea` component
- added `sszvis.rulerLabelVerticalSeparate` function
- improved performance by changing the `.enter().exit()` pattern to `.join()`
- fixes to documentation and examples to improve clarity

## 3.0.5 (2024-09-25)

- fix path removal when merging
- fix interactions in documentation examples

## 3.0.4 (2024-08-30)

- fix custom event handling in `sszvis.behavior.move` to match d3 v7
- fix selectMenu to pass same `onChange` event as buttonGroup

## 3.0.3 (2024-08-15)

- correctly defined values using isNaN
- fix dy calculation in rulers

## 3.0.0 (Aug 2024)

- Upgraded d3 v5 to v7 (**BREAKING CHANGE**)
- Remove polyfills for EI (**BREAKING CHANGE**)
- Update code examples to use modern ES6 features

The `sszvis` library now is dependent on `d3` version 7 (see [d3 v6 migration guide](https://observablehq.com/@d3/d3v6-migration-guide)). This means you will need to upgrade any scripts that import v5 to v7.

```code
<script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
```

The upgrade to d3 v7 comes with a few breaking changes. The most notable one is the usage of newer ES6 data structures like `Map` and `Set` instead of the old `d3.map` and `d3.value` based data structures. This change was necessary to improve performance and to align with modern JavaScript practices.

```code
// This d3 v5 code snippet should be updated to ...
state.maxStacked = d3.max(d3.values(dateValues), function (s) {...});

// ... this d3 v7 code snippet
state.maxStacked = d3.max(Object.values(dateValues), (s) => {...});
```

The other major change is that to mouse event handlers which are now the first argument in the callback for any event listeners. This change causes any existing code that uses interactions (hover, mouse clicks etc) to break.

```code
// This d3 v5 code snippet should be updated to ...
toggleMultiples: function (g) {
  state.isMultiples = g === "Separiert";
  render(state);
},

// ... this d3 v7 code snippet
toggleMultiples: (e, g) => {
  state.isMultiples = g === "Separiert";
  render(state);
},
```

The last change is to the voronoi functionality which has now been updated to use Delaunay. The only noticeable change now is how boundaries are set, now accepting a single array of numbers, rather then two points:

```code
// This d3 v5 code snippet should be updated to ...
var mouseOverlay = sszvis
    .voronoi()
    ...
    .bounds([
      [-bounds.padding.left, -bounds.padding.top],
      [bounds.innerWidth + bounds.padding.right, bounds.innerHeight + 20],
    ]);

// ... this d3 v7 code snippet
var mouseOverlay = sszvis
    .voronoi()
    ...
    .bounds([
      -bounds.padding.left,
      -bounds.padding.top,
      bounds.innerWidth + bounds.padding.right,
      bounds.innerHeight + 20,
    ]);
```

## 2.3.1 (Dec 2022)

- Changed the color palette to match redesign color scheme
- Added a default stroke to `axis` and `rangeRuler` text which can be bypassed with custom prop
- Enforce default stroke on `pie`, `stackedBar` and `stackedArea` components to better visualize the new color scheme

## 2.3.0 (Aug 2020)

- Added `sszvis.app` as a more structured way to create sszvis apps. This helps with managing state through actions and allows us to apply some performance optimizations behind the scenes.

## 2.2.0 (Jul 2020)

- Upgraded d3 to version 5.0
- Added a basic (i.e. incomplete) shim for `d3-request` using the new `d3-fetch` API
  - Refactored all examples to use `d3-fetch`
  - Added Polyfills for browsers that don't support Promises and `fetch()`
- Changed `sszvis.defined` to return false for `NaN` values
- Changed `sszvis.isNumber` to return false for `NaN` values
- Fixed "Extended Maps" examples that previously showed invalid data

### Breaking changes

- Due to the use of more modern features, IE9 and below are no longer supported
- If code relied on the old behavior of `sszvis.defined` or `sszvis.isNumber` that considered `NaN` as a number (which for most purposes of creating visualizations is not useful), existing code might break and must be fixed.

### Docs

- Upgraded all NPM dependencies to their most recent versions
- Formatted all examples with Prettier 2.0
- Removed dependency on Ramda and Radium
- Removed responsive content testbed as it was no longer in use

### Upgrade from 2.0 to 2.2.0

The upgrade to d3 v5 is mostly backwards compatible (see [d3 v5's change log](https://github.com/d3/d3/blob/master/CHANGES.md#changes-in-d3-50)), but existing code should be updated to use the [d3-fetch](https://github.com/d3/d3-fetch) API instead of the old [d3-request](https://github.com/d3/d3-request) API.

```code
function parseRow(x) {
  return { year: parseInt(x.Jahr, 10) };
}

// This d3 v4 code snippet should be updated to ...
d3.csv("http://example.com")
  .row(parseRow)
  .get(function(error, data) {
    if (error) {
      sszvis.loadError(error);
      return;
    }
    actions.prepareState(data);
  });

// ... this d3 v5 code snippet
d3.csv("http://example.com", parseRow)
  .then(actions.prepareState)
  .catch(sszvis.loadError);

// The same is true for d3.json
d3.json("http://example.com", parseRow)
  .then(actions.prepareState)
  .catch(sszvis.loadError);
```

## 2.1.0 (Feb 2020)

- Changed `formatNumber` to remove insignificant trailing zeros
- Changed `sszvis.move` to also invert point scales
- Added new module `sszvis/measure` with utilities to measure elements
  - Added new function `measureText` to calculate the width of a string
  - Added new function `measureAxisLabel` as a preset of `measureText`
  - Added new function `measureLegendLabel` as a preset of `measureText`
- Added new layout `colorLegendLayout` to compute color legend sizes automatically
- Added new helper function `foldPattern`
- Fixed cut-off of color legend circle
- Simplified documentation and removed redundant examples
  - Generalized some chart examples to include more defaults
  - Removed distinction between single- and multi-line chart

## 2.0 (Dec 2017)

### Upgrade from 1.x to 2.0

The sszvis API has changed significantly from version 1.x to 2.0. This was done to a) align more closely with practices in the d3 ecosystem and to be able to leverage ES modules better (by not exporting whole namespaces but each function separately).

sszvis now depends on d3 v4. See [d3 v4's change log](https://github.com/d3/d3/blob/master/CHANGES.md#changes-in-d3-40) for details on d3's API changes.

### Internals

- `sszvis_namespace` ⟼ **replaced by ES modules**
- No more setting of default locale, instead locale and localized formatting and parsing functions are exported

### D3 extensions

- `d3.component` ⟼ **`sszvis.component`**

### Functional utilities

- `sszvis.fn.identity` ⟼ **`sszvis.identity`**
- `sszvis.fn.isString` ⟼ **`sszvis.isString`**
- `sszvis.fn.isSelection` ⟼ **`sszvis.isSelection`**
- `sszvis.fn.arity` ⟼ **`sszvis.arity`**
- `sszvis.fn.compose` ⟼ **`sszvis.compose`**
- `sszvis.fn.contains` ⟼ **`sszvis.contains`**
- `sszvis.fn.defined` ⟼ **`sszvis.defined`**
- `sszvis.fn.derivedSet` ⟼ **`sszvis.derivedSet`**
- `sszvis.fn.every` ⟼ **`sszvis.every`**
- `sszvis.fn.filledArray` ⟼ **`sszvis.filledArray`**
- `sszvis.fn.find` ⟼ **`sszvis.find`**
- `sszvis.fn.first` ⟼ **`sszvis.first`**
- `sszvis.fn.flatten` ⟼ **`sszvis.flatten`**
- `sszvis.fn.firstTouch` ⟼ **`sszvis.firstTouch`**
- `sszvis.fn.hashableSet` ⟼ **`sszvis.hashableSet`**
- `sszvis.fn.isFunction` ⟼ **`sszvis.isFunction`**
- `sszvis.fn.isNull` ⟼ **`sszvis.isNull`**
- `sszvis.fn.isNumber` ⟼ **`sszvis.isNumber`**
- `sszvis.fn.isObject` ⟼ **`sszvis.isObject`**
- `sszvis.fn.last` ⟼ **`sszvis.last`**
- `sszvis.fn.measureDimensions` ⟼ **`sszvis.measureDimensions`**
- `sszvis.fn.not` ⟼ **`sszvis.not`**
- `sszvis.fn.prop` ⟼ **`sszvis.prop`**
- `sszvis.fn.propOr` ⟼ **`sszvis.propOr`**
- `sszvis.fn.set` ⟼ **`sszvis.set`**
- `sszvis.fn.some` ⟼ **`sszvis.some`**
- `sszvis.fn.stringEqual` ⟼ **`sszvis.stringEqual`**
- `sszvis.fn.functor` ⟼ **`sszvis.functor`**

### Parsers

- `sszvis.parse.date` ⟼ **`sszvis.parseDate`**
- `sszvis.parse.year` ⟼ **`sszvis.parseYear`**
- `sszvis.parse.number` ⟼ **`sszvis.parseNumber`**

### Formatters

- `sszvis.format.age` ⟼ **`sszvis.formatAge`**
- `sszvis.format.axisTimeFormat` ⟼ **`sszvis.formatAxisTimeFormat`**
- `sszvis.format.month` ⟼ **`sszvis.formatMonth`**
- `sszvis.format.year` ⟼ **`sszvis.formatYear`**
- `sszvis.format.none` ⟼ **`sszvis.formatNone`**
- `sszvis.format.number` ⟼ **`sszvis.formatNumber`**
- `sszvis.format.preciseNumber` ⟼ **`sszvis.formatPreciseNumber`**
- `sszvis.format.percent` ⟼ **`sszvis.formatPercent`**
- `sszvis.format.fractionPercent` ⟼ **`sszvis.formatFractionPercent`**
- `sszvis.format.text` ⟼ **`sszvis.formatText`**

### Components

- `sszvis.component.bar` ⟼ **`sszvis.bar`**
- `sszvis.component.dot` ⟼ **`sszvis.dot`**
- `sszvis.component.groupedBars` ⟼ **`sszvis.groupedBars`**
- `sszvis.component.line` ⟼ **`sszvis.line`**
- `sszvis.component.pie` ⟼ **`sszvis.pie`**
- `sszvis.component.pyramid` ⟼ **`sszvis.pyramid`**
- `sszvis.component.sankey` ⟼ **`sszvis.sankey`**
- `sszvis.component.stackedArea` ⟼ **`sszvis.stackedArea`**
- `sszvis.component.stackedAreaMultiples` ⟼ **`sszvis.stackedAreaMultiples`**
- `sszvis.component.stackedBar.horizontal` ⟼ **`sszvis.stackedBarHorizontal`**
- `sszvis.component.stackedBar.horizontalStackedBarData` ⟼ **`sszvis.stackedBarHorizontalData`**
- `sszvis.component.stackedBar.vertical` ⟼ **`sszvis.stackedBarVertical`**
- `sszvis.component.stackedBar.verticalStackedBarData` ⟼ **`sszvis.stackedBarVerticalData`**
- `sszvis.component.stackedPyramid` ⟼ **`sszvis.stackedPyramid`**
- `sszvis.component.stackedPyramid.stackedPyramidData` ⟼ **`sszvis.stackedPyramidData`**
- `sszvis.component.sunburst` ⟼ **`sszvis.sunburst`**

### Aspect ratio

- `sszvis.aspectRatio.auto` ⟼ **`sszvis.aspectRatioAuto`**
- `sszvis.aspectRatio.portrait` ⟼ **`sszvis.aspectRatioPortrait`**
- `sszvis.aspectRatio.square` ⟼ **`sszvis.aspectRatioSquare`**
- `sszvis.aspectRatio.ar4to3` ⟼ **`sszvis.aspectRatio4to3`**
- `sszvis.aspectRatio.ar16to10` ⟼ **`sszvis.aspectRatio16to10`**
- `sszvis.aspectRatio.ar12to5` ⟼ **`sszvis.aspectRatio12to5`**

### Behaviors

- `sszvis.behavior.move` ⟼ **`sszvis.move`**
- `sszvis.behavior.panning` ⟼ **`sszvis.panning`**
- `sszvis.behavior.voronoi` ⟼ **`sszvis.voronoi`**

### Color scales

- `sszvis.color.qual12` ⟼ **`sszvis.scaleQual12`**
- `sszvis.color.qual6` ⟼ **`sszvis.scaleQual6`**
- `sszvis.color.qual6a` ⟼ **`sszvis.scaleQual6a`**
- `sszvis.color.qual6b` ⟼ **`sszvis.scaleQual6b`**
- `sszvis.color.seqBlu` ⟼ **`sszvis.scaleSeqBlu`**
- `sszvis.color.seqRed` ⟼ **`sszvis.scaleSeqRed`**
- `sszvis.color.seqGrn` ⟼ **`sszvis.scaleSeqGrn`**
- `sszvis.color.seqBrn` ⟼ **`sszvis.scaleSeqBrn`**
- `sszvis.color.divVal` ⟼ **`sszvis.scaleDivVal`**
- `sszvis.color.divValGry` ⟼ **`sszvis.scaleDivValGry`**
- `sszvis.color.divNtr` ⟼ **`sszvis.scaleDivNtr`**
- `sszvis.color.divNtrGry` ⟼ **`sszvis.scaleDivNtrGry`**
- `sszvis.color.lightGry` ⟼ **`sszvis.scaleLightGry`**
- `sszvis.color.paleGry` ⟼ **`sszvis.scalePaleGry`**
- `sszvis.color.gry` ⟼ **`sszvis.scaleGry`**
- `sszvis.color.dimGry` ⟼ **`sszvis.scaleDimGry`**
- `sszvis.color.medGry` ⟼ **`sszvis.scaleMedGry`**
- `sszvis.color.deepGry` ⟼ **`sszvis.scaleDeepGry`**

### Color helpers

- `sszvis.color.slightlyDarker` ⟼ **`sszvis.slightlyDarker`**
- `sszvis.color.muchDarker` ⟼ **`sszvis.muchDarker`**
- `sszvis.color.withAlpha` ⟼ **`sszvis.withAlpha`**

### Axes

- `sszvis.axis.x` ⟼ **`sszvis.axisX`**
- `sszvis.axis.y` ⟼ **`sszvis.axisY`**

### SVG Utils

- `sszvis.svgUtils.crisp.halfPixel` ⟼ **`sszvis.halfPixel`**
- `sszvis.svgUtils.crisp.roundTransformString` ⟼ **`sszvis.roundTransformString`**
- `sszvis.svgUtils.crisp.transformTranslateSubpixelShift` ⟼ **`sszvis.transformTranslateSubpixelShift`**
- `sszvis.svgUtils.modularText.svg` ⟼ **`sszvis.modularTextSVG`**
- `sszvis.svgUtils.modularText.html` ⟼ **`sszvis.modularTextHTML`**
- `sszvis.svgUtils.ensureDefsElement` ⟼ **`sszvis.ensureDefsElement`**
- `sszvis.svgUtils.textWrap` ⟼ **`sszvis.textWrap`**
- `sszvis.svgUtils.translateString` ⟼ **`sszvis.translateString`**

### Viewport

- `sszvis.viewport` ⟼ **no change**

### Legends

- `sszvis.legend.binnedColorScale` ⟼ **`sszvis.legendColorBinned`**
- `sszvis.legend.linearColorScale` ⟼ **`sszvis.legendColorLinear`**
- `sszvis.legend.ordinalColorScale` ⟼ **`sszvis.legendColorOrdinal`**
- `sszvis.legend.radius` ⟼ **`sszvis.legendRadius`**

### Layout

- `sszvis.layout.heatTableDimensions` ⟼ **`sszvis.dimensionsHeatTable`**
- `sszvis.layout.horizontalBarChartDimensions` ⟼ **`sszvis.dimensionsHorizontalBarChart`**
- `sszvis.layout.verticalBarChartDimensions` ⟼ **`sszvis.dimensionsVerticalBarChart`**
- `sszvis.layout.populationPyramidLayout` ⟼ **`sszvis.layoutPopulationPyramid`**
- `sszvis.layout.smallMultiples` ⟼ **`sszvis.layoutSmallMultiples`**
- `sszvis.layout.stackedAreaMultiples` ⟼ **`sszvis.layoutStackedAreaMultiples`**
- `sszvis.layout.sankey.prepareData` ⟼ **`sszvis.sankeyPrepareData`**
- `sszvis.layout.sankey.computeLayout` ⟼ **`sszvis.sankeyLayout`**
- `sszvis.layout.sunburst.prepareData` ⟼ **`sszvis.sunburstPrepareData`**
- `sszvis.layout.sunburst.computeLayout` ⟼ **`sszvis.sunburstLayout`**
- `sszvis.layout.sunburst.getRadiusExtent` ⟼ **`sszvis.sunburstGetRadiusExtent`**

### Patterns

- `sszvis.patterns.heatTableMissingValuePattern` ⟼ **`sszvis.heatTableMissingValuePattern`**
- `sszvis.patterns.mapMissingValuePattern` ⟼ **`sszvis.mapMissingValuePattern`**
- `sszvis.patterns.mapLakePattern` ⟼ **`sszvis.mapLakePattern`**
- `sszvis.patterns.mapLakeFadeGradient` ⟼ **`sszvis.mapLakeFadeGradient`**
- `sszvis.patterns.mapLakeGradientMask` ⟼ **`sszvis.mapLakeGradientMask`**
- `sszvis.patterns.dataAreaPattern` ⟼ **`sszvis.dataAreaPattern`**

### Maps

Hard-coded map modules have been removed in favor of [loading geodata from GeoJSON or TopoJSON files](/map-standard#preparing-geodata).

- `sszvis.map.utils.constants.STADT_KREISE_KEY` ⟼ **`sszvis.STADT_KREISE_KEY`**
- `sszvis.map.utils.constants.STATISTISCHE_QUARTIERE_KEY` ⟼ **`sszvis.STATISTISCHE_QUARTIERE_KEY`**
- `sszvis.map.utils.constants.STATISTISCHE_ZONEN_KEY` ⟼ **`sszvis.STATISTISCHE_ZONEN_KEY`**
- `sszvis.map.utils.constants.WAHL_KREISE_KEY` ⟼ **`sszvis.WAHL_KREISE_KEY`**
- `sszvis.map.utils.constants.AGGLOMERATION_2012_KEY` ⟼ **`sszvis.AGGLOMERATION_2012_KEY`**
- `sszvis.map.utils.constants.SWITZERLAND_KEY` ⟼ **`sszvis.SWITZERLAND_KEY`**
- `sszvis.map.utils.GEO_KEY_DEFAULT` ⟼ **`sszvis.GEO_KEY_DEFAULT`**
- `sszvis.map.utils.swissMapProjection` ⟼ **`sszvis.swissMapProjection`**
- `sszvis.map.utils.swissMapPath` ⟼ **`sszvis.swissMapPath`**
- `sszvis.map.utils.pixelsFromDistance` ⟼ **`sszvis.pixelsFromGeoDistance`**
- `sszvis.map.utils.prepareMergedData` ⟼ **`sszvis.prepareMergedGeoData`**
- `sszvis.map.utils.getGeoJsonCenter` ⟼ **`sszvis.getGeoJsonCenter`**
- `sszvis.map.utils.widthAdaptiveMapPathStroke` ⟼ **`sszvis.widthAdaptiveMapPathStroke`**
- `sszvis.map.renderer.anchoredCircles` ⟼ **`sszvis.mapRendererBubble`**
- `sszvis.map.renderer.base` ⟼ **`sszvis.mapRendererBase`**
- `sszvis.map.renderer.geojson` ⟼ **`sszvis.mapRendererGeoJson`**
- `sszvis.map.renderer.highlight` ⟼ **`sszvis.mapRendererHighlight`**
- `sszvis.map.renderer.image` ⟼ **`sszvis.mapRendererImage`**
- `sszvis.map.renderer.mesh` ⟼ **`sszvis.mapRendererMesh`**
- `sszvis.map.renderer.patternedlakeoverlay` ⟼ **`sszvis.mapRendererPatternedLakeOverlay`**
- `sszvis.map.renderer.raster` ⟼ **`sszvis.mapRendererRaster`**

## Map projections

These were related to the map modules and aren't needed anymore.

- `sszvis.map.projection.zurichStadtKreise` ⟼ **removed**
- `sszvis.map.projection.zurichStatistischeQuartiere` ⟼ **removed**
- `sszvis.map.projection.zurichWahlKreise` ⟼ **removed**
- `sszvis.map.projection.zurichStatistischeZonen` ⟼ **removed**
- `sszvis.map.projection.zurichAgglomeration2012` ⟼ **removed**
- `sszvis.map.projection.switzerland` ⟼ **removed**
