---
name: sszvis-styleguide
description: House style for writing and reviewing sszvis chart examples in apps/new-docs/examples — the canonical sszvis.app() skeleton, TypeScript typing rules, section banners, naming, and the anti-patterns to reject. Use this whenever you are creating a new chart example, reviewing or refactoring an existing chart.ts, fixing type or lint errors in apps/new-docs/examples, or answering "what should a good sszvis chart look like".
---

# sszvis example style

Examples in `apps/new-docs/examples/` are not scratch code. They are what readers
copy into production, and per `examples/README.md` they are the test suite for
the library's published types. A sloppy example ships its sloppiness onward.

All 53 examples currently conform to this document and the whole corpus
type-checks with **zero errors**. That is the baseline you are working from: if
an example does not typecheck, the example is wrong. Do not reach for a cast.

The reference implementation is
`apps/new-docs/examples/bar-chart-horizontal/basic/chart.ts`. Read it before
writing a new chart — the skeleton below is its shape, with one deliberate
difference noted under Typing.

- **API facts and gotchas** — `references/api-notes.md`
- **Anti-patterns, with the reasoning** — `references/anti-patterns.md`
- **Reading `.reference/d3charts-website`** — `references/production-corpus.md`

## The canonical shape

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
const SERIES_KEY = "Zupendler";

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
        xValue: sszvis.parseNumber(d["Zupendler"]),
      }))
      .then((data) => {
        state.data = data;
        state.categories = sszvis.set(data, cAcc);
        state.selection = [];
      }),

  actions: {
    // Props are declared on `Actions`; annotating them again adds nothing.
    showTooltip(state, _e, _xValue, category) {
      state.selection = state.data.filter((d) => cAcc(d) === category);
    },

    hideTooltip(state) {
      state.selection = [];
    },
  },

  render(state, actions) {
    const props = queryProps(sszvis.measureDimensions(config.id));
    const bounds = sszvis.bounds({ top: 30, bottom: 40 }, config.id);

    // Scales
    // Layers
    // Components
    // Rendering
    // Interaction
  },
});

// Helper functions

/** Only helpers with something to explain get a name and a doc comment. */
const isWithinBarContour = (state: State) => (xValue: number | null) => {
  /* … */
};
```

`sszvis.app()` is the library's application loop (`packages/sszvis/src/app.ts`).
It batches renders into one `requestAnimationFrame`, re-renders on resize by
itself, shallow-freezes the state handed to `render` so a stray assignment
throws, and routes a failed `init` to the fallback image. Because it owns
resize, **you never register a resize listener yourself**.

### Sections

Open with a JSDoc block: one line on what the chart is, then
`@category <chart-type>`. Then plain section comments, no separator rule:

`// Magic Numbers` → `// Types` → `// Responsive Props` → `// Accessors` →
`// Application` → `// Helper functions`

Inside `render()`, in this order, omitting any the chart genuinely lacks:
`// Scales`, `// Layers`, `// Components`, `// Rendering`, `// Interaction`.

Give a magic number a short JSDoc whenever its unit is not obvious from the
name. `BAR_TOUCH_THRESHOLD = 1000` is in the scale's domain units, not pixels,
and nobody can infer that.

Use `// NOTE:` for context a reader needs and cannot get from the code: why a
chart takes one colour, why a value is clamped, which quirk a line works
around. Durable facts only, never narration of the next line.

### What lint enforces

Two rules in `.oxlintrc.json`, scoped to `apps/new-docs/examples/**`:

- `typescript/consistent-type-definitions: ["error", "type"]` — **`type`, never
  `interface`**, for every shape including `Datum`, `State` and `Actions`.
- `func-style: ["error", "expression"]` — **arrow consts, never `function`
  declarations**, bottom-of-file helpers included.

Both are the _opposite_ of what `packages/sszvis/src` requires, which is why
they are scoped. Never widen them to the library, and never carry example style
into library code or vice versa.

One consequence: an arrow const is not hoisted the way a `function` declaration
is. A helper referenced inside `render` is fine because `app()` renders
asynchronously; do not arrange for one to be read during module evaluation.

### Naming

| Thing                 | Name                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| Accessors             | `xAcc`, `yAcc`, `cAcc`, `vAcc` (maps use `vAcc` for value), suffix always `Acc` |
| Responsive props      | `queryProps`, always                                                            |
| Row parser            | inline in `d3.csv`; named `parseRow` only if reused                             |
| Colour scale          | `cScale` for categorical charts, `colorScale` for maps/choropleths              |
| Layers                | `chartLayer`, `tooltipLayer`, `controlLayer`, `interactionLayer`                |
| `sszvis.bar()` result | `barGen`                                                                        |
| Axes / legend         | `xAxis`, `yAxis`; `colorLegend` for categorical, `legend` for maps              |
| Group names           | `selectGroup("bars" \| "xAxis" \| "yAxis" \| "colorLegend" \| "interaction")`   |

Prefer a spelled-out accessor (`regionAcc`, `valueAcc`) over a cryptic single
letter when a chart has more than three; `xjAcc` helps nobody.

Unused leading parameters are `_e` / `_event`, consistently within a file — pick
`_e` for new code. Never a bare `e` for a parameter you do not read.

**Write accessors as plain arrows, not `sszvis.prop`:**

```ts
const xAcc = (d: Datum) => d.xValue; // yes
const xAcc = sszvis.prop("xValue"); // no
```

`prop` is generic over `Record<K, unknown>`, so its return type is re-inferred at
each call site instead of being pinned to your `Datum`, and it flows less cleanly
into component generics. An arrow says the same thing and is typed once.

`sszvis.prop` is not deprecated and you will meet it constantly in production
charts. Leave it alone where it stands; just do not write it here.

### Typing

- Declare named `Datum`, `State` and `Actions` type aliases under `// Types`.
- Pass **both** type arguments: `sszvis.app<State, Actions>({ … })`. `State`
  alone leaves `Actions` defaulted to `Record<string, Action<State>>`, which
  makes `actions.showTooltp(…)` compile and fail at runtime, and collapses every
  dispatcher's props to `never[]` so wrong argument types pass too:

  ```ts
  sszvis.app<State>(…)          // actions.bumpp([1])  → compiles, throws at runtime
  sszvis.app<State, Actions>(…) // actions.bumpp([1])  → TS2551 "Did you mean 'bump'?"
                                // actions.bump(["x"]) → TS2345 wrong argument type
  ```

  `Actions` must be a `type` alias; an `interface` has no implicit index
  signature and will not satisfy the `Record<string, …>` constraint.

- **Say what you are drawing, then stop annotating.** Give the factory its type
  argument and the callbacks infer:

  ```ts
  sszvis.bar<Datum>().fill((d) => cScale(cAcc(d)));   // yes
  sszvis.bar<Datum>().fill((d: Datum) => …);          // redundant
  sszvis.tooltip<Datum>();
  sszvis.move<number, string>();
  sszvis.panning<Datum>();
  ```

  **The test:** if the factory takes a type argument, pass it and drop the
  annotation. If it does not, annotate. When unsure, delete the annotation and
  run `tsc` — TS7006 tells you it was load-bearing.

  The named exception is **`sszvis.modularTextHTML()`**, which is not generic, so
  its callbacks still need `(d: Datum)` or they are implicitly `any`.

- Actions are covered by the same rule. Their props are declared on `Actions`, so
  write `showTooltip(state, _e, _xValue, category)` — never re-annotate them.
- **Inline a helper that is used once and says nothing.** The row parser belongs
  inline in `d3.csv(config.data, (d) => ({ … }))` — d3 already types the row, so
  a named `parseRow` and a hand-written `CsvRow` are both noise. A one-line
  predicate belongs at its call site:
  `.visible((d) => sszvis.contains(state.selection, d))`. Keep a named helper
  when it has something to explain, and give it a doc comment when you do.
- `ts-blank-space` erases the types, so only erasable syntax is available: no
  `enum`, no parameter properties, no `namespace`.
- `: any`, `@ts-ignore` and `@ts-expect-error` appear **nowhere** in the corpus.
  Keep it that way. A cast is a last resort and needs a comment saying why.

`d3.csv` types row values as `string | undefined`. For a plain string field,
narrow with `?? ""` rather than casting with `as string` — the cast lies about a
value that really can be missing, and missing values are exactly what these
charts have to render.

`sszvis.parseNumber`, `parseDate` and `parseYear` already accept
`string | undefined | null`, so **do not** write `?? ""` before them.

### Wiring

Load data inside `init` and let `app()` own the lifecycle. Always read the
target element and data path from `config` — `config.id`, `config.data` and
`config.fallback` are injected from `example.json` and declared in
`examples/globals.d.ts`. A hardcoded `"#sszvis-chart"` cannot be embedded twice
on a page.

Wire the fallback **and add the key at the same time**. `fallback: { element:
config.id, src: config.fallback }` in the `.ts` and a `fallback` entry in that
example's `example.json` are one edit, not two:

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

Give `createSvgLayer` a real title and description. It writes `<title>`,
`<desc>` and `aria-label` into the SVG, and every example currently passes real
ones. Empty strings are a regression, not a default.

### Simplifying an example has a cost application code does not

A reader opens an example to learn a pattern, so a construct that looks
redundant _in this file_ may be the whole reason the file exists.

The clearest case is `responsiveProps` where every prop has only a `_` value. In
application code that is constants routed through machinery for nothing. In a
docs example it is often the reader's first sight of how responsive props are
declared, and deleting it quietly removes the lesson.

Prefer giving the construct a real reason to be there over removing it: add the
`palm` breakpoint the chart actually wants rather than dropping the wrapper.
Remove it only when some other example covers the pattern — and say so in the
commit message, because the next person will read the deletion as an oversight.

The same goes for a helper you could inline and a type you could let TypeScript
infer. Terser is not automatically better here; _legible to someone who does not
yet know the library_ is the target.

## Anti-patterns

`references/anti-patterns.md` has the full catalogue with reasoning. The ones
worth carrying in your head:

- **`sszvis.viewport.on("resize", …)` inside `render()`.** `app()` handles
  resize. Under `app()` you simply never write this.
- **A predicate that returns a function.** When a helper is curried by state,
  call it: `.highlightTick(isSelected(state))`, not `.highlightTick(isSelected)`.
  A returned closure is always truthy, so every tick renders active.
- **`sszvis.compose` in a typed pipeline.** Its signature is deliberately
  `(...args: any[]) => any` (`fn.ts:81`), so it erases types at every accessor
  site. Write the arrow: `(d: Datum) => xScale(xAcc(d))`.
- **An undomained ordinal scale.** `scaleQual12()` without `.domain()` returns
  its first colour for every input, silently. Domain it, or take the single
  colour deliberately: `const barFill = sszvis.scaleQual12()(SERIES_KEY)`.
- **`sszvis.set(data)` without an accessor.** `U` cannot be inferred, so the
  result is `unknown[]`. Always `sszvis.set(data, cAcc)`.
- **Hardcoded hex colours.** Always go through `sszvis.scale*`.
- **Near-duplicate example folders.** If two examples differ only by a constant,
  they should be one example.
- **Stale cross-references.** Point at a concept or an example id, never a file
  path that will rot.

## Deprecated API

Do not write these. Full list with line references in `references/api-notes.md`.

| Deprecated                                            | Use                                       |
| ----------------------------------------------------- | ----------------------------------------- |
| `sszvis.range`                                        | `sszvis.rangeExtent`                      |
| `sszvis.RATIO`                                        | responsive aspect-ratio helpers           |
| `sszvis.groupedBars`                                  | `sszvis.groupedBarsVertical`              |
| `sunburst` `prepareData`                              | `sszvis.prepareHierarchyData`             |
| `.call(sszvis.defaultTransition)`                     | `.transition(sszvis.defaultTransition())` |
| `sszvis.fn.*`, `sszvis.axis.x`, `sszvis.color.qual12` | the flat v3 API                           |

That last row matters when reading `.reference/d3charts-website`: roughly a
third of those charts are a full API generation behind. See
`references/production-corpus.md`.

## Checking your work

```bash
pnpm --filter @sszvis/new-docs run type-check   # includes examples/tsconfig.json
pnpm run lint
pnpm run format
```

The examples compile as one program with `moduleDetection: "force"`, so each
file gets its own scope and top-level `const`s do not collide. The whole corpus
is expected to report **zero** errors — any error is a regression you own.

Then open it: `pnpm --filter @sszvis/new-docs run dev`. A chart that typechecks
and renders nothing is still broken, and the type system cannot tell you that.

## Review checklist

Copy this and tick it off before calling a chart done.

```
Structure
- [ ] JSDoc header with a one-line summary and @category <chart-type>
- [ ] Top-level banners in order: Magic Numbers, Types, Responsive Props,
      Accessors, Application, Helper functions
- [ ] Inside render(): Scales, Layers, Components, Rendering, Interaction
- [ ] No separator rules, no /* global */ pragma

Types
- [ ] Named Datum, State and Actions — `type`, never `interface`
- [ ] sszvis.app<State, Actions>(…), both arguments
- [ ] Every generic factory given its type argument (bar, tooltip, move, panning)
- [ ] No redundant annotations on callbacks or action props
- [ ] modularTextHTML callbacks DO carry (d: Datum)
- [ ] No `as`, `: any`, @ts-ignore or @ts-expect-error
- [ ] Plain string CSV fields narrowed with `?? ""`, not cast; no redundant
      `?? ""` in front of a parser

Wiring
- [ ] config.id / config.data / config.fallback — no hardcoded selector
- [ ] fallback wired in chart.ts AND the key present in example.json
- [ ] createSvgLayer given a real title and description
- [ ] Data loaded in init(); no resize listener anywhere

Style
- [ ] Accessors are arrows named *Acc, not sszvis.prop
- [ ] Ordinal colour scales are domained, or a single colour is taken deliberately
- [ ] Magic numbers named, with a JSDoc when the unit is not obvious
- [ ] Arrow consts, not function declarations
- [ ] No deprecated API

Verify
- [ ] pnpm --filter @sszvis/new-docs run type-check → 0 errors
- [ ] pnpm run lint && pnpm run format
- [ ] Opened in the dev server and it actually renders
```
