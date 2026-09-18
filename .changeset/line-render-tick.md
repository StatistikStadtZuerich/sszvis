---
"sszvis": patch
---

give an entering `sszvis.line()` path its `d` and stroke width on the render tick rather than only through the transition, so a line measured before the first animation frame — with `getTotalLength`, a bounding box or a synchronous screenshot — is no longer empty. An entering line's stroke width is therefore drawn at its final value instead of animating up from whatever the stylesheet set, matching how an entering line's geometry already behaved
