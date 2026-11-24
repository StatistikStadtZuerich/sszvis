# Decisions

Why the repository is the way it is. Each entry gives the context, the decision and
what it means for your work. Read
[How consumers load sszvis](explanation/how-consumers-load-sszvis.md) first. Many of
these decisions follow from it.

## No new runtime or peer dependencies

**Context.** The main consumer agrees in advance which files and dependencies its
charts load, and its security review checks them.

**Decision.** sszvis adds no runtime or peer dependencies. d3 is the only peer
dependency, imported as the whole `d3` barrel. Rollup bundles the existing runtime
dependencies into `sszvis.js`.

**Consequences.** A new dependency is a question for the consumer, not an
engineering decision. If a consumer needs something extra, document it in the
package README. The supported d3 version changes only by agreement. See
[How to upgrade d3](how-to/upgrade-d3.md).

## TypeScript for the source

**Context.** The library was plain JavaScript for most of its life. The consumer
receives only the built `sszvis.js`, so nothing downstream needed TypeScript.

**Decision.** `packages/sszvis/src` was ported to TypeScript for the developers.
Everyone who works on the repository works in TypeScript elsewhere, and the monorepo
should use one language throughout.

**Consequences.** The types serve maintainers first. A type error that the port
exposed is often a real bug in long-standing behavior. Fix such bugs carefully,
because consumers may depend on them. See
[pitfalls.md](pitfalls.md#fixing-a-bug-can-break-a-chart).

## Immer in `sszvis.app`

**Context.** `sszvis.app` updates state through Immer drafts. An earlier maintainer
preferred Immer at a time when JavaScript had no easy way to write immutable updates.

**Decision.** Immer is legacy. It stays only because nobody has removed it.

**Consequences.** Immer could go. Removing it changes a dependency the consumer
agreed to, and it changes how every example writes its actions. Treat its removal as
a planned change, not a cleanup.

## Monorepo with pnpm and Turborepo

**Context.** The repository used to be one flat folder. The library, the docs and
the tooling depended on each other, which made it hard to build new tools next to the
library.

**Decision.** In September 2026 the repository became a pnpm and Turborepo
workspace. The library, the geodata and the chart builder are packages. The docs
site, the regression harness and the MCP server are apps.

**Consequences.** An experiment lives in its own package or app and cannot leak into
the library. Only `packages/sszvis` is published.

## A chart builder that emits code

**Context.** A consumer chart is raw HTML and JavaScript, with no runtime besides
sszvis and d3.

**Decision.** The chart builder (`packages/chart-builder` and
`apps/docs/app/builder`) generates a chart's source code. It does not define a spec
format with a renderer that interprets it.

**Consequences.** The builder's output is exactly what runs in production, so the
builder also tests that the library renders the way consumers use it. A spec
renderer would be a second implementation to ship to the consumer and keep in step
with the first. The builder is experimental. Its README has its status.

## The docs site moved from Catalog to React Router and MDX

**Context.** The first docs site ran on Catalog, a documentation library that
Interactive Things maintained and no longer does. Keeping it running became a
burden.

**Decision.** The docs became a Vite and React Router application with MDX pages, so
a page can embed React components and interactive widgets. An interim 11ty site was
removed in November 2026 once the React Router site replaced it.

**Consequences.** `apps/docs/app/lib/legacy-paths.ts` redirects the old Catalog
`#/<slug>` URLs. Keep the redirects, because external links to the old site still
exist.

## One tool per job

**Context.** The toolchain had grown a separate library for linting, formatting,
unit tests and browser tests. Each had its own configuration and its own upgrades.

**Decision.** oxlint and oxfmt replaced Biome and the tools before it, across the
whole monorepo. Vitest in browser mode runs the library's unit tests in real
Chromium, so the whole repository uses one test runner.

**Consequences.** Only oxlint's `correctness` rules fail the build. Some Biome rules
have no oxlint equivalent yet, and `AGENTS.md` lists the ones to follow by hand.
Browser-mode tests need `playwright install` once after cloning.

## TypeScript 7 and the tsgo patch

**Decision.** The repository uses TypeScript 7 (`tsgo`). The root `postinstall`
script runs `effect-tsgo patch --typescript`, which adds Effect's language-service
checks to tsgo.

**Consequences.** TypeScript 7 was worth the upgrade by itself. The patch exists for
`apps/regression-cli` and `apps/mcp-server`. If those apps go, the patch can go with
them.

## Effect only in the tooling apps

**Decision.** `apps/regression-cli` and `apps/mcp-server` use Effect v4. That is a
maintainer's preference for building applications. Both apps are developer tooling
or experiments.

**Consequences.** Effect is not a library dependency and must not become one. You do
not need Effect to work on sszvis. If the Effect apps become a burden, rewrite them
or delete them. The library does not change.

## Snapshot baselines come from Linux

**Context.** Most development happens on macOS. CI runs in a Linux container on
GitHub Actions. The two systems render text with different fonts, so a baseline made
on a Mac does not match what CI renders. Sometimes the difference exceeds the
tolerance. Sometimes it stays under the tolerance and hides a real change.

**Decision.** The PNG baselines come from the Playwright Linux container that matches
the installed `@playwright/test`. Chromium, Firefox and WebKit share them at a 5%
pixel tolerance. Map pages also get `*-map.txt` baselines with element and texture
counts, which are the same on every platform.

**Consequences.** Never regenerate a PNG baseline on a Mac. A Playwright bump means
new baselines from the new container image. `AGENTS.md`, section "Testing", has the
steps.

## Changesets and npm trusted publishing

**Decision.** Every change to the library carries a changeset, so the changelog and
the version follow from the changes. The release workflow publishes with npm trusted
publishing over OIDC, with no token.

**Consequences.** See [How a release flows](explanation/how-a-release-flows.md).

## Semver and backwards compatibility

**Decision.** sszvis follows semver strictly and avoids breaking changes. A replaced
API is deprecated first and removed only in the next major release, after the
consumer charts have moved to the replacement.

**Consequences.** No formal policy exists beyond this. See
[How to deprecate a public API](how-to/deprecate-a-public-api.md).

## Browser support follows the major release

**Decision.** sszvis targets Baseline Widely available as of its current major
release. Ten years ago that meant Internet Explorer. Today it means the browsers of
August 2024. See [supported environments](reference/supported-environments.md).

## The GitLab issue is a placeholder

Issue #37, "move to GitLab", records that the repository might have to move. It is
not a plan. Do not shape anything around it yet.
