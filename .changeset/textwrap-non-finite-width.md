---
"sszvis": patch
---

`textWrap` now skips wrapping and warns when `width` is not a finite number, instead of writing `x="NaN"` or `x="-Infinity"` onto every line. Reachable through `axis().textWrap()`, which screens its prop with `fn.defined` — that excludes `NaN` but not `±Infinity`. A `y` attribute that is legal SVG but not a number, such as `1em`, is now treated as absent rather than producing `y="NaN"`.
