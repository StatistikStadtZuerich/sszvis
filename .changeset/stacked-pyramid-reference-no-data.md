---
"sszvis": patch
---

let a `sszvis.stackedPyramid()` reference accessor return no data: `leftRefAccessor` and `rightRefAccessor` returning `undefined` or `null` now draw no reference line and warn, rather than throwing mid-render, matching `sszvis.pyramid()`
