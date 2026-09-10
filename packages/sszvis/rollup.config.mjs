import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { dts } from "rollup-plugin-dts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const banner = `/*! sszvis v${pkg.version}, Copyright 2014-present Statistik Stadt Zürich */`;

const globals = {
  d3: "d3",
  topojson: "topojson",
};

/**
 * Rollup bundles what `tsc` already emitted, rather than compiling the sources
 * itself.
 *
 * TypeScript 7 is the native compiler and exports no JS API, so a TS-API plugin
 * such as @rollup/plugin-typescript cannot load at all. `build:ts` runs `tsc`
 * over the same tsconfig into this staging directory first, which also removes
 * the duplicate compile the plugin used to do.
 */
const staged = path.join(__dirname, ".tsbuild");

if (!existsSync(path.join(staged, "index.js"))) {
  throw new Error(
    "rollup: .tsbuild is missing or incomplete - run `pnpm run build:ts` first (or `pnpm run build`).",
  );
}

const entryPoint = path.join(staged, "index.js");

function getStagedFiles(dir, pattern, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      getStagedFiles(fullPath, pattern, files);
    } else if (pattern.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getStagedModules(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      getStagedModules(fullPath, files);
    } else if (item.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Create input object for multi-entry build
const inputFiles = {};
for (const file of getStagedModules(staged)) {
  const key = path.relative(staged, file).replace(/\.js$/, "");
  inputFiles[key] = file;
}

const cssSource = path.join(__dirname, "src", "sszvis.css");

/**
 * sszvis.css is part of the library - consumers must load it - but it is not
 * imported by any module, so rollup would never see it. Emitting it as an asset
 * rather than copying it in a build script keeps `--watch` honest: addWatchFile
 * makes an edit to the stylesheet trigger a rebuild, so the docs dev server and
 * the regression harness pick it up like any source change.
 */
/**
 * `tsc` staged the declarations; the package's `types` entry points at
 * `build/index.d.ts`, so they have to land beside the bundled JS.
 */
const emitDeclarations = () => ({
  name: "sszvis-declarations",
  generateBundle() {
    for (const file of getStagedFiles(staged, /\.d\.ts(\.map)?$/)) {
      this.emitFile({
        type: "asset",
        fileName: path.relative(staged, file).split(path.sep).join("/"),
        source: readFileSync(file, "utf8"),
      });
    }
  },
});

const emitStylesheet = () => ({
  name: "sszvis-stylesheet",
  buildStart() {
    this.addWatchFile(cssSource);
  },
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "sszvis.css",
      source: readFileSync(cssSource, "utf8"),
    });
  },
});

const createConfig = ({ input, output, plugins = [] }) => ({
  strictDeprecations: true,
  input,
  output,
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    nodeResolve({
      preferBuiltins: false,
    }),
    commonjs(),
    ...plugins,
  ],
  external: ["d3", "topojson"],
});

export default [
  // Individual modules build (ES modules with TypeScript declarations)
  createConfig({
    input: inputFiles,
    output: {
      dir: "build",
      format: "es",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [emitStylesheet(), emitDeclarations()],
  }),

  // UMD bundle
  createConfig({
    input: entryPoint,
    output: [
      {
        file: path.join(__dirname, "build", "sszvis.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis",
        sourcemap: true,
      },
    ],
  }),

  // Minified UMD bundle
  createConfig({
    input: entryPoint,
    output: [
      {
        file: path.join(__dirname, "build", "sszvis.min.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis",
        sourcemap: true,
      },
    ],
    plugins: [
      terser({
        output: {
          comments: /^!/,
        },
      }),
    ],
  }),

  // Bundle TypeScript declarations into sszvis.d.ts
  {
    input: path.join(staged, "index.d.ts"),
    output: {
      file: path.join(__dirname, "build", "sszvis.d.ts"),
      format: "es",
    },
    plugins: [dts()],
    external: ["d3", "topojson"],
  },
];
