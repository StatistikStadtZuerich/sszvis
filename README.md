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

| Path                         | Package                    | What it is                                             |
| ---------------------------- | -------------------------- | ------------------------------------------------------ |
| `packages/sszvis`            | `sszvis` (published)       | The library. TypeScript source, bundled with Rollup.   |
| `packages/geodata`           | `@sszvis/geodata`          | Swiss geographic sources + the TopoJSON pipeline.      |
| `packages/config-typescript` | `@repo/config-typescript`  | Shared `tsconfig` bases.                               |
| `apps/docs`                  | `@sszvis/docs`             | The 11ty documentation site, deployed to GitHub Pages. |
| `apps/project-specimen`      | `@sszvis/project-specimen` | Catalog widget the docs homepage embeds.               |
| `scripts`                    | —                          | Visual-regression harness.                             |
| `contrib`                    | —                          | Example projects and experiments.                      |

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
| Visual regression     | `pnpm run test:snapshot` (starts the docs server itself)          |
| Type check            | `pnpm run type-check`                                             |
| Lint + format check   | `pnpm run check`                                                  |
| Autofix               | `pnpm run lint:fix && pnpm run format`                            |

CI runs `check`, `type-check`, `test` and the snapshot suite; all four must pass.

The library's unit tests run in a real browser (Vitest browser mode via
Playwright/Chromium), which is why `playwright install` is a one-time requirement;
`@sszvis/regression-cli`'s run in plain Node. Test paths are relative to the package,
not the repository root.

Build outputs are disjoint: the library writes to `packages/sszvis/build`, the
TopoJSON bundles to `packages/geodata/dist`, and the docs site to `apps/docs/dist`.
The docs site copies `sszvis.js`, `sszvis.css` and the topo bundles in from those
builds.

`sszvis.css` is part of the library — consumers need it — so it lives at
`packages/sszvis/src/sszvis.css`, and rollup emits it into `build/` as an asset (the
`emitStylesheet` plugin in `rollup.config.mjs`, which also registers it as a watched
file). It sat in `apps/docs/docs/` until the monorepo split and only reached npm
because the docs used to build into the library's `build/` directory.

## Documentation

The site is built with [11ty](https://www.11ty.dev/) from `apps/docs`. Each chart type
is a directory under `apps/docs/docs/` with a `README.md` and runnable `.html`/`.js`
examples; [Catalog](https://www.catalog.style/) is the client-side shell that renders
the index and the source viewers. Adding an example means adding files there — the
snapshot suite picks them up automatically.

## Releasing

Versioning happens in `packages/sszvis`, never at the root, and pushing the tag
triggers the npm publish workflow.

```sh
pnpm --filter sszvis exec npm --no-git-tag-version version minor
git tag v$(node -p "require('./packages/sszvis/package.json').version")
git push --follow-tags
```

`pnpm version` at the root is deliberately wired to fail. See the Releasing section of
[`AGENTS.md`](AGENTS.md) for the full sequence and the reasoning.

## License

BSD-3-Clause. sszvis can be used freely, but no support is provided by Statistik Stadt
Zürich.

Contact: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
