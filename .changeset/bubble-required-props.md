---
"sszvis": patch
---

report `sszvis.mapRendererBubble()`'s missing required properties by name — `mergedData`, `radius` and `fill` — before anything is drawn, instead of an anonymous `TypeError` raised partway through the render, as `mapRendererMesh()` and `mapRendererRaster()` already do
