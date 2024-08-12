import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { join } from "node:path";
import terser from "@rollup/plugin-terser";
<<<<<<<< HEAD:rollup.config.mjs
import pkg from "./package.json";
========
import pkg from "./package.json" assert { type: "json" };
>>>>>>>> 7ef15845 (chore: :arrow_up: upgrade rollup to v4):rollup.config.cjs

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
  ].concat(plugins),
  external: ["d3", "topojson"],
});

export default [
  createConfig({
    input: join(__dirname, "src", "index.js"),
    output: [
      {
        file: join(__dirname, "build", "sszvis.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis",
      },
    ],
  }),
  createConfig({
    input: join(__dirname, "src", "index.js"),
    output: [
      {
        file: join(__dirname, "build", "sszvis.min.js"),
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
