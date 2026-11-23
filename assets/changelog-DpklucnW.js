import{o as e,t}from"./jsx-runtime-B4SJo7uk.js";import{n}from"./lib-BMFDpM32.js";var r=t();function i(e){let t={a:`a`,code:`code`,figure:`figure`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,span:`span`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.h2,{id:`352-2026-09-18`,children:[`3.5.2 (2026-09-18)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#352-2026-09-18`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`the SVG and raster map renderers write the fill, positioning and pointer events they depend on inline, so a chart shipped without `,(0,r.jsx)(t.code,{children:`sszvis.css`}),` draws outlines rather than filled shapes covering the map, and lets pointers through to the base layer`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.mapRendererGeoJson()`}),` shapes are a hit area when an `,(0,r.jsx)(t.code,{children:`over`}),`, `,(0,r.jsx)(t.code,{children:`out`}),` or `,(0,r.jsx)(t.code,{children:`click`}),` handler is registered on them`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.line()`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.stackedArea()`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.stackedAreaMultiples()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.stackedPyramid()`}),` reference outlines break at a non-finite value instead of truncating there`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.line()`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.stackedArea()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.sunburst()`}),` write their geometry on the render tick rather than only through the transition, so a chart measured or serialized before the first animation frame is no longer empty`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.sunburst()`}),` anchors its tooltips on the destination angles instead of the ones currently on screen, so they no longer trail a render behind the arcs`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.stackedPyramid()`}),` forwards d3's index to `,(0,r.jsx)(t.code,{children:`barWidth`}),`, `,(0,r.jsx)(t.code,{children:`barPosition`}),` and `,(0,r.jsx)(t.code,{children:`barFill`}),`, centers its reference outlines on the bars they describe, and removes one whose series goes away`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.stackedPyramidLayout()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.stackedPyramidData()`}),` keep the stacking order the series accessor returned and sum every row they place in one cell, as `,(0,r.jsx)(t.code,{children:`sszvis.stackedBarData()`}),` already did`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.stackedBarVerticalData()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.stackedBarVerticalLayout()`}),` number each series by its position in the array they return, so an `,(0,r.jsx)(t.code,{children:`index`}),` read for a legend is no longer upside down`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.mapRendererBubble()`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.mapRendererPatternedLakeOverlay()`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.stackedPyramid()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.prepareMergedGeoData()`}),` report their missing required properties by name before drawing, instead of failing partway through the render`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.mapRendererRaster()`}),` draws an empty canvas when the layer has no data bound, the state every chart is in before its data load`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.groupedBarsVertical()`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.groupedBarsHorizontal()`}),` take a constant for `,(0,r.jsx)(t.code,{children:`x`}),` and `,(0,r.jsx)(t.code,{children:`y`}),`, as `,(0,r.jsx)(t.code,{children:`width`}),` and `,(0,r.jsx)(t.code,{children:`height`}),` already did`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.textWrap()`}),` warns and skips wrapping when `,(0,r.jsx)(t.code,{children:`width`}),` is not finite, and keeps a `,(0,r.jsx)(t.code,{children:`y`}),` given in non-numeric units such as `,(0,r.jsx)(t.code,{children:`1em`})]}),`
`,(0,r.jsxs)(t.li,{children:[`the chart's SVG no longer carries a `,(0,r.jsx)(t.code,{children:`<title>`}),`, which the browser drew as a native tooltip over the whole chart`]}),`
`,(0,r.jsxs)(t.li,{children:[`accessors, formatters and event handlers are typed against the values they actually receive, and `,(0,r.jsx)(t.code,{children:`ColorValue`}),`, `,(0,r.jsx)(t.code,{children:`Measurement`}),`, `,(0,r.jsx)(t.code,{children:`PartialMeasurement`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.colorToString`}),` are exported so a chart can name the types its own accessors return`]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`worth-checking`,children:[`Worth checking`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#worth-checking`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsx)(t.p,{children:`Two of the stylesheet fixes change what a map draws.`}),`
`,(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:`sszvis.mapRendererGeoJson()`}),` shapes were marked as event targets and had handlers bound to them, but `,(0,r.jsx)(t.code,{children:`sszvis.css`}),` gave them `,(0,r.jsx)(t.code,{children:`pointer-events: none`}),`, so no handler could ever fire. They are now a target whenever one is registered — which means a geojson overlay shadows the layer beneath it over its own shapes, so a chart driving tooltips from a choropleth base layer under such an overlay will see the overlay win there. With no handler registered the shapes stay inert, exactly as before. This matches `,(0,r.jsx)(t.code,{children:`sszvis.mapRendererBubble()`}),`.`]}),`
`,(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:`sszvis.mapRendererPatternedLakeOverlay()`}),` writes the lake border's stroke, width and dash pattern inline, defaulting to the grey dotted line the stylesheet used to supply; an explicitly falsy `,(0,r.jsx)(t.code,{children:`lakePathColor`}),` now means no border rather than a fallback to the stylesheet. An unset `,(0,r.jsx)(t.code,{children:`lakeBounds`}),` draws no border path at all, instead of a classed path with no geometry, and `,(0,r.jsx)(t.code,{children:`mapPath`}),` is required whenever there is a lake to draw. Asking for no lake still needs neither property.`]}),`
`,(0,r.jsxs)(t.h2,{id:`351-2026-09-10`,children:[`3.5.1 (2026-09-10)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#351-2026-09-10`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`ship `,(0,r.jsx)(t.code,{children:`sszvis.css`}),` from the library package, so `,(0,r.jsx)(t.code,{children:`sszvis/sszvis.css`}),` resolves from an install instead of only from the documentation site`]}),`
`]}),`
`,(0,r.jsxs)(t.p,{children:[`The stylesheet is now published with the library and exported under its own subpath, so a bundler or `,(0,r.jsx)(t.code,{children:`<link>`}),` can reach it directly from `,(0,r.jsx)(t.code,{children:`node_modules`}),` — copying it out of the documentation site is no longer necessary:`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsx)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`import "sszvis/sszvis.css";`})})})})}),`
`,(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:`sszvis/build/sszvis.css`}),` resolves as well, for anyone who already points at that path.`]}),`
`,(0,r.jsxs)(t.h2,{id:`350-2026-09-08`,children:[`3.5.0 (2026-09-08)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#350-2026-09-08`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`the library is now written entirely in TypeScript, and its types describe the datum your chart actually binds`}),`
`,(0,r.jsxs)(t.li,{children:[`add an `,(0,r.jsx)(t.code,{children:`ariaLabel`}),` property and keyboard operation to `,(0,r.jsx)(t.code,{children:`sszvis.buttonGroup`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.selectMenu`})]}),`
`,(0,r.jsxs)(t.li,{children:[`add `,(0,r.jsx)(t.code,{children:`sszvis.stackedBarHorizontalLayout`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.stackedBarVerticalLayout`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.stackedPyramidLayout`}),`, which return the prepared series together with their layout metadata`]}),`
`,(0,r.jsxs)(t.li,{children:[`add a `,(0,r.jsx)(t.code,{children:`columnLabelOpacity`}),` property to `,(0,r.jsx)(t.code,{children:`sszvis.sankey`})]}),`
`,(0,r.jsxs)(t.li,{children:[`add a `,(0,r.jsx)(t.code,{children:`key`}),` property to the mesh, highlight, raster and lake overlay map renderers so several maps can share a page`]}),`
`,(0,r.jsx)(t.li,{children:`bars, dots, pie slices, grouped bars, sunburst rings, map bubbles and map fills now animate`}),`
`,(0,r.jsx)(t.li,{children:`components now validate their required properties instead of drawing something incomplete`}),`
`,(0,r.jsx)(t.li,{children:`around 200 fixes across components, maps, controls, layouts and utilities`}),`
`]}),`
`,(0,r.jsxs)(t.p,{children:[`The TypeScript port that began in 3.3.0 is finished: there is no JavaScript left in the library, and the datum type now flows through the builder chain instead of being erased to `,(0,r.jsx)(t.code,{children:`any`}),`. Expect accurate inference where the surface was previously only partly typed — and expect the compiler to point out mistakes in chart code that compiled before.`]}),`
`,(0,r.jsxs)(t.p,{children:[`We also read every component closely this release, and many turned out to be quietly wrong: stacked bars that summed only the first row of a cell, sunburst rings that saturated to white, map bubbles that swallowed clicks meant for the map beneath, and a `,(0,r.jsx)(t.code,{children:`sszvis.nestedStackedBarsVertical`}),` exported under a name that did not exist. Your charts may look different after upgrading, usually because they are now drawing what you asked for.`]}),`
`,(0,r.jsxs)(t.h3,{id:`breaking-changes`,children:[`Breaking changes`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#breaking-changes`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`Most components now throw at render time when a required property is missing, naming themselves and the property: `,(0,r.jsx)(t.code,{children:`[stackedBarVertical] the xScale property is required`}),`. Open each of your charts once before upgrading in production. Wrongly typed properties throw too — a non-function `,(0,r.jsx)(t.code,{children:`tickFormat`}),`, an unrecognized `,(0,r.jsx)(t.code,{children:`orientation`}),` on `,(0,r.jsx)(t.code,{children:`sszvis.legendColorOrdinal`}),` or `,(0,r.jsx)(t.code,{children:`slant`}),` in `,(0,r.jsx)(t.code,{children:`sszvis.colorLegendLayout`}),`, a resize listener that is not callable.`]}),`
`,(0,r.jsx)(t.p,{children:`Other changes worth checking:`}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`components join only the elements they own, so anything you appended inside their group now accumulates instead of being cleared — append it to a sibling group`}),`
`,(0,r.jsxs)(t.li,{children:[`the end caps of `,(0,r.jsx)(t.code,{children:`sszvis.legendColorLinear`}),` use the class `,(0,r.jsx)(t.code,{children:`sszvis-legend__mark`}),`; the old `,(0,r.jsx)(t.code,{children:`ssvis-legend--mark`}),` was a misspelling and any rule matching it is now dead`]}),`
`,(0,r.jsxs)(t.li,{children:[`lake and missing-value SVG ids are scoped per map; `,(0,r.jsx)(t.code,{children:`sszvis.mapLakeFadeGradient`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.mapLakeGradientMask`}),` take an id, defaulting to `,(0,r.jsx)(t.code,{children:`sszvis.LAKE_FADE_GRADIENT_ID`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.selectMenu`}),` resolves an option by value rather than position, and `,(0,r.jsx)(t.code,{children:`current`}),` now overrides a selection the reader made`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.app`}),` returns a handle with `,(0,r.jsx)(t.code,{children:`destroy()`}),`, accepts a synchronous `,(0,r.jsx)(t.code,{children:`init`}),`, and freezes the state it hands to `,(0,r.jsx)(t.code,{children:`render`})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`animation`,children:[`Animation`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#animation`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsx)(t.p,{children:`Marks that used to jump now animate. Charts rendering into a screenshot or print pipeline should wait for the transition, or turn it off:`}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsx)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`const bars = sszvis.bar().transition(false);`})})})})}),`
`,(0,r.jsxs)(t.p,{children:[`Not everything is opt-out: `,(0,r.jsx)(t.code,{children:`sszvis.sunburst`}),` interpolates its arcs unconditionally, and the base map renderer eases its fill through `,(0,r.jsx)(t.code,{children:`transitionColor`}),`.`]}),`
`,(0,r.jsxs)(t.h3,{id:`layouts-that-carry-their-metadata`,children:[`Layouts that carry their metadata`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#layouts-that-carry-their-metadata`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`The `,(0,r.jsx)(t.code,{children:`…Data`}),` helpers are unchanged. The new `,(0,r.jsx)(t.code,{children:`…Layout`}),` helpers return the same series alongside the values a chart usually recomputes by hand:`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`const layout = sszvis.stackedBarVerticalLayout(stackAcc, seriesAcc, valueAcc)(data);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// { series, keys, maxValue, minValue }`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`const yScale = d3.scaleLinear().domain([0, layout.maxValue]).range([height, 0]);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`chartLayer.selectGroup("bars").datum(layout.series).call(bars);`})})]})})}),`
`,(0,r.jsxs)(t.h3,{id:`fixes`,children:[`Fixes`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#fixes`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`Every fix is listed in the `,(0,r.jsx)(t.a,{href:`https://github.com/StatistikStadtZuerich/sszvis/releases/tag/v3.5.0`,children:`release notes for 3.5.0`}),`. The ones most likely to change what you see:`]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.strong,{children:`Components`}),` — stacked bars sum every row and draw negative values; stacked pyramids place their reference lines correctly; grouped bars keep and tween their rects; pack and treemap anchor tooltips on the drawn nodes; pie no longer writes transition state onto your data`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.strong,{children:`Maps`}),` — handlers receive the hovered entity's datum; bubbles let pointers through unless they handle them; the lake and anchored shape can be switched back off; each choropleth fits its own features`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.strong,{children:`Controls and legends`}),` — the slider reads the scale it draws with; the button group lays out as a row again; the linear legend stops corrupting the `,(0,r.jsx)(t.code,{children:`displayValues`}),` you pass it; diverging color scales survive `,(0,r.jsx)(t.code,{children:`.reverse()`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.strong,{children:`Layouts`}),` — degenerate sizes give a zeroed layout rather than NaN geometry, and sankey places a single column instead of sending it to infinity (`,(0,r.jsx)(t.a,{href:`https://github.com/StatistikStadtZuerich/sszvis/issues/120`,children:`#120`}),`)`]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.strong,{children:`Utilities`}),` — `,(0,r.jsx)(t.code,{children:`sszvis.behavior.move`}),` resolves pointers in the scale's own coordinate space, the voronoi behavior follows a finger on touch, and `,(0,r.jsx)(t.code,{children:`sszvis.logger`}),` prints a message and its cause as one entry`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`340-2025-12-05`,children:[`3.4.0 (2025-12-05)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#340-2025-12-05`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`add `,(0,r.jsx)(t.code,{children:`sszvis.treemap`}),` component for hierarchical data visualization`]}),`
`,(0,r.jsxs)(t.li,{children:[`add `,(0,r.jsx)(t.code,{children:`sszvis.pack`}),` component for circle packing visualizations`]}),`
`,(0,r.jsxs)(t.li,{children:[`add `,(0,r.jsx)(t.code,{children:`sszvis.groupedBarsHorizontal`}),` component for horizontal grouped bar charts`]}),`
`,(0,r.jsxs)(t.li,{children:[`renamed `,(0,r.jsx)(t.code,{children:`sszvis.groupedBars`}),` to `,(0,r.jsx)(t.code,{children:`sszvis.groupedBarsVertical`}),` for clarity (backwards compatible for now)`]}),`
`,(0,r.jsxs)(t.li,{children:[`fix pointer events in `,(0,r.jsx)(t.code,{children:`sszvis.move`}),` behavior for better touch support`]}),`
`]}),`
`,(0,r.jsxs)(t.p,{children:[`We've added a new hierarchy section to the documentation that includes examples and guides for using the new `,(0,r.jsx)(t.code,{children:`sszvis.treemap`}),` and `,(0,r.jsx)(t.code,{children:`sszvis.pack`}),` components as well as the existing `,(0,r.jsx)(t.code,{children:`sszvis.sunburst`}),`. These components all follow a similar data structure which has been consolidated into the `,(0,r.jsx)(t.code,{children:`sszvis.prepareHierarchyData`}),` utility.`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:` const hierarchicalData = sszvis`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .prepareHierarchyData()`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .layer(continentAcc)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .layer(regionAcc)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .layer(countryAcc)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .value(numAcc)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      .calculate(data);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `})]})})}),`
`,(0,r.jsx)(t.p,{children:`Existing examples have been updated to use this new utility for preparing hierarchical data more easily.`}),`
`,(0,r.jsxs)(t.h3,{id:`deprecated`,children:[`Deprecated`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#deprecated`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`The `,(0,r.jsx)(t.code,{children:`sszvis.groupedBars`}),` component has been renamed to `,(0,r.jsx)(t.code,{children:`sszvis.groupedBarsVertical`}),` to make it clearer that it renders vertical grouped bar charts. The old name is still available for backwards compatibility but will be removed in a future release.`]}),`
`,(0,r.jsxs)(t.h2,{id:`331-2025-09-25`,children:[`3.3.1 (2025-09-25)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#331-2025-09-25`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`fix `,(0,r.jsx)(t.code,{children:`sszvis.panning`}),` behavior with correct data arguments in event handlers`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`330-2025-09-19`,children:[`3.3.0 (2025-09-19)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#330-2025-09-19`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`add `,(0,r.jsx)(t.code,{children:`sszvis.annotationConfidenceBar`}),` annotation component for displaying confidence intervals and error ranges`]}),`
`,(0,r.jsxs)(t.li,{children:[`expand props for adding slants to `,(0,r.jsx)(t.code,{children:`sszvis.slider`}),` labels`]}),`
`]}),`
`,(0,r.jsxs)(t.p,{children:[`The `,(0,r.jsx)(t.code,{children:`sszvis`}),` library now partially supports TypeScript. There are a lot of files still to be converted, but most of the utility functionality is now typed as well as new components like `,(0,r.jsx)(t.code,{children:`sszvis.annotationConfidenceBar`}),`. More conversions will follow in future releases.`]}),`
`,(0,r.jsxs)(t.p,{children:[`If you are using TypeScript, you can now import types directly from the `,(0,r.jsx)(t.code,{children:`sszvis`}),` package without the need for separate type declaration files.`]}),`
`,(0,r.jsxs)(t.h2,{id:`321-2025-06-18`,children:[`3.2.1 (2025-06-18)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#321-2025-06-18`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`fix `,(0,r.jsx)(t.code,{children:`sszvis.voronoi`}),` when using with centered elements`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`320-2025-03-17`,children:[`3.2.0 (2025-03-17)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#320-2025-03-17`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`add new color scales for genders: `,(0,r.jsx)(t.code,{children:`sszvis.scaleGender3`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.scaleGender6Origin`}),`, `,(0,r.jsx)(t.code,{children:`sszvis.scaleGender5Wedding`})]}),`
`,(0,r.jsx)(t.li,{children:`fix darker and brighter color fn`}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`311-2024-10-28`,children:[`3.1.1 (2024-10-28)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#311-2024-10-28`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`fix the selection of the `,(0,r.jsx)(t.code,{children:`sszvis.nestedStackedBarsVertical`}),` to render first time`]}),`
`,(0,r.jsxs)(t.li,{children:[`updated documentation on data structure to match new `,(0,r.jsx)(t.code,{children:`d3.stack`}),` and include examples`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`310-2024-10-25`,children:[`3.1.0 (2024-10-25)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#310-2024-10-25`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`added `,(0,r.jsx)(t.code,{children:`sszvis.nestedStackedBarsVertical`}),` component`]}),`
`,(0,r.jsxs)(t.li,{children:[`added `,(0,r.jsx)(t.code,{children:`sszvis.annotationConfidenceArea`}),` component`]}),`
`,(0,r.jsxs)(t.li,{children:[`added `,(0,r.jsx)(t.code,{children:`sszvis.rulerLabelVerticalSeparate`}),` function`]}),`
`,(0,r.jsxs)(t.li,{children:[`improved performance by changing the `,(0,r.jsx)(t.code,{children:`.enter().exit()`}),` pattern to `,(0,r.jsx)(t.code,{children:`.join()`})]}),`
`,(0,r.jsx)(t.li,{children:`fixes to documentation and examples to improve clarity`}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`305-2024-09-25`,children:[`3.0.5 (2024-09-25)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#305-2024-09-25`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`fix path removal when merging`}),`
`,(0,r.jsx)(t.li,{children:`fix interactions in documentation examples`}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`304-2024-08-30`,children:[`3.0.4 (2024-08-30)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#304-2024-08-30`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`fix custom event handling in `,(0,r.jsx)(t.code,{children:`sszvis.behavior.move`}),` to match d3 v7`]}),`
`,(0,r.jsxs)(t.li,{children:[`fix selectMenu to pass same `,(0,r.jsx)(t.code,{children:`onChange`}),` event as buttonGroup`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`303-2024-08-15`,children:[`3.0.3 (2024-08-15)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#303-2024-08-15`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`correctly defined values using isNaN`}),`
`,(0,r.jsx)(t.li,{children:`fix dy calculation in rulers`}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`300-aug-2024`,children:[`3.0.0 (Aug 2024)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#300-aug-2024`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`Upgraded d3 v5 to v7 (`,(0,r.jsx)(t.strong,{children:`BREAKING CHANGE`}),`)`]}),`
`,(0,r.jsxs)(t.li,{children:[`Remove polyfills for EI (`,(0,r.jsx)(t.strong,{children:`BREAKING CHANGE`}),`)`]}),`
`,(0,r.jsx)(t.li,{children:`Update code examples to use modern ES6 features`}),`
`]}),`
`,(0,r.jsxs)(t.p,{children:[`The `,(0,r.jsx)(t.code,{children:`sszvis`}),` library now is dependent on `,(0,r.jsx)(t.code,{children:`d3`}),` version 7 (see `,(0,r.jsx)(t.a,{href:`https://observablehq.com/@d3/d3v6-migration-guide`,children:`d3 v6 migration guide`}),`). This means you will need to upgrade any scripts that import v5 to v7.`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsx)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`<script src="https://unpkg.com/d3@7/dist/d3.min.js"><\/script>`})})})})}),`
`,(0,r.jsxs)(t.p,{children:[`The upgrade to d3 v7 comes with a few breaking changes. The most notable one is the usage of newer ES6 data structures like `,(0,r.jsx)(t.code,{children:`Map`}),` and `,(0,r.jsx)(t.code,{children:`Set`}),` instead of the old `,(0,r.jsx)(t.code,{children:`d3.map`}),` and `,(0,r.jsx)(t.code,{children:`d3.value`}),` based data structures. This change was necessary to improve performance and to align with modern JavaScript practices.`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// This d3 v5 code snippet should be updated to ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`state.maxStacked = d3.max(d3.values(dateValues), function (s) {...});`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// ... this d3 v7 code snippet`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`state.maxStacked = d3.max(Object.values(dateValues), (s) => {...});`})})]})})}),`
`,(0,r.jsx)(t.p,{children:`The other major change is that to mouse event handlers which are now the first argument in the callback for any event listeners. This change causes any existing code that uses interactions (hover, mouse clicks etc) to break.`}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// This d3 v5 code snippet should be updated to ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`toggleMultiples: function (g) {`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  state.isMultiples = g === "Separiert";`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  render(state);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`},`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// ... this d3 v7 code snippet`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`toggleMultiples: (e, g) => {`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  state.isMultiples = g === "Separiert";`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  render(state);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`},`})})]})})}),`
`,(0,r.jsx)(t.p,{children:`The last change is to the voronoi functionality which has now been updated to use Delaunay. The only noticeable change now is how boundaries are set, now accepting a single array of numbers, rather then two points:`}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// This d3 v5 code snippet should be updated to ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`var mouseOverlay = sszvis`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    .voronoi()`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    .bounds([`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      [-bounds.padding.left, -bounds.padding.top],`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      [bounds.innerWidth + bounds.padding.right, bounds.innerHeight + 20],`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    ]);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// ... this d3 v7 code snippet`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`var mouseOverlay = sszvis`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    .voronoi()`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    .bounds([`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      -bounds.padding.left,`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      -bounds.padding.top,`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      bounds.innerWidth + bounds.padding.right,`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      bounds.innerHeight + 20,`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    ]);`})})]})})}),`
`,(0,r.jsxs)(t.h2,{id:`231-dec-2022`,children:[`2.3.1 (Dec 2022)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#231-dec-2022`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`Changed the color palette to match redesign color scheme`}),`
`,(0,r.jsxs)(t.li,{children:[`Added a default stroke to `,(0,r.jsx)(t.code,{children:`axis`}),` and `,(0,r.jsx)(t.code,{children:`rangeRuler`}),` text which can be bypassed with custom prop`]}),`
`,(0,r.jsxs)(t.li,{children:[`Enforce default stroke on `,(0,r.jsx)(t.code,{children:`pie`}),`, `,(0,r.jsx)(t.code,{children:`stackedBar`}),` and `,(0,r.jsx)(t.code,{children:`stackedArea`}),` components to better visualize the new color scheme`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`230-aug-2020`,children:[`2.3.0 (Aug 2020)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#230-aug-2020`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`Added `,(0,r.jsx)(t.code,{children:`sszvis.app`}),` as a more structured way to create sszvis apps. This helps with managing state through actions and allows us to apply some performance optimizations behind the scenes.`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`220-jul-2020`,children:[`2.2.0 (Jul 2020)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#220-jul-2020`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`Upgraded d3 to version 5.0`}),`
`,(0,r.jsxs)(t.li,{children:[`Added a basic (i.e. incomplete) shim for `,(0,r.jsx)(t.code,{children:`d3-request`}),` using the new `,(0,r.jsx)(t.code,{children:`d3-fetch`}),` API`,`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`Refactored all examples to use `,(0,r.jsx)(t.code,{children:`d3-fetch`})]}),`
`,(0,r.jsxs)(t.li,{children:[`Added Polyfills for browsers that don't support Promises and `,(0,r.jsx)(t.code,{children:`fetch()`})]}),`
`]}),`
`]}),`
`,(0,r.jsxs)(t.li,{children:[`Changed `,(0,r.jsx)(t.code,{children:`sszvis.defined`}),` to return false for `,(0,r.jsx)(t.code,{children:`NaN`}),` values`]}),`
`,(0,r.jsxs)(t.li,{children:[`Changed `,(0,r.jsx)(t.code,{children:`sszvis.isNumber`}),` to return false for `,(0,r.jsx)(t.code,{children:`NaN`}),` values`]}),`
`,(0,r.jsx)(t.li,{children:`Fixed "Extended Maps" examples that previously showed invalid data`}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`breaking-changes-1`,children:[`Breaking changes`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#breaking-changes-1`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`Due to the use of more modern features, IE9 and below are no longer supported`}),`
`,(0,r.jsxs)(t.li,{children:[`If code relied on the old behavior of `,(0,r.jsx)(t.code,{children:`sszvis.defined`}),` or `,(0,r.jsx)(t.code,{children:`sszvis.isNumber`}),` that considered `,(0,r.jsx)(t.code,{children:`NaN`}),` as a number (which for most purposes of creating visualizations is not useful), existing code might break and must be fixed.`]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`docs`,children:[`Docs`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#docs`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`Upgraded all NPM dependencies to their most recent versions`}),`
`,(0,r.jsx)(t.li,{children:`Formatted all examples with Prettier 2.0`}),`
`,(0,r.jsx)(t.li,{children:`Removed dependency on Ramda and Radium`}),`
`,(0,r.jsx)(t.li,{children:`Removed responsive content testbed as it was no longer in use`}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`upgrade-from-20-to-220`,children:[`Upgrade from 2.0 to 2.2.0`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#upgrade-from-20-to-220`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`The upgrade to d3 v5 is mostly backwards compatible (see `,(0,r.jsx)(t.a,{href:`https://github.com/d3/d3/blob/master/CHANGES.md#changes-in-d3-50`,children:`d3 v5's change log`}),`), but existing code should be updated to use the `,(0,r.jsx)(t.a,{href:`https://github.com/d3/d3-fetch`,children:`d3-fetch`}),` API instead of the old `,(0,r.jsx)(t.a,{href:`https://github.com/d3/d3-request`,children:`d3-request`}),` API.`]}),`
`,(0,r.jsx)(t.figure,{"data-rehype-pretty-code-figure":``,children:(0,r.jsx)(t.pre,{tabIndex:`0`,"data-language":`code`,"data-theme":`catalog-dark catalog-light`,children:(0,r.jsxs)(t.code,{"data-language":`code`,"data-theme":`catalog-dark catalog-light`,style:{display:`grid`},children:[(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`function parseRow(x) {`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  return { year: parseInt(x.Jahr, 10) };`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`}`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// This d3 v4 code snippet should be updated to ...`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`d3.csv("http://example.com")`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .row(parseRow)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .get(function(error, data) {`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    if (error) {`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      sszvis.loadError(error);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`      return;`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    }`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`    actions.prepareState(data);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  });`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// ... this d3 v5 code snippet`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`d3.csv("http://example.com", parseRow)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .then(actions.prepareState)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .catch(sszvis.loadError);`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:` `}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`// The same is true for d3.json`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`d3.json("http://example.com", parseRow)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .then(actions.prepareState)`})}),`
`,(0,r.jsx)(t.span,{"data-line":``,children:(0,r.jsx)(t.span,{children:`  .catch(sszvis.loadError);`})})]})})}),`
`,(0,r.jsxs)(t.h2,{id:`210-feb-2020`,children:[`2.1.0 (Feb 2020)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#210-feb-2020`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`Changed `,(0,r.jsx)(t.code,{children:`formatNumber`}),` to remove insignificant trailing zeros`]}),`
`,(0,r.jsxs)(t.li,{children:[`Changed `,(0,r.jsx)(t.code,{children:`sszvis.move`}),` to also invert point scales`]}),`
`,(0,r.jsxs)(t.li,{children:[`Added new module `,(0,r.jsx)(t.code,{children:`sszvis/measure`}),` with utilities to measure elements`,`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[`Added new function `,(0,r.jsx)(t.code,{children:`measureText`}),` to calculate the width of a string`]}),`
`,(0,r.jsxs)(t.li,{children:[`Added new function `,(0,r.jsx)(t.code,{children:`measureAxisLabel`}),` as a preset of `,(0,r.jsx)(t.code,{children:`measureText`})]}),`
`,(0,r.jsxs)(t.li,{children:[`Added new function `,(0,r.jsx)(t.code,{children:`measureLegendLabel`}),` as a preset of `,(0,r.jsx)(t.code,{children:`measureText`})]}),`
`]}),`
`]}),`
`,(0,r.jsxs)(t.li,{children:[`Added new layout `,(0,r.jsx)(t.code,{children:`colorLegendLayout`}),` to compute color legend sizes automatically`]}),`
`,(0,r.jsxs)(t.li,{children:[`Added new helper function `,(0,r.jsx)(t.code,{children:`foldPattern`})]}),`
`,(0,r.jsx)(t.li,{children:`Fixed cut-off of color legend circle`}),`
`,(0,r.jsxs)(t.li,{children:[`Simplified documentation and removed redundant examples`,`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsx)(t.li,{children:`Generalized some chart examples to include more defaults`}),`
`,(0,r.jsx)(t.li,{children:`Removed distinction between single- and multi-line chart`}),`
`]}),`
`]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`20-dec-2017`,children:[`2.0 (Dec 2017)`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#20-dec-2017`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.h3,{id:`upgrade-from-1x-to-20`,children:[`Upgrade from 1.x to 2.0`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#upgrade-from-1x-to-20`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsx)(t.p,{children:`The sszvis API has changed significantly from version 1.x to 2.0. This was done to a) align more closely with practices in the d3 ecosystem and to be able to leverage ES modules better (by not exporting whole namespaces but each function separately).`}),`
`,(0,r.jsxs)(t.p,{children:[`sszvis now depends on d3 v4. See `,(0,r.jsx)(t.a,{href:`https://github.com/d3/d3/blob/master/CHANGES.md#changes-in-d3-40`,children:`d3 v4's change log`}),` for details on d3's API changes.`]}),`
`,(0,r.jsxs)(t.h3,{id:`internals`,children:[`Internals`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#internals`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis_namespace`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`replaced by ES modules`})]}),`
`,(0,r.jsx)(t.li,{children:`No more setting of default locale, instead locale and localized formatting and parsing functions are exported`}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`d3-extensions`,children:[`D3 extensions`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#d3-extensions`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`d3.component`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.component`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`functional-utilities`,children:[`Functional utilities`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#functional-utilities`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.identity`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.identity`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isString`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isString`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isSelection`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isSelection`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.arity`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.arity`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.compose`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.compose`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.contains`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.contains`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.defined`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.defined`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.derivedSet`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.derivedSet`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.every`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.every`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.filledArray`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.filledArray`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.find`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.find`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.first`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.first`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.flatten`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.flatten`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.firstTouch`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.firstTouch`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.hashableSet`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.hashableSet`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isFunction`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isFunction`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isNull`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isNull`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isNumber`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isNumber`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.isObject`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.isObject`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.last`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.last`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.measureDimensions`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.measureDimensions`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.not`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.not`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.prop`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.prop`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.propOr`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.propOr`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.set`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.set`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.some`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.some`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.stringEqual`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stringEqual`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.fn.functor`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.functor`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`parsers`,children:[`Parsers`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#parsers`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.parse.date`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.parseDate`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.parse.year`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.parseYear`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.parse.number`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.parseNumber`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`formatters`,children:[`Formatters`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#formatters`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.age`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatAge`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.axisTimeFormat`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatAxisTimeFormat`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.month`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatMonth`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.year`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatYear`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.none`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatNone`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.number`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatNumber`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.preciseNumber`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatPreciseNumber`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.percent`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatPercent`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.fractionPercent`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatFractionPercent`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.format.text`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.formatText`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`components`,children:[`Components`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#components`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.bar`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.bar`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.dot`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.dot`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.groupedBars`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.groupedBars`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.line`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.line`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.pie`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.pie`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.pyramid`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.pyramid`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.sankey`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sankey`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedArea`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedArea`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedAreaMultiples`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedAreaMultiples`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedBar.horizontal`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedBarHorizontal`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedBar.horizontalStackedBarData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedBarHorizontalData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedBar.vertical`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedBarVertical`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedBar.verticalStackedBarData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedBarVerticalData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedPyramid`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedPyramid`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.stackedPyramid.stackedPyramidData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.stackedPyramidData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.component.sunburst`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sunburst`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`aspect-ratio`,children:[`Aspect ratio`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#aspect-ratio`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.auto`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatioAuto`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.portrait`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatioPortrait`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.square`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatioSquare`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.ar4to3`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatio4to3`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.ar16to10`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatio16to10`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.aspectRatio.ar12to5`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.aspectRatio12to5`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`behaviors`,children:[`Behaviors`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#behaviors`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.behavior.move`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.move`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.behavior.panning`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.panning`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.behavior.voronoi`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.voronoi`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`color-scales`,children:[`Color scales`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#color-scales`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.qual12`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleQual12`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.qual6`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleQual6`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.qual6a`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleQual6a`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.qual6b`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleQual6b`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.seqBlu`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleSeqBlu`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.seqRed`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleSeqRed`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.seqGrn`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleSeqGrn`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.seqBrn`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleSeqBrn`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.divVal`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDivVal`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.divValGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDivValGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.divNtr`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDivNtr`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.divNtrGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDivNtrGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.lightGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleLightGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.paleGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scalePaleGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.gry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.dimGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDimGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.medGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleMedGry`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.deepGry`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.scaleDeepGry`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`color-helpers`,children:[`Color helpers`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#color-helpers`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.slightlyDarker`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.slightlyDarker`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.muchDarker`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.muchDarker`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.color.withAlpha`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.withAlpha`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`axes`,children:[`Axes`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#axes`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.axis.x`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.axisX`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.axis.y`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.axisY`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`svg-utils`,children:[`SVG Utils`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#svg-utils`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.crisp.halfPixel`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.halfPixel`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.crisp.roundTransformString`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.roundTransformString`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.crisp.transformTranslateSubpixelShift`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.transformTranslateSubpixelShift`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.modularText.svg`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.modularTextSVG`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.modularText.html`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.modularTextHTML`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.ensureDefsElement`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.ensureDefsElement`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.textWrap`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.textWrap`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.svgUtils.translateString`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.translateString`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`viewport`,children:[`Viewport`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#viewport`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.viewport`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`no change`})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`legends`,children:[`Legends`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#legends`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.legend.binnedColorScale`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.legendColorBinned`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.legend.linearColorScale`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.legendColorLinear`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.legend.ordinalColorScale`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.legendColorOrdinal`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.legend.radius`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.legendRadius`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`layout`,children:[`Layout`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#layout`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.heatTableDimensions`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.dimensionsHeatTable`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.horizontalBarChartDimensions`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.dimensionsHorizontalBarChart`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.verticalBarChartDimensions`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.dimensionsVerticalBarChart`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.populationPyramidLayout`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.layoutPopulationPyramid`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.smallMultiples`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.layoutSmallMultiples`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.stackedAreaMultiples`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.layoutStackedAreaMultiples`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.sankey.prepareData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sankeyPrepareData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.sankey.computeLayout`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sankeyLayout`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.sunburst.prepareData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sunburstPrepareData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.sunburst.computeLayout`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sunburstLayout`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.layout.sunburst.getRadiusExtent`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.sunburstGetRadiusExtent`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`patterns`,children:[`Patterns`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#patterns`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.heatTableMissingValuePattern`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.heatTableMissingValuePattern`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.mapMissingValuePattern`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapMissingValuePattern`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.mapLakePattern`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapLakePattern`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.mapLakeFadeGradient`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapLakeFadeGradient`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.mapLakeGradientMask`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapLakeGradientMask`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.patterns.dataAreaPattern`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.dataAreaPattern`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h3,{id:`maps`,children:[`Maps`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#maps`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`Hard-coded map modules have been removed in favor of `,(0,r.jsx)(t.a,{href:`/map-standard#preparing-geodata`,children:`loading geodata from GeoJSON or TopoJSON files`}),`.`]}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.STADT_KREISE_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.STADT_KREISE_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.STATISTISCHE_QUARTIERE_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.STATISTISCHE_QUARTIERE_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.STATISTISCHE_ZONEN_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.STATISTISCHE_ZONEN_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.WAHL_KREISE_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.WAHL_KREISE_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.AGGLOMERATION_2012_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.AGGLOMERATION_2012_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.constants.SWITZERLAND_KEY`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.SWITZERLAND_KEY`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.GEO_KEY_DEFAULT`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.GEO_KEY_DEFAULT`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.swissMapProjection`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.swissMapProjection`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.swissMapPath`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.swissMapPath`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.pixelsFromDistance`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.pixelsFromGeoDistance`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.prepareMergedData`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.prepareMergedGeoData`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.getGeoJsonCenter`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.getGeoJsonCenter`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.utils.widthAdaptiveMapPathStroke`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.widthAdaptiveMapPathStroke`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.anchoredCircles`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererBubble`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.base`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererBase`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.geojson`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererGeoJson`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.highlight`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererHighlight`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.image`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererImage`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.mesh`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererMesh`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.patternedlakeoverlay`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererPatternedLakeOverlay`})})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.renderer.raster`}),` ⟼ `,(0,r.jsx)(t.strong,{children:(0,r.jsx)(t.code,{children:`sszvis.mapRendererRaster`})})]}),`
`]}),`
`,(0,r.jsxs)(t.h2,{id:`map-projections`,children:[`Map projections`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#map-projections`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsx)(t.p,{children:`These were related to the map modules and aren't needed anymore.`}),`
`,(0,r.jsxs)(t.ul,{children:[`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.zurichStadtKreise`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.zurichStatistischeQuartiere`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.zurichWahlKreise`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.zurichStatistischeZonen`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.zurichAgglomeration2012`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`,(0,r.jsxs)(t.li,{children:[(0,r.jsx)(t.code,{children:`sszvis.map.projection.switzerland`}),` ⟼ `,(0,r.jsx)(t.strong,{children:`removed`})]}),`
`]})]})}function a(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(i,{...e})}):i(e)}var o={toc:[]};function s(e){let t={a:`a`,code:`code`,h1:`h1`,p:`p`,span:`span`,...n(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.h1,{id:`changelog`,children:[`Changelog`,(0,r.jsx)(t.a,{className:`subheading-anchor`,"aria-label":`Link to section`,href:`#changelog`,children:(0,r.jsx)(t.span,{className:`icon icon-link`})})]}),`
`,(0,r.jsxs)(t.p,{children:[`Every published release of `,(0,r.jsx)(t.code,{children:`sszvis`}),`, newest first. Releases are versioned with `,(0,r.jsx)(t.a,{href:`https://semver.org`,children:`semver`}),`: a patch fixes, a minor adds, a major can break existing chart code.`]}),`
`,(0,r.jsx)(a,{})]})}var c=e(function(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(s,{...e})}):s(e)});export{c as default,o as handle};