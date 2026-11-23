# sszvis

The **Statistik Stadt Zürich Visualization Library** — a [d3](https://d3js.org)-based
set of composable charting components for the statistical publications of the City of
Zürich — and the monorepo that builds it.

[Documentation & examples](https://statistikstadtzuerich.github.io/sszvis/) ·
[`sszvis` on npm](https://www.npmjs.com/package/sszvis) ·
[Changelog](packages/sszvis/CHANGELOG.md)

**If you want to _use_ sszvis**, read the
[documentation site](https://statistikstadtzuerich.github.io/sszvis/) or the
[package README](packages/sszvis#readme). This file is for people working _on_ the
library.

## Contents

| Path                         | Package                   | What it is                                                    |
| ---------------------------- | ------------------------- | ------------------------------------------------------------- |
| `packages/sszvis`            | `sszvis` (published)      | The library. TypeScript source, bundled with Rollup.          |
| `packages/geodata`           | `@sszvis/geodata`         | Swiss geographic sources + the TopoJSON pipeline.             |
| `packages/chart-builder`     | `@sszvis/chart-builder`   | The chart builder's recipes, templates and code generation.   |
| `packages/config-typescript` | `@repo/config-typescript` | Shared `tsconfig` bases.                                      |
| `apps/docs`                  | `@sszvis/docs`            | The documentation site (React Router + MDX), on GitHub Pages. |
| `apps/regression-cli`        | `@sszvis/regression-cli`  | Consumer visual-regression harness against production charts. |
| `apps/mcp-server`            | `@sszvis/mcp-server`      | Prototype MCP server for the chart builder.                   |
| `contrib`                    | —                         | Example projects and experiments.                             |

> **Note on READMEs.** `packages/sszvis/README.md` is what npm shows for the published
> package — it must stand on its own, with absolute links, and must not describe the
> monorepo's build. This file is the repository's front door. Keep the two distinct;
> conflating them is how the npm page went stale after the monorepo migration.

`AGENTS.md` is the detailed working reference (commands, conventions, gotchas) and is
kept more current than this file.

## Getting started

The dev environment is [Nix](https://nixos.org) + direnv. Set up Nix
([internal notes](https://www.notion.so/interactivethings/Nix-0ca972e50d424f5992e2f4a7b173e19b)),
then:

```sh
nix develop
```

Node >= 22 and [pnpm](https://pnpm.io) 9 are required; tasks are orchestrated with
[Turborepo](https://turborepo.com).

```sh
# Install every workspace, plus the browsers the tests drive
pnpm install
pnpm --filter sszvis exec playwright install

# Docs server on http://localhost:8000 (builds its dependencies first)
pnpm run dev

# Rebuild the library on change, in a second shell
pnpm --filter sszvis run build:watch
```

## Commands

Root commands fan out across workspaces; `--filter` targets one.

| Task                  | Command                                                           |
| --------------------- | ----------------------------------------------------------------- |
| Build everything      | `pnpm run build`                                                  |
| Build the library     | `pnpm --filter sszvis run build`                                  |
| Build the docs        | `pnpm --filter @sszvis/docs run build`                            |
| Rebuild the topo data | `pnpm run build:topo`                                             |
| Unit tests            | `pnpm run test`                                                   |
| Single test file      | `pnpm --filter sszvis exec vitest run test/component/bar.test.ts` |
| Visual regression     | `pnpm run test:snapshot` (serves the built docs itself)           |
| Type check            | `pnpm run type-check`                                             |
| Lint + format check   | `pnpm run check`                                                  |
| Autofix               | `pnpm run lint:fix && pnpm run format`                            |

CI runs `check`, `type-check`, `test` and the snapshot suite; all four must pass.

The library's unit tests run in a real browser (Vitest browser mode via
Playwright/Chromium), which is why `playwright install` is a one-time requirement;
`@sszvis/regression-cli`'s run in plain Node. Test paths are relative to the package,
not the repository root.

Build outputs are disjoint: the library writes to `packages/sszvis/build`, the
TopoJSON bundles to `packages/geodata/dist`, and the docs site to
`apps/docs/build/client`. The docs build copies `sszvis.js`, `sszvis.css` and the topo
bundles into each example page from those builds.

`sszvis.css` is part of the library — consumers need it — so it lives at
`packages/sszvis/src/sszvis.css`, and rollup emits it into `build/` as an asset (the
`emitStylesheet` plugin in `rollup.config.mjs`, which also registers it as a watched
file). It sat in the previous docs site's source until the monorepo split and only
reached npm because the docs used to build into the library's `build/` directory.

## Documentation

The site in `apps/docs` is a [React Router](https://reactrouter.com) app whose pages
are MDX under `apps/docs/app/content`, registered in `app/content-pages.ts`. Each
example is a folder `apps/docs/examples/<chart>/<name>/` holding `chart.ts`,
`example.json` and its data; the build turns it into a standalone page at
`/preview/<chart>/<name>/`, which the docs embed and the snapshot suite screenshots.
See [`apps/docs/examples/README.md`](apps/docs/examples/README.md).

## Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets): every
pull request that changes the library carries a changeset (`pnpm changeset`), a
"chore: version packages" pull request accumulates them, and merging it publishes
`sszvis` to npm from CI. The version and changelog are never edited by hand, and
`pnpm version` at the root is deliberately wired to fail. See the Releasing section of
[`AGENTS.md`](AGENTS.md) for the full sequence.

## License

BSD-3-Clause. sszvis can be used freely, but no support is provided by Statistik Stadt
Zürich.

Contact: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
