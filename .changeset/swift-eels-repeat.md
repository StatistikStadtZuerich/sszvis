---
"sszvis": patch
---

fix the inverted `darker()` and `brighter()` methods on qualitative colour scales: `darker()` returned brighter colours and `brighter()` returned darker ones. Both now also shift the fallback colour a key outside the domain gets, so `sszvis.scaleQual12().darker()(key)` darkens on a scale given no domain. Charts that highlight a hovered mark with `scale.darker()` now draw a genuinely darker highlight
