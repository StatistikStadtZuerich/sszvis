---
"sszvis": patch
---

remove a `sszvis.stackedPyramid()` reference path when its series goes away, instead of leaving a classed path element behind with no `d` attribute where CSS rules, hit tests and snapshots can still find it, matching `sszvis.pyramid()`
