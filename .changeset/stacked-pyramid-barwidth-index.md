---
"sszvis": patch
---

`stackedPyramid` now forwards d3's index to `barWidth`. An index-aware accessor previously saw `undefined` for `i`, so it returned `NaN` and `bar`'s missing-value guard collapsed every bar's width and x to `0`.
