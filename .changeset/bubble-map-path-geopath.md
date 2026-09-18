---
"sszvis": patch
---

check up front that `sszvis.mapRendererBubble()`'s `mapPath` is a real d3 `geoPath`, since the anchor positions are read through `mapPath.projection()`. A bare path function used to fail from inside the transform callback, after every circle had already been created, sorted and styled
