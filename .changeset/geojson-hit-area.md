---
"sszvis": patch
---

`mapRendererGeoJson` shapes are now a hit area when an `over`, `out` or `click` handler is registered on the component. The elements were marked `data-event-target` and the component bound mouse handlers to them, but `.sszvis-map__geojsonelement` carried `pointer-events: none` in `sszvis.css`, so none of those handlers could ever fire. `pointer-events` is now written inline and conditionally, matching `mapRendererBubble`: with no handler registered the shapes stay inert, as before.
