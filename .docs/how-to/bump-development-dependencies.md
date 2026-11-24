# How to bump development dependencies

Tooling such as oxlint, oxfmt, Playwright, Vitest, TypeScript and Effect can be
bumped whenever convenient. These bumps improve the development setup and do not
reach consumers.

1. Bump the dependency.
2. If you used `pnpm add`, check the `pnpm-lock.yaml` diff. `pnpm add` re-resolves the
   tools pinned to `latest`. See
   [pitfalls.md](../pitfalls.md#pnpm-add-re-resolves-the-latest-tools).
3. Run `pnpm run check`, `pnpm run type-check` and `pnpm test`.
4. If you bumped `@playwright/test`, regenerate the PNG snapshot baselines in the
   container image of the new version, as `AGENTS.md` describes under "Testing". The
   baselines belong to one image version.

The runtime dependencies of `packages/sszvis` are not development dependencies. Do
not bump `d3` or `immer` this way. See
[How to upgrade d3](upgrade-d3.md).
