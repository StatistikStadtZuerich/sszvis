# Statistik Stadt Zürich Visualization Library

sszvis can be installed from npm or embedded in a script tag. Please refer to the [interactive documentation](https://statistikstadtzuerich.github.io/sszvis/) for instructions.

## Documentation

The documentation is written in Markdown and bundled with [Catalog](https://www.catalog.style/).

## Development

To get started, you first need to [setup Nix](https://www.notion.so/interactivethings/Nix-0ca972e50d424f5992e2f4a7b173e19b).

To run the development shell:

```bash
nix develop
```

This repository is a [pnpm](https://pnpm.io/) + [Turborepo](https://turborepo.com/) monorepo:

```txt
apps/docs          # 11ty documentation site (@sszvis/docs)
packages/sszvis    # the published library, bundled with Rollup
packages/geodata   # Swiss geographic source data + the TopoJSON pipeline
scripts            # the visual-regression harness
contrib            # example projects and experiments
```

```sh
# Install dependencies for every workspace
pnpm install

# Build the library and the docs site (turbo builds the library first)
pnpm run build

# Start the docs server on http://localhost:8000
pnpm --filter @sszvis/docs run dev

# Rebuild the library on change
pnpm --filter sszvis run build:watch
```

### Building

sszvis builds are automated. You don't have to run build tasks for publishing but you may need them for developing the library:

```sh
# Build every workspace
pnpm run build

# Build only the library
pnpm --filter sszvis run build

# Build only the docs site
pnpm --filter @sszvis/docs run build

# Rebuild the topojson bundles from the geo sources
pnpm run build:topo
```

The library writes to `packages/sszvis/build`, the TopoJSON bundles to
`packages/geodata/dist`, and the docs site to `apps/docs/dist`. The docs site copies
`sszvis.js` and the topo bundles in from those builds, so nothing shares an output
directory any more.

### Testing

```sh
# Unit tests (Vitest in browser mode)
pnpm run test:unit

# Visual regression: build first, then serve the docs and screenshot every example
pnpm run build
pnpm --filter @sszvis/docs run serve   # in one shell
pnpm run test:snapshot                 # in another
```

## Deploying

Create a new version and push it, it will then be automatically deployed to NPM using GitHub Actions.

```sh
pnpm --filter sszvis version minor
git push --follow-tags
```

## License

sszvis is published under the BSD-3-Clause license. sszvis can freely be used but no support will be provided by Statistik Stadt Zürich.

## Contact

E-Mail: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
