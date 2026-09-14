---
"sszvis": patch
---

accept missing values in `sszvis.parseNumber`, `sszvis.parseDate` and `sszvis.parseYear`, so a `d3.csv` row whose cells are `string | undefined` typechecks

`sszvis.parseNumber(d["Anzahl"])` no longer needs a non-null assertion; a missing cell still parses to `NaN` or `null`, as before.
