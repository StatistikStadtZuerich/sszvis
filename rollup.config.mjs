import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
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

const createConfig = ({ input, output, plugins }) => ({
  strictDeprecations: true,
  input,
  output,
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: false, // Rollup will handle sourcemaps
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      extensions: [".js", ".ts"],
    }),
    nodeResolve(),
    commonjs(),
    plugins,
  ],
  external: ["d3", "topojson"],
});

export default [
  createConfig({
    input: entryPoint,
    output: [
      {
        file: path.join(__dirname, "build", "sszvis.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis",
      },
    ],
  }),
  createConfig({
    input: entryPoint,
    output: [
      {
        file: path.join(__dirname, "build", "sszvis.min.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis",
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
];
