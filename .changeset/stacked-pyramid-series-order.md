---
"sszvis": patch
---

keep `sszvis.stackedPyramidLayout()`'s and `sszvis.stackedPyramidData()`'s stacking order as the series accessor returned it. The keys were read back off the cascade's plain rows, which enumerate integer-like keys numerically, so a series accessor returning years or numeric codes silently restacked the chart — and with it which series sits on the baseline. `stackedBarData()` was fixed this way already
