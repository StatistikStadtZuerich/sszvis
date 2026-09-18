---
"sszvis": patch
---

`mapRendererGeoJson` shapes are now a hit area when an `over`, `out` or `click` handler is registered on the component. The elements were marked `data-event-target` and the component bound mouse handlers to them, but `.sszvis-map__geojsonelement` carried `pointer-events: none` in `sszvis.css`, so none of those handlers could ever fire. `pointer-events` is now written inline and conditionally, matching `mapRendererBubble`.

With no handler registered the shapes stay inert, exactly as before. With one registered they become a target, which means the overlay now shadows the layer beneath it over its own shapes — so a chart that drives tooltips from a choropleth base layer _and_ registers handlers on a geojson overlay on top will see the overlay win there. That is the intended semantics, and it matches how `mapRendererBubble` already behaves.
