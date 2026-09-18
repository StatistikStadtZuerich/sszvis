---
"sszvis": patch
---

centre a `sszvis.stackedPyramid()` reference outline on the bars it describes: it was drawn from `barPosition` alone, a bar's top edge, so it ran half a bar height above its values — an error that grows with `barHeight`. Matches `sszvis.pyramid()`
