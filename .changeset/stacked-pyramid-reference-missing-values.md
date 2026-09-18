---
"sszvis": patch
---

skip a non-finite point in a `sszvis.stackedPyramid()` reference series instead of writing `NaN` into the path: a gap now breaks the outline at the gap rather than truncating everything after it, matching both `sszvis.pyramid()` and the missing-value guard the bars already had
