---
"sszvis": patch
---

let `sszvis.groupedBarsVertical()` and `groupedBarsHorizontal()` take a constant for `x` and `y`, as `width` and `height` already did

A horizontal grouped bar chart anchors its bars at `x(0)`, which the runtime always allowed but the types rejected.
