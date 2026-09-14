# Library type defects blocking clean examples

`apps/new-docs/examples/README.md` says examples are the test suite for the
library's published types. This is that test suite's current output.

Measured by checking each `chart.ts` in isolation (see SKILL.md for the command):
**1558 errors across 53 of 53 files**. The best-written example,
`bar-chart-vertical/basic/chart.ts`, still produces 12 — and about ten of those
are library-side. That is the floor every example sits on until these are fixed.

Do not work around these in example code. Fix them in `packages/sszvis/src`, or
leave the error and note it. A cast in an example teaches the cast to every
consumer who copies it.

## The seven

### 1. `parseNumber` / `parseDate` reject `string | undefined` — FIXED

`parse.ts:18,26,33` declare `(d: string)`. `d3.csv` row callbacks type every
column as `string | undefined`, so the single most common line in any example
does not typecheck.

Looks like: `Argument of type 'string | undefined' is not assignable to parameter of type 'string'.`

Until fixed, narrow at the parse boundary with `?? ""`. Widening the library
signatures to `string | undefined` would be the real fix, since a missing CSV
cell is normal input, not a programming error.

### 2. `measureDimensions()` is not assignable to `Measurement` — FIXED

`measure.ts:44` returns `DimensionMeasurement` with `width: number | undefined`.
`responsiveProps.ts:105` takes `Measurement` with `width: number`. So
`queryProps(sszvis.measureDimensions(config.id))` — in nearly every example —
cannot typecheck. **50 errors.**

Looks like: `Argument of type 'DimensionMeasurement' is not assignable to parameter of type 'Measurement'.`

### 3. `responsiveProps()` returns `Record<string, unknown>` — FIXED

`responsiveProps.ts:82`. Every `props.barPadding` read is `unknown`. **83 errors**
plus most of the downstream `TS2322`/`TS2345` noise.

The fix worth considering is making `responsiveProps` generic over the props
registered by `.prop()` calls, so the return is a mapped type rather than a bag.
That is the difference between `props.slant` being `unknown` and being
`SlantDirection`.

### 4. Colour scales return `LabColor`, components want `string` — FIXED

`color.ts:61` — `ExtendedOrdinalScale extends ScaleOrdinal<string, LabColor>`.
`bar().fill()` took `BarValue<T, string | undefined>`, so `.fill((d) => cScale(d))`
failed with `Type 'LabColor' is not assignable to type 'string'.`

Colour properties now take `ColorValue` (`types.ts`), which covers the `LabColor`,
`HSLColor` and `RGBColor` the scales return as well as a plain string, and the
components stringify it for d3 themselves.

### 5. NOT a defect — pass the component its datum type

Previously listed here as "component accessors are not generic over the datum".
That was wrong, and worth stating plainly because the error looks identical.

`tooltip` _is_ generic: `TooltipComponent<T>`, with
`visible(accessor?: Accessor<Datum<T>, boolean>)` (`annotation/tooltip.ts:73`).
The error appears only because `sszvis.tooltip()` leaves `T` as its `unknown`
default, and `(d: Datum) => boolean` is not assignable to `(d: unknown) => boolean`.

Looks like: `Type '(d: Datum) => boolean' is not assignable to type '(d: unknown) => boolean'.`

The fix is in the example, not the library — name the datum:

```ts
sszvis.tooltip<Datum>().visible(isSelected(state));
sszvis.bar<Datum>();
sszvis.move<number, string>();
sszvis.panning<Datum>();
```

Verified: `sszvis.tooltip<D>().visible((d: D) => …)` compiles; the bare
`sszvis.tooltip()` form does not. So whenever you see an `unknown`-vs-datum
mismatch on a component prop, reach for the type argument before assuming the
library is at fault.

### 6. `move()`/`panning()` handler types — FIXED

The error read `Argument of type '"move"' is not assignable to parameter of type
'"end"'`, which looks like broken overload resolution. It was not: the event-name
overloads were fine. `EventHandler` hardcoded `x: number | string | null` for both
positions instead of being generic over the component's scale domains, so the
_correct_ handler was rejected by contravariance and tsc reported against the last
overload it tried. A misleading error worth remembering.

Both behaviors are now generic over what they dispatch — `move<XDomain, YDomain>`
and `panning<T>` over the datum bound to the pannable element — so name them:
`sszvis.move<number, string>()`, `sszvis.panning<Datum>()`.

### 7. `topojson` is an undeclared global — FIXED

Not a library defect but the same class of problem, and the cheapest fix here:
`examples/globals.d.ts` declares `sszvis`, `d3` and `config` but **not**
`topojson`, which 16 map examples use. **58 errors**, all of them
`Cannot find name 'topojson'`.

Fix by adding a declaration alongside the others, and add `@types/topojson` (or
`topojson-client`) to `apps/new-docs` devDependencies. Note the repo constraint:
no new _peer_ dependencies on `packages/sszvis` — a devDependency on the docs app
is a different thing and is fine.

## Two genuine runtime bugs found alongside

Worth separate issues; they are not type problems.

**`.darker()` and `.brighter()` are swapped.** `color.ts:318-322` — `darker()` is
implemented as `.brighter(LIGHTNESS_STEP)` and vice versa. Four examples call
these, so four examples currently render the opposite shade from the one the
code says.

**`app()` accepts a mistyped action name — unless you name `Actions`.** Write
`app<State, Actions>(…)` and both a misspelled dispatcher and a wrong argument
type become compile errors; this is a solved problem, not a defect to live with.
See the Typing section of SKILL.md. What follows applies only to the
single-type-argument form. `app.ts:96-102` documents it: because
`State` is passed explicitly, `Actions` falls back to
`Record<string, Action<State>>`, so `actions.missng()` typechecks and fails at
runtime. The comment explains the tradeoff (narrowing the default makes every
inline action's `state` implicitly `any`), so this is known and accepted — but
examples should be reviewed for it by hand, since the compiler will not help.

## Error inventory, for tracking progress

> **Stale.** These counts predate the fixes for defects 1, 2, 3, 4, 6 and 7.
> Regenerate them against `apps/new-docs/examples` before reading them as progress.

Per-file isolated check, as of the original survey:

| Code    | Count | Meaning                                                                |
| ------- | ----- | ---------------------------------------------------------------------- |
| TS7006  | 498   | implicit `any` parameter — mostly `d` (155), `data` (60), `state` (50) |
| TS2345  | 497   | argument not assignable — defects 1, 2, 4, 5, 6                        |
| TS2339  | 148   | property missing on an inferred `never[]` state                        |
| TS2322  | 137   | type not assignable                                                    |
| TS18046 | 83    | value is `unknown` — defect 3                                          |
| TS2304  | 58    | `Cannot find name 'topojson'` — defect 7                               |

TS7006 and TS2339 are **example-side**: they come from the 52 files that were
renamed `.js` → `.ts` without being ported, where `state` is an untyped object
literal whose fields infer as `never[]`. Those are fixable today, independently of
the library. The rest need the library fixed first.
