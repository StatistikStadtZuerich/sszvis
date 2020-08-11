import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { join } from "path";
import { terser } from "rollup-plugin-terser";
import { version } from "./package.json";

const banner = `/*! sszvis v${version}, Copyright 2014-present Statistik Stadt Zürich */`;

const globals = {
  d3: "d3",
  topojson: "topojson",
};

const createConfig = ({ input, output, plugins }) => ({
  input,
  output,
  moduleContext: {
    ["node_modules/whatwg-fetch/fetch.js"]: "window",
  },
  plugins: [
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
