# How to bump development dependencies

Development dependencies can be bumped whenever convenient. They fall into two
groups, and the checks differ.

- **Tools that only check code**, such as oxlint, oxfmt, Vitest, Playwright and
  Effect. A bump cannot change what consumers receive.
- **Tools that build the bundle**: TypeScript, Rollup and its plugins, Babel and
  Terser, all in `packages/sszvis/package.json`. A bump can change `sszvis.js`,
  `sszvis.min.js` or the type declarations without any test noticing.

1. Bump the dependency.
2. If you used `pnpm add`, check the `pnpm-lock.yaml` diff. `pnpm add` re-resolves the
   tools pinned to `latest`. See
   [pitfalls.md](../pitfalls.md#pnpm-add-re-resolves-the-latest-tools).
3. Run `pnpm run check`, `pnpm run type-check` and `pnpm test`.
4. If you bumped a tool that builds the bundle, also check the output:
   1. Build the library before and after the bump, and diff
      `packages/sszvis/build/sszvis.js` and `packages/sszvis/build/sszvis.d.ts`.
   2. Run the snapshot suite with `pnpm run test:snapshot`.
   3. If the bundle changed in more than formatting, run the
      [consumer chart check](check-consumer-charts.md).
5. If you bumped `@playwright/test`, regenerate the PNG snapshot baselines in the
   container image of the new version, as `AGENTS.md` describes under "Testing". The
   baselines belong to one image version.

The runtime dependencies of `packages/sszvis` are not development dependencies. Do
not bump `d3` or `immer` this way. See [How to upgrade d3](upgrade-d3.md).
