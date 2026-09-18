---
"sszvis": patch
---

report a null `mapPath` by name in `sszvis.mapRendererBubble()` and `sszvis.mapRendererPatternedLakeOverlay()`. An explicit `null` slipped past the required-property check and failed one line later reading a property of `null` — the anonymous mid-render failure those checks exist to replace
