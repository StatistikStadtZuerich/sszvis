---
"sszvis": patch
---

stop writing a `<title>` element into the chart's SVG, where the browser drew a native tooltip over the whole chart

The tooltip covered the chart's own hover interactions and added nothing for assistive technology: the layer is already `role="img"` with an `aria-label`, which is what a screen reader reads. The description is still written to `<desc>`.
