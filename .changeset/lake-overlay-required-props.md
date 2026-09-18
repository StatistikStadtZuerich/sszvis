---
"sszvis": patch
---

stop `sszvis.mapRendererPatternedLakeOverlay()` leaving a geometry-less border path behind: an unset `lakeBounds` now draws no border path at all — and removes one drawn earlier — instead of binding `undefined` and producing a classed path with no `d` that CSS rules and hit tests could still find.

`mapPath` is now required whenever there is a lake to draw, and a missing or null one throws a `TypeError` naming it. This is a new failure mode: a chart that set `lakeFeature` without a `mapPath` previously rendered two classed, styled paths with no geometry. Asking for "no lake" still needs neither property. `mapRendererMesh()` was given the same treatment in an earlier release.
