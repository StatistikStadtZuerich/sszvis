---
"sszvis": patch
---

type label and tick formatters against the values they actually receive, not against `string`

`sszvis.formatNumber` can be passed to `legendColorLinear().labelFormat()` and `sszvis.formatPreciseNumber(1)` to `legendRadius().tickFormat()` without a wrapper, and a linear colour legend whose `labelText` holds words rather than numbers names that type as `sszvis.legendColorLinear<string>()`. `sszvis.annotationRangeRuler().label()` may return a number: the ruler pipes it through `formatNumber`, so a pre-stringified value could not be formatted and rendered as a dash.
