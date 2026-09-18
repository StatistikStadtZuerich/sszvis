---
"sszvis": patch
---

draw an empty `sszvis.mapRendererRaster()` canvas when the layer has no data bound, instead of throwing "data is not iterable" after the canvas has already been created. `createHtmlLayer` binds `0` when the caller binds none, which is the state every chart is in before its data load
