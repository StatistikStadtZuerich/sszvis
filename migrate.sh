#!/bin/sh
set -eo pipefail

git checkout HEAD -- sszvis/
yarn run jscodeshift -- sszvis -t ./migrate.js
yarn run rollup -- --config ./config/rollup/sszvis.js

ls -lah dist/sszvis.js
