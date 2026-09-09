import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
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

// Determine the main entry point based on what exists
const entryPoint = existsSync(path.join(__dirname, "src", "index.ts"))
  ? path.join(__dirname, "src", "index.ts")
  : path.join(__dirname, "src", "index.js");

// Function to get all JS/TS files in src directory recursively
function getSourceFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getSourceFiles(fullPath, files);
    } else if (item.endsWith(".js") || item.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Get all source files
const sourceFiles = getSourceFiles(path.join(__dirname, "src"));

// Create input object for multi-entry build
const inputFiles = {};
for (const file of sourceFiles) {
  const relativePath = path.relative(path.join(__dirname, "src"), file);
  const key = relativePath.replace(/\.(js|ts)$/, "");
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
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: "./build",
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      extensions: [".js", ".ts"],
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
    plugins: [emitStylesheet()],
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
    input: path.join(__dirname, "build", "index.d.ts"),
    output: {
      file: path.join(__dirname, "build", "sszvis.d.ts"),
      format: "es",
    },
    plugins: [dts()],
    external: ["d3", "topojson"],
  },
];
