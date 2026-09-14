---
"sszvis": patch
---

type the handlers of `sszvis.move().on(…)` against the component's own scales

A handler written as `(event, x: number | null, y: string | null) => void` now typechecks for `sszvis.move<number, string>()` instead of being rejected, and `end` handlers receive only the event, matching what the behavior dispatches. `sszvis.panning().on(…)` accepts handlers again for `start`, `pan` and `end`.
