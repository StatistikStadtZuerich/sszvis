# Statistik Stadt Zürich Visualization Library

sszvis can be installed from npm or embedded in a script tag. Please refer to the [interactive documentation](https://statistikstadtzuerich.github.io/sszvis/) for instructions.

## Documentation

The documentation is written in Markdown and bundled with [Catalog](https://www.catalog.style/).

## Development

This library is bundled using [Rollup](https://rollupjs.org/). To start developing, install dependencies using npm first.

```sh
# Install dependencies first
npm install

# Start library build in watch mode
npm run build -- --watch

# Start Catalog documentation server
npm start
```

### Building

sszvis builds are automated. You don't have to run build tasks for publishing but you may need them for developing the library:

```sh
# Build everything necessary for publishing
npm run build

# Build the library
npm run build-lib

# Build topojson files
npm run build-topo

# Build documentation
npm run build-docs
```

## License

sszvis is published under the BSD-3-Clause license. sszvis can freely be used but no support will be provided by Statistik Stadt Zürich.

## Contact

E-Mail: [statistik@zuerich.ch](mailto:statistik@zuerich.ch)
