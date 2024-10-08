import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import path from "node:path";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";

const banner = `/*! sszvis v${pkg.version}, Copyright 2014-present Statistik Stadt Zürich */`;

const globals = {
  d3: "d3",
  topojson: "topojson",
};

const createConfig = ({ input, output, plugins }) => ({
  strictDeprecations: true,
  input,
  output,
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    nodeResolve(),
    commonjs(),
    plugins,
  ],
  external: ["d3", "topojson"],
});

export default [
  createConfig({
    input: path.join(__dirname, "src", "index.js"),
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
    input: path.join(__dirname, "src", "index.js"),
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
