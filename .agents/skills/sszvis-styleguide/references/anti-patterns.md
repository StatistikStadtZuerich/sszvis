# Anti-patterns in sszvis chart code

Every item is real code, either in `apps/new-docs/examples/` or in
`.reference/d3charts-website` (~1095 production charts). Counts are measured, not
estimated. Cited so you can check the claim before acting on it.

## Contents

- Structural — state, lifecycle, architecture
- Typing
- Correctness bugs
- Duplication and drift
- Accessibility and fallback
- Reading production code

## Structural

### Resize listener registered inside `render()`

`sszvis.viewport.on("resize", actions.resize)` as the last line of `render()`:
**47 of 48** hand-rolled examples, and **1047 of 1086** production charts. It is
re-subscribed on every state change. The viewport module dedupes, so it is not an
actual leak — but it reads as one, and it means the `move()` / `panning()`
behaviour objects are rebuilt and re-`call`ed per render too.

`sszvis.app()` re-renders on resize itself, so under `app()` you never write this
line. The one hand-rolled example that gets it right registers once at module
scope: `bar-chart-vertical-nested/confidence/chart.ts:113`.

### `function render(state)` shadowing module-level `state`

45 of 53 examples. It produces every `no-shadow` warning in the corpus (46 of 50;
the rest are `d` and `m`). Two files avoid it by dropping the parameter and
closing over module state instead (`bar-chart-vertical/basic/chart.ts:69`).

Under `app()` the `state` parameter _is_ the state — frozen, drafted, correct —
and there is nothing at module scope to shadow.

### Hardcoded target selector

`"#sszvis-chart"` appears 68 times; `config.id` 37 times. Sixteen files use the
literal and zero `config.id`: all seven `map-extended/*`, four `map-standard/*`,
both `map-signature/*`, and three `line-chart/*`. No file mixes the two, so this
is a per-file habit, not a slip.

An example that hardcodes its selector cannot be embedded twice on one page and
ignores the `config` contract the page injects.

### Shadowing the injected `config` global

`line-chart/confidence/chart.ts:7-20` declares a local `config` literal with 13
chart-specific keys (`percentage`, `yExtentOverride`, `xColumn`,
`targetElement`, …) while its `example.json` carries an empty `config`. None of
those keys are in `globals.d.ts`, so the file can never typecheck, and it never
reads the real `config.data`. Same file is the only one with an IIFE wrapper, the
only `"use strict"`, and uses the old block-comment banner style.

This is the single least salvageable example in the corpus. Rewrite rather than
patch.

### The params-object indirection production actually uses

Production charts never hardcode a data path. The HTML defines
`var grafikNParams = { data, title, description, fallback, id }` and the JS maps
CSV column names in a `config` block. `example.json` + the injected `config`
global is the docs equivalent, and examples should model it faithfully — it is
the real integration contract with the CMS.

## Typing

### `.ts` files that are untyped JavaScript

**52 of 53** examples carry zero type annotations. Only
`bar-chart-vertical/basic/chart.ts` declares any type at all. They were bulk
renamed from `.js`; 46 still carry the `/* global … */` pragma that proves it.

The pragma has five spellings including one malformed (`/* global d3 sszvis */`,
missing comma, `line-chart/confidence/chart.ts:1`), and 23 files reference
`config` without listing it — the header is decorative and unenforced. Delete it;
`globals.d.ts` does this job properly.

### `sszvis.compose` in code that should typecheck

`fn.ts:81` types it `(...fns: ((...args: any[]) => any)[]) => (...args: any[]) => any`,
with a comment explaining that proper typing would need fixed-arity overloads. It
appears **199 times across 48 files**, erasing types at every accessor site.

It is fine in untyped production code and idiomatic there (2880 uses). In a typed
example, write the arrow: `(d: Datum) => yScale(yAcc(d))`.

### Casts standing in for library fixes

The corpus has exactly two `as` casts, both in the one typed file, both papering
over a library gap: `d["Sektor"] as string` (defect 1) and
`d3.max(state.data, yAcc) as number`. The second is legitimate d3 narrowing; the
first should be `?? ""`.

Zero `: any`, `@ts-ignore`, `@ts-expect-error` anywhere. Preserve that.

### `sszvis.set(data)` without an accessor

`fn.ts:369` — `U` cannot be inferred from the arguments alone, so the result is
`unknown[]`. Always pass the accessor: `sszvis.set(data, cAcc)`.

### `cascade().apply()` without its type argument

`cascade.ts:82-99` — `apply<R>(data)` exists precisely so callers can name the
result shape. Write `sszvis.cascade<Datum>().arrayBy(cAcc).apply<Datum[][]>(data)`
rather than casting afterwards. Note `arrayBy`'s sorter always receives `string`,
because keys are stringified (`cascade.ts:101-111`) — sort on strings, never on
the original key type.

## Correctness bugs

### A predicate that returns a function

`line-chart/basic/chart.ts` defines `isSelected(state)` returning
`(d) => …`, then passes the _uncalled_ helper:
`.highlightTick(isSelected)`. `axis.ts:105` declares
`highlightTick?: (d: AxisDomain) => boolean` and `axis.ts:440` uses the result as
a boolean — a returned closure is always truthy, so **every tick renders
`.active`**. Should be `.highlightTick(isSelected(state))`.

Worth a deliberate check whenever a helper is curried by state, because the type
error this produces is easy to dismiss as one of the known library defects.

### `return true` as a loading guard

`if (state.data === null || state.mapData === null) { return true; }` — copied
verbatim into every two-load map example and into production
(`VER213V2133.js:267`). The `true` is meaningless; `render` returns nothing. It
also means there is no loading state and no error UI beyond `sszvis.loadError`.

### Loose equality on state

~2147 `==` comparisons in production, including state filtering
(`fAcc(d) == state.selectedFilter`). It works only because CSV values are strings.
Use `===` and parse deliberately.

### Hand-rolled components instead of the component factory

27 production files define d3 closure components by hand with manual
`chart.x = function (_) { if (!arguments.length) return x; … }` getters — one is a
~180-line box-plot component. `sszvis.component()` is used **zero** times in the
whole production corpus, which says the "how to extend the library" recipe is
missing from the docs, not that people prefer the manual way.

## Duplication and drift

### Near-identical example folders

`map-extended/rastermap-bins-100m/chart.ts` and `rastermap-bins-200m/chart.ts`
differ by **one character** across 236 lines (line 188: `100,` vs `200,`). If two
examples differ only by a constant, they are one example.

### Helpers reimplemented per file

`isSelected` 22 times. `closestDatum` 8 times, once with a drifted parameter
name. `isWithinBarContour` twice with **different arities** —
`(xValue, category)` versus `(binnedData, xCenter, xRelToPx, lengthScale)`.

In production this is worse: `labelWrapWidth` is defined in 112 files and
referenced in none of 18 of them; `handleMissingVal` in 16.

Examples are meant to be standalone and copy-pasteable, so some repetition is
correct. Repetition that has _drifted_ is not — the same name should mean the
same thing everywhere.

### Comment drift

The `BIN_EDGES` warning exists in two rewordings of identical content — lowercase
and unpunctuated in `heat-table/ht-binned-linear/chart.ts:5-9`, sentence-cased in
`heat-table/ht-wermitwem/chart.ts:6-10`. The `d.datum` map explainer is duplicated
verbatim in two files and pointed at by URL from two others.

### Stale cross-references

Those URL pointers say "see the comment by the tooltip in
docs/map-standard/kreis.html" — **that path no longer exists in this tree**.
Others point at `rastermap-bins.html`. Reference a concept or an example id, not
a file path.

### Dead code, in production

~1875 commented-out lines, 629 commented-out `console.log`s, and **119 live
`console.log` calls still shipping**. The examples corpus is clean on this axis —
zero TODOs, zero commented-out code — and should stay that way.

### Magic numbers

`var t = 80; var b = 140;` for bounds padding, `.dyTitle(-20)`,
`.paddingOuter(0.7)`, `"top", 10 - bounds.padding.top + "px"` for control
positioning. `MAX_WIDTH` / `MAX_CONTROL_WIDTH` are at least named (573 and 541
files) but their values vary arbitrarily between sibling charts.

Name the constant and say what it is for. `MAX_WIDTH = 800` with no comment is
only marginally better than `800`.

## Accessibility and fallback

The biggest real-world gap, and the one examples are best placed to close.

`createSvgLayer` writes `<title>`, `<desc>` and
`aria-label="{title} – {description}"`. Production passes empty strings in
**816 of 817** call sites. Where it does forward a title, the HTML value is
literally `title: "Title"` (664 files), `"sdf"` (80), or `""` (190); descriptions
are `"description"` (674) or `"af"` (80). **Every production chart ships
`aria-label=" – "`.** There are zero real `aria*` attributes in the corpus.

Fallback is configured and then ignored: `fallback: "fallback.png"` is passed in
687 HTML files, but `fallbackRender(config.targetElement)` is called _without_ the
`{src}` option in 661 of 664 cases, so `config.fallback` is dead config and the
library default is silently used.

In the examples: only 4 of 53 reference a fallback at all, though `config.fallback`
is declared for every one of them.

Since `AGENTS.md` lists "Accessible" as a project principle and examples are what
people copy, an example with a real title, a real description and a wired fallback
is doing more good than one more chart type.

## Reading production code

`.reference/d3charts-website` is the ground truth for how sszvis is really used,
but read it with two caveats:

**Two API generations coexist.** 658 charts are on 3.4.0 with the flat API; **369
are still on 1.0.0** with the namespaced `sszvis.fn.*` / `sszvis.axis.x` /
`sszvis.color.qual12` API. 377 files use `sszvis.fn.*`, 718 use `sszvis.prop(`,
and only 4 mix. Roughly a third of what looks like current practice is a
generation behind.

**It is deliberately ES5.** IIFE wrappers, `"use strict"`, `var` — only 74 of
1095 files use `const`/`let` at top level. Examples are modern TypeScript; do not
import the ES5 habits along with the patterns.

What production genuinely gets right and examples should keep: the fallback guard
running first, `.catch(sszvis.loadError)` everywhere, `selectGroup(…).call(component)`
rather than manual `append`, the seven section banners, and `panning()` for
discrete marks versus `move()` for continuous ones (344 and 385 charts
respectively; only 25 use both).
