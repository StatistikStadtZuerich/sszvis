---
"sszvis": patch
---

give an entering `sszvis.stackedArea()` path its geometry, colours and stroke width on the render tick rather than only through the transition, so a chart measured or serialised before the first animation frame is no longer blank — as a consequence an entering area appears complete instead of growing its hairline up from 0, and a colour reaches the DOM as it was given rather than rewritten as `rgb()`
