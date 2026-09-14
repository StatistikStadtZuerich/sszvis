---
name: sszvis-styleguide
description: House style for writing and reviewing sszvis chart examples in apps/new-docs/examples — the canonical sszvis.app() skeleton, TypeScript typing rules, section banners, naming, and a catalogue of anti-patterns to reject. Use this whenever you are creating a new chart example, porting an old one, reviewing or refactoring example code, fixing type errors in apps/new-docs/examples, or answering "what should a good sszvis chart look like". Also use it when touching packages/sszvis types that the examples consume, since the examples are the test suite for those types.
---

# sszvis example style

Examples in `apps/new-docs/examples/` are not scratch code. They are the code
readers copy into production, they are type-checked against the library, and per
`examples/README.md` they are **the test suite for the library's published
types**. A sloppy example ships its sloppiness to every consumer who pastes it.

Work against `apps/new-docs/examples/`. The reference implementation to imitate
is `examples/bar-chart-vertical/basic/chart.ts` for typing and
`examples/line-chart/basic/chart.ts` for `sszvis.app()` structure — read both
before writing. Neither is perfect; this document says where they fall short.

## Before you start: know what is actually broken

Most type errors you hit in an example are **not yours**. Seven defects in the
library's published types make a fully clean example impossible today, and they
recur in every file. Read `references/library-type-defects.md` before spending
time fighting `tsc`, so you fix the right layer and do not paper over a library
bug with a cast in an example.

The practical rule: an example may carry errors that trace to those defects. It
may not carry errors caused by its own missing annotations. If you are unsure
which you have, the defects file tells you what each one looks like.

## The canonical shape

Use `sszvis.app()`. It is the library's application loop and it removes three
whole classes of bug the hand-rolled pattern invites: it batches renders into one
`requestAnimationFrame`, re-renders on resize by itself (so nothing re-registers
a resize listener), shallow-freezes the state handed to `render` (so a stray
assignment throws instead of silently corrupting state), and routes a failed
`init` to the fallback image. See `packages/sszvis/src/app.ts`.

Most existing examples still hand-roll `state` / `actions` / `render(state)` at
module scope. That is the legacy form. Read it fluently, do not write it new, and
convert it when you are already editing a file for another reason.

```ts
/**
 * Basic horizontal bar chart example using sszvis.
 *
 * @category bar-chart-horizontal
 */

// Magic Numbers

const MAX_WIDTH = 800;
/** In the x scale's own domain units - employees - not pixels. */
const BAR_TOUCH_THRESHOLD = 1000;

// Types

type Datum = { category: string; xValue: number };

type State = { data: Datum[]; categories: string[]; selection: Datum[] };

type Actions = {
  showTooltip: (state: State, e: Event, xValue: number | null, category: string | null) => void;
  hideTooltip: (state: State) => void;
};

// Responsive Props

const queryProps = sszvis
  .responsiveProps()
  .prop("xLabel", { _: "Beschäftigte" })
  .prop("ticks", { palm: 4, _: 5 });

// Accessors

const xAcc = (d: Datum) => d.xValue;
const cAcc = (d: Datum) => d.category;

// Application

sszvis.app<State, Actions>({
  fallback: { element: config.id, src: config.fallback },

  // The row parser is used once, so it stays inline rather than becoming a
  // named `parseRow` with a `CsvRow` type d3 already provides.
  init: (state) =>
    d3
      .csv(config.data, (d) => ({
        category: d["Sektor"] ?? "",
        xValue: sszvis.parseNumber(d["Zupendler"] ?? ""),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    // Props are already declared on `Actions`; annotating them again adds nothing.
    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  // Render
  render(state, actions) {
    // Scales / Layers / Components / Rendering / Interaction
  },
});

// Helper functions

/** Only helpers with something to explain get a name and a doc comment. */
const isWithinBarContour = (state: State) => (xValue: number | null) => {
  /* … */
};
```

### What lint enforces, so you needn't think about it

Two of these conventions are rules in `.oxlintrc.json`, scoped to
`apps/new-docs/examples/**`:

- `typescript/consistent-type-definitions: ["error", "type"]` — **`type`, never
  `interface`**, for every shape including `Datum`, `State` and `Actions`.
- `func-style: ["error", "expression"]` — **arrow consts, never `function`
  declarations**, helpers at the bottom of the file included.

Both are the _opposite_ of what `packages/sszvis/src` requires, which is why they
are scoped rather than global. Never widen them to the library.

One consequence to keep in mind: an arrow const is not hoisted the way a
`function` declaration is. A helper referenced inside `render` is fine because
`app()` renders asynchronously, but do not arrange for one to be read during
module evaluation.

### Sections

Open every example with a JSDoc block — one line on what the chart is, then
`@category <chart-type>`.

Then plain section comments, **no separator line** (older files carry a rule of
47 hyphens; delete it when you touch them):

`// Magic Numbers` → `// Types` → `// Responsive Props` → `// Accessors` →
`// Application` → `// Helper functions`

Inside `render()`, in this order, omitting any the chart genuinely lacks:
`// Scales`, `// Layers`, `// Components`, `// Rendering`, `// Interaction`.

Give a magic number a short JSDoc whenever its unit is not obvious from the name
— `BAR_TOUCH_THRESHOLD = 1000` is in the scale's domain units, not pixels, and
nobody can infer that.

Use `// NOTE:` for context a reader needs and cannot get from the code: why a
chart takes one colour, why a value is clamped, which quirk a line works around.
Reserve it for durable facts, not narration of what the next line plainly does.

### Naming

These are conventions the corpus already converged on. Following them means a
reader who knows one example knows them all.

| Thing                 | Name                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| Accessors             | `xAcc`, `yAcc`, `cAcc`, `vAcc` (maps use `vAcc` for value), suffix always `Acc` |
| Responsive props      | `queryProps`, always                                                            |
| Row parser            | inline in `d3.csv` (see Typing); named `parseRow` only if reused                |
| Colour scale          | `cScale` for categorical charts, `colorScale` for maps/choropleths              |
| Layers                | `chartLayer`, `tooltipLayer`, `controlLayer`, `interactionLayer`                |
| `sszvis.bar()` result | `barGen`                                                                        |
| Axes / legend         | `xAxis`, `yAxis`; `colorLegend` for categorical, `legend` for maps              |
| Group names           | `selectGroup("bars" \| "xAxis" \| "yAxis" \| "colorLegend" \| "interaction")`   |

Prefer a spelled-out accessor (`regionAcc`, `valueAcc`) over a cryptic single
letter when a chart has more than three; `xjAcc` helps nobody.

**Write accessors as plain arrows, not `sszvis.prop`:**

```ts
const xAcc = (d: Datum) => d.xValue; // yes
const xAcc = sszvis.prop("xValue"); // no, in new code
```

This is a deliberate break with the corpus, where `sszvis.prop` appears in nearly
every file and some 3400 times across production. It is still the right call
here: `prop` is generic over `Record<K, unknown>`, so what it returns is inferred
at each call site rather than pinned to your datum, and the resulting accessor
flows less cleanly into the component generics. An arrow says the same thing,
reads the same, and is typed once against the `Datum` you already declared.

`sszvis.prop` is not deprecated and you will meet it constantly when reading
existing examples and production charts. Leave it alone where it stands unless
you are already porting the file.

Unused leading parameters are `_e` / `_event` consistently within a file — pick
`_e` for new code. Never a bare `e` for a parameter you do not read.

### Typing

Every example is TypeScript and must read like it. The one migrated exemplar
proves it is achievable without noise.

- Declare named `Datum`, `State` and `Actions` type aliases under `// Types`.
  (Lint enforces the alias over `interface`.)
- **Say what you are drawing, then stop annotating.** Give the factory its type
  argument — `sszvis.bar<Datum>()`, `sszvis.tooltip<Datum>()`,
  `sszvis.move<number, string>()`, `sszvis.panning<Datum>()` — and the callbacks
  infer: write `.fill((d) => …)`, not `.fill((d: Datum) => …)`. The exception is
  a factory that is not generic: `sszvis.modularTextHTML()` takes no type
  argument, so its callbacks still need `(d: Datum)` or they are implicitly
  `any`. When unsure, delete the annotation and run tsc — TS7006 tells you it was
  load-bearing.
- The same applies to actions: their props are declared on `Actions`, so write
  `showTooltip(state, _e, _xValue, category)` with no repeated annotations.
- **Inline a helper that is used once and says nothing.** The row parser belongs
  inline in `d3.csv(config.data, (d) => ({ … }))` — d3 already types the row, so
  a named `parseRow` and a hand-written `CsvRow` are both noise. A one-line
  predicate belongs at its call site: `.visible((d) => sszvis.contains(state.selection, d))`.
  Keep a named helper when it has something to explain, and give it a doc comment
  when you do.
- Pass **both** type arguments: `sszvis.app<State, Actions>({ … })`. `State`
  alone leaves `Actions` defaulted to `Record<string, Action<State>>`, and that
  default is not harmless — it makes `actions.showTooltp(…)` compile and fail at
  runtime, and it collapses every dispatcher's props to `never[]` so wrong
  argument types pass too. Naming `Actions` closes both holes:

  ```ts
  sszvis.app<State>(…)          // actions.bumpp([1])  → compiles, throws at runtime
  sszvis.app<State, Actions>(…) // actions.bumpp([1])  → TS2551 "Did you mean 'bump'?"
                                // actions.bump(["x"]) → TS2345 wrong argument type
  ```

  `app.ts:96-102` describes the defaulted behaviour as an accepted tradeoff for
  callers who cannot name their actions. Examples can, so they should.
  `Actions` must be a `type` alias; an `interface` has no implicit index
  signature and will not satisfy the `Record<string, …>` constraint.

- Annotate action parameters after `state` anyway. `Action<State>` declares
  `...props: never[]` (`app.ts:33`), so the inline `actions` object is still
  contextually typed from that, not from your `Actions` alias.
- Annotate component callbacks: `.fill((d: Datum) => …)`.
- `ts-blank-space` erases the types, so only erasable syntax is available: no
  `enum`, no parameter properties, no `namespace`.
- `: any`, `@ts-ignore` and `@ts-expect-error` appear nowhere in the corpus. Keep
  it that way. A cast is a last resort and needs a comment naming the library
  defect it works around.

`d3.csv` types row values as `string | undefined`, and `sszvis.parseNumber` and
`parseDate` take `string`. Narrow at the parse boundary with `?? ""` rather than
casting with `as string` — the cast lies about a value that really can be
missing, and missing values are exactly what these charts have to render.

### Wiring

Load data inside `init`, and let `app()` own the lifecycle:

```ts
init: (state) =>
  d3.csv(config.data, parseRow).then((data) => { state.data = data; }),
```

Outside `app()`, the one canonical line is
`d3.csv(config.data, parseRow).then(actions.prepareState).catch(sszvis.loadError);`
— `.catch(sszvis.loadError)` is never optional, since without it a failed load is
an unhandled rejection and the reader sees an empty chart with no clue why.

Always read the target element and data path from `config`. `config.id`,
`config.data` and `config.fallback` are injected from `example.json` and declared
in `examples/globals.d.ts`. Hardcoding `"#sszvis-chart"` means the example cannot
be embedded twice on a page, and it is wrong in 68 places today.

Wire the fallback — **and add the key at the same time**. Referencing
`config.fallback` is one half of the change; the other half is a `fallback` entry
in that example's `example.json`. Only three of 53 examples currently have one, so
in almost every file you touch the key is missing and adding the line alone ships
a reference to an undefined value. Treat them as a single edit:

```ts
fallback: { element: config.id, src: config.fallback },
```

```json
{
  "title": "…",
  "config": {
    "data": "data.csv",
    "id": "#sszvis-chart",
    "fallback": "/preview/_static/fallback.png"
  }
}
```

If you cannot add the key — you are editing only the `.ts`, say — then do not
reference `config.fallback` either. A half-wired fallback is worse than none,
because it looks wired.

Give `createSvgLayer` a real title and description when the example has them —
it writes `<title>`, `<desc>` and `aria-label` into the SVG. Production ships
`aria-label=" – "` on essentially every chart because these are passed empty;
examples are where that gets fixed, since examples are what people copy.

### Simplifying an example has a cost application code does not

When you tidy an example, remember what it is for. A reader opens it to learn a
pattern, so a construct that looks redundant _in this file_ may be the whole
reason the file exists.

The clearest case is `responsiveProps` where every prop has only a `_` value.
In application code that is four constants routed through machinery for nothing,
and deleting it is right. In a docs example it is often the reader's first sight
of how responsive props are declared, and deleting it quietly removes the lesson.

So: prefer giving the construct a real reason to be there over removing it. Add
the `palm` breakpoint the chart actually wants rather than dropping the wrapper.
Remove it only when the example demonstrates that pattern nowhere and some other
example covers it — and say so in the commit message, because the next person
will read the deletion as an oversight.

The same reasoning applies to a helper you could inline, a named constant you
could fold in, and an explicit type you could let TypeScript infer. Terser is not
automatically better here; _legible to someone who does not yet know the library_
is the target.

## Anti-patterns

Read `references/anti-patterns.md` for the full catalogue with file citations.
These are the ones worth memorising, each drawn from real code in this repo:

- **`sszvis.viewport.on("resize", …)` inside `render()`.** Present in 47 of 48
  hand-rolled examples and 1047 production charts, so it reads as intentional —
  it is not. `app()` handles resize, so under `app()` you simply never write it.
- **`function render(state)` shadowing the module-level `state`.** The source of
  every `no-shadow` warning in the corpus. Under `app()` the parameter is the
  real state and there is nothing to shadow.
- **A predicate that returns a function.** `line-chart/basic` passes
  `.highlightTick(isSelected)` where `isSelected(state)` returns a closure, so
  every tick is truthy and renders as active. When a helper is curried by state,
  call it: `.highlightTick(isSelected(state))`.
- **`sszvis.compose` in a typed pipeline.** Its signature is deliberately
  `(...args: any[]) => any` (`fn.ts:81`), so it erases types at every accessor
  site. It appears 199 times across 48 files and is a large share of the type
  errors. In new code write `(d: Datum) => xScale(xAcc(d))`.
- **`/* global d3, sszvis */` headers.** A JS lint pragma, meaningless in
  TypeScript and already handled by `globals.d.ts`. Delete on sight. One file
  even has it malformed with a missing comma.
- **Near-duplicate example folders.** `rastermap-bins-100m` and
  `rastermap-bins-200m` differ by one character across 236 lines. If two examples
  differ only by a constant, they should be one example.
- **Hardcoded hex colours.** Production has 3500 hex literals bypassing
  `sszvis.scale*`, including a copy-pasted colour ladder that shadows an ordinal
  scale defined three lines above. Always go through the palette.
- **Stale cross-references.** Comments pointing at
  `docs/map-standard/kreis.html`, a path that no longer exists. Point at a
  concept or an example id, not a file path that will rot.

## Deprecated API

Do not write these; replace them when you see them. Full list with line
references in `references/api-notes.md`.

| Deprecated                                            | Use                                       |
| ----------------------------------------------------- | ----------------------------------------- |
| `sszvis.range`                                        | `sszvis.rangeExtent`                      |
| `sszvis.RATIO`                                        | responsive aspect-ratio helpers           |
| `sszvis.groupedBars`                                  | `sszvis.groupedBarsVertical`              |
| `sszvis.sunburstLayout`                               | `sszvis.prepareHierarchyData`             |
| `.call(sszvis.defaultTransition)`                     | `.transition(sszvis.defaultTransition())` |
| `sszvis.fn.*`, `sszvis.axis.x`, `sszvis.color.qual12` | the flat v3 API                           |

That last row matters when reading `.reference/d3charts-website`: 369 of its
charts still load sszvis 1.0.0 with the old namespaced API. Roughly a third of
the "real production code" you might copy from is a generation behind.

## Checking your work

```bash
pnpm --filter @sszvis/new-docs run type-check:examples
pnpm run lint
pnpm run format
```

Be aware that `type-check:examples` compiles every example as **one** program.
Because examples are scripts with no imports, their top-level `const`s collide,
which produces hundreds of spurious "Cannot redeclare block-scoped variable"
errors and — worse — cross-contaminates inference between unrelated files. To
see the truth for one file, check it alone:

```bash
cd apps/new-docs
cat > tsc-one.tmp.json <<'EOF'
{ "extends": "./tsconfig.json", "include": [],
  "files": ["examples/globals.d.ts", "examples/<type>/<name>/chart.ts"] }
EOF
npx tsc --noEmit -p tsc-one.tmp.json; rm tsc-one.tmp.json
```

Finally, open the example. `pnpm --filter @sszvis/new-docs run dev` and look at
it. A chart that typechecks and renders nothing is still broken, and the type
system cannot tell you that.
