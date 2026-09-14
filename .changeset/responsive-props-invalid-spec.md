---
"sszvis": patch
---

keep a prop in the result of `sszvis.responsiveProps()` when its spec is invalid, so a mistyped breakpoint name warns and falls back to `_` instead of throwing at the point of use
