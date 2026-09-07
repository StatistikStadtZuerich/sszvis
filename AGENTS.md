# AGENTS.md

Authoritative instructions for coding agents working on SSZVIS, the D3-based
data visualization library for Statistik Stadt Zürich. Prefer this file over
`README.md`. Keep it current when commands, structure, or conventions change.

## Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Test (all) | `npm test` |
| Test (unit only) | `npm run test:unit` |
| Test (one file) | `npm test -- test/color.test.ts` |
| Test (watch) | `npm run test:watch` |
| Visual regression | `npm run test:snapshot` |
| Type check | `npm run type-check` (tsc over `src/` **and** `test/`) |
| Lint + format check | `npm run check` (fails on warnings) |
| Autofix | `npm run check:fix` |
| Docs server | `npm start` (port 8000) |
| Full build | `npm run build` |
| Search | `rg "pattern"` — always ripgrep, never grep/find |

CI runs `check`, `type-check`, `test:unit`, and the snapshot suite. All four
must pass. Publishing additionally runs them before `npm publish`.

Dev environment is Nix + direnv (`nix develop`); npm is the package manager.

## Philosophy

- **KISS** — choose the straightforward solution.
- **YAGNI** — build what is needed now, not what might be needed.
- **Functional composition over OOP** — see `sszvis.compose(f, g)(x) === f(g(x))`.
- **Responsive-first** — components take breakpoint values via `responsiveProps()`.
- **Accessible** — charts provide fallbacks; `createSvgLayer` writes title/desc.
- **Pure functions** — this library prefers computation over effects.

## Structure

`src/` is 100% TypeScript. `test/` is TypeScript apart from seven legacy
`.js` files.

```txt
src/
├── annotation/   Tooltips, rulers, confidence intervals
├── behavior/     Interaction (move, panning, voronoi)
├── component/    Chart components (bar, line, pie, sankey, …)
├── control/      UI controls (slider, buttonGroup, select)
├── layout/       Layout algorithms (sankey, sunburst, smallMultiples)
├── legend/       Colour and radius legends
├── map/          Map renderers and Swiss geography utilities
├── maps/         High-level map components (choropleth)
├── svgUtils/     Crisp lines, text wrapping, defs elements
└── viewport/     Resize handling
test/     Vitest (browser mode, Chromium) + Playwright snapshots
docs/     11ty documentation site with live examples
build/    Compiled output (JS + .d.ts)
geodata/  GeoJSON/TopoJSON for Swiss administrative regions
```

## Architecture

**Component pattern** — every chart component is a d3-style chainable factory:

```ts
const barChart = sszvis
  .bar()
  .x(sszvis.compose(xScale, xAccessor))
  .y(sszvis.compose(yScale, yAccessor))
  .width(xScale.bandwidth());
```

**Layers** — `createSvgLayer()` for charts, `createHtmlLayer()` for tooltips
and overlays. Both accept a selector, an element, or a selection.

**State/actions** — docs examples keep a plain `state` object and an `actions`
object whose methods mutate it and call `render()`.

## TypeScript conventions

Biome enforces filename case, `.js` import extensions, `import type`, `T[]`
array syntax, no inferrable annotations, no `any`, and no non-null `!`. Run
`npm run check`; do not restate those rules here. What follows is what tooling
**cannot** check.

### Module shape

- Chart modules (`component/`, `annotation/`, `legend/`, `control/`,
  `map/renderer/`, `maps/`) **default-export their factory**. Utility modules
  (`fn`, `color`, `format`, `scale`, `crisp`, `bounds`, …) use **named exports
  only**. Never mix the two in one file.
- Default exports **should be named**, so stack traces and symbol search work:
  `export default function bar<T = unknown>(): BarComponent<T>` rather than
  `export default function <T = unknown>()`. **Known deviation:** 43 of the 50
  factory modules are still anonymous — the port carried the shape over
  wholesale. Name them as you touch them; do not add new anonymous ones.
- Top-level functions are `function` declarations. `const x = () => …` is for
  local callbacks and short combinators.
- The `d3-*.ts` prefix is reserved for the three d3 plugin modules.
- Import d3 from the `"d3"` barrel, never from `d3-*` submodules — the peer
  dependency is `d3` as a whole.

### Types

- Object shapes are `interface`. Reserve `type` for unions, intersections,
  mapped/conditional types, and function aliases.
- Suffixes are vocabulary, not decoration — use these and no synonyms
  (`Config`, `Options`, `Dimensions` are not interchangeable):

  | Suffix | Means |
  |---|---|
  | `…Props` | the component's internal prop bag (module-private) |
  | `…Component` | the public chainable interface (exported, re-exported from `index.ts`) |
  | `…Accessor` | a function from datum to value |
  | `…Datum` | a single data record |
  | `…Value` | a scalar a prop may hold or return |
  | `…Layout` | the return of a `layout/` function |

- Generic parameters are fixed by role: `T` datum, `P` point/inner datum,
  `L` layer/series, `S` series key, `D` domain. Give each a default
  (`<T = unknown>`) so call sites need not name them.

### The component factory

```ts
export default function dot<T = unknown>(): DotComponent<T> {
  return component<DotComponent<T>>()
    .prop("x", fn.functor)
    .render(function (data) { … });  // `function`, never an arrow — `this` is the group
}
```

- Pass the interface explicitly to `component<…>()`, and have that interface
  extend `ComponentBuilder<Self>` (see `d3-component.ts`). Without it the
  builder chain degrades and the interface is never checked against what is
  actually built.
- `.render()` / `.renderSelection()` callbacks are `function` expressions —
  they depend on d3's `this` binding.
- Read every prop through `props` inside `render`; never re-read a setter.

### Escape hatches

- `$IntentionalAny` (in `types.ts`) is the only sanctioned `any` and carries the
  only lint-ignore comment in the repo. Use it solely where a type genuinely
  cannot be expressed — d3 internals, variadic combinators, the untyped
  component core — and always with a comment saying which.
  `rg '\$IntentionalAny'` lists every hatch; keep the list short and defensible.
- Prefer `unknown` and narrow.
- **`as unknown as X` is a smell, not a tool.** In this codebase it has almost
  always meant a signature was wrong rather than inexpressible. Before writing
  one, check:
  - **Is a declaration lying?** `cascade`'s sorter promised the caller's key
    type while the grouping hands it strings; fixing the declaration removed
    the cast.
  - **Is it trying to accept "any selection" non-generically?** d3's `Selection`
    is invariant in all four type parameters, so no single type — not
    `BaseType`, not `any` in the datum slot, not a union — accepts every
    selection. Such a function must be **generic over d3's four parameters**.
    See `textWrap`, `ensureDefsElement`, `createSvgLayer`.
  - **Is a runtime string determining a type?** Derive it — `ensureDefsElement`
    takes `K extends keyof SVGElementTagNameMap` and needs no cast at all.
  - **Is it a dynamic property read or write?** Use `Reflect.get` /
    `Reflect.set` — cast-free, and they say what they mean.
  - **Is a chained d3 result a union you know is one member?** A direct `as`
    narrows it; the `unknown` bridge is not needed.

  Two remain in `src/`, both predating this guide, each with a comment naming
  the lie it encodes.
- No `@ts-ignore`. `@ts-expect-error` with a one-line reason if truly stuck.

### Documentation

- Every module opens with `@module sszvis/<path>`, barrels included.
- JSDoc carries **prose, not types** — no `@param {Type}`; TypeScript owns
  types. Document units, defaults, and behavioural quirks instead.
- Examples in JSDoc use `const`.
- Every component needs a working example in `docs/`.

## Testing

Vitest in browser mode (Playwright/Chromium) — tests run against real DOM/SVG.
Test files are `test/**/*.test.{js,ts}`. Playwright snapshots in
`test/snapshot/snapshot.spec.js` compare every docs example, including
interactive states, against stored screenshots.

No feature is complete without tests. When pinning existing behaviour that
looks wrong, keep it and mark it `// NOTE:` as a known quirk rather than
silently fixing it.

## Error handling

Errors are thrown directly; graceful handling is a future enhancement. Use
`sszvis.loadError` for data-loading failures:

```js
d3.csv("data.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);
```

Validate before use: check DOM elements exist, check data extents before
building scales, and use fallbacks for NaN.

## Git

Branches: `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, off `main`.

Conventional commits — `<type>(<scope>): <subject>`, types `feat`, `fix`,
`docs`, `style`, `refactor`, `test`, `chore`. Explain *why* in the body, and
reference issues in the footer (`Closes #123`).

**Never mention coding agents or AI authorship in commit messages.**

## When in doubt

Ask rather than guess. Verify file paths and module names before using them.
