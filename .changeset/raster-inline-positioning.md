---
"sszvis": patch
---

write `sszvis.mapRendererRaster()`'s `position`, `display` and `pointer-events` as inline styles, so the canvas aligns over the map and lets the layers beneath it be hovered without sszvis.css. It was the one HTML-layer renderer still depending on the stylesheet for its alignment; `mapRendererImage()` writes the same three
