---
"sszvis": patch
---

`textWrap` now skips wrapping and warns when `width` is not a finite number, instead of writing `x="NaN"` or `x="-Infinity"` onto every line. Reachable through `axis().textWrap()`, which screens its prop with `fn.defined` — that excludes `NaN` but not `±Infinity`. A `y` attribute in non-numeric units, such as the legal `1em` or `50%`, is now copied to the wrapped lines verbatim rather than coerced to `y="NaN"`.
