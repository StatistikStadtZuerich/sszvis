# sszvis API notes for example authors

Signatures and gotchas that decide whether an example typechecks cleanly. All
line references are in `packages/sszvis/src/`. For the full export list read
`src/index.ts` — it is a flat barrel of `export *` over 26 modules.

## Two things are not exported

- **`./types.js` is never re-exported.** `Measurement`, `Breakpoint`,
  `Accessor<T,R>`, `NumberAccessor` and friends live in `types.ts:18-121` but
  cannot be reached from `sszvis`. Examples must structurally type these shapes
  themselves.
- **`./logger.js` is never re-exported**, so `sszvis.logger.error` — referenced in
  several doc comments — is not reachable from the public entry.

`src/index.ts:18-19` imports `./d3-selectgroup.js` and `./d3-selectdiv.js` for
side effects. That is what installs `selection.selectGroup(key)` and
`selectDiv(key)`; they only exist because `sszvis` was loaded.

## Accessors and functional helpers

| Helper        | Signature                                                                   | Note                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prop`        | `<K>(key: K) => <T extends Record<K, unknown>>(o: T) => T[K]` (`fn.ts:330`) | Genuinely typed, but **new examples write a plain arrow instead** — see Naming in SKILL.md. Ubiquitous in existing code; leave it where it stands.    |
| `propOr`      | `fn.ts:347`                                                                 | Looser `Partial<Record<K, unknown>>`; accepts `T \| undefined`, returns `T[K] \| D`.                                                                  |
| `compose`     | `(...args: any[]) => any` (`fn.ts:81`)                                      | Deliberately untyped. Avoid in typed examples.                                                                                                        |
| `functor`     | `<T>(v: T \| (() => T)) => () => T` (`fn.ts:409`)                           | The returned function takes no args in the type but is called with `(datum, index)` at runtime. For d3 accessors use `valueFn` (`fn.ts:438`) instead. |
| `contains`    | `<T>(list: T[], d: T) => boolean` (`fn.ts:98`)                              | Argument order is `(list, item)` — the opposite of `Array.includes`.                                                                                  |
| `set`         | `<T,U>(arr, acc?) => U[]` (`fn.ts:369`)                                     | Returns derived values. Without an accessor `U` is `unknown`.                                                                                         |
| `derivedSet`  | `<T>(arr, acc?) => T[]` (`fn.ts:119`)                                       | Returns the input objects, deduped by accessor value.                                                                                                 |
| `hashableSet` | `fn.ts:248`                                                                 | Like `set` but O(n) and keys are stringified, so `1` and `"1"` collapse.                                                                              |
| `defined`     | `<T>(val: T) => val is NonNullable<T>` (`fn.ts:105`)                        | A real type guard; also rejects `NaN`. Ideal for `.defined()` on line/area.                                                                           |
| `stringEqual` | `fn.ts:401`                                                                 | Intended for comparing `Date` objects.                                                                                                                |
| `firstTouch`  | `(e: TouchEvent) => Touch \| null` (`fn.ts:209`)                            | Must be null-checked.                                                                                                                                 |

## Parsing and formatting

`parseDate(d: string): Date | null`, `parseYear(d: string): Date | null`,
`parseNumber(d: string): number` (`parse.ts:18,26,33`). None accept
`string | undefined` — see `library-type-defects.md` defect 1. The two date
parsers return `null`, so narrow before feeding a scale.

`formatNumber(d: number | null | undefined): string` (`format.ts:72`)
**explicitly accepts null/undefined** and returns an en-dash `"–"`. Hand it
possibly-missing values directly; no `??`, no cast. By contrast `formatPercent`
and `formatFractionPercent` (`format.ts:139,147`) take a plain `number`.

`formatPreciseNumber` is overloaded (`format.ts:124`): `(p)` returns a formatter,
`(p, d)` returns the string. The curried form is what `.tickFormat()` wants.

## Layout and measurement

`bounds()` has three overloads (`bounds.ts:89-96`). The responsive one is
`bounds({ top: 30, bottom: 40 }, "#chart")`. Defaults: padding top 0, right 1,
bottom 0, left 1; width falls back to `DEFAULT_WIDTH = 516`; height comes from
`aspectRatioAuto` when unspecified.

`responsiveProps()` — `_` is a required fallback key (`responsiveProps.ts:64`),
and values may be `T` or `(width: number) => T`. Returns
`Record<string, unknown>`, which is defect 3.

`aspectRatio12to5`, `aspectRatioSquare` and `aspectRatioPortrait` carry a
**`.MAX_HEIGHT` property** (500 / 420 / 600) readable without a cast
(`aspectRatio.ts:66-104`).

Breakpoints are **inclusive upper limits** tested in the order given
(`breakpoint.ts:9-16`). Defaults: palm ≤ 540, lap ≤ 749.

`measureAxisLabel` is 10px Arial, `measureLegendLabel` 12px
(`measure.ts:109,123`).

## Colour

Every scale is a **factory**, and the `.domain()` is not optional:
`sszvis.scaleQual12().domain(categories)`.

**An undomained ordinal scale returns its first colour for every input.** Unlike a
stock d3 ordinal scale it does not extend its domain implicitly — `domain()` stays
empty — so `scaleQual12()("a")` and `scaleQual12()("b")` are the same colour. This
fails silently: the chart renders, every mark is palette colour #1, and nothing
errors. `bar-chart-horizontal/basic` shipped that way for years.

So either domain the scale, or, when a chart really is one series, take the single
colour deliberately (`const barFill = sszvis.scaleQual12()(SERIES_KEY)`) instead of
writing a `(d) => cScale(cAcc(d))` accessor that implies a mapping which is not
happening.

`ExtendedOrdinalScale` (`color.ts:61-74`) adds `.darker()`, `.brighter()`,
`.reverse()`, each returning a new scale so chaining typechecks. **`.darker()` and
`.brighter()` are swapped in the implementation** (`color.ts:318-322`) — see the
defects file.

Sequential and diverging scales patch `.domain()` so a two-value domain is
expanded across their stops (`color.ts:341-404`). Call
`scaleDivVal().domain([min, max])`; do not hand-build the full stop list.

Scales return `LabColor` objects, not strings — defect 4. `withAlpha(c: string, a)`
and `getAccessibleTextColor(bg)` (`color.ts:308,412`) take strings.

## `sszvis.app()`

`app<State>({ init, render, actions, fallback })` returns `{ destroy() }`
(`app.ts:53-58,113`). Behaviour worth relying on, from `app.ts:71-110`:

- State is mutated only in actions, through an immer draft.
- The state handed to `render` is **shallow**-frozen — assigning to it throws.
  The freeze is shallow and immer auto-freezing is off because d3 mutates the
  data objects it is given.
- Renders batch into one `requestAnimationFrame`; several dispatches in a frame
  produce one render.
- A resize reported by the viewport module triggers a re-render. You never
  register a resize listener yourself.
- Nothing renders until `init` completes; an async `init` is awaited.
- `init` or an action may return an effect, called with `dispatch(name, props)`.
- An `init` that rejects is reported through `sszvis.logger.error` with the
  original error as `cause`, and renders the `fallback` image. It does not escape
  as an unhandled rejection.
- An effect that throws is reported separately and does **not** render the
  fallback — it is not mistaken for a chart that could not be built.

Two sharp edges. Actions must annotate their own props explicitly, because the
inline `actions` object is contextually typed from `Action<State>`, which
declares `...props: never[]` (`app.ts:33`).

And a dispatch naming an action that does not exist typechecks and fails at
runtime (`app.ts:96-102`) — **but only if you pass `State` alone**. The second
type parameter is inferred from nothing when you supply a partial type-argument
list, so it falls back to `Record<string, Action<State>>`. Supply it:
`app<State, Actions>(…)`, with `Actions` a `type` alias (an `interface` lacks the
implicit index signature the `Record` constraint needs). Then `ActionProps<A>`
(`app.ts:40`) can infer each dispatcher's real props, so both the name and the
argument types are checked.

## Components

Every component is built with `component()` (`d3-component.ts:72`). Each declares
its own interface extending `ComponentBuilder<Self>`, and `.prop()` takes
`keyof C & string`, so a misspelled prop name is a compile error. The untyped
`Component` interface has an `[key: string]: any` escape hatch — use the named
types (`BarComponent`, `ChoroplethComponent`), never `Component`.

Notes that affect examples:

- **`bar`** (`component/bar.ts:120`) guards geometry so non-finite values become
  0, and deliberately never transitions `fill`/`stroke`.
- **`tooltip`** (`annotation/tooltip.ts:95`) is the one component using
  `.delegate()`: `header`, `body`, `orientation`, `dx`, `dy`, `opacity` go to an
  inner renderer; `renderInto` and `visible` are its own. Pair it with
  `tooltipAnchor` and an HTML layer.
- **`choropleth`** (`maps/choropleth.ts:426`) is the recommended entry point for
  maps — prefer it over composing `mapRenderer*` by hand.
- **Stacked data flow**: `stackedBarVerticalData(...)` → `stackedBarVerticalLayout(...)`
  → component (`component/stackedBar.ts:305-309`). Read `maxValue`/`minValue` off
  the _layout_, not off the data array — the latter is deprecated
  (`stackedBar.ts:179,186`).
- **`axis`**: `axisX` / `axisY` are the entry points (`axis.ts:614,667`), with
  `.ordinal()` and `.time()` variants. `_scale` (`axis.ts:181`) is internal
  plumbing that leaks into the prop surface — never set it.

## Deprecated

| Deprecated                       | Replacement                     | Where                          |
| -------------------------------- | ------------------------------- | ------------------------------ |
| `range`                          | `rangeExtent`                   | `scale.ts:31`                  |
| `RATIO`                          | responsive aspect-ratio helpers | `bounds.ts:161`                |
| `groupedBars`                    | `groupedBarsVertical`           | `component/groupedBars.ts:461` |
| `sunburstLayout`                 | `prepareHierarchyData`          | `layout/sunburst.ts:45`        |
| data-array `maxValue`/`minValue` | the layout's                    | `component/stackedBar.ts:179`  |
| `base.ts` `geoJson` prop         | `mergedData`                    | `map/renderer/base.ts:13`      |

`transition.ts:11` states explicitly: **do not write**
`d3.selection().transition().call(sszvis.defaultTransition)` — d3's
`transition.call(f)` invokes `f` with the transition rather than configuring it.
Write `.transition(sszvis.defaultTransition())`.

Two doc comments are stale and should not be copied as style: `fallback.ts:6-10`
and `breakpoint.ts:18-26` still show the old namespaced API
(`sszvis.fallback.unsupported()`), which no longer matches the flat export names.
