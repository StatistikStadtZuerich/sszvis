import { join } from 'path';
import commonjs from 'rollup-plugin-commonjs';


// The main entry points are all stored in the main/ top-level directory.
const main = name => join(__dirname, '..', '..', 'main', name + '.js');

// Output files are placed into the dist/ top-level directory.
const dist = name => join(__dirname, '..', '..', 'dist', name + '.js');


// Rollup configuration of the main sszvis bundle.
export function bundle(name) {
  return {
    entry: main(name),
    plugins: [ commonjs() ],
    targets: [
      { dest: dist(name), format: 'iife' },
    ],
  };
}

// Rollup configuration of a map module.
export function bundleMap(name) {
  return {
    entry: main(name),
    plugins: [ commonjs() ],
    targets: [
      { dest: dist(name), format: 'iife' },
    ],
    external: ['sszvis'],
    globals: {
      'sszvis': 'sszvis',
    },
  };
}
