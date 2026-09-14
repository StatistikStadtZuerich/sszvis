---
"sszvis": patch
---

accept missing values in `sszvis.parseNumber`, `sszvis.parseDate` and `sszvis.parseYear`, so a `d3.csv` row whose cells are `string | undefined` typechecks
