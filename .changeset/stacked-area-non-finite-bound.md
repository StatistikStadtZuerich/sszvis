---
"sszvis": patch
---

`stackedArea` and `stackedAreaMultiples` now treat a non-finite bound as missing, matching `line`. `Infinity` passed the guard and reached the `d` attribute, truncating the shape at that point rather than breaking it.
