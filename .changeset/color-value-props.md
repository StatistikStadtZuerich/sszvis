---
"sszvis": patch
---

accept the library's own colour scales wherever a component takes a colour, so `.fill((d) => cScale(cAcc(d)))` typechecks

`fill`, `stroke`, `color`, `colorScale`, `nodeColor` and `linkColor` now take the `LabColor` that `sszvis.scaleQual12()` and friends return as well as a CSS colour string, across components, annotations, map renderers and the colour legends. `sszvis.slightlyDarker`, `sszvis.muchDarker` and `sszvis.withAlpha` accept and return the same. `sszvis.mapRendererGeoJson`'s event handlers are typed with the component's own datum, as the choropleth and bubble renderers' already were.
