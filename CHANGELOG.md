## 3.0.3 (2024-08-15)

### Bug Fixes

- 🐛 fix dy calculation of ruler (ee8fea2)
- 🐛 fix ruler text alignment (b1b3b3b)

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
- Enforce default stroke on `pie`, `stackedBar` and `stackedArea` components to better visualise the new color scheme

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
- If code relied on the old behaviour of `sszvis.defined` or `sszvis.isNumber` that considered `NaN` as a number (which for most purposes of creating visualizations is not useful), existing code might break and must be fixed.

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
