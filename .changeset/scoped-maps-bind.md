---
"sszvis": patch
---

`sszvis.choropleth` binds its event handlers only to its own areas and anchored shape, so a geojson overlay drawn into the same layer keeps its handlers whichever component is called last
