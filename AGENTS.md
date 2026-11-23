# AGENTS.md

Authoritative instructions for coding agents working on SSZVIS, the D3-based data visualization library for Statistik Stadt Zürich. Prefer this file over `README.md`. Keep it current when commands, structure, or conventions change.

## Commands

This is a pnpm + Turborepo monorepo. Root commands fan out across workspaces; use
`--filter` to target one.

| Task                | Command                                                           |
| ------------------- | ----------------------------------------------------------------- |
| Install             | `pnpm install && pnpm --filter sszvis exec playwright install`    |
| Test (all)          | `pnpm test`                                                       |
| Test (unit, all)    | `pnpm run test` (every package's unit tests, not snapshots)       |
| Test (one file)     | `pnpm --filter sszvis exec vitest run test/component/bar.test.ts` |
| Test (in a browser) | `pnpm --filter sszvis exec vitest --browser.headless=false`       |
| Test (watch)        | `pnpm --filter sszvis run test:watch`                             |
| Chart builder tests | `pnpm --filter @sszvis/chart-builder test` (node, then browser)   |
| Visual regression   | `pnpm run test:snapshot` (serves the built docs itself)           |
| Type check          | `pnpm run type-check` (tsc over `src/` **and** `test/`)           |
| Lint                | `pnpm run lint` (oxlint)                                          |
| Format              | `pnpm run format` (oxfmt)                                         |
| Lint + format check | `pnpm run check`                                                  |
| Autofix             | `pnpm run lint:fix && pnpm run format`                            |
| Docs server         | `pnpm run dev` (port 8000)                                        |
| Library watch       | `pnpm --filter sszvis run build:watch`                            |
| Full build          | `pnpm run build`                                                  |
| Rebuild topo data   | `pnpm run build:topo`                                             |
| Consumer regression | `pnpm run regression` (needs `.reference/d3charts-website`)       |
| Regression sweep    | `pnpm run regression:crawl` (headless, writes a JSON report)      |
| Regression export   | `pnpm run regression:export` (shareable static folder)            |
| MCP server          | `pnpm --filter @sszvis/mcp-server start` (port 9009, `/mcp`)      |
| Search              | `rg "pattern"` — always ripgrep, never grep/find                  |

CI runs `check`, `type-check`, `test`, and the snapshot suite; all four must pass.
The publish workflow re-runs the first three (not snapshots) before publishing from
`packages/sszvis`. Nothing re-runs them on a local publish except
`prepublishOnly`, which builds but does not test.

Test paths passed to `vitest` are relative to `packages/sszvis`, not the repo root.
The same holds for every package: a `--filter` command runs in that package's directory.
The library's unit tests run in a real browser (Vitest browser mode, Playwright/Chromium), so
`playwright install` is required once after cloning. `@sszvis/regression-cli`'s tests are plain
Node and need no browser. Tests import from `src/` directly; the only shared test code is
`test/support/`, which holds parameterised conformance suites for contracts every component in a
family shares (the d3 join, for instance). Fixtures and setup stay local to each test file.

Only `correctness` lint rules fail the build. `suspicious` and `perf` rules are
advisory and there is a standing backlog of ~34 warnings (mostly `no-shadow`), so
check that a warning is _yours_ before acting on it.

Dev environment is Nix + direnv (`nix develop`); pnpm is the package manager.

## Layout

```txt
apps/
  docs/              # @sszvis/docs - React Router + MDX documentation site
    app/content/     #   MDX pages, registered in app/content-pages.ts
    app/builder/     #   the chart builder's form, worker and preview (experimental, unlinked)
    examples/        #   one dir per example: chart.ts, data.csv, example.json
    build/client/    #   static output, deployed to GitHub Pages
  regression-cli/    # @sszvis/regression-cli - consumer regression harness (Effect v4 CLI)
    src/commands/    #   serve, crawl, export
  mcp-server/        # @sszvis/mcp-server - prototype MCP server for the chart builder (Effect McpServer)
packages/
  sszvis/          # the published library
    src/           # 100% TypeScript
    test/          # unit tests + test/snapshot (Playwright)
    build/         # rollup + tsc output, what npm publishes
  geodata/         # @sszvis/geodata — Swiss geo source data + the topo pipeline
    src/           #   GeoJSON/CSV sources
    topo.sh        #   pipeline
    dist/topo/     #   the four TopoJSON bundles
  chart-builder/   # @sszvis/chart-builder — spec in, chart code out (private)
    src/recipes/   #   one dir per chart type: recipe.ts, chart.ts, a .tmpl per feature
    test/          #   emission baselines, generated-code type-check, browser mark counts
  config-typescript/ # shared tsconfig base (@repo/config-typescript)
contrib/           # example projects and experiments
```

Every build writes to its own directory — `packages/sszvis/build`,
`packages/geodata/dist`, `apps/docs/build/client`. The docs build reads `sszvis.js`,
`sszvis.css` and the TopoJSON bundles from the first two (turbo builds them first)
and emits them beside the example pages, at `/preview/_assets/…` and
`/preview/_static/topo/…`; they are build output, not committed files.

`.github/workflows/gh-pages.yml` builds `apps/docs` for the `/sszvis/` base
(`DOCS_BASE`) and deploys `apps/docs/build/client`, with the library bundles and
the TopoJSON also copied to the site root (`/sszvis.js`, `/topo/…`) for consumers
that load them from there. The previous Catalog site's `#/<slug>` URLs redirect
through `app/lib/legacy-paths.ts`.

The chart builder is split in two. `@sszvis/chart-builder` turns a spec into a
chart's files and owns the recipes and their templates; `apps/docs/app/builder`
is the form around it. Each has a README, and the package's is the reference for
recipes, templates and the spec. The package exports each module as TypeScript
source by an explicit subpath (no barrel, no build step), so a new public module
needs an `exports` entry. Its `generate` loads prettier, about 1.2MB: keep it off
any module a page imports eagerly — `apps/docs/app/builder/boundary.test.ts`
checks that for the builder.

## Adding a docs example

1. Create `apps/docs/examples/<chart-type>/<name>/` with `chart.ts`, `example.json`
   and its data, copying an existing example. The `sszvis-styleguide` skill is the
   house style; `apps/docs/examples/README.md` explains how a folder becomes a page.
2. Put it on a page with `<Example id="<chart-type>/<name>" />` in the chart type's
   MDX under `apps/docs/app/content/`. An id with no folder fails the build.
3. Generate its snapshot baselines (see "Testing"): the suite picks the new page up
   automatically and fails it until they exist.

The dev server discovers new example folders without a restart.

## Changesets

Every pull request that changes `packages/sszvis/src` carries a changeset. Run
`pnpm changeset`, choose the bump, and write one user-facing sentence; commit the
`.changeset/*.md` file it writes with the rest of the branch. The `Changeset` job
in `.github/workflows/check.yml` fails a pull request that needs one and has none
— label it `no-changeset` when the change genuinely reaches no consumer.

Choose the bump from what a consumer sees, not from the size of the diff:

- **patch** — a fix, an internal change, a dependency bump
- **minor** — a new component, property or export
- **major** — anything that makes existing chart code stop working

Write the summary for someone upgrading, in the voice the changelog already uses:
`add an ariaLabel property to sszvis.buttonGroup`, not `feat: aria label`. Only
`sszvis` is publishable, so it is the only package a changeset can name.

## Releasing

Only `packages/sszvis` is published, and the release is driven by Changesets — the
version and the changelog are never edited by hand. Never run `pnpm version` at the
repo root: it writes a fabricated version into the private root manifest and creates
a tag that matches the publish trigger. The root has a `version` script that refuses,
as a guard.

1. Merge pull requests as usual, each with its changeset.
2. `.github/workflows/release.yml` runs on every push to `master` and keeps a
   **"chore: version packages"** pull request open, showing the version the
   pending changesets add up to and the changelog they produce.
3. Release by merging that pull request. It bumps `packages/sszvis/package.json`,
   writes `packages/sszvis/CHANGELOG.md` and deletes the consumed changesets.
   Edit its changelog section before merging when a release deserves more than
   the accumulated bullets — 3.5.0 is the example to follow.
4. The next `release.yml` run sees no changesets and an untagged version, so its
   `publish` job checks, type-checks, unit-tests, builds and publishes with
   `npm publish --provenance`, then tags `v<version>` and creates the GitHub
   release.
5. Confirm at <https://www.npmjs.com/package/sszvis>, including the provenance badge.

Publishing uses npm OIDC trusted publishing — no `NPM_TOKEN`. `pnpm publish` and
`changeset publish` cannot do the OIDC exchange and would silently drop provenance,
so the workflow uses `npm` directly.

`release.yml` is the only workflow that publishes, and its publish steps are
inlined rather than factored into a reusable workflow. npm matches the OIDC token
against the workflow registered as the package's trusted publisher, and a
`workflow_call` presents the caller's workflow reference instead, so the exchange
fails and npm rejects the anonymous publish with a 404. The trusted publisher on
npmjs.com must name `release.yml`; renaming or moving the file breaks publishing
until that setting is updated to match.

There is no tag-triggered or manual publish workflow. If the automated path is
broken, publish from a clean checkout by hand.

The changelog lives at `packages/sszvis/CHANGELOG.md` — with the package it
describes, so it ships to npm. The docs site imports it into its `/changelog` page
(`apps/docs/app/content/changelog.mdx`), so the page updates with every release.

## Philosophy

- **KISS** — choose the straightforward solution.
- **YAGNI** — build what is needed now, not what might be needed.
- **Functional composition over OOP** — see `sszvis.compose(f, g)(x) === f(g(x))`.
- **Responsive-first** — components take breakpoint values via `responsiveProps()`.
- **Accessible** — charts provide fallbacks; `createSvgLayer` writes title/desc.
- **Pure functions** — this library prefers computation over effects.

## Structure

`packages/sszvis/src/` is 100% TypeScript. `packages/sszvis/test/` is TypeScript apart from the Playwright suite, `test/snapshot/snapshot.spec.js`.

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
```

(Paths above are relative to `packages/sszvis/`. For the repository layout see
"Layout" above.)

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

**State/actions** — docs examples run through `sszvis.app({ init, actions, render })`: actions update an Immer draft of `state`, and the app re-renders on the next frame.

## TypeScript conventions

oxlint enforces the correctness category and a curated set of `unicorn`/`typescript`/`import` rules. Run `pnpm run check`; do not restate those rules here. What follows is what tooling **cannot** check.

Note: the Biome rules that enforced `.js` import extensions, `import type`, `T[]` array syntax and no non-null `!` have no oxlint equivalent yet. Keep following them by hand — relative imports **must** carry the `.js` extension, because the package ships ESM.

### Module shape

- Chart modules (`component/`, `annotation/`, `legend/`, `control/`, `map/renderer/`, `maps/`) **default-export their factory**. Utility modules (`fn`, `color`, `format`, `scale`, `crisp`, `bounds`, …) use **named exports only**. Never mix the two in one file.
- Default exports **should be named**, so stack traces and symbol search work: `export default function bar<T = unknown>(): BarComponent<T>` rather than `export default function <T = unknown>()`. A handful of factories are still anonymous, carried over wholesale by the port — `rg 'export default function *\(' packages/sszvis/src` lists them. Name them as you touch them; do not add new anonymous ones.
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

- `$IntentionalAny` (in `types.ts`) is the only sanctioned `any`. Use it solely where a type genuinely cannot be expressed — d3 internals, variadic combinators, the untyped component core — and always with a comment saying which. `rg '\$IntentionalAny' packages/sszvis/src` lists every hatch; keep the list short and defensible. Lint-ignore comments are similarly rare — `rg 'oxlint-disable' packages/sszvis/src` should stay a short, individually justified list.
- Prefer `unknown` and narrow.
- **`as unknown as X` is a smell, not a tool.** In this codebase it has almost always meant a declaration was lying rather than a type being inexpressible — fix the signature first. The one case that genuinely needs care: d3's `Selection` is invariant in all four type parameters, so no single type — not `BaseType`, not `any` in the datum slot, not a union — accepts every selection. A function taking "any selection" must be **generic over d3's four parameters**; see `textWrap`, `ensureDefsElement`, `createSvgLayer`. `rg 'as unknown as' packages/sszvis/src` should stay near-empty.
- No `@ts-ignore`. `@ts-expect-error` with a one-line reason if truly stuck.

### Documentation

- Every module should open with `@module sszvis/<path>`, barrels included. Not all do yet; add the tag to any file you touch that is missing it.
- JSDoc carries **prose, not types** — no `@param {Type}`; TypeScript owns types. Document units, defaults, and behavioural quirks instead.
- Examples in JSDoc use `const`.
- Every component needs a working example in `apps/docs/examples/`.

## Testing

Vitest in browser mode (Playwright/Chromium) — tests run against real DOM/SVG. Test files are `packages/sszvis/test/**/*.test.{js,ts}`. Playwright snapshots in `packages/sszvis/test/snapshot/snapshot.spec.js` compare every docs example, including each button-group state, against stored screenshots. The suite globs the example pages in `apps/docs/build/client/preview/` and serves that build with `vite preview` on port 4173, so it needs `pnpm run build` first (`pnpm run test:snapshot` has turbo do it).

The PNG baselines are shared by Chromium, Firefox and WebKit at a 5% pixel tolerance, and they must come from Linux: a Mac rasterizes text differently. Generate them in the Playwright image that matches `@playwright/test` (`mcr.microsoft.com/playwright:v<version>-noble`), from a worktree of the branch alone rather than the GitButler workspace, serving `apps/docs/build/client` with a static server on 4173 inside the container and running `npx playwright test --update-snapshots=changed -g "<page>"` there. The container's fonts differ slightly from the CI runner's — about 1% of pixels on a text-heavy chart — which the tolerance absorbs; check the result with all three browsers at that tolerance before committing.

Map pages also get a `*-map.txt` baseline next to their PNG: per map layer, how many elements it draws, how many carry the missing-value texture, and how many distinct fills. The screenshot cannot see that texture — its light grey hatch falls inside the comparator's per-pixel colour tolerance, so a map that textures every district passes its PNG. Unlike the PNGs, these text baselines are platform-independent, so they may be generated on any machine: `pnpm --filter sszvis exec playwright test -g "<page>" --update-snapshots=changed`, then review the diff like code. That flag rewrites any failing PNG too — commit only the `.txt` files it touched.

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
