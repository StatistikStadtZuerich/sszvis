import { join } from "path";
import { uglify } from "rollup-plugin-uglify";
import { version } from "./package.json";
import babel from "rollup-plugin-babel";

const banner = `/*! sszvis v${version}, Copyright 2014-present Statistik Stadt Zürich */`;

const globals = {
  d3: "d3",
  topojson: "topojson"
};

const createConfig = ({ input, output, plugins }) => ({
  input,
  output,
  plugins: [
    babel({
      exclude: "node_modules/**"
    })
  ].concat(plugins),
  external: ["d3", "topojson"]
});

export default [
  createConfig({
    input: join(__dirname, "src", "index.js"),
    output: [
      {
        file: join(__dirname, "docs", "static", "sszvis.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis"
      }
    ]
  }),
  createConfig({
    input: join(__dirname, "src", "index.js"),
    output: [
      {
        file: join(__dirname, "docs", "static", "sszvis.min.js"),
        format: "umd",
        banner,
        globals,
        name: "sszvis"
      }
    ],
    plugins: [
      uglify({
        output: {
          comments: /^!/
        }
      })
    ]
  })
];
