---
"sszvis": patch
---

`mapRendererPatternedLakeOverlay` now writes the lake border's stroke, width and dash pattern inline, defaulting to the grey dotted line `sszvis.css` used to supply. A consumer not shipping the stylesheet previously saw no lake borders at all, since SVG's initial stroke is `none`. An explicitly falsy `lakePathColor` still clears the stroke, which now means no border rather than a fallback to the stylesheet.
