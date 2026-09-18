---
"sszvis": patch
---

`stackedPyramid` now forwards d3's index to `barPosition` and `barFill`. `barPosition` was composed with the row accessor, and `fn.compose` passes arguments only to the innermost function; `barFill` went through a one-parameter wrapper. An index-aware `barPosition` collapsed every bar onto one row, and an index-aware `barFill` looked up `undefined`.
