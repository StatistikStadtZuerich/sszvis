---
"sszvis": patch
---

fix the inverted `darker()` and `brighter()` methods on qualitative colour scales: `darker()` returned brighter colours and `brighter()` returned darker ones. Charts that highlight a hovered mark with `scale.darker()` now draw a genuinely darker highlight
