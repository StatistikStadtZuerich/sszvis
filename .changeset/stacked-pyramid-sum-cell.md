---
"sszvis": patch
---

sum every row `sszvis.stackedPyramidLayout()`'s and `sszvis.stackedPyramidData()`'s accessors place in one (side, row, series) cell, instead of reading only the first. Data that was not already aggregated to one row per triplet was silently understated — no warning, no error, just a shorter bar. `stackedBarData()` was fixed this way already
