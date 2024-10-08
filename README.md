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

This library is bundled using [Rollup](https://rollupjs.org/). To start developing, install dependencies using npm first.

```sh
# Install dependencies first
npm install

# Build the library (if necessary use export `NODE_OPTIONS=--openssl-legacy-provider`)
npm run build

# Start library build in watch mode (this only rebuilds library scripts, not things like topojson)
npm run build:watch

# Start Catalog documentation server
npm start
```

### Building

sszvis builds are automated. You don't have to run build tasks for publishing but you may need them for developing the library:

```sh
# Build everything necessary for publishing (if necessary use export `NODE_OPTIONS=--openssl-legacy-provider`)
npm run build

# Build the library
npm run build:lib

# Build topojson files
npm run build:topo

# Build documentation
npm run build:docs
```

### Testing

```sh
# Start the server from which the screenshots should be taken
npm start

# Run all tests
npm test

# Or run individual tests
npm run test:snapshot
```

## Deploying

Create a new version and push it, it will then be automatically deployed to NPM using GitHub Actions.

```sh
npm version minor
git push --follow-tags
```

## License

sszvis is published under the BSD-3-Clause license. sszvis can freely be used but no support will be provided by Statistik Stadt Zürich.

## Contact

E-Mail: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
