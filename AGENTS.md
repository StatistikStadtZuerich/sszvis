# AGENTS.md

Authoritative instructions for coding agents working on SSZVIS, the D3-based data visualization library for Statistik Stadt Zürich. Prefer this file over `README.md`. Keep it current when commands, structure, or conventions change.

## Commands

This is a pnpm + Turborepo monorepo. Root commands fan out across workspaces; use
`--filter` to target one.

| Task                | Command                                                     |
| ------------------- | ----------------------------------------------------------- |
| Install             | `pnpm install`                                              |
| Test (all)          | `pnpm test`                                                 |
| Test (unit only)    | `pnpm run test:unit`                                        |
| Test (one file)     | `pnpm --filter sszvis exec vitest run test/color.test.ts`   |
| Test (watch)        | `pnpm --filter sszvis run test:watch`                       |
| Visual regression   | `pnpm run test:snapshot` (needs the docs server, see below) |
| Type check          | `pnpm run type-check` (tsc over `src/` **and** `test/`)     |
| Lint                | `pnpm run lint` (oxlint)                                    |
| Format              | `pnpm run format` (oxfmt)                                   |
| Lint + format check | `pnpm run check`                                            |
| Autofix             | `pnpm run lint:fix && pnpm run format`                      |
| Docs server         | `pnpm --filter @sszvis/docs run dev` (port 8000)            |
| Full build          | `pnpm run build`                                            |
| Rebuild topo data   | `pnpm run build:topo`                                       |
| Search              | `rg "pattern"` — always ripgrep, never grep/find            |

CI runs `check`, `type-check`, `test:unit`, and the snapshot suite; all four must pass.
Publishing re-runs the first three (not snapshots) before `pnpm publish` from
`packages/sszvis`.

Dev environment is Nix + direnv (`nix develop`); pnpm is the package manager.

## Layout

```txt
apps/
  docs/            # 11ty documentation site (@sszvis/docs)
    docs/          # eleventy input: guides, _includes, static, one dir per chart type
    dist/          # eleventy output, also what gh-pages deploys
packages/
  sszvis/          # the published library
    src/           # 100% TypeScript
    test/          # unit tests + test/snapshot (Playwright)
    build/         # rollup + tsc output, what npm publishes
  geodata/         # @sszvis/geodata — Swiss geo source data + the topo pipeline
    src/           #   GeoJSON/CSV sources
    topo.sh        #   pipeline
    dist/topo/     #   the four TopoJSON bundles
  config-typescript/ # shared tsconfig base (@repo/config-typescript)
scripts/           # the visual-regression harness
contrib/           # example projects and experiments
```

Every build writes to its own directory — `packages/sszvis/build`,
`packages/geodata/dist`, `apps/docs/dist`. The docs site pulls `sszvis.js` and the
TopoJSON bundles in through eleventy passthrough copies; turbo runs those two builds
first. The topo bundles are served at **both** `/topo/…` (the URL the guides
document) and `/static/topo/…` (what the examples load); they are build output, not
committed files.

Do not add a second `addPassthroughCopy` with a source path eleventy has already
seen — it is silently dropped. Use a glob to distinguish the sources.

The snapshot suite serves `apps/docs/dist` on port 8000 and screenshots every
example, so it needs `pnpm run build` and a running docs server first.

## Philosophy

- **KISS** — choose the straightforward solution.
- **YAGNI** — build what is needed now, not what might be needed.
- **Functional composition over OOP** — see `sszvis.compose(f, g)(x) === f(g(x))`.
- **Responsive-first** — components take breakpoint values via `responsiveProps()`.
- **Accessible** — charts provide fallbacks; `createSvgLayer` writes title/desc.
- **Pure functions** — this library prefers computation over effects.

## Structure

`packages/sszvis/src/` is 100% TypeScript. `packages/sszvis/test/` is TypeScript apart from seven legacy `.js` files.

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

**Layers** — `createSvgLayer()` for charts, `createHtmlLayer()` for tooltips and overlays. Both accept a selector, an element, or a selection.

**State/actions** — docs examples keep a plain `state` object and an `actions` object whose methods mutate it and call `render()`.

## TypeScript conventions

oxlint enforces the correctness category and a curated set of `unicorn`/`typescript`/`import` rules. Run `pnpm run check`; do not restate those rules here. What follows is what tooling **cannot** check.

Note: the Biome rules that enforced `.js` import extensions, `import type`, `T[]` array syntax and no non-null `!` have no oxlint equivalent yet. Keep following them by hand — relative imports **must** carry the `.js` extension, because the package ships ESM.

### Module shape

- Chart modules (`component/`, `annotation/`, `legend/`, `control/`, `map/renderer/`, `maps/`) **default-export their factory**. Utility modules (`fn`, `color`, `format`, `scale`, `crisp`, `bounds`, …) use **named exports only**. Never mix the two in one file.
- Default exports **should be named**, so stack traces and symbol search work: `export default function bar<T = unknown>(): BarComponent<T>` rather than `export default function <T = unknown>()`. A handful of factories are still anonymous, carried over wholesale by the port — `rg 'export default function *\(' src` lists them. Name them as you touch them; do not add new anonymous ones.
- Top-level functions are `function` declarations. `const x = () => …` is for local callbacks and short combinators.
- The `d3-*.ts` prefix is reserved for the three d3 plugin modules.
- Import d3 from the `"d3"` barrel, never from `d3-*` submodules — the peer dependency is `d3` as a whole.

### Types

- Object shapes are `interface`. Reserve `type` for unions, intersections, mapped/conditional types, and function aliases.
- Suffixes are vocabulary, not decoration — use these and no synonyms (`Config`, `Options`, `Dimensions` are not interchangeable):

  | Suffix       | Means                                                                  |
  | ------------ | ---------------------------------------------------------------------- |
  | `…Props`     | the component's internal prop bag (module-private)                     |
  | `…Component` | the public chainable interface (exported, re-exported from `index.ts`) |
  | `…Accessor`  | a function from datum to value                                         |
  | `…Datum`     | a single data record                                                   |
  | `…Value`     | a scalar a prop may hold or return                                     |
  | `…Layout`    | the return of a `layout/` function                                     |

- Generic parameters are fixed by role: `T` datum, `P` point/inner datum, `L` layer/series, `S` series key, `D` domain. Give each a default (`<T = unknown>`) so call sites need not name them.

### The component factory

```ts
export default function dot<T = unknown>(): DotComponent<T> {
  return component<DotComponent<T>>()
    .prop("x", fn.functor)
    .render(function (data) { … });  // `function`, never an arrow — `this` is the group
}
```

- Pass the interface explicitly to `component<…>()`, and have that interface extend `ComponentBuilder<Self>` (see `d3-component.ts`). Without it the builder chain degrades and the interface is never checked against what is actually built. `.prop()` and `.delegate()` take `keyof C`, so a prop name the interface does not declare is a compile error.
- `.render()` / `.renderSelection()` callbacks are `function` expressions — they depend on d3's `this` binding.
- Read every prop through `props` inside `render`; never re-read a setter.

### Escape hatches

- `$IntentionalAny` (in `types.ts`) is the only sanctioned `any`. Use it solely where a type genuinely cannot be expressed — d3 internals, variadic combinators, the untyped component core — and always with a comment saying which. `rg '\$IntentionalAny' src` lists every hatch; keep the list short and defensible. Lint-ignore comments are similarly rare — `rg 'oxlint-disable' src` should stay a short, individually justified list.
- Prefer `unknown` and narrow.
- **`as unknown as X` is a smell, not a tool.** In this codebase it has almost always meant a declaration was lying rather than a type being inexpressible — fix the signature first. The one case that genuinely needs care: d3's `Selection` is invariant in all four type parameters, so no single type — not `BaseType`, not `any` in the datum slot, not a union — accepts every selection. A function taking "any selection" must be **generic over d3's four parameters**; see `textWrap`, `ensureDefsElement`, `createSvgLayer`. `rg 'as unknown as' src` should stay near-empty.
- No `@ts-ignore`. `@ts-expect-error` with a one-line reason if truly stuck.

### Documentation

- Every module should open with `@module sszvis/<path>`, barrels included. Not all do yet; add the tag to any file you touch that is missing it.
- JSDoc carries **prose, not types** — no `@param {Type}`; TypeScript owns types. Document units, defaults, and behavioural quirks instead.
- Examples in JSDoc use `const`.
- Every component needs a working example in `apps/docs/docs/`.

## Testing

Vitest in browser mode (Playwright/Chromium) — tests run against real DOM/SVG. Test files are `packages/sszvis/test/**/*.test.{js,ts}`. Playwright snapshots in `packages/sszvis/test/snapshot/snapshot.spec.js` compare every docs example in `apps/docs/dist`, including interactive states, against stored screenshots.

No feature is complete without tests. When pinning existing behaviour that looks wrong, keep it and mark it `// NOTE:` as a known quirk rather than silently fixing it.

## Error handling

Errors are thrown directly; graceful handling is a future enhancement. Use `sszvis.loadError` for data-loading failures:

```js
d3.csv("data.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError);
```

Validate before use: check DOM elements exist, check data extents before building scales, and use fallbacks for NaN.

## Git

Branches: `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, off `master`.

Conventional commits — `<type>: <subject>`, types `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Keep the subject bare; add a `(<scope>)` only when it disambiguates a change that would otherwise read ambiguously (`fix(fn): …`). Explain _why_ in the body. Reference issues in the PR description as a checkbox `closes` list, not in the commit footer.

**Never mention coding agents or AI authorship in commit messages.**

## Local Source References

`.reference/` contains cloned repos (git ignored). Search these for implementation details before guessing:

- `.reference/d3charts-website/` -- all sszvis charts in production
- `.reference/d3/` -- d3 source and docs

If missing, clone:

- <https://github.com/StatistikStadtZuerich/d3charts-website>
- <https://github.com/d3/d3>

## When in doubt

Ask rather than guess. Verify file paths and module names before using them.
