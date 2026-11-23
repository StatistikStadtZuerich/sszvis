---
"sszvis": patch
---

`sszvis.move()` accepts a linear scale only for a numeric domain, so a chart that declares a `Date` or `string` domain and passes a linear scale is now a type error instead of a handler that receives numbers typed as dates or strings
