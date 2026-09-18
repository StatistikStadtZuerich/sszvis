---
"sszvis": patch
---

write the presentation the SVG map renderers depend on as inline styles instead of leaving it to sszvis.css. `mapRendererMesh()`, `mapRendererHighlight()` and the lake overlay's border path now set `fill: none` and `pointer-events: none`; the textured lake shape keeps its pattern `fill` attribute and gains only `pointer-events: none`. Without the stylesheet, SVG's initial black fill turned each outline into a shape covering the map, and all of them swallowed the base layer's hover and click events
