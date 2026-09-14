---
"sszvis": patch
---

type the result of `sszvis.responsiveProps()` from the `.prop()` calls that built it

`props.barPadding` now has the type its spec declares instead of `unknown`. A measurement whose width may be missing is accepted too, so `queryProps(sszvis.measureDimensions(config.id))` typechecks, and a query made with unmeasurable dimensions returns the configured `_` fallbacks instead of an object of junk keys.
