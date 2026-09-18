---
"sszvis": patch
---

give `sszvis.sunburst()` arcs their `d` on the render tick rather than only through the `attrTween`, so a sunburst serialised straight after rendering — or rendered in a hidden tab, where `requestAnimationFrame` never fires — is no longer geometrically empty
