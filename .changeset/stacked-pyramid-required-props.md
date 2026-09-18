---
"sszvis": patch
---

`stackedPyramid` now reports an unset `barHeight`, `barWidth`, `barPosition`, `leftAccessor` or `rightAccessor` by name before it renders. Previously each failed differently: `barHeight` reached `bar`'s missing-value guard as `undefined` and drew a chart of zero-height bars with a clean console.
