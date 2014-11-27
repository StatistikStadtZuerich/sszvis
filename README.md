# Statistik Stadt Zürich Visualization Library

Most users will use the ready-to-use code in `sszvis.js` and `sszvis.css` in the root of this project to get started. If you want to contribute to this library, however, read on.

## Documentation

To read the documentation with all examples, open `index.html` in a browser. You can also read the documentation directly in `docs`. All source code in `sszvis` is documented, too, if you need to know the details.

## Dependencies

This library doesn't have any outside dependencies and doesn't require any special tooling to build. The major build step necessary is to concatenate all Javascript files in `sszvis` into a single file.

To simplify development, we use GNU Make and some helpful libraries on Mac OS X. If you need to develop on another system, check the `Makefile` for the list of files that need to be concatenated.

## Installation

If you want to use the build system we have put in place, make sure you have the following software installed.

To build:

* [GNU Make](https://www.gnu.org/software/make/manual/make.html)

To build and run a development server:

* [fswatch](http://emcrisostomo.github.io/fswatch/)
* [browser-sync](http://www.browsersync.io/)

To build maps:

* [topojson](https://github.com/mbostock/topojson)

## Development

Build the project with

    make build

Start a development server on http://localhost:3000 to automatically rebuild and push changes to the browser:

    make server

Update the maps with

    make maps
