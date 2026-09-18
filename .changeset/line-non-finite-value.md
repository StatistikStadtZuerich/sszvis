---
"sszvis": patch
---

`line` now treats a non-finite value as missing, as it already treated `NaN`. `Infinity` — what a scale over a zero-width domain returns — passed the guard and reached the `d` attribute, where the browser dropped that segment and every one after it, so the line was truncated rather than broken.
