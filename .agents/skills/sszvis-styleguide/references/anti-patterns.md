# Anti-patterns in sszvis chart examples

The reasoning behind the rules in SKILL.md. Every item was real code in
`apps/new-docs/examples/` at some point; the corpus is clean of all of them
today, which is the state to preserve. For how the production corpus at
`.reference/d3charts-website` differs, read `production-corpus.md`.

## Contents

- Structural — state, lifecycle, wiring
- Typing
- Correctness bugs
- Duplication and drift
- Accessibility and fallback

## Structural

### Resize listener registered inside `render()`

`sszvis.viewport.on("resize", actions.resize)` as the last line of `render()`
re-subscribes on every state change. The viewport module dedupes, so it is not
an actual leak — but it reads as one, and it means the `move()` / `panning()`
behaviour objects are rebuilt and re-`call`ed per render too.

`sszvis.app()` re-renders on resize itself, so under `app()` you never write
this line. If a chart genuinely needs its own listener, register it once at
module scope, never inside `render`.

### `function render(state)` shadowing a module-level `state`

The legacy hand-rolled pattern kept `state` at module scope and passed it into a
`render` function, shadowing it. Under `app()` the `state` parameter _is_ the
state — frozen, drafted, correct — and there is nothing at module scope to
shadow. Keep it that way: no module-level mutable state.

### Hardcoded target selector

`"#sszvis-chart"` written into the chart instead of `config.id`. Such an example
cannot be embedded twice on one page and ignores the `config` contract the page
injects.

### Shadowing the injected `config` global

Declaring a local `config` object literal with chart-specific keys shadows the
injected global, so the example never reads the real `config.data` and its keys
are not in `globals.d.ts`, meaning it can never typecheck. If a chart needs
extra constants, name them under `// Magic Numbers`.

### The integration contract examples model

Production charts never hardcode a data path. The HTML defines
`var grafikNParams = { data, title, description, fallback, id }` and the JS maps
CSV column names in a `config` block. `example.json` plus the injected `config`
global is the docs equivalent, and examples should model it faithfully — it is
the real integration contract with the CMS.

## Typing

### `sszvis.compose` in code that should typecheck

`fn.ts:81` types it
`(...fns: ((...args: any[]) => any)[]) => (...args: any[]) => any`, with a
comment explaining that proper typing would need fixed-arity overloads. It
erases types at every accessor site it touches.

It is idiomatic in untyped production code. In a typed example, write the arrow:
`(d: Datum) => yScale(yAcc(d))`.

### Casts standing in for a type argument

The commonest cause of a cast in an example is a component left at its
`unknown` default. The error looks like a library gap and is not:

```
Type '(d: Datum) => boolean' is not assignable to type '(d: unknown) => boolean'.
```

`sszvis.tooltip()` leaves `T` as `unknown`. Name the datum instead of casting:
`sszvis.tooltip<Datum>()`, `sszvis.bar<Datum>()`, `sszvis.move<number, string>()`,
`sszvis.panning<Datum>()`. Whenever you see an `unknown`-vs-datum mismatch on a
component prop, reach for the type argument before assuming the library is at
fault.

### `sszvis.set(data)` without an accessor

`fn.ts:369` — `U` cannot be inferred from the arguments alone, so the result is
`unknown[]`. Always pass the accessor: `sszvis.set(data, cAcc)`.

### `cascade().apply()` without its type argument

`cascade.ts:82-99` — `apply<R>(data)` exists precisely so callers can name the
result shape. Write `sszvis.cascade<Datum>().arrayBy(cAcc).apply<Datum[][]>(data)`
rather than casting afterwards. Note that `arrayBy`'s sorter always receives
`string`, because keys are stringified (`cascade.ts:101-111`) — sort on strings,
never on the original key type.

### `/* global d3, sszvis */` headers

A JS lint pragma, meaningless in TypeScript and already handled by
`globals.d.ts`. Delete on sight.

## Correctness bugs

### A predicate that returns a function

A helper curried by state — `isSelected(state)` returning `(d) => …` — passed
uncalled: `.highlightTick(isSelected)`. `axis.ts:105` declares
`highlightTick?: (d: AxisDomain) => boolean` and `axis.ts:440` uses the result as
a boolean, so a returned closure is always truthy and **every tick renders
`.active`**. Should be `.highlightTick(isSelected(state))`.

Worth a deliberate check whenever a helper is curried by state.

### An undomained ordinal scale

Unlike a stock d3 ordinal scale, `sszvis.scaleQual12()` does not extend its
domain implicitly. Undomained, it returns its first colour for every input. This
fails silently: the chart renders, every mark is palette colour #1, and nothing
errors.

Either domain the scale, or — when a chart really is one series — take the
single colour deliberately (`const barFill = sszvis.scaleQual12()(SERIES_KEY)`)
instead of writing a `(d) => cScale(cAcc(d))` accessor that implies a mapping
which is not happening.

### `return true` as a loading guard

`if (state.data === null || state.mapData === null) { return true; }` — the
`true` is meaningless; `render` returns nothing. Under `app()` nothing renders
until `init` resolves, so a two-load chart should await both loads in `init`
rather than guard in `render`.

### Loose equality on state

`fAcc(d) == state.selectedFilter` works only because CSV values are strings. Use
`===` and parse deliberately at the boundary.

### Hand-rolled components

Writing a d3 closure component by hand with manual
`chart.x = function (_) { if (!arguments.length) return x; … }` getters. Use
`sszvis.component()` (`d3-component.ts:72`), which gives typed `.prop()` names so
a misspelling is a compile error. Use the named component types
(`BarComponent`, `ChoroplethComponent`), never the untyped `Component`, which
has an `[key: string]: any` escape hatch.

## Duplication and drift

### Near-identical example folders

Two examples that differ by a single constant should be one example.

### Helpers reimplemented per file

Examples are meant to be standalone and copy-pasteable, so some repetition is
correct. Repetition that has _drifted_ is not — `isWithinBarContour` has existed
in two files with **different arities**. The same name should mean the same
thing everywhere.

### Comment drift

The same explainer reworded across files, or duplicated verbatim in two and
pointed at by URL from two others. Write it once, in the example that best
demonstrates it.

### Stale cross-references

Comments pointing at file paths that no longer exist. Reference a concept or an
example id, not a path.

### Dead code

The examples corpus has zero TODOs and zero commented-out code. Keep it that way.

### Magic numbers

`var t = 80; var b = 140;` for bounds padding, `.dyTitle(-20)`,
`.paddingOuter(0.7)`. Name the constant and say what it is for. `MAX_WIDTH = 800`
with no comment is only marginally better than `800`; the comment should give the
unit when it is not obvious.

## Accessibility and fallback

`createSvgLayer` writes `<title>`, `<desc>` and
`aria-label="{title} – {description}"`. Passing empty strings ships
`aria-label=" – "`, which is what essentially every production chart does today.
Every example currently passes real values — a placeholder like `"Title"` or
`""` is a regression.

Fallback has the matching trap: passing `fallback` in the config and then calling
the renderer without the `{src}` option makes `config.fallback` dead config and
silently uses the library default. Wire both halves, and add the `example.json`
key in the same edit.

Since `AGENTS.md` lists "Accessible" as a project principle and examples are what
people copy, an example with a real title, a real description and a wired
fallback is doing more good than one more chart type.
